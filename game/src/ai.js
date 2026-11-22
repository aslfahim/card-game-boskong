// Tide Market — the rival trader.
// One clear job: Capt. Brine's brain. It plays the same market the player
// sees, with rules the player can read and counter: it buys the cheapest
// goods, sells into high prices, and hoards sets it will cash in later.

import { HAND_LIMIT, SET_BONUS, SET_SIZE } from './config.js';
import { priceOf, sellPriceOf } from './market.js';
import { countByGood } from './deck.js';

// Brine takes one turn at the end of each day. Every move is returned as a
// log line so the player can watch his plan unfold and play around it.
export function rivalTurn(state) {
  const moves = [];
  const { board, market, rival } = state;
  const counts = countByGood(rival.hand);

  // 1) Sell: cash in any card whose good is dear (1.5x or more). A set card
  //    pays the bonus, so a set at 1.25x is already worth selling.
  const sellable = rival.hand
    .map((card) => ({ card, gain: sellPriceOf(board, card, counts[card.good] >= SET_SIZE) }))
    .filter((entry) => {
      const mult = board[entry.card.good];
      return mult >= 4 || (counts[entry.card.good] >= SET_SIZE && mult >= 3);
    })
    .sort((a, b) => b.gain - a.gain);
  for (const entry of sellable.slice(0, 2)) {
    const i = rival.hand.indexOf(entry.card);
    if (i < 0) continue;
    rival.hand.splice(i, 1);
    rival.purse += entry.gain;
    moves.push(`Brine sold ${goodName(entry.card)} ${entry.card.value} for ${entry.gain} 🪙`);
  }

  // 2) Buy: take the cheapest market cards (lowest price per value) while
  //    the good is at or below par and his purse and hand allow it.
  const affordable = market
    .map((card) => ({ card, cost: priceOf(board, card), ratio: priceOf(board, card) / card.value }))
    .filter((entry) => entry.ratio <= 1.0 && entry.cost <= rival.purse)
    .sort((a, b) => a.ratio - b.ratio || b.card.value - a.card.value);
  for (const entry of affordable.slice(0, 2)) {
    if (rival.hand.length >= HAND_LIMIT) break;
    const i = market.indexOf(entry.card);
    if (i < 0 || entry.cost > rival.purse) continue;
    market.splice(i, 1);
    rival.hand.push(entry.card);
    rival.purse -= entry.cost;
    moves.push(`Brine bought ${goodName(entry.card)} ${entry.card.value} for ${entry.cost} 🪙`);
  }

  // 3) Hoard note: when he sits on a set, the log warns the player.
  const freshCounts = countByGood(rival.hand);
  for (const good of Object.keys(freshCounts)) {
    if (freshCounts[good] >= SET_SIZE) {
      moves.push(`Brine is hoarding ${goodName({ good })} — a set of ${freshCounts[good]}!`);
      break;
    }
  }
  if (moves.length === 0) moves.push('Brine studied the tide and held his coins.');
  return moves;
}

// Short display name for a card's good, used in the log.
function goodName(card) {
  return { spice: 'Spice', silk: 'Silk', tea: 'Tea', pearl: 'Pearl' }[card.good] || card.good;
}

// Net worth at the final whistle: purse plus hand value at current prices,
// with the set bonus on set cards (the same math the player is scored by).
export function netWorth(board, trader) {
  const counts = countByGood(trader.hand);
  let worth = trader.purse;
  for (const card of trader.hand) {
    worth += sellPriceOf(board, card, counts[card.good] >= SET_SIZE);
  }
  return worth;
}

// A one-line read on Brine's plan, shown under his hand so the player can
// counter it: what he is buying, and which good he is hoarding.
export function rivalTell(state) {
  const counts = countByGood(state.rival.hand);
  const hoard = Object.keys(counts).find((good) => counts[good] >= SET_SIZE);
  if (hoard) return `Hoarding ${hoard} — sell yours before he floods it.`;
  const cheapest = [...state.market].sort((a, b) => priceOf(state.board, a) - priceOf(state.board, b))[0];
  if (cheapest) return `Eyeing the cheapest ${cheapest.good} on the table.`;
  return 'Waiting for the tide to turn.';
}
