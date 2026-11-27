import type {
  EquipmentId,
  ExperienceLevel,
  HomeEquipmentGuide,
  InjuryArea,
  MovementPatternId,
  MovementPatternLadder,
  PresetModelId,
  SpecialCondition,
  TechniqueGuide,
  TrainingGoal,
} from './types';

export const GOAL_LABELS: Record<TrainingGoal, { titulo: string; descricao: string }> = {
  forca: {
    titulo: 'Ganhar força',
    descricao: 'Variações desafiadoras, 3–8 reps limpas e descanso de 2–3 min.',
  },
  hipertrofia: {
    titulo: 'Massa muscular',
    descricao: 'Controle excêntrico, faixas de 6–15 reps e descanso de 60–90s.',
  },
  perda_gordura: {
    titulo: 'Perder gordura',
    descricao: 'Treino de força + ritmo contínuo e orientação para caminhada diária.',
  },
  resistencia: {
    titulo: 'Resistência',
    descricao: 'Faixas mais altas, intervalos curtos (60s) e alta consistência técnica.',
  },
  habilidade: {
    titulo: 'Habilidades (barra, L-sit, handstand)',
    descricao: 'Base sólida + trabalho técnico de baixo volume com descanso longo.',
  },
  saude_geral: {
    titulo: 'Saúde geral e consistência',
    descricao: 'Cobertura equilibrada de todos os padrões, articulações protegidas.',
  },
};

export const LEVEL_LABELS: Record<ExperienceLevel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};

export const EQUIPMENT_LABELS: Record<EquipmentId, { nome: string; detalhe: string }> = {
  nenhum: {
    nome: 'Nenhum (apenas chão)',
    detalhe: 'Tapete ou piso firme, sem acessórios externos.',
  },
  mesa_cadeira_toalha: {
    nome: 'Mesa, cadeira e toalha',
    detalhe: 'Para remada invertida, flexão inclinada, mergulho e deslizamentos.',
  },
  mochila: {
    nome: 'Mochila com peso',
    detalhe: 'Livros ou garrafas d’água para sobrecarga em agachamento, flexão e remada.',
  },
  elastico: {
    nome: 'Elástico de resistência',
    detalhe: 'Assistência na barra/paralelas ou resistência progressiva.',
  },
  barra_fixa: {
    nome: 'Barra fixa (porta ou parede)',
    detalhe: 'Verifique capacidade e fixação antes de pendurar o peso corporal.',
  },
  paralelas: {
    nome: 'Paralelas / Parallettes',
    detalhe: 'Flexões mais profundas, mergulhos seguros e punhos neutros no L-sit.',
  },
};

export const INJURY_LABELS: Record<InjuryArea, { nome: string; adaptacao: string }> = {
  ombro: {
    nome: 'Ombro',
    adaptacao:
      'Reduz amplitude em mergulhos, prioriza puxar horizontal e escápulas ativas. Evite dor aguda acima da cabeça.',
  },
  punho: {
    nome: 'Punho',
    adaptacao:
      'Prefira pegada neutra (parallettes ou punhos fechados sobre tapete), eleve as mãos na flexão e capriche na rotação de punhos no aquecimento.',
  },
  joelho: {
    nome: 'Joelho',
    adaptacao:
      'Sem saltos, cadência lenta controlada, amplitude confortável e foco em ponte de glúteo e posterior.',
  },
  lombar: {
    nome: 'Lombar',
    adaptacao:
      'Priorize core anti-extensão (dead bug, prancha controlada com pelve neutra) e evite hiperextensão.',
  },
  cotovelo: {
    nome: 'Cotovelo',
    adaptacao:
      'Controle o volume de puxadas intensas e extensões de tríceps; aumente aquecimento articular.',
  },
};

export const SPECIAL_CONDITION_LABELS: Record<
  SpecialCondition,
  { nome: string; aviso: string }
> = {
  gestante: {
    nome: 'Gestante',
    aviso:
      'Mantenha intensidade conservadora (RIR 3–4), evite apneia e posições desconfortáveis; liberação médica é recomendada antes de intensificar.',
  },
  cardiovascular: {
    nome: 'Condição cardíaca ou hipertensão',
    aviso:
      'Respire continuamente (evite segurar o ar / manobra de Valsalva) e confirme liberação médica antes de aumentar intensidade.',
  },
  pos_cirurgico: {
    nome: 'Pós-cirúrgico ou lesão recente',
    aviso:
      'Respeite a liberação do médico ou fisioterapeuta e avance apenas sem dor articular ou desconforto agudo.',
  },
  menor_idade: {
    nome: 'Menor de 18 anos',
    aviso:
      'Foco total em técnica limpa, coordenação e consistência semanal — testes de repetição máxima ficam desativados.',
  },
};

export const PRESET_MODELS: Record<
  PresetModelId,
  {
    id: PresetModelId;
    titulo: string;
    subtitulo: string;
    resumo: string;
  }
> = {
  modelo_1: {
    id: 'modelo_1',
    titulo: 'Modelo 1 — Iniciante',
    subtitulo: '3x/semana · sem equipamento · 45 min',
    resumo: 'Full Body A / B / A alternando semanas com base segura em todos os padrões.',
  },
  modelo_2: {
    id: 'modelo_2',
    titulo: 'Modelo 2 — Intermediário',
    subtitulo: '4x/semana · Push / Pull / Pernas / Core',
    resumo: 'Divisão dedicada com maior volume semanal e bloco técnico de habilidades.',
  },
  modelo_3: {
    id: 'modelo_3',
    titulo: 'Modelo 3 — Pouco Tempo',
    subtitulo: '20–25 min · Circuito 40s / 20s',
    resumo: '3–4 rodadas contínuas para dias corridos sem abrir mão da técnica.',
  },
  modelo_4: {
    id: 'modelo_4',
    titulo: 'Modelo 4 — Apartamento',
    subtitulo: 'Silencioso · sem saltos · controle de tempo',
    resumo: 'Troca impactos por variações lentas, pausas isométricas e amortecimento.',
  },
};

export const PROGRESSION_LADDERS: Record<MovementPatternId, MovementPatternLadder> = {
  empurrar_horizontal: {
    id: 'empurrar_horizontal',
    nome: 'Empurrar Horizontal',
    grupo: 'Empurrar',
    descricaoMeta: 'Meta: 3 séries limpas no topo da faixa por 2 sessões seguidas antes de avançar.',
    degraus: [
      {
        degrau: 1,
        nome: 'Flexão na parede',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 8, max: 12, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 10, max: 15, unidade: 'reps' },
        dicaExecucao: 'Corpo em linha reta, mãos na linha do peito e cotovelos a ~45° do tronco.',
      },
      {
        degrau: 2,
        nome: 'Flexão inclinada (mesa, bancada ou sofá firme)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 12, unidade: 'reps' },
        dicaExecucao: 'Apoie em superfície firme; desça o peito até a borda mantendo abdômen e glúteos contraídos.',
      },
      {
        degrau: 3,
        nome: 'Flexão com joelhos no chão',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 12, unidade: 'reps' },
        dicaExecucao: 'Mantenha o quadril alinhado dos joelhos aos ombros — não deixe a lombar cair.',
      },
      {
        degrau: 4,
        nome: 'Flexão completa no chão',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 12, unidade: 'reps' },
        dicaExecucao: 'Peito próximo ao chão, escápulas livres e corpo rígido como prancha.',
      },
      {
        degrau: 5,
        nome: 'Flexão com pés elevados ou tempo lento (3s descendo)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 12, unidade: 'reps' },
        dicaExecucao: 'Desça em 3 segundos controlados, faça leve pausa embaixo e suba firme.',
      },
      {
        degrau: 6,
        nome: 'Flexão diamante',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 12, unidade: 'reps' },
        dicaExecucao: 'Mãos próximas formando triângulo sob o esterno; mantenha cotovelos apontando para trás.',
      },
      {
        degrau: 7,
        nome: 'Flexão arqueiro (archer)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 4, max: 6, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 5, max: 8, unidade: 'reps' },
        dicaExecucao: 'Desloque o peso sobre um braço enquanto o outro estende lateralmente como apoio.',
      },
      {
        degrau: 8,
        nome: 'Flexão em uma mão assistida → uma mão',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 3, max: 6, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 4, max: 6, unidade: 'reps' },
        riscoAlto: true,
        dicaExecucao: 'Base dos pés afastada para anti-rotação do tronco; nunca treine até falha técnica.',
      },
    ],
  },

  empurrar_vertical: {
    id: 'empurrar_vertical',
    nome: 'Empurrar Vertical',
    grupo: 'Empurrar',
    descricaoMeta: 'Foco em ombros fortes com alinhamento escapular e controle dos punhos.',
    degraus: [
      {
        degrau: 1,
        nome: 'Pike push-up com pés no chão (joelhos flexionados)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 5, max: 10, unidade: 'reps' },
        dicaExecucao: 'Quadril alto em V invertido; leve a cabeça à frente das mãos formando triângulo no chão.',
      },
      {
        degrau: 2,
        nome: 'Pike push-up com pernas esticadas',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 10, unidade: 'reps' },
        dicaExecucao: 'Pernas estendidas, peso deslocado para os ombros e empurrada completa no topo.',
      },
      {
        degrau: 3,
        nome: 'Pike push-up com pés elevados',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 10, unidade: 'reps' },
        equipamentoNecessario: ['mesa_cadeira_toalha'],
        dicaExecucao: 'Pés sobre cadeira ou cama firme; tronco quase vertical para simular empurrada acima da cabeça.',
      },
      {
        degrau: 4,
        nome: 'Parada de mão encostada na parede (isometria) → negativa',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 15, max: 30, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 20, max: 35, unidade: 's' },
        riscoAlto: true,
        dicaExecucao: 'Empurre o chão ativamente com os ombros; na negativa, desça devagar sem bater a cabeça.',
      },
      {
        degrau: 5,
        nome: 'Flexão de parada de mão na parede',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 3, max: 6, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 4, max: 8, unidade: 'reps' },
        riscoAlto: true,
        dicaExecucao: 'Amplitude limpa, abdômen firme (sem hiperextensão lombar) e descanso de 2–3 min.',
      },
    ],
  },

  paralelas_triceps: {
    id: 'paralelas_triceps',
    nome: 'Paralelas e Tríceps',
    grupo: 'Empurrar',
    descricaoMeta: 'Cuide dos ombros: mantenha escápulas deprimidas e amplitude moderada.',
    degraus: [
      {
        degrau: 1,
        nome: 'Extensão de tríceps inclinada (mãos em mesa, pés no chão)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 8, max: 12, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 14, unidade: 'reps' },
        dicaExecucao: 'Flexione apenas os cotovelos levando a testa na direção da borda da mesa; corpo firme.',
      },
      {
        degrau: 2,
        nome: 'Mergulho em banco ou cadeira firme',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        equipamentoNecessario: ['mesa_cadeira_toalha'],
        dicaExecucao: 'Ombros longe das orelhas e amplitude moderada (até ~90° no cotovelo) para proteger o ombro.',
      },
      {
        degrau: 3,
        nome: 'Mergulho em paralelas (ou duas cadeiras firmes apoiadas)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 12, unidade: 'reps' },
        equipamentoNecessario: ['paralelas'],
        dicaExecucao: 'Desça controlado com peito aberto e empurre até estender completamente os cotovelos.',
      },
      {
        degrau: 4,
        nome: 'Mergulho em paralelas com mochila',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 10, unidade: 'reps' },
        equipamentoNecessario: ['paralelas', 'mochila'],
        dicaExecucao: 'Mochila justa no corpo para não balançar; priorize controle na descida.',
      },
    ],
  },

  puxar_horizontal: {
    id: 'puxar_horizontal',
    nome: 'Puxar Horizontal',
    grupo: 'Puxar',
    descricaoMeta: 'Base indispensável para postura e saúde dos ombros. Puxe com as costas, não só braços.',
    notaSemBarra:
      'Sem mesa resistente ou barra baixa: use toalha presa na porta firme, remada curvada com mochila ou superman pull isométrico.',
    degraus: [
      {
        degrau: 1,
        nome: 'Remada invertida inclinada (mesa resistente) ou Superman pull',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Teste a estabilidade da mesa antes. Junte as escápulas no topo e desça sem despencar.',
      },
      {
        degrau: 2,
        nome: 'Remada invertida com corpo horizontal',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 12, unidade: 'reps' },
        equipamentoNecessario: ['mesa_cadeira_toalha'],
        dicaExecucao: 'Pernas estendidas, quadril alinhado e peito tocando a linha da mesa ou barra baixa.',
      },
      {
        degrau: 3,
        nome: 'Remada com toalha na porta (ou remada com mochila pesada)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Segure as duas pontas da toalha firmemente presa na porta fechada e inclinada; puxe o peito à frente.',
      },
      {
        degrau: 4,
        nome: 'Remada invertida com pés elevados',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        equipamentoNecessario: ['mesa_cadeira_toalha'],
        dicaExecucao: 'Apoie os calcanhares em uma cadeira firme e faça pausa de 1s com as escápulas fechadas.',
      },
      {
        degrau: 5,
        nome: 'Remada arqueiro ou em uma mão',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 10, unidade: 'reps' },
        equipamentoNecessario: ['mesa_cadeira_toalha'],
        dicaExecucao: 'Evite girar o tronco excessivamente; mantenha o ombro baixo longe da orelha.',
      },
    ],
  },

  puxar_vertical: {
    id: 'puxar_vertical',
    nome: 'Puxar Vertical',
    grupo: 'Puxar',
    descricaoMeta: 'Construa pegada e escápulas primeiro; nunca pule etapas na barra fixa.',
    notaSemBarra:
      'Sem barra fixa: substitua por remada invertida, remada curvada com mochila, superman pull isométrico e toalha na porta. Adquirir uma barra fixa de porta/parede amplia muito o potencial.',
    degraus: [
      {
        degrau: 1,
        nome: 'Hang passivo (pendurar na barra) — sem barra: Superman pull',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 20, max: 30, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 20, max: 35, unidade: 's' },
        equipamentoNecessario: ['barra_fixa'],
        dicaExecucao: 'Teste a fixação da barra antes. Pendure relaxando os ombros e fortalecendo a pegada.',
      },
      {
        degrau: 2,
        nome: 'Hang ativo (escápulas deprimidas) + scapular pulls',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 20, max: 30, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 20, max: 30, unidade: 's' },
        equipamentoNecessario: ['barra_fixa'],
        dicaExecucao: 'Com braços retos, puxe os ombros para baixo afastando-os das orelhas.',
      },
      {
        degrau: 3,
        nome: 'Barra negativa (descida controlada em 3–5s)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 3, max: 5, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 4, max: 6, unidade: 'reps' },
        equipamentoNecessario: ['barra_fixa'],
        dicaExecucao: 'Suba com apoio de banco ou salto leve, segure o topo 1s e desça em 3 a 5 segundos.',
      },
      {
        degrau: 4,
        nome: 'Barra com elástico ou pés apoiados',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 10, unidade: 'reps' },
        equipamentoNecessario: ['barra_fixa'],
        dicaExecucao: 'Use o mínimo de assistência necessária para passar o queixo com ombros baixos.',
      },
      {
        degrau: 5,
        nome: 'Barra fixa completa',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 4, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 5, max: 10, unidade: 'reps' },
        equipamentoNecessario: ['barra_fixa'],
        dicaExecucao: 'Inicie puxando as escápulas para baixo, leve o peito na direção da barra e estenda no fundo.',
      },
      {
        degrau: 6,
        nome: 'Barra com pausa no topo ou tempo lento',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 4, max: 6, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 5, max: 8, unidade: 'reps' },
        equipamentoNecessario: ['barra_fixa'],
        dicaExecucao: 'Pause 2s no topo com queixo acima da barra e desça em 3s controlados.',
      },
      {
        degrau: 7,
        nome: 'Barra com mochila → archer → uma mão assistida',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 3, max: 6, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 4, max: 8, unidade: 'reps' },
        equipamentoNecessario: ['barra_fixa'],
        dicaExecucao: 'Carga gradual e descanso mínimo de 2–3 min para preservar tendões do cotovelo.',
      },
      {
        degrau: 8,
        nome: 'Muscle-up (somente com base forte em barra e paralela)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 1, max: 4, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 2, max: 5, unidade: 'reps' },
        equipamentoNecessario: ['barra_fixa'],
        riscoAlto: true,
        dicaExecucao: 'Exige puxada explosiva até o peito + transição limpa. Volume baixo e nunca até falha.',
      },
    ],
  },

  agachar: {
    id: 'agachar',
    nome: 'Agachar (Quadríceps e Pernas)',
    grupo: 'Pernas',
    descricaoMeta: 'Alinhamento de joelhos acompanhando a ponta dos pés e controle total na descida.',
    degraus: [
      {
        degrau: 1,
        nome: 'Agachamento com apoio (sentar e levantar da cadeira)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 8, max: 12, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 10, max: 15, unidade: 'reps' },
        dicaExecucao: 'Toque levemente a cadeira sem despencar e suba empurrando o chão com o pé inteiro.',
      },
      {
        degrau: 2,
        nome: 'Agachamento livre',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 10, max: 15, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 10, max: 15, unidade: 'reps' },
        dicaExecucao: 'Joelhos alinhados com a ponta dos pés, tronco firme e calcanhares apoiados no chão.',
      },
      {
        degrau: 3,
        nome: 'Agachamento com pausa (2s embaixo) ou tempo lento',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Desça em 3s, pause 2s sem perder tensão no fundo e suba controlado.',
      },
      {
        degrau: 4,
        nome: 'Agachamento búlgaro (pé de trás elevado)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Execute por lado. Tronco levemente inclinado, joelho da frente estável.',
      },
      {
        degrau: 5,
        nome: 'Agachamento com salto',
        substitutoSemSalto: 'Agachamento búlgaro com tempo lento (3s descendo) ou passada reversa controlada',
        possuiSalto: true,
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Aterrisse silencioso absorvendo com quadril e joelhos. Em apartamento, use a versão lenta sem salto.',
      },
      {
        degrau: 6,
        nome: 'Pistol squat assistido → pistol squat completo',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 3, max: 6, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 4, max: 8, unidade: 'reps' },
        riscoAlto: true,
        dicaExecucao: 'Use batente da porta ou cadeira para equilibrar no início; nunca force dor no joelho.',
      },
    ],
  },

  dobradica_posterior: {
    id: 'dobradica_posterior',
    nome: 'Dobradiça de Quadril e Posterior',
    grupo: 'Pernas',
    descricaoMeta: 'Fortalece glúteos, isquiotibiais e protege a lombar com dobra limpa no quadril.',
    degraus: [
      {
        degrau: 1,
        nome: 'Ponte de glúteo',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 10, max: 15, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 12, max: 15, unidade: 'reps' },
        dicaExecucao: 'Empurre pelos calcanhares, contraia glúteos no topo sem arquear a lombar.',
      },
      {
        degrau: 2,
        nome: 'Ponte de glúteo unilateral',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 8, max: 12, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 10, max: 12, unidade: 'reps' },
        dicaExecucao: 'Por lado: mantenha a pelve nivelada sem deixar o quadril girar.',
      },
      {
        degrau: 3,
        nome: 'Good morning sem peso / hip hinge com bastão',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 8, max: 12, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 10, max: 15, unidade: 'reps' },
        dicaExecucao: 'Empurre o quadril para trás mantendo a coluna neutra e joelhos levemente destravados.',
      },
      {
        degrau: 4,
        nome: 'Stiff unilateral (peso corporal ou mochila)',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Por lado: perna de trás sobe em linha com o tronco; sinta alongar o posterior da perna de apoio.',
      },
      {
        degrau: 5,
        nome: 'Deslize de posterior com toalha / Nordic curl assistido',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 5, max: 8, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 6, max: 10, unidade: 'reps' },
        dicaExecucao: 'Quadril elevado durante todo o deslize da toalha; controle lento na volta.',
      },
    ],
  },

  panturrilha: {
    id: 'panturrilha',
    nome: 'Panturrilha',
    grupo: 'Pernas',
    descricaoMeta: 'Amplitude completa em degrau com pausa de 1s no topo e descida controlada.',
    degraus: [
      {
        degrau: 1,
        nome: 'Elevação de calcanhares bilateral em degrau',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 12, max: 15, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 12, max: 20, unidade: 'reps' },
        dicaExecucao: 'Desça o calcanhar abaixo da linha do degrau e suba até o ponto mais alto sem balançar.',
      },
      {
        degrau: 2,
        nome: 'Elevação de calcanhares unilateral em degrau',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 10, max: 15, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 12, max: 15, unidade: 'reps' },
        dicaExecucao: 'Por lado: apoie levemente uma mão na parede para equilíbrio e mantenha o joelho estendido.',
      },
      {
        degrau: 3,
        nome: 'Elevação de calcanhares unilateral com mochila',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 10, max: 15, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 12, max: 15, unidade: 'reps' },
        equipamentoNecessario: ['mochila'],
        dicaExecucao: 'Subida firme, pausa de 1 segundo no topo e descida em 3 segundos.',
      },
    ],
  },

  core: {
    id: 'core',
    nome: 'Core (Anti-extensão, Anti-rotação e Flexão)',
    grupo: 'Core',
    descricaoMeta: 'Estabilidade real da coluna: pelve encaixada e respiração contínua sob tensão.',
    degraus: [
      {
        degrau: 1,
        nome: 'Dead bug / Prancha de joelhos',
        categoriaCore: 'Flexão de quadril',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 8, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Mantenha a lombar colada no chão o tempo todo enquanto estende braço e perna opostos.',
      },
      {
        degrau: 2,
        nome: 'Prancha completa (antebraços) + Bird-dog',
        categoriaCore: 'Anti-extensão',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 25, max: 45, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 20, max: 40, unidade: 's' },
        dicaExecucao: 'Glúteos contraídos, costelas fechadas e ombros empurrando o chão — não prenda a respiração.',
      },
      {
        degrau: 3,
        nome: 'Hollow body hold + Prancha lateral',
        categoriaCore: 'Base Hollow',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 20, max: 35, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 20, max: 30, unidade: 's' },
        dicaExecucao: 'Lombar pressionada contra o solo; se a lombar descolar, flexione um pouco os joelhos.',
      },
      {
        degrau: 4,
        nome: 'Elevação de joelhos / Rollout deslizante com toalha',
        categoriaCore: 'Anti-extensão',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 8, max: 12, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Controle o retorno sem balançar o corpo; interrompa antes da lombar arquear.',
      },
      {
        degrau: 5,
        nome: 'Elevação de pernas (deitado ou suspenso)',
        categoriaCore: 'Flexão de quadril',
        tipoMedida: 'reps',
        faixaSugeridaForca: { min: 6, max: 10, unidade: 'reps' },
        faixaSugeridaHipertrofia: { min: 8, max: 12, unidade: 'reps' },
        dicaExecucao: 'Suba sem impulso e controle a descida até o limite onde a lombar continua firme.',
      },
      {
        degrau: 6,
        nome: 'L-sit (progressão: um pé → tuck → completo)',
        categoriaCore: 'Flexão de quadril',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 10, max: 20, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 15, max: 25, unidade: 's' },
        dicaExecucao: 'Empurre os ombros para baixo (depressão escapular) usando o chão ou parallettes.',
      },
    ],
  },

  habilidades: {
    id: 'habilidades',
    nome: 'Habilidades (Base Sólida)',
    grupo: 'Habilidades',
    descricaoMeta: 'Somente após base sólida. Volume baixo, descanso longo (2–3 min) e nunca até falhar.',
    degraus: [
      {
        degrau: 1,
        nome: 'Parada de mão encostada na parede (peito ou costas na parede)',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 15, max: 30, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 15, max: 30, unidade: 's' },
        riscoAlto: true,
        dicaExecucao: 'Aqueça bem os punhos. Empurre o chão ativamente e desça antes de perder o controle.',
      },
      {
        degrau: 2,
        nome: 'L-sit tuck (no chão ou em parallettes)',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 10, max: 20, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 10, max: 20, unidade: 's' },
        dicaExecucao: 'Braços completamente travados, ombros longe das orelhas e joelhos juntos ao peito.',
      },
      {
        degrau: 3,
        nome: 'Front lever (tuck → advanced tuck)',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 8, max: 15, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 8, max: 15, unidade: 's' },
        equipamentoNecessario: ['barra_fixa'],
        riscoAlto: true,
        dicaExecucao: 'Braços retos, costas paralelas ao chão e escápulas ativas. Pare assim que o quadril cair.',
      },
      {
        degrau: 4,
        nome: 'Planche (planche lean → tuck planche)',
        tipoMedida: 'tempo',
        faixaSugeridaForca: { min: 10, max: 20, unidade: 's' },
        faixaSugeridaHipertrofia: { min: 10, max: 20, unidade: 's' },
        riscoAlto: true,
        dicaExecucao: 'Cotovelos estendidos, protração escapular forte e inclinação gradual sobre os punhos.',
      },
    ],
  },
};

export const HOME_EQUIPMENT_GUIDES: HomeEquipmentGuide[] = [
  {
    item: 'Mochila com livros ou garrafas',
    uso: 'Carga extra ajustável para agachamento, flexão, remada curvada, stiff e panturrilha.',
    cuidadoSeguranca: 'Ajuste bem as alças para o peso não balançar nem puxar os ombros para trás.',
  },
  {
    item: 'Mesa robusta',
    uso: 'Excelente para remada invertida (puxar horizontal) e flexão inclinada.',
    cuidadoSeguranca: 'Teste a estabilidade antes de puxar; posicione o corpo sob o centro de apoio para não tombar.',
  },
  {
    item: 'Toalha resistente',
    uso: 'Remada presa na porta, deslizamentos de posterior de coxa e rollout de core no piso liso.',
    cuidadoSeguranca: 'Na porta, dê um nó grosso do lado oposto, feche no sentido que trava no batente e teste antes.',
  },
  {
    item: 'Garrafas ou galões d’água',
    uso: 'Halteres improvisados para stiff unilateral, remada unilateral ou elevações.',
    cuidadoSeguranca: 'Tampe bem e verifique a pegada para evitar escorregar.',
  },
  {
    item: 'Elástico de resistência',
    uso: 'Assistência progressiva na barra fixa/paralelas ou carga extra em flexões e remadas.',
    cuidadoSeguranca: 'Inspecione rachaduras na borracha antes de tensionar.',
  },
  {
    item: 'Barra de porta ou parede',
    uso: 'Desbloqueia toda a escada de puxar vertical (hang, negativas, barra completa, elevação de pernas).',
    cuidadoSeguranca: 'Verifique a capacidade de peso e compatibilidade do batente; teste com carga gradual antes de suspender os pés.',
  },
  {
    item: 'Paralelas portáteis (parallettes)',
    uso: 'Flexões mais profundas, L-sit, mergulhos e alívio de extensão excessiva nos punhos.',
    cuidadoSeguranca: 'Apoie sobre tapete ou superfície antiderrapante.',
  },
];

export const TECHNIQUE_GUIDES: TechniqueGuide[] = [
  {
    id: 'tech-flexao',
    exercicio: 'Flexão (todas as variações)',
    patternId: 'empurrar_horizontal',
    pontosChave: {
      alinhamento: 'Corpo em linha reta da cabeça aos tornozelos (ou joelhos). Glúteos e abdômen firmes.',
      escapulas: 'Deixe as escápulas se aproximarem na descida e protraírem suavemente no topo.',
      respiracao: 'Inspire na descida controlada e expire ao empurrar o chão.',
      amplitudeETempo: 'Peito próximo ao apoio, cotovelos em ~45° (não abertos em 90°), descida em 2–3s.',
    },
    errosComuns: [
      {
        erro: 'Lombar caindo (quadril afundando no meio da série)',
        correcaoPrioritaria: 'Contraia glúteos e encaixe a pelve como numa prancha; se persistir, eleve as mãos em uma mesa (regressão).',
      },
      {
        erro: 'Cotovelos muito abertos (90°) sobrecarregando o ombro',
        correcaoPrioritaria: 'Gire levemente as mãos para fora ("parafusar o chão") e aponte os cotovelos a ~45° para trás.',
      },
    ],
    regressaoSegura: 'Flexão inclinada em mesa/bancada firme (reduz carga mantendo o mesmo alinhamento de prancha).',
  },
  {
    id: 'tech-barra',
    exercicio: 'Barra Fixa e Remada Invertida',
    patternId: 'puxar_vertical',
    pontosChave: {
      alinhamento: 'Tronco rígido (hollow leve), sem chutar pernas para ganhar impulso.',
      escapulas: 'Inicie toda repetição puxando as escápulas para baixo e para trás (ombros longe das orelhas).',
      respiracao: 'Expire na puxada (subida) e inspire na descida controlada.',
      amplitudeETempo: 'Desça até estender os cotovelos (sem despencar) e leve o peito na direção da barra/mesa.',
    },
    errosComuns: [
      {
        erro: 'Ombros subindo na direção das orelhas no topo da barra',
        correcaoPrioritaria: 'Antes de dobrar o cotovelo, faça uma retração/depressão escapular (scapular pull) pensando em guardar os ombros no bolso de trás.',
      },
      {
        erro: 'Meia repetição sem controle na descida',
        correcaoPrioritaria: 'Volte um degrau para barra negativa (descida em 3–5s) ou remada invertida com pausa de 1s no topo.',
      },
    ],
    regressaoSegura: 'Hang ativo + barra negativa (3–5s) ou remada invertida com joelhos flexionados.',
  },
  {
    id: 'tech-agachamento',
    exercicio: 'Agachamento Livre e Búlgaro',
    patternId: 'agachar',
    pontosChave: {
      alinhamento: 'Joelhos acompanham a linha da ponta dos pés; pé inteiro firme no solo (tripé do pé).',
      escapulas: 'Peito aberto sem hiperestender a lombar; braços à frente ajudam no equilíbrio.',
      respiracao: 'Inspire antes de descer criando pressão abdominal e expire ao finalizar a subida.',
      amplitudeETempo: 'Desça até a profundidade confortável sem perder a lombar neutra; 2–3s na descida.',
    },
    errosComuns: [
      {
        erro: 'Joelho colapsando para dentro (valgo dinâmico)',
        correcaoPrioritaria: 'Pense em "abrir o chão" com os pés e direcionar os joelhos sobre o 2º e 3º dedo durante subida e descida.',
      },
      {
        erro: 'Calcanhar levantando do chão no fundo do agachamento',
        correcaoPrioritaria: 'Use um livro fino/tapete dobrado sob os calcanhares temporariamente e pratique mobilidade de tornozelo no aquecimento.',
      },
    ],
    regressaoSegura: 'Agachamento com apoio na cadeira (sentar e levantar com controle).',
  },
  {
    id: 'tech-pike',
    exercicio: 'Pike Push-up e Parada de Mão',
    patternId: 'empurrar_vertical',
    pontosChave: {
      alinhamento: 'Quadril alto e peso projetado à frente das mãos — a cabeça toca à frente da linha dos dedos, não entre as mãos.',
      escapulas: 'No topo da empurrada, eleve as escápulas empurrando o chão com força.',
      respiracao: 'Inspire descendo e expire firme ao empurrar; nunca prenda o ar em isometria invertida.',
      amplitudeETempo: 'Descida controlada (2–3s) e pausa leve antes de subir.',
    },
    errosComuns: [
      {
        erro: 'Cabeça descendo entre as mãos (vira meia flexão horizontal)',
        correcaoPrioritaria: 'Forme um triângulo no chão: mãos na base e topo da cabeça tocando um palmo à frente.',
      },
      {
        erro: 'Desconforto nos punhos por extensão excessiva',
        correcaoPrioritaria: 'Aqueça punhos por 2 min antes e use parallettes ou mãos levemente giradas para fora.',
      },
    ],
    regressaoSegura: 'Pike push-up com joelhos levemente flexionados e menor inclinação.',
  },
  {
    id: 'tech-core',
    exercicio: 'Prancha, Dead Bug e Hollow Hold',
    patternId: 'core',
    pontosChave: {
      alinhamento: 'Pelve em leve retroversão ("encaixar o quadril") e costelas apontando para a pelve.',
      escapulas: 'Na prancha, empurre os antebraços contra o chão preenchendo o espaço entre as escápulas.',
      respiracao: 'Respiração curta e contínua mantendo o abdômen firme — jamais segure o ar.',
      amplitudeETempo: 'Encerre a série no momento em que a lombar arquear; qualidade vale mais que segundos extras.',
    },
    errosComuns: [
      {
        erro: 'Lombar descolando do chão no hollow hold ou dead bug',
        correcaoPrioritaria: 'Traga os joelhos mais perto do peito ou eleve mais as pernas até sentir a lombar 100% apoiada no solo.',
      },
      {
        erro: 'Quadril muito alto na prancha para aliviar o esforço',
        correcaoPrioritaria: 'Abaixe o quadril até alinhar ombros, pelve e tornozelos e contraia glúteos com intenção.',
      },
    ],
    regressaoSegura: 'Dead bug lento ou prancha com joelhos apoiados mantendo pelve encaixada.',
  },
  {
    id: 'tech-dobradica',
    exercicio: 'Ponte de Glúteo e Stiff Unilateral',
    patternId: 'dobradica_posterior',
    pontosChave: {
      alinhamento: 'Coluna neutra do quadril à cabeça — o movimento acontece exclusivamente na dobradiça do quadril.',
      escapulas: 'Ombros encaixados para trás sem curvar as costas no stiff.',
      respiracao: 'Inspire ao descer/alongar e expire ao contrair glúteos na extensão.',
      amplitudeETempo: 'Pausa de 1s na contração máxima da ponte; descida lenta de 3s no stiff.',
    },
    errosComuns: [
      {
        erro: 'Sentir a lombar em vez do glúteo na ponte',
        correcaoPrioritaria: 'Aproxime um pouco mais os calcanhares, encaixe a pelve antes de subir e pare o quadril na linha dos joelhos (sem hiperestender).',
      },
      {
        erro: 'Quadril abrindo lateralmente no stiff unilateral',
        correcaoPrioritaria: 'Aponte os dois ossos da frente do quadril para o chão e use a ponta dos dedos na parede para equilíbrio.',
      },
    ],
    regressaoSegura: 'Ponte de glúteo bilateral com pausa de 2 segundos no topo.',
  },
];

export const SAFETY_RED_FLAGS: string[] = [
  'Dor aguda, pontada articular persistente ou travamento durante o exercício.',
  'Formigamento, dormência ou irradiação nervosa em braços, mãos, pernas ou pés.',
  'Tontura, dor no peito, falta de ar anormal ou sensação de desmaio.',
  'Lesão recente ou recuperação pós-cirúrgica sem liberação médica ou fisioterapêutica.',
];

export const SAFETY_PRACTICAL_RULES: { titulo: string; detalhe: string }[] = [
  {
    titulo: 'Nunca treine através de dor articular',
    detalhe:
      'Cansaço muscular é esperado; dor aguda no ombro, punho, joelho, cotovelo ou lombar é sinal para regredir o exercício ou interromper a sessão.',
  },
  {
    titulo: 'Segurança do equipamento em casa',
    detalhe:
      'Barra de porta só se compatível com o batente e o peso; teste sempre com carga gradual antes de suspender o corpo. Use piso antiderrapante.',
  },
  {
    titulo: 'Treino em apartamento',
    detalhe:
      'Evite saltos se houver vizinhos abaixo: troque por agachamento com tempo lento, passada reversa, prancha lenta e use tapete antiderrapante com meias ou tênis.',
  },
  {
    titulo: 'Relação saudável com treino e alimentação',
    detalhe:
      'Descanso faz parte da evolução — mantenha ao menos 1 dia completo de descanso semanal. Evite culpa ao descansar, compulsão por queimar calorias ou dietas restritivas extremas.',
  },
];
