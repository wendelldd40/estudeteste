// ============================================================
// AUTH — TEMPLATE HTML
// Função pura que retorna a string HTML das 3 telas auth.
// Injetada no DOM uma vez no boot.
// ============================================================

export function authTemplate() {
  return `
    <!-- LOGIN -->
    <div id="auth-login" class="screen auth">
      <div class="auth__bg">
        <div class="auth__orb auth__orb--1"></div>
        <div class="auth__orb auth__orb--2"></div>
      </div>

      <div class="auth__wrap">
        <div class="auth__brand">
          <div class="auth__logo auth__logo--seal"><svg viewBox="0 0 24 24" fill="none" width="34" height="34"><path d="M5 5h14L5 19h14" stroke="#0C3328" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19" cy="5" r="2.2" fill="#C99D66"/></svg></div>
          <div class="auth__logo-text">Estude<span>Vet</span></div>
          <div class="auth__by">BY ZELOVET</div>
          <div class="auth__tagline">Medicina Veterinária · Plataforma de Estudos</div>
        </div>

        <div class="auth__card">
          <h2 class="auth__title">Entrar na conta</h2>
          <p class="auth__subtitle">Bem-vindo de volta. Continue de onde parou.</p>

          <div class="field">
            <label class="field__label" for="login-email">E-mail</label>
            <div class="field__input-wrap">
              <span class="field__icon">✉</span>
              <input id="login-email" class="field__input field__input--with-icon"
                     type="email" placeholder="seu@email.com" autocomplete="email">
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="login-senha">Senha</label>
            <div class="field__input-wrap">
              <span class="field__icon">🔒</span>
              <input id="login-senha" class="field__input field__input--with-icon"
                     type="password" placeholder="••••••••" autocomplete="current-password">
              <button type="button" class="field__action" data-toggle-senha="login-senha"
                      tabindex="-1" aria-label="Mostrar senha">👁</button>
            </div>
          </div>

          <div id="login-msg" class="msg msg--err"></div>

          <label class="auth__remember">
            <input type="checkbox" id="login-lembrar" checked>
            <span class="auth__remember-text">Lembrar-me neste dispositivo</span>
          </label>

          <button class="btn btn--primary btn--block" id="login-btn" data-action="login">
            <span data-text>Entrar</span>
            <span class="btn__loader" data-loader hidden></span>
          </button>

          <div class="divider"><span>ou</span></div>

          <button class="btn btn--secondary btn--block" data-goto="auth-cadastro">
            Criar conta gratuita →
          </button>

          <button class="auth__link" data-action="recuperar">Esqueci minha senha</button>
        </div>

        <div class="auth__footer">🔒 Seus dados são protegidos</div>
      </div>
    </div>

    <!-- CADASTRO -->
    <div id="auth-cadastro" class="screen auth">
      <div class="auth__bg">
        <div class="auth__orb auth__orb--1"></div>
        <div class="auth__orb auth__orb--2"></div>
      </div>

      <div class="auth__wrap">
        <div class="auth__brand">
          <div class="auth__logo auth__logo--seal"><svg viewBox="0 0 24 24" fill="none" width="34" height="34"><path d="M5 5h14L5 19h14" stroke="#0C3328" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="19" cy="5" r="2.2" fill="#C99D66"/></svg></div>
          <div class="auth__logo-text">Estude<span>Vet</span></div>
          <div class="auth__by">BY ZELOVET</div>
          <div class="auth__tagline">Crie sua conta e comece a estudar</div>
        </div>

        <div class="auth__card">
          <h2 class="auth__title">Criar conta</h2>
          <p class="auth__subtitle">Grátis. Progresso sincronizado em qualquer dispositivo.</p>

          <div class="field">
            <label class="field__label" for="cad-nome">Seu nome</label>
            <div class="field__input-wrap">
              <span class="field__icon">👤</span>
              <input id="cad-nome" class="field__input field__input--with-icon"
                     type="text" placeholder="Como quer ser chamado?" maxlength="40" autocomplete="name">
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="cad-email">E-mail</label>
            <div class="field__input-wrap">
              <span class="field__icon">✉</span>
              <input id="cad-email" class="field__input field__input--with-icon"
                     type="email" placeholder="seu@email.com" autocomplete="email">
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="cad-senha">Senha</label>
            <div class="field__input-wrap">
              <span class="field__icon">🔒</span>
              <input id="cad-senha" class="field__input field__input--with-icon"
                     type="password" placeholder="Mínimo 8 caracteres" autocomplete="new-password">
              <button type="button" class="field__action" data-toggle-senha="cad-senha"
                      tabindex="-1" aria-label="Mostrar senha">👁</button>
            </div>
            <div class="auth__strength" id="cad-strength" hidden>
              <div class="auth__strength-bar"><div class="auth__strength-fill" id="cad-strength-fill"></div></div>
              <span class="auth__strength-label" id="cad-strength-label"></span>
            </div>
          </div>

          <div class="field">
            <label class="field__label" for="cad-senha2">Confirmar senha</label>
            <div class="field__input-wrap">
              <span class="field__icon">🔒</span>
              <input id="cad-senha2" class="field__input field__input--with-icon"
                     type="password" placeholder="Repita a senha" autocomplete="new-password">
            </div>
          </div>

          <div class="auth__opt-toggle active" id="cad-ranking-toggle" data-action="toggle-ranking">
            <div class="auth__opt-circle"><span>✓</span></div>
            <div class="auth__opt-text">
              <strong>Participar do ranking da turma</strong>
              <span>Seu nome aparece no placar · máximo 200 XP/dia</span>
            </div>
          </div>

          <div id="cad-msg" class="msg"></div>

          <button class="btn btn--primary btn--block" id="cad-btn" data-action="cadastrar">
            <span data-text>Criar minha conta</span>
            <span class="btn__loader" data-loader hidden></span>
          </button>

          <div class="divider"><span>ou</span></div>

          <button class="btn btn--secondary btn--block" data-goto="auth-login">
            ← Já tenho conta
          </button>
        </div>

        <div class="auth__footer">🔒 Senha criptografada · nunca armazenada em texto puro</div>
      </div>
    </div>

    <!-- MODAL RECUPERAÇÃO -->
    <div id="modal-recuperar" class="auth__modal-overlay">
      <div class="auth__modal">
        <button class="auth__modal-close" data-action="fechar-recuperar" aria-label="Fechar">✕</button>
        <div class="auth__modal-icon">📧</div>
        <h3 class="auth__modal-title">Recuperar senha</h3>
        <p class="auth__modal-sub">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>

        <div class="field">
          <div class="field__input-wrap">
            <span class="field__icon">✉</span>
            <input id="rec-email" class="field__input field__input--with-icon"
                   type="email" placeholder="seu@email.com">
          </div>
        </div>

        <div id="rec-msg" class="msg"></div>

        <button class="btn btn--primary btn--block" id="rec-btn" data-action="enviar-recuperacao">
          <span data-text>Enviar link de recuperação</span>
          <span class="btn__loader" data-loader hidden></span>
        </button>
      </div>
    </div>
  `;
}
