// ============================================================
// STORE GLOBAL
// Estado reativo mínimo. Sem Redux, sem Zustand — 50 linhas.
//
// Uso:
//   import { store } from './store.js';
//   store.set('perfil', novoPerfil);
//   store.subscribe('perfil', (p) => atualizarUI(p));
// ============================================================

class Store {
  constructor(estadoInicial = {}) {
    this.estado = estadoInicial;
    this.ouvintes = new Map(); // chave -> Set<callback>
  }

  /** Lê valor de uma chave. */
  get(chave) {
    return this.estado[chave];
  }

  /** Lê estado inteiro (cuidado: snapshot, não reativo). */
  getAll() {
    return { ...this.estado };
  }

  /**
   * Define valor de uma chave e notifica ouvintes.
   * Se valor for igual (===), não notifica.
   */
  set(chave, valor) {
    if (this.estado[chave] === valor) return;
    this.estado[chave] = valor;
    this.notificar(chave, valor);
  }

  /** Atualiza várias chaves de uma vez. */
  patch(obj) {
    Object.entries(obj).forEach(([k, v]) => this.set(k, v));
  }

  /**
   * Inscreve callback pra mudanças numa chave.
   * Retorna função pra cancelar inscrição.
   */
  subscribe(chave, callback) {
    if (!this.ouvintes.has(chave)) {
      this.ouvintes.set(chave, new Set());
    }
    this.ouvintes.get(chave).add(callback);
    return () => this.ouvintes.get(chave)?.delete(callback);
  }

  notificar(chave, valor) {
    this.ouvintes.get(chave)?.forEach(cb => {
      try { cb(valor); }
      catch (err) { console.error(`[store] erro no ouvinte de "${chave}"`, err); }
    });
  }
}

// Instância única exportada
export const store = new Store({
  perfil: null,
  sessaoAtual: null,
  questoesPorMateria: {},
  telaAtual: null,
});
