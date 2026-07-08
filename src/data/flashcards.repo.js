// ============================================================
// REPOSITÓRIO DE FLASHCARDS
// Cards (frente/verso) + status do aluno (sabei/revisar).
// ============================================================

import { sb, safeQuery, getSupaId } from './client.js';
import { MATERIAS } from './questoes.repo.js';

// Cache em memória — invalidado ao logar/deslogar
const cache = {
  carregado: false,
  porMateria: {},  // { materiaKey: [cards] }
  total: 0,
};

/**
 * Carrega todos os flashcards ativos do Supabase + progresso do usuário.
 * Idempotente: chamadas repetidas usam cache.
 */
export async function carregarFlashcards({ forcar = false } = {}) {
  if (cache.carregado && !forcar) return cache.porMateria;

  const { data, error } = await safeQuery(
    sb.from('flashcards')
      .select('*')
      .eq('ativo', true)
      .order('ordem'),
    'carregarFlashcards'
  );

  if (error || !data) return cache.porMateria;

  // Reset
  cache.porMateria = {};
  data.forEach(c => {
    if (!cache.porMateria[c.materia]) cache.porMateria[c.materia] = [];
    cache.porMateria[c.materia].push({
      id: c.id,
      materia: c.materia,
      tema: c.tema,
      frente: c.frente,
      verso: c.verso,
      ordem: c.ordem,
      _status: null, // preenchido em carregarProgresso
    });
  });
  cache.total = data.length;
  cache.carregado = true;

  await carregarProgresso();
  return cache.porMateria;
}

/**
 * Busca progresso do usuário (sabei/revisar) e injeta nos cards em cache.
 */
export async function carregarProgresso() {
  const uid = getSupaId();
  if (!uid) return;

  const { data, error } = await safeQuery(
    sb.from('flashcard_progresso')
      .select('flashcard_id, status')
      .eq('usuario_id', uid),
    'carregarProgressoFC'
  );

  if (error || !data) return;

  const mapa = {};
  data.forEach(p => { mapa[p.flashcard_id] = p.status; });

  Object.values(cache.porMateria).flat().forEach(c => {
    c._status = mapa[c.id] || null;
  });
}

/**
 * Salva o status de um card (sabei | revisar | null).
 * Upsert: se já existe, atualiza; senão insere.
 */
export async function salvarStatusCard(cardId, status) {
  const uid = getSupaId();
  if (!uid) return { ok: false, motivo: 'sem_usuario' };

  // Atualiza cache local imediatamente (otimista)
  Object.values(cache.porMateria).flat().forEach(c => {
    if (c.id === cardId) c._status = status;
  });

  const { error } = await safeQuery(
    sb.from('flashcard_progresso').upsert({
      usuario_id: uid,
      flashcard_id: cardId,
      status,
      atualizado_em: new Date().toISOString(),
    }, { onConflict: 'usuario_id,flashcard_id' }),
    'salvarStatusCard'
  );

  return { ok: !error, error };
}

/**
 * Cards de uma matéria.
 */
export async function getFlashcardsPorMateria(materiaKey) {
  await carregarFlashcards();
  return cache.porMateria[materiaKey] || [];
}

/**
 * Estatísticas globais (pra mostrar no topo da tela).
 */
export async function getEstatisticasGerais() {
  await carregarFlashcards();
  const todos = Object.values(cache.porMateria).flat();
  const sabei   = todos.filter(c => c._status === 'sabei').length;
  const revisar = todos.filter(c => c._status === 'revisar').length;
  return {
    total: todos.length,
    sabei,
    revisar,
    naoVistos: todos.length - sabei - revisar,
  };
}

/**
 * Estatísticas por matéria (pra mostrar nos cards de seleção).
 */
export async function getEstatisticasPorMateria() {
  await carregarFlashcards();
  const out = {};
  for (const m of MATERIAS) {
    const cards = cache.porMateria[m.key] || [];
    const sabei = cards.filter(c => c._status === 'sabei').length;
    out[m.key] = {
      total: cards.length,
      sabei,
      pct: cards.length > 0 ? Math.round((sabei / cards.length) * 100) : 0,
    };
  }
  return out;
}

/**
 * Embaralha array (Fisher-Yates).
 */
export function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function invalidarCache() {
  cache.carregado = false;
  cache.porMateria = {};
  cache.total = 0;
}
