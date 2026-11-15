import { assertResourceName } from '@/resourceName';
assertResourceName();

// Door lockpick sounds (TR Scripts, CC0 recordings from freesound.org, see
// public/sounds/doorpick/CREDITS.txt). Lua sends 'doorpick:sound' / 'doorpick:loop'.
const FILES: Record<string, string[]> = {
  lp_insert: ['lp_insert.wav'],
  lp_remove: ['lp_remove.wav'],
  lp_lever: ['lp_lever-1.wav', 'lp_lever-2.wav', 'lp_lever-3.wav'],
  lp_shutter: ['lp_shutter.wav'],
  lp_tension: ['lp_tension.wav'],
  lp_detent: ['lp_detent-1.wav', 'lp_detent-2.wav', 'lp_detent-3.wav', 'lp_detent-4.wav'],
  lp_spring: ['lp_spring-1.wav', 'lp_spring-2.wav', 'lp_spring-3.wav', 'lp_spring-4.wav', 'lp_spring-5.wav', 'lp_spring-6.wav'],
  lp_set: ['lp_set-1.wav', 'lp_set-2.wav', 'lp_set-3.wav', 'lp_set-4.wav', 'lp_set-5.wav', 'lp_set-6.wav', 'lp_set-7.wav', 'lp_set-8.wav'],
  lp_overset: ['lp_overset.wav'],
  lp_drop: ['lp_drop.wav'],
  lp_bend: ['lp_bend-1.wav', 'lp_bend-2.wav'],
  lp_snap: ['lp_snap-1.wav', 'lp_snap-2.wav', 'lp_snap-3.wav'],
  lp_unlock: ['lp_unlock.wav'],
  lp_scrape: ['lp_scrape.wav'],
};

// Loudness of each sound, and how much its pitch varies, as in tr_minigames.
const GAIN: Record<string, number> = {
  lp_insert: 0.6, lp_remove: 0.55, lp_lever: 0.35, lp_shutter: 0.4, lp_tension: 0.4, lp_detent: 0.25,
  lp_spring: 0.22, lp_set: 0.6, lp_overset: 0.5, lp_drop: 0.5, lp_bend: 0.6, lp_snap: 0.75, lp_unlock: 0.8, lp_scrape: 0.2,
};
const VARY: Record<string, number> = {
  lp_lever: 0.04, lp_tension: 0.04, lp_detent: 0.06, lp_spring: 0.08, lp_set: 0.05, lp_drop: 0.05, lp_bend: 0.05, lp_snap: 0.04,
};

let ctx: AudioContext | null = null;
let out: GainNode | null = null;
const buffers: Record<string, AudioBuffer[]> = {};
let loading: Promise<void> | null = null;

function audio() {
  if (!ctx) {
    ctx = new AudioContext();
    out = ctx.createGain();
    out.connect(ctx.destination);
  }
  return { ac: ctx, master: out! };
}

function load(): Promise<void> {
  const { ac } = audio();
  loading ??= Promise.all(Object.entries(FILES).map(async ([name, files]) => {
    buffers[name] = (await Promise.all(files.map(async (file) => {
      try {
        const res = await fetch(`./sounds/doorpick/${file}`);
        return await ac.decodeAudioData(await res.arrayBuffer());
      } catch {
        return null;
      }
    }))).filter((b): b is AudioBuffer => b !== null);
  })).then(() => undefined);
  return loading;
}

function pick(name: string) {
  const list = buffers[name];
  return list?.length ? list[Math.floor(Math.random() * list.length)] : undefined;
}

export async function playSound(name: string, volume = 0.8) {
  await load();
  const { ac, master } = audio();
  const buffer = pick(name);
  if (!buffer) return;
  master.gain.value = volume;
  const source = ac.createBufferSource();
  source.buffer = buffer;
  const vary = VARY[name] ?? 0;
  if (vary) source.playbackRate.value = 1 + (Math.random() * 2 - 1) * vary;
  const gain = ac.createGain();
  gain.gain.value = GAIN[name] ?? 0.7;
  source.connect(gain).connect(master);
  source.start();
}

type Loop = { source: AudioBufferSourceNode; gain: GainNode };
const loops: Record<string, Loop> = {};

export async function setLoop(id: string, name: string, params: { level?: number }, volume = 0.8) {
  await load();
  const { ac, master } = audio();
  master.gain.value = volume;
  let loop = loops[id];
  if (!loop) {
    const buffer = pick(name);
    if (!buffer) return;
    const source = ac.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = ac.createGain();
    gain.gain.value = 0;
    source.connect(gain).connect(master);
    source.start(ac.currentTime, Math.random() * buffer.duration);
    loop = loops[id] = { source, gain };
  }
  // lp_scrape: louder and a little higher the faster the wafer moves
  const level = Math.max(0, Math.min(1, Number(params.level ?? 1)));
  const now = ac.currentTime;
  loop.gain.gain.setTargetAtTime((GAIN[name] ?? 0.5) * (0.3 + 0.7 * level), now, 0.05);
  loop.source.playbackRate.setTargetAtTime(0.92 + 0.16 * level, now, 0.08);
}

export function stopLoop(id: string) {
  const loop = loops[id];
  if (!loop || !ctx) return;
  delete loops[id];
  loop.gain.gain.cancelScheduledValues(ctx.currentTime);
  loop.gain.gain.setTargetAtTime(0, ctx.currentTime, 0.04);
  loop.source.stop(ctx.currentTime + 0.3);
}
