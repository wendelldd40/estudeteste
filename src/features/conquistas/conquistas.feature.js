// ============================================================
// CONQUISTAS — Template + Controller
// Grid agrupado por categoria + modal animado de desbloqueio.
// ============================================================

import {
  listarAgrupadas,
  getProgresso,
  verificarDesbloqueio,
} from '../../data/conquistas.repo.js';
import { aoEntrar } from '../../core/router.js';

// ─────────── TEMPLATE ───────────

export function conquistasTemplate() {
  return `
    <div id="conquistas" class="screen conq">
      <header class="analise__header">
        <button class="page-header__back" data-goto="home" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title">Conquistas</h1>
          <p class="page-header__sub">Suas medalhas desbloqueadas</p>
        </div>
      </header>

      <div class="conq__body">
        <div id="conq-content"><!-- preenchido dinamicamente --></div>
      </div>
    </div>

    <!-- Modal de desbloqueio -->
    <div id="unlock-modal" class="unlock-overlay" data-action="fechar-unlock">
      <div class="unlock-card">
        <div class="unlock-card__label">✨ Conquista desbloqueada</div>
        <div class="unlock-card__icon" id="unlock-icon">🏆</div>
        <div class="unlock-card__nome" id="unlock-nome">—</div>
        <div class="unlock-card__desc" id="unlock-desc">—</div>
        <button class="btn btn--primary btn--block" data-action="fechar-unlock">
          Continuar
        </button>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarConquistas() {
  aoEntrar('conquistas', popular);
  document.addEventListener('click', tratarClique);
}

function popular() {
  const cont = document.getElementById('conq-content');
  if (!cont) return;

  const progresso = getProgresso();
  const grupos = listarAgrupadas();

  cont.innerHTML = `
    <!-- Progresso geral -->
    <div class="conq-progress">
      <div class="conq-progress__num">${progresso.obtidas} / ${progresso.total}</div>
      <div class="conq-progress__label">conquistas desbloqueadas</div>
      <div class="conq-progress__bar">
        <div class="conq-progress__fill" style="width: ${progresso.pct}%"></div>
      </div>
    </div>

    <!-- Categorias -->
    ${Object.entries(grupos).map(([_, grupo]) => `
      <section class="conq-cat">
        <h2 class="conq-cat__title">
          <span class="conq-cat__icon">${grupo.info.icone}</span>
          ${grupo.info.titulo}
        </h2>
        <div class="conq-grid">
          ${grupo.itens.map(c => renderCard(c)).join('')}
        </div>
      </section>
    `).join('')}
  `;
}

function renderCard(c) {
  return `
    <div class="conq-card conq-card--${c.desbloqueada ? 'unlocked' : 'locked'}">
      ${c.desbloqueada ? '<div class="conq-card__check">✓</div>' : ''}
      <span class="conq-card__icon">${c.icon}</span>
      <div class="conq-card__nome">${escapar(c.nome)}</div>
      <div class="conq-card__cond">${escapar(c.desc)}</div>
    </div>
  `;
}

// ─────────── MODAL DE DESBLOQUEIO ───────────

/**
 * Mostra modal animado quando uma conquista é desbloqueada.
 * Chamado pelo controller do quiz/results ao detectar nova conquista.
 */
export function mostrarUnlock(conquista) {
  const overlay = document.getElementById('unlock-modal');
  if (!overlay) return;

  document.getElementById('unlock-icon').textContent = conquista.icon;
  document.getElementById('unlock-nome').textContent = conquista.nome;
  document.getElementById('unlock-desc').textContent = conquista.desc;
  overlay.classList.add('show');

  // Auto-fecha em 5s
  clearTimeout(mostrarUnlock._timer);
  mostrarUnlock._timer = setTimeout(fecharUnlock, 5000);
}

function fecharUnlock() {
  const overlay = document.getElementById('unlock-modal');
  if (overlay) overlay.classList.remove('show');
  clearTimeout(mostrarUnlock._timer);
}

/**
 * Fluxo completo: chamar no fim do quiz.
 * Recebe extras { pct, materia, tempoMin, posicaoRanking } e enfileira modais.
 */
export function checarConquistasNovas(extras) {
  const novas = verificarDesbloqueio(extras);
  if (!novas.length) return [];

  // Mostra uma a cada 3.5s (delay entre modais)
  let delay = 800;
  novas.forEach(c => {
    setTimeout(() => mostrarUnlock(c), delay);
    delay += 4000;
  });

  return novas;
}

// ─────────── EVENTOS ───────────

function tratarClique(e) {
  const acaoEl = e.target.closest('[data-action]');
  if (!acaoEl) return;

  // Fechar modal de unlock funciona em qualquer tela
  if (acaoEl.dataset.action === 'fechar-unlock') {
    // Só fecha se clicou no overlay direto ou no botão (não no card)
    if (e.target === acaoEl || e.target.closest('.btn')) {
      fecharUnlock();
    }
  }
}

function escapar(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
