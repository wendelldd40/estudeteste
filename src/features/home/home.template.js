// ============================================================
// HOME — TEMPLATE v10 · Universo ZeloVet
// Hero card (streak + anel de meta diária) → ação → contexto
// ============================================================

export function homeTemplate() {
  return `
    <div id="home" class="screen home">
      <div class="home__container">

        <!-- HERO CARD: a "one big thing" -->
        <section class="hero-card">
          <div class="hero-card__glow"></div>
          <div class="hero-card__glow hero-card__glow--2"></div>

          <div class="hero-card__top">
            <div class="hero-card__who">
              <div class="hero-card__hello" id="hero-saudacao">Olá,</div>
              <h1 class="hero-card__name" id="hero-nome">—</h1>
              <div class="hero-card__date" id="hero-data"></div>
            </div>

            <div class="hero-ring" title="Meta diária de XP">
              <svg viewBox="0 0 84 84">
                <circle class="hero-ring__track" cx="42" cy="42" r="34"/>
                <circle class="hero-ring__fill" id="xp-ring" cx="42" cy="42" r="34"
                        stroke-dasharray="213.6" stroke-dashoffset="213.6"/>
              </svg>
              <div class="hero-ring__center">
                <div class="hero-ring__num" id="xp-dia-num">0</div>
                <div class="hero-ring__cap">de 200 XP</div>
              </div>
            </div>
          </div>

          <div class="hero-card__bottom">
            <div class="hero-streak">
              <span class="hero-streak__flame">🔥</span>
              <div>
                <div class="hero-streak__num" id="streak-num">0</div>
                <div class="hero-streak__label" id="streak-label">dias seguidos</div>
              </div>
            </div>
            <div class="hero-week" id="hero-week"></div>
            <div class="hero-xp">
              <div class="hero-xp__label">XP total</div>
              <div class="hero-xp__num" id="xp-total">0</div>
            </div>
          </div>
        </section>

        <!-- CONTINUAR: a ação nº 1 -->
        <div id="continue-card-wrap"></div>

        <!-- STATS -->
        <section class="stats-row">
          <div class="stat-mini">
            <div class="stat-mini__icon stat-mini__icon--teal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>
            </div>
            <div>
              <div class="stat-mini__num" id="stat-questoes">0</div>
              <div class="stat-mini__label">Questões resolvidas</div>
            </div>
          </div>
          <div class="stat-mini">
            <div class="stat-mini__icon stat-mini__icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/></svg>
            </div>
            <div>
              <div class="stat-mini__num" id="stat-acertos">—</div>
              <div class="stat-mini__label">Taxa de acertos</div>
            </div>
          </div>
          <div class="stat-mini">
            <div class="stat-mini__icon stat-mini__icon--gold" id="stat-badge">🐣</div>
            <div>
              <div class="stat-mini__num stat-mini__num--nivel" id="stat-badge-nome">Iniciante</div>
              <div class="stat-mini__label">Seu nível</div>
            </div>
          </div>
        </section>

        <!-- ESTUDAR AGORA -->
        <h3 class="section-title">Estudar agora</h3>
        <div class="actions-primary">
          <button class="action-card action-card--featured" data-goto="estudo-screen">
            <div class="action-card__icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg>
            </div>
            <div class="action-card__title">Fazer questões</div>
            <div class="action-card__desc">Simulado por matéria com análise</div>
            <span class="action-card__go">→</span>
          </button>
          <button class="action-card" data-goto="estudo-screen">
            <div class="action-card__icon action-card__icon--gold">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
            </div>
            <div class="action-card__title">Estudar</div>
            <div class="action-card__desc">Teoria guiada por capítulos</div>
            <span class="action-card__go">→</span>
          </button>
          <button class="action-card" data-goto="flashcards">
            <div class="action-card__icon action-card__icon--blue">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            </div>
            <div class="action-card__title">Flashcards</div>
            <div class="action-card__desc">Revisão rápida e espaçada</div>
            <span class="action-card__go">→</span>
          </button>
          <button class="action-card" data-goto="concursos">
            <div class="action-card__icon action-card__icon--wine">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 22h18"/><path d="M5 18v-7M9.5 18v-7M14.5 18v-7M19 18v-7"/><path d="M12 2 3 8h18z"/></svg>
            </div>
            <div class="action-card__title">Concursos</div>
            <div class="action-card__desc">Editais ADAB e simulados reais</div>
            <span class="action-card__go">→</span>
          </button>
        </div>

        <!-- ATIVIDADE -->
        <section class="heatmap-card">
          <div class="heatmap-card__hd">
            <div>
              <div class="heatmap-card__title">Sua constância</div>
              <div class="heatmap-card__sub">Últimos 30 dias</div>
            </div>
            <span class="heatmap-card__total" id="heatmap-total">—</span>
          </div>
          <div class="heatmap" id="heatmap"></div>
        </section>

        <!-- ATALHOS -->
        <div class="shortcuts">
          <button class="shortcut" data-goto="ranking"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8"/><path d="M12 17v4"/><path d="M7 4h10v6a5 5 0 0 1-10 0z"/><path d="M7 6H4a1 1 0 0 0-1 1 4 4 0 0 0 4 4"/><path d="M17 6h3a1 1 0 0 1 1 1 4 4 0 0 1-4 4"/></svg>Ranking</button>
          <button class="shortcut" data-goto="evolucao"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>Evolução</button>
          <button class="shortcut" data-goto="conquistas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="M9 14.5 7.5 22l4.5-2.5L16.5 22 15 14.5"/></svg>Conquistas</button>
          <button class="shortcut" data-goto="analise"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></svg>Análise</button>
          <button class="shortcut" data-goto="perfil"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/></svg>Perfil</button>
        </div>

      </div>
    </div>
  `;
}

export function continueCardTemplate({ materiaNome, qtdPendente, ultimaMateria }) {
  if (!ultimaMateria) return '';
  return `
    <button class="continue-card" data-action="continuar" data-materia="${ultimaMateria}">
      <div class="continue-card__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 3 20 12 6 21 6 3"/></svg>
      </div>
      <div class="continue-card__body">
        <div class="continue-card__label">Continuar de onde parou</div>
        <div class="continue-card__title">${materiaNome}</div>
        <div class="continue-card__sub">${qtdPendente} questões disponíveis · ~10 min</div>
      </div>
      <div class="continue-card__arrow">→</div>
    </button>
  `;
}
