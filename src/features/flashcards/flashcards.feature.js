// ============================================================
// FLASHCARDS — Template + Controller
// Seletor de matéria → deck de cards com flip 3D → resultado.
// ============================================================

import {
  carregarFlashcards,
  getFlashcardsPorMateria,
  getEstatisticasGerais,
  getEstatisticasPorMateria,
  salvarStatusCard,
  embaralhar,
} from '../../data/flashcards.repo.js';
import { MATERIAS } from '../../data/questoes.repo.js';
import { ir, aoEntrar } from '../../core/router.js';
import { toast, toastSucesso } from '../../core/toast.js';

// ─────────── ESTADO ───────────

const estado = {
  vista: 'seletor', // 'seletor' | 'arena' | 'resultado'
  materiaAtiva: null,
  deck: [],
  idx: 0,
  sabei: [],
  revisar: [],
  modoSomenteRevisar: false,
};

// ─────────── TEMPLATE ───────────

export function flashcardsTemplate() {
  return `
    <div id="flashcards" class="screen fc">
      <header class="analise__header">
        <button class="page-header__back" data-action="fc-voltar" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title">🎴 Flashcards</h1>
          <p class="page-header__sub" id="fc-sub">Vire o card · Marque o que já sabe</p>
        </div>
      </header>

      <div class="fc__body">
        <!-- Estatísticas gerais -->
        <div class="fc-stats" id="fc-stats">
          <div class="fc-stats__item">
            <div class="fc-stats__num" id="fc-stat-total">—</div>
            <div class="fc-stats__label">Total</div>
          </div>
          <div class="fc-stats__item">
            <div class="fc-stats__num text-success" id="fc-stat-sabei">0</div>
            <div class="fc-stats__label">Já sei</div>
          </div>
          <div class="fc-stats__item">
            <div class="fc-stats__num text-danger" id="fc-stat-revisar">0</div>
            <div class="fc-stats__label">Revisar</div>
          </div>
        </div>

        <!-- Seletor de matéria -->
        <div id="fc-seletor">
          <h3 class="section-title">Escolha uma matéria</h3>
          <div class="fc-materia-grid" id="fc-materia-grid">
            <div style="grid-column:1/-1; text-align:center; padding: var(--space-6); color: var(--text-tertiary); font-size: var(--fs-sm);">
              Carregando flashcards...
            </div>
          </div>
        </div>

        <!-- Arena -->
        <div class="fc-arena" id="fc-arena">
          <div class="fc-arena__top">
            <button class="btn btn--ghost btn--sm" data-action="fc-voltar-seletor">← Matérias</button>
            <div class="fc-arena__progress">
              <div class="fc-arena__progress-row">
                <span id="fc-progresso-texto">Card 1 de 10</span>
                <span class="fc-arena__materia" id="fc-arena-materia">—</span>
              </div>
              <div class="progress">
                <div class="progress__fill" id="fc-progresso-fill" style="width: 0%"></div>
              </div>
            </div>
          </div>

          <div class="fc-card-wrap" data-action="fc-virar">
            <div class="fc-card" id="fc-card">
              <div class="fc-face fc-face--front">
                <span class="fc-face__label">Termo</span>
                <div class="fc-face__termo" id="fc-frente">—</div>
                <div class="fc-face__hint">👆 Toque para ver a definição</div>
              </div>
              <div class="fc-face fc-face--back">
                <span class="fc-face__label">Definição</span>
                <div class="fc-face__definicao" id="fc-verso">—</div>
              </div>
            </div>
          </div>

          <div class="fc-actions">
            <button class="fc-btn fc-btn--revisar" id="fc-btn-revisar" disabled
                    data-action="fc-resp" data-status="revisar">
              🔁 Preciso revisar
            </button>
            <button class="fc-btn fc-btn--sabei" id="fc-btn-sabei" disabled
                    data-action="fc-resp" data-status="sabei">
              ✅ Já sei!
            </button>
          </div>
        </div>

        <!-- Resultado -->
        <div class="fc-result" id="fc-result">
          <div class="fc-result__emoji" id="fc-res-emoji">🎉</div>
          <h2 class="fc-result__title" id="fc-res-titulo">Deck concluído!</h2>
          <p class="fc-result__sub" id="fc-res-sub">Você revisou todos os cards.</p>

          <div class="fc-result__stats">
            <div class="fc-result__stat fc-result__stat--sabei">
              <div class="fc-result__stat-num fc-result__stat-num--sabei" id="fc-res-sabei">0</div>
              <div class="fc-result__stat-label">Já sei ✅</div>
            </div>
            <div class="fc-result__stat fc-result__stat--revisar">
              <div class="fc-result__stat-num fc-result__stat-num--revisar" id="fc-res-revisar">0</div>
              <div class="fc-result__stat-label">Revisar 🔁</div>
            </div>
          </div>

          <div class="fc-result__actions">
            <button class="btn btn--primary btn--block" data-action="fc-refazer">
              🔄 Refazer deck completo
            </button>
            <button class="btn btn--secondary btn--block" id="fc-btn-so-revisar"
                    data-action="fc-so-revisar">
              🔁 Refazer só os de revisar
            </button>
            <button class="btn btn--ghost btn--block" data-action="fc-voltar-seletor">
              Voltar para matérias
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarFlashcards() {
  aoEntrar('flashcards', iniciar);
  document.addEventListener('click', tratarClique);
}

async function iniciar() {
  await carregarFlashcards();
  await atualizarStatsGerais();
  mostrarSeletor();
}

async function atualizarStatsGerais() {
  const s = await getEstatisticasGerais();
  document.getElementById('fc-stat-total').textContent = s.total;
  document.getElementById('fc-stat-sabei').textContent = s.sabei;
  document.getElementById('fc-stat-revisar').textContent = s.revisar;
}

// ─────────── SELETOR ───────────

async function mostrarSeletor() {
  estado.vista = 'seletor';
  document.getElementById('fc-seletor').style.display = '';
  document.getElementById('fc-arena').classList.remove('show');
  document.getElementById('fc-result').classList.remove('show');
  document.getElementById('fc-sub').textContent = 'Vire o card · Marque o que já sabe';

  const grid = document.getElementById('fc-materia-grid');
  const stats = await getEstatisticasPorMateria();

  grid.innerHTML = MATERIAS.map(m => {
    const s = stats[m.key] || { total: 0, sabei: 0, pct: 0 };
    const semCards = s.total === 0;
    return `
      <button class="fc-materia-card" data-materia="${m.key}" ${semCards ? 'disabled' : ''}>
        <div class="fc-materia-card__icon">${m.icone}</div>
        <div class="fc-materia-card__nome">${escapar(m.nome)}</div>
        <div class="fc-materia-card__count">${s.total} cards</div>
        ${s.total > 0 ? `
          <div class="fc-materia-card__progress">
            <div class="fc-materia-card__progress-fill" style="width: ${s.pct}%"></div>
          </div>
          <div class="fc-materia-card__pct">${s.pct}% dominados</div>
        ` : `<div style="font-size: 11px; color: var(--text-quaternary); margin-top: 8px;">sem cards ainda</div>`}
      </button>
    `;
  }).join('');
}

// ─────────── ARENA ───────────

async function iniciarDeck(materiaKey, somenteRevisar = false) {
  const cards = await getFlashcardsPorMateria(materiaKey);
  if (!cards.length) return toast('Sem cards nessa matéria');

  const deck = somenteRevisar
    ? cards.filter(c => c._status === 'revisar' || !c._status)
    : [...cards];

  if (!deck.length) return toast('Você já dominou todos os cards dessa matéria! 🎉', { tipo: 'success' });

  estado.vista = 'arena';
  estado.materiaAtiva = materiaKey;
  estado.deck = embaralhar(deck);
  estado.idx = 0;
  estado.sabei = [];
  estado.revisar = [];
  estado.modoSomenteRevisar = somenteRevisar;

  document.getElementById('fc-seletor').style.display = 'none';
  document.getElementById('fc-result').classList.remove('show');
  document.getElementById('fc-arena').classList.add('show');

  const m = MATERIAS.find(x => x.key === materiaKey);
  document.getElementById('fc-arena-materia').textContent = m ? `${m.icone} ${m.nome}` : '';
  document.getElementById('fc-sub').textContent = 'Toque no card pra ver a definição';

  renderCard();
}

function renderCard() {
  const card = estado.deck[estado.idx];
  if (!card) return finalizar();

  document.getElementById('fc-frente').textContent = card.frente || '—';
  document.getElementById('fc-verso').textContent = card.verso || '—';

  // Reseta flip
  document.getElementById('fc-card').classList.remove('flipped');

  // Botões só liberam após virar
  document.getElementById('fc-btn-sabei').disabled = true;
  document.getElementById('fc-btn-revisar').disabled = true;

  // Progresso
  document.getElementById('fc-progresso-texto').textContent =
    `Card ${estado.idx + 1} de ${estado.deck.length}`;
  const pct = (estado.idx / estado.deck.length) * 100;
  document.getElementById('fc-progresso-fill').style.width = pct + '%';
}

function virarCard() {
  const cardEl = document.getElementById('fc-card');
  cardEl.classList.toggle('flipped');

  // Libera botões depois de virar
  if (cardEl.classList.contains('flipped')) {
    document.getElementById('fc-btn-sabei').disabled = false;
    document.getElementById('fc-btn-revisar').disabled = false;
  }
}

async function responder(status) {
  const card = estado.deck[estado.idx];
  if (!card) return;

  // Salva no Supabase em background (não bloqueia UI)
  salvarStatusCard(card.id, status).catch(() => {});

  if (status === 'sabei') estado.sabei.push(card);
  else estado.revisar.push(card);

  estado.idx++;
  if (estado.idx >= estado.deck.length) {
    finalizar();
  } else {
    renderCard();
  }
}

// ─────────── RESULTADO ───────────

function finalizar() {
  estado.vista = 'resultado';
  document.getElementById('fc-arena').classList.remove('show');
  document.getElementById('fc-result').classList.add('show');

  const total = estado.deck.length;
  const sabeiCount = estado.sabei.length;
  const revisarCount = estado.revisar.length;

  document.getElementById('fc-res-sabei').textContent = sabeiCount;
  document.getElementById('fc-res-revisar').textContent = revisarCount;

  const pct = total > 0 ? Math.round((sabeiCount / total) * 100) : 0;
  let emoji, titulo, sub;

  if (pct >= 90) {
    emoji = '🏆'; titulo = 'Domínio total!';
    sub = `Você acertou ${pct}% do deck. Está praticamente fluente nessa matéria.`;
  } else if (pct >= 70) {
    emoji = '🌟'; titulo = 'Excelente!';
    sub = `${pct}% de domínio. Continue revisando os ${revisarCount} cards que ficaram pendentes.`;
  } else if (pct >= 50) {
    emoji = '💪'; titulo = 'Bom progresso';
    sub = `${pct}% de domínio. Foque nos ${revisarCount} cards de revisão pra subir mais.`;
  } else {
    emoji = '📚'; titulo = 'Hora de estudar';
    sub = `${pct}% de domínio. Refaça o deck após estudar o conteúdo teórico da matéria.`;
  }

  document.getElementById('fc-res-emoji').textContent = emoji;
  document.getElementById('fc-res-titulo').textContent = titulo;
  document.getElementById('fc-res-sub').textContent = sub;

  // Esconde botão "só revisar" se não tem nenhum pra revisar
  document.getElementById('fc-btn-so-revisar').style.display = revisarCount > 0 ? '' : 'none';

  // Atualiza stats gerais (background)
  atualizarStatsGerais().catch(() => {});

  if (sabeiCount > 0) {
    toastSucesso(`+${sabeiCount} cards dominados`);
  }
}

// ─────────── EVENTOS ───────────

function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'flashcards') return;

  // Seleção de matéria no seletor
  if (estado.vista === 'seletor') {
    const matCard = e.target.closest('[data-materia]');
    if (matCard && !matCard.disabled) {
      iniciarDeck(matCard.dataset.materia);
      return;
    }
  }

  const acao = e.target.closest('[data-action]')?.dataset.action;
  if (!acao) return;

  switch (acao) {
    case 'fc-voltar':
      ir('home');
      break;
    case 'fc-voltar-seletor':
      mostrarSeletor();
      break;
    case 'fc-virar':
      if (estado.vista === 'arena') virarCard();
      break;
    case 'fc-resp': {
      const status = e.target.closest('[data-status]')?.dataset.status;
      if (status) responder(status);
      break;
    }
    case 'fc-refazer':
      iniciarDeck(estado.materiaAtiva, false);
      break;
    case 'fc-so-revisar':
      iniciarDeck(estado.materiaAtiva, true);
      break;
  }
}

function escapar(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
