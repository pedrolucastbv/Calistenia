import { clamp, computeAthleticPhase, isPullOrRisePattern, lerp } from './biomechanicsRig';
import type { MovementPatternId } from './types';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type MuscleGroupId =
  | 'pectorals'
  | 'delts'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'lats'
  | 'abs'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves';

export interface MuscleActivationProfile {
  primary: MuscleGroupId[];
  secondary: MuscleGroupId[];
  primaryLabelPt: string;
  secondaryLabelPt: string;
}

/**
 * GymVisual-style anatomical muscle activation map per movement pattern.
 * Primary movers highlight in deep anatomical crimson red; synergists in warm coral.
 */
export const MUSCLE_ACTIVATION_MAP: Record<MovementPatternId, MuscleActivationProfile> = {
  empurrar_horizontal: {
    primary: ['pectorals', 'triceps'],
    secondary: ['delts', 'abs'],
    primaryLabelPt: 'Peitoral, Tríceps',
    secondaryLabelPt: 'Deltóide anterior, Core',
  },
  empurrar_vertical: {
    primary: ['delts', 'triceps'],
    secondary: ['pectorals', 'abs'],
    primaryLabelPt: 'Ombros (Deltóides), Tríceps',
    secondaryLabelPt: 'Peitoral superior, Core',
  },
  paralelas_triceps: {
    primary: ['triceps'],
    secondary: ['pectorals', 'delts'],
    primaryLabelPt: 'Tríceps braquial',
    secondaryLabelPt: 'Peitoral inferior, Deltóide anterior',
  },
  puxar_horizontal: {
    primary: ['lats', 'biceps'],
    secondary: ['delts', 'forearms', 'abs'],
    primaryLabelPt: 'Costas (Dorsais e Romboides), Bíceps',
    secondaryLabelPt: 'Deltóide posterior, Antebraços, Core',
  },
  puxar_vertical: {
    primary: ['lats', 'biceps'],
    secondary: ['forearms', 'abs'],
    primaryLabelPt: 'Latíssimo do dorso (Dorsais), Bíceps',
    secondaryLabelPt: 'Antebraços, Core',
  },
  agachar: {
    primary: ['quads', 'glutes'],
    secondary: ['hamstrings', 'calves', 'abs'],
    primaryLabelPt: 'Quadríceps, Glúteos',
    secondaryLabelPt: 'Posteriores, Panturrilhas, Core',
  },
  dobradica_posterior: {
    primary: ['glutes', 'hamstrings'],
    secondary: ['abs', 'quads'],
    primaryLabelPt: 'Glúteos, Posteriores de coxa',
    secondaryLabelPt: 'Core, Estabilizadores lombares',
  },
  panturrilha: {
    primary: ['calves'],
    secondary: ['quads'],
    primaryLabelPt: 'Panturrilhas (Gastrocnêmio e Sóleo)',
    secondaryLabelPt: 'Estabilizadores da perna',
  },
  core: {
    primary: ['abs'],
    secondary: ['glutes', 'delts', 'quads'],
    primaryLabelPt: 'Abdômen (Reto e Oblíquos)',
    secondaryLabelPt: 'Glúteos, Ombros, Quadríceps',
  },
  habilidades: {
    primary: ['abs', 'quads', 'triceps'],
    secondary: ['delts', 'lats'],
    primaryLabelPt: 'Abdômen, Flexores de quadril, Tríceps',
    secondaryLabelPt: 'Ombros (depressão escapular), Dorsais',
  },
};

/**
 * Standard athletic human 3D proportions in meters (~1.76m total standing height).
 * All bone solvers preserve these exact segment lengths across every frame.
 */
export const BODY_3D = {
  ankleH: 0.08,
  shin: 0.43,
  thigh: 0.44,
  torso: 0.52,
  neck: 0.09,
  headR: 0.105,
  upperArm: 0.30,
  forearm: 0.27,
  hand: 0.09,
  footLen: 0.23,
  shoulderHalfW: 0.205,
  hipHalfW: 0.105,
  matY: 0.016,
} as const;

export interface SideArm3D {
  shoulder: Vec3;
  elbow: Vec3;
  wrist: Vec3;
  handTip: Vec3;
}

export interface SideLeg3D {
  hip: Vec3;
  knee: Vec3;
  ankle: Vec3;
  heel: Vec3;
  toe: Vec3;
}

export interface ObjectVariationOption {
  id: string;
  label: string;
  shortLabel: string;
  objectLabel: string;
  setupTip: string;
  safetyNote: string;
  phaseCues: [string, string, string];
}

/**
 * 3 household object / zero-equipment variations for every movement pattern
 * that relies on furniture or external equipment at home.
 */
export const OBJECT_VARIATIONS_BY_PATTERN: Partial<
  Record<MovementPatternId, readonly ObjectVariationOption[]>
> = {
  puxar_horizontal: [
    {
      id: 'mesa',
      label: 'Mesa resistente (Remada invertida)',
      shortLabel: 'Mesa firme',
      objectLabel: 'Mesa de jantar ou bancada pesada',
      setupTip:
        'Posicione o peito sob a borda da mesa, pés firmes no chão e puxe o tronco em bloco até aproximar o peito.',
      safetyNote: 'Teste o peso da mesa antes — nunca use mesas leves ou de vidro.',
      phaseCues: [
        'Braços estendidos sob a mesa · Corpo reto e glúteos firmes',
        'Puxe o peito até a borda fechando as escápulas',
        'Pausa 1s no topo · Desça devagar em 2–3s',
      ],
    },
    {
      id: 'toalha_porta',
      label: 'Toalha na porta (Remada inclinada)',
      shortLabel: 'Toalha na porta',
      objectLabel: 'Toalha de banho grossa presa no batente',
      setupTip:
        'Dê um nó firme no centro da toalha, prenda do lado oposto da porta fechada (puxe contra o batente) e incline o corpo para trás.',
      safetyNote: 'Tranque a porta e puxe sempre no sentido em que ela fecha no batente.',
      phaseCues: [
        'Corpo inclinado para trás · Toalha bem tensionada',
        'Puxe o peito em direção às mãos trazendo cotovelos rente às costelas',
        'Segure 1s contraindo as costas · Retorne controlado',
      ],
    },
    {
      id: 'mochila',
      label: 'Mochila carregada (Remada curvada)',
      shortLabel: 'Mochila',
      objectLabel: 'Mochila resistente com livros ou garrafas de água',
      setupTip:
        'Incline o tronco a ~45° mantendo coluna neutra e joelhos destravados; segure as alças firmes e reme a mochila até a linha da cintura.',
      safetyNote: 'Distribua o peso uniforme dentro da mochila e evite arredondar a lombar.',
      phaseCues: [
        'Tronco inclinado em dobradiça · Coluna neutra e braços estendidos',
        'Puxe a mochila em direção ao umbigo fechando as escápulas',
        'Pausa 1s no topo · Controle a descida sem soltar os ombros',
      ],
    },
  ],
  puxar_vertical: [
    {
      id: 'barra_porta',
      label: 'Barra fixa de porta',
      shortLabel: 'Barra de porta',
      objectLabel: 'Barra fixa instalada no batente',
      setupTip:
        'Inicie sempre pelo hang ativo (ombros para baixo longe das orelhas) e puxe o peito em direção à barra sem balançar.',
      safetyNote: 'Verifique fixação no batente com carga gradual antes de suspender os pés.',
      phaseCues: [
        'Hang ativo · Escápulas deprimidas e abdômen firme',
        'Puxe cotovelos para baixo levando o queixo acima da barra',
        'Pausa 1s no topo · Desça devagar em 3s',
      ],
    },
    {
      id: 'toalha_alta',
      label: 'Toalha alta na porta (Puxada diagonal)',
      shortLabel: 'Toalha alta',
      objectLabel: 'Toalha longa ou elástico preso no topo da porta',
      setupTip:
        'Prenda a toalha no topo da porta fechada, agache inclinado para trás com braços estendidos acima da cabeça e puxe o peito em direção às mãos.',
      safetyNote: 'Puxe apenas contra o batente fechado com porta trancada e chão antiderrapante.',
      phaseCues: [
        'Braços estendidos acima da cabeça · Dorsal alongada',
        'Puxe os cotovelos para baixo e para trás aproximando o peito',
        'Contraia as escápulas no topo · Retorne em 2–3s',
      ],
    },
    {
      id: 'superman_chao',
      label: 'Sem equipamento (Superman pull no chão)',
      shortLabel: 'Sem objeto (chão)',
      objectLabel: 'Apenas tapete no chão',
      setupTip:
        'Deite de barriga para baixo, eleve levemente o peito e deslize os braços de cima da cabeça (Y) para um W apertando as escápulas.',
      safetyNote: 'Mantenha o olhar voltado para o tapete (pescoço neutro) e glúteos contraídos.',
      phaseCues: [
        'Deitado de bruços · Braços estendidos à frente sem tocar o chão',
        'Puxe cotovelos em W para trás espremendo as dorsais',
        'Sustente 1–2s na contração · Estenda controlado à frente',
      ],
    },
  ],
  paralelas_triceps: [
    {
      id: 'banco',
      label: 'Banco ou sofá firme (Mergulho)',
      shortLabel: 'Banco / sofá',
      objectLabel: 'Banco estável, cadeira pesada ou borda de sofá firme',
      setupTip:
        'Apoie as mãos na borda atrás do quadril, ombros baixos e peito aberto; desça até ~90° no cotovelo mantendo as costas próximas ao apoio.',
      safetyNote: 'Evite descer fundo demais se sentir pressão na parte frontal do ombro.',
      phaseCues: [
        'Braços estendidos · Ombros empurrados para baixo',
        'Descida controlada até ~90° nos cotovelos apontando para trás',
        'Estenda os cotovelos expirando com peito aberto',
      ],
    },
    {
      id: 'duas_cadeiras',
      label: 'Duas cadeiras firmes (Paralelas)',
      shortLabel: 'Duas cadeiras',
      objectLabel: 'Duas cadeiras pesadas posicionadas em paralelo',
      setupTip:
        'Coloque duas cadeiras idênticas e firmes lado a lado (encostos voltados para dentro), apoie as mãos nos topos e faça o mergulho com joelhos dobrados.',
      safetyNote: 'Apoie as cadeiras sobre tapete antiderrapante ou encoste em móveis pesados para não deslizarem.',
      phaseCues: [
        'Apoio firme entre as cadeiras · Ombros baixos e joelhos flexionados',
        'Desça na vertical com cotovelos fechados até ~90°',
        'Empurre firme para cima travando suavemente no topo',
      ],
    },
    {
      id: 'mesa_triceps',
      label: 'Borda da mesa (Extensão inclinada)',
      shortLabel: 'Borda da mesa',
      objectLabel: 'Mesa ou bancada firme na altura do quadril',
      setupTip:
        'Apoie as mãos na borda da mesa em prancha inclinada, dobre apenas os cotovelos levando a testa próxima à borda e estenda forte o tríceps.',
      safetyNote: 'Mantenha o abdômen travado para a lombar não ceder durante a descida.',
      phaseCues: [
        'Prancha inclinada firme na mesa · Corpo em linha reta',
        'Flexione os cotovelos descendo a testa controlada até a borda',
        'Estenda os braços isolando o tríceps sem abrir os cotovelos',
      ],
    },
  ],
  panturrilha: [
    {
      id: 'degrau',
      label: 'Degrau ou escada',
      shortLabel: 'Degrau',
      objectLabel: 'Degrau firme + parede para equilíbrio',
      setupTip:
        'Apoie apenas a ponta dos pés na borda do degrau, desça o calcanhar para alongar bem e suba ao máximo com pausa de 1s no topo.',
      safetyNote: 'Use a ponta dos dedos na parede apenas para equilíbrio, sem puxar o corpo.',
      phaseCues: [
        'Calcanhar abaixo da linha do degrau · Alongamento controlado',
        'Suba o máximo possível na ponta dos pés sem balançar',
        'Pausa 1s no topo · Desça devagar em 2–3s',
      ],
    },
    {
      id: 'livros',
      label: 'Pilha de livros grossos',
      shortLabel: 'Livros grossos',
      objectLabel: '2 a 3 livros de capa dura empilhados junto à parede',
      setupTip:
        'Empilhe livros largos e pesados bem encostados no rodapé da parede para não escorregarem e faça toda a amplitude de descida e subida.',
      safetyNote: 'Prefira livros grandes sobre tapete fino ou piso não escorregadio.',
      phaseCues: [
        'Ponta dos pés firme nos livros · Calcanhares baixos',
        'Eleve os calcanhares ao máximo mantendo joelhos estáveis',
        'Segure 1s no topo · Controle a volta até quase tocar o piso',
      ],
    },
    {
      id: 'chao_unilateral',
      label: 'Sem objeto (Unilateral no chão)',
      shortLabel: 'Sem objeto (chão)',
      objectLabel: 'Apenas chão + mão leve na parede',
      setupTip:
        'Dobre uma perna atrás do corpo e eleve o calcanhar da perna de apoio o mais alto possível direto no chão, dobrando a carga em cada lado.',
      safetyNote: 'Mantenha o tornozelo alinhado (evite deixar o peso cair para fora do pé).',
      phaseCues: [
        'Apoio em um pé só no chão · Outra perna recolhida atrás',
        'Empurre forte a ponta do pé elevando o calcanhar ao máximo',
        'Pausa 1–2s no pico · Desça lento sem descansar o calcanhar',
      ],
    },
  ],
  habilidades: [
    {
      id: 'parallettes',
      label: 'Parallettes de madeira',
      shortLabel: 'Parallettes',
      objectLabel: 'Par de parallettes baixas',
      setupTip:
        'Segure as alças com punhos neutros, empurre os ombros forte para baixo e recolha os joelhos ao peito tirando todo o quadril do chão.',
      safetyNote: 'Mantenha as parallettes firmes sobre o tapete antiderrapante.',
      phaseCues: [
        'Mãos firmes nas parallettes · Ombros deprimidos longe das orelhas',
        'Empurre o apoio para baixo elevando quadril e joelhos juntos',
        'Sustente a isometria respirando curto e contínuo',
      ],
    },
    {
      id: 'livros_blocos',
      label: 'Duas pilhas de livros (Blocos)',
      shortLabel: 'Pilhas de livros',
      objectLabel: 'Duas pilhas iguais de livros grossos ou blocos de yoga',
      setupTip:
        'Posicione duas pilhas da mesma altura ao lado do quadril para ganhar espaço livre abaixo dos pés, facilitando a elevação no Tuck L-sit.',
      safetyNote: 'Use livros de mesma espessura bem alinhados para não inclinarem.',
      phaseCues: [
        'Palmas firmes sobre os blocos de livros · Braços travados',
        'Empurre forte para baixo tirando glúteos e pés do tapete',
        'Mantenha os joelhos altos e abdômen totalmente contraído',
      ],
    },
    {
      id: 'chao_lsit',
      label: 'Sem objeto (Direto no tapete)',
      shortLabel: 'Sem objeto (chão)',
      objectLabel: 'Apenas tapete antiderrapante',
      setupTip:
        'Apoie as palmas abertas no tapete ligeiramente à frente do quadril, empurre os ombros para baixo ao máximo e recolha joelhos bem fechados.',
      safetyNote: 'Aqueça bem os punhos antes; se sentir desconforto, volte para livros/blocos.',
      phaseCues: [
        'Palmas firmes no tapete · Cotovelos totalmente estendidos',
        'Depressão máxima dos ombros para descolar o quadril do chão',
        'Segure os joelhos recolhidos mantendo respiração controlada',
      ],
    },
  ],
};

export function getObjectVariations(
  patternId: MovementPatternId
): readonly ObjectVariationOption[] {
  return OBJECT_VARIATIONS_BY_PATTERN[patternId] ?? [];
}

export function getDefaultVariationId(
  patternId: MovementPatternId,
  rung?: number,
  exerciseTitle?: string
): string | undefined {
  const title = (exerciseTitle ?? '').toLowerCase();

  if (patternId === 'paralelas_triceps') {
    if (rung === 1 || title.includes('mesa') || title.includes('extensão')) {
      return 'mesa_triceps';
    }
    if (
      (rung !== undefined && rung >= 3) ||
      title.includes('paralelas') ||
      title.includes('duas cadeiras')
    ) {
      return 'duas_cadeiras';
    }
    return 'banco';
  }

  if (patternId === 'puxar_horizontal') {
    if (title.includes('toalha') || rung === 3) {
      return 'toalha_porta';
    }
    if (title.includes('mochila')) {
      return 'mochila';
    }
    return 'mesa';
  }

  if (patternId === 'puxar_vertical') {
    if (title.includes('superman') || title.includes('sem barra')) {
      return 'superman_chao';
    }
    if (title.includes('toalha')) {
      return 'toalha_alta';
    }
    return 'barra_porta';
  }

  return OBJECT_VARIATIONS_BY_PATTERN[patternId]?.[0]?.id;
}

export function isIsometricPose(
  patternId: MovementPatternId,
  rung?: number
): boolean {
  if (patternId === 'habilidades') return true;
  if (patternId === 'core') {
    // Dead bug (rung 1) and leg/knee raises (rungs 4-5) are dynamic rep movements
    if (rung === 1 || rung === 4 || rung === 5) return false;
    return true;
  }
  return false;
}

export interface DynamicProp3D {
  kind: 'towel_row' | 'towel_high' | 'backpack';
  /** Fixed wall/door anchor point (for towel straps) */
  anchor?: Vec3;
  /** Moving center point (for backpack) */
  center?: Vec3;
}

export interface Pose3D {
  pelvis: Vec3;
  chest: Vec3;
  neck: Vec3;
  head: Vec3;
  /** Unit forward direction of the torso/face (for orienting chest, pecs, abs, face) */
  torsoForward: Vec3;
  /** Unit right direction of the torso (shoulder-to-shoulder axis) */
  torsoRight: Vec3;
  leftArm: SideArm3D;
  rightArm: SideArm3D;
  leftLeg: SideLeg3D;
  rightLeg: SideLeg3D;
  /** Ground contact shadow center and radii on the studio floor */
  shadow: { x: number; z: number; rx: number; rz: number; opacity: number };
  /** Ideal GymVisual studio camera presets for this pattern */
  cameraTarget: Vec3;
  cameraDistance: number;
  /** Explicit flag controlling whether exercise mat is visible on floor */
  showMat?: boolean;
  /** Optional override key for static 3D studio prop visibility (e.g. rung-specific bench) */
  staticPropKey?: string;
  /** Optional dynamic 3D prop coordinates synced to hands every frame */
  dynamicProp?: DynamicProp3D;
  phaseTag: 'inicio' | 'excentrica' | 'pausa' | 'concentrica' | 'isometria';
  phasePercent: number;
  phaseIndex: 1 | 2 | 3;
}

export function v3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function v3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function v3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function v3Scale(a: Vec3, s: number): Vec3 {
  return { x: a.x * s, y: a.y * s, z: a.z * s };
}

export function v3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function v3Len(a: Vec3): number {
  return Math.hypot(a.x, a.y, a.z);
}

export function v3Dist(a: Vec3, b: Vec3): number {
  return Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
}

export function v3Norm(a: Vec3): Vec3 {
  const l = Math.hypot(a.x, a.y, a.z);
  if (l < 1e-6) return { x: 0, y: 1, z: 0 };
  return { x: a.x / l, y: a.y / l, z: a.z / l };
}

/**
 * Exact 3D 2-bone analytical Inverse Kinematics solver using Law of Cosines + pole vector.
 * Guarantees exact lengths len1 and len2 in 3D space with zero joint flipping.
 */
export function solveTwoBoneIK3D(
  root: Vec3,
  target: Vec3,
  len1: number,
  len2: number,
  poleDir: Vec3
): { mid: Vec3; end: Vec3 } {
  const delta = v3Sub(target, root);
  const rawDist = v3Len(delta);
  const maxReach = len1 + len2 - 1e-4;
  const minReach = Math.abs(len1 - len2) + 1e-4;
  const d = clamp(rawDist, minReach, maxReach);
  const axis = rawDist > 1e-6 ? v3Scale(delta, 1 / rawDist) : v3(0, -1, 0);

  // Project pole vector strictly orthogonal to root->target axis
  const proj = v3Dot(poleDir, axis);
  let bend = v3Sub(poleDir, v3Scale(axis, proj));
  if (v3Len(bend) < 1e-5) {
    bend = Math.abs(axis.y) < 0.9 ? v3(0, 1, 0) : v3(1, 0, 0);
    bend = v3Sub(bend, v3Scale(axis, v3Dot(bend, axis)));
  }
  bend = v3Norm(bend);

  const cosA = clamp((len1 * len1 + d * d - len2 * len2) / (2 * len1 * d), -1, 1);
  const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));

  const mid = v3Add(
    root,
    v3Add(v3Scale(axis, len1 * cosA), v3Scale(bend, len1 * sinA))
  );
  const endDir = v3Norm(v3Sub(target, mid));
  const end = v3Add(mid, v3Scale(endDir, len2));

  return { mid, end };
}

/**
 * Computes a complete, bilateral 3D athletic pose in world meters (floor y = 0)
 * for any of the 10 calisthenics movement patterns at normalized cycle time u ∈ [0, 1).
 */
export function solvePose3D(
  patternId: MovementPatternId,
  u: number,
  variantId?: string,
  rung?: number
): Pose3D {
  const B = BODY_3D;
  const matY = B.matY;
  const activeVariant = variantId ?? getDefaultVariationId(patternId, rung);
  const isIso = isIsometricPose(patternId, rung);
  const isPull =
    patternId === 'dobradica_posterior' && (rung === 3 || rung === 4)
      ? false
      : isPullOrRisePattern(patternId);
  const { value, phaseTag, phaseIndex } = computeAthleticPhase(u, isIso, isPull);

  // =========================================================================
  // 1. EMPURRAR HORIZONTAL — Inclined (1-2) | Knee (3) | Full (4-5) | Diamond (6)
  // =========================================================================
  if (patternId === 'empurrar_horizontal') {
    // Rung 1–2: Inclined push-up with hands firmly planted on sturdy oak bench (top y = 0.56)
    if (rung === 1 || rung === 2) {
      const benchTopY = 0.56;
      const plankRad = (lerp(41.5, 27.0, value) * Math.PI) / 180;
      const cosP = Math.cos(plankRad);
      const sinP = Math.sin(plankRad);

      const ankleX = -0.84;
      const ankleY = matY + 0.10;
      const bodySpanLeg = B.shin + B.thigh;

      const pelvis = v3(ankleX + cosP * bodySpanLeg, ankleY + sinP * bodySpanLeg, 0);
      const chest = v3(pelvis.x + cosP * B.torso, pelvis.y + sinP * B.torso, 0);
      const neck = v3(chest.x + cosP * B.neck, chest.y + sinP * B.neck, 0);
      const head = v3(neck.x + cosP * B.headR, neck.y + sinP * B.headR, 0);

      const torsoForward = v3Norm(v3(sinP, -cosP, 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zFoot = side * 0.12;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const ankle = v3(ankleX, ankleY, zFoot);
        const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(sinP, -cosP, 0));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          toe: v3(ankleX + 0.02, matY, zFoot),
          heel: v3(ankleX - 0.08, matY + 0.15, zFoot),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const wristTarget = v3(0.47, benchTopY + 0.015, side * 0.24);
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-0.85, 0.15, side * 0.55)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + B.hand * 0.85, benchTopY + 0.01, armIK.end.z),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: -0.14, z: 0, rx: 0.78, rz: 0.34, opacity: 0.24 },
        cameraTarget: v3(-0.04, 0.56, 0),
        cameraDistance: 2.55,
        staticPropKey: 'empurrar_horizontal:inclinada',
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Rung 3: Kneeling push-up (knees firmly planted on mat, straight body knees->head)
    if (rung === 3) {
      const plankRad = (lerp(31.0, 9.5, value) * Math.PI) / 180;
      const cosP = Math.cos(plankRad);
      const sinP = Math.sin(plankRad);

      const kneeX = -0.26;
      const kneeY = matY + 0.055;
      const pelvis = v3(kneeX + cosP * B.thigh, kneeY + sinP * B.thigh, 0);
      const chest = v3(pelvis.x + cosP * B.torso, pelvis.y + sinP * B.torso, 0);
      const neck = v3(chest.x + cosP * B.neck, chest.y + sinP * B.neck, 0);
      const head = v3(neck.x + cosP * B.headR, neck.y + sinP * B.headR, 0);

      const torsoForward = v3Norm(v3(sinP, -cosP, 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zKnee = side * 0.11;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const kneeDir = v3Norm(v3(kneeX - hip.x, kneeY - hip.y, zKnee - hip.z));
        const knee = v3Add(hip, v3Scale(kneeDir, B.thigh));
        const shinUpRad = (18 * Math.PI) / 180;
        const ankle = v3(
          knee.x - Math.cos(shinUpRad) * B.shin,
          knee.y + Math.sin(shinUpRad) * B.shin,
          side * 0.08
        );
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.04, ankle.y + 0.06, ankle.z),
          toe: v3(ankle.x - 0.12, Math.max(matY + 0.01, ankle.y - 0.08), ankle.z),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const wristTarget = v3(0.58, matY + 0.02, side * 0.24);
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-0.85, 0.25, side * 0.62)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + B.hand, matY + 0.01, armIK.end.z),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.05, z: 0, rx: 0.78, rz: 0.34, opacity: lerp(0.24, 0.34, value) },
        cameraTarget: v3(0.08, 0.34, 0),
        cameraDistance: 2.35,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    const isDiamond = rung === 6;
    const plankRad = (lerp(20.5, 5.8, value) * Math.PI) / 180;
    const cosP = Math.cos(plankRad);
    const sinP = Math.sin(plankRad);

    const ankleX = -0.68;
    const ankleY = matY + 0.10;
    const bodySpanLeg = B.shin + B.thigh; // 0.87

    const pelvis = v3(ankleX + cosP * bodySpanLeg, ankleY + sinP * bodySpanLeg, 0);
    const chest = v3(pelvis.x + cosP * B.torso, pelvis.y + sinP * B.torso, 0);
    const neck = v3(chest.x + cosP * B.neck, chest.y + sinP * B.neck, 0);
    const head = v3(neck.x + cosP * B.headR, neck.y + sinP * B.headR, 0);

    const torsoForward = v3Norm(v3(sinP, -cosP, 0)); // chest facing mat
    const torsoRight = v3(0, 0, 1);

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const zFoot = side * 0.11;
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
      const ankle = v3(ankleX, ankleY, zFoot);
      const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(sinP, -cosP, 0));
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        toe: v3(ankleX + 0.01, matY, zFoot),
        heel: v3(ankleX - 0.06, matY + 0.16, zFoot),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const wristTarget = v3(
        isDiamond ? 0.56 : 0.60,
        matY + 0.02,
        side * (isDiamond ? 0.068 : 0.25)
      );
      const armIK = solveTwoBoneIK3D(
        shoulder,
        wristTarget,
        B.upperArm,
        B.forearm,
        v3(-0.85, 0.25, side * (isDiamond ? 0.42 : 0.62))
      );
      return {
        shoulder,
        elbow: armIK.mid,
        wrist: armIK.end,
        handTip: v3(armIK.end.x + B.hand, matY + 0.01, armIK.end.z),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: 0.0, z: 0, rx: 0.82, rz: 0.34, opacity: lerp(0.22, 0.34, value) },
      cameraTarget: v3(0.05, 0.32, 0),
      cameraDistance: 2.35,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 2. EMPURRAR VERTICAL — Pike push-up (inverted V, tripod descent)
  // =========================================================================
  if (patternId === 'empurrar_vertical') {
    const legRad = (lerp(64, 44, value) * Math.PI) / 180;
    const torsoDownRad = (52 * Math.PI) / 180;

    const ankleX = -0.46;
    const ankleY = matY + 0.11;
    const legSpan = B.shin + B.thigh;

    const pelvis = v3(
      ankleX + Math.cos(legRad) * legSpan,
      ankleY + Math.sin(legRad) * legSpan,
      0
    );
    const chest = v3(
      pelvis.x + Math.cos(torsoDownRad) * B.torso,
      pelvis.y - Math.sin(torsoDownRad) * B.torso,
      0
    );
    const neck = v3(
      chest.x + Math.cos(torsoDownRad) * B.neck,
      chest.y - Math.sin(torsoDownRad) * B.neck,
      0
    );
    const head = v3(
      neck.x + Math.cos(torsoDownRad) * B.headR,
      neck.y - Math.sin(torsoDownRad) * B.headR,
      0
    );

    const torsoForward = v3Norm(v3(-Math.sin(torsoDownRad), -Math.cos(torsoDownRad), 0));
    const torsoRight = v3(0, 0, 1);

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const zFoot = side * 0.14;
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
      const ankle = v3(ankleX, ankleY, zFoot);
      const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(1, -0.5, 0));
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        toe: v3(ankleX + 0.02, matY, zFoot),
        heel: v3(ankleX - 0.07, matY + 0.15, zFoot),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const wristTarget = v3(0.56, matY + 0.02, side * 0.25);
      const armIK = solveTwoBoneIK3D(
        shoulder,
        wristTarget,
        B.upperArm,
        B.forearm,
        v3(-0.85, 0.2, side * 0.52)
      );
      return {
        shoulder,
        elbow: armIK.mid,
        wrist: armIK.end,
        handTip: v3(armIK.end.x + B.hand, matY + 0.01, armIK.end.z),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: 0.08, z: 0, rx: 0.72, rz: 0.32, opacity: 0.24 },
      cameraTarget: v3(0.08, 0.52, 0),
      cameraDistance: 2.35,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 3. PARALELAS / TRÍCEPS — 3 object variations: banco | duas_cadeiras | mesa_triceps
  // =========================================================================
  if (patternId === 'paralelas_triceps') {
    if (activeVariant === 'duas_cadeiras') {
      // Parallel dips suspended between two sturdy wooden chairs (rails at y = 0.88, z = ±0.27)
      const chairTopY = 0.88;
      const chestY = lerp(1.41, 1.13, value);
      const leanRad = (lerp(6, 15, value) * Math.PI) / 180;
      const chest = v3(lerp(0.02, 0.07, value), chestY, 0);
      const pelvis = v3(
        chest.x - Math.sin(leanRad) * B.torso,
        chest.y - Math.cos(leanRad) * B.torso,
        0
      );
      const neck = v3(chest.x + Math.sin(leanRad * 0.5) * B.neck, chest.y + B.neck, 0);
      const head = v3(neck.x + 0.02, neck.y + B.headR, 0);

      const torsoForward = v3Norm(v3(Math.cos(leanRad), -Math.sin(leanRad), 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        // Flex hips ~32° forward & tuck shins ~90° backward so knees and feet clear the floor cleanly
        const thighFwdRad = (32 * Math.PI) / 180;
        const knee = v3(
          hip.x + Math.sin(thighFwdRad) * B.thigh,
          hip.y - Math.cos(thighFwdRad) * B.thigh,
          side * 0.12
        );
        const shinBackRad = (84 * Math.PI) / 180;
        const ankle = v3(
          knee.x - Math.sin(shinBackRad) * B.shin,
          knee.y - Math.cos(shinBackRad) * B.shin,
          side * 0.06
        );
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.02, ankle.y + 0.05, ankle.z),
          toe: v3(ankle.x - 0.14, ankle.y - 0.04, ankle.z),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const wristTarget = v3(0.0, chairTopY + 0.01, side * 0.27);
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-1, 0.15, side * 0.14)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + 0.06, chairTopY - 0.03, armIK.end.z),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.44, rz: 0.36, opacity: lerp(0.18, 0.28, value) },
        cameraTarget: v3(0.0, 0.88, 0),
        cameraDistance: 2.85,
        showMat: false,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    if (activeVariant === 'mesa_triceps') {
      // Inclined bodyweight triceps extension with hands anchored on table edge (x = 0.36, y = 0.78)
      const tableTopY = 0.78;
      const bodyRad = (lerp(45.5, 31.0, value) * Math.PI) / 180;
      const cosB = Math.cos(bodyRad);
      const sinB = Math.sin(bodyRad);
      const ankleX = -1.04;
      const ankleY = matY + 0.08;
      const legSpan = B.shin + B.thigh;

      const pelvis = v3(ankleX + cosB * legSpan, ankleY + sinB * legSpan, 0);
      const chest = v3(pelvis.x + cosB * B.torso, pelvis.y + sinB * B.torso, 0);
      const neck = v3(chest.x + cosB * B.neck, chest.y + sinB * B.neck, 0);
      const head = v3(neck.x + cosB * B.headR, neck.y + sinB * B.headR, 0);

      const torsoForward = v3Norm(v3(sinB, -cosB, 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zFoot = side * 0.12;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const ankle = v3(ankleX, ankleY, zFoot);
        const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(sinB, -cosB, 0));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          toe: v3(ankleX + 0.02, matY, zFoot),
          heel: v3(ankleX - 0.11, matY + 0.13, zFoot),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const wristTarget = v3(0.36, tableTopY + 0.012, side * 0.17);
        // Elbows bend cleanly downward under shoulders
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(0.15, -1, side * 0.16)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + 0.07, tableTopY + 0.01, armIK.end.z),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: -0.35, z: 0, rx: 0.72, rz: 0.34, opacity: 0.24 },
        cameraTarget: v3(-0.14, 0.72, 0),
        cameraDistance: 2.75,
        showMat: true,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Default: Bench dips (oak bench top at y = 0.56, right edge x = -0.18)
    const benchTopY = 0.56;
    const drop = lerp(0, 0.30, value);
    const pelvis = v3(0.02 + lerp(0, 0.03, value), 0.58 - drop, 0);
    const torsoTiltRad = (lerp(82, 78, value) * Math.PI) / 180;
    const chest = v3(
      pelvis.x - Math.cos(torsoTiltRad) * B.torso,
      pelvis.y + Math.sin(torsoTiltRad) * B.torso,
      0
    );
    const neck = v3(chest.x + 0.01, chest.y + B.neck, 0);
    const head = v3(neck.x + 0.02, neck.y + B.headR, 0);

    const torsoForward = v3Norm(v3(Math.sin(torsoTiltRad), Math.cos(torsoTiltRad), 0));
    const torsoRight = v3(0, 0, 1);

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const zFoot = side * 0.13;
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
      const ankleTarget = v3(0.54, matY + B.ankleH, zFoot);
      const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(0.3, 1, side * 0.1));
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        heel: v3(ankleTarget.x - 0.05, matY, zFoot),
        toe: v3(ankleTarget.x + 0.16, matY, zFoot),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const wristTarget = v3(-0.22, benchTopY + 0.015, side * 0.23);
      // Elbows drive straight backward behind torso over bench
      const armIK = solveTwoBoneIK3D(
        shoulder,
        wristTarget,
        B.upperArm,
        B.forearm,
        v3(-1, 0.2, side * 0.18)
      );
      return {
        shoulder,
        elbow: armIK.mid,
        wrist: armIK.end,
        handTip: v3(armIK.end.x + 0.07, benchTopY - 0.04, armIK.end.z),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: 0.18, z: 0, rx: 0.56, rz: 0.34, opacity: lerp(0.22, 0.32, value) },
      cameraTarget: v3(0.05, 0.58, 0),
      cameraDistance: 2.35,
      showMat: true,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 4. PUXAR HORIZONTAL — 3 object variations: mesa | toalha_porta | mochila
  // =========================================================================
  if (patternId === 'puxar_horizontal') {
    if (activeVariant === 'toalha_porta') {
      // Inclined doorway towel row: feet planted near door at x = 0.42, towel anchored at (0.68, 1.26, 0)
      const doorAnchor = v3(0.68, 1.26, 0);
      const bodyRad = (lerp(56, 73, value) * Math.PI) / 180;
      const cosB = Math.cos(bodyRad);
      const sinB = Math.sin(bodyRad);
      const ankleX = 0.42;
      const ankleY = matY + 0.08;
      const legSpan = B.shin + B.thigh;

      const pelvis = v3(ankleX - cosB * legSpan, ankleY + sinB * legSpan, 0);
      const chest = v3(pelvis.x - cosB * B.torso, pelvis.y + sinB * B.torso, 0);
      const neck = v3(chest.x - cosB * B.neck, chest.y + sinB * B.neck, 0);
      const head = v3(neck.x - cosB * B.headR, neck.y + sinB * B.headR, 0);

      const torsoForward = v3Norm(v3(sinB, cosB, 0)); // chest facing door (+X, slightly up)
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zFoot = side * 0.14;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const ankle = v3(ankleX, ankleY, zFoot);
        const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(sinB, cosB, 0));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          heel: v3(ankleX - 0.04, matY, zFoot),
          toe: v3(ankleX + 0.16, matY + 0.04, zFoot),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        // Hands stay on taut towel arc pivoted at doorAnchor
        const wristTarget = v3(
          lerp(0.18, 0.21, value),
          lerp(1.24, 1.38, value),
          side * lerp(0.08, 0.15, value)
        );
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-0.7, -0.5, side * 0.55)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + 0.07, armIK.end.y, armIK.end.z * 0.8),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.18, z: 0, rx: 0.55, rz: 0.34, opacity: 0.22 },
        cameraTarget: v3(0.12, 0.96, 0),
        cameraDistance: 3.1,
        showMat: false,
        dynamicProp: { kind: 'towel_row', anchor: doorAnchor },
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    if (activeVariant === 'mochila') {
      // Bent-over row holding a weighted backpack with both hands
      const ankleY = matY + B.ankleH;
      const pelvis = v3(-0.22, 0.88, 0);
      const hingeRad = (52 * Math.PI) / 180; // athletic 52° forward hip hinge
      const chest = v3(
        pelvis.x + Math.sin(hingeRad) * B.torso,
        pelvis.y + Math.cos(hingeRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x + Math.sin(hingeRad * 0.85) * B.neck,
        chest.y + Math.cos(hingeRad * 0.85) * B.neck,
        0
      );
      const head = v3(
        neck.x + Math.sin(hingeRad * 0.72) * B.headR,
        neck.y + Math.cos(hingeRad * 0.72) * B.headR,
        0
      );

      const torsoForward = v3Norm(v3(Math.cos(hingeRad), -Math.sin(hingeRad), 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zFoot = side * 0.16;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const ankleTarget = v3(-0.04, ankleY, zFoot);
        const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(1, 0.1, side * 0.15));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          heel: v3(ankleTarget.x - 0.06, matY, zFoot),
          toe: v3(ankleTarget.x + 0.16, matY, zFoot),
        };
      };

      const wristX = lerp(0.19, 0.03, value);
      const wristY = lerp(0.66, 0.96, value);
      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const wristTarget = v3(wristX, wristY, side * lerp(0.15, 0.21, value));
        // Elbows pull high & back beside ribs
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-0.85, 0.65, side * 0.38)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x, armIK.end.y - 0.06, armIK.end.z),
        };
      };

      const leftArm = buildArm(-1);
      const rightArm = buildArm(1);
      const bagCenter = v3(
        (leftArm.wrist.x + rightArm.wrist.x) * 0.5,
        (leftArm.wrist.y + rightArm.wrist.y) * 0.5 - 0.19,
        0
      );

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm,
        rightArm,
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.42, rz: 0.34, opacity: 0.26 },
        cameraTarget: v3(0.02, 0.86, 0),
        cameraDistance: 2.85,
        showMat: true,
        dynamicProp: { kind: 'backpack', center: bagCenter },
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Default: Inverted row under sturdy oak table (underside y = 0.90)
    const tableUndersideY = 0.90;
    const bodyRad = (lerp(13.5, 30, value) * Math.PI) / 180;
    const cosB = Math.cos(bodyRad);
    const sinB = Math.sin(bodyRad);

    const ankleX = -0.68;
    const ankleY = matY + 0.09;
    const legSpan = B.shin + B.thigh;

    const pelvis = v3(ankleX + cosB * legSpan, ankleY + sinB * legSpan, 0);
    const chest = v3(pelvis.x + cosB * B.torso, pelvis.y + sinB * B.torso, 0);
    const neck = v3(chest.x + cosB * B.neck, chest.y + sinB * B.neck, 0);
    const head = v3(neck.x + cosB * B.headR, neck.y + sinB * B.headR, 0);

    const torsoForward = v3Norm(v3(-sinB, cosB, 0)); // chest facing UP toward table
    const torsoRight = v3(0, 0, -1); // supine facing up, head at +X => right side is -Z!

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const zFoot = side * 0.12;
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
      const ankle = v3(ankleX, ankleY, zFoot);
      const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(-sinB, cosB, 0));
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        heel: v3(ankleX - 0.02, matY, zFoot),
        toe: v3(ankleX - 0.06, matY + 0.20, zFoot),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const wristTarget = v3(0.56, tableUndersideY, side * 0.27);
      // Elbows drive downward & 45° outward behind ribs
      const armIK = solveTwoBoneIK3D(
        shoulder,
        wristTarget,
        B.upperArm,
        B.forearm,
        v3(0.3, -1, side * 0.55)
      );
      return {
        shoulder,
        elbow: armIK.mid,
        wrist: armIK.end,
        handTip: v3(armIK.end.x - 0.04, tableUndersideY + 0.06, armIK.end.z),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(1), // note supine: anatomical left is +Z
      rightArm: buildArm(-1),
      leftLeg: buildLeg(1),
      rightLeg: buildLeg(-1),
      shadow: { x: 0.0, z: 0, rx: 0.78, rz: 0.34, opacity: lerp(0.28, 0.18, value) },
      cameraTarget: v3(0.04, 0.54, 0),
      cameraDistance: 2.45,
      showMat: true,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 5. PUXAR VERTICAL — 3 object variations: barra_porta | toalha_alta | superman_chao
  // =========================================================================
  if (patternId === 'puxar_vertical') {
    if (activeVariant === 'toalha_alta') {
      // High doorway towel diagonal pull (anchor at top of doorframe x = 0.70, y = 1.88)
      const doorAnchor = v3(0.70, 1.88, 0);
      const ankleX = 0.36;
      const ankleY = matY + B.ankleH;

      const pelvis = v3(lerp(-0.22, -0.06, value), lerp(0.44, 0.62, value), 0);
      const torsoLeanBackRad = (lerp(-18, 10, value) * Math.PI) / 180;
      const chest = v3(
        pelvis.x + Math.sin(torsoLeanBackRad) * B.torso,
        pelvis.y + Math.cos(torsoLeanBackRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x + Math.sin(torsoLeanBackRad * 0.7) * B.neck,
        chest.y + Math.cos(torsoLeanBackRad * 0.7) * B.neck,
        0
      );
      const head = v3(
        neck.x + Math.sin(torsoLeanBackRad * 0.5) * B.headR,
        neck.y + Math.cos(torsoLeanBackRad * 0.5) * B.headR,
        0
      );

      const torsoForward = v3Norm(
        v3(Math.cos(torsoLeanBackRad), -Math.sin(torsoLeanBackRad), 0)
      );
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zFoot = side * 0.15;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const ankleTarget = v3(ankleX, ankleY, zFoot);
        const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(0.55, 1, side * 0.18));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          heel: v3(ankleTarget.x - 0.05, matY, zFoot),
          toe: v3(ankleTarget.x + 0.16, matY, zFoot),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const wristTarget = v3(
          lerp(0.03, 0.08, value),
          lerp(1.31, 1.33, value),
          side * lerp(0.11, 0.17, value)
        );
        // Elbows pull cleanly down and slightly back toward ribs
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-0.35, -1, side * 0.45)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + 0.05, armIK.end.y + 0.05, armIK.end.z * 0.85),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.04, z: 0, rx: 0.56, rz: 0.34, opacity: 0.24 },
        cameraTarget: v3(0.14, 0.96, 0),
        cameraDistance: 3.15,
        showMat: false,
        dynamicProp: { kind: 'towel_high', anchor: doorAnchor },
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    if (activeVariant === 'superman_chao') {
      // Zero-equipment prone Superman Y-to-W lat pull on exercise mat
      const pelvis = v3(-0.08, matY + 0.095, 0);
      const liftRad = (lerp(2.5, 13.5, value) * Math.PI) / 180;
      const chest = v3(
        pelvis.x + Math.cos(liftRad) * B.torso,
        pelvis.y + Math.sin(liftRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x + Math.cos(liftRad * 0.8) * B.neck,
        chest.y + Math.sin(liftRad * 0.8) * B.neck,
        0
      );
      const head = v3(
        neck.x + Math.cos(liftRad * 0.5) * B.headR,
        neck.y + Math.sin(liftRad * 0.5) * B.headR,
        0
      );

      const torsoForward = v3Norm(v3(Math.sin(liftRad), -Math.cos(liftRad), 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zFoot = side * 0.12;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const legSpan = B.thigh + B.shin;
        const legLiftRad = (lerp(1, 6, value) * Math.PI) / 180;
        const ankleTarget = v3(
          pelvis.x - Math.cos(legLiftRad) * legSpan,
          pelvis.y + Math.sin(legLiftRad) * legSpan,
          zFoot
        );
        const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(0, -1, 0));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          heel: v3(legIK.end.x - 0.06, legIK.end.y + 0.06, zFoot),
          toe: v3(legIK.end.x - 0.14, Math.max(matY + 0.01, legIK.end.y - 0.04), zFoot),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        // Sweep from overhead Y reach -> W lat retraction squeezing elbows toward ribs
        const wristTarget = v3(
          chest.x + lerp(0.51, 0.11, value),
          matY + lerp(0.12, 0.24, value),
          side * lerp(0.24, 0.36, value)
        );
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-1, 0.28, side * 0.65)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + 0.08, armIK.end.y + 0.01, armIK.end.z),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: -0.02, z: 0, rx: 0.9, rz: 0.34, opacity: 0.26 },
        cameraTarget: v3(0.02, 0.24, 0),
        cameraDistance: 2.35,
        showMat: true,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Default: Pull-up on doorway steel bar (bar at y = 2.02, facing +Z)
    const barY = 2.02;
    const chestY = lerp(1.48, 1.92, value);
    const chestZ = lerp(0.0, -0.06, value); // Slight lean back as chest approaches bar

    const chest = v3(0, chestY, chestZ);
    const pelvis = v3(0, chestY - B.torso, chestZ + lerp(0.01, 0.05, value));
    const neck = v3(0, chestY + B.neck, chestZ + 0.01);
    const head = v3(0, neck.y + B.headR, chestZ + 0.02);

    const torsoForward = v3(0, 0, 1);
    const torsoRight = v3(1, 0, 0);

    // Legs bent neatly back in 3D (-Z) with ankles tucked for doorway clearance!
    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const hip = v3(side * B.hipHalfW, pelvis.y, pelvis.z);
      const knee = v3(side * 0.12, hip.y - B.thigh * 0.985, hip.z + 0.075);
      // Shins bend ~64° backward (-Z) so feet clear floor cleanly in 3D!
      const shinBackRad = (64 * Math.PI) / 180;
      const ankle = v3(
        side * 0.05,
        knee.y - Math.cos(shinBackRad) * B.shin,
        knee.z - Math.sin(shinBackRad) * B.shin
      );
      return {
        hip,
        knee,
        ankle,
        heel: v3(ankle.x, ankle.y + 0.05, ankle.z - 0.05),
        toe: v3(ankle.x, ankle.y - 0.11, ankle.z - 0.12),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(side * B.shoulderHalfW, chest.y, chest.z);
      const wristTarget = v3(side * 0.34, barY, 0.02);
      // Elbows drive down & slightly forward/outward
      const armIK = solveTwoBoneIK3D(
        shoulder,
        wristTarget,
        B.upperArm,
        B.forearm,
        v3(side * 0.72, -0.6, 0.35)
      );
      return {
        shoulder,
        elbow: armIK.mid,
        wrist: armIK.end,
        handTip: v3(armIK.end.x, barY + 0.05, 0.05),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: 0, z: -0.05, rx: 0.36, rz: 0.30, opacity: lerp(0.22, 0.14, value) },
      cameraTarget: v3(0, 1.32, 0),
      cameraDistance: 3.35,
      showMat: false,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 6. AGACHAR — Bilateral squat (1-3,5) | Bulgarian split squat (4) | Pistol (6)
  // =========================================================================
  if (patternId === 'agachar') {
    const ankleY = matY + B.ankleH;

    // Rung 4: Agachamento búlgaro (rear left foot elevated on oak bench at x = -0.60, top y = 0.44)
    if (rung === 4) {
      const pelvis = v3(lerp(-0.02, -0.06, value), lerp(0.90, 0.56, value), 0);
      const torsoLeanRad = (lerp(6, 17, value) * Math.PI) / 180;
      const chest = v3(
        pelvis.x + Math.sin(torsoLeanRad) * B.torso,
        pelvis.y + Math.cos(torsoLeanRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x + Math.sin(torsoLeanRad * 0.6) * B.neck,
        chest.y + Math.cos(torsoLeanRad * 0.6) * B.neck,
        0
      );
      const head = v3(
        neck.x + Math.sin(torsoLeanRad * 0.4) * B.headR,
        neck.y + Math.cos(torsoLeanRad * 0.4) * B.headR,
        0
      );

      const torsoForward = v3Norm(v3(Math.cos(torsoLeanRad), -Math.sin(torsoLeanRad), 0));
      const torsoRight = v3(0, 0, 1);

      // Right leg (+1) planted in front doing the work; Left leg (-1) resting on bench behind
      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        if (side === 1) {
          const zFoot = 0.13;
          const ankleTarget = v3(0.30, ankleY, zFoot);
          const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(1, 0.18, 0.15));
          return {
            hip,
            knee: legIK.mid,
            ankle: legIK.end,
            heel: v3(ankleTarget.x - 0.06, matY, zFoot),
            toe: v3(ankleTarget.x + 0.17, matY, zFoot),
          };
        }
        const zRear = -0.11;
        const rearAnkle = v3(-0.60, 0.48, zRear);
        const legIK = solveTwoBoneIK3D(hip, rearAnkle, B.thigh, B.shin, v3(0.45, -1, 0));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          heel: v3(rearAnkle.x - 0.04, rearAnkle.y + 0.07, zRear),
          toe: v3(rearAnkle.x - 0.16, 0.44, zRear),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const armRad = (lerp(-78, -56, value) * Math.PI) / 180;
        const elbow = v3(
          shoulder.x + Math.cos(armRad) * B.upperArm,
          shoulder.y + Math.sin(armRad) * B.upperArm,
          shoulder.z + side * 0.05
        );
        const forearmDir = v3Norm(v3(Math.cos(armRad + 0.45), Math.sin(armRad + 0.45), -side * 0.15));
        const wrist = v3Add(elbow, v3Scale(forearmDir, B.forearm));
        const handTip = v3Add(wrist, v3Scale(forearmDir, B.hand));
        return { shoulder, elbow, wrist, handTip };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.12, z: 0, rx: 0.44, rz: 0.32, opacity: 0.26 },
        cameraTarget: v3(-0.08, 0.86, 0),
        cameraDistance: 3.15,
        staticPropKey: 'agachar:bulgaro',
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Rung 6: Pistol squat (single-leg deep squat on right leg, left leg extended forward)
    if (rung === 6) {
      const pelvis = v3(
        lerp(0.0, -0.34, value),
        lerp(ankleY + B.thigh + B.shin - 0.015, ankleY + 0.30, value),
        0
      );
      const torsoLeanRad = (lerp(5, 34, value) * Math.PI) / 180;
      const chest = v3(
        pelvis.x + Math.sin(torsoLeanRad) * B.torso,
        pelvis.y + Math.cos(torsoLeanRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x + Math.sin(torsoLeanRad * 0.6) * B.neck,
        chest.y + Math.cos(torsoLeanRad * 0.6) * B.neck,
        0
      );
      const head = v3(
        neck.x + Math.sin(torsoLeanRad * 0.4) * B.headR,
        neck.y + Math.cos(torsoLeanRad * 0.4) * B.headR,
        0
      );
      const torsoForward = v3Norm(v3(Math.cos(torsoLeanRad), -Math.sin(torsoLeanRad), 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        if (side === 1) {
          const zFoot = 0.09;
          const ankleTarget = v3(0.02, ankleY, zFoot);
          const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(1, 0.15, 0.12));
          return {
            hip,
            knee: legIK.mid,
            ankle: legIK.end,
            heel: v3(ankleTarget.x - 0.06, matY, zFoot),
            toe: v3(ankleTarget.x + 0.17, matY, zFoot),
          };
        }
        // Left leg (-1) extends straight forward clearing the floor cleanly
        const extRad = (lerp(-58, 8, value) * Math.PI) / 180;
        const extDir = v3Norm(v3(Math.cos(extRad), Math.sin(extRad), 0));
        const knee = v3Add(hip, v3Scale(extDir, B.thigh));
        const ankle = v3Add(knee, v3Scale(extDir, B.shin));
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.03, Math.max(matY + 0.02, ankle.y - 0.05), ankle.z),
          toe: v3(ankle.x + 0.08, ankle.y + 0.14, ankle.z),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const armRad = (lerp(-65, 8, value) * Math.PI) / 180;
        const elbow = v3(
          shoulder.x + Math.cos(armRad) * B.upperArm,
          shoulder.y + Math.sin(armRad) * B.upperArm,
          shoulder.z - side * 0.02
        );
        const forearmDir = v3Norm(v3(Math.cos(armRad + 0.06), Math.sin(armRad + 0.06), -side * 0.05));
        const wrist = v3Add(elbow, v3Scale(forearmDir, B.forearm));
        const handTip = v3Add(wrist, v3Scale(forearmDir, B.hand));
        return { shoulder, elbow, wrist, handTip };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.36, rz: 0.30, opacity: 0.28 },
        cameraTarget: v3(0.06, 0.86, 0),
        cameraDistance: 3.1,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    const pelvis = v3(
      lerp(0.0, -0.34, value),
      lerp(ankleY + B.thigh + B.shin - 0.015, ankleY + 0.36, value),
      0
    );

    const torsoLeanRad = (lerp(4, 29, value) * Math.PI) / 180;
    const chest = v3(
      pelvis.x + Math.sin(torsoLeanRad) * B.torso,
      pelvis.y + Math.cos(torsoLeanRad) * B.torso,
      0
    );
    const neck = v3(
      chest.x + Math.sin(torsoLeanRad * 0.65) * B.neck,
      chest.y + Math.cos(torsoLeanRad * 0.65) * B.neck,
      0
    );
    const head = v3(
      neck.x + Math.sin(torsoLeanRad * 0.45) * B.headR,
      neck.y + Math.cos(torsoLeanRad * 0.45) * B.headR,
      0
    );

    const torsoForward = v3Norm(v3(Math.cos(torsoLeanRad), -Math.sin(torsoLeanRad), 0));
    const torsoRight = v3(0, 0, 1);

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const zFoot = side * 0.175;
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
      const ankleTarget = v3(0.02, ankleY, zFoot);
      const legIK = solveTwoBoneIK3D(
        hip,
        ankleTarget,
        B.thigh,
        B.shin,
        v3(1, 0.15, side * 0.28)
      );
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        heel: v3(ankleTarget.x - 0.06, matY, zFoot),
        toe: v3(ankleTarget.x + 0.17, matY, zFoot + side * 0.03),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const armRad = (lerp(-78, 4, value) * Math.PI) / 180;
      const elbow = v3(
        shoulder.x + Math.cos(armRad) * B.upperArm,
        shoulder.y + Math.sin(armRad) * B.upperArm,
        shoulder.z + side * lerp(0.03, -0.02, value)
      );
      const forearmDir = v3Norm(
        v3(Math.cos(armRad + 0.08), Math.sin(armRad + 0.08), -side * 0.06)
      );
      const wrist = v3Add(elbow, v3Scale(forearmDir, B.forearm));
      const handTip = v3Add(wrist, v3Scale(forearmDir, B.hand));
      return { shoulder, elbow, wrist, handTip };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: -0.04, z: 0, rx: lerp(0.32, 0.44, value), rz: 0.34, opacity: lerp(0.24, 0.32, value) },
      cameraTarget: v3(-0.04, 0.92, 0),
      cameraDistance: 3.05,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 7. DOBRADIÇA POSTERIOR — Bilateral bridge (1,5) | Unilateral bridge (2) | Good morning (3) | Stiff unilateral (4)
  // =========================================================================
  if (patternId === 'dobradica_posterior') {
    // Rung 3: Good morning (standing bilateral hip hinge)
    if (rung === 3) {
      const ankleY = matY + B.ankleH;
      const pelvis = v3(lerp(0.0, -0.26, value), lerp(0.94, 0.87, value), 0);
      const hingeRad = (lerp(4, 68, value) * Math.PI) / 180;
      const chest = v3(
        pelvis.x + Math.sin(hingeRad) * B.torso,
        pelvis.y + Math.cos(hingeRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x + Math.sin(hingeRad * 0.92) * B.neck,
        chest.y + Math.cos(hingeRad * 0.92) * B.neck,
        0
      );
      const head = v3(
        neck.x + Math.sin(hingeRad * 0.85) * B.headR,
        neck.y + Math.cos(hingeRad * 0.85) * B.headR,
        0
      );
      const torsoForward = v3Norm(v3(Math.cos(hingeRad), -Math.sin(hingeRad), 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const zFoot = side * 0.15;
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const ankleTarget = v3(0.02, ankleY, zFoot);
        const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(1, 0.08, side * 0.12));
        return {
          hip,
          knee: legIK.mid,
          ankle: legIK.end,
          heel: v3(ankleTarget.x - 0.06, matY, zFoot),
          toe: v3(ankleTarget.x + 0.17, matY, zFoot),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        // Hands resting lightly beside temples/ears (classic bodyweight good morning)
        const wristTarget = v3(head.x - 0.02, head.y + 0.02, side * 0.13);
        const armIK = solveTwoBoneIK3D(
          shoulder,
          wristTarget,
          B.upperArm,
          B.forearm,
          v3(-0.3, 0.2, side * 0.95)
        );
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(head.x, head.y + 0.04, side * 0.09),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.36, rz: 0.30, opacity: 0.24 },
        cameraTarget: v3(0.04, 0.96, 0),
        cameraDistance: 3.1,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Rung 4: Stiff unilateral (Single-leg RDL — balanced on right foot, left leg extends straight behind!)
    if (rung === 4) {
      const ankleY = matY + B.ankleH;
      const pelvis = v3(lerp(0.0, -0.08, value), lerp(0.94, 0.89, value), 0);
      const hingeRad = (lerp(5, 72, value) * Math.PI) / 180;
      const chest = v3(
        pelvis.x + Math.sin(hingeRad) * B.torso,
        pelvis.y + Math.cos(hingeRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x + Math.sin(hingeRad * 0.92) * B.neck,
        chest.y + Math.cos(hingeRad * 0.92) * B.neck,
        0
      );
      const head = v3(
        neck.x + Math.sin(hingeRad * 0.85) * B.headR,
        neck.y + Math.cos(hingeRad * 0.85) * B.headR,
        0
      );
      const torsoForward = v3Norm(v3(Math.cos(hingeRad), -Math.sin(hingeRad), 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        if (side === 1) {
          const zFoot = 0.09;
          const ankleTarget = v3(0.02, ankleY, zFoot);
          const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(1, 0.05, 0.08));
          return {
            hip,
            knee: legIK.mid,
            ankle: legIK.end,
            heel: v3(ankleTarget.x - 0.06, matY, zFoot),
            toe: v3(ankleTarget.x + 0.17, matY, zFoot),
          };
        }
        // Left leg (-1) extends straight backward as a seesaw counterbalance in line with torso!
        const backDir = v3Norm(v3(-Math.sin(hingeRad), -Math.cos(hingeRad), 0));
        const knee = v3Add(hip, v3Scale(backDir, B.thigh));
        const ankle = v3Add(knee, v3Scale(backDir, B.shin));
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.03, Math.max(matY, ankle.y - 0.03), ankle.z),
          toe: v3(ankle.x + 0.08, Math.max(matY, ankle.y - 0.07), ankle.z),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        // Arms hang vertically down under shoulders toward standing foot
        const elbow = v3(shoulder.x + 0.01, shoulder.y - B.upperArm, shoulder.z * 0.88);
        const wrist = v3(elbow.x + 0.01, Math.max(matY + 0.08, elbow.y - B.forearm), elbow.z * 0.92);
        const exactForearm = v3Add(elbow, v3Scale(v3Norm(v3Sub(wrist, elbow)), B.forearm));
        return {
          shoulder,
          elbow,
          wrist: exactForearm,
          handTip: v3(exactForearm.x, Math.max(matY + 0.02, exactForearm.y - B.hand), exactForearm.z),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.34, rz: 0.28, opacity: 0.24 },
        cameraTarget: v3(-0.02, 0.92, 0),
        cameraDistance: 3.15,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Rung 1 (bilateral), Rung 2 (UNILATERAL — 1 leg raised straight!), Rung 5 (hamstring curl bridge)
    const isUnilateralBridge = rung === 2;
    const chest = v3(-0.46, matY + 0.10, 0);
    const neck = v3(chest.x - B.neck, matY + 0.11, 0);
    const head = v3(neck.x - B.headR, matY + 0.125, 0);

    const bridgeRad = (lerp(2, 26.5, value) * Math.PI) / 180;
    const pelvis = v3(
      chest.x + Math.cos(bridgeRad) * B.torso,
      chest.y + Math.sin(bridgeRad) * B.torso,
      0
    );

    const torsoForward = v3Norm(v3(-Math.sin(bridgeRad), Math.cos(bridgeRad), 0));
    const torsoRight = v3(0, 0, 1);

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);

      // In Ponte de glúteo unilateral (rung 2), left leg (-1) extends completely straight
      // aligned with the standing thigh/pelvis line while right foot (+1) drives the bridge!
      if (isUnilateralBridge && side === -1) {
        const extRad = (lerp(22, 31, value) * Math.PI) / 180;
        const extDir = v3Norm(v3(Math.cos(extRad), Math.sin(extRad), 0));
        const knee = v3Add(hip, v3Scale(extDir, B.thigh));
        const ankle = v3Add(knee, v3Scale(extDir, B.shin));
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.03, ankle.y - 0.05, ankle.z),
          toe: v3(ankle.x + 0.07, ankle.y + 0.14, ankle.z),
        };
      }

      const zFoot = side * 0.14;
      const ankleTarget = v3(0.46, matY + B.ankleH, zFoot);
      const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(0.15, 1, side * 0.08));
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        heel: v3(ankleTarget.x - 0.05, matY, zFoot),
        toe: v3(ankleTarget.x + 0.16, matY, zFoot),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const elbow = v3(shoulder.x + B.upperArm * 0.96, matY + 0.055, side * 0.27);
      const wristTarget = v3(elbow.x + B.forearm, matY + 0.035, side * 0.29);
      const armIK = solveTwoBoneIK3D(shoulder, wristTarget, B.upperArm, B.forearm, v3(0, -0.2, side));
      return {
        shoulder,
        elbow: armIK.mid,
        wrist: armIK.end,
        handTip: v3(armIK.end.x + B.hand, matY + 0.02, armIK.end.z),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: 0.02, z: 0, rx: 0.78, rz: 0.34, opacity: 0.26 },
      cameraTarget: v3(isUnilateralBridge ? 0.08 : 0.02, isUnilateralBridge ? 0.36 : 0.30, 0),
      cameraDistance: isUnilateralBridge ? 2.55 : 2.35,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 8. PANTURRILHA — 3 object variations: degrau | livros | chao_unilateral
  //    Rung 1 = bilateral on step/books; Rung 2–3 = unilateral on ALL variations!
  // =========================================================================
  if (patternId === 'panturrilha') {
    const isFloorUnilateral = activeVariant === 'chao_unilateral';
    const isUnilateralCalf = isFloorUnilateral || (rung !== undefined && rung >= 2);
    const isBooks = activeVariant === 'livros';
    const stepTopY = isFloorUnilateral ? 0.0 : isBooks ? 0.11 : 0.16;
    const minDeg = isFloorUnilateral ? 0 : isBooks ? -11 : -15;
    const maxDeg = isFloorUnilateral ? 38 : 36;
    const footRad = (lerp(minDeg, maxDeg, value) * Math.PI) / 180;
    const pivotX = 0.06;
    const heelDist = 0.16;

    const ankleX = pivotX - Math.cos(footRad) * 0.10;
    const ankleY = stepTopY + Math.sin(footRad) * 0.10 + 0.065;
    const heelX = pivotX - Math.cos(footRad) * heelDist;
    const heelY = Math.max(0.0, stepTopY + Math.sin(footRad) * heelDist);

    const pelvis = v3(ankleX, ankleY + B.shin + B.thigh, 0);
    const chest = v3(pelvis.x + 0.01, pelvis.y + B.torso, 0);
    const neck = v3(chest.x, chest.y + B.neck, 0);
    const head = v3(neck.x + 0.01, neck.y + B.headR, 0);

    const torsoForward = v3(1, 0, 0);
    const torsoRight = v3(0, 0, 1);

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const zFoot = side * 0.11;
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);

      // Unilateral calf raise: left leg (-1) bends neatly behind the standing leg
      if (isUnilateralCalf && side === -1) {
        const knee = v3(hip.x - 0.03, hip.y - Math.sqrt(B.thigh * B.thigh - 0.03 * 0.03), zFoot);
        const tuckRad = (82 * Math.PI) / 180;
        const ankle = v3(
          knee.x - Math.sin(tuckRad) * B.shin,
          knee.y - Math.cos(tuckRad) * B.shin,
          zFoot
        );
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.02, ankle.y + 0.04, zFoot),
          toe: v3(ankle.x - 0.15, ankle.y - 0.08, zFoot),
        };
      }

      const ankle = v3(ankleX, ankleY, zFoot);
      const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(1, 0, 0));
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        heel: v3(heelX, heelY, zFoot),
        toe: v3(pivotX + 0.09, stepTopY, zFoot),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const wristTarget = v3(0.49, chest.y - 0.06, side * 0.21);
      const armIK = solveTwoBoneIK3D(shoulder, wristTarget, B.upperArm, B.forearm, v3(0, -1, side * 0.2));
      return {
        shoulder,
        elbow: armIK.mid,
        wrist: armIK.end,
        handTip: v3(armIK.end.x + 0.08, armIK.end.y + 0.01, armIK.end.z),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: 0.06, z: 0, rx: 0.30, rz: 0.28, opacity: 0.22 },
      cameraTarget: v3(0.06, isFloorUnilateral ? 0.94 : 1.02, 0),
      cameraDistance: 3.15,
      showMat: false,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 9. CORE — Dead bug (1) | Forearm plank (2) | Hollow body hold (3) | Leg raises (4-5)
  // =========================================================================
  if (patternId === 'core') {
    // Rung 1: Dead bug (supine, opposite arm & leg extending cleanly while other pair holds 90° tabletop)
    if (rung === 1) {
      const chest = v3(-0.42, matY + 0.10, 0);
      const pelvis = v3(chest.x + B.torso, matY + 0.095, 0);
      const neck = v3(chest.x - B.neck, matY + 0.11, 0);
      const head = v3(neck.x - B.headR, matY + 0.125, 0);
      const torsoForward = v3(0, 1, 0);
      const torsoRight = v3(0, 0, 1);

      // Right arm (+1) & left leg (-1) extend cleanly; left arm (-1) & right leg (+1) stay 90° upright
      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const z = side * 0.12;
        if (side === -1) {
          // Extending leg sweeps from 90° tabletop -> straight low hover above mat
          const thighRad = (lerp(88, 12, value) * Math.PI) / 180;
          const knee = v3(
            hip.x + Math.cos(thighRad) * B.thigh,
            hip.y + Math.sin(thighRad) * B.thigh,
            z
          );
          const shinRad = (lerp(2, 10, value) * Math.PI) / 180;
          const ankle = v3(
            knee.x + Math.cos(shinRad) * B.shin,
            knee.y + Math.sin(shinRad) * B.shin,
            z
          );
          return {
            hip,
            knee,
            ankle,
            heel: v3(ankle.x - 0.03, Math.max(matY + 0.02, ankle.y - 0.05), z),
            toe: v3(ankle.x + 0.07, ankle.y + 0.14, z),
          };
        }
        // Stationary 90° tabletop leg
        const knee = v3(hip.x + 0.02, hip.y + Math.sqrt(B.thigh * B.thigh - 0.02 * 0.02), z);
        const ankle = v3(knee.x + B.shin, knee.y, z);
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.03, ankle.y - 0.04, z),
          toe: v3(ankle.x + 0.04, ankle.y + 0.15, z),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        // Right arm (+1) sweeps overhead to match left leg (-1) extension
        const armRad = (side === 1 ? lerp(90, 166, value) : 90) * (Math.PI / 180);
        const elbow = v3(
          shoulder.x + Math.cos(armRad) * B.upperArm,
          shoulder.y + Math.sin(armRad) * B.upperArm,
          shoulder.z
        );
        const wrist = v3(
          elbow.x + Math.cos(armRad) * B.forearm,
          elbow.y + Math.sin(armRad) * B.forearm,
          shoulder.z
        );
        return {
          shoulder,
          elbow,
          wrist,
          handTip: v3(
            wrist.x + Math.cos(armRad) * B.hand,
            wrist.y + Math.sin(armRad) * B.hand,
            shoulder.z
          ),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.78, rz: 0.34, opacity: 0.24 },
        cameraTarget: v3(-0.04, 0.38, 0),
        cameraDistance: 2.55,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Rung 3: Hollow body hold (supine banana shape — lower back flat, shoulders & legs hovering)
    if (rung === 3) {
      const pelvis = v3(0.06, matY + 0.095, 0);
      const liftRad = (lerp(17, 21, value) * Math.PI) / 180;
      const chest = v3(
        pelvis.x - Math.cos(liftRad) * B.torso,
        pelvis.y + Math.sin(liftRad) * B.torso,
        0
      );
      const neck = v3(
        chest.x - Math.cos(liftRad + 0.2) * B.neck,
        chest.y + Math.sin(liftRad + 0.2) * B.neck,
        0
      );
      const head = v3(
        neck.x - Math.cos(liftRad + 0.25) * B.headR,
        neck.y + Math.sin(liftRad + 0.25) * B.headR,
        0
      );
      const torsoForward = v3Norm(v3(Math.sin(liftRad), Math.cos(liftRad), 0));
      const torsoRight = v3(0, 0, 1);

      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const legRad = (lerp(15, 19, value) * Math.PI) / 180;
        const dir = v3(Math.cos(legRad), Math.sin(legRad), 0);
        const knee = v3Add(hip, v3Scale(dir, B.thigh));
        const ankle = v3Add(knee, v3Scale(dir, B.shin));
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.03, ankle.y - 0.04, ankle.z),
          toe: v3(ankle.x + 0.14, ankle.y + 0.07, ankle.z),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const armRad = (lerp(154, 150, value) * Math.PI) / 180;
        const dir = v3(Math.cos(armRad), Math.sin(armRad), 0);
        const elbow = v3Add(shoulder, v3Scale(dir, B.upperArm));
        const wrist = v3Add(elbow, v3Scale(dir, B.forearm));
        return {
          shoulder,
          elbow,
          wrist,
          handTip: v3Add(wrist, v3Scale(dir, B.hand)),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.88, rz: 0.34, opacity: 0.24 },
        cameraTarget: v3(0.0, 0.32, 0),
        cameraDistance: 2.65,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Rung 4–5: Supine leg / knee raises
    if (rung === 4 || rung === 5) {
      const chest = v3(-0.46, matY + 0.10, 0);
      const pelvis = v3(chest.x + B.torso, matY + 0.095, 0);
      const neck = v3(chest.x - B.neck, matY + 0.11, 0);
      const head = v3(neck.x - B.headR, matY + 0.125, 0);
      const torsoForward = v3(0, 1, 0);
      const torsoRight = v3(0, 0, 1);

      const legRad = (lerp(14, 84, value) * Math.PI) / 180;
      const buildLeg = (side: -1 | 1): SideLeg3D => {
        const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
        const dir = v3(Math.cos(legRad), Math.sin(legRad), 0);
        const knee = v3Add(hip, v3Scale(dir, B.thigh));
        const ankle = v3Add(knee, v3Scale(dir, B.shin));
        return {
          hip,
          knee,
          ankle,
          heel: v3(ankle.x - 0.03, Math.max(matY + 0.02, ankle.y - 0.04), ankle.z),
          toe: v3(ankle.x + 0.12, ankle.y + 0.09, ankle.z),
        };
      };

      const buildArm = (side: -1 | 1): SideArm3D => {
        const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
        const elbow = v3(shoulder.x + B.upperArm * 0.96, matY + 0.055, side * 0.27);
        const wristTarget = v3(elbow.x + B.forearm, matY + 0.035, side * 0.29);
        const armIK = solveTwoBoneIK3D(shoulder, wristTarget, B.upperArm, B.forearm, v3(0, -0.2, side));
        return {
          shoulder,
          elbow: armIK.mid,
          wrist: armIK.end,
          handTip: v3(armIK.end.x + B.hand, matY + 0.02, armIK.end.z),
        };
      };

      return {
        pelvis,
        chest,
        neck,
        head,
        torsoForward,
        torsoRight,
        leftArm: buildArm(-1),
        rightArm: buildArm(1),
        leftLeg: buildLeg(-1),
        rightLeg: buildLeg(1),
        shadow: { x: 0.0, z: 0, rx: 0.80, rz: 0.34, opacity: 0.24 },
        cameraTarget: v3(-0.02, 0.44, 0),
        cameraDistance: 2.65,
        phaseTag,
        phasePercent: value,
        phaseIndex,
      };
    }

    // Default (Rung 2): Textbook forearm plank (elbows & forearms anchored flat on mat)
    const elbowX = 0.54;
    const elbowY = matY + 0.038;
    const upperArmRad = (lerp(92, 87, value) * Math.PI) / 180;
    const chest = v3(
      elbowX + Math.cos(upperArmRad) * B.upperArm,
      elbowY + Math.sin(upperArmRad) * B.upperArm,
      0
    );

    const totalLen = B.torso + B.thigh + B.shin; // 1.39
    const ankleY = matY + 0.10;
    const sinP = clamp((chest.y - ankleY) / totalLen, 0.05, 0.45);
    const cosP = Math.sqrt(1 - sinP * sinP);

    const pelvis = v3(chest.x - cosP * B.torso, chest.y - sinP * B.torso, 0);
    const ankleX = pelvis.x - cosP * (B.thigh + B.shin);
    const neck = v3(chest.x + cosP * B.neck, chest.y + sinP * B.neck, 0);
    const head = v3(neck.x + cosP * B.headR, neck.y + sinP * B.headR, 0);

    const torsoForward = v3Norm(v3(sinP, -cosP, 0));
    const torsoRight = v3(0, 0, 1);

    const buildLeg = (side: -1 | 1): SideLeg3D => {
      const zFoot = side * 0.11;
      const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
      const ankle = v3(ankleX, ankleY, zFoot);
      const legIK = solveTwoBoneIK3D(hip, ankle, B.thigh, B.shin, v3(sinP, -cosP, 0));
      return {
        hip,
        knee: legIK.mid,
        ankle: legIK.end,
        toe: v3(ankleX + 0.01, matY, zFoot),
        heel: v3(ankleX - 0.06, matY + 0.16, zFoot),
      };
    };

    const buildArm = (side: -1 | 1): SideArm3D => {
      const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
      const elbow = v3(elbowX, elbowY, side * B.shoulderHalfW);
      const wrist = v3(elbowX + B.forearm, matY + 0.032, side * 0.16);
      const forearmDir = v3Norm(v3Sub(wrist, elbow));
      const exactWrist = v3Add(elbow, v3Scale(forearmDir, B.forearm));
      return {
        shoulder,
        elbow,
        wrist: exactWrist,
        handTip: v3Add(exactWrist, v3Scale(forearmDir, B.hand)),
      };
    };

    return {
      pelvis,
      chest,
      neck,
      head,
      torsoForward,
      torsoRight,
      leftArm: buildArm(-1),
      rightArm: buildArm(1),
      leftLeg: buildLeg(-1),
      rightLeg: buildLeg(1),
      shadow: { x: 0.0, z: 0, rx: 0.86, rz: 0.34, opacity: 0.32 },
      cameraTarget: v3(0.05, 0.26, 0),
      cameraDistance: 2.35,
      phaseTag,
      phasePercent: value,
      phaseIndex,
    };
  }

  // =========================================================================
  // 10. HABILIDADES — 3 object variations: parallettes | livros_blocos | chao_lsit
  // =========================================================================
  const isFloorLsit = activeVariant === 'chao_lsit';
  const isBooksLsit = activeVariant === 'livros_blocos';
  const handleY = isFloorLsit ? matY + 0.018 : isBooksLsit ? matY + 0.14 : 0.24;
  const armLen = B.upperArm + B.forearm; // 0.57
  const chest = v3(
    lerp(-0.02, 0.0, value),
    handleY + armLen - lerp(0.032, 0.005, value),
    0
  );
  const neck = v3(chest.x + 0.01, chest.y + B.neck, 0);
  const head = v3(neck.x + 0.02, neck.y + B.headR, 0);

  const hipShiftX = lerp(-0.01, -0.035, value);
  const pelvis = v3(
    chest.x + hipShiftX,
    chest.y - Math.sqrt(B.torso * B.torso - hipShiftX * hipShiftX),
    0
  );

  const torsoForward = v3(1, 0, 0);
  const torsoRight = v3(0, 0, 1);

  const buildLeg = (side: -1 | 1): SideLeg3D => {
    const zFoot = side * 0.10;
    const hip = v3(pelvis.x, pelvis.y, side * B.hipHalfW);
    const ankleTarget = v3(
      lerp(0.50, isFloorLsit ? 0.34 : 0.42, value),
      lerp(matY + B.ankleH, isFloorLsit ? 0.16 : isBooksLsit ? 0.22 : 0.28, value),
      zFoot
    );
    const legIK = solveTwoBoneIK3D(hip, ankleTarget, B.thigh, B.shin, v3(0.2, 1, side * 0.08));
    return {
      hip,
      knee: legIK.mid,
      ankle: legIK.end,
      heel: v3(legIK.end.x - 0.05, Math.max(matY, lerp(matY, legIK.end.y - 0.04, value)), zFoot),
      toe: v3(legIK.end.x + 0.14, Math.max(matY, lerp(matY, legIK.end.y - 0.08, value)), zFoot),
    };
  };

  const buildArm = (side: -1 | 1): SideArm3D => {
    const shoulder = v3(chest.x, chest.y, side * B.shoulderHalfW);
    const wristTarget = v3(0.0, handleY, side * 0.26);
    const armIK = solveTwoBoneIK3D(
      shoulder,
      wristTarget,
      B.upperArm,
      B.forearm,
      v3(-1, 0, side * 0.2)
    );
    return {
      shoulder,
      elbow: armIK.mid,
      wrist: armIK.end,
      handTip: v3(
        armIK.end.x + (isFloorLsit || isBooksLsit ? 0.08 : 0),
        isFloorLsit || isBooksLsit ? handleY : handleY - 0.04,
        armIK.end.z
      ),
    };
  };

  return {
    pelvis,
    chest,
    neck,
    head,
    torsoForward,
    torsoRight,
    leftArm: buildArm(-1),
    rightArm: buildArm(1),
    leftLeg: buildLeg(-1),
    rightLeg: buildLeg(1),
    shadow: { x: 0.14, z: 0, rx: 0.48, rz: 0.34, opacity: lerp(0.28, 0.18, value) },
    cameraTarget: v3(0.10, isFloorLsit ? 0.42 : 0.54, 0),
    cameraDistance: 2.25,
    showMat: true,
    phaseTag,
    phasePercent: value,
    phaseIndex,
  };
}
