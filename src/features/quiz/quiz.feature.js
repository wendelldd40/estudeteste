// ============================================================
// QUIZ — TEMPLATE + CONTROLLER
// Tela de resolução de questão. Header sticky, acordeão de
// explicação, microinterações de acerto/erro, marcar pra revisar.
// ============================================================

import {
  carregarQuestoes,
  getQuestoesPorMateria,
  getQuestoesAleatorias,
  getQuestoesGerais,
  MATERIAS,
} from '../../data/questoes.repo.js';
import {
  getPerfil,
  setPerfil,
  addXpDia,
  registrarResposta,
  XP_DIARIO_CAP,
} from '../../data/perfil.repo.js';
import { ir, aoEntrar, bloquearSaida } from '../../core/router.js';
import { toast, toastSucesso } from '../../core/toast.js';
import { registrarUltimaMateria, registrarXpHoje } from '../home/home.controller.js';

// ─────────── TEMPLATE ───────────

export function quizTemplate() {
  return `
    <div id="quiz" class="screen">
      <header class="quiz-header">
        <button class="quiz-header__back" data-action="sair-quiz" aria-label="Sair">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>

        <div class="quiz-header__progress">
          <div class="quiz-header__progress-row">
            <span class="quiz-header__progress-text" id="q-progress-text">Questão 1 de 10</span>
            <span class="quiz-header__progress-score" id="q-progress-score">0 pts</span>
          </div>
          <div class="progress">
            <div class="progress__fill" id="q-progress-fill" style="width: 0%"></div>
          </div>
        </div>

        <div class="quiz-header__timer" id="q-timer">60s</div>
      </header>

      <div class="quiz-body">
        <div class="quiz-meta">
          <span class="badge badge--brand" id="q-tag">Matéria</span>
          <span class="badge" id="q-diff">Médio</span>
          <span class="badge badge--neutral" id="q-num">Q1</span>
        </div>

        <p class="q-text" id="q-text"></p>

        <div class="q-assertivas" id="q-assertivas" hidden>
          <div class="q-assertivas__label">📋 Assertivas</div>
          <div id="q-assertivas-body"></div>
        </div>

        <div class="options-list" id="q-options"></div>

        <div class="explanation" id="q-explanation">
          <div class="explanation__header" data-action="toggle-explicacao">
            <div class="explanation__icon" id="q-exp-icon">💡</div>
            <div class="explanation__title" id="q-exp-title">Comentário</div>
            <svg class="explanation__chevron" width="20" height="20" viewBox="0 0 24 24"
                 fill="none" stroke="currentColor" stroke-width="2"
                 stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>
          <div class="explanation__body">
            <div class="explanation__label">Explicação</div>
            <div class="explanation__text" id="q-exp-text"></div>
          </div>
        </div>

        <div class="quiz-footer">
          <div class="quiz-footer__actions">
            <button class="icon-btn" id="q-marcar" data-action="marcar-revisao"
                    title="Marcar para revisar" aria-label="Marcar para revisar">⭐</button>
            <button class="icon-btn" data-action="reportar"
                    title="Reportar erro na questão" aria-label="Reportar erro">⚠️</button>
          </div>
          <button class="btn btn--warning btn--lg btn-next" id="q-btn-next" data-action="proxima">
            Próxima →
          </button>
        </div>
      </div>
    </div>
  `;
}

// ─────────── ESTADO INTERNO ───────────

const estado = {
  questoes: [],
  idx: 0,
  acertos: 0,
  erros: 0,
  pontos: 0,
  xpGanhoSessao: 0,
  inicioSessao: 0,
  timerId: null,
  tempoRestante: 60,
  respondida: false,
  marcadasRevisao: new Set(),
  modo: null,
  materia: null,
};

const TEMPO_POR_QUESTAO = 60; // segundos

// ─────────── MONTAGEM ───────────

export function montarQuiz() {
  aoEntrar('quiz', iniciarSessao);
  document.addEventListener('click', tratarClique);

  // Bloqueia saída acidental no meio do quiz
  bloquearSaida((de, para) => {
    if (de === 'quiz' && para !== 'quiz' && para !== 'results' && estado.questoes.length) {
      const ok = confirm('Tem certeza que quer sair? Seu progresso nessa sessão será perdido.');
      if (!ok) return false;
      pararTimer();
      resetarEstado();
    }
    return true;
  });
}

async function iniciarSessao() {
  const cfgRaw = sessionStorage.getItem('ev_quiz_config');
  if (!cfgRaw) {
    toast('Configure o simulado primeiro');
    return ir('estudo-screen');
  }

  const cfg = JSON.parse(cfgRaw);
  resetarEstado();
  estado.modo = cfg.modo;
  estado.materia = cfg.materia || null;
  estado.inicioSessao = Date.now();

  let questoes = [];
  if (cfg.modo === 'materia') {
    questoes = await getQuestoesAleatorias(cfg.materia, cfg.qtd);
    registrarUltimaMateria(cfg.materia);
  } else if (cfg.modo === 'geral') {
    questoes = await getQuestoesGerais(cfg.qtd);
  } else if (cfg.modo === 'concurso-ponderado' || cfg.modo === 'concurso-aleatorio') {
    // Questões já selecionadas pelo concurso — buscar do banco por IDs
    await carregarQuestoes();
    const todas = await getQuestoesGerais(9999);
    const ids = new Set(cfg.questoes || []);
    questoes = todas.filter(q => ids.has(q.id));
    // Se não achou por ID (IDs podem ser strings), usar as questões direto
    if (!questoes.length && cfg.qtd) {
      questoes = todas.slice(0, cfg.qtd);
    }
    estado.tituloConcurso = cfg.titulo || null;
  }

  if (!questoes.length) {
    toast('Nenhuma questão disponível para essa configuração');
    return ir('estudo-screen');
  }

  estado.questoes = questoes;
  renderizarQuestao();
}

function resetarEstado() {
  estado.questoes = [];
  estado.idx = 0;
  estado.acertos = 0;
  estado.erros = 0;
  estado.pontos = 0;
  estado.xpGanhoSessao = 0;
  estado.respondida = false;
  estado.marcadasRevisao.clear();
  pararTimer();
}

// ─────────── RENDER QUESTÃO ───────────

function renderizarQuestao() {
  const q = estado.questoes[estado.idx];
  if (!q) return finalizar();

  estado.respondida = false;

  // Header
  $('q-progress-text').textContent = `Questão ${estado.idx + 1} de ${estado.questoes.length}`;
  $('q-progress-score').textContent = `${estado.pontos} pts`;
  const pct = ((estado.idx) / estado.questoes.length) * 100;
  $('q-progress-fill').style.width = pct + '%';

  // Meta
  const materiaInfo = MATERIAS.find(m => m.key === q.materia);
  $('q-tag').textContent = materiaInfo ? materiaInfo.nome : (q.materiaNome || q.materia || 'Geral');
  $('q-num').textContent = `Q${estado.idx + 1}`;

  const diffEl = $('q-diff');
  diffEl.textContent = q.dificuldade || 'Médio';
  diffEl.className = 'badge ' + (
    q.dificuldade === 'Fácil'   ? 'badge--brand' :
    q.dificuldade === 'Difícil' ? 'badge--danger' :
                                   'badge--warning'
  );

  // Texto
  $('q-text').textContent = q.texto || q.text || '';

  // Assertivas
  const elAss = $('q-assertivas');
  if (q.assertivas?.length) {
    $('q-assertivas-body').innerHTML = q.assertivas
      .map(a => `<div class="q-assertivas__line">${escapar(a)}</div>`)
      .join('');
    elAss.hidden = false;
  } else {
    elAss.hidden = true;
  }

  // Alternativas
  const opcoes = q.opcoes || q.options || [];
  $('q-options').innerHTML = opcoes.map((opt, i) => `
    <button class="option-btn" data-action="responder" data-idx="${i}">
      <span class="option-btn__letter">${String.fromCharCode(65 + i)}</span>
      <span class="option-btn__text">${escapar(opt)}</span>
      <span class="option-btn__icon"></span>
    </button>
  `).join('');

  // Reset acordeão
  const exp = $('q-explanation');
  exp.classList.remove('show');

  // Marcar revisão
  $('q-marcar').classList.toggle('active', estado.marcadasRevisao.has(q.id));

  // Esconder próxima
  $('q-btn-next').classList.remove('show');

  // Timer
  iniciarTimer();
}

function escapar(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ─────────── TIMER ───────────

function iniciarTimer() {
  pararTimer();
  estado.tempoRestante = TEMPO_POR_QUESTAO;
  atualizarTimer();
  estado.timerId = setInterval(() => {
    estado.tempoRestante--;
    atualizarTimer();
    if (estado.tempoRestante <= 0) {
      pararTimer();
      tempoEsgotado();
    }
  }, 1000);
}

function pararTimer() {
  if (estado.timerId) {
    clearInterval(estado.timerId);
    estado.timerId = null;
  }
}

function atualizarTimer() {
  const el = $('q-timer');
  el.textContent = `${estado.tempoRestante}s`;
  el.classList.toggle('urgent', estado.tempoRestante <= 10);
}

function tempoEsgotado() {
  if (estado.respondida) return;
  estado.respondida = true;
  const q = estado.questoes[estado.idx];
  registrarResposta(q.materia, q._supaId || estado.idx, false);
  estado.erros++;
  marcarTodasComoCorretas(q.correct);
  mostrarExplicacao(false);
  $('q-btn-next').classList.add('show');
  toast('⏰ Tempo esgotado!', { tipo: 'warning' });
}

// ─────────── RESPONDER ───────────

function responder(idx) {
  if (estado.respondida) return;
  estado.respondida = true;
  pararTimer();

  const q = estado.questoes[estado.idx];
  const correct = q.correct ?? q.correta;
  const acertou = idx === correct;

  // Marca visualmente
  const btns = document.querySelectorAll('#q-options .option-btn');
  btns.forEach((b, i) => {
    b.classList.add('disabled');
    if (i === correct) {
      b.classList.add('correct');
      b.querySelector('.option-btn__icon').textContent = '✓';
    } else if (i === idx) {
      b.classList.add('wrong');
      b.querySelector('.option-btn__icon').textContent = '✕';
    }
  });

  // Atualiza contadores
  registrarResposta(q.materia, q._supaId || estado.idx, acertou);
  if (acertou) {
    estado.acertos++;
    const pontosQ = pontosPorDificuldade(q.dificuldade);
    estado.pontos += pontosQ;
    const xpAdd = addXpDia(pontosQ);
    estado.xpGanhoSessao += xpAdd;
    toast(`✅ +${pontosQ} XP`, { tipo: 'success', duracao: 1500 });
  } else {
    estado.erros++;
  }

  mostrarExplicacao(acertou);
  $('q-btn-next').classList.add('show');
}

function marcarTodasComoCorretas(correctIdx) {
  document.querySelectorAll('#q-options .option-btn').forEach((b, i) => {
    b.classList.add('disabled');
    if (i === correctIdx) {
      b.classList.add('correct');
      b.querySelector('.option-btn__icon').textContent = '✓';
    }
  });
}

function pontosPorDificuldade(dif) {
  if (dif === 'Fácil')   return 5;
  if (dif === 'Difícil') return 15;
  return 10;
}

function mostrarExplicacao(acertou) {
  const q = estado.questoes[estado.idx];
  const exp = $('q-explanation');
  const titulo = $('q-exp-title');
  const icone = $('q-exp-icon');

  if (acertou) {
    titulo.textContent = 'Resposta correta!';
    titulo.className = 'explanation__title explanation__title--correct';
    icone.textContent = '✓';
    icone.className = 'explanation__icon explanation__icon--correct';
  } else {
    titulo.textContent = 'Não foi dessa vez';
    titulo.className = 'explanation__title explanation__title--wrong';
    icone.textContent = '✕';
    icone.className = 'explanation__icon explanation__icon--wrong';
  }

  $('q-exp-text').textContent = q.explicacao || q.explanation || 'Sem comentário disponível para essa questão.';
  exp.classList.add('show');
  exp.classList.remove('collapsed');
}

function proximaQuestao() {
  estado.idx++;
  if (estado.idx >= estado.questoes.length) {
    finalizar();
  } else {
    renderizarQuestao();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ─────────── FINALIZAR ───────────

function finalizar() {
  pararTimer();

  // Atualiza perfil
  const perfil = getPerfil();
  if (perfil) {
    perfil.xpTotal = (perfil.xpTotal || 0) + estado.xpGanhoSessao;
    perfil.total = (perfil.total || 0) + estado.questoes.length;
    setPerfil(perfil);
  }

  registrarXpHoje(estado.xpGanhoSessao);

  // Passa resultado pra tela de resultados
  sessionStorage.setItem('ev_quiz_results', JSON.stringify({
    acertos: estado.acertos,
    erros: estado.erros,
    total: estado.questoes.length,
    pontos: estado.pontos,
    xpGanho: estado.xpGanhoSessao,
    tempoTotal: Math.round((Date.now() - estado.inicioSessao) / 1000),
    revisao: [...estado.marcadasRevisao],
    modo: estado.modo,
    materia: estado.materia,
  }));

  ir('results');
}

// ─────────── EVENTOS ───────────

function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'quiz') return;

  const acaoEl = e.target.closest('[data-action]');
  if (!acaoEl) return;
  const acao = acaoEl.dataset.action;

  switch (acao) {
    case 'responder': {
      const idx = parseInt(acaoEl.dataset.idx, 10);
      responder(idx);
      break;
    }
    case 'proxima':
      proximaQuestao();
      break;
    case 'sair-quiz':
      ir('home');
      break;
    case 'toggle-explicacao':
      $('q-explanation').classList.toggle('collapsed');
      break;
    case 'marcar-revisao': {
      const q = estado.questoes[estado.idx];
      if (estado.marcadasRevisao.has(q.id)) {
        estado.marcadasRevisao.delete(q.id);
        $('q-marcar').classList.remove('active');
        toast('Removida da revisão');
      } else {
        estado.marcadasRevisao.add(q.id);
        $('q-marcar').classList.add('active');
        toast('⭐ Marcada para revisar');
      }
      break;
    }
    case 'reportar':
      toast('Obrigado! Reporte enviado para análise.');
      break;
  }
}

const $ = (id) => document.getElementById(id);
