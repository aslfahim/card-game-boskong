// Tide Market — mouse and keyboard input.
// One clear job: turn clicks and keys into game actions (buy, sell, select,
// end day, new game, help, mute) and hand the result back to the renderer.
// Handlers read the live state through getState, so starting a new match
// never needs a second round of listeners.

import { KEYS } from './config.js';
import { buyCard, sellCard, endDay, PHASES } from './state.js';
import { sfx, toggleMute } from './sound.js';

// Wire every control on the page to the game. `hooks` is what the renderer
// offers: rerender(), showHelp(), startMatch(), playAgain(), and toast(msg).
export function bindInput(getState, hooks) {
  const $ = (id) => document.getElementById(id);
  const state = () => getState();

  // Market row: click a card to buy it. Delegated on the row, because the
  // renderer rebuilds the slots on every render pass.
  $('market-row').addEventListener('click', (e) => {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;
    const cards = [...$('market-row').querySelectorAll('.card')];
    const card = state().market[cards.indexOf(cardEl)];
    if (!card) return;
    const err = buyCard(state(), card.id);
    if (err) {
      hooks.toast(err);
      sfx.denied();
    } else {
      sfx.coin();
      cardEl.classList.add('bought');
    }
    hooks.rerender();
  });

  // Player hand: click a card to select it (click again, or S, to sell).
  $('hand-row').addEventListener('click', (e) => {
    const cardEl = e.target.closest('.card');
    if (!cardEl) return;
    const cards = [...$('hand-row').querySelectorAll('.card')];
    const card = state().player.hand[cards.indexOf(cardEl)];
    if (!card) return;
    if (state().selected === card.id) {
      const err = sellCard(state(), card.id);
      if (err) hooks.toast(err);
      else sfx.coin();
    } else {
      state().selected = card.id;
      sfx.flip();
    }
    hooks.rerender();
  });

  $('btn-sell').addEventListener('click', () => {
    const s = state();
    if (s.selected === null) { hooks.toast('Pick a card from your hand first.'); sfx.denied(); return; }
    const err = sellCard(s, s.selected);
    if (err) hooks.toast(err);
    else sfx.coin();
    hooks.rerender();
  });
  $('btn-end-day').addEventListener('click', () => {
    const s = state();
    if (s.phase !== PHASES.PLAY) return;
    endDay(s);
    sfx.bell();
    if (s.phase === PHASES.OVER) {
      if (s.winner === 'player') sfx.win();
      else if (s.winner === 'rival') sfx.lose();
    }
    hooks.rerender();
  });
  $('btn-start').addEventListener('click', () => { hooks.startMatch(); });
  $('btn-again').addEventListener('click', () => { hooks.playAgain(); });
  $('btn-again-loss').addEventListener('click', () => { hooks.playAgain(); });
  $('btn-help').addEventListener('click', () => { hooks.showHelp(); });
  $('btn-close-help').addEventListener('click', () => { hooks.showHelp(false); });
  $('btn-mute').addEventListener('click', () => {
    const nowMuted = toggleMute();
    $('btn-mute').textContent = nowMuted ? '🔇 Sound off' : '🔊 Sound on';
  });

  // Keyboard: 1-4 buy a market card, S sell the selected card, Enter ends
  // the day, N starts a new match, H toggles help, M toggles sound.
  document.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
    const s = state();
    const buyIndex = KEYS.buy.indexOf(e.key);
    if (buyIndex >= 0 && s.phase === PHASES.PLAY) {
      const card = s.market[buyIndex];
      if (card) {
        const err = buyCard(s, card.id);
        if (err) { hooks.toast(err); sfx.denied(); } else sfx.coin();
        hooks.rerender();
      }
      return;
    }
    if (e.key.toLowerCase() === KEYS.sell && s.selected !== null && s.phase === PHASES.PLAY) {
      const err = sellCard(s, s.selected);
      if (err) hooks.toast(err);
      else sfx.coin();
      hooks.rerender();
      return;
    }
    if (e.key === KEYS.endDay && s.phase === PHASES.PLAY) {
      endDay(s);
      sfx.bell();
      if (s.phase === PHASES.OVER) {
        if (s.winner === 'player') sfx.win();
        else if (s.winner === 'rival') sfx.lose();
      }
      hooks.rerender();
      return;
    }
    if (e.key.toLowerCase() === KEYS.newGame && s.phase === PHASES.OVER) { hooks.playAgain(); return; }
    if (e.key.toLowerCase() === KEYS.help) { hooks.showHelp(); return; }
    if (e.key.toLowerCase() === KEYS.mute) {
      const nowMuted = toggleMute();
      $('btn-mute').textContent = nowMuted ? '🔇 Sound off' : '🔊 Sound on';
    }
  });
}
