// ============================================================
// REPOSITÓRIO DE ADMIN
// Métricas de uso e CRUD de questões.
//
// Diferente do v8: agora o admin pode CRIAR / EDITAR / DESATIVAR
// questões direto pelo painel, sem entrar no Supabase.
// ============================================================

import { sb, safeQuery } from './client.js';
import { invalidarCache as invalidarCacheQuestoes } from './questoes.repo.js';

// ─────────── MÉTRICAS ───────────

export async function getMetricasGerais() {
  const [users, questoes, sessoes] = await Promise.all([
    safeQuery(sb.from('usuarios').select('*', { count: 'exact', head: true }), 'count_users'),
    safeQuery(sb.from('questoes').select('*', { count: 'exact', head: true }).eq('ativo', true), 'count_questoes'),
    safeQuery(sb.from('sessoes_simulado').select('*', { count: 'exact', head: true }), 'count_sessoes'),
  ]);

  // Ativos hoje (last_seen no Supabase) — usa fallback se a tabela não tem
  const hoje = new Date().toISOString().slice(0, 10);
  const { data: ativos } = await safeQuery(
    sb.from('usuarios')
      .select('id')
      .gte('updated_at', hoje + 'T00:00:00Z'),
    'ativos_hoje'
  );

  return {
    totalUsuarios: users.data ?? null,
    questoesAtivas: questoes.data ?? null,
    totalSessoes: sessoes.data ?? null,
    ativosHoje: ativos?.length ?? 0,
  };
}

export async function getUsuarios({ ordem = 'xp_total', limite = 100 } = {}) {
  const { data, error } = await safeQuery(
    sb.from('usuarios')
      .select('id, nome, email, xp_total, streak, total_questoes, created_at, updated_at, ranking_opt')
      .order(ordem, { ascending: false })
      .limit(limite),
    'getUsuarios'
  );
  return error ? [] : (data || []);
}

// ─────────── CRUD DE QUESTÕES ───────────

/**
 * Lista questões (todas, inclui inativas — admin precisa ver tudo).
 */
export async function listarQuestoes({ materia = null, busca = null, limite = 200 } = {}) {
  let query = sb.from('questoes')
    .select('id, materia, materia_nome, tema, dificuldade, texto, gabarito, ativo, created_at')
    .order('created_at', { ascending: false })
    .limit(limite);

  if (materia) query = query.eq('materia', materia);
  if (busca) query = query.or(`tema.ilike.%${busca}%,texto.ilike.%${busca}%`);

  const { data, error } = await safeQuery(query, 'listarQuestoes');
  return error ? [] : (data || []);
}

/**
 * Cria questão nova.
 */
export async function criarQuestao(dados) {
  const payload = {
    materia: dados.materia,
    materia_nome: dados.materia_nome || null,
    tema: dados.tema || '',
    dificuldade: dados.dificuldade || 'Médio',
    texto: dados.texto,
    assertivas: dados.assertivas || null,
    opcao_a: dados.opcoes[0] || '',
    opcao_b: dados.opcoes[1] || '',
    opcao_c: dados.opcoes[2] || '',
    opcao_d: dados.opcoes[3] || '',
    opcao_e: dados.opcoes[4] || '',
    gabarito: dados.gabarito,
    comentario: dados.comentario || '',
    ativo: dados.ativo !== false,
  };

  const { data, error } = await safeQuery(
    sb.from('questoes').insert(payload).select().single(),
    'criarQuestao'
  );

  if (!error) invalidarCacheQuestoes();
  return { ok: !error, data, error };
}

/**
 * Atualiza questão existente.
 */
export async function atualizarQuestao(id, dados) {
  const payload = {};
  if (dados.materia !== undefined)      payload.materia = dados.materia;
  if (dados.tema !== undefined)         payload.tema = dados.tema;
  if (dados.dificuldade !== undefined)  payload.dificuldade = dados.dificuldade;
  if (dados.texto !== undefined)        payload.texto = dados.texto;
  if (dados.assertivas !== undefined)   payload.assertivas = dados.assertivas;
  if (dados.opcoes) {
    payload.opcao_a = dados.opcoes[0] || '';
    payload.opcao_b = dados.opcoes[1] || '';
    payload.opcao_c = dados.opcoes[2] || '';
    payload.opcao_d = dados.opcoes[3] || '';
    payload.opcao_e = dados.opcoes[4] || '';
  }
  if (dados.gabarito !== undefined)  payload.gabarito = dados.gabarito;
  if (dados.comentario !== undefined) payload.comentario = dados.comentario;
  if (dados.ativo !== undefined)     payload.ativo = dados.ativo;

  const { error } = await safeQuery(
    sb.from('questoes').update(payload).eq('id', id),
    'atualizarQuestao'
  );

  if (!error) invalidarCacheQuestoes();
  return { ok: !error, error };
}

/**
 * Carrega uma questão completa (todos os campos) pra editor.
 */
export async function getQuestaoCompleta(id) {
  const { data, error } = await safeQuery(
    sb.from('questoes').select('*').eq('id', id).single(),
    'getQuestaoCompleta'
  );
  return error ? null : data;
}

/**
 * Soft delete: marca como inativa em vez de deletar.
 */
export async function desativarQuestao(id) {
  return atualizarQuestao(id, { ativo: false });
}

export async function reativarQuestao(id) {
  return atualizarQuestao(id, { ativo: true });
}
