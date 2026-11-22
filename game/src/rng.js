// Tide Market — seeded random numbers.
// One clear job: deterministic randomness. Live games seed from the clock;
// screenshot scenes seed from the URL, so a staged table renders identically
// every time it is opened.

// Mulberry32: small, fast, and good enough for shuffling a 40-card deck.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Fisher-Yates shuffle driven by the given rng; returns a new array.
export function shuffle(deck, rng) {
  const out = deck.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i];
    out[i] = out[j];
    out[j] = tmp;
  }
  return out;
}

// Pick one element of an array with the given rng.
export function pickOne(list, rng) {
  return list[Math.floor(rng() * list.length)];
}

// Read a ?seed=N query param; fall back to a clock seed for live play.
export function seedFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('seed');
  const n = raw === null ? NaN : Number.parseInt(raw, 10);
  if (Number.isFinite(n)) return n >>> 0;
  return (Date.now() % 2147483647) >>> 0;
}
