// ============================================================
// ADMIN — Template + Controller
// Métricas gerais + CRUD de questões com modal de editor.
//
// Acesso: apenas usuário com `is_admin = true` no Supabase.
// ============================================================

import {
  getMetricasGerais,
  listarQuestoes,
  criarQuestao,
  atualizarQuestao,
  desativarQuestao,
  reativarQuestao,
  getQuestaoCompleta,
} from '../../data/admin.repo.js';
import {
  listarTodosEditais,
  criarEdital,
  atualizarEdital,
  excluirEdital,
} from '../../data/editais.repo.js';
import { MATERIAS } from '../../data/questoes.repo.js';
import { ir, aoEntrar } from '../../core/router.js';
import { toast, toastSucesso, toastErro } from '../../core/toast.js';

let estado = {
  abaAtiva: 'questoes',
  filtros: { materia: '', busca: '' },
  questoes: [],
  editando: null, // null | { id?, dados }
};

// ─────────── TEMPLATE ───────────

export function adminTemplate() {
  return `
    <div id="adm" class="screen admin">
      <header class="analise__header">
        <button class="page-header__back" data-goto="home" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1; display: flex; align-items: center; gap: var(--space-3);">
          <span class="admin-badge">⚙ ADM</span>
          <div>
            <h1 class="page-header__title">Painel Administrativo</h1>
            <p class="page-header__sub">Gerenciamento da plataforma</p>
          </div>
        </div>
        <button class="icon-btn" data-action="atualizar" title="Atualizar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
          </svg>
        </button>
      </header>

      <div class="admin__body">
        <div id="admin-metrics-wrap"></div>

        <!-- Tabs -->
        <div class="admin-tabs">
          <button class="admin-tab active" data-aba="questoes">📝 Questões</button>
          <button class="admin-tab" data-aba="concursos">🏛 Concursos</button>
          <button class="admin-tab" data-aba="usuarios">👥 Usuários</button>
        </div>

        <div id="admin-content"></div>
      </div>

      <!-- Editor -->
      <div id="editor-overlay" class="editor-overlay">
        <div class="editor-modal">
          <div class="editor-modal__header">
            <h2 class="editor-modal__title" id="editor-titulo">Nova questão</h2>
            <button class="editor-modal__close" data-action="fechar-editor">✕</button>
          </div>
          <div class="editor-modal__body" id="editor-body"></div>
          <div class="editor-modal__footer">
            <button class="btn btn--ghost" data-action="fechar-editor">Cancelar</button>
            <button class="btn btn--primary" id="editor-salvar" data-action="salvar-questao">
              💾 Salvar
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarAdmin() {
  aoEntrar('adm', popular);
  document.addEventListener('click', tratarClique);
  document.addEventListener('input', tratarInput);
}

async function popular() {
  await renderMetricas();
  await renderTab();
}

async function renderMetricas() {
  const wrap = document.getElementById('admin-metrics-wrap');
  if (!wrap) return;

  const m = await getMetricasGerais();

  wrap.innerHTML = `
    <div class="admin-metrics">
      <div class="admin-metric">
        <div class="admin-metric__icon">👥</div>
        <div class="admin-metric__num">${formatarNum(m.totalUsuarios)}</div>
        <div class="admin-metric__label">Usuários cadastrados</div>
      </div>
      <div class="admin-metric">
        <div class="admin-metric__icon">🟢</div>
        <div class="admin-metric__num">${formatarNum(m.ativosHoje)}</div>
        <div class="admin-metric__label">Ativos hoje</div>
      </div>
      <div class="admin-metric">
        <div class="admin-metric__icon">📝</div>
        <div class="admin-metric__num">${formatarNum(m.questoesAtivas)}</div>
        <div class="admin-metric__label">Questões ativas</div>
      </div>
      <div class="admin-metric">
        <div class="admin-metric__icon">🎯</div>
        <div class="admin-metric__num">${formatarNum(m.totalSessoes)}</div>
        <div class="admin-metric__label">Simulados realizados</div>
      </div>
    </div>
  `;
}

function formatarNum(n) {
  if (n == null) return '—';
  return n.toLocaleString('pt-BR');
}

async function renderTab() {
  const cont = document.getElementById('admin-content');
  if (!cont) return;

  if (estado.abaAtiva === 'concursos') {
    await renderAbaEditais();
    return;
  }
  if (estado.abaAtiva === 'questoes') {
    await renderQuestoes(cont);
  } else if (estado.abaAtiva === 'usuarios') {
    cont.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">👥</div>
        <h2 class="empty-state__title">Em breve</h2>
        <p class="empty-state__text">A listagem de usuários vai aparecer aqui.</p>
      </div>
    `;
  }
}

// ─────────── ABA: QUESTÕES ───────────

async function renderQuestoes(cont) {
  estado.questoes = await listarQuestoes({
    materia: estado.filtros.materia || null,
    busca: estado.filtros.busca || null,
    limite: 200,
  });

  cont.innerHTML = `
    <div class="admin-filters">
      <input class="admin-filters__search" id="adm-busca"
             placeholder="🔍 Buscar por tema ou texto..."
             value="${escapar(estado.filtros.busca)}">
      <select class="admin-filters__select" id="adm-materia">
        <option value="">Todas as matérias</option>
        ${MATERIAS.map(m => `
          <option value="${m.key}" ${estado.filtros.materia === m.key ? 'selected' : ''}>
            ${m.icone} ${m.nome}
          </option>
        `).join('')}
      </select>
      <button class="btn btn--primary" data-action="nova-questao">
        + Nova questão
      </button>
    </div>

    ${estado.questoes.length === 0 ? `
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
        <h2 class="empty-state__title">Nenhuma questão encontrada</h2>
        <p class="empty-state__text">Cadastre a primeira questão pra começar.</p>
      </div>
    ` : `
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Matéria</th>
              <th>Tema</th>
              <th>Texto</th>
              <th>Dif.</th>
              <th>Gabarito</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${estado.questoes.map(q => {
              const m = MATERIAS.find(x => x.key === q.materia);
              return `
                <tr>
                  <td>${m ? m.icone : ''} ${escapar(m?.nome?.split(' ')[0] || q.materia)}</td>
                  <td>${escapar(q.tema || '—')}</td>
                  <td class="admin-table__truncate">${escapar(q.texto || '')}</td>
                  <td><span class="badge badge--${q.dificuldade === 'Fácil' ? 'brand' : q.dificuldade === 'Difícil' ? 'danger' : 'warning'}">${escapar(q.dificuldade || 'Médio')}</span></td>
                  <td><strong>${q.gabarito}</strong></td>
                  <td>${q.ativo
                    ? '<span class="badge badge--brand">ativa</span>'
                    : '<span class="badge badge--neutral">inativa</span>'}</td>
                  <td style="white-space: nowrap;">
                    <button class="btn btn--ghost btn--sm" data-acao="editar" data-id="${q.id}">Editar</button>
                    ${q.ativo
                      ? `<button class="btn btn--danger btn--sm" data-acao="desativar" data-id="${q.id}">Desativar</button>`
                      : `<button class="btn btn--secondary btn--sm" data-acao="reativar" data-id="${q.id}">Reativar</button>`}
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `}
  `;
}

// ─────────── EDITOR DE QUESTÃO ───────────

async function abrirEditor(id = null) {
  let dados;
  if (id) {
    const q = await getQuestaoCompleta(id);
    if (!q) return toastErro('Questão não encontrada');
    dados = {
      id,
      materia: q.materia,
      tema: q.tema || '',
      dificuldade: q.dificuldade || 'Médio',
      texto: q.texto || '',
      assertivas: q.assertivas || '',
      opcoes: [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d, q.opcao_e || ''],
      gabarito: q.gabarito || 'A',
      comentario: q.comentario || '',
      ativo: q.ativo,
    };
  } else {
    dados = {
      id: null,
      materia: MATERIAS[0].key,
      tema: '',
      dificuldade: 'Médio',
      texto: '',
      assertivas: '',
      opcoes: ['', '', '', '', ''],
      gabarito: 'A',
      comentario: '',
      ativo: true,
    };
  }

  estado.editando = dados;
  renderEditor();

  document.getElementById('editor-overlay').classList.add('show');
  document.getElementById('editor-titulo').textContent = id ? 'Editar questão' : 'Nova questão';
}

function renderEditor() {
  const body = document.getElementById('editor-body');
  if (!body || !estado.editando) return;

  const d = estado.editando;

  body.innerHTML = `
    <div class="editor-row">
      <div class="field">
        <label class="field__label">Matéria</label>
        <select class="admin-filters__select" data-campo="materia" style="width:100%;">
          ${MATERIAS.map(m => `
            <option value="${m.key}" ${m.key === d.materia ? 'selected' : ''}>${m.icone} ${m.nome}</option>
          `).join('')}
        </select>
      </div>
      <div class="field">
        <label class="field__label">Dificuldade</label>
        <select class="admin-filters__select" data-campo="dificuldade" style="width:100%;">
          <option value="Fácil"   ${d.dificuldade === 'Fácil'   ? 'selected' : ''}>Fácil</option>
          <option value="Médio"   ${d.dificuldade === 'Médio'   ? 'selected' : ''}>Médio</option>
          <option value="Difícil" ${d.dificuldade === 'Difícil' ? 'selected' : ''}>Difícil</option>
        </select>
      </div>
    </div>

    <div class="field">
      <label class="field__label">Tema</label>
      <input class="field__input" data-campo="tema" type="text"
             placeholder="Ex: Hemograma" value="${escapar(d.tema)}">
    </div>

    <div class="field">
      <label class="field__label">Enunciado da questão</label>
      <textarea class="editor-textarea" data-campo="texto" rows="4"
                placeholder="Texto da questão...">${escapar(d.texto)}</textarea>
    </div>

    <div class="field">
      <label class="field__label">Assertivas (opcional · separadas por |)</label>
      <textarea class="editor-textarea" data-campo="assertivas" rows="3"
                placeholder="I. Primeira assertiva | II. Segunda | III. Terceira">${escapar(d.assertivas)}</textarea>
      <div class="field__hint">Use só se a questão tiver assertivas no formato I, II, III.</div>
    </div>

    <div class="field">
      <label class="field__label">Alternativas · clique no botão pra marcar a correta</label>
      <div class="editor-options">
        ${['A','B','C','D','E'].map((letra, i) => `
          <div class="editor-option">
            <button class="editor-option__radio ${d.gabarito === letra ? 'correct' : ''}"
                    data-gabarito="${letra}">${letra}</button>
            <input class="field__input" data-opcao="${i}" type="text"
                   placeholder="Alternativa ${letra}${i === 4 ? ' (opcional)' : ''}"
                   value="${escapar(d.opcoes[i] || '')}">
          </div>
        `).join('')}
      </div>
    </div>

    <div class="field">
      <label class="field__label">Comentário/Explicação (mostrado após responder)</label>
      <textarea class="editor-textarea" data-campo="comentario" rows="4"
                placeholder="Explicação da resposta...">${escapar(d.comentario)}</textarea>
    </div>

    <label class="auth__remember" style="margin-top: var(--space-4);">
      <input type="checkbox" data-campo-bool="ativo" ${d.ativo ? 'checked' : ''}>
      <span class="auth__remember-text">Questão ativa (visível pros alunos)</span>
    </label>
  `;
}

function fecharEditor() {
  document.getElementById('editor-overlay').classList.remove('show');
  estado.editando = null;
}

async function salvarQuestao() {
  const d = estado.editando;
  if (!d) return;

  // Validações
  if (!d.texto?.trim()) return toastErro('Informe o enunciado');
  if (!d.opcoes[0] || !d.opcoes[1]) return toastErro('Pelo menos 2 alternativas obrigatórias');
  if (!['A','B','C','D','E'].includes(d.gabarito)) return toastErro('Selecione o gabarito');

  // Verifica se a alternativa marcada como gabarito tem texto
  const idxGabarito = ['A','B','C','D','E'].indexOf(d.gabarito);
  if (!d.opcoes[idxGabarito]?.trim()) {
    return toastErro(`A alternativa ${d.gabarito} (gabarito) está vazia`);
  }

  const btn = document.getElementById('editor-salvar');
  btn.disabled = true;
  btn.querySelector('span')?.replaceWith(document.createTextNode('Salvando...'));

  try {
    let r;
    if (d.id) {
      r = await atualizarQuestao(d.id, d);
    } else {
      r = await criarQuestao(d);
    }

    if (!r.ok) {
      toastErro('Erro ao salvar: ' + (r.error?.message || 'desconhecido'));
      return;
    }

    toastSucesso(d.id ? '✅ Questão atualizada!' : '✅ Questão criada!');
    fecharEditor();
    await renderTab();
  } finally {
    btn.disabled = false;
    btn.textContent = '💾 Salvar';
  }
}

// ─────────── EVENTOS ───────────

let timerBusca = null;

function tratarClique(e) {
  // Editar/excluir concurso — funciona independente do guard de tela
  const editConc = e.target.closest('[data-edit-concurso]');
  if (editConc) { abrirEditorConcurso(editConc.dataset.editConcurso); return; }

  const delConc = e.target.closest('[data-del-concurso]');
  if (delConc) {
    if (confirm('Excluir este edital permanentemente?')) {
      excluirEdital(delConc.dataset.delConcurso).then(() => {
        toastSucesso('Edital excluído');
        renderAbaEditais();
      });
    }
    return;
  }

  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'adm') return;

  // Tabs
  const tabEl = e.target.closest('[data-aba]');
  if (tabEl) {
    estado.abaAtiva = tabEl.dataset.aba;
    document.querySelectorAll('.admin-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.aba === estado.abaAtiva);
    });
    renderTab();
    return;
  }

  // Ações da tabela
  const acaoTbl = e.target.closest('[data-acao]');
  if (acaoTbl) {
    const id = acaoTbl.dataset.id;
    const acao = acaoTbl.dataset.acao;
    if (acao === 'editar') return abrirEditor(id);
    if (acao === 'desativar') return acaoDesativar(id);
    if (acao === 'reativar') return acaoReativar(id);
  }

  // Editor: gabarito
  const gabaritoEl = e.target.closest('[data-gabarito]');
  if (gabaritoEl && estado.editando) {
    estado.editando.gabarito = gabaritoEl.dataset.gabarito;
    document.querySelectorAll('[data-gabarito]').forEach(b => {
      b.classList.toggle('correct', b.dataset.gabarito === estado.editando.gabarito);
    });
    return;
  }

  // Outras ações
  const acao = e.target.closest('[data-action]')?.dataset.action;
  if (!acao) return;

  switch (acao) {
    case 'atualizar':         popular(); toast('Atualizando...'); break;
    case 'nova-questao':      abrirEditor(); break;
    case 'fechar-editor':     fecharEditor(); break;
    case 'salvar-questao':    salvarQuestao(); break;
    case 'novo-concurso':     abrirEditorConcurso(null); break;
    case 'fechar-concurso':   fecharEditorConcurso(); break;
    case 'salvar-concurso':   salvarConcurso(); break;
  }
}

function tratarInput(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'adm') return;

  // Filtros
  if (e.target?.id === 'adm-busca') {
    clearTimeout(timerBusca);
    timerBusca = setTimeout(() => {
      estado.filtros.busca = e.target.value;
      renderTab();
    }, 300);
    return;
  }
  if (e.target?.id === 'adm-materia') {
    estado.filtros.materia = e.target.value;
    renderTab();
    return;
  }

  // Editor — campos
  if (estado.editando) {
    if (e.target.dataset?.campo) {
      estado.editando[e.target.dataset.campo] = e.target.value;
      return;
    }
    if (e.target.dataset?.campoBool) {
      estado.editando[e.target.dataset.campoBool] = e.target.checked;
      return;
    }
    if (e.target.dataset?.opcao !== undefined) {
      const i = parseInt(e.target.dataset.opcao, 10);
      estado.editando.opcoes[i] = e.target.value;
      return;
    }
  }
}

async function acaoDesativar(id) {
  if (!confirm('Desativar essa questão? Ela some pros alunos mas pode ser reativada depois.')) return;
  const r = await desativarQuestao(id);
  if (r.ok) {
    toastSucesso('Questão desativada');
    await renderTab();
  } else toastErro('Erro ao desativar');
}

async function acaoReativar(id) {
  const r = await reativarQuestao(id);
  if (r.ok) {
    toastSucesso('Questão reativada');
    await renderTab();
  } else toastErro('Erro ao reativar');
}

function escapar(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ════════════════════════════════════════════════════════════
// CONCURSOS — CRUD no admin
// ════════════════════════════════════════════════════════════

let editandoConcurso = null; // null | id do edital sendo editado

async function renderAbaEditais() {
  const cont = document.getElementById('admin-content');
  cont.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-tertiary)">Carregando editais...</div>`;

  const editais = await listarTodosEditais();

  const linhas = editais.map(e => `
    <tr>
      <td style="font-weight:600">${esc(e.titulo)}</td>
      <td><span class="badge ${e.tipo === 'residencia' ? 'badge--info' : 'badge--default'}">${e.tipo === 'residencia' ? '🏥 Residência' : '🏛 Concurso'}</span></td>
      <td>${esc(e.banca || '—')}</td>
      <td><span class="badge ${e.status === 'aberto' ? 'badge--success' : e.status === 'encerrado' ? 'badge--danger' : 'badge--warning'}">${esc(e.status)}</span></td>
      <td>${e.data_prova ? new Date(e.data_prova).toLocaleDateString('pt-BR') : '—'}</td>
      <td>
        <button class="btn btn--sm" data-edit-concurso="${e.id}" style="margin-right:4px">✏️ Editar</button>
        <button class="btn btn--sm btn--danger" data-del-concurso="${e.id}">🗑 Excluir</button>
      </td>
    </tr>
  `).join('');

  cont.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-4)">
      <span style="color:var(--text-tertiary);font-size:var(--fs-sm)">${editais.length} edital(is) cadastrado(s)</span>
      <button class="btn btn--primary" data-action="novo-concurso">+ Novo concurso</button>
    </div>
    <div class="tbl-wrap">
      <table class="tbl">
        <thead><tr>
          <th>Título</th><th>Tipo</th><th>Banca</th><th>Status</th><th>Data prova</th><th>Ações</th>
        </tr></thead>
        <tbody>${linhas || '<tr><td colspan="6" style="text-align:center;padding:32px;color:var(--text-tertiary)">Nenhum edital cadastrado ainda.</td></tr>'}</tbody>
      </table>
    </div>
    <!-- Overlay do editor de concurso -->
    <div id="editor-concurso-overlay" class="editor-overlay">
      <div class="editor-modal" style="max-width:700px;max-height:90vh;overflow-y:auto">
        <div class="editor-modal__header">
          <h2 class="editor-modal__title" id="editor-concurso-titulo">Novo concurso</h2>
          <button class="editor-modal__close" data-action="fechar-concurso">✕</button>
        </div>
        <div class="editor-modal__body" id="editor-concurso-body"></div>
        <div class="editor-modal__footer">
          <button class="btn btn--ghost" data-action="fechar-concurso">Cancelar</button>
          <button class="btn btn--primary" data-action="salvar-concurso">💾 Salvar</button>
        </div>
      </div>
    </div>
  `;
}

function abrirEditorConcurso(id) {
  editandoConcurso = id;
  const overlay = document.getElementById('editor-concurso-overlay');
  const titulo = document.getElementById('editor-concurso-titulo');
  const body = document.getElementById('editor-concurso-body');
  if (!overlay || !body) return;

  titulo.textContent = id ? 'Editar concurso' : 'Novo concurso';

  // Buscar dados se editando
  listarTodosEditais().then(lista => {
    const e = id ? lista.find(x => x.id === id) : {};
    const distribStr = e.distribuicao ? JSON.stringify(e.distribuicao, null, 2) : '[]';
    const cronoStr = e.cronograma ? JSON.stringify(e.cronograma, null, 2) : '[]';

    body.innerHTML = `
      <!-- Seção 1: Identificação -->
      <div class="ec-section">
        <div class="ec-section__title">🏛 Identificação</div>
        <div class="ec-grid ec-grid--2">
          <div class="editor-field">
            <label class="editor-label">Tipo *</label>
            <select id="ec-tipo" class="editor-input ec-select">
              <option value="concurso" ${e.tipo === 'concurso' ? 'selected' : ''}>🏛 Concurso Público</option>
              <option value="residencia" ${e.tipo === 'residencia' ? 'selected' : ''}>🏥 Residência Veterinária</option>
            </select>
          </div>
          <div class="editor-field">
            <label class="editor-label">Status *</label>
            <select id="ec-status" class="editor-input ec-select">
              <option value="aberto" ${e.status === 'aberto' ? 'selected' : ''}>🟢 Aberto</option>
              <option value="previsto" ${e.status === 'previsto' || !e.status ? 'selected' : ''}>🟡 Previsto</option>
              <option value="encerrado" ${e.status === 'encerrado' ? 'selected' : ''}>⚫ Encerrado</option>
            </select>
          </div>
        </div>
        <div class="editor-field">
          <label class="editor-label">Título *</label>
          <input id="ec-titulo" class="editor-input" type="text" value="${esc(e.titulo || '')}" placeholder="Ex: MAPA — Auditor Fiscal Federal Agropecuário">
        </div>
        <div class="ec-grid ec-grid--2">
          <div class="editor-field">
            <label class="editor-label">Órgão</label>
            <input id="ec-orgao" class="editor-input" type="text" value="${esc(e.orgao || '')}" placeholder="Ex: Ministério da Agricultura">
          </div>
          <div class="editor-field">
            <label class="editor-label">Banca</label>
            <input id="ec-banca" class="editor-input" type="text" value="${esc(e.banca || '')}" placeholder="Ex: CEBRASPE, VUNESP, IBFC">
          </div>
        </div>
      </div>

      <!-- Seção 2: Dados do concurso -->
      <div class="ec-section">
        <div class="ec-section__title">📋 Dados do Concurso</div>
        <div class="ec-grid ec-grid--3">
          <div class="editor-field">
            <label class="editor-label">Vagas</label>
            <input id="ec-vagas" class="editor-input" type="text" value="${esc(e.vagas || '')}" placeholder="Ex: 340">
          </div>
          <div class="editor-field">
            <label class="editor-label">Salário / Bolsa</label>
            <input id="ec-salario" class="editor-input" type="text" value="${esc(e.salario || '')}" placeholder="Ex: R$ 16.324">
          </div>
          <div class="editor-field">
            <label class="editor-label">Corte médio (%)</label>
            <input id="ec-corte" class="editor-input" type="number" min="0" max="100" value="${e.corte_medio || 65}">
          </div>
        </div>
        <div class="ec-grid ec-grid--2">
          <div class="editor-field">
            <label class="editor-label">📅 Data da prova</label>
            <input id="ec-data-prova" class="editor-input" type="date" value="${e.data_prova || ''}">
          </div>
          <div class="editor-field">
            <label class="editor-label">🏷 Tags (vírgula)</label>
            <input id="ec-tags" class="editor-input" type="text" value="${(e.tags || []).join(', ')}" placeholder="Inspeção, Legislação, Saúde Pública">
          </div>
        </div>
      </div>

      <!-- Seção 3: Descrição -->
      <div class="ec-section">
        <div class="ec-section__title">💡 Sobre a Banca</div>
        <div class="editor-field" style="margin-bottom:0">
          <textarea id="ec-banca-info" class="editor-input" rows="3" placeholder="Descreva o estilo de prova, foco temático e dicas para essa banca...">${esc(e.sobre_banca || '')}</textarea>
        </div>
      </div>

      <!-- Seção 4: Links -->
      <div class="ec-section">
        <div class="ec-section__title">🔗 Links</div>
        <div class="ec-grid ec-grid--2">
          <div class="editor-field">
            <label class="editor-label">📥 Edital (PDF)</label>
            <input id="ec-link-edital" class="editor-input" type="url" value="${esc(e.link_edital || '')}" placeholder="https://...">
          </div>
          <div class="editor-field">
            <label class="editor-label">🌐 Site oficial</label>
            <input id="ec-link-site" class="editor-input" type="url" value="${esc(e.link_site || '')}" placeholder="https://...">
          </div>
        </div>
      </div>

      <!-- Seção 5: Distribuição da prova -->
      <div class="ec-section">
        <div class="ec-section__title">📊 Distribuição da Prova</div>
        <div class="ec-json-hint">
          <span class="ec-json-hint__icon">💡</span>
          <span>Array JSON com os campos: <code>materia</code>, <code>emoji</code>, <code>qtd</code> (nº questões), <code>peso</code> (%)</span>
        </div>
        <div class="ec-json-example">Exemplo: <code>[{"materia":"Inspeção de POA","emoji":"🥛","qtd":15,"peso":30}]</code></div>
        <textarea id="ec-distribuicao" class="editor-input ec-textarea-json" rows="6" placeholder='[
  {"materia":"Inspeção de POA","emoji":"🥛","qtd":15,"peso":30},
  {"materia":"Legislação","emoji":"📜","qtd":12,"peso":24}
]'>${esc(distribStr)}</textarea>
      </div>

      <!-- Seção 6: Cronograma -->
      <div class="ec-section">
        <div class="ec-section__title">📅 Cronograma Sugerido</div>
        <div class="ec-json-hint">
          <span class="ec-json-hint__icon">💡</span>
          <span>Array JSON com: <code>semana</code>, <code>titulo</code>, <code>sub</code> (descrição), <code>pct</code> (% concluído)</span>
        </div>
        <div class="ec-json-example">Exemplo: <code>[{"semana":"S1","titulo":"Inspeção + Legislação","sub":"40 questões/dia","pct":0}]</code></div>
        <textarea id="ec-cronograma" class="editor-input ec-textarea-json" rows="5" placeholder='[
  {"semana":"S1","titulo":"Foco em Inspeção","sub":"40 questões/dia","pct":0}
]'>${esc(cronoStr)}</textarea>
      </div>
    `;
    overlay.classList.add('show');
  });
}

function fecharEditorConcurso() {
  const overlay = document.getElementById('editor-concurso-overlay');
  if (overlay) overlay.classList.remove('show');
  editandoConcurso = null;
}

async function salvarConcurso() {
  const titulo = document.getElementById('ec-titulo')?.value.trim();
  if (!titulo) { toastErro('Título obrigatório'); return; }

  let distribuicao = [];
  let cronograma = [];
  try { distribuicao = JSON.parse(document.getElementById('ec-distribuicao').value || '[]'); } catch { toastErro('JSON da distribuição inválido'); return; }
  try { cronograma = JSON.parse(document.getElementById('ec-cronograma').value || '[]'); } catch { toastErro('JSON do cronograma inválido'); return; }

  const tagsRaw = document.getElementById('ec-tags')?.value || '';
  const tags = tagsRaw.split(',').map(t => t.trim()).filter(Boolean);

  const dados = {
    tipo:        document.getElementById('ec-tipo')?.value || 'concurso',
    titulo,
    orgao:       document.getElementById('ec-orgao')?.value.trim() || '',
    banca:       document.getElementById('ec-banca')?.value.trim() || '',
    salario:     document.getElementById('ec-salario')?.value.trim() || '',
    vagas:       document.getElementById('ec-vagas')?.value.trim() || '',
    status:      document.getElementById('ec-status')?.value || 'previsto',
    data_prova:  document.getElementById('ec-data-prova')?.value || null,
    corte_medio: parseFloat(document.getElementById('ec-corte')?.value) || 65,
    sobre_banca: document.getElementById('ec-banca-info')?.value.trim() || '',
    link_edital: document.getElementById('ec-link-edital')?.value.trim() || '',
    link_site:   document.getElementById('ec-link-site')?.value.trim() || '',
    tags,
    distribuicao,
    cronograma,
    ativo: true,
  };

  const btn = document.querySelector('[data-action="salvar-concurso"]');
  if (btn) btn.disabled = true;

  let result;
  if (editandoConcurso) {
    result = await atualizarEdital(editandoConcurso, dados);
  } else {
    result = await criarEdital(dados);
  }

  if (btn) btn.disabled = false;

  if (result.error) {
    toastErro('Erro ao salvar: ' + (result.error.message || ''));
    return;
  }

  toastSucesso(editandoConcurso ? 'Edital atualizado!' : 'Edital criado!');
  fecharEditorConcurso();
  await renderAbaEditais();
}

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
