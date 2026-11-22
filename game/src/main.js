// Tide Market — bootstrap and scene staging.
// One clear job: start the match, wire input to rendering, and stage the
// four screenshot scenes (?scene=title|play|win|loss&seed=N) as real renders
// of the game's own code — the same state machine live play uses.

import { TOTAL_DAYS } from './config.js';
import { priceOf } from './market.js';
import { newGame, buyCard, sellCard, endDay, addLog, PHASES } from './state.js';
import { renderAll, toast } from './render.js';
import { bindInput } from './input.js';
import { seedFromUrl } from './rng.js';
import { sfx } from './sound.js';

let state = null;
let bound = false;

function rerender() {
  renderAll(state);
}

const hooks = {
  rerender,
  toast,
  showHelp(open = true) {
    document.getElementById('help-screen').classList.toggle('hidden', !open);
  },
  startMatch() {
    state.phase = PHASES.PLAY;
    sfx.slide();
    rerender();
  },
  playAgain() {
    startFresh(seedFromUrl());
  },
};

function bindOnce() {
  if (bound) return;
  bound = true;
  bindInput(() => stateRef.current, hooks);
}

// The input handlers read the live state through this shared reference, so
// starting a new match never needs a second round of listeners.
const stateRef = { current: null };

function startFresh(seed) {
  state = newGame(seed);
  bindOnce();
  stateRef.current = state;
  rerender();
}

// A decent auto-player used only to stage the win/loss screenshots: it buys
// cheap (at or below par), sells into dear prices, and liquidates on the
// final day — the same rules a human plays by, so the staged end screens
// show a match that was really won or lost.
function autoPlay(state) {
  while (state.phase === PHASES.PLAY) {
    const lastDay = state.day === TOTAL_DAYS;
    // Sell: any card whose good is dear, or everything on the final day.
    for (const card of [...state.player.hand]) {
      const counts = {};
      for (const c of state.player.hand) counts[c.good] = (counts[c.good] || 0) + 1;
      const inSet = (counts[card.good] || 0) >= 3;
      const dear = state.board[card.good] >= 4 || (inSet && state.board[card.good] >= 3);
      if (lastDay || dear) sellCard(state, card.id);
    }
    // Buy: the cheapest market cards (lowest price per value) at or below par.
    while (state.player.hand.length < 6) {
      const cheap = state.market
        .map((c) => ({ c, cost: priceOf(state.board, c) }))
        .filter((e) => e.cost / e.c.value <= 1.0 && e.cost <= state.player.purse)
        .sort((a, b) => (a.cost / a.c.value) - (b.cost / b.c.value) || b.c.value - a.c.value)[0];
      if (!cheap) break;
      buyCard(state, cheap.c.id);
    }
    endDay(state);
  }
  return state;
}

// Play full auto games from successive seeds until one ends with the wanted
// winner. Deterministic for a given base seed, and the staged end screen
// then shows a match that was honestly won or lost.
function stageEndScene(wantWinner, baseSeed) {
  for (let tries = 0; tries < 200; tries += 1) {
    const candidate = newGame(baseSeed + tries);
    candidate.phase = PHASES.PLAY;
    autoPlay(candidate);
    if (candidate.winner === wantWinner) return candidate;
  }
  // Fallback: the base seed's own game, whatever its outcome.
  const fallback = newGame(baseSeed);
  fallback.phase = PHASES.PLAY;
  autoPlay(fallback);
  return fallback;
}
function stageScene(scene, seed) {
  if (scene === 'title') {
    state = newGame(seed);
    state.phase = PHASES.TITLE;
    return;
  }
  if (scene === 'play') {
    state = newGame(seed);
    state.phase = PHASES.PLAY;
    // A lived-in mid-match table: buy two, sell one, play into day 3.
    const first = state.market[0];
    if (first) buyCard(state, first.id);
    const second = state.market[0];
    if (second) buyCard(state, second.id);
    if (state.player.hand.length > 3) sellCard(state, state.player.hand[0].id);
    endDay(state);
    endDay(state);
    state.selected = state.player.hand.length ? state.player.hand[0].id : null;
    return;
  }
  if (scene === 'win') {
    state = stageEndScene('player', seed);
    return;
  }
  if (scene === 'loss') {
    state = stageEndScene('rival', seed);
    return;
  }
  state = newGame(seed);
}

// Boot: read ?scene= / ?shot= and ?seed=, build the state, render once.
function boot() {
  const params = new URLSearchParams(window.location.search);
  const scene = params.get('scene') || params.get('shot') || 'title';
  const seed = seedFromUrl();
  if (['title', 'play', 'win', 'loss'].includes(scene)) {
    stageScene(scene, seed);
  } else {
    state = newGame(seed);
  }
  stateRef.current = state;
  bindOnce();
  renderAll(state);
  // Expose the live state for play-testing from the console and CDP.
  window.__tideMarket = { get state() { return stateRef.current; }, endDay: () => endDay(stateRef.current) };
}

document.addEventListener('DOMContentLoaded', boot);
