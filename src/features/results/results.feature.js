// ============================================================
// RESULTS — TEMPLATE + CONTROLLER
// Relatório do simulado: anel de %, stats, detalhes, ações.
// ============================================================

import { ir, aoEntrar } from '../../core/router.js';
import { sincronizarPerfil } from '../../data/perfil.repo.js';
import { checarConquistasNovas } from '../conquistas/conquistas.feature.js';

export function resultsTemplate() {
  return `
    <div id="results" class="screen">
      <div class="results-wrap">

        <div class="results-hero">
          <div class="results-emoji" id="r-emoji">🏆</div>

          <div class="results-ring">
            <svg width="160" height="160" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="68" fill="none"
                      stroke="var(--bg-4)" stroke-width="12"/>
              <circle id="r-arc" cx="80" cy="80" r="68" fill="none"
                      stroke="var(--brand-green)" stroke-width="12"
                      stroke-linecap="round"
                      stroke-dasharray="427" stroke-dashoffset="427"
                      style="transition: stroke-dashoffset 1.5s var(--ease-out), stroke 0.5s;"/>
            </svg>
            <div class="results-ring__center">
              <span class="results-ring__pct" id="r-pct">0%</span>
              <span class="results-ring__label">acertos</span>
            </div>
          </div>

          <h1 class="results-title" id="r-title">Simulado concluído!</h1>
          <p class="results-subtitle" id="r-subtitle">Confira seu desempenho.</p>
        </div>

        <div class="results-stats">
          <div class="results-stat">
            <div class="results-stat__num text-success" id="r-corretas">0</div>
            <div class="results-stat__label">Corretas</div>
          </div>
          <div class="results-stat">
            <div class="results-stat__num text-danger" id="r-erradas">0</div>
            <div class="results-stat__label">Erradas</div>
          </div>
          <div class="results-stat">
            <div class="results-stat__num text-warning" id="r-pontos">0</div>
            <div class="results-stat__label">Pontos</div>
          </div>
          <div class="results-stat">
            <div class="results-stat__num" id="r-xp">+0</div>
            <div class="results-stat__label">XP ganho</div>
          </div>
        </div>

        <div class="results-details">
          <div class="results-detail">
            <span class="results-detail__label">⏱ Tempo total</span>
            <span class="results-detail__value" id="r-tempo">—</span>
          </div>
          <div class="results-detail">
            <span class="results-detail__label">⚡ Tempo médio por questão</span>
            <span class="results-detail__value" id="r-tempo-medio">—</span>
          </div>
          <div class="results-detail" id="r-revisao-row" hidden>
            <span class="results-detail__label">⭐ Marcadas para revisar</span>
            <span class="results-detail__value" id="r-revisao">0</span>
          </div>
        </div>

        <div class="results-actions">
          <button class="btn btn--primary btn--block btn--lg" data-goto="estudo-screen">
            Estudar mais →
          </button>
          <button class="btn btn--secondary btn--block" data-goto="home">
            Voltar ao início
          </button>
          <button class="results-link" data-goto="analise">
            📊 Ver análise de erros completa
          </button>
        </div>

      </div>
    </div>
  `;
}

export function montarResults() {
  aoEntrar('results', popular);
}

async function popular() {
  const raw = sessionStorage.getItem('ev_quiz_results');
  if (!raw) return ir('home');

  const r = JSON.parse(raw);
  const pct = r.total > 0 ? Math.round((r.acertos / r.total) * 100) : 0;

  // Anel — calcula offset do stroke
  const circ = 2 * Math.PI * 68;
  const arc = $('r-arc');
  arc.setAttribute('stroke-dasharray', circ);
  // animação delayed pra ter o efeito
  setTimeout(() => {
    arc.setAttribute('stroke-dashoffset', circ - (pct / 100) * circ);
  }, 200);

  // Cor do anel e do número conforme performance
  const corClasse = pct >= 70 ? 'success' : pct >= 50 ? 'warning' : 'danger';
  const corVar = pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';
  arc.setAttribute('stroke', corVar);

  const elPct = $('r-pct');
  elPct.className = `results-ring__pct results-ring__pct--${corClasse}`;
  // animação de contagem do número
  animarContagem(elPct, 0, pct, 1200, n => `${n}%`);

  // Stats
  animarContagem($('r-corretas'), 0, r.acertos, 800);
  animarContagem($('r-erradas'),  0, r.erros,   800);
  animarContagem($('r-pontos'),   0, r.pontos,  1000);
  $('r-xp').textContent = `+${r.xpGanho}`;

  // Tempo
  $('r-tempo').textContent = formatarTempo(r.tempoTotal);
  $('r-tempo-medio').textContent = formatarTempo(Math.round(r.tempoTotal / r.total));

  // Revisão
  if (r.revisao?.length) {
    $('r-revisao-row').hidden = false;
    $('r-revisao').textContent = r.revisao.length;
  }

  // Mensagem motivacional
  const { emoji, titulo, sub } = mensagemPorDesempenho(pct, r);
  $('r-emoji').textContent = emoji;
  $('r-title').textContent = titulo;
  $('r-subtitle').textContent = sub;

  // Sincroniza perfil em background
  sincronizarPerfil().catch(() => {});

  // Verifica conquistas desbloqueadas com este simulado
  // Delay pra dar tempo das animações iniciais terminarem
  setTimeout(() => {
    checarConquistasNovas({
      pct,
      materia: r.materia,
      tempoMin: r.total > 0 ? Math.round(r.tempoTotal / r.total) : 999,
    });
  }, 1800);
}

function mensagemPorDesempenho(pct, r) {
  if (pct === 100) {
    return {
      emoji: '🏆',
      titulo: 'Perfeito! Acertou tudo!',
      sub: 'Você está dominando essa matéria. Considere subir a dificuldade.',
    };
  }
  if (pct >= 80) {
    return {
      emoji: '🌟',
      titulo: 'Excelente desempenho!',
      sub: 'Você está bem preparado. Continue revisando os pontos que errou.',
    };
  }
  if (pct >= 60) {
    return {
      emoji: '💪',
      titulo: 'Bom resultado!',
      sub: 'Está no caminho certo. Foco nos temas que ainda geram dúvida.',
    };
  }
  if (pct >= 40) {
    return {
      emoji: '📚',
      titulo: 'Hora de revisar',
      sub: 'Use a análise de erros pra identificar onde focar seus estudos.',
    };
  }
  return {
    emoji: '🎯',
    titulo: 'Vamos com calma',
    sub: 'Cada erro é um passo. Revise os comentários das questões e tente de novo.',
  };
}

function animarContagem(el, de, ate, duracao, fmt = (n) => String(n)) {
  if (de === ate) { el.textContent = fmt(ate); return; }
  const inicio = performance.now();
  function frame(agora) {
    const t = Math.min(1, (agora - inicio) / duracao);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const valor = Math.round(de + (ate - de) * eased);
    el.textContent = fmt(valor);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function formatarTempo(seg) {
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  if (m === 0) return `${s}s`;
  return `${m}min ${s}s`;
}

const $ = (id) => document.getElementById(id);
