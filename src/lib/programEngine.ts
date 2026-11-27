import {
  GOAL_LABELS,
  INJURY_LABELS,
  LEVEL_LABELS,
  PROGRESSION_LADDERS,
  SPECIAL_CONDITION_LABELS,
} from './calisthenicsData';
import type {
  CooldownItem,
  DoubleProgressionStatus,
  EquipmentId,
  ExperienceLevel,
  GeneratedPlan,
  MiniTestResult,
  MovementPatternId,
  PatternLevelsByCategory,
  PlannedExercise,
  PresetModelId,
  ProgressionStep,
  UserProfile,
  WarmupItem,
  WeeklyDaySlot,
  WorkoutLogEntry,
  WorkoutSession,
} from './types';

export const DEFAULT_USER_PROFILE: UserProfile = {
  nome: 'Atleta em Casa',
  objetivo: 'hipertrofia',
  nivelGeral: 'iniciante',
  usarMiniTeste: true,
  miniTeste: {
    flexoes: 10,
    agachamentos: 22,
    barras: 0,
    pranchaSegundos: 35,
  },
  equipamentos: ['mesa_cadeira_toalha', 'mochila'],
  diasPorSemana: 3,
  tempoSessaoMin: 45,
  preferenciaDivisao4Dias: 'push_pull_pernas_core',
  modoApartamento: false,
  espacoPequeno: false,
  pisoEscorregadio: false,
  lesoes: [],
  condicoesEspeciais: [],
  semanaDeload: false,
  semanaCiclo: 2,
  degrausPorPadrao: {
    empurrar_horizontal: 4,
    empurrar_vertical: 1,
    paralelas_triceps: 2,
    puxar_horizontal: 1,
    puxar_vertical: 1,
    agachar: 3,
    dobradica_posterior: 2,
    panturrilha: 1,
    core: 2,
    habilidades: 1,
  },
};

export const INITIAL_DEMO_LOGS: WorkoutLogEntry[] = [
  {
    id: 'log-seed-1',
    data: '2026-11-21',
    patternId: 'empurrar_horizontal',
    exercicio: 'Flexão completa no chão',
    variacao: 'Degrau 4 · Flexão completa no chão',
    degrau: 4,
    series: 3,
    repsOuSegundos: 12,
    alvoTopo: 12,
    unidade: 'reps',
    tecnicaLimpa: true,
    sensacao: 7,
    observacao: 'Descida controlada em 2s, lombar firme em todas as séries.',
  },
  {
    id: 'log-seed-2',
    data: '2026-11-24',
    patternId: 'empurrar_horizontal',
    exercicio: 'Flexão completa no chão',
    variacao: 'Degrau 4 · Flexão completa no chão',
    degrau: 4,
    series: 3,
    repsOuSegundos: 12,
    alvoTopo: 12,
    unidade: 'reps',
    tecnicaLimpa: true,
    sensacao: 7,
    observacao: '3x12 limpas, RIR ~2 na última série. Pronto para testar pés elevados.',
  },
  {
    id: 'log-seed-3',
    data: '2026-11-24',
    patternId: 'puxar_horizontal',
    exercicio: 'Remada invertida inclinada (mesa resistente) ou Superman pull',
    variacao: 'Degrau 1 · Remada invertida inclinada',
    degrau: 1,
    series: 3,
    repsOuSegundos: 12,
    alvoTopo: 12,
    unidade: 'reps',
    tecnicaLimpa: true,
    sensacao: 8,
    observacao: 'Pausa de 1s no topo fechando as escápulas.',
  },
  {
    id: 'log-seed-4',
    data: '2026-11-24',
    patternId: 'agachar',
    exercicio: 'Agachamento com pausa (2s embaixo) ou tempo lento',
    variacao: 'Degrau 3 · Agachamento com pausa',
    degrau: 3,
    series: 3,
    repsOuSegundos: 10,
    alvoTopo: 12,
    unidade: 'reps',
    tecnicaLimpa: true,
    sensacao: 8,
    observacao: 'Boa profundidade sem tirar o calcanhar do chão.',
  },
];

/**
 * Evaluates independent experience level per movement category using Section 2 mini-test rules.
 * Flexão: <8 iniciante, 8-25 intermediário, >25 avançado
 * Agachamento: <20 iniciante, 20-40 intermediário, >40 avançado
 * Barra: <1 iniciante, 1-8 intermediário, >8 avançado
 * Prancha: <30s iniciante, 30-90s intermediário, >90s avançado
 */
export function evaluateMiniTest(
  miniTeste: MiniTestResult,
  fallbackLevel: ExperienceLevel,
  isMinor = false
): PatternLevelsByCategory {
  if (isMinor) {
    return {
      empurrar: 'iniciante',
      puxar: 'iniciante',
      pernas: 'iniciante',
      core: 'iniciante',
    };
  }

  const classifyPush = (reps: number | null): ExperienceLevel => {
    if (reps === null || Number.isNaN(reps)) return fallbackLevel;
    if (reps < 8) return 'iniciante';
    if (reps <= 25) return 'intermediario';
    return 'avancado';
  };

  const classifyLegs = (reps: number | null): ExperienceLevel => {
    if (reps === null || Number.isNaN(reps)) return fallbackLevel;
    if (reps < 20) return 'iniciante';
    if (reps <= 40) return 'intermediario';
    return 'avancado';
  };

  const classifyPull = (reps: number | null): ExperienceLevel => {
    if (reps === null || Number.isNaN(reps)) return fallbackLevel;
    if (reps < 1) return 'iniciante';
    if (reps <= 8) return 'intermediario';
    return 'avancado';
  };

  const classifyCore = (sec: number | null): ExperienceLevel => {
    if (sec === null || Number.isNaN(sec)) return fallbackLevel;
    if (sec < 30) return 'iniciante';
    if (sec <= 90) return 'intermediario';
    return 'avancado';
  };

  return {
    empurrar: classifyPush(miniTeste.flexoes),
    puxar: classifyPull(miniTeste.barras),
    pernas: classifyLegs(miniTeste.agachamentos),
    core: classifyCore(miniTeste.pranchaSegundos),
  };
}

export function hasEquipment(
  equipamentos: EquipmentId[],
  needed: EquipmentId
): boolean {
  if (equipamentos.includes('nenhum') && equipamentos.length === 1) {
    return needed === 'nenhum';
  }
  return equipamentos.includes(needed);
}

/**
 * Computes starting progression ladder rungs based on profile levels, equipment, injuries, and apartment mode.
 */
export function deriveInitialLevels(
  profile: Pick<
    UserProfile,
    | 'nivelGeral'
    | 'usarMiniTeste'
    | 'miniTeste'
    | 'equipamentos'
    | 'lesoes'
    | 'modoApartamento'
    | 'condicoesEspeciais'
  >
): Record<MovementPatternId, number> {
  const isMinor = profile.condicoesEspeciais.includes('menor_idade');
  const levels = profile.usarMiniTeste
    ? evaluateMiniTest(profile.miniTeste, profile.nivelGeral, isMinor)
    : {
        empurrar: profile.nivelGeral,
        puxar: profile.nivelGeral,
        pernas: profile.nivelGeral,
        core: profile.nivelGeral,
      };

  const hasBar = hasEquipment(profile.equipamentos, 'barra_fixa');
  const hasParallels = hasEquipment(profile.equipamentos, 'paralelas');
  const hasBackpack = hasEquipment(profile.equipamentos, 'mochila');
  const hasFurniture = hasEquipment(profile.equipamentos, 'mesa_cadeira_toalha');

  const pickByLevel = (
    lvl: ExperienceLevel,
    ini: number,
    inter: number,
    adv: number
  ) => (lvl === 'iniciante' ? ini : lvl === 'intermediario' ? inter : adv);

  let empurrar_horizontal = pickByLevel(levels.empurrar, 2, 4, 6);
  let empurrar_vertical = pickByLevel(levels.empurrar, 1, 2, 4);
  let paralelas_triceps = hasParallels
    ? pickByLevel(levels.empurrar, 2, 3, hasBackpack ? 4 : 3)
    : hasFurniture
      ? pickByLevel(levels.empurrar, 1, 2, 2)
      : 1;

  let puxar_horizontal = hasFurniture
    ? pickByLevel(levels.puxar, 1, 2, 4)
    : pickByLevel(levels.puxar, 1, 3, 3);

  let puxar_vertical = hasBar
    ? pickByLevel(levels.puxar, 2, 5, 6)
    : 1;

  let agachar = pickByLevel(levels.pernas, 2, 4, 6);
  // Apartment or knee injury never lands on jump squat (rung 5)
  if ((profile.modoApartamento || profile.lesoes.includes('joelho')) && agachar === 5) {
    agachar = 4;
  }

  let dobradica_posterior = pickByLevel(levels.pernas, 1, 4, 5);
  let panturrilha = pickByLevel(levels.pernas, 1, 2, hasBackpack ? 3 : 2);
  let core = pickByLevel(levels.core, 2, 3, 5);
  const habilidades = levels.empurrar === 'avancado' && levels.puxar === 'avancado' ? 2 : 1;

  // Injury safety regressions (conservative entry point)
  if (profile.lesoes.includes('ombro')) {
    empurrar_vertical = Math.min(empurrar_vertical, 1);
    paralelas_triceps = 1;
  }
  if (profile.lesoes.includes('punho')) {
    empurrar_horizontal = Math.min(empurrar_horizontal, 2);
    empurrar_vertical = 1;
  }
  if (profile.lesoes.includes('joelho')) {
    agachar = Math.min(agachar, 3);
  }
  if (profile.lesoes.includes('lombar')) {
    dobradica_posterior = Math.min(dobradica_posterior, 2);
    core = Math.min(core, 2);
  }
  if (profile.lesoes.includes('cotovelo')) {
    puxar_vertical = Math.min(puxar_vertical, 3);
    paralelas_triceps = 1;
  }

  // Clamp within ladder bounds
  const clamp = (id: MovementPatternId, rung: number) =>
    Math.max(1, Math.min(PROGRESSION_LADDERS[id].degraus.length, rung));

  return {
    empurrar_horizontal: clamp('empurrar_horizontal', empurrar_horizontal),
    empurrar_vertical: clamp('empurrar_vertical', empurrar_vertical),
    paralelas_triceps: clamp('paralelas_triceps', paralelas_triceps),
    puxar_horizontal: clamp('puxar_horizontal', puxar_horizontal),
    puxar_vertical: clamp('puxar_vertical', puxar_vertical),
    agachar: clamp('agachar', agachar),
    dobradica_posterior: clamp('dobradica_posterior', dobradica_posterior),
    panturrilha: clamp('panturrilha', panturrilha),
    core: clamp('core', core),
    habilidades: clamp('habilidades', habilidades),
  };
}

function getSafeStepForProfile(
  patternId: MovementPatternId,
  requestedRung: number,
  profile: UserProfile
): {
  step: ProgressionStep;
  effectiveName: string;
  notaAdaptacao?: string;
} {
  const ladder = PROGRESSION_LADDERS[patternId];
  const clamped = Math.max(1, Math.min(ladder.degraus.length, requestedRung));
  const step = ladder.degraus[clamped - 1];
  const hasBar = hasEquipment(profile.equipamentos, 'barra_fixa');
  const hasBackpack = hasEquipment(profile.equipamentos, 'mochila');
  const notas: string[] = [];
  let effectiveName = step.nome;

  // Handle missing pull-up bar on vertical pull
  if (patternId === 'puxar_vertical' && !hasBar) {
    effectiveName = hasBackpack
      ? 'Remada curvada com mochila + Superman pull isométrico'
      : 'Remada com toalha na porta ou Superman pull isométrico';
    notas.push(
      'Sem barra fixa: adaptado para costas em casa (toalha/mochila/superman). Considere uma barra fixa de porta quando possível.'
    );
  }

  // Handle apartment silent mode (no jumps)
  if (profile.modoApartamento && step.possuiSalto && step.substitutoSemSalto) {
    effectiveName = step.substitutoSemSalto;
    notas.push('Modo apartamento: salto substituído por controle lento sem impacto.');
  } else if (profile.modoApartamento && patternId === 'agachar') {
    notas.push('Apartamento: use tapete antiderrapante, meias/tênis e controle a descida em 3s.');
  }

  // Injury annotations
  if (profile.lesoes.includes('ombro') && (patternId === 'paralelas_triceps' || patternId === 'empurrar_vertical')) {
    notas.push('Adaptação ombro: mantenha amplitude moderada e pare imediatamente se houver pontada.');
  }
  if (profile.lesoes.includes('punho') && (patternId === 'empurrar_horizontal' || patternId === 'empurrar_vertical')) {
    notas.push(
      hasEquipment(profile.equipamentos, 'paralelas')
        ? 'Adaptação punho: execute nas parallettes com pegada neutra.'
        : 'Adaptação punho: use punhos fechados sobre tapete ou mãos elevadas na borda de mesa firme.'
    );
  }
  if (profile.lesoes.includes('joelho') && patternId === 'agachar') {
    notas.push('Adaptação joelho: sem saltos, cadência lenta e amplitude livre de dor.');
  }
  if (profile.lesoes.includes('lombar') && (patternId === 'core' || patternId === 'dobradica_posterior')) {
    notas.push('Adaptação lombar: pelve encaixada e coluna neutra; interrompa antes de arquear.');
  }
  if (profile.lesoes.includes('cotovelo') && (patternId === 'puxar_vertical' || patternId === 'paralelas_triceps')) {
    notas.push('Adaptação cotovelo: evite falha e controle o tempo excêntrico.');
  }

  if (step.riscoAlto) {
    notas.push('Alto risco técnico: mantenha RIR 2–3 e nunca leve até falha técnica.');
  }

  return {
    step,
    effectiveName,
    notaAdaptacao: notas.length > 0 ? notas.join(' ') : undefined,
  };
}

function buildExercise(
  id: string,
  patternId: MovementPatternId,
  baseSets: number,
  profile: UserProfile,
  options?: {
    overrideRung?: number;
    overrideName?: string;
    unilateral?: boolean;
    isSkill?: boolean;
    circuitMode?: boolean;
  }
): PlannedExercise {
  const ladder = PROGRESSION_LADDERS[patternId];
  const rung = options?.overrideRung ?? profile.degrausPorPadrao[patternId] ?? 1;
  const { step, effectiveName, notaAdaptacao } = getSafeStepForProfile(
    patternId,
    rung,
    profile
  );

  const isStrengthOrSkill =
    profile.objetivo === 'forca' ||
    profile.objetivo === 'habilidade' ||
    Boolean(options?.isSkill);

  const faixa = isStrengthOrSkill
    ? step.faixaSugeridaForca
    : step.faixaSugeridaHipertrofia;

  const isConservative =
    profile.condicoesEspeciais.includes('gestante') ||
    profile.condicoesEspeciais.includes('cardiovascular') ||
    profile.condicoesEspeciais.includes('pos_cirurgico');

  // Deload rule: same exercises, 50-60% of sets (minimum 2), RIR 4+, no failure
  const adjustedSets = profile.semanaDeload
    ? Math.max(2, Math.round(baseSets * 0.5))
    : baseSets;

  let descansoSegundos = isStrengthOrSkill ? 150 : 75;
  let descansoTexto = isStrengthOrSkill ? '2–3 min' : '60–90s';

  if (options?.circuitMode) {
    descansoSegundos = 20;
    descansoTexto = '20s (circuito)';
  } else if (profile.objetivo === 'resistencia') {
    descansoSegundos = 60;
    descansoTexto = '60s';
  }

  const rirTexto = profile.semanaDeload
    ? 'RIR 4+ (deload, sem falhar)'
    : isConservative
      ? 'RIR 3–4 (conservador)'
      : options?.isSkill || step.riscoAlto
        ? 'RIR 2–3 (técnica limpa)'
        : 'RIR 1–3';

  const nextStep =
    step.degrau < ladder.degraus.length ? ladder.degraus[step.degrau] : null;
  const prevStep = step.degrau > 1 ? ladder.degraus[step.degrau - 2] : null;

  let nextName = nextStep ? `${nextStep.degrau}. ${nextStep.nome}` : null;
  if (nextStep && profile.modoApartamento && nextStep.possuiSalto && nextStep.substitutoSemSalto) {
    nextName = `${nextStep.degrau}. ${nextStep.substitutoSemSalto} (sem salto)`;
  }

  const isUnilateral =
    options?.unilateral ??
    /unilateral|búlgaro|arqueiro|uma mão|pistol|lateral/i.test(effectiveName);

  return {
    id,
    patternId,
    patternNome: ladder.nome,
    grupo: ladder.grupo,
    degrauAtual: step.degrau,
    nome: options?.overrideName ?? effectiveName,
    series: adjustedSets,
    seriesOriginais: baseSets,
    faixaMin: options?.circuitMode ? 40 : faixa.min,
    faixaMax: options?.circuitMode ? 40 : faixa.max,
    unidade: options?.circuitMode ? 's' : faixa.unidade,
    unilateral: isUnilateral,
    descansoSegundos,
    descansoTexto,
    rirTexto,
    dicaExecucao: step.dicaExecucao,
    proximaVariacao: nextName,
    regressao: prevStep ? `${prevStep.degrau}. ${prevStep.nome}` : 'Reduzir amplitude ou repetições mantendo técnica limpa',
    notaAdaptacao,
    modoCircuito: options?.circuitMode,
  };
}

function buildWarmup(profile: UserProfile, focus: string): WarmupItem[] {
  const silent = profile.modoApartamento || profile.lesoes.includes('joelho');
  return [
    {
      id: 'wu-temp',
      nome: silent
        ? 'Elevação de temperatura silenciosa (marcha no lugar + polichinelo sem salto + agachamento leve)'
        : 'Elevação de temperatura (polichinelo suave, marcha e agachamento sem carga)',
      duracao: '2–3 min',
      foco: 'Circulação e temperatura',
    },
    {
      id: 'wu-mob',
      nome: profile.lesoes.includes('punho')
        ? 'Mobilidade articular reforçada: rotação de punhos (60s), círculos de ombro, gato-vaca e ponte de glúteo'
        : 'Mobilidade específica: círculos de ombro, gato-vaca, ponte de glúteo, rotação de punhos e escápulas na parede/barra',
      duracao: '2–3 min',
      foco: 'Articulações e escápulas',
    },
    {
      id: 'wu-prep',
      nome: `1–2 séries leves de preparação do primeiro exercício (${focus})`,
      duracao: '2 min',
      foco: 'Ativação específica',
    },
  ];
}

function buildCooldown(): CooldownItem[] {
  return [
    {
      id: 'cd-stretch',
      nome: 'Alongamento leve de peito/ombros na parede, posterior de coxa e flexores do quadril',
      duracao: '2–3 min',
    },
    {
      id: 'cd-breath',
      nome: 'Respiração lenta nasal (4s inspirando / 6s expirando) para baixar a frequência cardíaca',
      duracao: '1–2 min',
    },
  ];
}

function computeWeeklyVolume(
  sessoes: WorkoutSession[],
  agenda: WeeklyDaySlot[]
): GeneratedPlan['volumeSemanal'] {
  const counts = { empurrar: 0, puxar: 0, pernas: 0, core: 0 };

  for (const slot of agenda) {
    if (!slot.sessaoId) continue;
    const session = sessoes.find((s) => s.id === slot.sessaoId);
    if (!session) continue;
    const allExercises = [...session.blocoPrincipal, ...session.coreFinalizador];
    for (const ex of allExercises) {
      if (ex.grupo === 'Empurrar') counts.empurrar += ex.series;
      else if (ex.grupo === 'Puxar') counts.puxar += ex.series;
      else if (ex.grupo === 'Pernas') counts.pernas += ex.series;
      else if (ex.grupo === 'Core') counts.core += ex.series;
    }
  }

  return {
    ...counts,
    equilibrioPushPullOk: counts.puxar >= counts.empurrar,
  };
}

/**
 * Generates a complete individualized weekly calisthenics program strictly adhering to
 * modelos-de-treino.md, progressoes.md, and calistenia-casa SKILL rules.
 */
export function generateTrainingPlan(profile: UserProfile): GeneratedPlan {
  const isMinor = profile.condicoesEspeciais.includes('menor_idade');
  const niveisPorGrupo = profile.usarMiniTeste
    ? evaluateMiniTest(profile.miniTeste, profile.nivelGeral, isMinor)
    : {
        empurrar: profile.nivelGeral,
        puxar: profile.nivelGeral,
        pernas: profile.nivelGeral,
        core: profile.nivelGeral,
      };

  const baseSetsByLevel = (lvl: ExperienceLevel): number =>
    lvl === 'iniciante' ? 3 : lvl === 'intermediario' ? 4 : 4;

  const avisosSeguranca: string[] = [];

  if (profile.lesoes.length > 0) {
    for (const lesao of profile.lesoes) {
      avisosSeguranca.push(
        `Limitação (${INJURY_LABELS[lesao].nome}): ${INJURY_LABELS[lesao].adaptacao}`
      );
    }
  }

  if (profile.condicoesEspeciais.length > 0) {
    for (const cond of profile.condicoesEspeciais) {
      avisosSeguranca.push(
        `${SPECIAL_CONDITION_LABELS[cond].nome}: ${SPECIAL_CONDITION_LABELS[cond].aviso}`
      );
    }
  }

  if (profile.modoApartamento) {
    avisosSeguranca.push(
      'Modo Apartamento ativo: todos os saltos foram substituídos por cadência lenta controlada. Utilize tapete antiderrapante e meias ou tênis para amortecer.'
    );
  }

  if (profile.pisoEscorregadio) {
    avisosSeguranca.push(
      'Piso escorregadio: priorize tapete antiderrapante ou tênis com boa aderência, especialmente em pranchas, pike e passadas.'
    );
  }

  if (!hasEquipment(profile.equipamentos, 'barra_fixa')) {
    avisosSeguranca.push(
      'Sem barra fixa: o puxar vertical está adaptado com remadas/toalha/mochila/superman pull. Quando possível, uma barra fixa de porta bem testada amplia a evolução de costas.'
    );
  }

  const isCircuit = profile.tempoSessaoMin === 25;
  let sessoes: WorkoutSession[] = [];
  let agendaSemanal: WeeklyDaySlot[] = [];
  let resumoDivisao = '';
  let modeloBase = '';

  const diasNomes = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

  if (isCircuit) {
    // Modelo 3 — Pouco tempo (20–25 min, circuito)
    modeloBase = profile.modoApartamento
      ? 'Modelo 3 (Circuito 20–25 min) + Adaptação Apartamento'
      : 'Modelo 3 — Pouco tempo (20–25 min, Circuito)';
    const rodadas = profile.semanaDeload
      ? 2
      : profile.nivelGeral === 'iniciante'
        ? 3
        : 4;

    const circuitoA: WorkoutSession = {
      id: 'circuito-a',
      codigo: 'Circuito',
      titulo: 'Circuito Full Body (20–25 min)',
      subtitulo: `${rodadas} rodadas · 40s trabalho / 20s descanso`,
      foco: 'Corpo inteiro em ritmo contínuo',
      duracaoEstimadaMin: 24,
      modoCircuito: true,
      rodadasCircuito: rodadas,
      trabalhoCircuitoSeg: 40,
      descansoCircuitoSeg: 20,
      aquecimento: buildWarmup(profile, 'Agachamento e Mobilidade'),
      blocoPrincipal: [
        buildExercise('c-agachar', 'agachar', rodadas, profile, { circuitMode: true }),
        buildExercise('c-push', 'empurrar_horizontal', rodadas, profile, { circuitMode: true }),
        buildExercise('c-pull-h', 'puxar_horizontal', rodadas, profile, { circuitMode: true }),
        buildExercise('c-hinge', 'dobradica_posterior', rodadas, profile, { circuitMode: true }),
        buildExercise('c-pull-v', 'puxar_vertical', rodadas, profile, { circuitMode: true }),
      ],
      coreFinalizador: [
        buildExercise('c-core', 'core', rodadas, profile, { circuitMode: true }),
      ],
      voltaACalma: buildCooldown(),
    };

    sessoes = [circuitoA];
    const activeDaysMap: Record<number, number[]> = {
      2: [0, 3],
      3: [0, 2, 4],
      4: [0, 1, 3, 4],
      5: [0, 1, 2, 4, 5],
      6: [0, 1, 2, 3, 4, 5],
    };
    const activeIdx = activeDaysMap[profile.diasPorSemana] ?? [0, 2, 4];
    agendaSemanal = diasNomes.map((dia, idx) =>
      activeIdx.includes(idx)
        ? { diaSemana: dia, sessaoId: 'circuito-a', label: 'Circuito', tipo: 'treino' }
        : { diaSemana: dia, sessaoId: null, label: 'Descanso', tipo: 'descanso' }
    );
    resumoDivisao = `${profile.diasPorSemana}x/semana · Circuito 40s/20s (${rodadas} rodadas)`;
  } else if (profile.diasPorSemana <= 3) {
    // Modelo 1 / Full Body A e B (2x: A/B; 3x: A/B/A alternando semanas)
    modeloBase = profile.modoApartamento
      ? 'Modelo 1 + Modelo 4 (Apartamento silencioso)'
      : 'Modelo 1 — Full Body A / B';

    const pushSets = baseSetsByLevel(niveisPorGrupo.empurrar);
    const pullSets = Math.max(pushSets, baseSetsByLevel(niveisPorGrupo.puxar));
    const legSets = baseSetsByLevel(niveisPorGrupo.pernas);
    const coreSets = 3;

    const fullBodyA: WorkoutSession = {
      id: 'full-a',
      codigo: 'Treino A',
      titulo: 'Full Body A',
      subtitulo: 'Agachar · Empurrar Horizontal · Posterior · Puxar Horizontal · Core',
      foco: 'Empurrar Horizontal & Agachamento',
      duracaoEstimadaMin: profile.tempoSessaoMin,
      modoCircuito: false,
      aquecimento: buildWarmup(profile, 'Agachamento e Flexão'),
      blocoPrincipal: [
        buildExercise('fa-agachar', 'agachar', legSets, profile),
        buildExercise('fa-push-h', 'empurrar_horizontal', pushSets, profile),
        buildExercise('fa-hinge', 'dobradica_posterior', legSets, profile),
        buildExercise('fa-pull-h', 'puxar_horizontal', pullSets, profile),
        ...(profile.tempoSessaoMin === 60
          ? [buildExercise('fa-panturrilha', 'panturrilha', 3, profile)]
          : []),
      ],
      coreFinalizador: [
        buildExercise('fa-core', 'core', coreSets, profile),
      ],
      voltaACalma: buildCooldown(),
    };

    const fullBodyB: WorkoutSession = {
      id: 'full-b',
      codigo: 'Treino B',
      titulo: 'Full Body B',
      subtitulo: 'Pernas · Empurrar Vertical · Dobradiça · Puxar Vertical/Horizontal · Core',
      foco: 'Empurrar Vertical & Puxar',
      duracaoEstimadaMin: profile.tempoSessaoMin,
      modoCircuito: false,
      aquecimento: buildWarmup(profile, 'Ombros, Escápulas e Quadril'),
      blocoPrincipal: [
        buildExercise(
          'fb-agachar',
          'agachar',
          legSets,
          profile,
          profile.degrausPorPadrao.agachar === 2 ? { overrideRung: 3 } : undefined
        ),
        buildExercise('fb-push-v', 'empurrar_vertical', pushSets, profile),
        buildExercise(
          'fb-hinge',
          'dobradica_posterior',
          legSets,
          profile,
          profile.degrausPorPadrao.dobradica_posterior === 1 && !profile.lesoes.includes('lombar')
            ? { overrideRung: 4, unilateral: true }
            : undefined
        ),
        buildExercise('fb-pull-v', 'puxar_vertical', pullSets, profile),
        // Extra pull balance set if needed for shoulder health
        ...(profile.tempoSessaoMin === 60
          ? [buildExercise('fb-pull-h-extra', 'puxar_horizontal', 2, profile)]
          : []),
      ],
      coreFinalizador: [
        buildExercise(
          'fb-core',
          'core',
          coreSets,
          profile,
          profile.degrausPorPadrao.core === 2 ? { overrideRung: 1 } : undefined
        ),
      ],
      voltaACalma: buildCooldown(),
    };

    sessoes = [fullBodyA, fullBodyB];

    if (profile.diasPorSemana === 2) {
      resumoDivisao = '2x/semana · Full Body A / Full Body B';
      agendaSemanal = [
        { diaSemana: 'Seg', sessaoId: 'full-a', label: 'Full Body A', tipo: 'treino' },
        { diaSemana: 'Ter', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Qua', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Qui', sessaoId: 'full-b', label: 'Full Body B', tipo: 'treino' },
        { diaSemana: 'Sex', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Sáb', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Dom', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
      ];
    } else {
      const altWeek = profile.semanaCiclo % 2 === 0;
      resumoDivisao = altWeek
        ? '3x/semana · Full Body B / A / B (alternando semanas)'
        : '3x/semana · Full Body A / B / A (alternando semanas)';
      agendaSemanal = [
        {
          diaSemana: 'Seg',
          sessaoId: altWeek ? 'full-b' : 'full-a',
          label: altWeek ? 'Full Body B' : 'Full Body A',
          tipo: 'treino',
        },
        { diaSemana: 'Ter', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        {
          diaSemana: 'Qua',
          sessaoId: altWeek ? 'full-a' : 'full-b',
          label: altWeek ? 'Full Body A' : 'Full Body B',
          tipo: 'treino',
        },
        { diaSemana: 'Qui', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        {
          diaSemana: 'Sex',
          sessaoId: altWeek ? 'full-b' : 'full-a',
          label: altWeek ? 'Full Body B' : 'Full Body A',
          tipo: 'treino',
        },
        { diaSemana: 'Sáb', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Dom', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
      ];
    }
  } else if (profile.diasPorSemana === 4) {
    if (profile.preferenciaDivisao4Dias === 'upper_lower') {
      modeloBase = 'Divisão Upper / Lower (4x/semana)';
      resumoDivisao = '4x/semana · Upper A / Lower A / Upper B / Lower B';

      const upperA: WorkoutSession = {
        id: 'upper-a',
        codigo: 'Upper A',
        titulo: 'Superiores A (Empurrar & Puxar)',
        subtitulo: 'Ênfase em empurrar horizontal e puxar horizontal/vertical',
        foco: 'Superiores A',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Ombros, Punhos e Escápulas'),
        blocoPrincipal: [
          buildExercise('ua-pull-v', 'puxar_vertical', 4, profile),
          buildExercise('ua-push-h', 'empurrar_horizontal', 4, profile),
          buildExercise('ua-pull-h', 'puxar_horizontal', 3, profile),
          buildExercise('ua-push-v', 'empurrar_vertical', 3, profile),
        ],
        coreFinalizador: [buildExercise('ua-core', 'core', 2, profile)],
        voltaACalma: buildCooldown(),
      };

      const lowerA: WorkoutSession = {
        id: 'lower-a',
        codigo: 'Lower A',
        titulo: 'Inferiores A (Agachar & Posterior)',
        subtitulo: 'Força de pernas, quadril e estabilidade de core',
        foco: 'Inferiores A',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Quadril, Joelhos e Tornozelos'),
        blocoPrincipal: [
          buildExercise('la-agachar', 'agachar', 4, profile),
          buildExercise('la-hinge', 'dobradica_posterior', 3, profile),
          buildExercise('la-panturrilha', 'panturrilha', 3, profile),
        ],
        coreFinalizador: [buildExercise('la-core', 'core', 3, profile)],
        voltaACalma: buildCooldown(),
      };

      const upperB: WorkoutSession = {
        id: 'upper-b',
        codigo: 'Upper B',
        titulo: 'Superiores B (Vertical & Braços)',
        subtitulo: 'Equilíbrio push/pull com volume extra de costas',
        foco: 'Superiores B',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Escápulas e Punhos'),
        blocoPrincipal: [
          buildExercise('ub-pull-h', 'puxar_horizontal', 4, profile),
          buildExercise('ub-push-v', 'empurrar_vertical', 3, profile),
          buildExercise('ub-pull-v', 'puxar_vertical', 3, profile),
          buildExercise('ub-triceps', 'paralelas_triceps', 3, profile),
        ],
        coreFinalizador: [buildExercise('ub-core', 'core', 2, profile)],
        voltaACalma: buildCooldown(),
      };

      const lowerB: WorkoutSession = {
        id: 'lower-b',
        codigo: 'Lower B',
        titulo: 'Inferiores B (Unilateral & Core)',
        subtitulo: 'Controle unilateral, posterior e core completo',
        foco: 'Inferiores B',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Mobilidade de Quadril e Ponte'),
        blocoPrincipal: [
          buildExercise('lb-hinge', 'dobradica_posterior', 4, profile),
          buildExercise('lb-agachar', 'agachar', 3, profile),
          buildExercise('lb-panturrilha', 'panturrilha', 3, profile),
        ],
        coreFinalizador: [buildExercise('lb-core', 'core', 3, profile)],
        voltaACalma: buildCooldown(),
      };

      sessoes = [upperA, lowerA, upperB, lowerB];
      agendaSemanal = [
        { diaSemana: 'Seg', sessaoId: 'upper-a', label: 'Upper A', tipo: 'treino' },
        { diaSemana: 'Ter', sessaoId: 'lower-a', label: 'Lower A', tipo: 'treino' },
        { diaSemana: 'Qua', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Qui', sessaoId: 'upper-b', label: 'Upper B', tipo: 'treino' },
        { diaSemana: 'Sex', sessaoId: 'lower-b', label: 'Lower B', tipo: 'treino' },
        { diaSemana: 'Sáb', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Dom', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
      ];
    } else {
      // Modelo 2 — Intermediário, 4x/semana (Push / Pull / Pernas / Core + Habilidade)
      modeloBase = 'Modelo 2 — Push / Pull / Pernas / Core + Habilidade (4x/sem)';
      resumoDivisao = '4x/semana · Push / Pull / Pernas / Core + Habilidade';

      const pushSession: WorkoutSession = {
        id: 'push',
        codigo: 'Push',
        titulo: 'Dia 1 — Push (Empurrar)',
        subtitulo: 'Empurrar horizontal, vertical e tríceps/paralelas',
        foco: 'Flexão e Empurrar Vertical',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Punhos, Ombros e Flexão'),
        blocoPrincipal: [
          buildExercise('p-push-h', 'empurrar_horizontal', 4, profile),
          buildExercise('p-push-v', 'empurrar_vertical', 3, profile),
          buildExercise('p-triceps', 'paralelas_triceps', 3, profile),
        ],
        coreFinalizador: [],
        voltaACalma: buildCooldown(),
      };

      const pullSession: WorkoutSession = {
        id: 'pull',
        codigo: 'Pull',
        titulo: 'Dia 2 — Pull (Puxar)',
        subtitulo: 'Puxar vertical, horizontal, pegada e bíceps isométrico',
        foco: 'Costas, Escápulas e Pegada',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Escápulas e Mobilidade Torácica'),
        blocoPrincipal: [
          buildExercise('pl-pull-v', 'puxar_vertical', 4, profile),
          buildExercise('pl-pull-h', 'puxar_horizontal', 4, profile),
          buildExercise('pl-hang', 'puxar_vertical', 3, profile, {
            overrideRung: 2,
            overrideName: hasEquipment(profile.equipamentos, 'barra_fixa')
              ? 'Hang ativo (escápulas deprimidas) + scapular pulls'
              : 'Isometria de bíceps e costas com toalha na porta',
          }),
        ],
        coreFinalizador: [],
        voltaACalma: buildCooldown(),
      };

      const legsSession: WorkoutSession = {
        id: 'pernas',
        codigo: 'Pernas',
        titulo: 'Dia 3 — Pernas (Agachar & Posterior)',
        subtitulo: 'Quadríceps unilateral, dobradiça de quadril, posterior e panturrilha',
        foco: 'Agachamento e Posterior',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Quadril, Tornozelos e Ponte'),
        blocoPrincipal: [
          buildExercise('lg-agachar', 'agachar', 4, profile),
          buildExercise('lg-hinge', 'dobradica_posterior', 3, profile),
          buildExercise('lg-posterior-extra', 'dobradica_posterior', 3, profile, {
            overrideRung: Math.min(5, Math.max(2, profile.degrausPorPadrao.dobradica_posterior)),
            overrideName:
              profile.degrausPorPadrao.dobradica_posterior >= 4
                ? 'Deslize de posterior com toalha'
                : 'Ponte de glúteo unilateral',
            unilateral: profile.degrausPorPadrao.dobradica_posterior < 4,
          }),
          buildExercise('lg-panturrilha', 'panturrilha', 3, profile),
        ],
        coreFinalizador: [],
        voltaACalma: buildCooldown(),
      };

      const hasSolidBase =
        niveisPorGrupo.empurrar !== 'iniciante' ||
        niveisPorGrupo.core !== 'iniciante' ||
        profile.objetivo === 'habilidade';

      const coreSkillSession: WorkoutSession = {
        id: 'core-skill',
        codigo: 'Core + Hab.',
        titulo: 'Dia 4 — Core & Habilidade',
        subtitulo: 'Hollow hold, flexão de quadril, anti-rotação e bloco técnico sem falha',
        foco: 'Core e Habilidade Técnica',
        duracaoEstimadaMin: profile.tempoSessaoMin,
        modoCircuito: false,
        aquecimento: buildWarmup(profile, 'Punhos, Core e Alinhamento Hollow'),
        blocoPrincipal: [
          ...(hasSolidBase && !isMinor
            ? [buildExercise('cs-skill', 'habilidades', 4, profile, { isSkill: true })]
            : []),
          buildExercise('cs-core-1', 'core', 3, profile, { overrideRung: Math.max(2, profile.degrausPorPadrao.core) }),
          buildExercise('cs-core-2', 'core', 3, profile, {
            overrideRung: profile.degrausPorPadrao.core >= 4 ? 5 : 1,
            overrideName:
              profile.degrausPorPadrao.core >= 4
                ? 'Elevação de pernas (deitado ou suspenso)'
                : 'Dead bug controlado (por lado)',
          }),
          buildExercise('cs-core-3', 'core', 3, profile, {
            overrideRung: 3,
            overrideName: 'Prancha lateral (por lado)',
            unilateral: true,
          }),
        ],
        coreFinalizador: [],
        voltaACalma: buildCooldown(),
      };

      sessoes = [pushSession, pullSession, legsSession, coreSkillSession];
      agendaSemanal = [
        { diaSemana: 'Seg', sessaoId: 'push', label: 'Push', tipo: 'treino' },
        { diaSemana: 'Ter', sessaoId: 'pull', label: 'Pull', tipo: 'treino' },
        { diaSemana: 'Qua', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Qui', sessaoId: 'pernas', label: 'Pernas', tipo: 'treino' },
        { diaSemana: 'Sex', sessaoId: 'core-skill', label: 'Core + Hab.', tipo: 'treino' },
        { diaSemana: 'Sáb', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Dom', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
      ];
    }
  } else {
    // 5 or 6 days/week: Push / Pull / Pernas repetido + dia leve/mobilidade, ALWAYS >= 1 full rest day
    modeloBase = `Divisão Push / Pull / Pernas (${profile.diasPorSemana}x/semana)`;
    resumoDivisao =
      profile.diasPorSemana === 5
        ? '5x/semana · Push / Pull / Pernas / Push-Pull Leve / Mobilidade + Core'
        : '6x/semana · Push / Pull / Pernas (2x) com 1 dia completo de descanso';

    const pushS: WorkoutSession = {
      id: 'ppl-push',
      codigo: 'Push',
      titulo: 'Push — Empurrar',
      subtitulo: 'Empurrar horizontal, vertical e paralelas/tríceps',
      foco: 'Empurrar',
      duracaoEstimadaMin: profile.tempoSessaoMin,
      modoCircuito: false,
      aquecimento: buildWarmup(profile, 'Punhos e Ombros'),
      blocoPrincipal: [
        buildExercise('ppl-ph', 'empurrar_horizontal', 4, profile),
        buildExercise('ppl-pv', 'empurrar_vertical', 3, profile),
        buildExercise('ppl-tr', 'paralelas_triceps', 2, profile),
      ],
      coreFinalizador: [],
      voltaACalma: buildCooldown(),
    };

    const pullS: WorkoutSession = {
      id: 'ppl-pull',
      codigo: 'Pull',
      titulo: 'Pull — Puxar',
      subtitulo: 'Volume de puxar maior ou igual ao empurrar para saúde dos ombros',
      foco: 'Puxar',
      duracaoEstimadaMin: profile.tempoSessaoMin,
      modoCircuito: false,
      aquecimento: buildWarmup(profile, 'Escápulas e Mobilidade Torácica'),
      blocoPrincipal: [
        buildExercise('ppl-plv', 'puxar_vertical', 4, profile),
        buildExercise('ppl-plh', 'puxar_horizontal', 4, profile),
        buildExercise('ppl-plh2', 'puxar_vertical', 2, profile, {
          overrideRung: 2,
          overrideName: hasEquipment(profile.equipamentos, 'barra_fixa')
            ? 'Hang ativo + scapular pulls'
            : 'Superman pull isométrico',
        }),
      ],
      coreFinalizador: [],
      voltaACalma: buildCooldown(),
    };

    const legsS: WorkoutSession = {
      id: 'ppl-legs',
      codigo: 'Pernas + Core',
      titulo: 'Pernas & Core',
      subtitulo: 'Agachar, dobradiça de quadril, panturrilha e core',
      foco: 'Pernas e Core',
      duracaoEstimadaMin: profile.tempoSessaoMin,
      modoCircuito: false,
      aquecimento: buildWarmup(profile, 'Quadril e Tornozelos'),
      blocoPrincipal: [
        buildExercise('ppl-sq', 'agachar', 4, profile),
        buildExercise('ppl-hg', 'dobradica_posterior', 4, profile),
        buildExercise('ppl-cf', 'panturrilha', 3, profile),
      ],
      coreFinalizador: [buildExercise('ppl-cr', 'core', 3, profile)],
      voltaACalma: buildCooldown(),
    };

    const lightMobility: WorkoutSession = {
      id: 'ppl-mob',
      codigo: 'Leve / Mob.',
      titulo: 'Dia Leve — Mobilidade, Escápulas & Core',
      subtitulo: 'Recuperação ativa, postura, habilidades leves sem falha',
      foco: 'Mobilidade e Técnica',
      duracaoEstimadaMin: 30,
      modoCircuito: false,
      aquecimento: buildWarmup(profile, 'Mobilidade Geral'),
      blocoPrincipal: [
        buildExercise('mob-pull', 'puxar_horizontal', 2, profile, {
          overrideRung: 1,
          overrideName: 'Scapular pulls / Remada leve controlada (foco postura)',
        }),
        buildExercise('mob-core', 'core', 3, profile),
        ...(!isMinor ? [buildExercise('mob-skill', 'habilidades', 3, profile, { isSkill: true })] : []),
      ],
      coreFinalizador: [],
      voltaACalma: buildCooldown(),
    };

    if (profile.diasPorSemana === 5) {
      sessoes = [pushS, pullS, legsS, lightMobility];
      agendaSemanal = [
        { diaSemana: 'Seg', sessaoId: 'ppl-push', label: 'Push', tipo: 'treino' },
        { diaSemana: 'Ter', sessaoId: 'ppl-pull', label: 'Pull', tipo: 'treino' },
        { diaSemana: 'Qua', sessaoId: 'ppl-legs', label: 'Pernas', tipo: 'treino' },
        { diaSemana: 'Qui', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
        { diaSemana: 'Sex', sessaoId: 'ppl-pull', label: 'Pull', tipo: 'treino' },
        { diaSemana: 'Sáb', sessaoId: 'ppl-mob', label: 'Leve / Mob.', tipo: 'leve_mobilidade' },
        { diaSemana: 'Dom', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
      ];
    } else {
      sessoes = [pushS, pullS, legsS];
      agendaSemanal = [
        { diaSemana: 'Seg', sessaoId: 'ppl-push', label: 'Push', tipo: 'treino' },
        { diaSemana: 'Ter', sessaoId: 'ppl-pull', label: 'Pull', tipo: 'treino' },
        { diaSemana: 'Qua', sessaoId: 'ppl-legs', label: 'Pernas', tipo: 'treino' },
        { diaSemana: 'Qui', sessaoId: 'ppl-push', label: 'Push', tipo: 'treino' },
        { diaSemana: 'Sex', sessaoId: 'ppl-pull', label: 'Pull', tipo: 'treino' },
        { diaSemana: 'Sáb', sessaoId: 'ppl-legs', label: 'Pernas', tipo: 'treino' },
        { diaSemana: 'Dom', sessaoId: null, label: 'Descanso', tipo: 'descanso' },
      ];
    }
  }

  const volumeSemanal = computeWeeklyVolume(sessoes, agendaSemanal);

  const descansoPadraoTexto = isCircuit
    ? '40s trabalho / 20s descanso'
    : profile.objetivo === 'forca' || profile.objetivo === 'habilidade'
      ? '2–3 min'
      : '60–90s';

  const rirPadraoTexto = profile.semanaDeload
    ? 'RIR 4+ (Deload · ~50% volume)'
    : 'RIR 1–3 (sem falhar na técnica)';

  const dicaPerdaGordura =
    profile.objetivo === 'perda_gordura'
      ? 'Para perda de gordura, combine este treino de força com caminhada diária. A alimentação (proteína adequada e déficit calórico moderado) é o principal fator — considere um nutricionista para um plano individualizado, sem restrições extremas.'
      : undefined;

  const nivelResumoUnico =
    niveisPorGrupo.empurrar === niveisPorGrupo.puxar &&
    niveisPorGrupo.puxar === niveisPorGrupo.pernas &&
    niveisPorGrupo.pernas === niveisPorGrupo.core
      ? LEVEL_LABELS[niveisPorGrupo.empurrar]
      : `Misto (Empurrar: ${LEVEL_LABELS[niveisPorGrupo.empurrar]} · Puxar: ${LEVEL_LABELS[niveisPorGrupo.puxar]} · Pernas: ${LEVEL_LABELS[niveisPorGrupo.pernas]})`;

  return {
    resumoObjetivo: GOAL_LABELS[profile.objetivo].titulo,
    resumoDivisao,
    resumoNivel: nivelResumoUnico,
    niveisPorGrupo,
    modeloBase,
    descansoPadraoTexto,
    rirPadraoTexto,
    volumeSemanal,
    agendaSemanal,
    sessoes,
    avisosSeguranca,
    dicaPerdaGordura,
    sugestaoDeload: !profile.semanaDeload && profile.semanaCiclo >= 5,
  };
}

/**
 * Applies the Double Progression Rule (Section 3):
 * When the user hits the top of the rep/time range with clean technique for 2 consecutive sessions
 * at their current rung, suggest advancing to the next variation on that movement ladder.
 */
export function checkDoubleProgression(
  profile: UserProfile,
  logs: WorkoutLogEntry[]
): DoubleProgressionStatus[] {
  const patterns = Object.keys(PROGRESSION_LADDERS) as MovementPatternId[];

  return patterns.map((patternId) => {
    const ladder = PROGRESSION_LADDERS[patternId];
    const degrauAtual = Math.max(
      1,
      Math.min(ladder.degraus.length, profile.degrausPorPadrao[patternId] ?? 1)
    );
    const currentStep = ladder.degraus[degrauAtual - 1];
    const nextStep =
      degrauAtual < ladder.degraus.length ? ladder.degraus[degrauAtual] : null;

    const nextVariationName = nextStep
      ? profile.modoApartamento && nextStep.possuiSalto && nextStep.substitutoSemSalto
        ? `${nextStep.substitutoSemSalto} (sem salto)`
        : nextStep.nome
      : null;

    const matchingLogs = logs
      .filter((l) => l.patternId === patternId && l.degrau === degrauAtual)
      .sort((a, b) => (a.data < b.data ? 1 : a.data > b.data ? -1 : b.id.localeCompare(a.id)));

    let streak = 0;
    for (const entry of matchingLogs) {
      if (entry.tecnicaLimpa && entry.repsOuSegundos >= entry.alvoTopo) {
        streak += 1;
      } else {
        break;
      }
    }

    return {
      patternId,
      patternNome: ladder.nome,
      degrauAtual,
      variacaoAtual: currentStep.nome,
      proximaVariacao: nextVariationName,
      sessoesLimpasNoTopo: streak,
      prontoParaAvancar: streak >= 2 && nextStep !== null,
      ultimoRegistroData: matchingLogs[0]?.data ?? null,
    };
  });
}

/**
 * Applies one of the 4 reference models from modelos-de-treino.md to a profile.
 */
export function applyPresetModel(
  current: UserProfile,
  modelId: PresetModelId
): UserProfile {
  if (modelId === 'modelo_1') {
    const next: UserProfile = {
      ...current,
      objetivo: 'saude_geral',
      nivelGeral: 'iniciante',
      usarMiniTeste: false,
      equipamentos: ['mesa_cadeira_toalha'],
      diasPorSemana: 3,
      tempoSessaoMin: 45,
      modoApartamento: false,
      semanaDeload: false,
    };
    return { ...next, degrausPorPadrao: deriveInitialLevels(next) };
  }

  if (modelId === 'modelo_2') {
    const next: UserProfile = {
      ...current,
      objetivo: 'hipertrofia',
      nivelGeral: 'intermediario',
      usarMiniTeste: false,
      equipamentos: ['barra_fixa', 'mesa_cadeira_toalha', 'paralelas'],
      diasPorSemana: 4,
      tempoSessaoMin: 45,
      preferenciaDivisao4Dias: 'push_pull_pernas_core',
      modoApartamento: false,
      semanaDeload: false,
    };
    return { ...next, degrausPorPadrao: deriveInitialLevels(next) };
  }

  if (modelId === 'modelo_3') {
    return {
      ...current,
      tempoSessaoMin: 25,
      semanaDeload: false,
    };
  }

  // modelo_4 — Apartamento silencioso
  const next: UserProfile = {
    ...current,
    modoApartamento: true,
    tempoSessaoMin: current.tempoSessaoMin === 25 ? 45 : current.tempoSessaoMin,
  };
  return {
    ...next,
    degrausPorPadrao: {
      ...next.degrausPorPadrao,
      agachar: next.degrausPorPadrao.agachar === 5 ? 4 : next.degrausPorPadrao.agachar,
    },
  };
}

export function formatLogsToCsv(logs: WorkoutLogEntry[]): string {
  const header = 'Data,Exercício,Séries x Reps/Tempo,Variação,Técnica Limpa,Sensação (1-10),Observação';
  const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;
  const rows = logs.map((l) =>
    [
      l.data,
      escape(l.exercicio),
      `${l.series}x${l.repsOuSegundos}${l.unidade === 's' ? 's' : ''}`,
      escape(l.variacao),
      l.tecnicaLimpa ? 'Sim' : 'Não',
      String(l.sensacao),
      escape(l.observacao),
    ].join(',')
  );
  return [header, ...rows].join('\n');
}
