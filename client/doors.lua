-- Runtime identity check (editable source; not an additional license condition).
if type(GetCurrentResourceName) == 'function' and GetCurrentResourceName() ~= 'zloma_apartments' then
    error('[zloma_apartments] Resource must be named "zloma_apartments". Rename the folder and use ensure zloma_apartments.', 0)
end

-- Native door locks, 3D prompt and keybinds for every loaded building.
-- A door is bound only to an existing object of the right model at the
-- floor's height, so a reused entity handle never links room 101 to 201.
local doors, byKey = {}, {}
local locked, occupied = {}, {}
local access = {}
local current, busy = nil, false

function CanAccessApartmentSafe(key) return occupied[key] == true end
local function doorKey(hotel, number) return ('%s:%d'):format(hotel, number) end

local function drawText3D(coords, text)
    local onScreen, x, y = World3dToScreen2d(coords.x, coords.y, coords.z)
    if not onScreen then return end
    SetTextScale(0.35, 0.35)
    SetTextFont(4)
    SetTextProportional(true)
    SetTextColour(255, 255, 255, 215)
    SetTextCentre(true)
    SetTextOutline()
    BeginTextCommandDisplayText('STRING')
    AddTextComponentSubstringPlayerName(text)
    EndTextCommandDisplayText(x, y)
end

local function floorLoaded(door) return not door.ipl or IsIplActive(door.ipl) end

local function matches(door, entity)
    if not door.model or not entity or entity == 0 or not DoesEntityExist(entity) or not floorLoaded(door) then return false end
    if (GetEntityModel(entity) & 0xffffffff) ~= (door.model & 0xffffffff) then return false end
    local c = GetEntityCoords(entity)
    local dx, dy = c.x - door.coords.x, c.y - door.coords.y
    return dx * dx + dy * dy <= Config.Doors.SearchRadius ^ 2 and c.z >= door.floorZ - 0.25 and c.z < door.floorZ + 2.75
end

local function release(door)
    if door.frozen and matches(door, door.entity) then FreezeEntityPosition(door.entity, false) end
    if door.registered then RemoveDoorFromSystem(door.id) end
    door.entity, door.registered, door.frozen, door.applied, door.physics = nil, false, false, nil, false
end

local function shouldLock(door) return not occupied[door.key] or locked[door.key] ~= false end

local function apply(door, force)
    if not door.registered or not matches(door, door.entity) then return end
    local isLocked = shouldLock(door)
    local state = isLocked and 1 or 0
    if not DoorSystemGetIsPhysicsLoaded(door.id) then
        -- Lock states apply only once door physics loads; hold it shut meanwhile.
        if isLocked ~= door.frozen then FreezeEntityPosition(door.entity, isLocked); door.frozen = isLocked end
        door.applied, door.physics = nil, false
        return
    end
    if force or not door.physics or door.applied ~= state or DoorSystemGetDoorState(door.id) ~= state then
        DoorSystemSetDoorState(door.id, 4, false, true)
        if isLocked then DoorSystemSetOpenRatio(door.id, 0.0, false, true) end
        DoorSystemSetDoorState(door.id, state, false, true)
        door.applied = state
    end
    door.physics = true
    if door.frozen then FreezeEntityPosition(door.entity, false); door.frozen = false end
end

local function bind(door)
    if door.registered and matches(door, door.entity) then return true end
    if door.registered or door.entity then release(door) end
    if not door.model or not floorLoaded(door) or not IsModelValid(door.model) then return false end
    local c = door.coords
    local entity = GetClosestObjectOfType(c.x, c.y, c.z, Config.Doors.SearchRadius, door.model, false, false, false)
    if not matches(door, entity) then return false end
    local p = GetEntityCoords(entity)
    RemoveDoorFromSystem(door.id)
    AddDoorToSystem(door.id, door.model, p.x, p.y, p.z, false, false, false)
    door.entity, door.registered = entity, true
    DoorSystemSetAutomaticRate(door.id, 10.0, false, false)
    apply(door, true)
    return true
end

local function modelHash(value)
    if type(value) == 'string' then return joaat(value) end
    return value
end

local function rebuild(hotels)
    for _, door in ipairs(doors) do release(door) end
    doors, byKey, current = {}, {}, nil
    for id, def in pairs(hotels) do
        Hotels.each(def, function(number)
            local room = Hotels.room(def, number)
            local key = doorKey(id, number)
            local door = {
                key = key, hotel = id, number = number, id = joaat('zloma_apt_' .. key),
                model = modelHash(room.model), coords = ToVec3(room.door), floorZ = room.floorZ, ipl = room.ipl,
            }
            doors[#doors + 1] = door
            byKey[key] = door
        end)
    end
end
OnHotelsChanged(rebuild)

local function setDoor(key, isLocked, isOccupied)
    locked[key] = isLocked
    occupied[key] = isOccupied
    local door = byKey[key]
    if door and bind(door) then apply(door, true) end
end

RegisterNetEvent('zloma_apartments:client:door', function(key, isLocked, isOccupied)
    setDoor(key, isLocked == true, isOccupied == true)
end)

RegisterNetEvent('zloma_apartments:client:doors', function(states)
    locked, occupied = {}, {}
    for key, value in pairs(states or {}) do locked[key] = value; occupied[key] = true end
    for _, door in ipairs(doors) do if door.registered then apply(door, true) end end
end)

function RefreshDoorAccess()
    local ok, data = pcall(lib.callback.await, 'zloma_apartments:getAccess', false)
    if not ok or not data then return end
    access = data.control or {}
    locked, occupied = {}, {}
    for key, value in pairs(data.doors or {}) do locked[key] = value; occupied[key] = true end
end
RegisterNetEvent('zloma_apartments:client:refreshAccess', RefreshDoorAccess)

CreateThread(function()
    while not ClientState.ready do Wait(500) end
    for key, value in pairs(ClientState.doors) do locked[key] = value; occupied[key] = true end
    while true do
        RefreshDoorAccess()
        Wait(30000)
    end
end)

-- The patched WiWang map announces floor swaps; without the patch the loops below catch up within 100 ms.
AddEventHandler('wiwang_hotel:floorUnloading', function()
    current = nil
    for _, door in ipairs(doors) do release(door) end
end)

-- Prompt + closest door.
CreateThread(function()
    while true do
        local sleep = 350
        local ped = GetEntityCoords(PlayerPedId())
        local best, bestDistance
        for i = 1, #doors do
            local door = doors[i]
            if occupied[door.key] then
                local d = #(ped - door.coords)
                if d <= Config.Doors.InteractDistance and floorLoaded(door) and (not bestDistance or d < bestDistance)
                    and (not door.model or matches(door, door.entity) or bind(door)) then
                    best, bestDistance = door, d
                end
            end
        end
        current = best
        if current then
            sleep = 0
            local textCoords = current.coords + vec3(0.0, 0.0, 0.25)
            if current.entity and DoesEntityExist(current.entity) then
                local min, max = GetModelDimensions(current.model)
                textCoords = GetOffsetFromEntityInWorldCoords(current.entity, (min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2)
            end
            local text = _L('prompt_doorbell', Config.Doors.BellKey)
            if access[current.key] then
                text = _L(shouldLock(current) and 'prompt_unlock' or 'prompt_lock', Config.Doors.LockKey) .. '\n' .. text
            end
            -- Config.Debug: residents see the break-in options on their own door too.
            if shouldLock(current) and (not access[current.key] or Config.Debug) then
                local opts = LockpickOptions('door', current.hotel, current.number)
                if opts.lockpick then text = text .. '\n' .. _L('prompt_lockpick', Config.Doors.Lockpick.Key) end
                if opts.hack then text = text .. '\n' .. _L('prompt_hack', (Config.Security.Alarm or {}).Key or 'J') end
            end
            drawText3D(textCoords, text)
        end
        Wait(sleep)
    end
end)

-- The door the player stands at, for lockpicking: door, hasAccess, isLocked.
function CurrentApartmentDoor()
    if not current then return nil end
    return current, access[current.key] == true, shouldLock(current)
end

-- Keeps nearby doors in their server state.
CreateThread(function()
    while true do
        local ped = GetEntityCoords(PlayerPedId())
        local nearby = false
        for i = 1, #doors do
            local door = doors[i]
            if #(ped - door.coords) <= Config.Doors.EnforceRadius then
                nearby = true
                if bind(door) then apply(door) end
            elseif door.registered then
                release(door)
            end
        end
        Wait(nearby and Config.Doors.EnforceInterval or 1000)
    end
end)

RegisterCommand('+zloma_apt_door', function()
    local door = current
    if not door or not access[door.key] or busy then return end
    busy = true
    local result = lib.callback.await('zloma_apartments:useDoor', false, { hotel_id = door.hotel, room_number = door.number, action = 'toggle' })
    if result and result.success then
        locked[door.key] = result.locked == true
        apply(door, true)
        lib.requestAnimDict('anim@heists@keycard@')
        TaskPlayAnim(PlayerPedId(), 'anim@heists@keycard@', 'exit', 8.0, 1.0, -1, 16, 0, false, false, false)
        Wait(800)
        ClearPedTasks(PlayerPedId())
        RemoveAnimDict('anim@heists@keycard@')
    elseif result and result.error then
        ClientBridge.notify(result.error, 'error')
    end
    busy = false
end, false)
RegisterCommand('-zloma_apt_door', function() end, false)
RegisterKeyMapping('+zloma_apt_door', _L('keybind_door'), 'keyboard', Config.Doors.LockKey)

RegisterCommand('+zloma_apt_bell', function()
    local door = current
    if not door then return end
    local result = lib.callback.await('zloma_apartments:ringDoorbell', false, { hotel_id = door.hotel, room_number = door.number })
    if not result or not result.success then return end
    lib.requestAnimDict('timetable@jimmy@doorknock@')
    TaskPlayAnim(PlayerPedId(), 'timetable@jimmy@doorknock@', 'knockdoor_idle', 8.0, 1.0, -1, 16, 0, false, false, false)
    Wait(1500)
    ClearPedTasks(PlayerPedId())
    RemoveAnimDict('timetable@jimmy@doorknock@')
end, false)
RegisterCommand('-zloma_apt_bell', function() end, false)
RegisterKeyMapping('+zloma_apt_bell', _L('keybind_bell'), 'keyboard', Config.Doors.BellKey)

RegisterNetEvent('zloma_apartments:client:doorbell', function()
    PlaySoundFrontend(-1, Config.Doorbell.Sound, Config.Doorbell.SoundSet, true)
end)

-- Used by the evicted handler: is the player standing inside this room?
function IsInsideRoom(hotelId, number)
    local def = ClientState.hotels[hotelId]
    local room = def and Hotels.room(def, number)
    if not room then return false end
    local p = GetEntityCoords(PlayerPedId())
    return #(p - ToVec3(room.door)) < 8.0 and math.abs(p.z - room.floorZ) < 2.5
end

AddEventHandler('onResourceStop', function(name)
    if name ~= GetCurrentResourceName() then return end
    for _, door in ipairs(doors) do release(door) end
end)
