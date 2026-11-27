import type { MovementPatternId } from './types';

export interface StepByStepPhase {
  fase: string;
  titulo: string;
  detalhe: string;
}

export interface ExerciseVisualGuide {
  patternId: MovementPatternId;
  fotoUrl: string;
  fotoAlt: string;
  legendaFoto: string;
  cadencia: string;
  respiracao: string;
  passosExecucao: StepByStepPhase[];
  pontosAtencao: string[];
  errosEvitar: string[];
  /** Animation phase labels cycled in the interactive motion player */
  fasesAnimacao: {
    fase1: string;
    fase2: string;
    fase3: string;
  };
}

export const EXERCISE_MEDIA: Record<MovementPatternId, ExerciseVisualGuide> = {
  empurrar_horizontal: {
    patternId: 'empurrar_horizontal',
    fotoUrl: '/src/assets/images/demo_push_horizontal_1795742764339.jpg',
    fotoAlt:
      'Demonstração técnica de flexão no chão em tapete antiderrapante com corpo alinhado em linha reta e cotovelos a 45 graus',
    legendaFoto:
      'Observe a linha reta da cabeça aos calcanhares, abdômen firme e mãos alinhadas sob o peito.',
    cadencia: '3s descida · 1s pausa · 1s subida',
    respiracao: 'Inspire descendo · Expire empurrando',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Posição inicial',
        detalhe:
          'Mãos ligeiramente mais largas que os ombros, dedos abertos pressionando o chão e glúteos contraídos.',
      },
      {
        fase: '02',
        titulo: 'Descida controlada (2–3s)',
        detalhe:
          'Dobre os cotovelos apontando cerca de 45° para trás (nunca abertos em T) levando o peito próximo ao apoio.',
      },
      {
        fase: '03',
        titulo: 'Pausa limpa embaixo',
        detalhe:
          'Mantenha o quadril na mesma altura do tronco sem tocar a barriga no chão primeiro.',
      },
      {
        fase: '04',
        titulo: 'Empurrada completa',
        detalhe:
          'Empurre o chão até estender os cotovelos e afastar suavemente as escápulas no topo.',
      },
    ],
    pontosAtencao: [
      'Corpo rígido como prancha do início ao fim',
      'Cotovelos em seta (~45°), protegendo os ombros',
      'Olhar levemente à frente das mãos (pescoço neutro)',
    ],
    errosEvitar: [
      'Lombar caindo ou quadril alto demais durante a série',
      'Descer pela metade sem controle da fase excêntrica',
    ],
    fasesAnimacao: {
      fase1: 'Prancha inicial firme · Escápulas neutras',
      fase2: 'Descida controlada (3s) · Cotovelos a 45°',
      fase3: 'Empurre o chão expirando até o topo',
    },
  },

  empurrar_vertical: {
    patternId: 'empurrar_vertical',
    fotoUrl: '/src/assets/images/demo_push_vertical_1795742764742.jpg',
    fotoAlt:
      'Demonstração técnica de pike push-up com quadril elevado em V invertido e cabeça projetada à frente das mãos',
    legendaFoto:
      'Quadril elevado em V invertido e peso projetado sobre os ombros, formando um triângulo entre mãos e cabeça.',
    cadencia: '2–3s descida · 1s pausa · 1s subida',
    respiracao: 'Inspire descendo · Expire empurrando para cima',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Montagem em V invertido',
        detalhe:
          'Eleve o quadril o máximo possível; se o posterior encurtar, flexione levemente os joelhos para manter as costas retas.',
      },
      {
        fase: '02',
        titulo: 'Descida em triângulo',
        detalhe:
          'Projete o topo da cabeça um palmo à frente da linha das mãos, mantendo os cotovelos fechados para dentro.',
      },
      {
        fase: '03',
        titulo: 'Controle no ponto mais baixo',
        detalhe:
          'Toque suavemente (ou chegue próximo) do chão sem perder o alinhamento dos cotovelos.',
      },
      {
        fase: '04',
        titulo: 'Empurrada vertical',
        detalhe:
          'Empurre o solo para cima e para trás, elevando as escápulas no final do movimento.',
      },
    ],
    pontosAtencao: [
      'Cabeça vai à frente das mãos (forma um triângulo no chão)',
      'Punhos bem aquecidos antes da primeira série',
      'Empurrada completa elevando os ombros no topo',
    ],
    errosEvitar: [
      'Descer a cabeça entre as mãos (transforma em meia flexão horizontal)',
      'Abrir os cotovelos para os lados sobrecarregando ombros',
    ],
    fasesAnimacao: {
      fase1: 'Quadril alto em V invertido · Peso nos ombros',
      fase2: 'Leve a cabeça à frente da linha das mãos',
      fase3: 'Empurre firme estendendo os braços acima da cabeça',
    },
  },

  paralelas_triceps: {
    patternId: 'paralelas_triceps',
    fotoUrl: '/src/assets/images/demo_dips_triceps_1795742766266.jpg',
    fotoAlt:
      'Demonstração técnica de mergulho em banco firme com ombros deprimidos longe das orelhas e cotovelos dobrando para trás',
    legendaFoto:
      'Ombros firmes para baixo (longe das orelhas), peito aberto e descida controlada até cerca de 90° nos cotovelos.',
    cadencia: '2–3s descida · 1s pausa · 1s subida',
    respiracao: 'Inspire descendo · Expire estendendo os braços',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Apoio seguro e ombros baixos',
        detalhe:
          'Apoie as mãos em banco/cadeira firme ou paralelas e empurre os ombros para baixo antes de iniciar.',
      },
      {
        fase: '02',
        titulo: 'Descida moderada',
        detalhe:
          'Flexione os cotovelos apontando para trás, mantendo o tronco próximo ao apoio.',
      },
      {
        fase: '03',
        titulo: 'Amplitude segura (~90°)',
        detalhe:
          'Pare quando o braço ficar paralelo ao chão (ou menos se sentir desconforto anterior no ombro).',
      },
      {
        fase: '04',
        titulo: 'Extensão firme',
        detalhe:
          'Estenda os cotovelos completamente sem deixar os ombros encolherem na direção das orelhas.',
      },
    ],
    pontosAtencao: [
      'Ombros longe das orelhas o tempo todo (depressão escapular)',
      'Cotovelos apontam para trás, nunca abrindo para fora',
      'Teste a estabilidade do banco ou das duas cadeiras antes',
    ],
    errosEvitar: [
      'Descer fundo demais deixando o ombro rodar para frente',
      'Afastar demais o quadril do banco',
    ],
    fasesAnimacao: {
      fase1: 'Braços estendidos · Ombros empurrados para baixo',
      fase2: 'Descida controlada até ~90° no cotovelo',
      fase3: 'Estenda os cotovelos mantendo o peito aberto',
    },
  },

  puxar_horizontal: {
    patternId: 'puxar_horizontal',
    fotoUrl: '/src/assets/images/demo_pull_horizontal_1795742766458.jpg',
    fotoAlt:
      'Demonstração técnica de remada invertida sob mesa resistente com corpo reto e peito puxado até a borda',
    legendaFoto:
      'Corpo alinhado dos calcanhares aos ombros, puxando o peito até a borda da mesa e fechando as escápulas.',
    cadencia: '1s subida · 1s pausa no topo · 2–3s descida',
    respiracao: 'Expire puxando · Inspire descendo controlado',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Teste e posicionamento',
        detalhe:
          'Confirme que a mesa é pesada e firme. Posicione o peito abaixo da borda e contraia glúteos e abdômen.',
      },
      {
        fase: '02',
        titulo: 'Início pelas escápulas',
        detalhe:
          'Aproxime as escápulas para trás e puxe os cotovelos em direção ao tronco.',
      },
      {
        fase: '03',
        titulo: 'Pausa de 1s no topo',
        detalhe:
          'Toque (ou chegue próximo) o peito na borda da mesa mantendo o pescoço neutro.',
      },
      {
        fase: '04',
        titulo: 'Descida sem despencar',
        detalhe:
          'Controle o retorno em 2–3 segundos até estender os braços mantendo a tensão nas costas.',
      },
    ],
    pontosAtencao: [
      'Puxe com as costas (escápulas juntas), não apenas dobrando o bíceps',
      'Quadril alinhado sem deixar o bumbum cair',
      'Joelho flexionado facilita; pernas estendidas aumenta a carga',
    ],
    errosEvitar: [
      'Usar impulso do quadril para subir o peito',
      'Puxar o queixo para frente levando os ombros às orelhas',
    ],
    fasesAnimacao: {
      fase1: 'Braços estendidos · Corpo reto e glúteos firmes',
      fase2: 'Puxe o peito à mesa fechando as escápulas',
      fase3: 'Pausa 1s no topo · Desça devagar em 2–3s',
    },
  },

  puxar_vertical: {
    patternId: 'puxar_vertical',
    fotoUrl: '/src/assets/images/demo_pull_vertical_1795742769439.jpg',
    fotoAlt:
      'Demonstração técnica de barra fixa em barra de porta com escápulas deprimidas, ombros longe das orelhas e tronco firme',
    legendaFoto:
      'Ombros baixos e encaixados, tronco estável sem balanço e puxada limpa levando o peito na direção da barra.',
    cadencia: '1s subida · 1s topo · 3s descida controlada',
    respiracao: 'Expire na puxada · Inspire na descida',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Hang ativo (ativação escapular)',
        detalhe:
          'Com braços estendidos, puxe os ombros para baixo afastando-os das orelhas antes de dobrar os cotovelos.',
      },
      {
        fase: '02',
        titulo: 'Puxada limpa',
        detalhe:
          'Direcione os cotovelos para baixo e leve o peito em direção à barra mantendo pernas firmes (hollow leve).',
      },
      {
        fase: '03',
        titulo: 'Topo controlado',
        detalhe:
          'Passe o queixo da linha da barra sem esticar o pescoço nem dar trancos.',
      },
      {
        fase: '04',
        titulo: 'Descida completa (3s)',
        detalhe:
          'Desça devagar até quase estender totalmente os cotovelos (nas negativas, desça em 3–5 segundos).',
      },
    ],
    pontosAtencao: [
      'Sempre teste a fixação da barra de porta com carga gradual antes',
      'Escápulas deprimidas desde o início da repetição',
      'Sem barra: substitua por toalha na porta, remada com mochila ou superman pull',
    ],
    errosEvitar: [
      'Ombros subindo até as orelhas no topo da puxada',
      'Balançar as pernas (kipping) ou fazer meias repetições',
    ],
    fasesAnimacao: {
      fase1: 'Hang ativo · Escápulas puxadas para baixo',
      fase2: 'Subida limpa · Cotovelos descem para o tronco',
      fase3: 'Descida controlada (3–5s) sem despencar',
    },
  },

  agachar: {
    patternId: 'agachar',
    fotoUrl: '/src/assets/images/demo_squat_legs_1795742770077.jpg',
    fotoAlt:
      'Demonstração técnica de agachamento livre com calcanhares no solo, joelhos alinhados com os pés e coluna neutra',
    legendaFoto:
      'Calcanhares firmes no tapete, joelhos acompanhando a ponta dos pés e tronco ereto com coluna neutra.',
    cadencia: '3s descida · 1–2s pausa · 1s subida',
    respiracao: 'Inspire antes de descer · Expire ao subir',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Base firme (tripé do pé)',
        detalhe:
          'Pés na largura dos ombros ou levemente mais abertos, pontas levemente giradas para fora e peso distribuído no pé inteiro.',
      },
      {
        fase: '02',
        titulo: 'Descida controlada (2–3s)',
        detalhe:
          'Flexione quadril e joelhos ao mesmo tempo, direcionando os joelhos sobre a linha do 2º e 3º dedo do pé.',
      },
      {
        fase: '03',
        titulo: 'Fundo com controle',
        detalhe:
          'Desça até a profundidade confortável mantendo os calcanhares colados no solo e lombar neutra.',
      },
      {
        fase: '04',
        titulo: 'Subida empurrando o chão',
        detalhe:
          'Empurre o piso com os pés inteiros até estender quadris e joelhos sem travar bruscamente.',
      },
    ],
    pontosAtencao: [
      'Joelhos nunca colapsam para dentro (pense em "abrir o chão")',
      'Calcanhares permanecem apoiados durante todo o movimento',
      'Em apartamento: substitua saltos por descida em 3s + pausa de 2s',
    ],
    errosEvitar: [
      'Joelhos caindo para dentro na hora de subir',
      'Tirar os calcanhares do chão ou arredondar demais a lombar',
    ],
    fasesAnimacao: {
      fase1: 'Em pé · Pés firmes e coluna neutra',
      fase2: 'Descida em 3s · Joelhos acompanham os pés',
      fase3: 'Pausa limpa embaixo · Suba empurrando o solo',
    },
  },

  dobradica_posterior: {
    patternId: 'dobradica_posterior',
    fotoUrl: '/src/assets/images/demo_glute_bridge_supine_1795742796732.jpg',
    fotoAlt:
      'Demonstração técnica de ponte de glúteo no tapete com ombros apoiados no chão, braços estendidos e quadril alinhado com joelhos',
    legendaFoto:
      'Cabeça e escápulas apoiadas no tapete, quadril elevado formando linha reta com joelhos e glúteos contraídos sem arquear a lombar.',
    cadencia: '1s subida · 1–2s contração no topo · 2–3s descida',
    respiracao: 'Expire subindo o quadril · Inspire descendo',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Apoio neutro no solo',
        detalhe:
          'Deite de costas com pés apoiados na largura do quadril, calcanhares próximos o suficiente para manter canelas quase verticais.',
      },
      {
        fase: '02',
        titulo: 'Encaixe pélvico e subida',
        detalhe:
          'Empurre o chão pelos calcanhares e eleve o quadril contraindo firmemente os glúteos.',
      },
      {
        fase: '03',
        titulo: 'Pausa isométrica no topo',
        detalhe:
          'Alinhe ombros, quadril e joelhos em linha reta e segure 1–2 segundos sem empurrar a barriga para cima.',
      },
      {
        fase: '04',
        titulo: 'Descida controlada',
        detalhe:
          'Desça devagar tocando levemente o tapete antes de iniciar a próxima repetição.',
      },
    ],
    pontosAtencao: [
      'Sinta glúteos e posterior de coxa — nunca compressão lombar',
      'Na variação unilateral, mantenha os dois lados da pelve nivelados',
      'No stiff unilateral, dobre apenas o quadril mantendo a coluna reta',
    ],
    errosEvitar: [
      'Hiperestender a lombar jogando as costelas para cima',
      'Fazer repetições rápidas sem pausa na contração máxima',
    ],
    fasesAnimacao: {
      fase1: 'Deitado · Calcanhares firmes e pelve encaixada',
      fase2: 'Empurre pelos calcanhares alinhando quadril e joelhos',
      fase3: 'Segure 1–2s no topo · Desça com controle',
    },
  },

  panturrilha: {
    patternId: 'panturrilha',
    fotoUrl: '/src/assets/images/demo_calf_raise_1795742771307.jpg',
    fotoAlt:
      'Demonstração técnica de elevação de calcanhares unilateral em degrau de madeira com apoio leve na parede e extensão completa do tornozelo',
    legendaFoto:
      'Apoio leve dos dedos na parede apenas para equilíbrio, joelho estendido e extensão máxima do calcanhar.',
    cadencia: '1s subida · 1s pausa no topo · 3s descida',
    respiracao: 'Expire subindo · Inspire descendo abaixo do degrau',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Apoio na ponta do pé',
        detalhe:
          'Apoie o antepé em um degrau firme deixando o calcanhar livre; toque levemente a parede apenas para equilíbrio.',
      },
      {
        fase: '02',
        titulo: 'Alongamento controlado',
        detalhe:
          'Desça o calcanhar abaixo da linha do degrau sentindo a panturrilha alongar sem quicar.',
      },
      {
        fase: '03',
        titulo: 'Subida máxima com pausa',
        detalhe:
          'Suba até o ponto mais alto possível empurrando pelo dedão e segure 1 segundo completo.',
      },
      {
        fase: '04',
        titulo: 'Retorno lento (3s)',
        detalhe:
          'Desça devagar em 3 segundos para eliminar o efeito elástico do tendão.',
      },
    ],
    pontosAtencao: [
      'Evite quicar rápido no fundo do movimento',
      'Mantenha o joelho estendido durante toda a série',
      'Progrida de bilateral → unilateral → unilateral com mochila',
    ],
    errosEvitar: [
      'Meia amplitude subindo e descendo em ritmo acelerado',
      'Jogar o peso sobre a parede com o braço de apoio',
    ],
    fasesAnimacao: {
      fase1: 'Calcanhar abaixo do degrau · Alongamento limpo',
      fase2: 'Suba até o topo máximo · Pausa de 1s',
      fase3: 'Descida lenta de 3s sem quicar',
    },
  },

  core: {
    patternId: 'core',
    fotoUrl: '/src/assets/images/demo_core_plank_1795742772085.jpg',
    fotoAlt:
      'Demonstração técnica de prancha de antebraços com alinhamento perfeito de cabeça, tronco, pelve encaixada e pernas',
    legendaFoto:
      'Cotovelos exatamente abaixo dos ombros, pelve encaixada, glúteos firmes e lombar completamente neutra.',
    cadencia: 'Isometria limpa (20–40s) · Respiração contínua',
    respiracao: 'Respiração curta e ritmada (nunca prenda o ar)',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Base dos antebraços',
        detalhe:
          'Posicione os cotovelos diretamente abaixo dos ombros e empurre o chão ativamente com os antebraços.',
      },
      {
        fase: '02',
        titulo: 'Encaixe pélvico (retroversão)',
        detalhe:
          'Contraia glúteos e abdômen trazendo o púbis levemente em direção às costelas.',
      },
      {
        fase: '03',
        titulo: 'Tensão total',
        detalhe:
          'Imagine puxar os cotovelos na direção dos pés sem movê-los — isso multiplica a ativação abdominal.',
      },
      {
        fase: '04',
        titulo: 'Critério de parada',
        detalhe:
          'Encerre a série no instante em que a lombar começar a ceder ou o quadril subir demais.',
      },
    ],
    pontosAtencao: [
      'Qualidade vale mais que tempo extra com lombar arqueada',
      'Respire de forma contínua mantendo o abdômen travado',
      'No dead bug e hollow hold, mantenha a lombar 100% colada no chão',
    ],
    errosEvitar: [
      'Lombar afundando em direção ao solo',
      'Segurar a respiração ou olhar para frente tensionando o pescoço',
    ],
    fasesAnimacao: {
      fase1: 'Cotovelos sob os ombros · Empurre o solo',
      fase2: 'Pelve encaixada e glúteos ativos · Lombar neutra',
      fase3: 'Respiração contínua sob tensão constante',
    },
  },

  habilidades: {
    patternId: 'habilidades',
    fotoUrl: '/src/assets/images/demo_skills_lsit_1795742772981.jpg',
    fotoAlt:
      'Demonstração técnica de L-sit tuck em parallettes de madeira com braços estendidos, ombros empurrados para baixo e joelhos suspensos',
    legendaFoto:
      'Braços completamente travados, ombros empurrados para baixo (depressão escapular) e quadril suspenso com controle.',
    cadencia: 'Isometria técnica (10–25s) · Descanso 2–3 min',
    respiracao: 'Respire curto e constante · Nunca leve até a falha',
    passosExecucao: [
      {
        fase: '01',
        titulo: 'Apoio firme e punhos alinhados',
        detalhe:
          'Aqueça bem os punhos; use parallettes ou o chão firme com braços completamente estendidos.',
      },
      {
        fase: '02',
        titulo: 'Depressão escapular forte',
        detalhe:
          'Empurre as mãos contra o apoio afastando os ombros das orelhas antes de tirar os pés do chão.',
      },
      {
        fase: '03',
        titulo: 'Suspensão limpa',
        detalhe:
          'Eleve joelhos (tuck) ou pernas mantendo a postura compacta, sem dobrar os cotovelos.',
      },
      {
        fase: '04',
        titulo: 'Saída antes da fadiga',
        detalhe:
          'Desça com controle enquanto a forma ainda está 100% limpa e descanse 2–3 minutos completos.',
      },
    ],
    pontosAtencao: [
      'Pratique apenas depois de construir base sólida em empurrar, puxar e core',
      'Volume baixo, foco máximo em qualidade neural e descanso longo',
      'Pare antes da falha técnica — habilidade se treina descansado',
    ],
    errosEvitar: [
      'Ombros encolhidos na direção das orelhas ou cotovelos dobrando',
      'Treinar habilidades no final da sessão completamente exausto',
    ],
    fasesAnimacao: {
      fase1: 'Braços travados · Empurre os ombros para baixo',
      fase2: 'Suspenda o quadril mantendo escápulas deprimidas',
      fase3: 'Sustente com forma limpa · Desça com controle',
    },
  },
};

type VisualOverride = Partial<Omit<ExerciseVisualGuide, 'patternId'>>;

const RUNG_VISUAL_OVERRIDES: Partial<
  Record<MovementPatternId, Record<number, VisualOverride>>
> = {
  dobradica_posterior: {
    2: {
      fotoUrl: '/src/assets/images/demo_glute_bridge_unilateral_1795779196331.jpg',
      fotoAlt:
        'Demonstração técnica de ponte de glúteo unilateral com apenas um pé apoiado no tapete, quadril elevado e a outra perna estendida alinhada com a coxa',
      legendaFoto:
        'Ponte unilateral: apenas um pé apoiado no chão, a outra perna estendida reta na mesma linha da coxa de apoio e pelve totalmente nivelada.',
      cadencia: '1s subida · 1–2s contração no topo · 2–3s descida (por lado)',
      passosExecucao: [
        {
          fase: '01',
          titulo: 'Apoio em uma perna só',
          detalhe:
            'Deite de costas com um pé firme no tapete próximo ao glúteo e estenda a outra perna reta, mantendo os dois joelhos na mesma linha.',
        },
        {
          fase: '02',
          titulo: 'Subida unilateral sem girar o quadril',
          detalhe:
            'Empurre o chão pelo calcanhar da perna de apoio elevando o quadril e mantendo a perna estendida alinhada ao tronco.',
        },
        {
          fase: '03',
          titulo: 'Pausa isométrica nivelada',
          detalhe:
            'Segure 1–2 segundos no topo contraindo fortemente o glúteo da perna de apoio sem deixar o lado livre da pelve cair.',
        },
        {
          fase: '04',
          titulo: 'Retorno controlado e troca de lado',
          detalhe:
            'Desça devagar em 2–3 segundos sem soltar a tensão; complete todas as repetições de um lado antes de trocar a perna.',
        },
      ],
      pontosAtencao: [
        'Mantenha os dois lados da pelve nivelados (sem rodar o quadril para o lado suspenso)',
        'A perna livre fica estendida na linha da coxa de apoio — não chute ela para cima',
        'Empurre pelo calcanhar sentindo glúteo e posterior, nunca dor lombar',
      ],
      errosEvitar: [
        'Deixar o lado sem apoio do quadril cair durante a subida',
        'Arquear a lombar jogando as costelas para o teto',
      ],
      fasesAnimacao: {
        fase1: 'Um pé firme no tapete · Outra perna estendida na linha da coxa',
        fase2: 'Empurre pelo calcanhar de apoio mantendo a pelve nivelada',
        fase3: 'Contraia o glúteo 1–2s no topo · Desça com controle',
      },
    },
    3: {
      fotoUrl: '/src/assets/images/demo_single_leg_rdl_1795779198896.jpg',
      fotoAlt:
        'Demonstração técnica de dobradiça de quadril (hip hinge) com coluna neutra, peito aberto e quadril projetado para trás',
      legendaFoto:
        'Movimento nasce exclusivamente na dobra do quadril (hip hinge), mantendo coluna perfeitamente neutra e posterior de coxa sob tensão.',
      cadencia: '3s descida · 1s alongamento · 1s subida firme',
      respiracao: 'Inspire descendo o tronco · Expire estendendo o quadril',
      passosExecucao: [
        {
          fase: '01',
          titulo: 'Base firme e coluna neutra',
          detalhe:
            'Em pé com pés na largura do quadril, joelhos levemente destravados (~15°) e abdômen travado.',
        },
        {
          fase: '02',
          titulo: 'Empurre o quadril para trás',
          detalhe:
            'Incline o tronco à frente levando o quadril para trás como se fosse fechar uma porta com o glúteo, mantendo as costas retas.',
        },
        {
          fase: '03',
          titulo: 'Alongamento limpo no posterior',
          detalhe:
            'Desça até sentir alongamento forte atrás das coxas sem arredondar a lombar nem dobrar demais os joelhos.',
        },
        {
          fase: '04',
          titulo: 'Extensão forte pelo glúteo',
          detalhe:
            'Empurre o solo com os pés trazendo o quadril de volta à posição ereta e contraindo glúteos no topo.',
        },
      ],
      fasesAnimacao: {
        fase1: 'Em pé · Joelhos destravados e coluna completamente neutra',
        fase2: 'Empurre o quadril para trás descendo o tronco reto em 3s',
        fase3: 'Estenda o quadril contraindo glúteos e posteriores até em pé',
      },
    },
    4: {
      fotoUrl: '/src/assets/images/demo_single_leg_rdl_1795779198896.jpg',
      fotoAlt:
        'Demonstração técnica de stiff unilateral com equilíbrio em uma perna, coluna reta inclinada à frente e perna de trás estendida em linha com o tronco',
      legendaFoto:
        'Stiff unilateral: apoio firme em um pé só, tronco e perna de trás formam uma única linha reta (gangorra) com quadril fechado.',
      cadencia: '3s descida · 1s pausa equilibrada · 1s subida (por lado)',
      respiracao: 'Inspire inclinando o tronco · Expire voltando à vertical',
      passosExecucao: [
        {
          fase: '01',
          titulo: 'Equilíbrio em um pé só',
          detalhe:
            'Apoie o peso inteiro em uma perna com joelho levemente destravado (~15°); fixe o olhar em um ponto à frente no chão.',
        },
        {
          fase: '02',
          titulo: 'Movimento em gangorra',
          detalhe:
            'Incline o tronco reto à frente enquanto a perna de trás sobe estendida na mesma linha da coluna, mantendo os dois quadris apontados para o chão.',
        },
        {
          fase: '03',
          titulo: 'Ponto máximo de alongamento',
          detalhe:
            'Pare quando tronco e perna traseira estiverem quase paralelos ao chão sentindo o posterior da perna de apoio trabalhar.',
        },
        {
          fase: '04',
          titulo: 'Subida limpa pelo quadril',
          detalhe:
            'Empurre o chão com o pé de apoio trazendo o quadril de volta à vertical com controle; repita do outro lado.',
        },
      ],
      pontosAtencao: [
        'Mantenha o quadril fechado (evite abrir a ponta do pé de trás para fora)',
        'Coluna neutra do início ao fim — pense em uma gangorra rígida',
        'Se perder o equilíbrio, toque levemente a ponta dos dedos na parede',
      ],
      fasesAnimacao: {
        fase1: 'Equilíbrio em um pé · Joelho de apoio levemente destravado',
        fase2: 'Desça o tronco reto elevando a perna de trás em linha reta',
        fase3: 'Empurre o solo pelo calcanhar voltando à vertical com controle',
      },
    },
  },

  panturrilha: {
    1: {
      fotoUrl: '/src/assets/images/demo_calf_raise_bilateral_1795779199501.jpg',
      fotoAlt:
        'Demonstração técnica de elevação de calcanhares bilateral em degrau de madeira com os dois pés apoiados lado a lado e extensão máxima',
      legendaFoto:
        'Variação bilateral: ambos os antepés apoiados lado a lado na borda do degrau, apoio leve na parede e amplitude total.',
      passosExecucao: [
        {
          fase: '01',
          titulo: 'Os dois pés na borda do degrau',
          detalhe:
            'Apoie a ponta dos dois pés lado a lado no degrau deixando ambos os calcanhares livres; toque levemente a parede só para equilíbrio.',
        },
        {
          fase: '02',
          titulo: 'Alongamento bilateral completo',
          detalhe:
            'Desça os dois calcanhares abaixo da linha do degrau de forma controlada, sem quicar no fundo.',
        },
        {
          fase: '03',
          titulo: 'Subida máxima com pausa',
          detalhe:
            'Suba o mais alto possível empurrando igualmente com os dois pés e segure 1 segundo no topo.',
        },
        {
          fase: '04',
          titulo: 'Descida lenta (3s)',
          detalhe:
            'Controle o retorno em 3 segundos mantendo joelhos estendidos e tornozelos alinhados.',
        },
      ],
      fasesAnimacao: {
        fase1: 'Dois pés no degrau · Calcanhares baixos alongando',
        fase2: 'Suba ao máximo na ponta dos dois pés · Pausa 1s',
        fase3: 'Desça devagar em 3s sem quicar no fundo',
      },
    },
    2: {
      fotoUrl: '/src/assets/images/demo_calf_raise_1795742771307.jpg',
      fotoAlt:
        'Demonstração técnica de elevação de calcanhares unilateral em degrau com apenas um pé apoiado e a outra perna recolhida atrás',
      legendaFoto:
        'Variação unilateral: apenas um pé apoiado no degrau, outra perna flexionada atrás e extensão máxima do tornozelo.',
      fasesAnimacao: {
        fase1: 'Apoio em um pé no degrau · Outra perna recolhida atrás',
        fase2: 'Subida máxima unilateral · Pausa de 1s no topo',
        fase3: 'Descida lenta em 3s controlando o alongamento',
      },
    },
    3: {
      fotoUrl: '/src/assets/images/demo_calf_raise_1795742771307.jpg',
      fotoAlt:
        'Demonstração técnica de elevação de calcanhares unilateral em degrau com carga adicional em mochila',
      legendaFoto:
        'Variação unilateral com mochila: um pé apoiado no degrau, mochila justa nas costas e controle lento na descida.',
      fasesAnimacao: {
        fase1: 'Um pé no degrau com carga · Calcanhar abaixo da borda',
        fase2: 'Subida firme unilateral · Pausa 1s no topo',
        fase3: 'Retorno em 3s mantendo tornozelo alinhado',
      },
    },
  },

  agachar: {
    4: {
      fotoUrl: '/src/assets/images/demo_bulgarian_split_squat_1795779201206.jpg',
      fotoAlt:
        'Demonstração técnica de agachamento búlgaro com pé de trás apoiado em banco firme, tronco estável e joelho da frente alinhado com o pé',
      legendaFoto:
        'Agachamento búlgaro: pé de trás apoiado em banco ou cadeira firme, maior parte do peso na perna da frente e descida vertical limpa.',
      cadencia: '3s descida · 1s pausa embaixo · 1s subida (por lado)',
      passosExecucao: [
        {
          fase: '01',
          titulo: 'Ajuste de distância do banco',
          detalhe:
            'Apoie o peito do pé de trás sobre um banco, cadeira ou sofá firme e posicione o pé da frente em base confortável e estável.',
        },
        {
          fase: '02',
          titulo: 'Descida vertical controlada (3s)',
          detalhe:
            'Flexione o joelho da frente descendo o quadril quase na vertical com leve inclinação natural do tronco à frente.',
        },
        {
          fase: '03',
          titulo: 'Fundo estável sem colapsar o joelho',
          detalhe:
            'Mantenha o joelho da frente alinhado com o 2º–3º dedo do pé e o calcanhar da frente 100% colado no chão.',
        },
        {
          fase: '04',
          titulo: 'Subida empurrando pela perna da frente',
          detalhe:
            'Empurre o solo com o pé inteiro da frente (o pé de trás serve apenas para equilíbrio) até quase estender o joelho.',
        },
      ],
      pontosAtencao: [
        '80–90% do peso fica na perna da frente; o banco apenas estabiliza',
        'Evite deixar o joelho da frente cair para dentro durante a subida',
        'Complete todas as repetições de um lado antes de trocar de perna',
      ],
      fasesAnimacao: {
        fase1: 'Pé de trás no banco · Peso firme na perna da frente',
        fase2: 'Desça o quadril controlado em 3s mantendo joelho alinhado',
        fase3: 'Empurre o solo pela perna da frente até subir com controle',
      },
    },
    6: {
      fasesAnimacao: {
        fase1: 'Equilíbrio em um pé · Outra perna estendida à frente',
        fase2: 'Desça controlado em uma perna com braços à frente',
        fase3: 'Empurre o chão com o pé inteiro mantendo o joelho firme',
      },
    },
  },

  empurrar_horizontal: {
    1: {
      fasesAnimacao: {
        fase1: 'Corpo inclinado em linha reta · Mãos apoiadas com firmeza',
        fase2: 'Descida controlada levando o peito à borda · Cotovelos a 45°',
        fase3: 'Empurre firme mantendo glúteos e abdômen contraídos',
      },
    },
    2: {
      fasesAnimacao: {
        fase1: 'Mãos firmes no banco/mesa · Corpo reto em prancha inclinada',
        fase2: 'Desça o peito até próximo da borda com cotovelos a 45°',
        fase3: 'Empurre expirando até estender os braços no topo',
      },
    },
    3: {
      fasesAnimacao: {
        fase1: 'Joelhos firmes no tapete · Linha reta dos joelhos aos ombros',
        fase2: 'Descida controlada (3s) levando o peito ao chão · Cotovelos 45°',
        fase3: 'Empurre o solo sem deixar o quadril para trás',
      },
    },
    6: {
      fasesAnimacao: {
        fase1: 'Mãos próximas sob o esterno formando diamante · Core travado',
        fase2: 'Desça controlado mantendo cotovelos rente ao tronco',
        fase3: 'Empurre forte estendendo o tríceps até o topo',
      },
    },
  },

  core: {
    1: {
      cadencia: '2s extensão · 1s pausa · 2s retorno (alternando lados)',
      respiracao: 'Expire estendendo braço e perna · Inspire ao voltar',
      fasesAnimacao: {
        fase1: 'Deitado · Lombar colada no tapete, quadris e joelhos a 90°',
        fase2: 'Estenda braço e perna opostos sem descolar a lombar do chão',
        fase3: 'Retorne ao centro controlado e alterne o lado',
      },
    },
    3: {
      cadencia: 'Isometria limpa (20–30s) · Lombar 100% no chão',
      fasesAnimacao: {
        fase1: 'Deitado · Pressione a lombar contra o tapete e recolha costelas',
        fase2: 'Estenda braços atrás e pernas baixas mantendo a tensão total',
        fase3: 'Respire curto e contínuo sem deixar a lombar arquear',
      },
    },
    4: {
      cadencia: '1s subida · 1s controle · 3s descida limpa',
      fasesAnimacao: {
        fase1: 'Deitado de costas · Lombar firme no tapete',
        fase2: 'Eleve as pernas sem impulso mantendo abdômen contraído',
        fase3: 'Desça devagar em 3s parando antes da lombar descolar',
      },
    },
    5: {
      cadencia: '1s subida · 1s controle · 3s descida limpa',
      fasesAnimacao: {
        fase1: 'Deitado de costas · Lombar pressionada no tapete',
        fase2: 'Eleve as pernas estendidas até próximo da vertical',
        fase3: 'Desça devagar em 3s sem balançar nem arquear a lombar',
      },
    },
  },
};

export function getExerciseVisualGuide(
  patternId: MovementPatternId,
  rung?: number
): ExerciseVisualGuide {
  const base = EXERCISE_MEDIA[patternId];
  if (!rung) return base;
  const override = RUNG_VISUAL_OVERRIDES[patternId]?.[rung];
  if (!override) return base;
  return {
    ...base,
    ...override,
  };
}
