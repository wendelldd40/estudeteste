// ============================================================
// MAIN — EstudeVet v9.1 FINAL
// ============================================================

// Estilos
import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/screens/auth.css';
import './styles/screens/home.css';
import './styles/screens/simulado.css';
import './styles/screens/quiz.css';
import './styles/screens/results.css';
import './styles/screens/analise.css';
import './styles/screens/ranking.css';
import './styles/screens/conquistas.css';
import './styles/screens/perfil-evolucao.css';
import './styles/screens/periodos.css';
import './styles/screens/estudo.css';
import './styles/screens/flashcards.css';
import './styles/screens/admin.css';
import './styles/screens/concursos.css';

// Data
import { sb } from './data/client.js';
import { onMudancaAuth, getSessao } from './data/auth.repo.js';
import { carregarQuestoes } from './data/questoes.repo.js';
import { getPerfil } from './data/perfil.repo.js';

// Core
import { iniciarRouter, ir } from './core/router.js';
import { toast } from './core/toast.js';
import { store } from './state/store.js';

// Templates
import { authTemplate }       from './features/auth/auth.template.js';
import { homeTemplate }       from './features/home/home.template.js';
import { simuladoTemplate }   from './features/simulado/simulado.feature.js';
import { quizTemplate }       from './features/quiz/quiz.feature.js';
import { resultsTemplate }    from './features/results/results.feature.js';
import { analiseTemplate }    from './features/analise/analise.feature.js';
import { rankingTemplate }    from './features/ranking/ranking.feature.js';
import { conquistasTemplate } from './features/conquistas/conquistas.feature.js';
import { perfilTemplate }     from './features/perfil/perfil.feature.js';
import { evolucaoTemplate }   from './features/evolucao/evolucao.feature.js';
import { periodosTemplate }   from './features/periodos/periodos.feature.js';
import { materiaEscolhaTemplate } from './features/materia-escolha/materia-escolha.feature.js';
import { estudoTemplate }     from './features/estudo/estudo.feature.js';
import { flashcardsTemplate } from './features/flashcards/flashcards.feature.js';
import { adminTemplate }      from './features/admin/admin.feature.js';
import { concursosTemplate }  from './features/concursos/concursos.feature.js';

// Controllers
import { montarAuth }        from './features/auth/auth.controller.js';
import { montarHome }        from './features/home/home.controller.js';
import { montarSimulado }    from './features/simulado/simulado.feature.js';
import { montarQuiz }        from './features/quiz/quiz.feature.js';
import { montarResults }     from './features/results/results.feature.js';
import { montarAnalise }     from './features/analise/analise.feature.js';
import { montarRanking }     from './features/ranking/ranking.feature.js';
import { montarConquistas }  from './features/conquistas/conquistas.feature.js';
import { montarPerfil }      from './features/perfil/perfil.feature.js';
import { montarEvolucao }    from './features/evolucao/evolucao.feature.js';
import { montarPeriodos }    from './features/periodos/periodos.feature.js';
import { montarMateriaEscolha } from './features/materia-escolha/materia-escolha.feature.js';
import { montarEstudo }      from './features/estudo/estudo.feature.js';
import { montarFlashcards }  from './features/flashcards/flashcards.feature.js';
import { montarAdmin }       from './features/admin/admin.feature.js';
import { montarConcursos }   from './features/concursos/concursos.feature.js';

window.EV = { sb, store, router: { ir }, toast };


// ─────────── SIDEBAR NAV ───────────
function setupNav() {
  // Sidebar clicks
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => ir(btn.dataset.nav));
  });

  // data-goto (topbar buttons, etc)
  document.addEventListener('click', (e) => {
    const goto = e.target.closest('[data-goto]');
    if (goto) ir(goto.dataset.goto);
  });

  // Atualiza sidebar active state quando navega
  const originalIr = ir;
  // Override ir pra sincronizar sidebar
  store.subscribe('telaAtual', (tela) => {
    // Sidebar active state
    document.querySelectorAll('[data-nav]').forEach(n => {
      n.classList.toggle('active', n.dataset.nav === tela);
    });
    document.querySelectorAll('.mn-btn').forEach(n => {
      n.classList.toggle('active', n.dataset.nav === tela);
    });
    // Mostrar/ocultar shell: só aparece quando NÃO é tela de auth
    const isAuth = tela?.startsWith('auth-');
    const topbar = document.getElementById('topbar');
    const sidebar = document.getElementById('sidebar');
    const mobileNav = document.getElementById('mobile-nav');
    const main = document.getElementById('main');
    if (topbar)    topbar.style.display    = isAuth ? 'none' : '';
    if (sidebar)   sidebar.style.display   = isAuth ? 'none' : '';
    if (mobileNav) mobileNav.style.display = isAuth ? 'none' : '';
    if (main) {
      main.style.marginLeft = isAuth ? '0' : '';
      main.style.paddingTop = isAuth ? '0' : '';
    }
  });
}

function atualizarShell() {
  const perfil = getPerfil();
  if (!perfil) return;

  // Topbar
  const tbStreak = document.getElementById('tb-streak');
  if (tbStreak) tbStreak.textContent = `🔥 ${perfil.streak || 0} dias`;
  const tbAvatar = document.getElementById('tb-avatar');
  if (tbAvatar) tbAvatar.textContent = (perfil.nome || '?')[0].toUpperCase();

  // Sidebar footer
  const sbNome = document.getElementById('sb-nome');
  if (sbNome) sbNome.textContent = perfil.nome || '—';
  const sbRole = document.getElementById('sb-role');
  if (sbRole) sbRole.textContent = `${perfil.semestre || 5}º período · ${perfil.xpTotal || 0} XP`;

  // Admin button: show only if is_admin (check localStorage flag)
  const adminBtn = document.getElementById('sidebar-admin-btn');
  if (adminBtn) {
    const isAdmin = localStorage.getItem('ev_is_admin') === 'true';
    adminBtn.style.display = isAdmin ? '' : 'none';
  }
}

// ─────────── BOOTSTRAP ───────────
async function bootstrap() {
  console.log(
    '%c EstudeVet · by ZeloVet — v10 ',
    'background:#0C3328;color:#C99D66;font-weight:bold;padding:4px 8px;border-radius:4px'
  );

  const app = document.getElementById('app');
  app.innerHTML = [
    authTemplate(),
    homeTemplate(),
    simuladoTemplate(),
    quizTemplate(),
    resultsTemplate(),
    analiseTemplate(),
    rankingTemplate(),
    conquistasTemplate(),
    perfilTemplate(),
    evolucaoTemplate(),
    periodosTemplate(),
    materiaEscolhaTemplate(),
    estudoTemplate(),
    flashcardsTemplate(),
    adminTemplate(),
    concursosTemplate(),
  ].join('');

  montarAuth();
  montarHome();
  montarSimulado();
  montarQuiz();
  montarResults();
  montarAnalise();
  montarRanking();
  montarConquistas();
  montarPerfil();
  montarEvolucao();
  montarPeriodos();
  montarMateriaEscolha();
  montarEstudo();
  montarFlashcards();
  montarAdmin();
  montarConcursos();

  setupNav();

  const sessao = await getSessao();
  const perfil = getPerfil();
  store.set('sessaoAtual', sessao);
  store.set('perfil', perfil);

  onMudancaAuth(({ evento, sessao }) => {
    store.set('sessaoAtual', sessao);
    if (evento === 'SIGNED_IN' && getPerfil()) {
      ir('home');
      atualizarShell();
    } else if (evento === 'SIGNED_OUT') {
      ir('auth-login');
    }
  });

  carregarQuestoes().catch(err => console.error('[bootstrap]', err));

  const telaInicial = (perfil && sessao) ? 'home' : 'auth-login';
  iniciarRouter({ telaInicial });
  store.set('telaAtual', telaInicial);
  atualizarShell();

  document.getElementById('boot-loader')?.remove();
}

bootstrap();
