// ============================================================
// CONCURSOS — Template + Controller
// Lista editais do Supabase. Detalhe com distribuição + cronograma.
// ============================================================

import { carregarEditais, calcularDiasAteProva } from '../../data/editais.repo.js';
import { ir, aoEntrar } from '../../core/router.js';
import { carregarQuestoes, getQuestoesPorMateria, MATERIAS } from '../../data/questoes.repo.js';
// Funções de questões de concurso (inline até o repo ser criado no GitHub)
async function carregarQuestoesConcurso(edital_id, { cargo, ano } = {}) {
  try {
    const { sb } = await import('../../data/client.js');
    let query = sb.from('questoes_concurso').select('*')
      .eq('edital_id', edital_id).eq('ativo', true).order('numero', { ascending: true });
    if (cargo) query = query.eq('cargo', cargo);
    if (ano && ano !== 2024) query = query.eq('ano', ano); // só filtra se não for o default
    const { data, error } = await query;
    if (error) { console.error('questoes_concurso:', error); return []; }
    return data || [];
  } catch(e) { console.error(e); return []; }
}

async function listarProvasDisponiveis(edital_id) {
  try {
    const { sb } = await import('../../data/client.js');
    const { data, error } = await sb.from('questoes_concurso')
      .select('ano, cargo, disciplina').eq('edital_id', edital_id).eq('ativo', true);
    if (error) { console.error('listarProvas:', error); return []; }
    const map = {};
    for (const row of (data || [])) {
      const ano = row.ano || 2024;
      const key = `${ano}__${row.cargo || 'Geral'}`;
      if (!map[key]) map[key] = { ano, cargo: row.cargo || 'Geral', total: 0, disciplinasSet: new Set() };
      map[key].total++;
      if (row.disciplina) map[key].disciplinasSet.add(row.disciplina);
    }
    return Object.values(map)
      .map(p => ({ ...p, disciplinas: [...p.disciplinasSet] }))
      .sort((a, b) => b.ano - a.ano || (a.cargo || '').localeCompare(b.cargo || ''));
  } catch(e) { console.error(e); return []; }
}

// vista: 'lista' | 'detalhe' | 'caderno' | 'prova'
let estado = { vista: 'lista', editalAtivo: null, filtro: 'todos', provaAtiva: null };

export function concursosTemplate() {
  return `
    <div id="concursos" class="screen">
      <div class="ph">
        <div class="ph-left"><h2>🏛 Concursos e Residências</h2><p>Editais abertos · simulados calibrados por banca</p></div>
        <div class="ph-right"><button class="btn btn-sm" id="conc-btn-voltar" style="display:none" data-action="conc-voltar">← Voltar</button></div>
      </div>
      <div class="pg-scroll" id="conc-scroll"></div>
    </div>
  `;
}

export function montarConcursos() {
  aoEntrar('concursos', iniciar);
  document.addEventListener('click', tratarClique);
}

async function iniciar() {
  estado.vista = 'lista';
  estado.editalAtivo = null;
  await renderLista();
}

async function renderLista() {
  const cont = document.getElementById('conc-scroll');
  if (!cont) return;
  const editais = await carregarEditais();

  if (!editais.length) {
    cont.innerHTML = '<div class="empty"><div class="empty__icon">🏛</div><h2 class="empty__title">Nenhum edital cadastrado</h2><p class="empty__text">Editais aparecerão aqui quando forem adicionados pelo admin.</p></div>';
    return;
  }

  const filtrados = estado.filtro === 'todos' ? editais
    : estado.filtro === 'concurso' ? editais.filter(e => e.tipo === 'concurso')
    : estado.filtro === 'residencia' ? editais.filter(e => e.tipo === 'residencia')
    : estado.filtro === 'aberto' ? editais.filter(e => e.status === 'aberto')
    : editais;

  const abertos = editais.filter(e => e.status === 'aberto').length;
  const stats = `
    <div class="stats-grid animate-in" style="grid-template-columns:repeat(3,1fr);margin-bottom:20px">
      <div class="stat-card" style="padding:14px"><div class="stat-card__val" style="font-size:20px">${editais.length}</div><div class="stat-card__label">Editais</div></div>
      <div class="stat-card" style="padding:14px"><div class="stat-card__val" style="font-size:20px;color:var(--accent)">${abertos}</div><div class="stat-card__label">Abertos</div></div>
      <div class="stat-card" style="padding:14px"><div class="stat-card__val" style="font-size:20px;color:var(--yellow)">${editais.filter(e => e.status === 'previsto').length}</div><div class="stat-card__label">Previstos</div></div>
    </div>
  `;

  const chips = `
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px" class="animate-in">
      ${['todos','concurso','residencia','aberto'].map(f =>
        `<button class="chip ${estado.filtro === f ? 'active' : ''}" data-filtro-conc="${f}">${
          f === 'todos' ? 'Todos' : f === 'concurso' ? '🏛 Concursos' : f === 'residencia' ? '🏥 Residências' : '📋 Abertos'
        }</button>`
      ).join('')}
    </div>
  `;

  const cards = filtrados.map(e => {
    const dias = calcularDiasAteProva(e.data_prova);
    const statusBadge = e.status === 'aberto' ? '<span class="badge badge-green">Aberto</span>'
      : e.status === 'previsto' ? '<span class="badge badge-yellow">Previsto</span>'
      : '<span class="badge badge-neutral">Encerrado</span>';
    const tipoLabel = e.tipo === 'residencia' ? '🏥 Residência' : '🏛 Concurso Público';
    const countdown = dias !== null && dias > 0
      ? `<span style="color:var(--yellow);font-weight:700;font-size:12px">⏰ ${dias} dias</span>`
      : e.data_prova ? `<span style="color:var(--text3);font-size:11px">Prova: ${new Date(e.data_prova).toLocaleDateString('pt-BR')}</span>` : '';

    const tags = (e.tags || []).slice(0, 3).map(t =>
      `<span class="badge badge-blue" style="font-size:9px">${esc(t)}</span>`
    ).join('');

    return `
      <div class="card" style="cursor:pointer;margin-bottom:12px" data-edital-id="${e.id}">
        <div class="card-body">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">
            <div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px">${tipoLabel}</div>
            ${statusBadge}
          </div>
          <div style="font-size:16px;font-weight:800;margin-bottom:8px;line-height:1.3">${esc(e.titulo)}</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text2);margin-bottom:10px">
            ${e.banca ? `<span>🏢 <strong>${esc(e.banca)}</strong></span>` : ''}
            ${e.salario ? `<span>💰 <strong>${esc(e.salario)}</strong></span>` : ''}
            ${e.vagas ? `<span>📋 <strong>${esc(e.vagas)} vagas</strong></span>` : ''}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">${tags}</div>
          <div style="display:flex;align-items:center;justify-content:space-between;padding-top:10px;border-top:1px solid var(--border)">
            ${countdown}
            <button class="btn btn-accent btn-sm">Ver edital →</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  cont.innerHTML = `${stats}${chips}<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px" class="animate-in delay-1">${cards}</div>`;
  document.getElementById('conc-btn-voltar').style.display = 'none';
}

async function renderDetalhe(id) {
  const cont = document.getElementById('conc-scroll');
  const e = (await carregarEditais()).find(x => x.id === id);
  if (!e) return;
  estado.editalAtivo = e;
  const dias = calcularDiasAteProva(e.data_prova);
  const distrib = e.distribuicao || [];
  const crono   = e.cronograma  || [];
  const temEdital  = !!e.link_edital;
  const temSite    = !!e.link_site;
  const temDistrib = distrib.length > 0;
  const totalQ     = distrib.reduce((a, d) => a + (d.qtd || 0), 0);

  cont.innerHTML = `
    <!-- HERO -->
    <div class="card animate-in" style="margin-bottom:16px;border-left:3px solid var(--accent)">
      <div class="card-body" style="background:linear-gradient(135deg,rgba(18,135,108,.04),var(--bg-3))">
        <div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px">${e.tipo === 'residencia' ? '🏥 Residência' : '🏛 Concurso Público'}</div>
        <div style="font-size:20px;font-weight:900;margin-bottom:10px;line-height:1.3">${esc(e.titulo)}</div>
        <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:11px;color:var(--text-secondary)">
          ${e.banca   ? `<span>🏢 <strong>${esc(e.banca)}</strong></span>`   : ''}
          ${e.salario ? `<span>💰 <strong>${esc(e.salario)}</strong></span>` : ''}
          ${e.vagas   ? `<span>📋 <strong>${esc(e.vagas)} vagas</strong></span>` : ''}
          ${e.data_prova ? `<span>📅 <strong style="color:var(--yellow)">${new Date(e.data_prova).toLocaleDateString('pt-BR')}</strong></span>` : ''}
          ${dias !== null ? `<span style="color:var(--yellow);font-weight:700">⏰ ${dias} dias</span>` : ''}
        </div>
      </div>
    </div>

    <!-- BOTÕES DE AÇÃO -->
    <div class="conc-acoes animate-in delay-1">

      <div class="conc-acoes__grupo">
        <div class="conc-acoes__label">📖 Provas Anteriores</div>
        <button class="conc-btn conc-btn--destaque" data-action="abrir-caderno">
          <span class="conc-btn__icon">📖</span>
          <div class="conc-btn__info">
            <span class="conc-btn__text">Caderno de Questões Anteriores</span>
            <span class="conc-btn__sub">Acesse as provas completas por ano e cargo</span>
          </div>
          <span class="conc-btn__arrow" style="margin-left:auto;color:var(--accent);font-size:16px">→</span>
        </button>
      </div>

      <div class="conc-acoes__grupo">
        <div class="conc-acoes__label">🎯 Simular</div>
        <button class="conc-btn${temDistrib ? '' : ' conc-btn--disabled'}" data-action="sim-aleatorio">
          <span class="conc-btn__icon">🎲</span>
          <div class="conc-btn__info">
            <span class="conc-btn__text">Simular prova aleatória</span>
            <span class="conc-btn__sub">${temDistrib ? 'Questões aleatórias · respeita distribuição' : 'Distribuição não cadastrada'}</span>
          </div>
        </button>
      </div>

      <div class="conc-acoes__grupo">
        <div class="conc-acoes__label">📚 Estudar</div>
        <button class="conc-btn" data-action="questoes-assunto">
          <span class="conc-btn__icon">📚</span>
          <div class="conc-btn__info">
            <span class="conc-btn__text">Questões por assunto</span>
            <span class="conc-btn__sub">Banco filtrado pelas matérias do edital</span>
          </div>
        </button>
      </div>

      <div class="conc-acoes__grupo">
        <div class="conc-acoes__label">📄 Documentos</div>
        <button class="conc-btn${temEdital ? '' : ' conc-btn--disabled'}" data-action="abrir-edital">
          <span class="conc-btn__icon">📄</span>
          <div class="conc-btn__info">
            <span class="conc-btn__text">Edital anexado</span>
            <span class="conc-btn__sub">${temEdital ? 'Abrir PDF em nova aba' : 'Link não cadastrado'}</span>
          </div>
        </button>
        <button class="conc-btn${temSite ? '' : ' conc-btn--disabled'}" data-action="abrir-site">
          <span class="conc-btn__icon">🌐</span>
          <div class="conc-btn__info">
            <span class="conc-btn__text">Site oficial</span>
            <span class="conc-btn__sub">${temSite ? 'Abrir em nova aba' : 'Link não cadastrado'}</span>
          </div>
        </button>
      </div>

    </div>

    <!-- SOBRE A BANCA -->
    ${e.sobre_banca ? `
      <div class="card animate-in delay-2" style="margin-bottom:16px;border-left:3px solid var(--blue)">
        <div class="card-body">
          <div style="font-size:10px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">💡 Sobre a banca · ${esc(e.banca || '')}</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.75">${esc(e.sobre_banca)}</div>
        </div>
      </div>
    ` : ''}

    <!-- DISTRIBUIÇÃO -->
    ${distrib.length ? `
      <div class="section-label animate-in delay-2">📊 Distribuição da prova</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:8px;margin-bottom:20px" class="animate-in delay-2">
        ${distrib.map(d => `
          <div style="display:flex;align-items:center;gap:10px;background:var(--bg-2);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:10px 14px">
            <span style="font-size:18px">${d.emoji || '📌'}</span>
            <span style="font-size:12px;font-weight:600;flex:1">${esc(d.materia)}</span>
            <div style="width:60px;height:4px;background:var(--bg-4);border-radius:99px;overflow:hidden;flex-shrink:0">
              <div style="height:100%;width:${Math.min(100, d.peso)}%;background:var(--accent);border-radius:99px"></div>
            </div>
            <span style="font-family:var(--mono);font-size:11px;font-weight:700;color:var(--accent);flex-shrink:0">${d.qtd}q</span>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- CRONOGRAMA -->
    ${crono.length ? `
      <div class="section-label animate-in delay-3">📅 Cronograma sugerido${dias ? ` · ${dias} dias` : ''}</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px" class="animate-in delay-3">
        ${crono.map(c => `
          <div style="background:var(--bg-2);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:12px 16px;display:flex;align-items:center;gap:14px">
            <div style="width:36px;height:36px;border-radius:var(--radius-sm);background:${c.pct >= 100 ? 'rgba(18,135,108,.1)' : 'var(--bg-4)'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:${c.pct >= 100 ? 'var(--accent)' : 'var(--text-tertiary)'};flex-shrink:0">${esc(c.semana)}</div>
            <div style="flex:1"><div style="font-size:12px;font-weight:700;margin-bottom:2px">${esc(c.titulo)}</div><div style="font-size:10px;color:var(--text-tertiary)">${esc(c.sub)}</div></div>
            <div style="font-family:var(--mono);font-size:13px;font-weight:700;color:${c.pct >= 100 ? 'var(--accent)' : c.pct > 0 ? 'var(--yellow)' : 'var(--text-tertiary)'}">${c.pct}%</div>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <!-- PAINEL QUESTÕES POR ASSUNTO -->
    <div id="conc-questoes-assunto" style="display:none"></div>
  `;

  document.getElementById('conc-btn-voltar').style.display = '';
  cont.scrollTo(0, 0);
}

function tratarClique(e) {
  // Filtros
  const filtro = e.target.closest('[data-filtro-conc]');
  if (filtro) { estado.filtro = filtro.dataset.filtroConc; renderLista(); return; }

  // Card de edital
  const editalCard = e.target.closest('[data-edital-id]');
  if (editalCard && !e.target.closest('.btn')) { renderDetalhe(editalCard.dataset.editalId); return; }

  // Botão ver edital dentro do card
  if (e.target.closest('.btn-accent') && e.target.closest('[data-edital-id]')) {
    const card = e.target.closest('[data-edital-id]');
    renderDetalhe(card.dataset.editalId); return;
  }

  const acao = e.target.closest('[data-action]')?.dataset.action;
  if (!acao) return;
  if (acao === 'conc-voltar')      { estado.vista = 'lista'; renderLista(); return; }
  if (acao === 'voltar-detalhe')   { renderDetalhe(estado.editalAtivo.id); return; }
  if (acao === 'abrir-caderno')    { abrirCaderno(); return; }
  if (acao === 'iniciar-prova')    {
    const btn = e.target.closest('[data-action="iniciar-prova"]');
    iniciarProva(btn?.dataset.ano, btn?.dataset.cargo); return;
  }
  if (acao === 'sim-ponderado')    { simularPonderado(); return; }
  if (acao === 'sim-aleatorio')    { simularAleatorio(); return; }
  if (acao === 'questoes-assunto') { mostrarQuestoesAssunto(); return; }
  if (acao === 'abrir-edital') {
    const url = estado.editalAtivo?.link_edital;
    if (url) window.open(url, '_blank'); return;
  }
  if (acao === 'abrir-site') {
    const url = estado.editalAtivo?.link_site;
    if (url) window.open(url, '_blank'); return;
  }
}

// ── MAPEAMENTO: nome da matéria do edital → key do banco ──
const MAPA_MATERIAS = {
  'inspeção de poa': 'inspecaoleite',
  'inspeção': 'inspecaoleite',
  'leite': 'inspecaoleite',
  'análises clínicas': 'analisesclinicas',
  'análises': 'analisesclinicas',
  'patologia': 'patologia',
  'farmacologia': 'farmacologia',
  'semiologia': 'semiologia',
  'zootecnia': 'zootecnia',
  'aquicultura': 'aquicultura',
};

function resolverKey(nomeMat) {
  const lower = (nomeMat || '').toLowerCase().trim();
  // busca direta
  if (MAPA_MATERIAS[lower]) return MAPA_MATERIAS[lower];
  // busca parcial
  for (const [k, v] of Object.entries(MAPA_MATERIAS)) {
    if (lower.includes(k) || k.includes(lower)) return v;
  }
  return null;
}

async function simularPonderado() {
  const e = estado.editalAtivo;
  const distrib = e?.distribuicao;
  if (!distrib?.length) { toast('Cadastre a distribuição da prova no admin.'); return; }

  await carregarQuestoes();
  const questoesSelecionadas = [];

  for (const d of distrib) {
    const key = resolverKey(d.materia);
    if (!key) continue;
    const qs = await getQuestoesPorMateria(key);
    // Pegar exatamente d.qtd questões embaralhadas
    const shuffled = qs.sort(() => Math.random() - 0.5).slice(0, d.qtd || 0);
    questoesSelecionadas.push(...shuffled);
  }

  if (!questoesSelecionadas.length) {
    toast('Nenhuma questão encontrada para as matérias deste edital.');
    return;
  }

  sessionStorage.setItem('ev_quiz_config', JSON.stringify({
    modo: 'concurso-ponderado',
    titulo: e.titulo,
    questoes: questoesSelecionadas.map(q => q.id),
    qtd: questoesSelecionadas.length,
  }));
  ir('quiz');
}

async function simularAleatorio() {
  const e = estado.editalAtivo;
  const distrib = e?.distribuicao;
  if (!distrib?.length) { toast('Cadastre a distribuição da prova no admin.'); return; }

  await carregarQuestoes();
  const questoesSelecionadas = [];
  const total = distrib.reduce((a, d) => a + (d.qtd || 0), 0) || 30;

  // Sortear proporcional ao peso de cada matéria
  for (const d of distrib) {
    const key = resolverKey(d.materia);
    if (!key) continue;
    const qs = await getQuestoesPorMateria(key);
    const qtdSortear = Math.max(1, Math.round((d.peso / 100) * total));
    const shuffled = qs.sort(() => Math.random() - 0.5).slice(0, qtdSortear);
    questoesSelecionadas.push(...shuffled);
  }

  if (!questoesSelecionadas.length) {
    toast('Nenhuma questão encontrada para as matérias deste edital.');
    return;
  }

  // Embaralhar o conjunto final
  questoesSelecionadas.sort(() => Math.random() - 0.5);

  sessionStorage.setItem('ev_quiz_config', JSON.stringify({
    modo: 'concurso-aleatorio',
    titulo: e.titulo,
    questoes: questoesSelecionadas.map(q => q.id),
    qtd: questoesSelecionadas.length,
  }));
  ir('quiz');
}

async function mostrarQuestoesAssunto() {
  const e = estado.editalAtivo;
  const distrib = e?.distribuicao;
  const painel = document.getElementById('conc-questoes-assunto');
  if (!painel) return;

  // Toggle: se já está aberto, fecha
  if (painel.style.display !== 'none') {
    painel.style.display = 'none';
    return;
  }

  painel.style.display = '';
  painel.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-tertiary)">Carregando questões...</div>';

  await carregarQuestoes();

  // Se tem distribuição, filtrar pelas matérias do edital
  const keysEdital = distrib?.length
    ? [...new Set(distrib.map(d => resolverKey(d.materia)).filter(Boolean))]
    : MATERIAS.map(m => m.key);

  let html = '<div class="section-label" style="margin-top:20px">📚 Questões por assunto · ' + esc(e.titulo) + '</div>';

  for (const key of keysEdital) {
    const qs = await getQuestoesPorMateria(key);
    if (!qs.length) continue;

    const mat = MATERIAS.find(m => m.key === key);
    // Agrupar por tema
    const porTema = {};
    for (const q of qs) {
      const tema = q.tema || 'Geral';
      if (!porTema[tema]) porTema[tema] = [];
      porTema[tema].push(q);
    }

    html += `
      <div style="margin-bottom:16px">
        <div style="font-size:13px;font-weight:800;color:var(--accent);margin-bottom:8px;display:flex;align-items:center;gap:6px">
          ${mat?.icone || '📌'} ${mat?.nome || key}
          <span style="font-size:10px;font-weight:400;color:var(--text-tertiary);font-family:var(--mono)">${qs.length} questões</span>
        </div>
        ${Object.entries(porTema).map(([tema, questoes]) => `
          <details style="margin-bottom:6px">
            <summary style="cursor:pointer;background:var(--bg-2);border:1px solid var(--border-default);border-radius:var(--radius-sm);padding:10px 14px;list-style:none;display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:600">
              <span>${esc(tema)}</span>
              <span style="font-size:10px;color:var(--text-tertiary);font-family:var(--mono)">${questoes.length}q</span>
            </summary>
            <div style="border:1px solid var(--border-subtle);border-top:none;border-radius:0 0 var(--radius-sm) var(--radius-sm);overflow:hidden">
              ${questoes.map((q, i) => `
                <div style="padding:10px 14px;border-bottom:1px solid var(--border-subtle);display:flex;gap:10px;align-items:flex-start">
                  <span style="font-size:10px;font-family:var(--mono);color:var(--text-tertiary);flex-shrink:0;padding-top:2px">${i + 1}</span>
                  <span style="font-size:12px;line-height:1.6;color:var(--text-secondary);flex:1">${esc(q.texto?.slice(0, 120) || '')}${(q.texto?.length || 0) > 120 ? '…' : ''}</span>
                  <button class="btn btn--sm" style="flex-shrink:0;font-size:10px"
                    onclick="sessionStorage.setItem('ev_quiz_config', JSON.stringify({modo:'questao',questoes:['${q.id}']})); window.location.hash='quiz'">
                    Praticar
                  </button>
                </div>
              `).join('')}
            </div>
          </details>
        `).join('')}
      </div>
    `;
  }

  painel.innerHTML = html;
  painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ─── CADERNO DE QUESTÕES ANTERIORES ──────────────────────────────────────────

async function abrirCaderno() {
  const e = estado.editalAtivo;
  if (!e) return;
  const cont = document.getElementById('conc-scroll');
  cont.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary)">Carregando provas…</div>';
  document.getElementById('conc-btn-voltar').style.display = '';

  const provas = await listarProvasDisponiveis(e.id);
  estado.vista = 'caderno';

  cont.innerHTML = `
    <div class="card animate-in" style="margin-bottom:16px;border-left:3px solid var(--accent)">
      <div class="card-body">
        <div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1.2px;margin-bottom:4px">📖 Caderno de Questões Anteriores</div>
        <div style="font-size:16px;font-weight:800;margin-bottom:4px">${esc(e.titulo)}</div>
        <div style="font-size:12px;color:var(--text-tertiary)">Selecione uma prova para resolver completa, em ordem, com gabarito ao final.</div>
      </div>
    </div>
    ${provas.length === 0 ? `
      <div class="card" style="text-align:center;padding:40px">
        <div style="font-size:40px;margin-bottom:12px">📭</div>
        <div style="font-size:15px;font-weight:700;margin-bottom:6px">Nenhuma prova cadastrada ainda</div>
        <div style="font-size:12px;color:var(--text-tertiary)">O admin pode adicionar provas anteriores pelo painel de administração.</div>
      </div>
    ` : provas.map(p => `
      <div class="card" style="cursor:pointer;margin-bottom:10px;transition:border-color .15s"
           data-action="iniciar-prova" data-ano="${p.ano}" data-cargo="${esc(p.cargo)}">
        <div class="card-body" style="display:flex;align-items:center;gap:16px">
          <div style="width:48px;height:48px;border-radius:var(--radius-sm);background:rgba(18,135,108,.1);display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">📝</div>
          <div style="flex:1">
            <div style="font-size:14px;font-weight:800;margin-bottom:3px">${p.ano} — ${esc(p.cargo)}</div>
            <div style="font-size:11px;color:var(--text-tertiary)">
              <span style="color:var(--accent);font-weight:700;font-family:var(--mono)">${p.total} questões</span>
              ${p.disciplinas.slice(0,3).map(d => `<span style="margin-left:6px">· ${esc(d)}</span>`).join('')}
              ${p.disciplinas.length > 3 ? `<span style="margin-left:6px;color:var(--text-tertiary)">+${p.disciplinas.length - 3}</span>` : ''}
            </div>
          </div>
          <div style="color:var(--accent);font-size:18px;flex-shrink:0">→</div>
        </div>
      </div>
    `).join('')}
  `;

  cont.scrollTo(0, 0);
}

async function iniciarProva(ano, cargo) {
  const e = estado.editalAtivo;
  if (!e || !ano || !cargo) return;

  const cont = document.getElementById('conc-scroll');
  cont.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary)">Carregando questões da prova…</div>';

  const questoes = await carregarQuestoesConcurso(e.id, { ano: parseInt(ano), cargo });

  if (!questoes.length) {
    toast('Nenhuma questão encontrada para esta prova.');
    abrirCaderno();
    return;
  }

  estado.provaAtiva = { ano, cargo, questoes, atual: 0, respostas: {}, inicio: Date.now() };
  renderProva();
}

function renderProva() {
  const { questoes, atual, respostas, ano, cargo } = estado.provaAtiva;
  const q = questoes[atual];
  const cont = document.getElementById('conc-scroll');
  const respondida = respostas[q.id] !== undefined;
  const gabarito = (q.gabarito || '').toUpperCase();

  // Modo sem gabarito: se gabarito não está cadastrado, apenas marca a seleção do aluno
  const temGabarito = !!gabarito;

  const opcoes = ['A','B','C','D','E'].map(letra => {
    const texto = q[`opcao_${letra.toLowerCase()}`];
    if (!texto) return '';
    const respostaDada = respostas[q.id];
    const foiSelecionada = respostaDada === letra;
    let estilo = '';

    if (respondida && temGabarito) {
      // Com gabarito: verde para certa, vermelho para errada
      if (letra === gabarito) estilo = 'border-color:var(--accent);background:rgba(18,135,108,.08);';
      else if (foiSelecionada) estilo = 'border-color:#C64B5D;background:rgba(255,71,87,.08);';
    } else if (respondida && foiSelecionada) {
      // Sem gabarito: apenas destaca a opção selecionada em azul
      estilo = 'border-color:#2E7CC7;background:rgba(46,124,199,.08);';
    }

    return `
      <button class="conc-opcao" data-letra="${letra}" style="${estilo}${respondida ? 'cursor:default;' : ''}"
              ${respondida ? 'disabled' : ''}>
        <span class="conc-opcao__letra" style="${respondida && foiSelecionada ? 'background:rgba(46,124,199,.2);color:#2E7CC7' : ''}">${letra}</span>
        <span class="conc-opcao__texto">${esc(texto)}</span>
        ${respondida && temGabarito && letra === gabarito ? '<span style="color:var(--accent);font-weight:700;margin-left:auto">✓</span>' : ''}
        ${respondida && temGabarito && foiSelecionada && letra !== gabarito ? '<span style="color:#C64B5D;font-weight:700;margin-left:auto">✗</span>' : ''}
        ${respondida && !temGabarito && foiSelecionada ? '<span style="color:#2E7CC7;font-weight:700;margin-left:auto">●</span>' : ''}
      </button>`;
  }).join('');

  cont.innerHTML = `
    <!-- HEADER DA PROVA -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;gap:12px" class="animate-in">
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:1px">${ano} · ${esc(cargo)}</div>
        <div style="font-size:12px;color:var(--text-tertiary)">Questão ${atual + 1} de ${questoes.length}</div>
      </div>
      <div style="font-size:12px;font-family:var(--mono);color:var(--text-tertiary)">
        ${Object.keys(respostas).length} respondidas
      </div>
    </div>

    <!-- BARRA DE PROGRESSO -->
    <div style="height:4px;background:var(--bg-3);border-radius:99px;margin-bottom:20px;overflow:hidden">
      <div style="height:100%;width:${Math.round(((atual + 1) / questoes.length) * 100)}%;background:var(--accent);border-radius:99px;transition:width .3s"></div>
    </div>

    <!-- DISCIPLINA -->
    ${q.disciplina ? `<div style="font-size:10px;font-weight:700;color:var(--blue,#2E7CC7);text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">${esc(q.disciplina)}</div>` : ''}

    <!-- ENUNCIADO -->
    <div class="card animate-in" style="margin-bottom:16px">
      <div class="card-body" style="font-size:13px;line-height:1.8;color:var(--text-primary)">${esc(q.texto)}</div>
    </div>

    <!-- OPÇÕES -->
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px" class="animate-in delay-1">
      ${opcoes}
    </div>

    <!-- COMENTÁRIO (após responder) -->
    ${respondida && q.comentario ? `
      <div class="card animate-in" style="margin-bottom:16px;border-left:3px solid var(--blue,#2E7CC7)">
        <div class="card-body">
          <div style="font-size:10px;font-weight:700;color:var(--blue,#2E7CC7);text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">💡 Comentário</div>
          <div style="font-size:12px;line-height:1.75;color:var(--text-secondary)">${esc(q.comentario)}</div>
        </div>
      </div>
    ` : ''}

    <!-- NAVEGAÇÃO -->
    <div style="display:flex;gap:10px;justify-content:space-between" class="animate-in delay-2">
      <button class="btn" data-action="prova-anterior" ${atual === 0 ? 'disabled' : ''}>← Anterior</button>
      ${atual < questoes.length - 1
        ? `<button class="btn btn-accent" data-action="prova-proxima">Próxima →</button>`
        : `<button class="btn btn-accent" data-action="prova-gabarito">Ver resumo final →</button>`
      }
    </div>
  `;

  // Adicionar handler de opção
  cont.querySelectorAll('.conc-opcao:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      estado.provaAtiva.respostas[q.id] = btn.dataset.letra;
      renderProva();
    });
  });

  cont.querySelectorAll('[data-action="prova-anterior"]').forEach(btn => btn.addEventListener('click', () => {
    if (estado.provaAtiva.atual > 0) { estado.provaAtiva.atual--; renderProva(); cont.scrollTo(0, 0); }
  }));
  cont.querySelectorAll('[data-action="prova-proxima"]').forEach(btn => btn.addEventListener('click', () => {
    if (estado.provaAtiva.atual < estado.provaAtiva.questoes.length - 1) { estado.provaAtiva.atual++; renderProva(); cont.scrollTo(0, 0); }
  }));
  cont.querySelectorAll('[data-action="prova-gabarito"]').forEach(btn => btn.addEventListener('click', renderGabarito));

  cont.scrollTo(0, 0);
}

function renderGabarito() {
  const { questoes, respostas, ano, cargo, inicio } = estado.provaAtiva;
  const cont = document.getElementById('conc-scroll');
  const tempo = Math.round((Date.now() - inicio) / 60000);

  const respondidas = Object.keys(respostas).length;
  const naoRespondidas = questoes.length - respondidas;

  // Verificar se tem gabarito oficial cadastrado
  const temGabarito = questoes.some(q => q.gabarito);
  let acertos = 0;
  let html = '';

  questoes.forEach((q, i) => {
    const resposta = respostas[q.id];
    const gabarito = (q.gabarito || '').toUpperCase();
    const acertou = temGabarito && resposta && resposta === gabarito;
    if (acertou) acertos++;

    html += `
      <div style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-2);border:1px solid var(--border-default);border-radius:var(--radius-sm);margin-bottom:6px">
        <span style="font-size:10px;font-family:var(--mono);color:var(--text-tertiary);flex-shrink:0;width:24px;text-align:right">${i + 1}</span>
        <span style="flex:1;font-size:11px;color:var(--text-secondary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(q.texto?.slice(0,90) || '')}…</span>
        <span style="font-family:var(--mono);font-size:12px;font-weight:700;flex-shrink:0">
          ${resposta
            ? `<span style="color:${temGabarito ? (acertou ? 'var(--accent)' : '#C64B5D') : '#2E7CC7'}">${resposta}</span>`
            : '<span style="color:var(--text-tertiary)">—</span>'
          }
          ${temGabarito && gabarito ? ` / <span style="color:var(--accent)">${gabarito}</span>` : ''}
        </span>
        <span style="font-size:15px;flex-shrink:0">
          ${!resposta ? '⬜' : temGabarito ? (acertou ? '✅' : '❌') : '🔵'}
        </span>
      </div>`;
  });

  const resumoHero = temGabarito
    ? (() => {
        const pct = Math.round((acertos / questoes.length) * 100);
        const msg = pct >= 70 ? '🎉 Excelente desempenho!' : pct >= 50 ? '📈 Bom começo, continue!' : '💪 Continue praticando!';
        return `
          <div style="font-size:48px;font-weight:900;color:var(--accent);font-family:var(--mono)">${pct}%</div>
          <div style="font-size:15px;font-weight:700;margin:4px 0">${acertos} de ${questoes.length} corretas</div>
          <div style="font-size:12px;color:var(--text-tertiary)">${msg}</div>`;
      })()
    : `
          <div style="font-size:36px;margin-bottom:8px">📋</div>
          <div style="font-size:15px;font-weight:800;margin-bottom:4px">${respondidas} de ${questoes.length} questões respondidas</div>
          <div style="font-size:12px;color:var(--text-tertiary)">Gabarito oficial será divulgado em breve · suas respostas foram salvas</div>
          ${naoRespondidas > 0 ? `<div style="font-size:11px;color:#C64B5D;margin-top:6px">⚠ ${naoRespondidas} questão(ões) não respondida(s)</div>` : ''}`;

  cont.innerHTML = `
    <div class="card animate-in" style="margin-bottom:20px;border-left:3px solid var(--accent);text-align:center">
      <div class="card-body">${resumoHero}</div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div class="section-label" style="margin:0">
        ${temGabarito ? '📋 Gabarito Oficial' : '📝 Suas Respostas'} — ${ano} · ${esc(cargo)}
      </div>
      <div style="font-size:11px;color:var(--text-tertiary);font-family:var(--mono)">${tempo} min</div>
    </div>
    ${html}
    <div style="display:flex;gap:10px;margin-top:20px">
      <button class="btn" data-action="voltar-detalhe" style="flex:1">← Voltar ao edital</button>
      <button class="btn btn-accent" data-action="abrir-caderno" style="flex:1">Outras provas</button>
    </div>
  `;
  cont.scrollTo(0, 0);
}

function toast(msg) {
  const el = document.createElement('div');
  el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%) translateY(-80px);z-index:500;background:var(--brand-green);color:#111;padding:10px 24px;border-radius:99px;font-weight:700;font-size:13px;box-shadow:0 6px 20px rgba(0,0,0,.4);transition:transform .4s cubic-bezier(.16,1,.3,1),opacity .4s;opacity:0;pointer-events:none';
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.transform = 'translateX(-50%) translateY(0)'; el.style.opacity = '1'; });
  setTimeout(() => { el.style.transform = 'translateX(-50%) translateY(-80px)'; el.style.opacity = '0'; setTimeout(() => el.remove(), 400); }, 2800);
}

function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
