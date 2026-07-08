// ============================================================
// CLIENTE SUPABASE
// Cria UMA instância e exporta. Resto do app importa daqui.
//
// Por que separar: hoje o `sb` é criado na linha 7832, no meio
// das funções de simulado. Se outra função roda antes, quebra.
// Aqui, ao importar, está pronto.
// ============================================================

import { createClient } from '@supabase/supabase-js';

// Em produção real, mover pra variáveis de ambiente:
//   import.meta.env.VITE_SUPABASE_URL
//   import.meta.env.VITE_SUPABASE_ANON_KEY
// Por enquanto, mantenho hardcoded pra paridade com o v8.
const SUPA_URL = 'https://hlvspavdjosabdycizen.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhsdnNwYXZkam9zYWJkeWNpemVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTgxNzUsImV4cCI6MjA4OTY3NDE3NX0.7aeOEhm7KTS4K2fyHyA9Ss8NK_Ed3Gpv9qk83Ua2ScU';

export const sb = createClient(SUPA_URL, SUPA_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// ---------- HELPERS ----------

/**
 * Wrapper padronizado pras chamadas Supabase.
 * Retorna { data, error } sempre — evita try/catch repetido em cada repo.
 */
export async function safeQuery(promise, contexto = 'query') {
  try {
    const { data, error } = await promise;
    if (error) {
      console.error(`[supabase:${contexto}]`, error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error(`[supabase:${contexto}] exception`, err);
    return { data: null, error: err };
  }
}

/**
 * ID do usuário atual no Supabase (salvo no localStorage).
 * Compatível com o esquema antigo (`ev_supa_id`).
 */
export function getSupaId() {
  return localStorage.getItem('ev_supa_id') || null;
}

export function setSupaId(id) {
  localStorage.setItem('ev_supa_id', id);
}

export function clearSupaId() {
  localStorage.removeItem('ev_supa_id');
}
