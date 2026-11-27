import type { MovementPatternId } from './types';

export interface Vec2 {
  x: number;
  y: number;
}

/**
 * Standard athletic human proportions (total standing height ~148 SVG units).
 * Every pose solver uses these exact constants so bones never stretch or shrink.
 */
export const BODY_PROPORTIONS = {
  headRadius: 9.2,
  neck: 7.5,
  torso: 44, // hip center to shoulder center
  upperArm: 25, // shoulder to elbow
  forearm: 23, // elbow to wrist
  hand: 7.5,
  thigh: 36, // hip to knee
  shin: 35, // knee to ankle
  footLength: 15,
  ankleHeight: 5,
} as const;

export interface FrontViewSymmetry {
  leftShoulder: Vec2;
  rightShoulder: Vec2;
  leftElbow: Vec2;
  rightElbow: Vec2;
  leftWrist: Vec2;
  rightWrist: Vec2;
  leftHip: Vec2;
  rightHip: Vec2;
  leftKnee: Vec2;
  rightKnee: Vec2;
  leftAnkle: Vec2;
  rightAnkle: Vec2;
}

export interface ArticulatedPose {
  /** View orientation for anatomical renderer */
  viewMode: 'side' | 'front';
  /** Facing direction in side view (+1 = facing right, -1 = facing left, 0 = front/supine up) */
  facing: 1 | -1 | 0;
  /** Primary near-side skeleton joints */
  head: Vec2;
  neck: Vec2;
  shoulder: Vec2;
  hip: Vec2;
  elbow: Vec2;
  wrist: Vec2;
  handTip: Vec2;
  knee: Vec2;
  ankle: Vec2;
  toe: Vec2;
  heel: Vec2;
  /** Offset far-side joints for realistic 3D depth separation in side view */
  farShoulder?: Vec2;
  farHip?: Vec2;
  farElbow?: Vec2;
  farWrist?: Vec2;
  farKnee?: Vec2;
  farAnkle?: Vec2;
  farToe?: Vec2;
  farHeel?: Vec2;
  /** Symmetric front-view skeleton (used by pull-up) */
  front?: FrontViewSymmetry;
  /** Optional kinesiology alignment reference line (e.g., plank spine or COM plumb line) */
  guideLine?: { from: Vec2; to: Vec2; label?: string };
  /** Contact shadow projection on the floor */
  shadow?: { cx: number; rx: number; y: number; opacity: number };
  /** Current biomechanical phase name & normalized tension 0..1 */
  phaseTag: 'inicio' | 'excentrica' | 'pausa' | 'concentrica' | 'isometria';
  phasePercent: number;
}

export function dist(a: Vec2, b: Vec2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function easeInOutCubic(t: number): number {
  const x = clamp(t, 0, 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}

function easeOutQuart(t: number): number {
  const x = clamp(t, 0, 1);
  return 1 - Math.pow(1 - x, 4);
}

/**
 * Exact 2-bone analytical Inverse Kinematics solver using the Law of Cosines.
 * Guarantees constant bone lengths len1 and len2 whenever target is reachable.
 * bendDir: +1 rotates clockwise (screen coords), -1 rotates counter-clockwise.
 */
export function solveTwoBoneIK(
  root: Vec2,
  target: Vec2,
  len1: number,
  len2: number,
  bendDir: 1 | -1
): { mid: Vec2; end: Vec2 } {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const rawDist = Math.hypot(dx, dy);
  const maxReach = len1 + len2 - 0.001;
  const minReach = Math.abs(len1 - len2) + 0.001;
  const d = clamp(rawDist, minReach, maxReach);

  const baseAngle = Math.atan2(dy, dx);
  const cosAngle1 = clamp(
    (len1 * len1 + d * d - len2 * len2) / (2 * len1 * d),
    -1,
    1
  );
  const angle1 = Math.acos(cosAngle1);
  const jointAngle = baseAngle + bendDir * angle1;

  const mid: Vec2 = {
    x: root.x + Math.cos(jointAngle) * len1,
    y: root.y + Math.sin(jointAngle) * len1,
  };

  // Recompute end strictly at len2 from mid toward target direction
  const endAngle = Math.atan2(target.y - mid.y, target.x - mid.x);
  const end: Vec2 = {
    x: mid.x + Math.cos(endAngle) * len2,
    y: mid.y + Math.sin(endAngle) * len2,
  };

  return { mid, end };
}

/**
 * Computes realistic athletic tempo kinematics from normalized cycle time u in [0, 1).
 * - Push / squat patterns (isPullOrRise = false): slow controlled eccentric (0->1) -> bottom pause -> crisp concentric drive (1->0)
 * - Pull / hip-hinge / calf patterns (isPullOrRise = true): crisp concentric lift (0->1) -> top pause -> slow controlled eccentric lowering (1->0)
 */
export function computeAthleticPhase(
  u: number,
  isIsometric: boolean,
  isPullOrRise = false
): {
  value: number; // 0 = start position, 1 = peak/bottom position
  phaseTag: ArticulatedPose['phaseTag'];
  phaseIndex: 1 | 2 | 3;
} {
  const t = ((u % 1) + 1) % 1;

  if (isIsometric) {
    if (t < 0.22) {
      return {
        value: easeInOutCubic(t / 0.22),
        phaseTag: 'concentrica',
        phaseIndex: 1,
      };
    }
    if (t < 0.85) {
      const breath = Math.sin(((t - 0.22) / 0.63) * Math.PI * 2) * 0.035;
      return {
        value: clamp(1 - 0.035 + breath, 0, 1),
        phaseTag: 'isometria',
        phaseIndex: t < 0.55 ? 2 : 3,
      };
    }
    return {
      value: 1 - easeInOutCubic((t - 0.85) / 0.15) * 0.1,
      phaseTag: 'isometria',
      phaseIndex: 3,
    };
  }

  if (isPullOrRise) {
    // Pull / lift tempo:
    // 0.00 - 0.08: Setup / active brace
    // 0.08 - 0.32: Crisp concentric pull/rise (24% of cycle ~1.2s)
    // 0.32 - 0.48: Isometric pause at peak contraction (16% of cycle ~0.8s)
    // 0.48 - 0.92: Slow controlled eccentric descent (44% of cycle ~2.5-3s)
    // 0.92 - 1.00: Bottom reset
    if (t < 0.08) {
      return { value: 0, phaseTag: 'inicio', phaseIndex: 1 };
    }
    if (t < 0.32) {
      const local = (t - 0.08) / 0.24;
      return { value: easeOutQuart(local), phaseTag: 'concentrica', phaseIndex: 2 };
    }
    if (t < 0.48) {
      return { value: 1, phaseTag: 'pausa', phaseIndex: 2 };
    }
    if (t < 0.92) {
      const local = (t - 0.48) / 0.44;
      return { value: 1 - easeInOutCubic(local), phaseTag: 'excentrica', phaseIndex: 3 };
    }
    return { value: 0, phaseTag: 'inicio', phaseIndex: 1 };
  }

  // Push / squat tempo:
  // 0.00 - 0.10: Top setup / brace
  // 0.10 - 0.54: Slow controlled eccentric (44% of cycle)
  // 0.54 - 0.68: Bottom isometric pause (14% of cycle)
  // 0.68 - 0.92: Crisp concentric drive (24% of cycle)
  // 0.92 - 1.00: Top lockout settle
  if (t < 0.1) {
    return { value: 0, phaseTag: 'inicio', phaseIndex: 1 };
  }
  if (t < 0.54) {
    const local = (t - 0.1) / 0.44;
    return { value: easeInOutCubic(local), phaseTag: 'excentrica', phaseIndex: 2 };
  }
  if (t < 0.68) {
    return { value: 1, phaseTag: 'pausa', phaseIndex: 2 };
  }
  if (t < 0.92) {
    const local = (t - 0.68) / 0.24;
    return { value: 1 - easeOutQuart(local), phaseTag: 'concentrica', phaseIndex: 3 };
  }
  return { value: 0, phaseTag: 'inicio', phaseIndex: 3 };
}

export function isPullOrRisePattern(patternId: MovementPatternId): boolean {
  return (
    patternId === 'puxar_horizontal' ||
    patternId === 'puxar_vertical' ||
    patternId === 'dobradica_posterior' ||
    patternId === 'panturrilha'
  );
}

/**
 * Computes a complete, bone-length-invariant articulated pose for any pattern at cycle time u ∈ [0, 1).
 * Canvas coordinate space: viewBox 0 0 360 200, floor mat at y = 172.
 */
export function solveExercisePose(
  patternId: MovementPatternId,
  u: number
): ArticulatedPose {
  const B = BODY_PROPORTIONS;
  const floorY = 172;
  const isIso = patternId === 'core' || patternId === 'habilidades';
  const { value, phaseTag } = computeAthleticPhase(
    u,
    isIso,
    isPullOrRisePattern(patternId)
  );

  if (patternId === 'empurrar_horizontal') {
    // Push-up: rigid straight plank pivoting smoothly around planted ball of foot.
    const toe: Vec2 = { x: 86, y: floorY };
    const heel: Vec2 = { x: 80, y: floorY - 12 };
    const ankle: Vec2 = { x: 86, y: floorY - 8 };

    // 20.5° at top lockout (arms straight below shoulders) -> 6° at bottom (chest hovering over mat)
    const plankRad = (lerp(20.5, 6, value) * Math.PI) / 180;
    const cosP = Math.cos(plankRad);
    const sinP = Math.sin(plankRad);

    const knee: Vec2 = {
      x: ankle.x + cosP * B.shin,
      y: ankle.y - sinP * B.shin,
    };
    const hip: Vec2 = {
      x: knee.x + cosP * B.thigh,
      y: knee.y - sinP * B.thigh,
    };
    const shoulder: Vec2 = {
      x: hip.x + cosP * B.torso,
      y: hip.y - sinP * B.torso,
    };
    const neck: Vec2 = {
      x: shoulder.x + cosP * B.neck,
      y: shoulder.y - sinP * B.neck,
    };
    const head: Vec2 = {
      x: neck.x + cosP * B.headRadius,
      y: neck.y - sinP * B.headRadius,
    };

    // Planted hand directly under shoulder line; dist(shoulder, wrist) ∈ [18, 46.8] <= 48
    const wristTarget: Vec2 = { x: 196, y: floorY - 2 };
    const armIK = solveTwoBoneIK(shoulder, wristTarget, B.upperArm, B.forearm, 1);
    const handTip: Vec2 = { x: armIK.end.x + B.hand + 3, y: floorY };

    return {
      viewMode: 'side',
      facing: 1,
      head,
      neck,
      shoulder,
      hip,
      elbow: armIK.mid,
      wrist: armIK.end,
      handTip,
      knee,
      ankle,
      toe,
      heel,
      farShoulder: { x: shoulder.x + 5, y: shoulder.y - 2 },
      farHip: { x: hip.x + 5, y: hip.y - 2 },
      farElbow: { x: armIK.mid.x + 6, y: armIK.mid.y - 3 },
      farWrist: { x: armIK.end.x + 7, y: armIK.end.y - 2 },
      farKnee: { x: knee.x + 5, y: knee.y - 2 },
      farAnkle: { x: ankle.x + 6, y: ankle.y - 2 },
      farToe: { x: toe.x + 6, y: toe.y - 2 },
      farHeel: { x: heel.x + 6, y: heel.y - 2 },
      guideLine: { from: ankle, to: shoulder, label: 'Linha neutra' },
      shadow: {
        cx: 148,
        rx: lerp(66, 78, value),
        y: floorY + 2,
        opacity: lerp(0.14, 0.25, value),
      },
      phaseTag,
      phasePercent: value,
    };
  }

  if (patternId === 'empurrar_vertical') {
    // Pike push-up: inverted V, hands planted at x=196, feet planted at x=106,
    // head travels forward & down forming a tripod ahead of hands.
    const toe: Vec2 = { x: 108, y: floorY };
    const ankle: Vec2 = { x: 106, y: floorY - 9 };
    const heel: Vec2 = { x: 99, y: floorY - 14 };

    const legRad = (lerp(65, 44, value) * Math.PI) / 180;
    const knee: Vec2 = {
      x: ankle.x + Math.cos(legRad) * B.shin,
      y: ankle.y - Math.sin(legRad) * B.shin,
    };
    const hip: Vec2 = {
      x: knee.x + Math.cos(legRad) * B.thigh,
      y: knee.y - Math.sin(legRad) * B.thigh,
    };

    const torsoDownRad = (lerp(52, 52, value) * Math.PI) / 180;
    const shoulder: Vec2 = {
      x: hip.x + Math.cos(torsoDownRad) * B.torso,
      y: hip.y + Math.sin(torsoDownRad) * B.torso,
    };
    const neck: Vec2 = {
      x: shoulder.x + Math.cos(torsoDownRad) * B.neck,
      y: shoulder.y + Math.sin(torsoDownRad) * B.neck,
    };
    const head: Vec2 = {
      x: neck.x + Math.cos(torsoDownRad) * B.headRadius,
      y: neck.y + Math.sin(torsoDownRad) * B.headRadius,
    };

    const wristTarget: Vec2 = { x: 192, y: floorY - 2 };
    const armIK = solveTwoBoneIK(shoulder, wristTarget, B.upperArm, B.forearm, 1);
    const handTip: Vec2 = { x: armIK.end.x + B.hand + 3, y: floorY };

    return {
      viewMode: 'side',
      facing: 1,
      head,
      neck,
      shoulder,
      hip,
      elbow: armIK.mid,
      wrist: armIK.end,
      handTip,
      knee,
      ankle,
      toe,
      heel,
      farShoulder: { x: shoulder.x + 5, y: shoulder.y - 2 },
      farHip: { x: hip.x + 5, y: hip.y - 2 },
      farElbow: { x: armIK.mid.x + 5, y: armIK.mid.y - 3 },
      farWrist: { x: armIK.end.x + 6, y: armIK.end.y - 2 },
      farKnee: { x: knee.x + 6, y: knee.y - 2 },
      farAnkle: { x: ankle.x + 6, y: ankle.y - 2 },
      farToe: { x: toe.x + 6, y: toe.y - 2 },
      farHeel: { x: heel.x + 6, y: heel.y - 2 },
      guideLine: { from: hip, to: shoulder, label: 'Eixo vertical' },
      shadow: {
        cx: 158,
        rx: lerp(60, 68, value),
        y: floorY + 2,
        opacity: lerp(0.14, 0.22, value),
      },
      phaseTag,
      phasePercent: value,
    };
  }

  if (patternId === 'paralelas_triceps') {
    // Bench dips: hands planted on oak bench top at y = 122, x = 132; feet planted at x = 198
    const wristTarget: Vec2 = { x: 132, y: 122 };
    const ankleTarget: Vec2 = { x: 198, y: floorY - B.ankleHeight };
    const heel: Vec2 = { x: 192, y: floorY };
    const toe: Vec2 = { x: 210, y: floorY };

    const drop = lerp(0, 26, value);
    const hip: Vec2 = { x: 152 + lerp(0, 3, value), y: 120 + drop };
    const torsoTiltRad = (lerp(82, 78, value) * Math.PI) / 180;
    const shoulder: Vec2 = {
      x: hip.x - Math.cos(torsoTiltRad) * B.torso,
      y: hip.y - Math.sin(torsoTiltRad) * B.torso,
    };
    const neck: Vec2 = { x: shoulder.x + 1, y: shoulder.y - B.neck };
    const head: Vec2 = { x: neck.x + 2, y: neck.y - B.headRadius };

    // Arm bends backward over bench (+1); legs bend forward/upward (-1)
    const armIK = solveTwoBoneIK(shoulder, wristTarget, B.upperArm, B.forearm, 1);
    const legIK = solveTwoBoneIK(hip, ankleTarget, B.thigh, B.shin, -1);
    const handTip: Vec2 = { x: armIK.end.x + 6, y: armIK.end.y + 6 };

    return {
      viewMode: 'side',
      facing: 1,
      head,
      neck,
      shoulder,
      hip,
      elbow: armIK.mid,
      wrist: armIK.end,
      handTip,
      knee: legIK.mid,
      ankle: legIK.end,
      toe,
      heel,
      farShoulder: { x: shoulder.x - 5, y: shoulder.y - 2 },
      farHip: { x: hip.x + 4, y: hip.y - 2 },
      farElbow: { x: armIK.mid.x - 5, y: armIK.mid.y - 3 },
      farWrist: { x: armIK.end.x - 5, y: armIK.end.y - 2 },
      farKnee: { x: legIK.mid.x + 6, y: legIK.mid.y - 3 },
      farAnkle: { x: legIK.end.x + 6, y: legIK.end.y - 2 },
      farToe: { x: toe.x + 6, y: toe.y - 2 },
      farHeel: { x: heel.x + 6, y: heel.y - 2 },
      shadow: {
        cx: 176,
        rx: 42,
        y: floorY + 2,
        opacity: lerp(0.14, 0.22, value),
      },
      phaseTag,
      phasePercent: value,
    };
  }

  if (patternId === 'puxar_horizontal') {
    // Inverted row underneath solid oak table (underside at y = 92)
    // Heels anchored at x = 96; straight body pivots UP from 14° (extended) to 34° (chest to table)
    const heel: Vec2 = { x: 94, y: floorY };
    const ankle: Vec2 = { x: 96, y: floorY - 7 };
    const toe: Vec2 = { x: 92, y: floorY - 17 };

    const pullVal = value;
    const bodyRad = (lerp(14, 30, pullVal) * Math.PI) / 180;
    const cosB = Math.cos(bodyRad);
    const sinB = Math.sin(bodyRad);

    const knee: Vec2 = {
      x: ankle.x + cosB * B.shin,
      y: ankle.y - sinB * B.shin,
    };
    const hip: Vec2 = {
      x: knee.x + cosB * B.thigh,
      y: knee.y - sinB * B.thigh,
    };
    const shoulder: Vec2 = {
      x: hip.x + cosB * B.torso,
      y: hip.y - sinB * B.torso,
    };
    const neck: Vec2 = {
      x: shoulder.x + cosB * B.neck,
      y: shoulder.y - sinB * B.neck,
    };
    const head: Vec2 = {
      x: neck.x + cosB * B.headRadius,
      y: neck.y - sinB * B.headRadius,
    };

    // Hands firmly gripping table underside at y = 92
    const wristTarget: Vec2 = { x: 202, y: 92 };
    const armIK = solveTwoBoneIK(shoulder, wristTarget, B.upperArm, B.forearm, 1);
    const handTip: Vec2 = { x: armIK.end.x, y: armIK.end.y - 6 };

    return {
      viewMode: 'side',
      facing: 0,
      head,
      neck,
      shoulder,
      hip,
      elbow: armIK.mid,
      wrist: armIK.end,
      handTip,
      knee,
      ankle,
      toe,
      heel,
      farShoulder: { x: shoulder.x + 5, y: shoulder.y - 2 },
      farHip: { x: hip.x + 5, y: hip.y - 2 },
      farElbow: { x: armIK.mid.x + 6, y: armIK.mid.y - 3 },
      farWrist: { x: armIK.end.x + 7, y: armIK.end.y },
      farKnee: { x: knee.x + 5, y: knee.y - 2 },
      farAnkle: { x: ankle.x + 5, y: ankle.y - 2 },
      farToe: { x: toe.x + 5, y: toe.y - 2 },
      farHeel: { x: heel.x + 5, y: heel.y - 2 },
      guideLine: { from: ankle, to: shoulder, label: 'Corpo reto' },
      shadow: {
        cx: 162,
        rx: 64,
        y: floorY + 2,
        opacity: lerp(0.22, 0.12, pullVal),
      },
      phaseTag,
      phasePercent: pullVal,
    };
  }

  if (patternId === 'puxar_vertical') {
    // Textbook FRONT-VIEW pull-up hanging from doorway bar at y = 34.
    // Symmetric exact 2-bone IK on left & right arms keeps forearms vertical as chin clears the bar!
    // Knees are bent backward (3D foreshortened calves with crossed ankles) for realistic doorway clearance.
    const barY = 34;
    const cx = 180;
    const shY = lerp(79, 41, value);
    const shoulderHalf = 13;
    const hipHalf = 8.5;

    const leftShoulder: Vec2 = { x: cx - shoulderHalf, y: shY };
    const rightShoulder: Vec2 = { x: cx + shoulderHalf, y: shY };
    const leftWristTarget: Vec2 = { x: cx - 27, y: barY + 1 };
    const rightWristTarget: Vec2 = { x: cx + 27, y: barY + 1 };

    // Left arm bends down & out (-1), right arm mirrors (+1)
    const leftArm = solveTwoBoneIK(leftShoulder, leftWristTarget, B.upperArm, B.forearm, -1);
    const rightArm = solveTwoBoneIK(rightShoulder, rightWristTarget, B.upperArm, B.forearm, 1);

    const shoulder: Vec2 = { x: cx, y: shY };
    const neck: Vec2 = { x: cx, y: shY - B.neck };
    const head: Vec2 = { x: cx, y: neck.y - B.headRadius };
    const hip: Vec2 = { x: cx, y: shY + B.torso };

    // Thighs hang cleanly while calves bend backward into depth (crossed ankles behind knees)
    const leftHip: Vec2 = { x: cx - hipHalf, y: hip.y };
    const rightHip: Vec2 = { x: cx + hipHalf, y: hip.y };
    const kneeSpread = lerp(8.5, 10, value);
    const leftKnee: Vec2 = { x: cx - kneeSpread, y: leftHip.y + B.thigh };
    const rightKnee: Vec2 = { x: cx + kneeSpread, y: rightHip.y + B.thigh };

    // Foreshortened tucked lower legs crossing behind knees (clears floor cleanly)
    const leftAnkle: Vec2 = { x: cx + 4, y: leftKnee.y + 7 };
    const rightAnkle: Vec2 = { x: cx - 4, y: rightKnee.y + 7 };

    const heel: Vec2 = { x: leftAnkle.x - 3, y: leftAnkle.y + 3 };
    const toe: Vec2 = { x: leftAnkle.x + 5, y: leftAnkle.y + 4 };

    return {
      viewMode: 'front',
      facing: 0,
      head,
      neck,
      shoulder: leftShoulder,
      hip: leftHip,
      elbow: leftArm.mid,
      wrist: leftArm.end,
      handTip: { x: leftArm.end.x, y: barY - 4 },
      knee: leftKnee,
      ankle: leftAnkle,
      toe,
      heel,
      front: {
        leftShoulder,
        rightShoulder,
        leftElbow: leftArm.mid,
        rightElbow: rightArm.mid,
        leftWrist: leftArm.end,
        rightWrist: rightArm.end,
        leftHip,
        rightHip,
        leftKnee,
        rightKnee,
        leftAnkle,
        rightAnkle,
      },
      guideLine: {
        from: { x: cx - 56, y: barY },
        to: { x: cx + 56, y: barY },
        label: 'Queixo acima da barra',
      },
      shadow: {
        cx,
        rx: lerp(26, 20, value),
        y: floorY + 2,
        opacity: lerp(0.14, 0.08, value),
      },
      phaseTag,
      phasePercent: value,
    };
  }

  if (patternId === 'agachar') {
    // Textbook bodyweight squat: feet flat & anchored on floor, COM stays strictly over midfoot!
    const ankleTarget: Vec2 = { x: 172, y: floorY - B.ankleHeight };
    const heel: Vec2 = { x: 165, y: floorY };
    const toe: Vec2 = { x: 185, y: floorY };

    const hip: Vec2 = {
      x: lerp(170, 134, value),
      y: lerp(ankleTarget.y - (B.thigh + B.shin) + 1.5, ankleTarget.y - 31, value),
    };

    const legIK = solveTwoBoneIK(hip, ankleTarget, B.thigh, B.shin, -1);

    const torsoLeanRad = (lerp(4, 28, value) * Math.PI) / 180;
    const shoulder: Vec2 = {
      x: hip.x + Math.sin(torsoLeanRad) * B.torso,
      y: hip.y - Math.cos(torsoLeanRad) * B.torso,
    };
    const neck: Vec2 = {
      x: shoulder.x + Math.sin(torsoLeanRad * 0.7) * B.neck,
      y: shoulder.y - Math.cos(torsoLeanRad * 0.7) * B.neck,
    };
    const head: Vec2 = {
      x: neck.x + Math.sin(torsoLeanRad * 0.5) * B.headRadius,
      y: neck.y - Math.cos(torsoLeanRad * 0.5) * B.headRadius,
    };

    // Counterbalance arms smoothly swing forward as hips descend
    const armAngleRad = (lerp(76, 4, value) * Math.PI) / 180;
    const elbow: Vec2 = {
      x: shoulder.x + Math.cos(armAngleRad) * B.upperArm,
      y: shoulder.y + Math.sin(armAngleRad) * B.upperArm,
    };
    const wrist: Vec2 = {
      x: elbow.x + Math.cos(armAngleRad - lerp(0.08, 0.02, value)) * B.forearm,
      y: elbow.y + Math.sin(armAngleRad - lerp(0.08, 0.02, value)) * B.forearm,
    };
    const handTip: Vec2 = {
      x: wrist.x + Math.cos(armAngleRad) * B.hand,
      y: wrist.y + Math.sin(armAngleRad) * B.hand,
    };

    return {
      viewMode: 'side',
      facing: 1,
      head,
      neck,
      shoulder,
      hip,
      elbow,
      wrist,
      handTip,
      knee: legIK.mid,
      ankle: legIK.end,
      toe,
      heel,
      farShoulder: { x: shoulder.x + 5, y: shoulder.y - 2 },
      farHip: { x: hip.x + 5, y: hip.y - 2 },
      farElbow: { x: elbow.x + 5, y: elbow.y - 3 },
      farWrist: { x: wrist.x + 6, y: wrist.y - 3 },
      farKnee: { x: legIK.mid.x + 6, y: legIK.mid.y - 2 },
      farAnkle: { x: legIK.end.x + 6, y: legIK.end.y - 2 },
      farToe: { x: toe.x + 6, y: toe.y - 2 },
      farHeel: { x: heel.x + 6, y: heel.y - 2 },
      guideLine: {
        from: { x: 173, y: 34 },
        to: { x: 173, y: floorY },
        label: 'Centro de massa',
      },
      shadow: {
        cx: 172,
        rx: lerp(22, 34, value),
        y: floorY + 2,
        opacity: lerp(0.16, 0.24, value),
      },
      phaseTag,
      phasePercent: value,
    };
  }

  if (patternId === 'dobradica_posterior') {
    // Supine glute bridge: head & upper back flat on mat, shins nearly vertical at top,
    // shoulders-hips-knees form a laser-straight diagonal at peak contraction!
    const shoulder: Vec2 = { x: 122, y: floorY - 7 };
    const neck: Vec2 = { x: shoulder.x - B.neck, y: floorY - 8 };
    const head: Vec2 = { x: neck.x - B.headRadius, y: floorY - 10 };

    const ankleTarget: Vec2 = { x: 198, y: floorY - B.ankleHeight };
    const heel: Vec2 = { x: 193, y: floorY };
    const toe: Vec2 = { x: 211, y: floorY };

    const bridgeRad = (lerp(2, 26.5, value) * Math.PI) / 180;
    const hip: Vec2 = {
      x: shoulder.x + Math.cos(bridgeRad) * B.torso,
      y: shoulder.y - Math.sin(bridgeRad) * B.torso,
    };

    const legIK = solveTwoBoneIK(hip, ankleTarget, B.thigh, B.shin, -1);

    const elbow: Vec2 = { x: shoulder.x + B.upperArm, y: floorY - 4 };
    const wrist: Vec2 = { x: elbow.x + B.forearm, y: floorY - 3 };
    const handTip: Vec2 = { x: wrist.x + B.hand, y: floorY - 2 };

    return {
      viewMode: 'side',
      facing: 0,
      head,
      neck,
      shoulder,
      hip,
      elbow,
      wrist,
      handTip,
      knee: legIK.mid,
      ankle: legIK.end,
      toe,
      heel,
      farHip: { x: hip.x + 5, y: hip.y - 2 },
      farKnee: { x: legIK.mid.x + 6, y: legIK.mid.y - 3 },
      farAnkle: { x: legIK.end.x + 6, y: legIK.end.y - 2 },
      farToe: { x: toe.x + 6, y: toe.y - 2 },
      farHeel: { x: heel.x + 6, y: heel.y - 2 },
      guideLine: { from: shoulder, to: legIK.mid, label: 'Alinhamento ponte' },
      shadow: { cx: 162, rx: 64, y: floorY + 2, opacity: 0.16 },
      phaseTag,
      phasePercent: value,
    };
  }

  if (patternId === 'panturrilha') {
    // Standing calf raise on solid oak step (top of step at y = 160, height 12px above floor 172)
    // Ball of foot anchored on step edge at (176, 160); full dorsiflexion (-16°) to plantarflexion (+36°)
    const stepTopY = 160;
    const toe: Vec2 = { x: 185, y: stepTopY };
    const pivot: Vec2 = { x: 176, y: stepTopY };

    const footRad = (lerp(-16, 36, value) * Math.PI) / 180;
    const heelDist = 14;
    const heel: Vec2 = {
      x: pivot.x - Math.cos(footRad) * heelDist,
      y: pivot.y - Math.sin(footRad) * heelDist,
    };
    const ankle: Vec2 = {
      x: pivot.x - Math.cos(footRad) * 9,
      y: pivot.y - Math.sin(footRad) * 9 - 4,
    };

    const knee: Vec2 = { x: ankle.x + 1, y: ankle.y - B.shin };
    const hip: Vec2 = { x: knee.x - 1, y: knee.y - B.thigh };
    const shoulder: Vec2 = { x: hip.x + 1, y: hip.y - B.torso };
    const neck: Vec2 = { x: shoulder.x, y: shoulder.y - B.neck };
    const head: Vec2 = { x: neck.x, y: neck.y - B.headRadius };

    // Fingertips lightly touching studio wall at x = 228 for balance
    const wristTarget: Vec2 = { x: 218, y: shoulder.y + 8 };
    const armIK = solveTwoBoneIK(shoulder, wristTarget, B.upperArm, B.forearm, 1);
    const handTip: Vec2 = { x: armIK.end.x + 8, y: armIK.end.y - 1 };

    // Non-working far leg tucked gently behind ankle (single-leg calf raise)
    const farKnee: Vec2 = { x: hip.x - 5, y: hip.y + B.thigh - 2 };
    const farAnkle: Vec2 = { x: farKnee.x - 16, y: farKnee.y + 24 };
    const farToe: Vec2 = { x: farAnkle.x - 4, y: farAnkle.y + 8 };
    const farHeel: Vec2 = { x: farAnkle.x - 8, y: farAnkle.y + 2 };

    return {
      viewMode: 'side',
      facing: 1,
      head,
      neck,
      shoulder,
      hip,
      elbow: armIK.mid,
      wrist: armIK.end,
      handTip,
      knee,
      ankle,
      toe,
      heel,
      farHip: { x: hip.x - 4, y: hip.y },
      farKnee,
      farAnkle,
      farToe,
      farHeel,
      shadow: { cx: 184, rx: 18, y: stepTopY + 1, opacity: 0.16 },
      phaseTag,
      phasePercent: value,
    };
  }

  if (patternId === 'core') {
    // Textbook forearm plank: elbow & forearm stay 100% grounded on mat (y = 169) while
    // subtle scapular protraction / isometric bracing shifts body alignment cleanly.
    const elbow: Vec2 = { x: 200, y: floorY - 3 };
    const wrist: Vec2 = { x: elbow.x + B.forearm, y: floorY - 3 };
    const handTip: Vec2 = { x: wrist.x + B.hand, y: floorY - 2 };

    // Upper arm pivots subtly around grounded elbow (~92° -> 87°, micro tension)
    const upperArmRad = (lerp(-92, -87, value) * Math.PI) / 180;
    const shoulder: Vec2 = {
      x: elbow.x + Math.cos(upperArmRad) * B.upperArm,
      y: elbow.y + Math.sin(upperArmRad) * B.upperArm,
    };

    // Rigid straight spine & legs descend at exact angle so ankle lands on mat height (y = 164)
    const totalBodyLen = B.torso + B.thigh + B.shin; // 115
    const targetAnkleY = floorY - 8;
    const sinP = clamp((targetAnkleY - shoulder.y) / totalBodyLen, 0.05, 0.5);
    const cosP = Math.sqrt(1 - sinP * sinP);

    const hip: Vec2 = {
      x: shoulder.x - cosP * B.torso,
      y: shoulder.y + sinP * B.torso,
    };
    const knee: Vec2 = {
      x: hip.x - cosP * B.thigh,
      y: hip.y + sinP * B.thigh,
    };
    const ankle: Vec2 = {
      x: knee.x - cosP * B.shin,
      y: knee.y + sinP * B.shin,
    };
    const toe: Vec2 = { x: ankle.x, y: floorY };
    const heel: Vec2 = { x: ankle.x - 6, y: floorY - 12 };

    const neck: Vec2 = {
      x: shoulder.x + cosP * B.neck,
      y: shoulder.y - sinP * B.neck,
    };
    const head: Vec2 = {
      x: neck.x + cosP * B.headRadius,
      y: neck.y - sinP * B.headRadius,
    };

    return {
      viewMode: 'side',
      facing: 1,
      head,
      neck,
      shoulder,
      hip,
      elbow,
      wrist,
      handTip,
      knee,
      ankle,
      toe,
      heel,
      farShoulder: { x: shoulder.x + 5, y: shoulder.y - 2 },
      farHip: { x: hip.x + 5, y: hip.y - 2 },
      farElbow: { x: elbow.x + 6, y: elbow.y - 2 },
      farWrist: { x: wrist.x + 6, y: wrist.y - 2 },
      farKnee: { x: knee.x + 5, y: knee.y - 2 },
      farAnkle: { x: ankle.x + 5, y: ankle.y - 2 },
      farToe: { x: toe.x + 5, y: toe.y - 2 },
      farHeel: { x: heel.x + 5, y: heel.y - 2 },
      guideLine: { from: ankle, to: shoulder, label: 'Pelve encaixada' },
      shadow: { cx: 158, rx: 74, y: floorY + 2, opacity: 0.2 },
      phaseTag,
      phasePercent: value,
    };
  }

  // habilidades: Tuck L-sit on wooden parallettes (handle at y = 148, x = 166)
  // Exact 2-bone IK for both arms (pressing straight & locking shoulders down) and tucked legs!
  const wristTarget: Vec2 = { x: 166, y: 148 };
  const armLen = B.upperArm + B.forearm; // 48

  // Shoulders depress upward away from handles as elbows lock out
  const shoulder: Vec2 = {
    x: wristTarget.x - lerp(2, 0, value),
    y: wristTarget.y - armLen + lerp(2.6, 0.3, value),
  };
  const armIK = solveTwoBoneIK(shoulder, wristTarget, B.upperArm, B.forearm, 1);
  const handTip: Vec2 = { x: armIK.end.x, y: armIK.end.y + 5 };

  const neck: Vec2 = { x: shoulder.x + 1, y: shoulder.y - B.neck };
  const head: Vec2 = { x: neck.x + 2, y: neck.y - B.headRadius };

  const hipShiftX = lerp(1, 3, value);
  const hip: Vec2 = {
    x: shoulder.x - hipShiftX,
    y: shoulder.y + Math.sqrt(B.torso * B.torso - hipShiftX * hipShiftX),
  };

  // Feet transition cleanly from resting on the mat (y=167) up into a tight tucked L-sit (y=147)
  const ankleTarget: Vec2 = {
    x: lerp(212, 200, value),
    y: lerp(floorY - B.ankleHeight, 147, value),
  };
  const legIK = solveTwoBoneIK(hip, ankleTarget, B.thigh, B.shin, -1);
  const heel: Vec2 = {
    x: legIK.end.x - 5,
    y: lerp(floorY, legIK.end.y + 4, value),
  };
  const toe: Vec2 = {
    x: legIK.end.x + 11,
    y: lerp(floorY, legIK.end.y + 6, value),
  };

  return {
    viewMode: 'side',
    facing: 1,
    head,
    neck,
    shoulder,
    hip,
    elbow: armIK.mid,
    wrist: armIK.end,
    handTip,
    knee: legIK.mid,
    ankle: legIK.end,
    toe,
    heel,
    farShoulder: { x: shoulder.x - 6, y: shoulder.y - 2 },
    farHip: { x: hip.x - 5, y: hip.y - 2 },
    farElbow: { x: armIK.mid.x - 7, y: armIK.mid.y - 2 },
    farWrist: { x: armIK.end.x - 7, y: armIK.end.y - 2 },
    farKnee: { x: legIK.mid.x - 6, y: legIK.mid.y - 3 },
    farAnkle: { x: legIK.end.x - 6, y: legIK.end.y - 2 },
    farToe: { x: toe.x - 6, y: toe.y - 2 },
    farHeel: { x: heel.x - 6, y: heel.y - 2 },
    guideLine: {
      from: { x: wristTarget.x, y: shoulder.y - 16 },
      to: { x: wristTarget.x, y: wristTarget.y },
      label: 'Braços travados',
    },
    shadow: {
      cx: 184,
      rx: lerp(38, 30, value),
      y: floorY + 2,
      opacity: lerp(0.18, 0.11, value),
    },
    phaseTag,
    phasePercent: value,
  };
}
