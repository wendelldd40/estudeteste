// ============================================================
// TOAST
// Sistema de notificações flutuantes.
// Substitui o showToast() do v8 com fila e tipos.
// ============================================================

const TIPOS = {
  default: { bg: 'var(--gold)',  cor: '#3A2A14' },
  success: { bg: 'var(--success)',       cor: '#fff' },
  warning: { bg: 'var(--gold)',       cor: '#3A2A14' },
  danger:  { bg: 'var(--danger)',        cor: '#fff' },
  info:    { bg: 'var(--info)',          cor: '#fff' },
};

const fila = [];
let mostrando = false;
let container = null;

function getContainer() {
  if (container) return container;
  container = document.createElement('div');
  container.className = 'ev-toast-container';
  container.setAttribute('aria-live', 'polite');
  container.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-toast);
    pointer-events: none;
  `;
  document.body.appendChild(container);
  return container;
}

/**
 * Mostra um toast.
 * @param {string} mensagem
 * @param {object} opts — { tipo, duracao }
 */
export function toast(mensagem, opts = {}) {
  fila.push({ mensagem, tipo: opts.tipo || 'default', duracao: opts.duracao || 2400 });
  if (!mostrando) processarFila();
}

// Atalhos por tipo
export const toastSucesso = (msg, opts) => toast(msg, { ...opts, tipo: 'success' });
export const toastErro    = (msg, opts) => toast(msg, { ...opts, tipo: 'danger'  });
export const toastAviso   = (msg, opts) => toast(msg, { ...opts, tipo: 'warning' });
export const toastInfo    = (msg, opts) => toast(msg, { ...opts, tipo: 'info'    });

function processarFila() {
  if (fila.length === 0) {
    mostrando = false;
    return;
  }
  mostrando = true;
  const { mensagem, tipo, duracao } = fila.shift();
  exibir(mensagem, tipo, duracao).then(processarFila);
}

function exibir(mensagem, tipo, duracao) {
  return new Promise(resolver => {
    const cores = TIPOS[tipo] || TIPOS.default;
    const el = document.createElement('div');
    el.className = 'ev-toast';
    el.textContent = mensagem;
    el.style.cssText = `
      background: ${cores.bg};
      color: ${cores.cor};
      border-radius: var(--radius-pill);
      padding: 10px 24px;
      font-family: var(--font-display);
      font-weight: var(--fw-bold);
      font-size: var(--fs-base);
      box-shadow: var(--shadow-md);
      transform: translateY(-80px);
      opacity: 0;
      transition: transform var(--t-slow) var(--ease-out), opacity var(--t-slow) var(--ease-out);
      white-space: nowrap;
      pointer-events: auto;
      margin-bottom: 8px;
    `;
    getContainer().appendChild(el);

    // entrada
    requestAnimationFrame(() => {
      el.style.transform = 'translateY(0)';
      el.style.opacity = '1';
    });

    // saída
    setTimeout(() => {
      el.style.transform = 'translateY(-80px)';
      el.style.opacity = '0';
      setTimeout(() => {
        el.remove();
        resolver();
      }, 400);
    }, duracao);
  });
}
