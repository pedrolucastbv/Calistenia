export type TrainingGoal =
  | 'forca'
  | 'hipertrofia'
  | 'perda_gordura'
  | 'resistencia'
  | 'habilidade'
  | 'saude_geral';

export type ExperienceLevel = 'iniciante' | 'intermediario' | 'avancado';

export type MovementPatternId =
  | 'empurrar_horizontal'
  | 'empurrar_vertical'
  | 'paralelas_triceps'
  | 'puxar_horizontal'
  | 'puxar_vertical'
  | 'agachar'
  | 'dobradica_posterior'
  | 'panturrilha'
  | 'core'
  | 'habilidades';

export type EquipmentId =
  | 'nenhum'
  | 'barra_fixa'
  | 'paralelas'
  | 'elastico'
  | 'mochila'
  | 'mesa_cadeira_toalha';

export type InjuryArea =
  | 'ombro'
  | 'punho'
  | 'joelho'
  | 'lombar'
  | 'cotovelo';

export type SpecialCondition =
  | 'gestante'
  | 'cardiovascular'
  | 'pos_cirurgico'
  | 'menor_idade';

export type SessionDuration = 25 | 45 | 60;

export type PresetModelId = 'modelo_1' | 'modelo_2' | 'modelo_3' | 'modelo_4';

export interface MiniTestResult {
  flexoes: number | null;
  agachamentos: number | null;
  barras: number | null;
  pranchaSegundos: number | null;
}

export interface PatternLevelsByCategory {
  empurrar: ExperienceLevel;
  puxar: ExperienceLevel;
  pernas: ExperienceLevel;
  core: ExperienceLevel;
}

export interface UserProfile {
  nome: string;
  objetivo: TrainingGoal;
  nivelGeral: ExperienceLevel;
  usarMiniTeste: boolean;
  miniTeste: MiniTestResult;
  equipamentos: EquipmentId[];
  diasPorSemana: 2 | 3 | 4 | 5 | 6;
  tempoSessaoMin: SessionDuration;
  preferenciaDivisao4Dias: 'push_pull_pernas_core' | 'upper_lower';
  modoApartamento: boolean;
  espacoPequeno: boolean;
  pisoEscorregadio: boolean;
  lesoes: InjuryArea[];
  condicoesEspeciais: SpecialCondition[];
  semanaDeload: boolean;
  semanaCiclo: number; // 1..6 (deload suggested every 4-6 weeks)
  /** Current 1-indexed rung on each movement pattern progression ladder */
  degrausPorPadrao: Record<MovementPatternId, number>;
}

export interface ProgressionStep {
  degrau: number;
  nome: string;
  categoriaCore?: 'Anti-extensão' | 'Anti-rotação/lateral' | 'Flexão de quadril' | 'Base Hollow';
  tipoMedida: 'reps' | 'tempo';
  faixaSugeridaForca: { min: number; max: number; unidade: 'reps' | 's' };
  faixaSugeridaHipertrofia: { min: number; max: number; unidade: 'reps' | 's' };
  equipamentoNecessario?: EquipmentId[];
  possuiSalto?: boolean;
  substitutoSemSalto?: string;
  riscoAlto?: boolean;
  dicaExecucao: string;
  alertaLesao?: Partial<Record<InjuryArea, string>>;
}

export interface MovementPatternLadder {
  id: MovementPatternId;
  nome: string;
  grupo: 'Empurrar' | 'Puxar' | 'Pernas' | 'Core' | 'Habilidades';
  descricaoMeta: string;
  notaSemBarra?: string;
  degraus: ProgressionStep[];
}

export interface PlannedExercise {
  id: string;
  patternId: MovementPatternId;
  patternNome: string;
  grupo: MovementPatternLadder['grupo'];
  degrauAtual: number;
  nome: string;
  series: number;
  seriesOriginais: number;
  faixaMin: number;
  faixaMax: number;
  unidade: 'reps' | 's';
  unilateral?: boolean;
  descansoSegundos: number;
  descansoTexto: string;
  rirTexto: string;
  dicaExecucao: string;
  proximaVariacao: string | null;
  regressao: string | null;
  notaAdaptacao?: string;
  modoCircuito?: boolean;
}

export interface WarmupItem {
  id: string;
  nome: string;
  duracao: string;
  foco: string;
}

export interface CooldownItem {
  id: string;
  nome: string;
  duracao: string;
}

export interface WorkoutSession {
  id: string;
  codigo: string;
  titulo: string;
  subtitulo: string;
  foco: string;
  duracaoEstimadaMin: number;
  modoCircuito: boolean;
  rodadasCircuito?: number;
  trabalhoCircuitoSeg?: number;
  descansoCircuitoSeg?: number;
  aquecimento: WarmupItem[];
  blocoPrincipal: PlannedExercise[];
  coreFinalizador: PlannedExercise[];
  voltaACalma: CooldownItem[];
}

export interface WeeklyDaySlot {
  diaSemana: string;
  sessaoId: string | null; // null = dia completo de descanso
  label: string;
  tipo: 'treino' | 'leve_mobilidade' | 'descanso';
}

export interface GeneratedPlan {
  resumoObjetivo: string;
  resumoDivisao: string;
  resumoNivel: string;
  niveisPorGrupo: PatternLevelsByCategory;
  modeloBase: string;
  descansoPadraoTexto: string;
  rirPadraoTexto: string;
  volumeSemanal: {
    empurrar: number;
    puxar: number;
    pernas: number;
    core: number;
    equilibrioPushPullOk: boolean;
    alertaVolume?: string;
  };
  agendaSemanal: WeeklyDaySlot[];
  sessoes: WorkoutSession[];
  avisosSeguranca: string[];
  dicaPerdaGordura?: string;
  sugestaoDeload: boolean;
}

export interface WorkoutLogEntry {
  id: string;
  data: string; // YYYY-MM-DD
  patternId: MovementPatternId;
  exercicio: string;
  variacao: string;
  degrau: number;
  series: number;
  repsOuSegundos: number; // achieved per set (cleaned min across sets)
  alvoTopo: number;
  unidade: 'reps' | 's';
  tecnicaLimpa: boolean;
  sensacao: number; // 1-10
  observacao: string;
}

export interface DoubleProgressionStatus {
  patternId: MovementPatternId;
  patternNome: string;
  degrauAtual: number;
  variacaoAtual: string;
  proximaVariacao: string | null;
  sessoesLimpasNoTopo: number; // 0, 1, or 2+
  prontoParaAvancar: boolean;
  ultimoRegistroData: string | null;
}

export interface TechniqueGuide {
  id: string;
  exercicio: string;
  patternId: MovementPatternId;
  pontosChave: {
    alinhamento: string;
    escapulas: string;
    respiracao: string;
    amplitudeETempo: string;
  };
  errosComuns: {
    erro: string;
    correcaoPrioritaria: string;
  }[];
  regressaoSegura: string;
}

export interface HomeEquipmentGuide {
  item: string;
  uso: string;
  cuidadoSeguranca: string;
}
