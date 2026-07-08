// ============================================================
// MATÉRIA-ESCOLHA — Lista de matérias do período ativo
// Cada matéria tem ações: Estudar conteúdo · Praticar questões
// ============================================================

import { getPeriodoAtivo } from '../../data/periodos.repo.js';
import { ir, aoEntrar } from '../../core/router.js';

// ─────────── TEMPLATE ───────────

export function materiaEscolhaTemplate() {
  return `
    <div id="materia-escolha" class="screen materia-escolha">
      <header class="analise__header">
        <button class="page-header__back" data-goto="periodo-screen" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title" id="me-titulo">5º Período</h1>
          <p class="page-header__sub">Escolha uma matéria para estudar ou praticar</p>
        </div>
      </header>

      <div class="materia-escolha__body">
        <div id="me-content" class="materia-list"></div>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarMateriaEscolha() {
  aoEntrar('materia-escolha', popular);
  document.addEventListener('click', tratarClique);
}

function popular() {
  const periodo = getPeriodoAtivo();
  if (!periodo) return;

  const titulo = document.getElementById('me-titulo');
  if (titulo) titulo.textContent = `${periodo.num}º Período`;

  const cont = document.getElementById('me-content');
  if (!cont) return;

  cont.innerHTML = periodo.materias.map(m => {
    // Matéria pode ser objeto (período ativo) ou string (períodos bloqueados)
    if (typeof m === 'string') return '';

    return `
      <div class="materia-item" data-materia="${m.key}">
        <div class="materia-item__icon">${m.icone}</div>
        <div class="materia-item__body">
          <div class="materia-item__nome">${escapar(m.nome)}</div>
          <div class="materia-item__sub">Estude o conteúdo ou pratique questões</div>
        </div>
        <div class="materia-item__actions">
          <button class="btn btn--ghost btn--sm" data-acao="praticar" data-materia="${m.key}">
            Praticar
          </button>
          <button class="btn btn--primary btn--sm" data-acao="estudar" data-materia="${m.key}">
            Estudar →
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'materia-escolha') return;

  const acaoEl = e.target.closest('[data-acao]');
  if (!acaoEl) return;

  const materia = acaoEl.dataset.materia;

  if (acaoEl.dataset.acao === 'praticar') {
    sessionStorage.setItem('ev_pre_materia', materia);
    ir('estudo-screen');
  } else if (acaoEl.dataset.acao === 'estudar') {
    sessionStorage.setItem('ev_estudo_materia', materia);
    ir('estudo-screen');
  }
}

function escapar(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
