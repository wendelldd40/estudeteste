// ============================================================
// HOME — CONTROLLER
// Carrega dados do perfil/sessões e renderiza dashboard.
// ============================================================

import {
  getPerfil,
  getXpDia,
  XP_DIARIO_CAP,
  getBadge,
  getErros,
} from '../../data/perfil.repo.js';
import { logout } from '../../data/auth.repo.js';
import { MATERIAS, getContagens } from '../../data/questoes.repo.js';
import { ir, aoEntrar } from '../../core/router.js';
import { toast } from '../../core/toast.js';
import { continueCardTemplate } from './home.template.js';

const CHAVE_ULTIMA_MATERIA = 'ev_ultima_materia';
const CHAVE_HISTORICO_DIA  = 'ev_historico_dias';

export function montarHome() {
  // Quando entra na home, atualiza tudo
  aoEntrar('home', popular);

  // Delegação de cliques específicos da home
  document.addEventListener('click', tratarClique);
}

async function popular() {
  const perfil = getPerfil();
  if (!perfil) {
    ir('auth-login');
    return;
  }

  popularSaudacao(perfil);
  popularData();
  popularStreak(perfil);
  popularXpDia();
  popularSemana();
  popularStats(perfil);
  popularBadge(perfil);
  await popularContinuar();
  popularHeatmap();
}

function popularSaudacao(perfil) {
  const h = new Date().getHours();
  let msg = 'Olá';
  if (h < 6)       msg = 'Boa madrugada';
  else if (h < 12) msg = 'Bom dia';
  else if (h < 18) msg = 'Boa tarde';
  else             msg = 'Boa noite';

  $('hero-saudacao').textContent = `${msg},`;
  $('hero-nome').textContent = perfil.nome;
}

function popularStreak(perfil) {
  const streak = perfil.streak || 1;
  $('streak-num').textContent = streak;
  $('streak-label').textContent = streak === 1
    ? 'comece sua jornada hoje'
    : streak < 7
      ? 'dias seguidos estudando'
      : 'dias seguidos! Mantenha o ritmo';
}

function popularXpDia() {
  const xp = getXpDia();
  const pct = Math.min(100, Math.round((xp.valor / XP_DIARIO_CAP) * 100));
  const num = $('xp-dia-num');
  if (num) num.textContent = xp.valor;
  const ring = $('xp-ring');
  if (ring) {
    const C = 213.6; // 2πr, r=34
    ring.style.strokeDashoffset = (C * (1 - pct / 100)).toFixed(1);
  }
}

function popularData() {
  const el = $('hero-data');
  if (!el) return;
  const txt = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  el.textContent = txt.charAt(0).toUpperCase() + txt.slice(1);
}

function popularSemana() {
  const cont = $('hero-week');
  if (!cont) return;
  const hist = getHistorico();
  const iniciais = ['D','S','T','Q','Q','S','S'];
  const hoje = new Date();
  let html = '';
  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const on = (hist[d.toISOString().slice(0, 10)] || 0) > 0;
    html += `
      <div class="hero-week__dia ${on ? 'on' : ''} ${i === 0 ? 'hoje' : ''}">
        <span class="hero-week__dot">${on ? '✓' : ''}</span>
        <span class="hero-week__lbl">${iniciais[d.getDay()]}</span>
      </div>`;
  }
  cont.innerHTML = html;
}

function popularStats(perfil) {
  $('xp-total').textContent = perfil.xpTotal || 0;
  $('stat-questoes').textContent = perfil.total || 0;

  // Calcula taxa de acertos a partir do registro de erros
  const erros = getErros();
  let acertos = 0, total = 0;
  for (const k in erros) {
    acertos += erros[k].acertos || 0;
    total += (erros[k].acertos || 0) + (erros[k].erros || 0);
  }
  const taxa = total > 0 ? Math.round((acertos / total) * 100) : null;
  $('stat-acertos').textContent = taxa !== null ? `${taxa}%` : '—';
}

function popularBadge(perfil) {
  const badge = getBadge(perfil.xpTotal || 0);
  $('stat-badge').textContent = badge.emoji;
  $('stat-badge-nome').textContent = badge.nome;
}

async function popularContinuar() {
  const wrap = $('continue-card-wrap');
  const ultima = localStorage.getItem(CHAVE_ULTIMA_MATERIA);
  if (!ultima) { wrap.innerHTML = ''; return; }

  const materia = MATERIAS.find(m => m.key === ultima);
  if (!materia) { wrap.innerHTML = ''; return; }

  const contagens = await getContagens();
  wrap.innerHTML = continueCardTemplate({
    materiaNome: materia.nome,
    qtdPendente: contagens[ultima] || 0,
    ultimaMateria: ultima,
  });
}

/**
 * Heatmap de 30 dias com base no histórico salvo no localStorage.
 * Cada célula = um dia, intensidade proporcional ao XP daquele dia.
 */
function popularHeatmap() {
  const cont = $('heatmap');
  const historico = getHistorico();

  const hoje = new Date();
  const cells = [];
  let totalXp30d = 0;

  for (let i = 29; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - i);
    const chave = d.toISOString().slice(0, 10);
    const xp = historico[chave] || 0;
    totalXp30d += xp;

    const nivel = xpParaNivel(xp);
    const isHoje = i === 0;
    cells.push(
      `<div class="heatmap__cell ${nivel ? 'heatmap__cell--l' + nivel : ''} ${isHoje ? 'heatmap__cell--today' : ''}"
            title="${formatarData(d)}: ${xp} XP"></div>`
    );
  }

  cont.innerHTML = cells.join('');
  $('heatmap-total').textContent = totalXp30d > 0 ? `${totalXp30d} XP` : 'Sem atividade';
}

function xpParaNivel(xp) {
  if (xp === 0)  return 0;
  if (xp < 30)   return 1;
  if (xp < 80)   return 2;
  if (xp < 150)  return 3;
  return 4;
}

function getHistorico() {
  const raw = localStorage.getItem(CHAVE_HISTORICO_DIA);
  if (!raw) return {};
  try { return JSON.parse(raw); }
  catch { return {}; }
}

/**
 * Helper exportado: chame no fim de cada simulado pra registrar XP do dia.
 */
export function registrarXpHoje(xp) {
  const hist = getHistorico();
  const hoje = new Date().toISOString().slice(0, 10);
  hist[hoje] = (hist[hoje] || 0) + xp;
  // Mantém só últimos 90 dias pra não inflar o storage
  const corte = new Date();
  corte.setDate(corte.getDate() - 90);
  const corteStr = corte.toISOString().slice(0, 10);
  for (const k in hist) {
    if (k < corteStr) delete hist[k];
  }
  localStorage.setItem(CHAVE_HISTORICO_DIA, JSON.stringify(hist));
}

/**
 * Helper exportado: chame ao iniciar simulado de matéria pra lembrar próxima vez.
 */
export function registrarUltimaMateria(materiaKey) {
  localStorage.setItem(CHAVE_ULTIMA_MATERIA, materiaKey);
}

function formatarData(d) {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

// ─────────── EVENTOS ───────────

async function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'home') return;

  const alvo = e.target.closest('[data-action], [data-goto]');
  if (!alvo) return;

  if (alvo.dataset.goto) {
    ir(alvo.dataset.goto);
    return;
  }

  switch (alvo.dataset.action) {
    case 'continuar': {
      const materia = alvo.dataset.materia;
      // Por enquanto, leva pra simulado-tab pré-selecionando a matéria
      sessionStorage.setItem('ev_pre_materia', materia);
      ir('estudo-screen');
      break;
    }
    case 'logout': {
      await logout();
      toast('Até logo! 👋');
      ir('auth-login');
      break;
    }
    case 'abrir-menu': {
      // Por enquanto leva pra perfil — depois podemos fazer um drawer
      ir('perfil');
      break;
    }
  }
}

const $ = (id) => document.getElementById(id);
