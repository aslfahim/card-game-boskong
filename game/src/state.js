// Tide Market — game state and the turn flow.
// One clear job: own the whole match (deck, hands, market, purses, day,
// tide, log, phase) and the rules for buying, selling, ending a day, and
// deciding the winner. Rendering and input live in their own files.

import {
  HAND_LIMIT, MARKET_SIZE, SET_SIZE, START_PURSE, TOTAL_DAYS,
} from './config.js';
import { buildDeck, drawCards, refillMarket, countByGood, setGoods } from './deck.js';
import { newPriceBoard, priceOf, sellPriceOf, drawTideEvent, arrowFor } from './market.js';
import { makeRng } from './rng.js';
import { rivalTurn, netWorth } from './ai.js';

export const PHASES = { TITLE: 'title', PLAY: 'play', OVER: 'over' };

// Start a brand-new match. The rng is seeded by the caller (clock for live
// play, the URL seed for staged screenshots) so scenes are reproducible.
export function newGame(seed) {
  const rng = makeRng(seed);
  const deck = buildDeck(rng);
  const state = {
    rng,
    seed,
    deck,
    board: newPriceBoard(),
    prevBoard: newPriceBoard(),
    market: [],
    player: { purse: START_PURSE, hand: drawCards(deck, 3) },
    rival: { purse: START_PURSE, hand: drawCards(deck, 3) },
    day: 1,
    phase: PHASES.TITLE,
    tide: null,
    tideGood: null,
    log: [],
    selected: null, // id of the player's selected hand card, or null
    stats: { bought: 0, sold: 0, earned: 0, spent: 0, setsSold: 0 },
    winner: null, // 'player' | 'rival' | 'draw'
    finalWorth: null,
  };
  refillMarket(deck, state.market);
  addLog(state, `Day 1 — the harbor opens. ${MARKET_SIZE} goods on the table.`);
  return state;
}

// Append a line to the match log (newest first, capped at 40).
export function addLog(state, text) {
  state.log.unshift({ day: state.day, text });
  if (state.log.length > 40) state.log.length = 40;
}

export function playerSets(state) {
  return setGoods(state.player.hand, SET_SIZE);
}

function inSet(state, card) {
  return countByGood(state.player.hand)[card.good] >= SET_SIZE;
}

// Buy a market card into the player's hand. Returns an error string, or null.
export function buyCard(state, cardId) {
  if (state.phase !== PHASES.PLAY) return 'The match has not started.';
  const i = state.market.findIndex((c) => c.id === cardId);
  if (i < 0) return 'That good is no longer on the table.';
  if (state.player.hand.length >= HAND_LIMIT) return `Your hand is full (${HAND_LIMIT} cards). Sell something first.`;
  const card = state.market[i];
  const cost = priceOf(state.board, card);
  if (cost > state.player.purse) return `You need ${cost} 🪙 but hold ${state.player.purse}.`;
  state.market.splice(i, 1);
  state.player.hand.push(card);
  state.player.purse -= cost;
  state.stats.bought += 1;
  state.stats.spent += cost;
  addLog(state, `You bought ${cardName(card)} for ${cost} 🪙`);
  refillMarket(state.deck, state.market);
  return null;
}

// Sell a hand card at the current market price (set bonus included).
export function sellCard(state, cardId) {
  if (state.phase !== PHASES.PLAY) return 'The match has not started.';
  const i = state.player.hand.findIndex((c) => c.id === cardId);
  if (i < 0) return 'That card is not in your hand.';
  const card = state.player.hand[i];
  const wasSet = inSet(state, card);
  const gain = sellPriceOf(state.board, card, wasSet);
  state.player.hand.splice(i, 1);
  state.player.purse += gain;
  state.stats.sold += 1;
  state.stats.earned += gain;
  if (wasSet) state.stats.setsSold += 1;
  addLog(state, `You sold ${cardName(card)} for ${gain} 🪙${wasSet ? ' (set bonus ×1.5!)' : ''}`);
  if (state.selected === cardId) state.selected = null;
  return null;
}

// End the day: Brine trades, the tide turns, the market refills. On day 8
// the match ends and the richer trader wins.
export function endDay(state) {
  if (state.phase !== PHASES.PLAY) return;
  for (const line of rivalTurn(state)) addLog(state, line);
  if (state.day >= TOTAL_DAYS) {
    finishMatch(state);
    return;
  }
  state.day += 1;
  state.prevBoard = { ...state.board };
  const tide = drawTideEvent(state.board, state.rng);
  state.tide = tide.event;
  state.tideGood = tide.hitGood;
  addLog(state, `Day ${state.day} — ${tide.event.icon} ${tide.event.name}: ${tide.event.text}`);
  refillMarket(state.deck, state.market);
}

function finishMatch(state) {
  const mine = netWorth(state.board, state.player);
  const his = netWorth(state.board, state.rival);
  state.finalWorth = { player: mine, rival: his };
  state.winner = mine > his ? 'player' : mine < his ? 'rival' : 'draw';
  state.phase = PHASES.OVER;
  const verdict = state.winner === 'player'
    ? `You out-traded Brine, ${mine} to ${his}!`
    : state.winner === 'rival'
      ? `Brine out-traded you, ${his} to ${mine}.`
      : `A dead heat at ${mine} — the harbor keeps both purses.`;
  addLog(state, `Final whistle — ${verdict}`);
}

// Price arrows for the board: compare today's multipliers with yesterday's.
export function boardArrows(state) {
  const out = {};
  for (const good of Object.keys(state.board)) {
    out[good] = arrowFor(state.prevBoard[good], state.board[good]);
  }
  return out;
}

export function cardName(card) {
  return `${{ spice: 'Spice', silk: 'Silk', tea: 'Tea', pearl: 'Pearl' }[card.good]} ${card.value}`;
}
