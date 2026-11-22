// Tide Market — rendering the table.
// One clear job: turn the game state into DOM. Cards slide, flip and snap
// with CSS transitions; the price board, purses, log and overlays all read
// from the same state object. No game rules live here.

import {
  GOODS, GOOD_KEYS, MARKET_SIZE, HAND_LIMIT, TOTAL_DAYS, SET_SIZE,
} from './config.js';
import { priceOf, sellPriceOf, multiplierOf } from './market.js';
import { boardArrows, playerSets, cardName, PHASES } from './state.js';
import { rivalTell, netWorth } from './ai.js';
import { countByGood } from './deck.js';

const $ = (id) => document.getElementById(id);

// Build one face-up goods card. `tag` is the corner label (price to buy,
// value to sell, or a set badge). The card's good is told by colour, glyph
// AND shape class, so it reads at thumbnail size.
export function makeCardEl(card, opts = {}) {
  const good = GOODS[card.good];
  const el = document.createElement('div');
  el.className = `card good-${card.good}${opts.selected ? ' selected' : ''}${opts.dim ? ' dim' : ''}`;
  el.style.setProperty('--good', good.color);
  el.style.setProperty('--good-dark', good.dark);
  el.innerHTML = `
    <div class="card-top"><span class="card-glyph">${good.glyph}</span><span class="card-value">${card.value}</span></div>
    <div class="card-shape shape-${good.shape}">${good.glyph}</div>
    <div class="card-name">${good.name}</div>
    <div class="card-tag">${opts.tag || ''}</div>
    ${opts.setBadge ? '<div class="card-set">SET ×1.5</div>' : ''}`;
  return el;
}

// A face-down card back for the rival's hand.
export function makeCardBackEl() {
  const el = document.createElement('div');
  el.className = 'card card-back';
  el.innerHTML = '<div class="back-anchor">⚓</div><div class="back-name">BRINE &amp; CO.</div>';
  return el;
}

// Fill a row of slots with cards, dealing them in with a staggered slide.
function fillRow(rowId, cards, buildEl, dealDelay = 60) {
  const row = $(rowId);
  row.innerHTML = '';
  cards.forEach((card, i) => {
    const slot = document.createElement('div');
    slot.className = 'slot deal-in';
    slot.style.animationDelay = `${i * dealDelay}ms`;
    slot.appendChild(buildEl(card, i));
    row.appendChild(slot);
  });
  return row;
}

// The price board: one chip per good with its multiplier and its arrow.
export function renderPriceBoard(state) {
  const arrows = boardArrows(state);
  const board = $('price-board');
  board.innerHTML = '';
  for (const key of GOOD_KEYS) {
    const good = GOODS[key];
    const chip = document.createElement('div');
    chip.className = 'price-chip';
    chip.style.setProperty('--good', good.color);
    chip.innerHTML = `
      <span class="chip-glyph">${good.glyph}</span>
      <span class="chip-name">${good.short}</span>
      <span class="chip-mult">${multiplierOf(state.board, key).toFixed(2).replace(/\.?0+$/, '')}×</span>
      <span class="chip-arrow ${arrows[key] === '▲' ? 'up' : arrows[key] === '▼' ? 'down' : ''}">${arrows[key]}</span>`;
    board.appendChild(chip);
  }
}

// Purses, net worth, and the day counter in the header.
export function renderScoreboard(state) {
  $('purse-you').textContent = `${state.player.purse} 🪙`;
  $('purse-rival').textContent = `${state.rival.purse} 🪙`;
  $('worth-you').textContent = `net ${netWorth(state.board, state.player)}`;
  $('worth-rival').textContent = `net ${netWorth(state.board, state.rival)}`;
  $('day-label').textContent = `Day ${Math.min(state.day, TOTAL_DAYS)} / ${TOTAL_DAYS}`;
  $('tide-label').textContent = state.tide
    ? `${state.tide.icon} ${state.tide.name}${state.tideGood ? ` — ${GOODS[state.tideGood].short}` : ''}`
    : '☀ Calm Seas — the harbor opens';
  $('rival-tell').textContent = state.phase === PHASES.PLAY ? `“${rivalTell(state)}”` : '';
}

// The rival's hand: face-down backs plus a count, so the table always shows
// both hands even though his cards stay hidden.
export function renderRivalHand(state) {
  fillRow('rival-row', state.rival.hand, () => makeCardBackEl(), 70);
  $('rival-count').textContent = `${state.rival.hand.length} card${state.rival.hand.length === 1 ? '' : 's'}`;
}

// The market row: four goods for sale, each tagged with its buy price and
// dimmed when the player cannot afford it.
export function renderMarket(state) {
  const counts = countByGood(state.player.hand);
  const row = $('market-row');
  row.innerHTML = '';
  state.market.forEach((card, i) => {
    const cost = priceOf(state.board, card);
    const slot = document.createElement('div');
    slot.className = 'slot deal-in';
    slot.style.animationDelay = `${i * 60}ms`;
    const el = makeCardEl(card, {
      tag: `Buy ${cost} 🪙 · ${i + 1}`,
      dim: cost > state.player.purse || state.phase !== PHASES.PLAY,
    });
    slot.appendChild(el);
    row.appendChild(slot);
  });
  for (let i = state.market.length; i < MARKET_SIZE; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'slot slot-empty';
    empty.innerHTML = '<div class="empty-label">Sold out</div>';
    row.appendChild(empty);
  }
}

// The player's hand: face-up cards, each tagged with its sell price; cards
// in a set carry the SET ×1.5 badge. The selected card lifts and glows.
export function renderPlayerHand(state) {
  const sets = playerSets(state);
  const counts = countByGood(state.player.hand);
  const row = $('hand-row');
  row.innerHTML = '';
  state.player.hand.forEach((card, i) => {
    const inSet = counts[card.good] >= SET_SIZE;
    const gain = sellPriceOf(state.board, card, inSet);
    const slot = document.createElement('div');
    slot.className = 'slot deal-in';
    slot.style.animationDelay = `${i * 60}ms`;
    const el = makeCardEl(card, {
      tag: `Sell ${gain} 🪙`,
      selected: state.selected === card.id,
      setBadge: inSet,
    });
    slot.appendChild(el);
    row.appendChild(slot);
  });
  for (let i = state.player.hand.length; i < HAND_LIMIT; i += 1) {
    const empty = document.createElement('div');
    empty.className = 'slot slot-empty';
    row.appendChild(empty);
  }
  $('hand-count').textContent = `${state.player.hand.length} / ${HAND_LIMIT} cards${sets.length ? ` · SET: ${sets.map((g) => GOODS[g].short).join(', ')}` : ''}`;
  const sel = state.player.hand.find((c) => c.id === state.selected);
  $('sell-hint').textContent = sel
    ? `Selected: ${cardName(sel)} — sells for ${sellPriceOf(state.board, sel, counts[sel.good] >= SET_SIZE)} 🪙 (click again or press S)`
    : 'Click a market card to buy · click a hand card to select, again to sell';
  $('btn-sell').disabled = state.selected === null || state.phase !== PHASES.PLAY;
}

// The harbor log: newest first, each line stamped with its day.
export function renderLog(state) {
  const log = $('log-list');
  log.innerHTML = '';
  for (const entry of state.log.slice(0, 8)) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="log-day">D${entry.day}</span> ${entry.text}`;
    log.appendChild(li);
  }
}

// Title, win, and loss overlays. The win screen lands with a flourish:
// gold confetti pieces fall over the final tally.
export function renderOverlays(state) {
  $('title-screen').classList.toggle('hidden', state.phase !== PHASES.TITLE);
  const over = state.phase === PHASES.OVER;
  $('win-screen').classList.toggle('hidden', !(over && state.winner === 'player'));
  $('loss-screen').classList.toggle('hidden', !(over && state.winner !== 'player'));
  if (over && state.finalWorth) {
    const win = state.winner === 'player';
    const title = win ? '🏆 You Rule the Harbor!' : state.winner === 'draw' ? '🤝 A Dead Heat!' : '🌊 Brine Takes the Harbor';
    $('end-title').textContent = title;
    $('end-title-loss').textContent = title;
    const tally = `Final net worth — You ${state.finalWorth.player} 🪙 · Brine ${state.finalWorth.rival} 🪙`;
    const detail = `Bought ${state.stats.bought} · Sold ${state.stats.sold} · Sets cashed ${state.stats.setsSold} · Earned ${state.stats.earned} 🪙 · Spent ${state.stats.spent} 🪙`;
    $('end-tally').textContent = tally;
    $('end-detail').textContent = detail;
    $('end-tally-loss').textContent = tally;
    $('end-detail-loss').textContent = detail;
    if (win) spawnConfetti();
  }
  $('btn-end-day').disabled = state.phase !== PHASES.PLAY;
}

// Gold confetti for the win screen: 40 pieces, random drift, CSS animation.
function spawnConfetti() {
  const layer = $('confetti');
  layer.innerHTML = '';
  const colors = ['#ffd43b', '#e5484d', '#8b5cf6', '#2f9e44', '#1971c2', '#ffffff'];
  for (let i = 0; i < 40; i += 1) {
    const piece = document.createElement('i');
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[i % colors.length];
    piece.style.animationDelay = `${Math.random() * 1.2}s`;
    piece.style.animationDuration = `${2.2 + Math.random() * 1.6}s`;
    layer.appendChild(piece);
  }
}

// One render pass for the whole table.
export function renderAll(state) {
  renderPriceBoard(state);
  renderScoreboard(state);
  renderRivalHand(state);
  renderMarket(state);
  renderPlayerHand(state);
  renderLog(state);
  renderOverlays(state);
}

// A toast for refused moves and hints, fading out on its own.
let toastTimer = null;
export function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => el.classList.remove('show'), 2600);
}
