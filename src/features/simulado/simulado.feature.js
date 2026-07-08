// ============================================================
// SIMULADO — TEMPLATE + CONTROLLER
// Tela onde aluno escolhe matéria, quantidade e inicia.
// ============================================================

import { MATERIAS, getContagens } from '../../data/questoes.repo.js';
import { ir, aoEntrar } from '../../core/router.js';
import { toast, toastErro } from '../../core/toast.js';

export function simuladoTemplate() {
  return `
    <div id="simulado-tab" class="screen simulado-tab">
      <div class="simulado-tab__container">

        <header class="page-header">
          <button class="page-header__back" data-goto="home" aria-label="Voltar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div>
            <h1 class="page-header__title">Simulado</h1>
            <p class="page-header__sub">Escolha a matéria e a quantidade de questões</p>
          </div>
        </header>

        <h3 class="section-title">Matéria</h3>
        <div class="materias-grid" id="sim-materias-grid">
          ${MATERIAS.map((m, i) => `
            <button class="materia-card ${i === 0 ? 'selected' : ''}" data-materia="${m.key}">
              <span class="materia-card__icon">${m.icone}</span>
              <span class="materia-card__name">${m.nome}</span>
              <span class="materia-card__count" data-count="${m.key}">— questões</span>
            </button>
          `).join('')}
        </div>

        <div class="config-row">
          <span class="config-row__label">Número de questões</span>
          <select id="sim-qtd" class="config-row__select">
            <option value="5">5 questões</option>
            <option value="10" selected>10 questões</option>
            <option value="15">15 questões</option>
            <option value="20">20 questões</option>
            <option value="30">30 questões</option>
          </select>
        </div>

        <button class="btn btn--primary btn--block btn--lg" data-action="iniciar-sim">
          Iniciar Simulado →
        </button>

        <div style="margin-top: var(--space-3);">
          <button class="btn btn--secondary btn--block" data-action="iniciar-geral">
            🎲 Simulado Geral (todas as matérias)
          </button>
        </div>

      </div>
    </div>
  `;
}

export function montarSimulado() {
  aoEntrar('simulado-tab', popular);
  document.addEventListener('click', tratarClique);
}

async function popular() {
  const contagens = await getContagens();
  document.querySelectorAll('[data-count]').forEach(el => {
    const k = el.dataset.count;
    el.textContent = `${contagens[k] || 0} questões`;
  });

  // Pré-seleção vinda do "continuar de onde parou" da home
  const pre = sessionStorage.getItem('ev_pre_materia');
  if (pre) {
    sessionStorage.removeItem('ev_pre_materia');
    selecionarMateria(pre);
  }
}

function selecionarMateria(materiaKey) {
  document.querySelectorAll('.materia-card').forEach(c => {
    c.classList.toggle('selected', c.dataset.materia === materiaKey);
  });
}

async function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'simulado-tab') return;

  // Seleção de matéria
  const card = e.target.closest('.materia-card');
  if (card) {
    selecionarMateria(card.dataset.materia);
    return;
  }

  const acao = e.target.closest('[data-action]')?.dataset.action;
  if (acao === 'iniciar-sim') return iniciarSimuladoMateria();
  if (acao === 'iniciar-geral') return iniciarSimuladoGeral();
}

function iniciarSimuladoMateria() {
  const sel = document.querySelector('.materia-card.selected');
  if (!sel) return toastErro('Selecione uma matéria');
  const qtd = parseInt(document.getElementById('sim-qtd').value, 10) || 10;

  // Passa parâmetros pro controller do quiz via sessionStorage
  sessionStorage.setItem('ev_quiz_config', JSON.stringify({
    modo: 'materia',
    materia: sel.dataset.materia,
    qtd,
  }));
  ir('quiz');
}

function iniciarSimuladoGeral() {
  const qtd = parseInt(document.getElementById('sim-qtd').value, 10) || 10;
  sessionStorage.setItem('ev_quiz_config', JSON.stringify({
    modo: 'geral',
    qtd,
  }));
  ir('quiz');
}
