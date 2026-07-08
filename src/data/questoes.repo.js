// ============================================================
// REPOSITÓRIO DE QUESTÕES
// Toda lógica de leitura/escrita de questões vive aqui.
// Telas (UI) NUNCA falam direto com `sb.from('questoes')`.
// Elas chamam funções daqui.
// ============================================================

import { sb, safeQuery } from './client.js';

// ---------- MATÉRIAS SUPORTADAS ----------
// Lista canônica. Adicionar matéria nova? Só aqui.
export const MATERIAS = [
  { key: 'analisesclinicas', nome: 'Análises Clínicas',     icone: '🔬' },
  { key: 'farmacologia',     nome: 'Farmacologia',          icone: '💊' },
  { key: 'aquicultura',      nome: 'Aquicultura',           icone: '🐟' },
  { key: 'semiologia',       nome: 'Semiologia',            icone: '🩺' },
  { key: 'inspecaoleite',    nome: 'Inspeção do Leite',     icone: '🥛' },
  { key: 'patologia',        nome: 'Patologia',             icone: '🧬' },
  { key: 'zootecnia',        nome: 'Zootecnia',             icone: '🐄' },
];

export const MATERIA_KEYS = MATERIAS.map(m => m.key);

// Estado em memória — substituí o `let QUESTIONS = {...}` global do v8.
const cache = {
  carregadas: false,
  porMateria: Object.fromEntries(MATERIA_KEYS.map(k => [k, []])),
  total: 0,
  carregadasEm: null,
};

/**
 * Reseta o cache. Útil pra forçar reload depois de admin adicionar questão.
 */
export function invalidarCache() {
  cache.carregadas = false;
  MATERIA_KEYS.forEach(k => { cache.porMateria[k] = []; });
  cache.total = 0;
}

/**
 * Carrega TODAS as questões ativas do Supabase.
 * Idempotente: chamadas repetidas não fazem nova request.
 */
export async function carregarQuestoes({ forcar = false } = {}) {
  if (cache.carregadas && !forcar) return cache.porMateria;

  const { data, error } = await safeQuery(
    sb.from('questoes')
      .select('id,materia,materia_nome,tema,dificuldade,texto,assertivas,opcao_a,opcao_b,opcao_c,opcao_d,opcao_e,gabarito,comentario,ativo')
      .eq('ativo', true)
      .order('materia'),
    'carregarQuestoes'
  );

  if (error || !data) {
    return cache.porMateria; // retorna o que tinha (provavelmente vazio)
  }

  // Reset
  MATERIA_KEYS.forEach(k => { cache.porMateria[k] = []; });

  data.forEach(q => {
    const questao = normalizarQuestao(q);
    if (questao && cache.porMateria[q.materia] !== undefined) {
      cache.porMateria[q.materia].push(questao);
    }
  });

  cache.carregadas = true;
  cache.total = data.length;
  cache.carregadasEm = Date.now();

  return cache.porMateria;
}

/**
 * Pega questões de uma matéria específica.
 * Garante que o cache foi carregado antes.
 */
export async function getQuestoesPorMateria(materiaKey) {
  await carregarQuestoes();
  return cache.porMateria[materiaKey] || [];
}

/**
 * Pega N questões aleatórias de uma matéria.
 */
export async function getQuestoesAleatorias(materiaKey, qtd) {
  const todas = await getQuestoesPorMateria(materiaKey);
  return embaralhar([...todas]).slice(0, qtd);
}

/**
 * Pega N questões aleatórias de TODAS as matérias (simulado geral).
 */
export async function getQuestoesGerais(qtd) {
  await carregarQuestoes();
  const todas = MATERIA_KEYS.flatMap(k => cache.porMateria[k]);
  return embaralhar([...todas]).slice(0, qtd);
}

/**
 * Contagem de questões por matéria — pra mostrar nas tela inicial.
 */
export async function getContagens() {
  await carregarQuestoes();
  const out = {};
  MATERIA_KEYS.forEach(k => { out[k] = cache.porMateria[k].length; });
  out._total = cache.total;
  return out;
}

// ============================================================
// HELPERS INTERNOS
// ============================================================

/**
 * Converte um registro do Supabase no formato que o app usa.
 * Lida com a parte chata: assertivas podem vir em campo dedicado
 * OU embutidas no texto (formato "I. ... II. ... — Comando").
 */
function normalizarQuestao(q) {
  const opcoes = [q.opcao_a, q.opcao_b, q.opcao_c, q.opcao_d, q.opcao_e]
    .filter(o => o && o.trim() !== '');

  const gabaritoIdx = ['A', 'B', 'C', 'D', 'E'].indexOf(q.gabarito);
  if (gabaritoIdx === -1) {
    console.warn(`[questoes] questão ${q.id} com gabarito inválido:`, q.gabarito);
  }

  let texto = q.texto || '';
  let assertivas = null;

  // 1) campo dedicado (formato preferido)
  if (q.assertivas && typeof q.assertivas === 'string' && q.assertivas.trim()) {
    const partes = q.assertivas.split('|').map(a => a.trim()).filter(Boolean);
    if (partes.length) assertivas = partes;
  }

  // 2) fallback: assertivas embutidas no texto
  if (!assertivas && texto) {
    const matchEmbutido = texto.match(/^(I\..+?)\s*[—–-]{1,2}\s*(.+)$/s);
    if (matchEmbutido) {
      const assertRaw = matchEmbutido[1];
      texto = matchEmbutido[2].trim();
      const partes = assertRaw.split(/\s+(?=[IVX]+\.)/).map(a => a.trim()).filter(Boolean);
      if (partes.length) assertivas = partes;
    } else if (/^I\.\s/.test(texto)) {
      const partes = texto.split(/(?<=\.)\s+(?=[IVX]+\.\s)/).map(a => a.trim()).filter(Boolean);
      if (partes.length > 1) {
        assertivas = partes;
        texto = q.comentario
          ? 'Analise as assertivas e marque a alternativa correta.'
          : texto;
      }
    }
  }

  return {
    id: q.id,
    materia: q.materia,
    materiaNome: q.materia_nome,
    tema: q.tema,
    dificuldade: q.dificuldade,
    texto,
    assertivas,                // null | string[]
    opcoes,                    // string[]
    correta: gabaritoIdx >= 0 ? gabaritoIdx : 0,
    explicacao: q.comentario,
    // legado (mantém compatibilidade com código antigo durante migração)
    text: texto,
    options: opcoes,
    correct: gabaritoIdx >= 0 ? gabaritoIdx : 0,
    dif: q.dificuldade,
    explanation: q.comentario,
    _supaId: q.id,
  };
}

/**
 * Fisher-Yates shuffle (in-place, mas operamos sobre cópia).
 */
function embaralhar(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
