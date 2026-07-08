// ============================================================
// AUTH — CONTROLLER
// Conecta o template aos repositórios. Lida com eventos de UI.
// ============================================================

import { login, cadastrar, recuperarSenha } from '../../data/auth.repo.js';
import { sb } from '../../data/client.js';
import { criarPerfil, getPerfil, setPerfil } from '../../data/perfil.repo.js';
import { ir } from '../../core/router.js';
import { toast, toastSucesso, toastErro } from '../../core/toast.js';

export function montarAuth() {
  // Delegação de eventos: um único listener cuida das 3 telas auth
  document.addEventListener('click', tratarClique);
  document.addEventListener('input', tratarInput);
  document.addEventListener('keydown', tratarTecla);
}

function tratarClique(e) {
  const alvo = e.target.closest('[data-action], [data-goto], [data-toggle-senha]');
  if (!alvo) return;

  // Toggle de visibilidade de senha
  if (alvo.dataset.toggleSenha) {
    alternarSenha(alvo.dataset.toggleSenha, alvo);
    return;
  }

  // Navegação simples
  if (alvo.dataset.goto) {
    ir(alvo.dataset.goto);
    return;
  }

  // Ações
  switch (alvo.dataset.action) {
    case 'login':            return acaoLogin();
    case 'cadastrar':        return acaoCadastrar();
    case 'recuperar':        return abrirModalRecuperar();
    case 'fechar-recuperar': return fecharModalRecuperar();
    case 'enviar-recuperacao': return acaoEnviarRecuperacao();
    case 'toggle-ranking':   return alternarRanking();
  }
}

function tratarInput(e) {
  if (e.target?.id === 'cad-senha') {
    avaliarForcaSenha(e.target.value);
  }
}

function tratarTecla(e) {
  if (e.key !== 'Enter') return;
  const tela = document.querySelector('.screen.active')?.id;

  if (tela === 'auth-login' && ['login-email', 'login-senha'].includes(e.target.id)) {
    acaoLogin();
  } else if (tela === 'auth-cadastro' && ['cad-nome', 'cad-email', 'cad-senha', 'cad-senha2'].includes(e.target.id)) {
    acaoCadastrar();
  } else if (e.target?.id === 'rec-email') {
    acaoEnviarRecuperacao();
  }
}

// ─────────── AÇÕES ───────────

async function acaoLogin() {
  const email = $val('login-email');
  const senha = $val('login-senha');
  const lembrar = $('login-lembrar')?.checked;

  if (!email || !senha) {
    return mostrarMsg('login-msg', 'Preencha e-mail e senha.', 'err');
  }

  setLoading('login-btn', true);
  esconderMsg('login-msg');

  const r = await login(email, senha);

  if (!r.ok) {
    setLoading('login-btn', false);
    return mostrarMsg('login-msg', r.error, 'err');
  }

  // Perfil local: cria se não tem ou puxa nome do user metadata
  if (!getPerfil()) {
    const nome = r.user?.user_metadata?.nome || email.split('@')[0];
    criarPerfil({ nome, email, ranking: true });
  } else {
    // Atualiza ultimoAcesso
    const p = getPerfil();
    p.ultimoAcesso = new Date().toISOString().slice(0, 10);
    setPerfil(p);
  }

  if (!lembrar) {
    // Sessão será limpa quando fechar o navegador (Supabase cuida disso via storage)
    sessionStorage.setItem('ev_no_persist', '1');
  }

  // Buscar is_admin do Supabase pelo email
  await verificarAdmin(email);

  toastSucesso('🐾 Bem-vindo!');
  ir('home', { forcar: true });
}

async function acaoCadastrar() {
  const nome   = $val('cad-nome');
  const email  = $val('cad-email');
  const senha  = $val('cad-senha');
  const senha2 = $val('cad-senha2');
  const ranking = $('cad-ranking-toggle')?.classList.contains('active');

  // Validações
  if (!nome || nome.length < 2) {
    return mostrarMsg('cad-msg', 'Informe seu nome.', 'err');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return mostrarMsg('cad-msg', 'E-mail inválido.', 'err');
  }
  if (senha.length < 8) {
    return mostrarMsg('cad-msg', 'A senha deve ter pelo menos 8 caracteres.', 'err');
  }
  if (senha !== senha2) {
    return mostrarMsg('cad-msg', 'As senhas não conferem.', 'err');
  }

  setLoading('cad-btn', true);
  esconderMsg('cad-msg');

  const r = await cadastrar({ email, senha, nome });

  if (!r.ok) {
    setLoading('cad-btn', false);
    return mostrarMsg('cad-msg', r.error, 'err');
  }

  // Cria perfil local
  criarPerfil({ nome, email, ranking });

  setLoading('cad-btn', false);
  mostrarMsg(
    'cad-msg',
    '✅ Conta criada! Verifique seu e-mail para confirmar e fazer login.',
    'ok'
  );

  // Após 2.5s, volta pro login com email pré-preenchido
  setTimeout(() => {
    const elEmail = $('login-email');
    if (elEmail) elEmail.value = email;
    ir('auth-login');
  }, 2500);
}

function abrirModalRecuperar() {
  const modal = $('modal-recuperar');
  if (modal) modal.classList.add('show');
  setTimeout(() => $('rec-email')?.focus(), 100);
}

function fecharModalRecuperar() {
  const modal = $('modal-recuperar');
  if (modal) modal.classList.remove('show');
  esconderMsg('rec-msg');
  if ($('rec-email')) $('rec-email').value = '';
}

async function acaoEnviarRecuperacao() {
  const email = $val('rec-email');
  if (!email) return mostrarMsg('rec-msg', 'Informe seu e-mail.', 'err');

  setLoading('rec-btn', true);
  esconderMsg('rec-msg');

  const r = await recuperarSenha(email);
  setLoading('rec-btn', false);

  if (!r.ok) return mostrarMsg('rec-msg', r.error, 'err');

  mostrarMsg('rec-msg', '✅ Link enviado! Verifique sua caixa de entrada.', 'ok');
  setTimeout(fecharModalRecuperar, 2500);
}

function alternarRanking() {
  $('cad-ranking-toggle')?.classList.toggle('active');
}

function alternarSenha(inputId, btn) {
  const input = $(inputId);
  if (!input) return;
  const visivel = input.type === 'text';
  input.type = visivel ? 'password' : 'text';
  btn.textContent = visivel ? '👁' : '🙈';
}

function avaliarForcaSenha(senha) {
  const wrap  = $('cad-strength');
  const fill  = $('cad-strength-fill');
  const label = $('cad-strength-label');
  if (!wrap || !fill || !label) return;

  if (!senha) { wrap.hidden = true; return; }
  wrap.hidden = false;

  let pontos = 0;
  if (senha.length >= 8)  pontos++;
  if (senha.length >= 12) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/[0-9]/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  const niveis = [
    { pct: 20, cor: 'var(--danger)',  txt: 'Fraca'    },
    { pct: 40, cor: 'var(--danger)',  txt: 'Fraca'    },
    { pct: 60, cor: 'var(--warning)', txt: 'Razoável' },
    { pct: 80, cor: 'var(--brand-green)', txt: 'Boa'  },
    { pct: 100, cor: 'var(--brand-green)', txt: 'Forte' },
  ];
  const n = niveis[Math.min(pontos, niveis.length - 1)];
  fill.style.width = n.pct + '%';
  fill.style.background = n.cor;
  label.textContent = n.txt;
  label.style.color = n.cor;
}

// ─────────── ADMIN CHECK ───────────

// Emails que têm acesso admin — adicione aqui
const ADMIN_EMAILS = [
  'wendelldd40@gmail.com',
];

async function verificarAdmin(email) {
  try {
    // 1. Checar lista hardcoded (garantia máxima de segurança)
    const isAdminEmail = ADMIN_EMAILS.includes(email.toLowerCase().trim());

    // 2. Checar no Supabase também (para admins adicionados via SQL)
    let isAdminSupa = false;
    const { data } = await sb
      .from('usuarios')
      .select('is_admin')
      .eq('email', email.toLowerCase().trim())
      .single();
    if (data?.is_admin) isAdminSupa = true;

    const isAdmin = isAdminEmail || isAdminSupa;
    localStorage.setItem('ev_is_admin', isAdmin ? 'true' : 'false');

    // Atualizar sidebar
    const adminBtn = document.getElementById('sidebar-admin-btn');
    if (adminBtn) adminBtn.style.display = isAdmin ? '' : 'none';
  } catch {
    localStorage.setItem('ev_is_admin', 'false');
  }
}

// ─────────── HELPERS ───────────

const $    = (id) => document.getElementById(id);
const $val = (id) => $(id)?.value.trim() || '';

function setLoading(btnId, loading) {
  const btn = $(btnId);
  if (!btn) return;
  const txt = btn.querySelector('[data-text]');
  const ldr = btn.querySelector('[data-loader]');
  btn.disabled = loading;
  if (txt) txt.style.display = loading ? 'none' : '';
  if (ldr) ldr.hidden = !loading;
}

function mostrarMsg(id, texto, tipo) {
  const el = $(id);
  if (!el) return;
  el.textContent = texto;
  el.className = `msg msg--${tipo === 'ok' ? 'ok' : 'err'} show`;
}

function esconderMsg(id) {
  $(id)?.classList.remove('show');
}
