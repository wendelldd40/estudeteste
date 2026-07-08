// ============================================================
// RANKING — Template + Controller
// Pódio top 3 + abas (XP, streak, questões) + lista paginada
// ============================================================

import { rankingXP, rankingStreak, rankingQuestoes, marcarUsuarioAtual } from '../../data/ranking.repo.js';
import { aoEntrar } from '../../core/router.js';

const ABAS = [
  { id: 'xp',       label: '⚡ XP',         carregar: rankingXP,       campo: 'xp_total',        sufixo: ' XP'    },
  { id: 'streak',   label: '🔥 Streak',     carregar: rankingStreak,   campo: 'streak',          sufixo: ' dias'  },
  { id: 'questoes', label: '📚 Questões',   carregar: rankingQuestoes, campo: 'total_questoes',  sufixo: ' resp.' },
];

let abaAtiva = 'xp';

// ─────────── TEMPLATE ───────────

export function rankingTemplate() {
  return `
    <div id="ranking" class="screen ranking">
      <header class="analise__header">
        <button class="page-header__back" data-goto="home" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title">🏆 Ranking</h1>
          <p class="page-header__sub">Top alunos da plataforma</p>
        </div>
      </header>

      <div class="ranking__body">
        <!-- Tabs -->
        <div class="ranking-tabs" id="rk-tabs">
          ${ABAS.map(a => `
            <button class="ranking-tab ${a.id === abaAtiva ? 'active' : ''}"
                    data-aba="${a.id}">${a.label}</button>
          `).join('')}
        </div>

        <div id="rk-content"><!-- preenchido dinamicamente --></div>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarRanking() {
  aoEntrar('ranking', popular);
  document.addEventListener('click', tratarClique);
}

async function popular() {
  await renderizar();
}

async function renderizar() {
  const cont = document.getElementById('rk-content');
  if (!cont) return;

  // Loading
  cont.innerHTML = `
    <div style="text-align:center; padding: var(--space-10);">
      <div style="
        width: 32px; height: 32px;
        border: 3px solid var(--bg-4);
        border-top-color: var(--brand-green);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto;
      "></div>
    </div>
  `;

  const aba = ABAS.find(a => a.id === abaAtiva);
  const dados = await aba.carregar(50);
  const lista = marcarUsuarioAtual(dados);

  if (lista.length === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">🏆</div>
        <h2 class="empty-state__title">Ranking vazio</h2>
        <p class="empty-state__text">
          Ninguém entrou no ranking ainda. Seja o primeiro!
        </p>
      </div>
    `;
    return;
  }

  cont.innerHTML = `
    ${renderPodium(lista, aba)}
    ${renderLista(lista, aba)}
  `;

  // Atualiza tabs (active)
  document.querySelectorAll('#rk-tabs .ranking-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.aba === abaAtiva);
  });
}

function renderPodium(lista, aba) {
  // Lista é ordenada: 1º vem primeiro. Pódio: 2º · 1º · 3º
  const top3 = lista.slice(0, 3);
  if (top3.length === 0) return '';

  const item = (idx, classe, medal, crown = false) => {
    const u = top3[idx];
    if (!u) return `<div></div>`;
    return `
      <div class="podium-step podium-step--${classe}">
        ${crown ? '<div class="podium-step__crown">👑</div>' : ''}
        <div class="podium-step__medal">${medal}</div>
        <div class="podium-step__nome">${escapar(u.nome)}${u.isVoce ? ' <span class="rank-row__badge">VOCÊ</span>' : ''}</div>
        <div class="podium-step__valor">${formatarValor(u, aba)}</div>
        <div class="podium-step__label">${aba.id === 'xp' ? 'XP' : aba.id === 'streak' ? 'dias' : 'questões'}</div>
      </div>
    `;
  };

  return `
    <div class="podium">
      ${item(1, '2', '🥈')}
      ${item(0, '1', '🥇', true)}
      ${item(2, '3', '🥉')}
    </div>
  `;
}

function renderLista(lista, aba) {
  // Pula os 3 primeiros (já estão no pódio)
  const resto = lista.slice(3);

  // Verifica se o usuário atual está fora do top 3 — se sim, mostra ele "fixo"
  const eu = lista.find(u => u.isVoce);
  const eufora = eu && eu.posicao > 3;

  if (resto.length === 0 && !eufora) return '';

  return `
    <div class="rank-list">
      ${resto.map(u => renderRow(u, aba)).join('')}
    </div>
    ${eufora && !resto.find(u => u.isVoce) ? `
      <div class="rank-list" style="margin-top: var(--space-4);">
        <div style="text-align: center; font-size: var(--fs-xs); color: var(--text-tertiary); margin-bottom: var(--space-2);">
          Sua posição
        </div>
        ${renderRow(eu, aba)}
      </div>
    ` : ''}
  `;
}

function renderRow(u, aba) {
  const posClass = u.posicao === 1 ? 'gold'
                 : u.posicao === 2 ? 'silver'
                 : u.posicao === 3 ? 'bronze' : '';

  return `
    <div class="rank-row ${u.isVoce ? 'rank-row--you' : ''}">
      <div class="rank-row__pos rank-row__pos--${posClass}">#${u.posicao}</div>
      <div class="rank-row__nome">
        ${escapar(u.nome)}
        ${u.isVoce ? '<span class="rank-row__badge">VOCÊ</span>' : ''}
      </div>
      ${aba.id !== 'streak' ? `
        <div class="rank-row__streak">🔥 <strong>${u.streak || 0}</strong></div>
      ` : ''}
      <div class="rank-row__valor">${formatarValor(u, aba)}</div>
    </div>
  `;
}

function formatarValor(u, aba) {
  const valor = u[aba.campo] || 0;
  return valor.toLocaleString('pt-BR') + aba.sufixo;
}

function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'ranking') return;

  const tab = e.target.closest('[data-aba]');
  if (tab) {
    abaAtiva = tab.dataset.aba;
    renderizar();
  }
}

function escapar(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
