// ============================================================
// QUESTOES_CONCURSO REPO
// Questões específicas de provas anteriores de concursos.
// Separadas das questões veterinárias do banco principal.
// ============================================================

import { sb } from './client.js';

let _cache = {};

/**
 * Busca questões de um edital específico, opcionalmente filtradas por cargo/ano.
 */
export async function carregarQuestoesConcurso(edital_id, { cargo, ano } = {}) {
  const cacheKey = `${edital_id}__${cargo || ''}__${ano || ''}`;
  if (_cache[cacheKey]) return _cache[cacheKey];

  let query = sb
    .from('questoes_concurso')
    .select('*')
    .eq('edital_id', edital_id)
    .eq('ativo', true)
    .order('numero', { ascending: true });

  if (cargo) query = query.eq('cargo', cargo);
  if (ano)   query = query.eq('ano', ano);

  const { data, error } = await query;
  if (error) { console.error('questoes_concurso:', error); return []; }

  _cache[cacheKey] = data || [];
  return _cache[cacheKey];
}

/**
 * Retorna as provas disponíveis (combinações únicas de ano + cargo) para um edital.
 * Cada entrada inclui: { ano, cargo, total, disciplinas }
 */
export async function listarProvasDisponiveis(edital_id) {
  const { data, error } = await sb
    .from('questoes_concurso')
    .select('ano, cargo, disciplina')
    .eq('edital_id', edital_id)
    .eq('ativo', true);

  if (error) { console.error('listarProvas:', error); return []; }

  const map = {};
  for (const row of (data || [])) {
    const key = `${row.ano}__${row.cargo}`;
    if (!map[key]) map[key] = { ano: row.ano, cargo: row.cargo, total: 0, disciplinasSet: new Set() };
    map[key].total++;
    if (row.disciplina) map[key].disciplinasSet.add(row.disciplina);
  }

  return Object.values(map)
    .map(p => ({ ...p, disciplinas: [...p.disciplinasSet] }))
    .sort((a, b) => b.ano - a.ano || a.cargo.localeCompare(b.cargo));
}

export function limparCacheQuestoesConcurso() {
  _cache = {};
}
