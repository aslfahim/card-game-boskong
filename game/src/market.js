// Tide Market — the tide and the price board.
// One clear job: hold one price multiplier per good, move it with the daily
// tide event, and price every buy and sell from it.

import { GOOD_KEYS, MULT_STEPS, MULT_START_INDEX, TIDE_EVENTS } from './config.js';
import { pickOne } from './rng.js';

// A fresh price board: every good opens at 1.0x.
export function newPriceBoard() {
  const board = {};
  for (const good of GOOD_KEYS) board[good] = MULT_START_INDEX;
  return board;
}

export function multiplierOf(board, good) {
  return MULT_STEPS[board[good]];
}

// Clamp a step index into the MULT_STEPS range.
function clampStep(i) {
  return Math.max(0, Math.min(MULT_STEPS.length - 1, i));
}

// The price of a card right now: value x the good's multiplier, rounded.
export function priceOf(board, card) {
  return Math.max(1, Math.round(card.value * multiplierOf(board, card.good)));
}

// The sell price of a card, with the set bonus applied when it holds.
export function sellPriceOf(board, card, inSet) {
  const base = priceOf(board, card);
  return inSet ? Math.round(base * 1.5) : base;
}

// Arrow shown beside a good: did its price rise, fall, or hold since yesterday?
export function arrowFor(previous, current) {
  if (current > previous) return '▲';
  if (current < previous) return '▼';
  return '–';
}

// Draw the morning tide event and move the board. Returns the event plus the
// good it hit (for surge / festival), so the log can name it.
export function drawTideEvent(board, rng) {
  const keys = ['calm', 'surge', 'storm', 'boom', 'festival'];
  const key = pickOne(keys, rng);
  const event = TIDE_EVENTS[key];
  let hitGood = null;
  if (key === 'surge' || key === 'festival') {
    hitGood = pickOne(GOOD_KEYS, rng);
    board[hitGood] = clampStep(board[hitGood] + (key === 'festival' ? 3 : 2));
  } else if (key === 'storm') {
    for (const good of GOOD_KEYS) board[good] = clampStep(board[good] - 1);
  } else if (key === 'boom') {
    for (const good of GOOD_KEYS) board[good] = clampStep(board[good] + 1);
  }
  return { event, hitGood };
}

// A good's price trend for the AI: how far its multiplier sits from 1.0x.
export function bargainScore(board, card) {
  return priceOf(board, card) / card.value;
}
