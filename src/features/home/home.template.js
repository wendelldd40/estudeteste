// ============================================================
// HOME — TEMPLATE v9.1
// Dashboard: streak, heatmap, ações corretas, sem features removidas
// ============================================================

export function homeTemplate() {
  return `
    <div id="home" class="screen home">
      <div class="home__container">

        <!-- HERO -->
        <header class="hero">
          <div class="hero__greeting">
            <div class="hero__hello" id="hero-saudacao">Olá,</div>
            <div class="hero__name" id="hero-nome">—</div>
          </div>
        </header>

        <!-- STREAK + XP -->
        <section class="streak-card">
          <div class="streak-card__row">
            <div class="streak-flame">🔥</div>
            <div class="streak-info">
              <div class="streak-info__num" id="streak-num">0</div>
              <div class="streak-info__label">dias seguidos estudando</div>
            </div>
            <div class="streak-xp">
              <div class="streak-xp__label">XP total</div>
              <div class="streak-xp__num" id="xp-total">0</div>
            </div>
          </div>
          <div class="streak-card__progress">
            <div class="streak-card__progress-row">
              <span>Meta diária de XP</span>
              <span class="streak-card__progress-current" id="xp-dia-texto">0 / 200</span>
            </div>
            <div class="progress">
              <div class="progress__fill" id="xp-dia-fill" style="width: 0%"></div>
            </div>
          </div>
        </section>

        <!-- STATS -->
        <section class="stats-bar">
          <div class="stats-bar__item">
            <div class="stats-bar__num text-success" id="stat-questoes">0</div>
            <div class="stats-bar__label">Questões</div>
          </div>
          <div class="stats-bar__item">
            <div class="stats-bar__num" id="stat-acertos">—</div>
            <div class="stats-bar__label">Acertos</div>
          </div>
          <div class="stats-bar__item">
            <div class="stats-bar__num text-warning" id="stat-badge">🐣</div>
            <div class="stats-bar__label" id="stat-badge-nome">Iniciante</div>
          </div>
        </section>

        <!-- CONTINUAR -->
        <div id="continue-card-wrap"></div>

        <!-- HEATMAP -->
        <section class="heatmap-section">
          <div class="heatmap-section__title">
            <span>Atividade · últimos 30 dias</span>
            <span class="heatmap-section__total" id="heatmap-total">—</span>
          </div>
          <div class="heatmap" id="heatmap"></div>
        </section>

        <!-- AÇÕES PRIMÁRIAS -->
        <h3 class="section-title">Estudar agora</h3>
        <div class="actions-primary">
          <button class="action-card action-card--featured" data-goto="simulado-tab">
            <div class="action-card__icon">📚</div>
            <div class="action-card__title">Simulado</div>
            <div class="action-card__desc">Praticar questões por matéria</div>
          </button>
          <button class="action-card" data-goto="estudo-screen">
            <div class="action-card__icon">📖</div>
            <div class="action-card__title">Estudar</div>
            <div class="action-card__desc">Conteúdo teórico</div>
          </button>
          <button class="action-card" data-goto="flashcards">
            <div class="action-card__icon">🎴</div>
            <div class="action-card__title">Flashcards</div>
            <div class="action-card__desc">Revisão rápida</div>
          </button>
          <button class="action-card" data-goto="concursos">
            <div class="action-card__icon">🏛</div>
            <div class="action-card__title">Concursos</div>
            <div class="action-card__desc">Editais e simulados</div>
          </button>
        </div>

        <!-- ATALHOS -->
        <h3 class="section-title">Mais</h3>
        <div class="shortcuts">
          <button class="shortcut" data-goto="ranking">
            <div class="shortcut__icon">🏆</div>
            <div class="shortcut__label">Ranking</div>
          </button>
          <button class="shortcut" data-goto="evolucao">
            <div class="shortcut__icon">📈</div>
            <div class="shortcut__label">Evolução</div>
          </button>
          <button class="shortcut" data-goto="conquistas">
            <div class="shortcut__icon">🏅</div>
            <div class="shortcut__label">Conquistas</div>
          </button>
          <button class="shortcut" data-goto="analise">
            <div class="shortcut__icon">📊</div>
            <div class="shortcut__label">Análise</div>
          </button>
          <button class="shortcut" data-goto="perfil">
            <div class="shortcut__icon">👤</div>
            <div class="shortcut__label">Perfil</div>
          </button>

        </div>

      </div>
    </div>
  `;
}

export function continueCardTemplate({ materiaNome, qtdPendente, ultimaMateria }) {
  if (!ultimaMateria) return '';
  return `
    <button class="continue-card" data-action="continuar" data-materia="${ultimaMateria}">
      <div class="continue-card__icon">⚡</div>
      <div class="continue-card__body">
        <div class="continue-card__label">Continuar de onde parou</div>
        <div class="continue-card__title">${materiaNome}</div>
        <div class="continue-card__sub">${qtdPendente} questões disponíveis · 10 min</div>
      </div>
      <div class="continue-card__arrow">→</div>
    </button>
  `;
}
