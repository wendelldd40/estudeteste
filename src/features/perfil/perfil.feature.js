// ============================================================
// PERFIL — Template + Controller
// Personalização: nome, role, semestre, avatar.
// ============================================================

import { getPerfil, setPerfil, getBadge, sincronizarPerfil } from '../../data/perfil.repo.js';
import { aoEntrar } from '../../core/router.js';
import { toastSucesso } from '../../core/toast.js';
import { logout } from '../../data/auth.repo.js';

const ROLES = [
  { id: 'estudante',   icon: '📚', label: 'Estudante de Veterinária' },
  { id: 'veterinario', icon: '🩺', label: 'Médico(a) Veterinário(a)' },
  { id: 'outros',      icon: '🌿', label: 'Outro / Entusiasta' },
];

const AVATARES = [
  '🐕','🐩','🐈','🐇','🐹','🦜','🦦','🐢',
  '🐄','🐂','🐎','🐖','🐑','🐓','🐐','🦙',
  '🐍','🦎','🐒','🦉','🐯','🐘','🦊','🩺',
  '💉','🔬','🧬','🐾','🦴','🏥','💊','🎓',
  '👨‍⚕️','👩‍⚕️','🧑‍🔬','🌱','⭐','🏆','🔥','✨',
];

const SEMESTRES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Estado de edição (não persiste até salvar)
let edicao = null;

// ─────────── TEMPLATE ───────────

export function perfilTemplate() {
  return `
    <div id="perfil" class="screen perfil">
      <header class="analise__header">
        <button class="page-header__back" data-goto="home" aria-label="Voltar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        <div style="flex:1;">
          <h1 class="page-header__title">👤 Perfil</h1>
          <p class="page-header__sub">Personalize sua presença na plataforma</p>
        </div>
      </header>

      <div class="perfil__body">
        <div id="perfil-content"><!-- preenchido dinamicamente --></div>
      </div>
    </div>
  `;
}

// ─────────── CONTROLLER ───────────

export function montarPerfil() {
  aoEntrar('perfil', popular);
  document.addEventListener('click', tratarClique);
  document.addEventListener('input', tratarInput);
}

function popular() {
  const perfil = getPerfil();
  if (!perfil) return;

  // Inicia estado de edição com snapshot do perfil
  edicao = {
    nome: perfil.nome || '',
    role: perfil.role || 'estudante',
    semestre: perfil.semestre || 5,
    avatar: perfil.avatar || '🐾',
  };

  renderizar();
}

function renderizar() {
  const cont = document.getElementById('perfil-content');
  if (!cont) return;

  const perfil = getPerfil();
  const badge = getBadge(perfil?.xpTotal || 0);
  const roleObj = ROLES.find(r => r.id === edicao.role) || ROLES[0];

  cont.innerHTML = `
    <!-- Preview -->
    <div class="perfil-preview">
      <div class="perfil-preview__avatar">${edicao.avatar}</div>
      <div class="perfil-preview__info">
        <div class="perfil-preview__nome">${escapar(edicao.nome || '—')}</div>
        <div class="perfil-preview__role">${roleObj.icon} ${roleObj.label}</div>
        ${edicao.role === 'estudante'
          ? `<div class="perfil-preview__sem">${edicao.semestre}º semestre</div>`
          : ''}
      </div>
      <div class="perfil-preview__xp">
        <div class="perfil-preview__xp-num">${perfil?.xpTotal || 0}</div>
        <div class="perfil-preview__xp-label">XP</div>
      </div>
    </div>

    <!-- Badge atual -->
    <div class="card" style="margin-bottom: var(--space-6); display: flex; align-items: center; gap: var(--space-3);">
      <div style="font-size: 2.4rem;">${badge.emoji}</div>
      <div style="flex: 1;">
        <div style="font-family: var(--font-display); font-weight: var(--fw-bold); font-size: var(--fs-md);">
          ${badge.nome}
        </div>
        <div style="font-size: var(--fs-xs); color: var(--text-tertiary);">Sua patente atual</div>
      </div>
      <button class="btn btn--ghost btn--sm" data-goto="conquistas">Ver todas →</button>
    </div>

    <!-- Nome -->
    <section class="perfil-section">
      <h3 class="perfil-section__title">Nome</h3>
      <div class="field">
        <div class="field__input-wrap">
          <span class="field__icon">✏️</span>
          <input id="pf-nome" class="field__input field__input--with-icon"
                 type="text" maxlength="40"
                 value="${escapar(edicao.nome)}" placeholder="Como quer ser chamado?">
        </div>
      </div>
    </section>

    <!-- Role -->
    <section class="perfil-section">
      <h3 class="perfil-section__title">Você é</h3>
      <div class="role-grid">
        ${ROLES.map(r => `
          <button class="role-btn ${r.id === edicao.role ? 'selected' : ''}"
                  data-role="${r.id}">
            <div class="role-btn__icon">${r.icon}</div>
            <div class="role-btn__label">${r.label}</div>
          </button>
        `).join('')}
      </div>
    </section>

    <!-- Semestre (só estudantes) -->
    ${edicao.role === 'estudante' ? `
      <section class="perfil-section">
        <h3 class="perfil-section__title">Semestre atual</h3>
        <div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-2);">
          ${SEMESTRES.map(s => `
            <button class="role-btn ${s === edicao.semestre ? 'selected' : ''}"
                    data-semestre="${s}"
                    style="padding: var(--space-3) var(--space-1);">
              <div style="font-family: var(--font-display); font-weight: var(--fw-bold); font-size: var(--fs-md);">${s}º</div>
            </button>
          `).join('')}
        </div>
      </section>
    ` : ''}

    <!-- Avatar -->
    <section class="perfil-section">
      <h3 class="perfil-section__title">Escolha seu avatar</h3>
      <div class="avatar-grid">
        ${AVATARES.map(a => `
          <button class="avatar-opt ${a === edicao.avatar ? 'selected' : ''}"
                  data-avatar="${a}">${a}</button>
        `).join('')}
      </div>
    </section>

    <!-- Save -->
    <div class="perfil-save">
      <button class="btn btn--primary btn--block btn--lg" data-action="salvar">
        💾 Salvar alterações
      </button>
      <button class="btn btn--ghost btn--block btn--lg" data-action="logout"
        style="margin-top: var(--space-3); color: var(--danger, #C64B5D); border-color: var(--danger, #C64B5D);">
        🚪 Sair da conta
      </button>
    </div>
  `;
}

function tratarClique(e) {
  const tela = document.querySelector('.screen.active');
  if (tela?.id !== 'perfil' || !edicao) return;

  // Role
  const roleEl = e.target.closest('[data-role]');
  if (roleEl) {
    edicao.role = roleEl.dataset.role;
    renderizar();
    return;
  }

  // Semestre
  const semEl = e.target.closest('[data-semestre]');
  if (semEl) {
    edicao.semestre = parseInt(semEl.dataset.semestre, 10);
    renderizar();
    return;
  }

  // Avatar
  const avatarEl = e.target.closest('[data-avatar]');
  if (avatarEl) {
    edicao.avatar = avatarEl.dataset.avatar;
    renderizar();
    return;
  }

  // Salvar
  const acao = e.target.closest('[data-action]')?.dataset.action;
  if (acao === 'salvar') salvar();
  if (acao === 'logout') logout();
}

function tratarInput(e) {
  if (!edicao) return;
  if (e.target?.id === 'pf-nome') {
    edicao.nome = e.target.value.trim();
    // Atualiza só o preview, sem re-renderizar tudo
    const preview = document.querySelector('.perfil-preview__nome');
    if (preview) preview.textContent = edicao.nome || '—';
  }
}

async function salvar() {
  if (!edicao) return;

  if (!edicao.nome || edicao.nome.length < 2) {
    toastSucesso('Informe um nome com pelo menos 2 caracteres');
    return;
  }

  const perfil = getPerfil() || {};
  const novo = {
    ...perfil,
    nome:     edicao.nome,
    role:     edicao.role,
    semestre: edicao.semestre,
    avatar:   edicao.avatar,
  };

  setPerfil(novo);
  toastSucesso('✅ Perfil salvo!');

  // Sincroniza em background
  sincronizarPerfil().catch(() => {});
}

function escapar(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
