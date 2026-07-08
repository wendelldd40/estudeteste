// ============================================================
// REPOSITÓRIO DE AUTENTICAÇÃO
// Login, cadastro, recuperação. Usa Supabase Auth.
// ============================================================

import { sb, safeQuery, clearSupaId } from './client.js';

/**
 * Login com email + senha.
 * Retorna { ok, user?, error? }.
 */
export async function login(email, senha) {
  const { data, error } = await sb.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  });

  if (error) {
    return { ok: false, error: traduzirErroAuth(error) };
  }

  return { ok: true, user: data.user, session: data.session };
}

/**
 * Cadastro de novo usuário.
 */
export async function cadastrar({ email, senha, nome }) {
  const { data, error } = await sb.auth.signUp({
    email: email.trim().toLowerCase(),
    password: senha,
    options: {
      data: { nome }, // metadata do usuário
    },
  });

  if (error) {
    return { ok: false, error: traduzirErroAuth(error) };
  }

  return { ok: true, user: data.user };
}

/**
 * Logout — limpa sessão e ID local.
 */
export async function logout() {
  await sb.auth.signOut();
  clearSupaId();
  return { ok: true };
}

/**
 * Envia email de recuperação de senha.
 */
export async function recuperarSenha(email) {
  const { error } = await sb.auth.resetPasswordForEmail(email.trim().toLowerCase());
  if (error) return { ok: false, error: traduzirErroAuth(error) };
  return { ok: true };
}

/**
 * Sessão atual (se houver).
 */
export async function getSessao() {
  const { data } = await sb.auth.getSession();
  return data.session;
}

/**
 * Listener de mudanças de auth (login, logout, refresh).
 * Retorna função pra remover o listener.
 */
export function onMudancaAuth(callback) {
  const { data } = sb.auth.onAuthStateChange((evento, sessao) => {
    callback({ evento, sessao });
  });
  return () => data.subscription.unsubscribe();
}

// ---------- HELPERS ----------

/**
 * Traduz erros do Supabase pra mensagens amigáveis em português.
 */
function traduzirErroAuth(error) {
  const msg = error.message || '';

  if (msg.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Cheque a caixa de entrada.';
  }
  if (msg.includes('User already registered')) {
    return 'Já existe uma conta com esse e-mail. Tente fazer login.';
  }
  if (msg.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres.';
  }
  if (msg.includes('Unable to validate email')) {
    return 'E-mail inválido. Verifique se está digitado corretamente.';
  }
  if (msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
  }

  return msg || 'Erro desconhecido. Tente novamente.';
}
