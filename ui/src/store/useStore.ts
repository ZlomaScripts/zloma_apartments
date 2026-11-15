import { assertResourceName } from '@/resourceName';
assertResourceName();

import { create } from 'zustand';
import { Room, MyApartment, TabId, ApartmentTabId, FilterStatus, SortBy, HotelInfo, SafeUpgrade, Features, OpenPayload } from '@/types';

interface AppState {
  isOpen: boolean;
  activeTab: TabId;
  activeApartmentTab: ApartmentTabId;
  hotel: HotelInfo | null;
  rooms: Room[];
  myApartment: MyApartment | null;
  playerMoney: number;
  playerName: string;
  safeUpgrades: Record<string, SafeUpgrade>;
  features: Features;
  bookingRoom: Room | null;
  filterStatus: FilterStatus;
  filterFloor: number | null;
  searchQuery: string;
  sortBy: SortBy;
  currentPage: number;

  open: (data: OpenPayload) => void;
  close: () => void;
  setActiveTab: (tab: TabId) => void;
  setActiveApartmentTab: (tab: ApartmentTabId) => void;
  setMyApartment: (apt: MyApartment | null) => void;
  setPlayerMoney: (money: number) => void;
  setBookingRoom: (room: Room | null) => void;
  setFilter: <K extends 'filterStatus' | 'filterFloor' | 'searchQuery' | 'sortBy'>(key: K, value: AppState[K]) => void;
  setPage: (page: number) => void;
  setRoomStatus: (roomNumber: number, status: Room['status']) => void;
}

const filters = { filterStatus: 'all' as FilterStatus, filterFloor: null, searchQuery: '', sortBy: 'room_asc' as SortBy, currentPage: 1 };

export const useStore = create<AppState>((set) => ({
  isOpen: false,
  activeTab: 'browse',
  activeApartmentTab: 'overview',
  hotel: null,
  rooms: [],
  myApartment: null,
  playerMoney: 0,
  playerName: '',
  safeUpgrades: {},
  features: { roommates: true, safe: true, roommateDistance: 10, pinLength: 4 },
  bookingRoom: null,
  ...filters,

  open: (data) => set({
    isOpen: true,
    hotel: data.hotel,
    rooms: data.rooms || [],
    myApartment: data.myApartment || null,
    playerMoney: data.playerMoney || 0,
    playerName: data.playerName || '',
    safeUpgrades: data.safeUpgrades || {},
    features: data.features,
    activeTab: data.myApartment ? 'myApartment' : 'browse',
    activeApartmentTab: 'overview',
    bookingRoom: null,
    ...filters,
  }),
  close: () => set({ isOpen: false, bookingRoom: null }),
  setActiveTab: (tab) => set({ activeTab: tab, bookingRoom: null }),
  setActiveApartmentTab: (tab) => set({ activeApartmentTab: tab }),
  setMyApartment: (apt) => set({ myApartment: apt }),
  setPlayerMoney: (money) => set({ playerMoney: Math.max(0, money) }),
  setBookingRoom: (room) => set({ bookingRoom: room }),
  setFilter: (key, value) => set({ [key]: value, currentPage: 1 } as Partial<AppState>),
  setPage: (page) => set({ currentPage: page }),
  setRoomStatus: (roomNumber, status) => set((state) => ({
    rooms: state.rooms.map(r => r.room_number === roomNumber ? { ...r, status } : r),
  })),
}));
