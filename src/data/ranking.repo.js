// ============================================================
// REPOSITÓRIO DE RANKING
// Top usuários por XP, streak, total de questões.
// ============================================================

import { sb, safeQuery, getSupaId } from './client.js';

/**
 * Top N usuários por XP total. Já existe no perfil.repo.js, mas
 * aqui ficam variantes específicas pra tela de ranking.
 */
export async function rankingXP(limite = 50) {
  const { data, error } = await safeQuery(
    sb.from('usuarios')
      .select('id, nome, xp_total, streak, total_questoes')
      .eq('ranking_opt', true)
      .order('xp_total', { ascending: false })
      .limit(limite),
    'rankingXP'
  );
  return error ? [] : (data || []);
}

export async function rankingStreak(limite = 50) {
  const { data, error } = await safeQuery(
    sb.from('usuarios')
      .select('id, nome, xp_total, streak, total_questoes')
      .eq('ranking_opt', true)
      .order('streak', { ascending: false })
      .limit(limite),
    'rankingStreak'
  );
  return error ? [] : (data || []);
}

export async function rankingQuestoes(limite = 50) {
  const { data, error } = await safeQuery(
    sb.from('usuarios')
      .select('id, nome, xp_total, streak, total_questoes')
      .eq('ranking_opt', true)
      .order('total_questoes', { ascending: false })
      .limit(limite),
    'rankingQuestoes'
  );
  return error ? [] : (data || []);
}

/**
 * Marca posição do usuário atual na lista (pra destacar "VOCÊ").
 */
export function marcarUsuarioAtual(lista) {
  const meuId = getSupaId();
  return lista.map((u, idx) => ({
    ...u,
    posicao: idx + 1,
    isVoce: u.id === meuId,
  }));
}
