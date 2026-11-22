// Tide Market — tiny synthesized sounds.
// One clear job: every blip and jingle, made with WebAudio oscillators only.
// No audio files, no network. Sound starts only after a user gesture.

let ctx = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

// Lazily create the audio context on the first sound (a user gesture).
function audio() {
  if (muted) return null;
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function blip(freq, at, dur, type = 'sine', vol = 0.12) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(vol, ac.currentTime + at);
  gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + at + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(ac.currentTime + at);
  osc.stop(ac.currentTime + at + dur + 0.02);
}

export const sfx = {
  // A coin changing hands: two bright ticks.
  coin() { blip(1320, 0, 0.09); blip(1760, 0.07, 0.12); },
  // A card sliding across the table.
  slide() { blip(520, 0, 0.08, 'triangle', 0.08); blip(660, 0.05, 0.08, 'triangle', 0.06); },
  // A card flipping over.
  flip() { blip(880, 0, 0.06, 'square', 0.04); },
  // A soft error thud for a refused move.
  denied() { blip(180, 0, 0.16, 'sawtooth', 0.07); },
  // The morning bell: a new day begins.
  bell() { blip(660, 0, 0.25); blip(990, 0.12, 0.3); },
  // The win flourish: a rising arpeggio.
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => blip(f, i * 0.11, 0.28, 'triangle', 0.12)); },
  // The loss sigh: a falling line.
  lose() { [392, 330, 262, 196].forEach((f, i) => blip(f, i * 0.16, 0.3, 'sine', 0.1)); },
};
