// Tide Market — the goods deck.
// One clear job: build the 40-card deck, deal opening hands, and draw the
// daily market row. Cards are plain data; rendering lives in render.js.

import { DECK_VALUES, GOOD_KEYS, MARKET_SIZE } from './config.js';
import { shuffle } from './rng.js';

let nextCardId = 1;

// Build a fresh 40-card deck: ten cards per good, values from DECK_VALUES.
export function buildDeck(rng) {
  const cards = [];
  for (const good of GOOD_KEYS) {
    for (const value of DECK_VALUES) {
      cards.push({ id: nextCardId, good, value });
      nextCardId += 1;
    }
  }
  return shuffle(cards, rng);
}

// Draw n cards from the front of the deck (mutates the deck array).
export function drawCards(deck, n) {
  return deck.splice(0, n);
}

// Refill the market row to MARKET_SIZE cards from the deck.
export function refillMarket(deck, market) {
  while (market.length < MARKET_SIZE && deck.length > 0) {
    market.push(deck.shift());
  }
  return market;
}

// Count how many cards of each good a hand holds.
export function countByGood(hand) {
  const counts = { spice: 0, silk: 0, tea: 0, pearl: 0 };
  for (const card of hand) counts[card.good] += 1;
  return counts;
}

// The goods in this hand that currently form a set (SET_SIZE or more).
export function setGoods(hand, setSize) {
  const counts = countByGood(hand);
  return GOOD_KEYS.filter((good) => counts[good] >= setSize);
}
