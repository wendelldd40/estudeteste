// ============================================================
// REPOSITÓRIO DE PERFIL
// Gerencia perfil do aluno: XP, streak, badge, total de questões.
//
// Estratégia: localStorage como fonte primária (resposta instantânea),
// Supabase como sincronização em background. Igual ao v8, mas centralizado.
// ============================================================

import { sb, safeQuery, getSupaId, setSupaId } from './client.js';

const KEY_PERFIL = 'ev_perfil';
const KEY_XP_DIA = 'ev_xp_dia';
const KEY_ERROS  = 'ev_erros';

// ---------- BADGES ----------
const BADGES = [
  { min: 0,    nome: 'Iniciante',  emoji: '🐣' },
  { min: 100,  nome: 'Aprendiz',   emoji: '📚' },
  { min: 500,  nome: 'Estudante',  emoji: '🎓' },
  { min: 1500, nome: 'Veterano',   emoji: '🩺' },
  { min: 3000, nome: 'Especialista', emoji: '⚕️' },
  { min: 6000, nome: 'Mestre',     emoji: '👑' },
];

export function getBadge(xpTotal) {
  let badge = BADGES[0];
  for (const b of BADGES) {
    if (xpTotal >= b.min) badge = b;
  }
  return badge;
}

// ---------- PERFIL LOCAL ----------

export function getPerfil() {
  const raw = localStorage.getItem(KEY_PERFIL);
  if (!raw) return null;
  try { return JSON.parse(raw); }
  catch { return null; }
}

export function setPerfil(perfil) {
  localStorage.setItem(KEY_PERFIL, JSON.stringify(perfil));
}

export function criarPerfil({ nome, email = '', ranking = true }) {
  const perfil = {
    nome,
    email: email || '',
    ranking,
    xpTotal: 0,
    streak: 1,
    total: 0,
    criadoEm: hoje(),
    ultimoAcesso: hoje(),
  };
  setPerfil(perfil);
  return perfil;
}

export function atualizarPerfil(patch) {
  const atual = getPerfil();
  if (!atual) return null;
  const novo = { ...atual, ...patch };
  setPerfil(novo);
  return novo;
}

// ---------- XP DIÁRIO ----------

export const XP_DIARIO_CAP = 200;

function hoje() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getXpDia() {
  const raw = localStorage.getItem(KEY_XP_DIA);
  if (!raw) return { data: hoje(), valor: 0 };
  try {
    const obj = JSON.parse(raw);
    if (obj.data !== hoje()) return { data: hoje(), valor: 0 };
    return obj;
  } catch {
    return { data: hoje(), valor: 0 };
  }
}

/**
 * Adiciona XP ao dia, respeitando o cap diário.
 * Retorna XP efetivamente adicionado (pode ser menor que `pts` se passou do cap).
 */
export function addXpDia(pts) {
  const atual = getXpDia();
  const disponivel = Math.max(0, XP_DIARIO_CAP - atual.valor);
  const adicionar = Math.min(pts, disponivel);
  const novo = { data: hoje(), valor: atual.valor + adicionar };
  localStorage.setItem(KEY_XP_DIA, JSON.stringify(novo));
  return adicionar;
}

// ---------- ERROS POR TEMA (análise) ----------

export function getErros() {
  const raw = localStorage.getItem(KEY_ERROS);
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { return {}; }
}

export function setErros(erros) {
  localStorage.setItem(KEY_ERROS, JSON.stringify(erros));
}

/**
 * Registra resposta numa questão. Usado pra análise de erros por tema.
 */
export function registrarResposta(materia, qIndex, acertou) {
  const erros = getErros();
  const chave = `${materia}_${qIndex}`;
  if (!erros[chave]) {
    erros[chave] = { erros: 0, acertos: 0, ultimaTentativa: null };
  }
  if (acertou) {
    erros[chave].acertos++;
  } else {
    erros[chave].erros++;
  }
  erros[chave].ultimaTentativa = hoje();
  setErros(erros);
}

export function limparErros() {
  localStorage.removeItem(KEY_ERROS);
}

// ---------- SINCRONIZAÇÃO COM SUPABASE ----------

/**
 * Empurra perfil local pro Supabase. Cria registro se não existir.
 * Chamar depois de mudanças significativas (fim de simulado, etc).
 */
export async function sincronizarPerfil() {
  const perfil = getPerfil();
  if (!perfil) return { ok: false, motivo: 'sem_perfil' };

  let supaId = getSupaId();

  if (!supaId) {
    // Cria registro novo
    const { data, error } = await safeQuery(
      sb.from('usuarios').insert({
        nome: perfil.nome,
        email: perfil.email || '',
        ranking_opt: perfil.ranking,
        xp_total: perfil.xpTotal || 0,
        streak: perfil.streak || 1,
        total_questoes: perfil.total || 0,
      }).select().single(),
      'sincronizarPerfil:insert'
    );
    if (error) return { ok: false, motivo: 'erro_insert', error };
    setSupaId(data.id);
    return { ok: true, criado: true, supaId: data.id };
  }

  // Atualiza existente
  const { error } = await safeQuery(
    sb.from('usuarios').update({
      xp_total: perfil.xpTotal || 0,
      streak: perfil.streak || 1,
      total_questoes: perfil.total || 0,
    }).eq('id', supaId),
    'sincronizarPerfil:update'
  );

  if (error) return { ok: false, motivo: 'erro_update', error };
  return { ok: true, criado: false, supaId };
}

/**
 * Busca o ranking global (top N por XP).
 */
export async function getRankingXP(limite = 50) {
  const { data, error } = await safeQuery(
    sb.from('usuarios')
      .select('id, nome, xp_total, streak')
      .eq('ranking_opt', true)
      .order('xp_total', { ascending: false })
      .limit(limite),
    'getRankingXP'
  );
  return error ? [] : (data || []);
}
