// ============================================================
// EVOLUÇÃO — Template + Controller
// Gráficos de XP por dia, taxa de acerto, distribuição por matéria.
// ============================================================

import { Chart, registerables } from 'chart.js';
import { getPerfil } from '../../data/perfil.repo.js';
import { listarPorTema, getResumoGeral } from '../../data/erros.repo.js';
import { MATERIAS } from '../../data/questoes.repo.js';
import { aoEntrar } from '../../core/router.js';

Chart.register(...registerables);

const KEY_HISTORICO = 'ev_historico_dias';

// Instâncias dos charts pra destruir antes de re-renderizar
let chartXP = null;
let chartMaterias = null;

// ─────────── TEMPLATE ───────────

export function evolucaoTemplate() {
  return `
    <div id="evolucao" class="screen evolucao">
      <header class="analise__header">
        <button class="page-header__back" data-goto="home" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title">Evolução</h1>
          <p class="page-header__sub">Seu progresso ao longo do tempo</p>
        </div>
      </header>

      <div class="evolucao__body">
        <div id="evol-content"><!-- preenchido dinamicamente --></div>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarEvolucao() {
  aoEntrar('evolucao', popular);
}

function popular() {
  const cont = document.getElementById('evol-content');
  if (!cont) return;

  const perfil = getPerfil();
  if (!perfil) return;

  const resumo = getResumoGeral();
  const historico = getHistorico();
  const dias14 = ultimosDias(14);

  // Destroi charts anteriores antes de re-renderizar
  if (chartXP) { chartXP.destroy(); chartXP = null; }
  if (chartMaterias) { chartMaterias.destroy(); chartMaterias = null; }

  cont.innerHTML = `
    <!-- Métricas principais -->
    <div class="metric-grid">
      <div class="metric-card">
        <div class="metric-card__num text-success">${perfil.xpTotal || 0}</div>
        <div class="metric-card__label">XP Total</div>
        <div class="metric-card__delta metric-card__delta--up">+${xpUltimos7(historico)} esta semana</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__num text-warning">${perfil.streak || 0}</div>
        <div class="metric-card__label">Streak atual</div>
        <div class="metric-card__delta">${diasAtivos(historico, 30)} dias ativos em 30d</div>
      </div>
      <div class="metric-card">
        <div class="metric-card__num">${resumo.taxaAcerto ?? '—'}${resumo.taxaAcerto != null ? '%' : ''}</div>
        <div class="metric-card__label">Taxa de acerto</div>
        <div class="metric-card__delta">${resumo.totalRespostas} respostas</div>
      </div>
    </div>

    <!-- Chart: XP por dia (últimos 14 dias) -->
    <div class="chart-card">
      <h3 class="chart-card__title">XP nos últimos 14 dias</h3>
      <p class="chart-card__sub">Quanto você ganhou de XP em cada dia</p>
      <div class="chart-card__canvas-wrap">
        <canvas id="chart-xp"></canvas>
      </div>
    </div>

    <!-- Chart: distribuição por matéria -->
    ${resumo.totalRespostas > 0 ? `
      <div class="chart-card">
        <h3 class="chart-card__title">Acertos por matéria</h3>
        <p class="chart-card__sub">Onde você está mais forte</p>
        <div class="chart-card__canvas-wrap">
          <canvas id="chart-materias"></canvas>
        </div>
      </div>
    ` : `
      <div class="empty-state">
        <div class="empty-state__icon">📊</div>
        <h2 class="empty-state__title">Faça mais simulados</h2>
        <p class="empty-state__text">
          Quando você responder questões de várias matérias, mostraremos onde você está mais forte e onde precisa focar.
        </p>
        <button class="btn btn--primary" data-goto="estudo-screen">Fazer simulado →</button>
      </div>
    `}
  `;

  // Renderiza charts depois de injetar o DOM (canvases precisam existir)
  setTimeout(() => {
    desenharChartXP(dias14, historico);
    if (resumo.totalRespostas > 0) {
      desenharChartMaterias();
    }
  }, 50);
}

// ─────────── CHARTS ───────────

function desenharChartXP(dias, historico) {
  const canvas = document.getElementById('chart-xp');
  if (!canvas) return;

  const labels = dias.map(d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }));
  const valores = dias.map(d => historico[d.toISOString().slice(0, 10)] || 0);

  chartXP = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'XP',
        data: valores,
        backgroundColor: valores.map(v => v > 0 ? '#12876C' : 'rgba(18, 135, 108, 0.15)'),
        borderRadius: 6,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0C3328',
          titleColor: '#F7F5F0',
          bodyColor: '#D9E6DF',
          borderColor: '#12876C',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => `${ctx.parsed.y} XP`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#75887D', font: { size: 10 } },
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(12, 51, 40, 0.08)' },
          ticks: { color: '#75887D', font: { size: 10 } },
        },
      },
    },
  });
}

function desenharChartMaterias() {
  const canvas = document.getElementById('chart-materias');
  if (!canvas) return;

  const porTema = listarPorTema();
  const acertosPorMateria = {};

  for (const t of porTema) {
    const m = t.subject;
    if (!acertosPorMateria[m]) {
      acertosPorMateria[m] = { acertos: 0, total: 0 };
    }
    acertosPorMateria[m].acertos += t.acertos;
    acertosPorMateria[m].total   += t.total;
  }

  const dadosMaterias = MATERIAS
    .filter(m => acertosPorMateria[m.key])
    .map(m => {
      const d = acertosPorMateria[m.key];
      return {
        nome: m.nome,
        pct: d.total > 0 ? Math.round((d.acertos / d.total) * 100) : 0,
        total: d.total,
      };
    });

  if (dadosMaterias.length === 0) return;

  chartMaterias = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: dadosMaterias.map(d => d.nome),
      datasets: [{
        label: 'Taxa de acerto',
        data: dadosMaterias.map(d => d.pct),
        backgroundColor: dadosMaterias.map(d =>
          d.pct >= 70 ? '#12876C'
          : d.pct >= 50 ? '#C99D66'
          : '#C64B5D'
        ),
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0C3328',
          titleColor: '#F7F5F0',
          bodyColor: '#D9E6DF',
          borderColor: '#12876C',
          borderWidth: 1,
          padding: 12,
          callbacks: {
            label: (ctx) => {
              const item = dadosMaterias[ctx.dataIndex];
              return `${item.pct}% acerto · ${item.total} respostas`;
            },
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          max: 100,
          grid: { color: 'rgba(12, 51, 40, 0.08)' },
          ticks: {
            color: '#75887D',
            font: { size: 10 },
            callback: v => v + '%',
          },
        },
        y: {
          grid: { display: false },
          ticks: { color: '#44594E', font: { size: 11 } },
        },
      },
    },
  });
}

// ─────────── HELPERS ───────────

function getHistorico() {
  try { return JSON.parse(localStorage.getItem(KEY_HISTORICO) || '{}'); }
  catch { return {}; }
}

function ultimosDias(n) {
  const dias = [];
  const hoje = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    dias.push(d);
  }
  return dias;
}

function xpUltimos7(historico) {
  const dias = ultimosDias(7);
  return dias.reduce((s, d) => s + (historico[d.toISOString().slice(0, 10)] || 0), 0);
}

function diasAtivos(historico, n) {
  const dias = ultimosDias(n);
  return dias.filter(d => (historico[d.toISOString().slice(0, 10)] || 0) > 0).length;
}
