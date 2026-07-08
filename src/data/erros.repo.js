// ============================================================
// REPOSITÓRIO DE ERROS / ANÁLISE
// Estende getErros/registrarResposta com análises agregadas.
// ============================================================

import { getErros, limparErros, registrarResposta } from './perfil.repo.js';
import { MATERIAS } from './questoes.repo.js';

// Re-exporta pra outras telas
export { getErros, limparErros, registrarResposta };

// ─────────── MAPEAMENTO TEMA POR ÍNDICE ───────────
// Esse mapa conecta cada questão (índice no banco) ao seu tema.
// Mantido idêntico ao v8 pra não quebrar análise de quem já usa.
export const TEMAS = {
  analisesclinicas: [
    'Composição e coleta','Composição e coleta','Composição e coleta','Composição e coleta',
    'Hemograma','Hemostasia','Hematopoiese','Composição e coleta',
    'Hemograma','Composição e coleta','Composição e coleta','Composição e coleta',
    'Composição e coleta','Hemograma','Composição e coleta','Hematopoiese',
    'Hematopoiese','Hemograma','Composição e coleta','Composição e coleta',
    'Hemostasia','Hemograma','Hemograma','Composição e coleta',
    'Hemograma','Hematopoiese','Composição e coleta','Composição e coleta',
    'Composição e coleta','Composição e coleta','Hemograma','Hemostasia',
    'Composição e coleta','Hemograma','Hematopoiese','Composição e coleta',
    'Hemograma','Hemostasia','Composição e coleta','Hemograma',
    'Hematopoiese','Composição e coleta','Hemograma','Hemostasia',
    'Composição e coleta','Hemograma','Hematopoiese','Composição e coleta',
    'Hemograma','Hemostasia',
  ],
  farmacologia: [
    'Antimicrobianos','Farmacocinética','Antimicrobianos','Antimicrobianos',
    'Antimicrobianos','Anti-inflamatórios e Analgésicos','Anti-inflamatórios e Analgésicos','Anestésicos',
    'Antimicrobianos','Anti-inflamatórios e Analgésicos','Anti-inflamatórios e Analgésicos','Farmacocinética',
  ],
  // demais matérias — preencha quando tiver os dados
};

// ─────────── CLASSIFICAÇÃO ───────────

/**
 * Calcula o nível de criticidade de um tema.
 * critico: ≥60% de erros
 * atencao: 35-59% de erros
 * ok: <35% de erros
 */
export function calcularNivel(erros, acertos) {
  const total = erros + acertos;
  if (total === 0) return 'ok';
  const taxa = erros / total;
  if (taxa >= 0.60) return 'critico';
  if (taxa >= 0.35) return 'atencao';
  return 'ok';
}

const LABELS_NIVEL = {
  critico: 'Crítico',
  atencao: 'Atenção',
  ok:      'Em dia',
};
export function labelNivel(n) { return LABELS_NIVEL[n] || n; }

// ─────────── AGREGAÇÃO ───────────

/**
 * Retorna lista de temas com estatísticas calculadas.
 * Cada item: { subject, qIndex, tema, erros, acertos, total, taxa, nivel, ts }
 */
export function listarTemas() {
  const erros = getErros();
  return Object.entries(erros).map(([key, e]) => {
    // Compatibilidade com formatos antigos do v8
    const [subject, qIndex] = key.split('_');
    const total = (e.erros || 0) + (e.acertos || 0);
    const taxa = total > 0 ? e.erros / total : 0;
    return {
      key,
      subject: e.subject || subject,
      qIndex: parseInt(e.qIndex ?? qIndex, 10) || 0,
      tema: e.tema || resolverTemaPorIndice(subject, qIndex),
      erros: e.erros || 0,
      acertos: e.acertos || 0,
      total,
      taxa,
      nivel: calcularNivel(e.erros || 0, e.acertos || 0),
      ts: e.ts || e.ultimaTentativa || 0,
    };
  });
}

function resolverTemaPorIndice(subject, qIndex) {
  return TEMAS[subject]?.[qIndex] || `Questão ${qIndex}`;
}

/**
 * Agrupa por tema (não por questão individual).
 * Útil pra mostrar "Hemograma: 80% de erro" em vez de cada questão separada.
 */
export function listarPorTema() {
  const itens = listarTemas();
  const mapa = new Map();

  for (const i of itens) {
    const chave = `${i.subject}::${i.tema}`;
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        subject: i.subject,
        tema: i.tema,
        erros: 0,
        acertos: 0,
        total: 0,
        ultimaTentativa: 0,
        questoes: [],
      });
    }
    const ag = mapa.get(chave);
    ag.erros   += i.erros;
    ag.acertos += i.acertos;
    ag.total   += i.total;
    ag.questoes.push(i.qIndex);
    if (i.ts > ag.ultimaTentativa) ag.ultimaTentativa = i.ts;
  }

  return [...mapa.values()].map(ag => ({
    ...ag,
    taxa: ag.total > 0 ? ag.erros / ag.total : 0,
    nivel: calcularNivel(ag.erros, ag.acertos),
    materiaInfo: MATERIAS.find(m => m.key === ag.subject),
  }));
}

/**
 * Prioridade do tema = (taxa de erro × volume) × recência.
 * Quanto maior, mais urgente revisar.
 */
export function calcularPrioridade(item) {
  const volume = Math.min(item.total / 10, 1); // satura em 10 tentativas
  const erro   = item.taxa;
  const idadeDias = item.ultimaTentativa
    ? (Date.now() - item.ultimaTentativa) / 86400000
    : 999;
  const recencia = Math.max(0.3, 1 - idadeDias / 14); // decai em 14 dias

  return Math.round(erro * volume * recencia * 100);
}

// ─────────── RESUMO GERAL ───────────

export function getResumoGeral() {
  const itens = listarTemas();
  const porTema = listarPorTema();

  let totalErros = 0, totalAcertos = 0;
  let temasCriticos = 0, temasAtencao = 0, temasOk = 0;

  for (const t of porTema) {
    totalErros   += t.erros;
    totalAcertos += t.acertos;
    if (t.nivel === 'critico')      temasCriticos++;
    else if (t.nivel === 'atencao') temasAtencao++;
    else                            temasOk++;
  }

  const totalQuestoes = itens.length;
  const totalTemas    = porTema.length;
  const totalRespostas = totalErros + totalAcertos;
  const taxaAcerto = totalRespostas > 0
    ? Math.round((totalAcertos / totalRespostas) * 100)
    : null;

  return {
    totalQuestoes,
    totalTemas,
    totalErros,
    totalAcertos,
    totalRespostas,
    taxaAcerto,
    temasCriticos,
    temasAtencao,
    temasOk,
  };
}

/**
 * Retorna os N temas mais prioritários para revisar agora.
 * É o coração da nova tela de análise.
 */
export function getTopPrioritarios(n = 3) {
  return listarPorTema()
    .map(t => ({ ...t, prioridade: calcularPrioridade(t) }))
    .filter(t => t.nivel !== 'ok' && t.total >= 2)
    .sort((a, b) => b.prioridade - a.prioridade)
    .slice(0, n);
}

/**
 * Recomendação semanal — texto curto baseado no estado atual.
 */
export function getRecomendacao() {
  const resumo = getResumoGeral();
  const top = getTopPrioritarios(1)[0];

  if (resumo.totalRespostas === 0) {
    return {
      titulo: 'Comece sua análise',
      texto: 'Faça pelo menos um simulado para que possamos identificar seus pontos fortes e fracos.',
      acao: null,
    };
  }

  if (resumo.temasCriticos === 0 && resumo.taxaAcerto >= 75) {
    return {
      titulo: 'Excelente progresso!',
      texto: `Você está com ${resumo.taxaAcerto}% de acerto. Considere aumentar a dificuldade ou explorar novas matérias.`,
      acao: null,
    };
  }

  if (top) {
    const verb = top.nivel === 'critico' ? 'CRÍTICO' : 'requer atenção';
    return {
      titulo: `Foque em "${top.tema}"`,
      texto: `Esse tema está ${verb}: ${Math.round(top.taxa * 100)}% de erros em ${top.total} tentativas. Revise antes do próximo simulado.`,
      acao: { tipo: 'revisar', tema: top.tema, subject: top.subject },
    };
  }

  return {
    titulo: 'Continue praticando',
    texto: 'Faça mais alguns simulados para refinar a análise.',
    acao: null,
  };
}

// ─────────── EXPORTAÇÃO CSV ───────────

export function gerarCSV() {
  const porTema = listarPorTema();
  const cabecalho = 'Matéria,Tema,Erros,Acertos,Total,Taxa de Erro,Nível,Prioridade';
  const linhas = porTema.map(t => {
    const taxa = Math.round(t.taxa * 100) + '%';
    const nivel = labelNivel(t.nivel).toUpperCase();
    const prio = calcularPrioridade(t);
    const materia = t.materiaInfo?.nome || t.subject;
    return `"${materia}","${t.tema}",${t.erros},${t.acertos},${t.total},${taxa},"${nivel}",${prio}`;
  });
  return [cabecalho, ...linhas].join('\n');
}

export function baixarCSV() {
  const csv = gerarCSV();
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `estudevet_analise_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
