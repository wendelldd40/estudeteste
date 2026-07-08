// ============================================================
// PERÍODOS — Grade curricular do curso de Veterinária
// Estrutura estática, baseada em Pio Décimo. Pode ser editado
// aqui para refletir a faculdade real do usuário.
// ============================================================

export const PERIODO_ATIVO = 5;

export const PERIODOS = [
  {
    num: 1,
    ativo: false,
    materias: [
      'Anatomia Veterinária I',
      'Biofísica',
      'Biologia Celular e Molecular',
      'Bioquímica',
      'Genética',
      'História da Veterinária',
      'Sociologia Rural',
    ],
  },
  {
    num: 2,
    ativo: false,
    materias: [
      'Anatomia Veterinária II',
      'Bioestatística',
      'Ezoognósia',
      'Histologia e Embriologia',
      'Imunologia Veterinária',
      'Microbiologia Veterinária',
      'Parasitologia',
    ],
  },
  {
    num: 3,
    ativo: false,
    materias: [
      'Anatomia Topográfica',
      'Bioclimatologia e Bem Estar Animal',
      'Fisiologia Veterinária I',
      'Forragicultura e Pastagem',
      'Melhoramento Genético',
      'Nutrição Animal',
      'Patologia Veterinária Geral',
      'Reprodução Animal',
    ],
  },
  {
    num: 4,
    ativo: false,
    materias: [
      'Diagnóstico por Imagem',
      'Doenças Parasitárias dos Animais Domésticos',
      'Economia e Gestão Aplicada ao Agronegócio',
      'Fisiologia Veterinária II',
      'Patologia Veterinária Especial',
      'Patologia Clínica Veterinária',
      'Tecnologia de Alimentos',
    ],
  },
  {
    num: 5,
    ativo: true,
    atual: true,
    materias: [
      { key: 'analisesclinicas', nome: 'Análises Clínicas Veterinárias',  icone: '🔬' },
      { key: 'aquicultura',      nome: 'Aquicultura',                      icone: '🐟' },
      { key: 'farmacologia',     nome: 'Farmacologia Veterinária e Toxicologia', icone: '💊' },
      { key: 'inspecaoleite',    nome: 'Inspeção de Leite, Lácteos e Mel', icone: '🥛' },
      { key: 'patologia',        nome: 'Patologia Veterinária Geral',      icone: '🧫' },
      { key: 'semiologia',       nome: 'Semiologia Básica',                icone: '🩺' },
      { key: 'zootecnia',        nome: 'Zootecnia',                        icone: '🐄' },
    ],
  },
  {
    num: 6,
    ativo: false,
    materias: [
      'Anestesiologia Veterinária',
      'Aquicultura',
      'Epidemiologia, Zoonoses e Saúde Pública',
      'Forragicultura II',
      'Patologia Clínica Veterinária II',
      'Patologia Cirúrgica',
      'Toxicologia',
    ],
  },
  {
    num: 7,
    ativo: false,
    materias: [
      'Clínica Cirúrgica de Cães e Gatos',
      'Ginecologia e Andrologia Veterinária',
      'Inspeção de Leite, Produtos Lácteos e Mel',
      'Microbiologia de Alimentos',
      'Tecnologia de Carnes',
      'Reprodução Animal Aplicada',
    ],
  },
  {
    num: 8,
    ativo: false,
    materias: [
      'Clínica Médica de Ruminantes II',
      'Defesa Sanitária Animal',
      'Inspeção de Carne, Pescados, Ovos e Derivados',
      'Estágio Supervisionado I',
      'Optativa I',
      'TCC I',
    ],
  },
  {
    num: 9,
    ativo: false,
    materias: [
      'Biotecnologia',
      'Clínica Cirúrgica de Equídeos e Ruminantes',
      'Deontologia e Legislação Veterinária',
      'Patologia Aviária',
    ],
  },
  {
    num: 10,
    ativo: false,
    materias: [
      'Estágio Supervisionado II',
      'Trabalho de Conclusão de Curso',
      'Optativa II',
    ],
  },
];

/**
 * Retorna nomes das matérias resumidos (3 primeiras + "+N matérias").
 */
export function resumirMaterias(materias) {
  if (!materias || materias.length === 0) return { primeiras: [], extras: 0 };
  const lista = materias.map(m => typeof m === 'string' ? m : m.nome);
  return {
    primeiras: lista.slice(0, 3),
    extras: Math.max(0, lista.length - 3),
  };
}

/**
 * Retorna o objeto do período ativo (com matérias detalhadas).
 */
export function getPeriodoAtivo() {
  return PERIODOS.find(p => p.atual);
}
