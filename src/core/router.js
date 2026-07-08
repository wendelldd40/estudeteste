// ============================================================
// ROUTER
// Substitui o `showScreen(id)` do v8 com:
//  - integração com History API (botão voltar do navegador funciona)
//  - hook de "antes de sair" (pra confirmar saída no meio do simulado)
//  - eventos pra outras partes do app reagirem
// ============================================================

import { store } from '../state/store.js';

const TELA_INICIAL = 'auth-login';
const ouvintes = new Map(); // id -> handler chamado ao entrar na tela
let telaAtual = null;
let bloqueio = null; // se setado, função que decide se pode sair

/**
 * Navega pra uma tela.
 * @param {string} id  — id do elemento DOM
 * @param {object} opts — { skipHistory: boolean, params: object }
 */
export function ir(id, opts = {}) {
  // Bloquear acesso a telas protegidas se não autenticado
  const ehAuth = id.startsWith(TELAS_PROTEGIDAS_PREFIXO);
  if (!ehAuth && !opts.forcar && !estaAutenticado()) {
    id = 'auth-login';
  }

  // Bloquear admin para não-admins
  if (id === 'adm' && localStorage.getItem('ev_is_admin') !== 'true') {
    id = 'home';
  }

  // Pergunta se pode sair da tela atual
  if (bloqueio && telaAtual && telaAtual !== id) {
    const podeSair = bloqueio(telaAtual, id);
    if (!podeSair) return false;
  }

  const proxima = document.getElementById(id);
  if (!proxima) {
    console.warn(`[router] tela "${id}" não encontrada`);
    return false;
  }

  // Esconde todas
  document.querySelectorAll('.screen, .page').forEach(s => s.classList.remove('active'));
  proxima.classList.add('active');

  telaAtual = id;
  store.set('telaAtual', id);

  if (!opts.skipHistory) {
    history.pushState({ tela: id, params: opts.params || {} }, '', `#${id}`);
  }

  // Dispara handler registrado
  const handler = ouvintes.get(id);
  if (handler) handler(opts.params || {});

  // Scroll pro topo — rola o #main (não o window, que tem overflow:hidden)
  const mainEl = document.getElementById('main');
  if (mainEl) mainEl.scrollTop = 0;
  const pgScroll = proxima.querySelector('.pg-scroll');
  if (pgScroll) pgScroll.scrollTop = 0;

  return true;
}

/**
 * Registra handler chamado quando o app navega pra `id`.
 * Útil pra carregar dados quando a tela aparece.
 */
export function aoEntrar(id, handler) {
  ouvintes.set(id, handler);
}

/**
 * Define função que decide se pode sair da tela atual.
 * Útil pra "Tem certeza que quer sair? Você está no meio do simulado".
 * Passe `null` pra remover.
 */
export function bloquearSaida(fn) {
  bloqueio = fn;
}

export function getTelaAtual() {
  return telaAtual;
}

/**
 * Inicializa o router. Chamar uma vez no boot do app.
 */
// Telas que exigem login — qualquer tela que não seja auth-*
const TELAS_PROTEGIDAS_PREFIXO = 'auth-';

/** Verifica se o usuário está autenticado (localStorage). */
function estaAutenticado() {
  try {
    // Basta ter perfil salvo OU sessão ativa do Supabase (ev_sb_session)
    const perfil = localStorage.getItem('ev_perfil');
    if (perfil) return true;
    // Checar se tem sessão ativa do Supabase no localStorage
    const keys = Object.keys(localStorage);
    return keys.some(k => k.includes('supabase') || k.includes('sb-'));
  } catch { return false; }
}

export function iniciarRouter({ telaInicial = TELA_INICIAL } = {}) {
  // Checa hash da URL
  const hashTela = location.hash.replace('#', '');
  let inicial = telaInicial;

  if (hashTela && document.getElementById(hashTela)) {
    // Proteger telas autenticadas: se não está logado, redireciona pro login
    const ehAuth = hashTela.startsWith(TELAS_PROTEGIDAS_PREFIXO);
    if (!ehAuth && !estaAutenticado()) {
      // Não está logado e tentou acessar uma tela protegida via URL
      inicial = 'auth-login';
    } else {
      inicial = hashTela;
    }
  }

  ir(inicial, { skipHistory: true });

  // Botão voltar do navegador
  window.addEventListener('popstate', (e) => {
    const tela = e.state?.tela || telaInicial;
    ir(tela, { skipHistory: true, params: e.state?.params });
  });
}
