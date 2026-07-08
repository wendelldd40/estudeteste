// ============================================================
// REPOSITÓRIO DE EDITAIS / CONCURSOS
// Carrega editais do Supabase (tabela `editais`).
// ============================================================

import { sb, safeQuery } from './client.js';

const cache = { carregado: false, lista: [] };

export async function carregarEditais({ forcar = false } = {}) {
  if (cache.carregado && !forcar) return cache.lista;
  const { data, error } = await safeQuery(
    sb.from('editais').select('*').eq('ativo', true).order('created_at', { ascending: false }),
    'carregarEditais'
  );
  if (error || !data) return cache.lista;
  cache.lista = data;
  cache.carregado = true;
  return data;
}

export async function getEditalPorId(id) {
  const lista = await carregarEditais();
  return lista.find(e => e.id === id) || null;
}

export async function getEditaisAbertos() {
  const lista = await carregarEditais();
  return lista.filter(e => e.status === 'aberto');
}

export async function getEditaisPrevistos() {
  const lista = await carregarEditais();
  return lista.filter(e => e.status === 'previsto');
}

export function calcularDiasAteProva(dataProva) {
  if (!dataProva) return null;
  const diff = new Date(dataProva) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function invalidarCache() {
  cache.carregado = false;
  cache.lista = [];
}

// ── CRUD (admin) ──

export async function criarEdital(dados) {
  const { data, error } = await sb.from('editais').insert(dados).select().single();
  if (!error) invalidarCache();
  return { data, error };
}

export async function atualizarEdital(id, dados) {
  const { data, error } = await sb.from('editais').update({ ...dados, updated_at: new Date().toISOString() }).eq('id', id).select().single();
  if (!error) invalidarCache();
  return { data, error };
}

export async function excluirEdital(id) {
  // Soft delete: só marca como inativo
  const { error } = await sb.from('editais').update({ ativo: false }).eq('id', id);
  if (!error) invalidarCache();
  return { error };
}

export async function listarTodosEditais() {
  // Admin vê todos, inclusive inativos
  const { data, error } = await safeQuery(
    sb.from('editais').select('*').order('created_at', { ascending: false }),
    'listarTodosEditais'
  );
  return data || [];
}
