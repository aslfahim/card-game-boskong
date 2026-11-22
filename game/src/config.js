// Tide Market — game configuration.
// One clear job: every tunable number, good, and tide event lives here so the
// rest of the game reads rules from this file instead of hard-coding them.

export const GAME_TITLE = 'Tide Market';
export const GAME_SUBTITLE = 'A merchant trading card game of the harbor';
export const TOTAL_DAYS = 8;
export const START_PURSE = 100;
export const HAND_LIMIT = 7;
export const MARKET_SIZE = 4;
export const SET_SIZE = 3; // holding this many of one good unlocks the set bonus
export const SET_BONUS = 1.5; // selling a set card pays 1.5x the market price
export const RIVAL_NAME = 'Capt. Brine';
export const PLAYER_NAME = 'You';

// The four trade goods. A good is told apart by colour AND shape, never text
// alone: each has its own colour, glyph, and shape class for the card face.
export const GOODS = {
  spice: { key: 'spice', name: 'Ember Spice', short: 'Spice', color: '#e5484d', dark: '#8f1d21', glyph: '◆', shape: 'diamond' },
  silk: { key: 'silk', name: 'Moon Silk', short: 'Silk', color: '#8b5cf6', dark: '#4c1d95', glyph: '●', shape: 'circle' },
  tea: { key: 'tea', name: 'Jade Tea', short: 'Tea', color: '#2f9e44', dark: '#14532d', glyph: '▲', shape: 'triangle' },
  pearl: { key: 'pearl', name: 'Tide Pearl', short: 'Pearl', color: '#1971c2', dark: '#0b3d66', glyph: '■', shape: 'square' },
};
export const GOOD_KEYS = ['spice', 'silk', 'tea', 'pearl'];

// One good's deck: ten cards, values 2..10 with a double 9 (the workhorse).
export const DECK_VALUES = [2, 3, 4, 5, 6, 7, 8, 9, 9, 10];

// Price multipliers the tide can set for a good. The tide moves in steps.
export const MULT_STEPS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
export const MULT_START_INDEX = 2; // every good opens at 1.0x

// One tide event is drawn each morning and moves the market before trading.
export const TIDE_EVENTS = {
  calm: { key: 'calm', name: 'Calm Seas', text: 'Prices hold steady today.', icon: '☀' },
  surge: { key: 'surge', name: 'Surge', text: 'One good rides a wave: its price jumps.', icon: '🌊' },
  storm: { key: 'storm', name: 'Storm', text: 'A squall hits the harbor: every price dips.', icon: '⛈' },
  boom: { key: 'boom', name: 'Harbor Boom', text: 'Buyers flood the docks: every price climbs.', icon: '⚓' },
  festival: { key: 'festival', name: 'Spice Festival', text: 'Festival demand doubles one good.', icon: '🎏' },
};

// Keyboard shortcuts, shown on the table and the title screen.
export const KEYS = { buy: ['1', '2', '3', '4'], sell: 's', endDay: 'Enter', newGame: 'n', help: 'h', mute: 'm' };
