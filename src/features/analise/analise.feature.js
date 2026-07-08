// ============================================================
// ANÁLISE — Template + Controller
// Plano de ação: prioridades + recomendação + lista filtrável.
// ============================================================

import {
  getResumoGeral,
  getTopPrioritarios,
  getRecomendacao,
  listarPorTema,
  baixarCSV,
  limparErros,
} from '../../data/erros.repo.js';
import { ir, aoEntrar } from '../../core/router.js';
import { toast, toastSucesso } from '../../core/toast.js';

// ─────────── TEMPLATE ───────────

export function analiseTemplate() {
  return `
    <div id="analise" class="screen analise">
      <header class="analise__header">
        <button class="page-header__back" data-goto="home" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title">Análise de Erros</h1>
          <p class="page-header__sub">Onde focar seus estudos</p>
        </div>
        <button class="icon-btn" data-action="exportar" title="Exportar CSV" aria-label="Exportar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>
      </header>

      <div class="analise__body">
        <div id="analise-content"><!-- preenchido dinamicamente --></div>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

let filtroAtivo = 'todos';

export function montarAnalise() {
  aoEntrar('analise', popular);
  document.addEventListener('click', tratarClique);
}

function popular() {
  filtroAtivo = 'todos';
  renderizar();
}

function renderizar() {
  const cont = document.getElementById('analise-content');
  if (!cont) return;

  const resumo = getResumoGeral();

  // Estado vazio
  if (resumo.totalRespostas === 0) {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📊</div>
        <h2 class="empty-state__title">Nenhuma análise disponível ainda</h2>
        <p class="empty-state__text">
          Faça pelo menos um simulado para que possamos mapear seus pontos fortes e fracos.
        </p>
        <button class="btn btn--primary" data-goto="simulado-tab">Fazer um simulado →</button>
      </div>
    `;
    return;
  }

  const recomendacao = getRecomendacao();
  const prioritarios = getTopPrioritarios(3);

  cont.innerHTML = `
    ${renderRecomendacao(recomendacao)}
    ${renderResumo(resumo)}
    ${prioritarios.length ? renderPrioridades(prioritarios) : ''}
    ${renderListaCompleta()}
    ${renderRodape()}
  `;
}

function renderRecomendacao(r) {
  const ctaHTML = r.acao
    ? `<button class="btn btn--primary" data-action="iniciar-revisao"
              data-subject="${r.acao.subject}">
         ⚡ Revisar agora
       </button>`
    : `<button class="btn btn--secondary" data-goto="simulado-tab">
         Fazer simulado →
       </button>`;

  return `
    <div class="recommendation">
      <div class="recommendation__label">📌 Recomendação</div>
      <h2 class="recommendation__title">${escapar(r.titulo)}</h2>
      <p class="recommendation__text">${escapar(r.texto)}</p>
      <div class="recommendation__cta">${ctaHTML}</div>
    </div>
  `;
}

function renderResumo(r) {
  return `
    <div class="analise-resumo">
      <div class="analise-resumo__item">
        <div class="analise-resumo__num">${r.totalTemas}</div>
        <div class="analise-resumo__label">Temas vistos</div>
      </div>
      <div class="analise-resumo__item">
        <div class="analise-resumo__num text-danger">${r.temasCriticos}</div>
        <div class="analise-resumo__label">Críticos</div>
      </div>
      <div class="analise-resumo__item">
        <div class="analise-resumo__num text-warning">${r.temasAtencao}</div>
        <div class="analise-resumo__label">Atenção</div>
      </div>
      <div class="analise-resumo__item">
        <div class="analise-resumo__num text-success">${r.taxaAcerto ?? '—'}${r.taxaAcerto != null ? '%' : ''}</div>
        <div class="analise-resumo__label">Acertos</div>
      </div>
    </div>
  `;
}

function renderPrioridades(itens) {
  return `
    <h3 class="section-title">🎯 Foco prioritário</h3>
    <div class="priority-list">
      ${itens.map((t, i) => `
        <div class="priority-card">
          <div class="priority-card__rank priority-card__rank--${i + 1}">${i + 1}</div>
          <div class="priority-card__body">
            <div class="priority-card__materia">${escapar(t.materiaInfo?.nome || t.subject)}</div>
            <div class="priority-card__tema">${escapar(t.tema)}</div>
            <div class="priority-card__stats">
              <span class="priority-card__stat priority-card__stat--erro">
                <strong>${Math.round(t.taxa * 100)}%</strong> de erros
              </span>
              <span class="priority-card__stat">
                <strong>${t.total}</strong> tentativas
              </span>
            </div>
          </div>
          <div class="priority-card__action">
            <button class="btn btn--primary btn--sm"
                    data-action="iniciar-revisao"
                    data-subject="${t.subject}">
              Revisar
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderListaCompleta() {
  let itens = listarPorTema()
    .map(t => ({ ...t }))
    .sort((a, b) => {
      // Críticos primeiro, depois atenção, depois ok; dentro de cada nível, mais erros primeiro
      const ordemNivel = { critico: 0, atencao: 1, ok: 2 };
      if (ordemNivel[a.nivel] !== ordemNivel[b.nivel]) {
        return ordemNivel[a.nivel] - ordemNivel[b.nivel];
      }
      return b.erros - a.erros;
    });

  if (filtroAtivo !== 'todos') {
    if (['critico', 'atencao', 'ok'].includes(filtroAtivo)) {
      itens = itens.filter(i => i.nivel === filtroAtivo);
    } else {
      itens = itens.filter(i => i.subject === filtroAtivo);
    }
  }

  const filtros = [
    { id: 'todos',    label: 'Todos' },
    { id: 'critico',  label: '🔴 Críticos' },
    { id: 'atencao',  label: '🟡 Atenção' },
    { id: 'ok',       label: '🟢 Em dia' },
  ];

  // Filtros por matéria — só os que têm dados
  const materiasComDados = [...new Set(listarPorTema().map(i => i.subject))];
  materiasComDados.forEach(s => {
    const m = listarPorTema().find(t => t.subject === s)?.materiaInfo;
    if (m) filtros.push({ id: s, label: m.icone + ' ' + m.nome });
  });

  const maxErros = Math.max(...itens.map(i => i.erros), 1);

  return `
    <h3 class="section-title">Todos os temas</h3>
    <div class="filters">
      ${filtros.map(f => `
        <button class="filter-chip ${f.id === filtroAtivo ? 'active' : ''}"
                data-filtro="${f.id}">${f.label}</button>
      `).join('')}
    </div>
    ${itens.length === 0
      ? `<div class="empty-state" style="padding: var(--space-6);">
           <div class="empty-state__text">Nenhum tema nessa categoria.</div>
         </div>`
      : `<div>${itens.map((t, idx) => {
          const pct = Math.round(t.taxa * 100);
          const barW = Math.round((t.erros / maxErros) * 100);
          return `
            <div class="theme-row theme-row--${t.nivel}">
              <div class="theme-row__pos">${idx + 1}</div>
              <div class="theme-row__info">
                <div class="theme-row__nome">${escapar(t.tema)}</div>
                <div class="theme-row__materia">${escapar(t.materiaInfo?.nome || t.subject)}</div>
                <div class="theme-row__bar-wrap">
                  <div class="theme-row__bar theme-row__bar--${t.nivel}" style="width: ${barW}%"></div>
                </div>
              </div>
              <div class="theme-row__stats">
                <div class="theme-row__erros theme-row__erros--${t.nivel}">${pct}%</div>
                <div class="theme-row__total">${t.erros}/${t.total}</div>
              </div>
            </div>
          `;
        }).join('')}</div>`
    }
  `;
}

function renderRodape() {
  return `
    <div style="margin-top: var(--space-8); text-align: center;">
      <button class="btn btn--danger btn--sm" data-action="limpar">
        🗑 Limpar histórico de erros
      </button>
    </div>
  `;
}

// ─────────── EVENTOS ───────────

function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'analise') return;

  // Filtros
  const filtroEl = e.target.closest('[data-filtro]');
  if (filtroEl) {
    filtroAtivo = filtroEl.dataset.filtro;
    renderizar();
    return;
  }

  const acaoEl = e.target.closest('[data-action]');
  if (!acaoEl) return;

  switch (acaoEl.dataset.action) {
    case 'exportar':
      baixarCSV();
      toastSucesso('📥 CSV exportado!');
      break;

    case 'iniciar-revisao': {
      const subject = acaoEl.dataset.subject;
      sessionStorage.setItem('ev_quiz_config', JSON.stringify({
        modo: 'materia',
        materia: subject,
        qtd: 10,
      }));
      toast('Iniciando revisão focada...', { tipo: 'info' });
      ir('quiz');
      break;
    }

    case 'limpar': {
      if (!confirm('Tem certeza que deseja limpar todo o histórico de erros? Essa ação não pode ser desfeita.')) {
        return;
      }
      limparErros();
      toastSucesso('🗑 Histórico limpo!');
      renderizar();
      break;
    }
  }
}

function escapar(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
