// ============================================================
// PERÍODOS — Template + Controller
// Grade curricular: 10 períodos, só o ativo é clicável.
// ============================================================

import { PERIODOS, resumirMaterias } from '../../data/periodos.repo.js';
import { ir, aoEntrar } from '../../core/router.js';
import { toast } from '../../core/toast.js';

// ─────────── TEMPLATE ───────────

export function periodosTemplate() {
  return `
    <div id="periodo-screen" class="screen periodos">
      <header class="analise__header">
        <button class="page-header__back" data-goto="home" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title">Períodos</h1>
          <p class="page-header__sub">Selecione o período para ver as matérias</p>
        </div>
      </header>

      <div class="periodos__body">
        <div class="periodos-grid">
          ${PERIODOS.map(p => renderCard(p)).join('')}
        </div>
      </div>
    </div>
  `;
}

function renderCard(p) {
  const ehAtual = p.atual === true;
  const bloqueado = !p.ativo;
  const r = resumirMaterias(p.materias);

  const classes = ['periodo-card'];
  if (ehAtual) classes.push('periodo-card--current');
  if (bloqueado) classes.push('periodo-card--locked');

  return `
    <button class="${classes.join(' ')}" data-periodo="${p.num}"
            ${bloqueado ? 'disabled aria-disabled="true"' : ''}>
      <div class="periodo-card__header">
        <span class="periodo-card__num">${p.num}º Período</span>
        <span class="periodo-card__badge ${ehAtual ? 'periodo-card__badge--current' : 'periodo-card__badge--locked'}">
          ${ehAtual ? '✓ Atual' : '🔒 Em breve'}
        </span>
      </div>
      <div class="periodo-card__materias">
        ${r.primeiras.map(m => `<div class="periodo-card__materia">${escapar(m)}</div>`).join('')}
        ${r.extras > 0 ? `<div class="periodo-card__more">+${r.extras} matérias</div>` : ''}
      </div>
    </button>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarPeriodos() {
  document.addEventListener('click', tratarClique);
}

function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'periodo-screen') return;

  const card = e.target.closest('[data-periodo]');
  if (!card) return;

  const num = parseInt(card.dataset.periodo, 10);
  const p = PERIODOS.find(x => x.num === num);

  if (!p?.ativo) {
    toast(`${num}º período em breve! Estamos preparando o conteúdo.`, { tipo: 'info' });
    return;
  }

  // Período ativo: vai pra tela de matérias
  ir('materia-escolha');
}

function escapar(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
