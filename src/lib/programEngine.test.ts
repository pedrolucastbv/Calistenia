import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_USER_PROFILE,
  applyPresetModel,
  checkDoubleProgression,
  deriveInitialLevels,
  evaluateMiniTest,
  formatLogsToCsv,
  generateTrainingPlan,
} from './programEngine';
import { PROGRESSION_LADDERS } from './calisthenicsData';
import { EXERCISE_MEDIA } from './exerciseMedia';
import type { MovementPatternId, UserProfile, WorkoutLogEntry } from './types';

test('mini-teste classifica cada padrão de movimento de forma independente', () => {
  const result = evaluateMiniTest(
    {
      flexoes: 15, // intermediario (8-25)
      agachamentos: 45, // avancado (>40)
      barras: 0, // iniciante (<1)
      pranchaSegundos: 25, // iniciante (<30s)
    },
    'iniciante',
    false
  );

  assert.equal(result.empurrar, 'intermediario');
  assert.equal(result.pernas, 'avancado');
  assert.equal(result.puxar, 'iniciante');
  assert.equal(result.core, 'iniciante');
});

test('menor de idade desativa testes de máximo e mantém nível conservador', () => {
  const result = evaluateMiniTest(
    { flexoes: 30, agachamentos: 50, barras: 12, pranchaSegundos: 120 },
    'avancado',
    true
  );

  assert.equal(result.empurrar, 'iniciante');
  assert.equal(result.puxar, 'iniciante');
  assert.equal(result.pernas, 'iniciante');
  assert.equal(result.core, 'iniciante');
});

test('divisão semanal respeita dias por semana e garante pelo menos 1 dia de descanso', () => {
  const daysList: Array<2 | 3 | 4 | 5 | 6> = [2, 3, 4, 5, 6];
  for (const dias of daysList) {
    const profile: UserProfile = {
      ...DEFAULT_USER_PROFILE,
      diasPorSemana: dias,
      tempoSessaoMin: 45,
    };
    const plan = generateTrainingPlan(profile);
    const restDays = plan.agendaSemanal.filter((d) => d.tipo === 'descanso').length;
    const trainingDays = plan.agendaSemanal.filter((d) => d.sessaoId !== null).length;

    assert.ok(restDays >= 1, `Esperado >= 1 dia de descanso para ${dias} dias/sem`);
    assert.equal(trainingDays, dias, `Esperado ${dias} dias ativos na agenda`);
  }
});

test('equilíbrio push/pull garante volume semanal de puxar maior ou igual ao de empurrar', () => {
  const configs: UserProfile[] = [
    applyPresetModel(DEFAULT_USER_PROFILE, 'modelo_1'),
    applyPresetModel(DEFAULT_USER_PROFILE, 'modelo_2'),
    applyPresetModel(DEFAULT_USER_PROFILE, 'modelo_3'),
    { ...DEFAULT_USER_PROFILE, diasPorSemana: 4, preferenciaDivisao4Dias: 'upper_lower' },
    { ...DEFAULT_USER_PROFILE, diasPorSemana: 6 },
  ];

  for (const cfg of configs) {
    const plan = generateTrainingPlan(cfg);
    assert.ok(
      plan.volumeSemanal.puxar >= plan.volumeSemanal.empurrar,
      `Push/Pull desequilibrado em ${plan.modeloBase}: puxar=${plan.volumeSemanal.puxar} < empurrar=${plan.volumeSemanal.empurrar}`
    );
    assert.equal(plan.volumeSemanal.equilibrioPushPullOk, true);
  }
});

test('modo apartamento nunca prescreve saltos e adapta aquecimento', () => {
  const profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    modoApartamento: true,
    degrausPorPadrao: {
      ...DEFAULT_USER_PROFILE.degrausPorPadrao,
      agachar: 5, // degrau 5 é agachamento com salto
    },
  };

  const plan = generateTrainingPlan(profile);
  const allExercises = plan.sessoes.flatMap((s) => [...s.blocoPrincipal, ...s.coreFinalizador]);
  const squatExercise = allExercises.find((e) => e.patternId === 'agachar');

  assert.ok(squatExercise, 'Exercício de agachamento deve existir');
  assert.ok(
    !/agachamento com salto/i.test(squatExercise.nome),
    `Não deve prescrever salto no modo apartamento: ${squatExercise.nome}`
  );
  assert.ok(
    plan.sessoes[0].aquecimento[0].nome.toLowerCase().includes('sem salto'),
    'Aquecimento deve usar versão sem salto no modo apartamento'
  );
});

test('semana de deload reduz séries em ~50% e define RIR 4+', () => {
  const normalPlan = generateTrainingPlan({
    ...DEFAULT_USER_PROFILE,
    semanaDeload: false,
  });
  const deloadPlan = generateTrainingPlan({
    ...DEFAULT_USER_PROFILE,
    semanaDeload: true,
  });

  const normalSets = normalPlan.sessoes[0].blocoPrincipal.reduce((acc, ex) => acc + ex.series, 0);
  const deloadSets = deloadPlan.sessoes[0].blocoPrincipal.reduce((acc, ex) => acc + ex.series, 0);

  assert.ok(deloadSets < normalSets, 'Deload deve reduzir o total de séries');
  assert.ok(
    deloadPlan.sessoes[0].blocoPrincipal.every((ex) => ex.rirTexto.includes('RIR 4+')),
    'Todos os exercícios no deload devem indicar RIR 4+'
  );
});

test('sem barra fixa adapta puxar vertical para alternativas caseiras', () => {
  const profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    equipamentos: ['nenhum'],
    diasPorSemana: 3,
    tempoSessaoMin: 45,
  };
  const plan = generateTrainingPlan(profile);
  const sessionB = plan.sessoes.find((s) => s.id === 'full-b');
  const pullV = sessionB?.blocoPrincipal.find((e) => e.patternId === 'puxar_vertical');

  assert.ok(pullV, 'Sessão B deve conter puxar vertical adaptado');
  assert.ok(
    /toalha|superman|mochila/i.test(pullV.nome),
    `Esperada alternativa sem barra, veio: ${pullV.nome}`
  );
});

test('regra de dupla progressão detecta 2 sessões limpas consecutivas no topo da faixa', () => {
  const profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    degrausPorPadrao: {
      ...DEFAULT_USER_PROFILE.degrausPorPadrao,
      empurrar_horizontal: 4,
    },
  };

  const logs: WorkoutLogEntry[] = [
    {
      id: 'l1',
      data: '2026-11-20',
      patternId: 'empurrar_horizontal',
      exercicio: 'Flexão completa no chão',
      variacao: 'Degrau 4',
      degrau: 4,
      series: 3,
      repsOuSegundos: 12,
      alvoTopo: 12,
      unidade: 'reps',
      tecnicaLimpa: true,
      sensacao: 7,
      observacao: '',
    },
    {
      id: 'l2',
      data: '2026-11-23',
      patternId: 'empurrar_horizontal',
      exercicio: 'Flexão completa no chão',
      variacao: 'Degrau 4',
      degrau: 4,
      series: 3,
      repsOuSegundos: 12,
      alvoTopo: 12,
      unidade: 'reps',
      tecnicaLimpa: true,
      sensacao: 7,
      observacao: '',
    },
  ];

  const statuses = checkDoubleProgression(profile, logs);
  const pushH = statuses.find((s) => s.patternId === 'empurrar_horizontal');

  assert.ok(pushH);
  assert.equal(pushH.sessoesLimpasNoTopo, 2);
  assert.equal(pushH.prontoParaAvancar, true);
  assert.ok(pushH.proximaVariacao?.includes('pés elevados'));

  // If latest session was not clean, streak resets to 0
  const brokenStreakLogs: WorkoutLogEntry[] = [
    ...logs,
    {
      ...logs[1],
      id: 'l3',
      data: '2026-11-26',
      tecnicaLimpa: false,
    },
  ];
  const resetStatus = checkDoubleProgression(profile, brokenStreakLogs).find(
    (s) => s.patternId === 'empurrar_horizontal'
  );
  assert.equal(resetStatus?.prontoParaAvancar, false);
  assert.equal(resetStatus?.sessoesLimpasNoTopo, 0);
});

test('deriveInitialLevels regride padrões afetados por lesão no punho ou joelho', () => {
  const levels = deriveInitialLevels({
    nivelGeral: 'avancado',
    usarMiniTeste: false,
    miniTeste: { flexoes: null, agachamentos: null, barras: null, pranchaSegundos: null },
    equipamentos: ['barra_fixa', 'mesa_cadeira_toalha'],
    lesoes: ['punho', 'joelho'],
    modoApartamento: false,
    condicoesEspeciais: [],
  });

  assert.ok(levels.empurrar_horizontal <= 2);
  assert.ok(levels.agachar <= 3);
});

test('formatLogsToCsv gera cabeçalho e linhas válidas', () => {
  const csv = formatLogsToCsv([
    {
      id: '1',
      data: '2026-11-26',
      patternId: 'agachar',
      exercicio: 'Agachamento livre',
      variacao: 'Degrau 2',
      degrau: 2,
      series: 3,
      repsOuSegundos: 15,
      alvoTopo: 15,
      unidade: 'reps',
      tecnicaLimpa: true,
      sensacao: 8,
      observacao: 'Ótima técnica',
    },
  ]);

  assert.ok(csv.includes('Data,Exercício,Séries x Reps/Tempo'));
  assert.ok(csv.includes('2026-11-26,"Agachamento livre",3x15'));
});

test('checkDoubleProgression sugere substituto sem salto no modo apartamento', () => {
  const profile: UserProfile = {
    ...DEFAULT_USER_PROFILE,
    modoApartamento: true,
    degrausPorPadrao: {
      ...DEFAULT_USER_PROFILE.degrausPorPadrao,
      agachar: 4, // próximo degrau é 5 (salto)
    },
  };
  const status = checkDoubleProgression(profile, []).find((s) => s.patternId === 'agachar');
  assert.ok(status?.proximaVariacao);
  assert.ok(!/agachamento com salto/i.test(status.proximaVariacao));
  assert.ok(/sem salto/i.test(status.proximaVariacao));
});

test('todos os padrões de movimento possuem foto e passo a passo visual configurados', () => {
  const patternIds = Object.keys(PROGRESSION_LADDERS) as MovementPatternId[];
  for (const id of patternIds) {
    const media = EXERCISE_MEDIA[id];
    assert.ok(media, `Mídia ausente para ${id}`);
    assert.ok(media.fotoUrl.startsWith('/src/assets/images/'), `URL inválida para ${id}`);
    assert.ok(media.passosExecucao.length === 4, `Esperados 4 passos de execução para ${id}`);
    assert.ok(media.pontosAtencao.length >= 2, `Esperados pontos de atenção para ${id}`);
  }
});
