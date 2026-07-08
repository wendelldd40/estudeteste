import { livrosDaMateria, secoesDoCapitulo } from '../../data/conteudo.repo.js';
import { ir, aoEntrar } from '../../core/router.js';


import { toastErro } from '../../core/toast.js';

export const estudoTemplate = () => '<div class="screen page" id="estudo-screen"></div>';

// ── Estado local ──────────────────────────────────────────
let _materia   = null;
let _livros    = [];
let _livroAtivo = null;
let _capAtivo  = null;
let _secoes    = [];
let _secaoIdx  = 0;
let _modoViewer = false;

// ── Definição das trilhas ─────────────────────────────────
const TRILHAS = [
  {
    id: 'basicas',
    emoji: '🔬',
    titulo: 'Ciências Básicas',
    sub: 'Base de toda a formação',
    disciplinas: [
      { id: 'anatomia',     nome: 'Anatomia Veterinária',       meta: 'I e II · 200h', grad: 'linear-gradient(135deg,#1a2a4a,#0d3b6e)', emoji: '🦴' },
      { id: 'bioquimica',   nome: 'Bioquímica Veterinária',      meta: '80h',           grad: 'linear-gradient(135deg,#1a3a2a,#0d6e3b)', emoji: '🧪' },
      { id: 'histologia',   nome: 'Histologia e Embriologia',    meta: '80h',           grad: 'linear-gradient(135deg,#2a1a3a,#5a0d6e)', emoji: '🔭' },
      { id: 'fisiologia',   nome: 'Fisiologia Veterinária',      meta: 'I e II · 180h', grad: 'linear-gradient(135deg,#3a2a1a,#6e3b0d)', emoji: '⚡' },
      { id: 'microbiologia',nome: 'Microbiologia Veterinária',   meta: '100h',          grad: 'linear-gradient(135deg,#1a3a3a,#0d6e6e)', emoji: '🦠' },
      { id: 'imunologia',   nome: 'Imunologia Veterinária',      meta: '60h',           grad: 'linear-gradient(135deg,#2a1a2a,#6e0d5a)', emoji: '🛡️' },
    ],
  },
  {
    id: 'diagnostico',
    emoji: '🩺',
    titulo: 'Diagnóstico e Laboratório',
    sub: 'O que você está cursando agora',
    disciplinas: [
      { id: 'analisesclinicas', nome: 'Análises Clínicas Veterinárias', meta: '60h', grad: 'linear-gradient(135deg,#0d2a1a,#1a6e3b)', emoji: '🔬', questoes: 50 },
      { id: 'patologia',        nome: 'Patologia Veterinária Geral',     meta: '80h', grad: 'linear-gradient(135deg,#2a0d1a,#6e1a3b)', emoji: '🧬', questoes: 50 },
      { id: 'semiologia',       nome: 'Semiologia Básica',               meta: '40h', grad: 'linear-gradient(135deg,#1a2a0d,#3b6e1a)', emoji: '🩺', questoes: 50 },
      { id: 'imagem',           nome: 'Diagnóstico por Imagem',          meta: '60h', grad: 'linear-gradient(135deg,#0d1a2a,#1a3b6e)', emoji: '📡' },
      { id: 'imunologia',       nome: 'Imunologia Veterinária',          meta: '60h', grad: 'linear-gradient(135deg,#2a1a2a,#6e0d5a)', emoji: '🛡️' },
    ],
  },
  {
    id: 'farmacologia',
    emoji: '💊',
    titulo: 'Farmacologia e Terapêutica',
    sub: 'Transversal a toda clínica',
    disciplinas: [
      { id: 'farmacologia',  nome: 'Farmacologia e Toxicologia',  meta: '80h', grad: 'linear-gradient(135deg,#2a1a0d,#6e3b1a)', emoji: '💊', questoes: 50 },
      { id: 'terapeutica',   nome: 'Terapêutica Veterinária',     meta: '60h', grad: 'linear-gradient(135deg,#1a0d2a,#3b1a6e)', emoji: '💉' },
      { id: 'anestesiologia',nome: 'Anestesiologia Veterinária',  meta: '40h', grad: 'linear-gradient(135deg,#0d2a2a,#1a6e6e)', emoji: '😴' },
    ],
  },
  {
    id: 'clinica',
    emoji: '🏥',
    titulo: 'Clínica Médica',
    sub: 'O veterinário na prática',
    disciplinas: [
      { id: 'clinica_peq',  nome: 'Clínica de Cães e Gatos',    meta: 'I e II · 160h', grad: 'linear-gradient(135deg,#2a0d0d,#6e1a1a)', emoji: '🐕' },
      { id: 'clinica_rum',  nome: 'Clínica de Ruminantes',      meta: 'I e II · 120h', grad: 'linear-gradient(135deg,#1a2a0d,#3b6e0d)', emoji: '🐄' },
      { id: 'clinica_eq',   nome: 'Clínica de Equídeos',        meta: '80h',           grad: 'linear-gradient(135deg,#2a2a0d,#6e6e0d)', emoji: '🐎' },
      { id: 'silvestres',   nome: 'Animais Silvestres',         meta: '60h',           grad: 'linear-gradient(135deg,#0d2a1a,#0d6e3b)', emoji: '🦜' },
    ],
  },
  {
    id: 'cirurgia',
    emoji: '🔪',
    titulo: 'Cirurgia',
    sub: 'Técnica e prática cirúrgica',
    disciplinas: [
      { id: 'tec_cirurgica', nome: 'Técnica Cirúrgica',        meta: '80h',  grad: 'linear-gradient(135deg,#1a0d0d,#4a0d0d)', emoji: '✂️' },
      { id: 'cir_peq',       nome: 'Cirurgia de Pequenos',     meta: '100h', grad: 'linear-gradient(135deg,#0d1a0d,#0d4a0d)', emoji: '🔬' },
      { id: 'cir_grd',       nome: 'Cirurgia de Grandes',      meta: '80h',  grad: 'linear-gradient(135deg,#1a1a0d,#4a4a0d)', emoji: '🏥' },
    ],
  },
  {
    id: 'inspecao',
    emoji: '🏛️',
    titulo: 'Inspeção e Saúde Pública',
    sub: 'Essencial para concursos',
    disciplinas: [
      { id: 'inspecaoleite', nome: 'Inspeção de Leite e Laticínios', meta: '60h', grad: 'linear-gradient(135deg,#2a2a0d,#6e6e1a)', emoji: '🥛', questoes: 50 },
      { id: 'inspecaocarne', nome: 'Inspeção de Carnes e Derivados', meta: '60h', grad: 'linear-gradient(135deg,#2a0d0d,#6e1a0d)', emoji: '🥩' },
      { id: 'epidemiologia', nome: 'Epidemiologia e Zoonoses',       meta: '60h', grad: 'linear-gradient(135deg,#0d2a0d,#0d6e0d)', emoji: '🌍' },
      { id: 'defesa',        nome: 'Defesa Sanitária Animal',        meta: '40h', grad: 'linear-gradient(135deg,#0d0d2a,#0d0d6e)', emoji: '🛡️' },
    ],
  },
  {
    id: 'producao',
    emoji: '🌾',
    titulo: 'Produção Animal',
    sub: 'Campo, agro e consultoria',
    disciplinas: [
      { id: 'zootecnia',  nome: 'Zootecnia',           meta: 'I e II · 120h', grad: 'linear-gradient(135deg,#1a2a0d,#3b6e1a)', emoji: '🐄', questoes: 50 },
      { id: 'aquicultura',nome: 'Aquicultura',          meta: '60h',           grad: 'linear-gradient(135deg,#0d1a2a,#0d3b6e)', emoji: '🐟', questoes: 50 },
      { id: 'nutricao',   nome: 'Nutrição Animal',      meta: '80h',           grad: 'linear-gradient(135deg,#1a1a0d,#4a4a0d)', emoji: '🌿' },
      { id: 'forrageiras',nome: 'Forragicultura',       meta: '60h',           grad: 'linear-gradient(135deg,#0d2a0d,#0d6e0d)', emoji: '🌾' },
    ],
  },
  {
    id: 'reproducao',
    emoji: '🧬',
    titulo: 'Reprodução Animal',
    sub: 'Área com carreira própria',
    disciplinas: [
      { id: 'ginecologia',    nome: 'Ginecologia e Andrologia', meta: '80h',  grad: 'linear-gradient(135deg,#2a0d1a,#6e0d3b)', emoji: '🔬' },
      { id: 'obstetricia',    nome: 'Obstetrícia Veterinária',  meta: '60h',  grad: 'linear-gradient(135deg,#0d2a2a,#0d6e6e)', emoji: '🤱' },
      { id: 'biotecnologia',  nome: 'Biotecnologia da Reprodução', meta: '40h', grad: 'linear-gradient(135deg,#1a0d2a,#3b0d6e)', emoji: '🧬' },
    ],
  },
];

// Matérias com questões no banco
const COM_QUESTOES = new Set(['analisesclinicas','patologia','semiologia','farmacologia','inspecaoleite','zootecnia','aquicultura']);
// Matérias com conteúdo teórico
const COM_CONTEUDO = new Set(['imunologia','analisesclinicas','farmacologia','inspecaoleite','patologia','semiologia','aquicultura','zootecnia']);


// ── Cor de cada trilha (identidade clara ZeloVet) ─────────
const TRILHA_COR = {
  basicas:      '#2E7CC7',
  diagnostico:  '#12876C',
  farmacologia: '#D97E3C',
  clinica:      '#C64B5D',
  cirurgia:     '#7A5CB8',
  inspecao:     '#B98B54',
  producao:     '#5E8C3A',
  reproducao:   '#C05A8E',
};

// Mapa plano id -> nome (usado pelo seletor e pré-seleção da home)
const DISCIPLINAS = {};
TRILHAS.forEach(t => t.disciplinas.forEach(d => { DISCIPLINAS[d.id] = d.nome; }));

// ── RENDERIZAR TRILHAS ────────────────────────────────────
export function renderizar() {
  const tela = document.getElementById('estudo-screen');
  if (!tela) return;
  _modoViewer = false;

  tela.innerHTML = `
    <div class="estudo-scroll">
      <div class="estudo-inline-header">
        <div>
          <h1 style="font-size:var(--fs-2xl);font-weight:var(--fw-bold);color:var(--text-primary);margin:0 0 4px">
            Estudar
          </h1>
          <p style="font-size:var(--fs-sm);color:var(--text-tertiary);margin:0">
            Trilhas organizadas por área de conhecimento · 50+ disciplinas
          </p>
        </div>
      </div>

      <div class="estudo-search-wrap" style="margin-bottom:var(--space-5)">
        <span class="estudo-search-icon">🔍</span>
        <input class="estudo-search" id="estudo-search-input"
          type="text" placeholder="Buscar disciplina, tema ou assunto..." />
      </div>

      <div class="estudo-quick" id="estudo-acesso-rapido">
        ${['Análises Clínicas','Farmacologia','Inspeção de Leite','Semiologia','Aquicultura'].map((n,i) => {
          const ids = ['analisesclinicas','farmacologia','inspecaoleite','semiologia','aquicultura'];
          const emojis = ['🔬','💊','🥛','🩺','🐟'];
          return `<button class="estudo-quick__chip" data-abrir="${ids[i]}">${emojis[i]} ${n}</button>`;
        }).join('')}
      </div>

      <div class="estudo-cobertura" style="display:flex;align-items:center;justify-content:space-between;
        background:var(--bg-card);border:1px solid var(--brand-green);border-radius:var(--radius-md);
        padding:var(--space-4) var(--space-5);margin-bottom:var(--space-6);gap:var(--space-4)">
        <p style="font-size:var(--fs-sm);color:var(--text-secondary);margin:0">
          <strong style="color:var(--text-primary)">7 matérias</strong> com questões (350 questões) ·
          <strong style="color:var(--text-primary)">${COM_CONTEUDO.size} matérias</strong> com conteúdo teórico ·
          <strong style="color:var(--text-primary)">18 flashcards</strong> disponíveis
        </p>
        <div style="display:flex;gap:var(--space-5);flex-shrink:0">
          <div style="text-align:right">
            <div style="font-size:var(--fs-xl);font-weight:var(--fw-bold);color:var(--brand-green)">7</div>
            <div style="font-size:10px;color:var(--text-tertiary);letter-spacing:.06em">COM QUESTÕES</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:var(--fs-xl);font-weight:var(--fw-bold);color:var(--gold-dim)">30+</div>
            <div style="font-size:10px;color:var(--text-tertiary);letter-spacing:.06em">EM PREPARO</div>
          </div>
        </div>
      </div>

      <div id="estudo-trilhas">
        ${TRILHAS.map(t => renderTrilha(t)).join('')}
      </div>
    </div>
  `;

  registrarEventosTrilhas();
}

function renderTrilha(t) {
  return `
    <div class="estudo-trilha" data-trilha="${t.id}">
      <div class="estudo-trilha__header">
        <div style="display:flex;align-items:center;gap:12px">
          <span style="font-size:28px">${t.emoji}</span>
          <div>
            <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold);color:var(--text-primary);margin:0 0 2px">${t.titulo}</h2>
            <p style="font-size:var(--fs-xs);color:var(--text-tertiary);margin:0">${t.disciplinas.length} disciplinas · ${t.sub}</p>
          </div>
        </div>
        <button class="estudo-ver-todas" data-trilha="${t.id}">Ver todas →</button>
      </div>

      <div class="estudo-carrossel">
        ${t.disciplinas.map(d => renderCard(d, TRILHA_COR[t.id] || '#12876C')).join('')}
      </div>
    </div>
  `;
}

function renderCard(d, cor) {
  const temQuestoes = COM_QUESTOES.has(d.id);
  const temConteudo = COM_CONTEUDO.has(d.id);
  const badges = [
    temQuestoes ? `<span class="estudo-card__tag estudo-card__tag--q">50 questões</span>` : '',
    temConteudo ? `<span class="estudo-card__tag estudo-card__tag--c">Conteúdo</span>` : '',
  ].join('');

  return `
    <div class="estudo-card" data-abrir="${d.id}" data-nome="${d.nome}" style="--card-accent:${cor}">
      <div class="estudo-card__banner">
        <span class="estudo-card__chip">${d.emoji}</span>
        <div class="estudo-card__tags">${badges || '<span class="estudo-card__tag estudo-card__tag--soon">Em breve</span>'}</div>
      </div>
      <div class="estudo-card__body">
        <div class="estudo-card__nome">${d.nome}</div>
        <div class="estudo-card__meta">${d.meta}</div>
        <div class="estudo-card__progress-wrap">
          <span class="estudo-card__progress-label">Progresso</span>
          <span class="estudo-card__progress-pct">—</span>
        </div>
        <div class="estudo-card__bar"><div class="estudo-card__bar-fill" style="width:0%"></div></div>
      </div>
    </div>
  `;
}

function registrarEventosTrilhas() {
  const tela = document.getElementById('estudo-screen');
  if (!tela) return;

  // Busca
  const inp = document.getElementById('estudo-search-input');
  inp?.addEventListener('input', () => filtrarCards(inp.value));

  tela.addEventListener('click', async (e) => {
    const card = e.target.closest('[data-abrir]');
    if (!card) return;
    abrirEscolha(card.dataset.abrir, card.dataset.nome);
  });
}

function filtrarCards(q) {
  const query = q.toLowerCase().trim();
  document.querySelectorAll('.estudo-card').forEach(c => {
    const nome = c.dataset.nome?.toLowerCase() || '';
    c.style.display = (!query || nome.includes(query)) ? '' : 'none';
  });
}

// ── VIEWER DE CONTEÚDO ────────────────────────────────────
async function abrirViewer(materiaId, nomeDisplay) {
  _materia = materiaId;
  _livros  = await livrosDaMateria(materiaId);

  if (!_livros.length) {
    toastErro('Conteúdo teórico em preparação para esta matéria.');
    return;
  }

  _modoViewer = true;
  _livroAtivo = _livros[0];
  _capAtivo   = _livroAtivo.capitulos[0];
  await carregarSecoes();
  renderizarViewer(nomeDisplay || materiaId);
}

async function carregarSecoes() {
  _secoes   = await secoesDoCapitulo(_materia, _livroAtivo.nome, _capAtivo.numero);
  _secaoIdx = 0;
}

function renderizarViewer(nomeDisplay) {
  const tela = document.getElementById('estudo-screen');
  if (!tela) return;

  tela.innerHTML = `
    <div class="ev-viewer">
      <aside class="ev-sidebar">
        <div class="ev-sidebar__header">
          <button class="ev-btn-voltar" id="ev-voltar">← Trilhas</button>
          <p class="ev-sidebar__materia">${nomeDisplay}</p>
        </div>

        <div class="ev-sidebar__section">LIVROS</div>
        ${_livros.map((l, li) => `
          <div class="ev-book-card ${li === 0 ? 'active' : ''}" data-livro-idx="${li}">
            <div class="ev-book-card__label">${li === 0 ? 'REFERÊNCIA PRINCIPAL' : 'COMPLEMENTAR'}</div>
            <div class="ev-book-card__title">${l.nome}</div>
            <div class="ev-book-card__meta">${l.autor} · ${l.edicao}</div>
          </div>
        `).join('')}

        <div class="ev-sidebar__section" style="margin-top:12px">
          CAPÍTULOS
        </div>
        <nav class="ev-toc">
          ${_livroAtivo.capitulos.map((c, ci) => `
            <div class="ev-toc-item ${c.numero === _capAtivo.numero ? 'active' : ''}" data-cap-idx="${ci}">
              Cap. ${c.numero} · ${c.titulo}
            </div>
          `).join('')}
        </nav>
      </aside>

      <div class="ev-main">
        <div class="ev-main__header">
          <div>
            <div class="ev-breadcrumb">
              ${nomeDisplay}
              <span class="ev-breadcrumb__sep">›</span>
              <span class="ev-breadcrumb__livro">${_livroAtivo.nome.split(' ')[0]}</span>
              <span class="ev-breadcrumb__sep">›</span>
              Cap. ${_capAtivo.numero}
            </div>
            <h1 class="ev-main__title">${_capAtivo.titulo}</h1>
            <p class="ev-main__sub">${_livroAtivo.autor} · ${_livroAtivo.edicao}</p>
          </div>
          <div class="ev-progress-pill">
            <div class="ev-progress-pill__bar">
              <div class="ev-progress-pill__fill" id="ev-prog-fill"
                style="width:${Math.round((_secaoIdx+1)/_secoes.length*100)}%"></div>
            </div>
            <span id="ev-prog-label">${_secaoIdx+1} de ${_secoes.length}</span>
          </div>
        </div>

        <div class="ev-tabs" id="ev-tabs">
          ${_secoes.map((s, i) => `
            <button class="ev-tab ${i === 0 ? 'active' : ''}" data-secao-idx="${i}">
              ${s.subtitulo || 'Seção ' + (i+1)}
            </button>
          `).join('')}
        </div>

        <div class="ev-content" id="ev-content-area">
          ${_secoes[0]?.conteudo || ''}
        </div>

        <div class="ev-footer">
          <button class="ev-btn-nav" id="ev-anterior" ${_secaoIdx === 0 ? 'disabled' : ''}>← Anterior</button>
          <div class="ev-footer__next-label" id="ev-next-label">
            ${_secoes.length > 1
              ? `Próximo<br><strong>${_secoes[1]?.subtitulo}</strong>`
              : '<strong>Capítulo concluído ✓</strong>'}
          </div>
          <button class="ev-btn-nav ev-btn-nav--primary" id="ev-proximo"
            ${_secoes.length <= 1 ? 'disabled' : ''}>Próximo →</button>
        </div>
      </div>
    </div>
  `;

  registrarEventosViewer();
}

function registrarEventosViewer() {
  document.getElementById('ev-voltar')?.addEventListener('click', renderizar);

  document.getElementById('ev-anterior')?.addEventListener('click', () => {
    if (_secaoIdx > 0) { _secaoIdx--; atualizarSecao(); }
  });

  document.getElementById('ev-proximo')?.addEventListener('click', () => {
    if (_secaoIdx < _secoes.length - 1) { _secaoIdx++; atualizarSecao(); }
  });

  document.getElementById('ev-tabs')?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-secao-idx]');
    if (btn) { _secaoIdx = +btn.dataset.secaoIdx; atualizarSecao(); }
  });

  document.getElementById('estudo-screen')?.addEventListener('click', async (e) => {
    const livroBtn = e.target.closest('[data-livro-idx]');
    if (livroBtn) {
      _livroAtivo = _livros[+livroBtn.dataset.livroIdx];
      _capAtivo   = _livroAtivo.capitulos[0];
      await carregarSecoes();
      renderizarViewer(_materia);
      return;
    }
    const capBtn = e.target.closest('[data-cap-idx]');
    if (capBtn) {
      _capAtivo = _livroAtivo.capitulos[+capBtn.dataset.capIdx];
      await carregarSecoes();
      renderizarViewer(_materia);
    }
  });
}

function atualizarSecao() {
  const area = document.getElementById('ev-content-area');
  if (area) { area.innerHTML = _secoes[_secaoIdx]?.conteudo || ''; area.scrollTop = 0; }

  document.querySelectorAll('.ev-tab').forEach((t, i) =>
    t.classList.toggle('active', i === _secaoIdx));

  const fill  = document.getElementById('ev-prog-fill');
  const label = document.getElementById('ev-prog-label');
  if (fill)  fill.style.width = Math.round((_secaoIdx+1)/_secoes.length*100) + '%';
  if (label) label.textContent = `${_secaoIdx+1} de ${_secoes.length}`;

  const nextLabel = document.getElementById('ev-next-label');
  if (nextLabel) nextLabel.innerHTML = _secaoIdx < _secoes.length - 1
    ? `Próximo<br><strong>${_secoes[_secaoIdx+1]?.subtitulo}</strong>`
    : '<strong>Capítulo concluído ✓</strong>';

  document.getElementById('ev-anterior')?.toggleAttribute('disabled', _secaoIdx === 0);
  document.getElementById('ev-proximo')?.toggleAttribute('disabled', _secaoIdx >= _secoes.length - 1);
}

// ── SELETOR: Questões x Conteúdo ──────────────────────────
function abrirEscolha(id, nome) {
  nome = nome || DISCIPLINAS[id] || id;
  const temQ = COM_QUESTOES.has(id);
  const temC = COM_CONTEUDO.has(id);

  if (!temQ && !temC) {
    toastErro('Disciplina em preparação — em breve!');
    return;
  }
  if (!temQ && temC) return abrirViewer(id, nome);

  fecharEscolha();
  const overlay = document.createElement('div');
  overlay.id = 'estudo-escolha';
  overlay.className = 'esc-overlay';
  overlay.innerHTML = `
    <div class="esc-modal">
      <div class="esc-modal__hd">
        <div>
          <div class="esc-modal__eyebrow">O que você quer fazer?</div>
          <div class="esc-modal__title">${nome}</div>
        </div>
        <button class="esc-modal__close" data-esc-fechar>✕</button>
      </div>
      <div class="esc-modal__opts">
        <button class="esc-opt" data-esc-questoes>
          <div class="esc-opt__icon esc-opt__icon--q">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>
          </div>
          <div class="esc-opt__txt">
            <div class="esc-opt__nome">Fazer questões</div>
            <div class="esc-opt__desc">Simulado com correção e análise de erros</div>
          </div>
          <span class="esc-opt__arrow">→</span>
        </button>
        ${temC ? `
        <button class="esc-opt" data-esc-conteudo>
          <div class="esc-opt__icon esc-opt__icon--c">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <div class="esc-opt__txt">
            <div class="esc-opt__nome">Estudar conteúdo</div>
            <div class="esc-opt__desc">Teoria guiada por capítulos dos livros de referência</div>
          </div>
          <span class="esc-opt__arrow">→</span>
        </button>` : ''}
      </div>
      <div class="esc-modal__qtd">
        <span>Questões no simulado</span>
        <select id="esc-qtd">
          <option value="5">5</option>
          <option value="10" selected>10</option>
          <option value="15">15</option>
          <option value="20">20</option>
          <option value="30">30</option>
        </select>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.closest('[data-esc-fechar]')) return fecharEscolha();
    if (e.target.closest('[data-esc-questoes]')) {
      const qtd = parseInt(document.getElementById('esc-qtd')?.value, 10) || 10;
      sessionStorage.setItem('ev_quiz_config', JSON.stringify({ modo: 'materia', materia: id, qtd }));
      fecharEscolha();
      ir('quiz');
      return;
    }
    if (e.target.closest('[data-esc-conteudo]')) {
      fecharEscolha();
      abrirViewer(id, nome);
    }
  });
  document.addEventListener('keydown', escComEsc);
}

function escComEsc(e) { if (e.key === 'Escape') fecharEscolha(); }
function fecharEscolha() {
  document.getElementById('estudo-escolha')?.remove();
  document.removeEventListener('keydown', escComEsc);
}

export function montarEstudo() {
  renderizar();
  // Pré-seleção vinda da home ("continuar de onde parou")
  aoEntrar('estudo-screen', () => {
    const pre = sessionStorage.getItem('ev_pre_materia');
    if (pre) {
      sessionStorage.removeItem('ev_pre_materia');
      if (_modoViewer) renderizar();
      abrirEscolha(pre, DISCIPLINAS[pre]);
    }
  });
}
