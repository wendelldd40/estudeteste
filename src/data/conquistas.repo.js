// ============================================================
// REPOSITÓRIO DE CONQUISTAS
// Define a lista canônica de conquistas e gerencia desbloqueio.
// ============================================================

import { getPerfil } from './perfil.repo.js';

const KEY = 'ev_conquistas';

// ─────────── DEFINIÇÕES ───────────
// Cada conquista tem: id, icon, nome, desc, cat, check(perfil, extras)
// `extras` é o contexto da última ação (ex: { pct: 100, materia: 'farmacologia' }).

export const CONQUISTAS = [
  // ========== DEDICAÇÃO ==========
  { id: 'primeira_vez', icon: '🌱', nome: 'Primeira vez', desc: 'Complete o 1º simulado', cat: 'dedicacao',
    check: (p) => (p.total || 0) >= 1 },
  { id: 'streak3', icon: '🔥', nome: '3 dias seguidos', desc: 'Estude 3 dias consecutivos', cat: 'dedicacao',
    check: (p) => (p.streak || 0) >= 3 },
  { id: 'streak7', icon: '⚡', nome: 'Semana completa', desc: 'Estude 7 dias consecutivos', cat: 'dedicacao',
    check: (p) => (p.streak || 0) >= 7 },
  { id: 'streak30', icon: '💎', nome: 'Mês dedicado', desc: 'Estude 30 dias consecutivos', cat: 'dedicacao',
    check: (p) => (p.streak || 0) >= 30 },
  { id: 'streak60', icon: '👑', nome: 'Inabalável', desc: 'Estude 60 dias consecutivos', cat: 'dedicacao',
    check: (p) => (p.streak || 0) >= 60 },

  // ========== PERFORMANCE ==========
  { id: 'perfeito', icon: '🎯', nome: 'Atirador certeiro', desc: '100% de acerto em um simulado', cat: 'performance',
    check: (p, e) => e?.pct === 100 },
  { id: 'rapido', icon: '⚡', nome: 'Relâmpago', desc: 'Acerte uma questão em menos de 5s', cat: 'performance',
    check: (p, e) => e?.tempoMin <= 5 },
  { id: 'top_xp', icon: '🏆', nome: 'Líder do ranking', desc: 'Chegue ao 1º lugar no ranking de XP', cat: 'performance',
    check: (p, e) => e?.posicaoRanking === 1 },
  { id: 'xp1000', icon: '💯', nome: 'Mil pontos', desc: 'Acumule 1.000 XP no total', cat: 'performance',
    check: (p) => (p.xpTotal || 0) >= 1000 },
  { id: 'xp5000', icon: '🚀', nome: 'Decolando', desc: 'Acumule 5.000 XP no total', cat: 'performance',
    check: (p) => (p.xpTotal || 0) >= 5000 },

  // ========== CONHECIMENTO ==========
  { id: 'q50', icon: '📖', nome: 'Curioso', desc: 'Responda 50 questões', cat: 'conhecimento',
    check: (p) => (p.total || 0) >= 50 },
  { id: 'q200', icon: '📚', nome: 'Estudioso', desc: 'Responda 200 questões', cat: 'conhecimento',
    check: (p) => (p.total || 0) >= 200 },
  { id: 'q500', icon: '🎓', nome: 'Veterinário nato', desc: 'Responda 500 questões', cat: 'conhecimento',
    check: (p) => (p.total || 0) >= 500 },

  // ========== ESPECIALISTAS ==========
  { id: 'esp_analises', icon: '🔬', nome: 'Analista Clínico', desc: '80%+ em Análises Clínicas', cat: 'especialista',
    check: (p, e) => e?.materia === 'analisesclinicas' && e.pct >= 80 },
  { id: 'esp_farm', icon: '💊', nome: 'Farmacologista', desc: '80%+ em Farmacologia', cat: 'especialista',
    check: (p, e) => e?.materia === 'farmacologia' && e.pct >= 80 },
  { id: 'esp_aqui', icon: '🐟', nome: 'Aquicultor', desc: '80%+ em Aquicultura', cat: 'especialista',
    check: (p, e) => e?.materia === 'aquicultura' && e.pct >= 80 },
  { id: 'esp_semi', icon: '🩺', nome: 'Semiologista', desc: '80%+ em Semiologia', cat: 'especialista',
    check: (p, e) => e?.materia === 'semiologia' && e.pct >= 80 },
  { id: 'esp_leite', icon: '🥛', nome: 'Inspetor', desc: '80%+ em Inspeção de Leite', cat: 'especialista',
    check: (p, e) => e?.materia === 'inspecaoleite' && e.pct >= 80 },
  { id: 'esp_pato', icon: '🧫', nome: 'Patologista', desc: '80%+ em Patologia Geral', cat: 'especialista',
    check: (p, e) => e?.materia === 'patologia' && e.pct >= 80 },
];

export const CATEGORIAS = {
  dedicacao:    { titulo: 'Dedicação',    icone: '🔥' },
  performance:  { titulo: 'Performance',  icone: '🎯' },
  conhecimento: { titulo: 'Conhecimento', icone: '📚' },
  especialista: { titulo: 'Especialista', icone: '🔬' },
};

// ─────────── ESTADO ───────────

export function getDesbloqueadas() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

function salvarDesbloqueada(id) {
  const lista = getDesbloqueadas();
  if (lista.includes(id)) return false;
  lista.push(id);
  localStorage.setItem(KEY, JSON.stringify(lista));
  return true;
}

/**
 * Verifica todas as conquistas e retorna as que foram desbloqueadas agora.
 * Chame ao fim de cada simulado, passando { pct, materia, tempoMin, ... }.
 */
export function verificarDesbloqueio(extras = {}) {
  const perfil = getPerfil();
  if (!perfil) return [];
  const desbloq = getDesbloqueadas();
  const novas = [];

  for (const c of CONQUISTAS) {
    if (desbloq.includes(c.id)) continue;
    try {
      if (c.check(perfil, extras)) {
        if (salvarDesbloqueada(c.id)) novas.push(c);
      }
    } catch (err) {
      console.warn(`[conquistas] check de "${c.id}" falhou:`, err);
    }
  }

  return novas;
}

/**
 * Conquistas agrupadas por categoria, com flag de desbloqueada.
 */
export function listarAgrupadas() {
  const desbloq = new Set(getDesbloqueadas());
  const grupos = {};

  for (const cat of Object.keys(CATEGORIAS)) {
    grupos[cat] = {
      info: CATEGORIAS[cat],
      itens: [],
    };
  }

  for (const c of CONQUISTAS) {
    if (!grupos[c.cat]) continue;
    grupos[c.cat].itens.push({
      ...c,
      desbloqueada: desbloq.has(c.id),
    });
  }

  return grupos;
}

export function getProgresso() {
  const total = CONQUISTAS.length;
  const obtidas = getDesbloqueadas().length;
  return {
    total,
    obtidas,
    pct: Math.round((obtidas / total) * 100),
  };
}
