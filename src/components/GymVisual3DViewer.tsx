import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  BODY_3D,
  getDefaultVariationId,
  MUSCLE_ACTIVATION_MAP,
  solvePose3D,
  type MuscleGroupId,
  type Pose3D,
  type SideArm3D,
  type SideLeg3D,
  type Vec3,
} from '../lib/gymVisualRig3D';
import type { MovementPatternId } from '../lib/types';

export type CameraPreset = '3/4' | 'lateral' | 'frontal';

interface GymVisual3DViewerProps {
  patternId: MovementPatternId;
  variantId?: string;
  rung?: number;
  progress: number;
  playing: boolean;
  slowMo: boolean;
  cameraPreset: CameraPreset;
  showMuscles: boolean;
  compact?: boolean;
  onProgressTick?: (nextProgress: number) => void;
  ariaLabel: string;
}

// Reusable math temporaries at module scope (zero GC inside animation loop)
const _vA = new THREE.Vector3();
const _vB = new THREE.Vector3();
const _vDir = new THREE.Vector3();
const _vUp = new THREE.Vector3(0, 1, 0);
const _vRight = new THREE.Vector3();
const _vFwd = new THREE.Vector3();
const _vOrtho = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();

function detectSoftwareWebGL(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Generates an anatomically contoured LatheGeometry normalized to Y ∈ [0, 1]
 * so orientSegment() can stretch/orient it strictly between any two 3D joints.
 */
function createContouredLathe(
  profile: Array<[number, number]>,
  segments = 18
): THREE.LatheGeometry {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.001, r), y));
  const geo = new THREE.LatheGeometry(pts, segments);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Creates a soft radial ground contact shadow texture procedurally via HTML5 Canvas.
 */
function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.48
    );
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.55)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.22)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Orients a normalized Y=[0..1] mesh/group from joint A to joint B with an explicit
 * forward reference vector so anterior/posterior muscle bellies never twist!
 */
function orientSegment3D(
  obj: THREE.Object3D,
  a: Vec3,
  b: Vec3,
  forwardRef: Vec3,
  scaleXZ = 1
): void {
  _vA.set(a.x, a.y, a.z);
  _vB.set(b.x, b.y, b.z);
  _vDir.subVectors(_vB, _vA);
  const len = _vDir.length();
  if (len < 1e-5) return;
  _vDir.divideScalar(len); // Local +Y axis

  // Orthogonalize forwardRef (+Z) against +Y
  _vFwd.set(forwardRef.x, forwardRef.y, forwardRef.z);
  const dot = _vFwd.dot(_vDir);
  _vFwd.addScaledVector(_vDir, -dot);
  if (_vFwd.lengthSq() < 1e-5) {
    _vFwd.set(0, 0, 1);
    _vFwd.addScaledVector(_vDir, -_vFwd.dot(_vDir));
  }
  _vFwd.normalize();

  // Right-handed basis: X = Y × Z
  _vRight.crossVectors(_vDir, _vFwd).normalize();
  _vOrtho.crossVectors(_vRight, _vDir).normalize();

  _mat4.makeBasis(_vRight, _vDir, _vOrtho);
  _quat.setFromRotationMatrix(_mat4);

  obj.position.copy(_vA);
  obj.quaternion.copy(_quat);
  obj.scale.set(scaleXZ, len, scaleXZ);
}

/**
 * Orients a bone-anchored group (scale 1,1,1) using explicit Y-axis (up) and Z-axis (forward).
 */
function orientFrame3D(
  obj: THREE.Object3D,
  origin: Vec3,
  upAxis: Vec3,
  forwardAxis: Vec3
): void {
  _vDir.set(upAxis.x, upAxis.y, upAxis.z).normalize();
  _vFwd.set(forwardAxis.x, forwardAxis.y, forwardAxis.z);
  _vFwd.addScaledVector(_vDir, -_vFwd.dot(_vDir));
  if (_vFwd.lengthSq() < 1e-5) _vFwd.set(0, 0, 1);
  _vFwd.normalize();
  _vRight.crossVectors(_vDir, _vFwd).normalize();
  _vOrtho.crossVectors(_vRight, _vDir).normalize();

  _mat4.makeBasis(_vRight, _vDir, _vOrtho);
  _quat.setFromRotationMatrix(_mat4);
  obj.position.set(origin.x, origin.y, origin.z);
  obj.quaternion.copy(_quat);
}

interface LimbRigMeshes {
  upper: THREE.Group;
  joint: THREE.Mesh;
  lower: THREE.Group;
  endCap: THREE.Group;
}

interface GymVisualRigHandle {
  root: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftShoulderCap: THREE.Mesh;
  rightShoulderCap: THREE.Mesh;
  leftArm: LimbRigMeshes;
  rightArm: LimbRigMeshes;
  leftLeg: LimbRigMeshes;
  rightLeg: LimbRigMeshes;
  muscleMaterials: Record<MuscleGroupId, THREE.MeshStandardMaterial>;
  shadowPlane: THREE.Mesh;
  propsByKey: Record<string, THREE.Group>;
  dynamicTowelLeft: THREE.Group;
  dynamicTowelRight: THREE.Group;
  dynamicBackpack: THREE.Group;
  matMesh: THREE.Mesh;
  dispose: () => void;
}

function buildGymVisualSceneContent(
  scene: THREE.Scene,
  isSoftwareGl: boolean
): GymVisualRigHandle {
  const disposables: Array<{ dispose: () => void }> = [];
  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.push(m);
    return m;
  };

  // Shared GymVisual PBR Materials (sculpted cool pewter-silver clay pops crisply on studio white)
  const neutralBodyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xb4bfce,
      roughness: 0.48,
      metalness: 0.08,
    })
  );
  const jointMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xa4b0c0,
      roughness: 0.5,
      metalness: 0.07,
    })
  );
  const shortsMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.78,
      metalness: 0.02,
    })
  );
  const hairMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x263140,
      roughness: 0.72,
      metalness: 0.04,
    })
  );
  const shoeUpperMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.65,
      metalness: 0.05,
    })
  );
  const shoeSoleMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.5,
      metalness: 0.02,
    })
  );
  const oakMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xc99c6b,
      roughness: 0.56,
      metalness: 0.03,
    })
  );
  const darkSteelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x273240,
      roughness: 0.34,
      metalness: 0.68,
    })
  );
  const doorFrameMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe5eaf0,
      roughness: 0.75,
      metalness: 0.02,
    })
  );
  const exerciseMatMaterial = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x283342,
      roughness: 0.86,
      metalness: 0.02,
    })
  );

  // Per-muscle-group dynamic materials so primary/secondary highlights pulse cleanly!
  const muscleIds: MuscleGroupId[] = [
    'pectorals',
    'delts',
    'biceps',
    'triceps',
    'forearms',
    'lats',
    'abs',
    'glutes',
    'quads',
    'hamstrings',
    'calves',
  ];
  const muscleMaterials = {} as Record<MuscleGroupId, THREE.MeshStandardMaterial>;
  for (const id of muscleIds) {
    muscleMaterials[id] = trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xb4bfce,
        emissive: 0x000000,
        emissiveIntensity: 0,
        roughness: 0.44,
        metalness: 0.07,
      })
    );
  }

  const root = new THREE.Group();
  scene.add(root);

  // Clean GymVisual infinite studio floor
  const floorGeo = trackGeo(new THREE.CircleGeometry(9, 48));
  floorGeo.rotateX(-Math.PI / 2);
  const floorMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xf7f9fc,
      roughness: 0.72,
      metalness: 0.02,
    })
  );
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = !isSoftwareGl;
  scene.add(floorMesh);

  // Soft dynamic radial contact shadow directly beneath athlete
  const shadowTex = createContactShadowTexture();
  disposables.push(shadowTex);
  const shadowPlane = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(2, 2)),
    trackMat(
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        opacity: 0.3,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    )
  );
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.y = 0.002;
  scene.add(shadowPlane);

  // Matte charcoal exercise mat (top strictly at y = BODY_3D.matY = 0.016)
  const matGeo = trackGeo(new THREE.BoxGeometry(2.05, BODY_3D.matY, 0.84));
  const matMesh = new THREE.Mesh(matGeo, exerciseMatMaterial);
  matMesh.position.set(0.0, BODY_3D.matY / 2, 0);
  matMesh.receiveShadow = !isSoftwareGl;
  scene.add(matMesh);

  const enableShadows = (obj: THREE.Object3D) => {
    if (isSoftwareGl) return;
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  };

  // =========================================================================
  // SCULPTED 3D TORSO + ANATOMICAL MUSCLE GROUPS (Pecs, Lats, Abs, Glutes)
  // =========================================================================
  const torsoGroup = new THREE.Group();
  root.add(torsoGroup);

  // Core sculpted athletic ribcage & waist lathe (Y = 0 pelvis -> Y = 0.52 chest)
  const torsoLathe = trackGeo(
    createContouredLathe(
      [
        [0.01, -0.02],
        [0.125, 0.02],
        [0.132, 0.08],
        [0.122, 0.18],
        [0.135, 0.28],
        [0.158, 0.40],
        [0.168, 0.48],
        [0.125, 0.535],
        [0.055, 0.555],
      ],
      22
    )
  );
  const torsoCoreMesh = new THREE.Mesh(torsoLathe, neutralBodyMat);
  // Elliptical chest depth vs shoulder breadth (wider in X, athletic depth in Z)
  torsoCoreMesh.scale.set(1.16, 1.0, 0.78);
  torsoGroup.add(torsoCoreMesh);

  // Dark compression shorts pelvis brief wrapping lower pelvis
  const shortsPelvisGeo = trackGeo(
    createContouredLathe(
      [
        [0.01, -0.04],
        [0.125, -0.01],
        [0.142, 0.06],
        [0.136, 0.14],
        [0.124, 0.165],
      ],
      20
    )
  );
  const shortsPelvis = new THREE.Mesh(shortsPelvisGeo, shortsMat);
  shortsPelvis.scale.set(1.14, 1.0, 0.84);
  torsoGroup.add(shortsPelvis);

  // Sculpted Pectoralis Major pads (left & right chest, +Z is forward)
  const pecGeo = trackGeo(new THREE.SphereGeometry(0.082, 16, 14));
  for (const side of [-1, 1] as const) {
    const pec = new THREE.Mesh(pecGeo, muscleMaterials.pectorals);
    pec.scale.set(1.08, 0.76, 0.42);
    pec.position.set(side * 0.078, 0.415, 0.105);
    pec.rotation.y = side * 0.24;
    torsoGroup.add(pec);
  }

  // Sculpted Rectus Abdominis (6-pack plates) + Lateral Obliques (flush anatomical contour)
  const abPlateGeo = trackGeo(new THREE.SphereGeometry(0.036, 12, 10));
  for (let row = 0; row < 3; row++) {
    for (const side of [-1, 1] as const) {
      const ab = new THREE.Mesh(abPlateGeo, muscleMaterials.abs);
      ab.scale.set(0.96, 1.02, 0.28);
      ab.position.set(side * 0.036, 0.19 + row * 0.066, 0.095 + row * 0.004);
      torsoGroup.add(ab);
    }
  }
  const obliqueGeo = trackGeo(new THREE.CapsuleGeometry(0.030, 0.13, 6, 10));
  for (const side of [-1, 1] as const) {
    const ob = new THREE.Mesh(obliqueGeo, muscleMaterials.abs);
    ob.position.set(side * 0.114, 0.235, 0.044);
    ob.rotation.z = side * -0.1;
    ob.scale.set(0.72, 1, 0.82);
    torsoGroup.add(ob);
  }

  // Sculpted Latissimus Dorsi wings & Upper Back / Trapezius (-Z is posterior)
  const latGeo = trackGeo(new THREE.SphereGeometry(0.095, 16, 14));
  for (const side of [-1, 1] as const) {
    const lat = new THREE.Mesh(latGeo, muscleMaterials.lats);
    lat.scale.set(0.92, 1.38, 0.42);
    lat.position.set(side * 0.114, 0.365, -0.072);
    lat.rotation.z = side * -0.22;
    lat.rotation.y = side * -0.45;
    torsoGroup.add(lat);
  }
  // Upper back / trapezius diamond
  const trapGeo = trackGeo(new THREE.SphereGeometry(0.095, 16, 12));
  const trap = new THREE.Mesh(trapGeo, muscleMaterials.lats);
  trap.scale.set(1.22, 0.80, 0.40);
  trap.position.set(0, 0.475, -0.084);
  torsoGroup.add(trap);

  // Sculpted Gluteus Maximus contours (flush anatomical curve over posterior pelvis)
  const gluteGeo = trackGeo(new THREE.SphereGeometry(0.082, 16, 14));
  for (const side of [-1, 1] as const) {
    const glute = new THREE.Mesh(gluteGeo, muscleMaterials.glutes);
    glute.scale.set(0.98, 1.0, 0.48);
    glute.position.set(side * 0.064, 0.045, -0.070);
    torsoGroup.add(glute);
  }

  // =========================================================================
  // SCULPTED HEAD & NECK (facing +Z locally)
  // =========================================================================
  const headGroup = new THREE.Group();
  root.add(headGroup);

  const neckGeo = trackGeo(
    createContouredLathe(
      [
        [0.056, -0.02],
        [0.048, 0.04],
        [0.046, 0.10],
      ],
      14
    )
  );
  const neckMesh = new THREE.Mesh(neckGeo, neutralBodyMat);
  headGroup.add(neckMesh);

  // Cranium + sculpted jaw + subtle nose ridge + sleek dark matte hair crown
  const craniumGeo = trackGeo(new THREE.SphereGeometry(0.098, 22, 18));
  const cranium = new THREE.Mesh(craniumGeo, neutralBodyMat);
  cranium.scale.set(0.86, 1.05, 0.96);
  cranium.position.set(0, 0.175, 0.008);
  headGroup.add(cranium);

  const jawGeo = trackGeo(new THREE.SphereGeometry(0.068, 16, 12));
  const jaw = new THREE.Mesh(jawGeo, neutralBodyMat);
  jaw.scale.set(0.84, 0.9, 0.92);
  jaw.position.set(0, 0.125, 0.032);
  headGroup.add(jaw);

  // Subtle sculpted nose bridge indicating true gaze direction (+Z)
  const noseGeo = trackGeo(new THREE.ConeGeometry(0.016, 0.038, 10));
  const nose = new THREE.Mesh(noseGeo, neutralBodyMat);
  nose.rotation.x = Math.PI / 2.2;
  nose.position.set(0, 0.162, 0.102);
  headGroup.add(nose);

  // Sleek dark hair cap covering top & back of cranium
  const hairGeo = trackGeo(
    new THREE.SphereGeometry(0.102, 20, 14, 0, Math.PI * 2, 0, Math.PI * 0.56)
  );
  const hairMesh = new THREE.Mesh(hairGeo, hairMat);
  hairMesh.scale.set(0.88, 1.04, 0.98);
  hairMesh.position.set(0, 0.182, -0.006);
  hairMesh.rotation.x = -0.34;
  headGroup.add(hairMesh);

  // =========================================================================
  // SCULPTED DELTOID SHOULDER CAPS
  // =========================================================================
  const deltGeo = trackGeo(new THREE.SphereGeometry(0.061, 16, 14));
  const leftShoulderCap = new THREE.Mesh(deltGeo, muscleMaterials.delts);
  leftShoulderCap.scale.set(0.95, 1.1, 0.95);
  root.add(leftShoulderCap);

  const rightShoulderCap = new THREE.Mesh(deltGeo, muscleMaterials.delts);
  rightShoulderCap.scale.set(0.95, 1.1, 0.95);
  root.add(rightShoulderCap);

  // =========================================================================
  // SCULPTED BILATERAL ARMS (Upper Arm + Biceps + Triceps + Forearm + Hand)
  // =========================================================================
  const upperArmLathe = trackGeo(
    createContouredLathe(
      [
        [0.048, 0.0],
        [0.052, 0.25],
        [0.049, 0.55],
        [0.042, 0.85],
        [0.036, 1.0],
      ],
      16
    )
  );
  const forearmLathe = trackGeo(
    createContouredLathe(
      [
        [0.036, 0.0],
        [0.044, 0.22],
        [0.039, 0.52],
        [0.030, 0.82],
        [0.026, 1.0],
      ],
      16
    )
  );
  const bicepGeo = trackGeo(new THREE.SphereGeometry(0.038, 12, 10));
  const tricepGeo = trackGeo(new THREE.SphereGeometry(0.038, 12, 10));
  const elbowSphereGeo = trackGeo(new THREE.SphereGeometry(0.039, 12, 10));
  const palmGeo = trackGeo(new THREE.BoxGeometry(0.048, 0.085, 0.028));
  const thumbGeo = trackGeo(new THREE.CapsuleGeometry(0.011, 0.025, 4, 8));

  const buildArmRig = (): LimbRigMeshes => {
    const upper = new THREE.Group();
    const upperBase = new THREE.Mesh(upperArmLathe, neutralBodyMat);
    upper.add(upperBase);

    // Anterior Biceps belly (+Z in segment frame points toward elbow bend = anterior)
    const biceps = new THREE.Mesh(bicepGeo, muscleMaterials.biceps);
    biceps.scale.set(0.92, 5.2, 0.78);
    biceps.position.set(0, 0.50, 0.030);
    upper.add(biceps);

    // Posterior Triceps horseshoe (-Z in segment frame = back of upper arm)
    const triceps = new THREE.Mesh(tricepGeo, muscleMaterials.triceps);
    triceps.scale.set(0.94, 5.4, 0.78);
    triceps.position.set(0, 0.45, -0.030);
    upper.add(triceps);

    const joint = new THREE.Mesh(elbowSphereGeo, jointMat);

    const lower = new THREE.Group();
    const forearmMesh = new THREE.Mesh(forearmLathe, muscleMaterials.forearms);
    lower.add(forearmMesh);

    const endCap = new THREE.Group();
    const palm = new THREE.Mesh(palmGeo, neutralBodyMat);
    palm.position.set(0, 0.042, 0);
    endCap.add(palm);
    const thumb = new THREE.Mesh(thumbGeo, neutralBodyMat);
    thumb.position.set(0.028, 0.03, 0.012);
    thumb.rotation.z = -0.45;
    endCap.add(thumb);

    root.add(upper, joint, lower, endCap);
    return { upper, joint, lower, endCap };
  };

  const leftArm = buildArmRig();
  const rightArm = buildArmRig();

  // =========================================================================
  // SCULPTED BILATERAL LEGS (Shorts + Thigh + Quads + Hamstrings + Calves + Sneakers)
  // =========================================================================
  const thighLathe = trackGeo(
    createContouredLathe(
      [
        [0.078, 0.0],
        [0.086, 0.22],
        [0.080, 0.52],
        [0.064, 0.84],
        [0.054, 1.0],
      ],
      18
    )
  );
  const shortsLegLathe = trackGeo(
    createContouredLathe(
      [
        [0.084, -0.04],
        [0.092, 0.16],
        [0.087, 0.40],
        [0.079, 0.46],
      ],
      18
    )
  );
  const shinLathe = trackGeo(
    createContouredLathe(
      [
        [0.053, 0.0],
        [0.060, 0.24],
        [0.052, 0.54],
        [0.037, 0.86],
        [0.034, 1.0],
      ],
      16
    )
  );
  const quadGeo = trackGeo(new THREE.SphereGeometry(0.055, 14, 12));
  const hamGeo = trackGeo(new THREE.SphereGeometry(0.052, 14, 12));
  const calfGeo = trackGeo(new THREE.SphereGeometry(0.048, 14, 12));
  const kneeSphereGeo = trackGeo(new THREE.SphereGeometry(0.055, 14, 12));
  const shoeUpperGeo = trackGeo(new THREE.BoxGeometry(0.092, 0.062, 0.22));
  const shoeToeGeo = trackGeo(new THREE.SphereGeometry(0.046, 12, 10));
  const shoeSoleGeo = trackGeo(new THREE.BoxGeometry(0.098, 0.022, 0.235));

  const buildLegRig = (): LimbRigMeshes => {
    const upper = new THREE.Group();
    const thighBase = new THREE.Mesh(thighLathe, neutralBodyMat);
    upper.add(thighBase);

    // Compression shorts leg sleeve covering upper 45% of thigh
    const shortsSleeve = new THREE.Mesh(shortsLegLathe, shortsMat);
    upper.add(shortsSleeve);

    // Anterior Quadriceps belly (+Z points forward along knee direction)
    const quad = new THREE.Mesh(quadGeo, muscleMaterials.quads);
    quad.scale.set(0.96, 4.7, 0.56);
    quad.position.set(0, 0.56, 0.039);
    upper.add(quad);

    // Posterior Hamstrings belly (-Z points backward)
    const ham = new THREE.Mesh(hamGeo, muscleMaterials.hamstrings);
    ham.scale.set(0.94, 4.5, 0.54);
    ham.position.set(0, 0.56, -0.037);
    upper.add(ham);

    const joint = new THREE.Mesh(kneeSphereGeo, jointMat);

    const lower = new THREE.Group();
    const shinBase = new THREE.Mesh(shinLathe, neutralBodyMat);
    lower.add(shinBase);

    // Posterior Gastrocnemius Calf belly (-Z points backward)
    const calf = new THREE.Mesh(calfGeo, muscleMaterials.calves);
    calf.scale.set(0.94, 3.8, 0.64);
    calf.position.set(0, 0.34, -0.028);
    lower.add(calf);

    // Sculpted 3D athletic sneaker (local +Y along heel->toe, +Z up toward ankle)
    const endCap = new THREE.Group();
    const upperShoe = new THREE.Mesh(shoeUpperGeo, shoeUpperMat);
    upperShoe.rotation.x = Math.PI / 2;
    upperShoe.position.set(0, 0.11, 0.035);
    endCap.add(upperShoe);

    const toeCap = new THREE.Mesh(shoeToeGeo, shoeUpperMat);
    toeCap.scale.set(1.0, 1.1, 0.65);
    toeCap.position.set(0, 0.21, 0.028);
    endCap.add(toeCap);

    const sole = new THREE.Mesh(shoeSoleGeo, shoeSoleMat);
    sole.rotation.x = Math.PI / 2;
    sole.position.set(0, 0.115, 0.011);
    endCap.add(sole);

    root.add(upper, joint, lower, endCap);
    return { upper, joint, lower, endCap };
  };

  const leftLeg = buildLegRig();
  const rightLeg = buildLegRig();
  enableShadows(root);

  // =========================================================================
  // GROUNDED 3D STUDIO EQUIPMENT PROPS (all 5 object-using patterns × 3 variations)
  // =========================================================================
  const towelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0xe6edf3,
      roughness: 0.85,
      metalness: 0.01,
    })
  );
  const backpackMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x0f3d3e,
      roughness: 0.72,
      metalness: 0.04,
    })
  );
  const backpackPocketMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: 0x1a5354,
      roughness: 0.7,
      metalness: 0.04,
    })
  );
  const bookNavyMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x1e3a5f, roughness: 0.68, metalness: 0.03 })
  );
  const bookTealMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x0f4c5c, roughness: 0.68, metalness: 0.03 })
  );
  const bookRustMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0x8c3b2b, roughness: 0.7, metalness: 0.03 })
  );
  const bookPagesMat = trackMat(
    new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.82, metalness: 0.0 })
  );

  const propsByKey: Record<string, THREE.Group> = {};
  const makePropGroup = (key: string): THREE.Group => {
    const grp = new THREE.Group();
    grp.visible = false;
    scene.add(grp);
    propsByKey[key] = grp;
    return grp;
  };

  // Helper to build a realistic hardcover book stack at (cx, baseY, cz)
  const addBookStack = (
    parent: THREE.Group,
    cx: number,
    baseY: number,
    cz: number,
    widthX: number,
    depthZ: number,
    totalHeight: number
  ) => {
    const mats = [bookNavyMat, bookTealMat, bookRustMat];
    const h = totalHeight / 3;
    for (let i = 0; i < 3; i++) {
      const y = baseY + h * (i + 0.5);
      const shrink = i * 0.012;
      const cover = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(widthX - shrink, h * 0.94, depthZ - shrink)),
        mats[i % mats.length]
      );
      cover.position.set(cx, y, cz);
      parent.add(cover);
      // Cream paper pages peeking along 3 sides
      const pages = new THREE.Mesh(
        trackGeo(new THREE.BoxGeometry(widthX - shrink - 0.016, h * 0.68, depthZ - shrink + 0.004)),
        bookPagesMat
      );
      pages.position.set(cx - 0.005, y, cz);
      parent.add(pages);
    }
  };

  // Helper to build a closed architectural door + jamb at x = 0.72 facing -X
  const addDoorWithAnchor = (parent: THREE.Group, anchorY: number) => {
    const doorPanel = new THREE.Mesh(
      trackGeo(new THREE.BoxGeometry(0.06, 2.24, 0.92)),
      doorFrameMat
    );
    doorPanel.position.set(0.75, 1.12, 0);
    parent.add(doorPanel);
    const jambGeo = trackGeo(new THREE.BoxGeometry(0.11, 2.28, 0.08));
    for (const sz of [-0.46, 0.46]) {
      const jamb = new THREE.Mesh(jambGeo, oakMat);
      jamb.position.set(0.74, 1.14, sz);
      parent.add(jamb);
    }
    const header = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.11, 0.08, 1.0)), oakMat);
    header.position.set(0.74, 2.28, 0);
    parent.add(header);
    // Towel anchor knot pinched tightly in closed doorframe
    const knot = new THREE.Mesh(trackGeo(new THREE.SphereGeometry(0.042, 12, 10)), towelMat);
    knot.position.set(0.69, anchorY, 0);
    parent.add(knot);
  };

  // --- PARALELAS / TRÍCEPS (3 variations) ---
  // 1. Banco ou sofá firme (top y = 0.56, right edge x = -0.18)
  {
    const g = makePropGroup('paralelas_triceps:banco');
    const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.74, 0.065, 0.66)), oakMat);
    seat.position.set(-0.55, 0.5275, 0);
    g.add(seat);
    const legGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.495, 0.055));
    for (const lx of [-0.86, -0.24]) {
      for (const lz of [-0.26, 0.26]) {
        const leg = new THREE.Mesh(legGeo, darkSteelMat);
        leg.position.set(lx, 0.2475, lz);
        g.add(leg);
      }
    }
    const bar = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.62, 0.035, 0.035)), darkSteelMat);
    bar.position.set(-0.55, 0.22, 0);
    g.add(bar);
    enableShadows(g);
  }

  // 2. Duas cadeiras firmes (parallel backrests at z = ±0.27, top rail y = 0.88)
  {
    const g = makePropGroup('paralelas_triceps:duas_cadeiras');
    const chairSeatGeo = trackGeo(new THREE.BoxGeometry(0.44, 0.045, 0.42));
    const backPostGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.88, 0.04));
    const frontLegGeo = trackGeo(new THREE.BoxGeometry(0.04, 0.46, 0.04));
    const topRailGeo = trackGeo(new THREE.BoxGeometry(0.46, 0.055, 0.05));
    const midSlatGeo = trackGeo(new THREE.BoxGeometry(0.40, 0.045, 0.025));

    for (const side of [-1, 1] as const) {
      const backZ = side * 0.27;
      const outerZ = side * 0.66;
      const seatZ = (backZ + outerZ) * 0.5;

      // Seat extending outward away from athlete
      const seat = new THREE.Mesh(chairSeatGeo, oakMat);
      seat.position.set(0, 0.46, seatZ);
      g.add(seat);

      // Sturdy top grip rail facing inward at z = ±0.27, y = 0.855 (top at 0.882)
      const rail = new THREE.Mesh(topRailGeo, oakMat);
      rail.position.set(0, 0.855, backZ);
      g.add(rail);
      const midSlat = new THREE.Mesh(midSlatGeo, oakMat);
      midSlat.position.set(0, 0.68, backZ);
      g.add(midSlat);

      for (const sx of [-0.19, 0.19]) {
        const backPost = new THREE.Mesh(backPostGeo, darkSteelMat);
        backPost.position.set(sx, 0.44, backZ);
        g.add(backPost);
        const frontLeg = new THREE.Mesh(frontLegGeo, darkSteelMat);
        frontLeg.position.set(sx, 0.23, outerZ);
        g.add(frontLeg);
      }
    }
    enableShadows(g);
  }

  // 3. Borda da mesa (Extensão de tríceps inclinada — front edge at x = 0.36, top y = 0.78)
  {
    const g = makePropGroup('paralelas_triceps:mesa_triceps');
    const top = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.76, 0.05, 0.86)), oakMat);
    top.position.set(0.74, 0.755, 0);
    g.add(top);
    const legGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.73, 0.055));
    for (const lx of [0.42, 1.06]) {
      for (const lz of [-0.36, 0.36]) {
        const leg = new THREE.Mesh(legGeo, darkSteelMat);
        leg.position.set(lx, 0.365, lz);
        g.add(leg);
      }
    }
    enableShadows(g);
  }

  // --- PUXAR HORIZONTAL (3 variations) ---
  // 1. Mesa resistente (underside strictly at y = 0.90, right edge x = 0.60)
  {
    const g = makePropGroup('puxar_horizontal:mesa');
    const top = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.42, 0.055, 0.92)), oakMat);
    top.position.set(-0.11, 0.9275, 0);
    g.add(top);
    const legGeo = trackGeo(new THREE.BoxGeometry(0.06, 0.90, 0.06));
    for (const lx of [-0.76, 0.52]) {
      for (const lz of [-0.40, 0.40]) {
        const leg = new THREE.Mesh(legGeo, darkSteelMat);
        leg.position.set(lx, 0.45, lz);
        g.add(leg);
      }
    }
    enableShadows(g);
  }

  // 2. Toalha na porta (door + knot at y = 1.26)
  {
    const g = makePropGroup('puxar_horizontal:toalha_porta');
    addDoorWithAnchor(g, 1.26);
    enableShadows(g);
  }

  // 3. Mochila carregada (static group empty; uses dynamicBackpack mesh synced to hands)
  makePropGroup('puxar_horizontal:mochila');

  // --- PUXAR VERTICAL (3 variations) ---
  // 1. Barra fixa de porta (doorframe + brushed steel bar at y = 2.02)
  {
    const g = makePropGroup('puxar_vertical:barra_porta');
    const jambGeo = trackGeo(new THREE.BoxGeometry(0.09, 2.28, 0.14));
    const leftJamb = new THREE.Mesh(jambGeo, doorFrameMat);
    leftJamb.position.set(-0.60, 1.14, 0.02);
    const rightJamb = new THREE.Mesh(jambGeo, doorFrameMat);
    rightJamb.position.set(0.60, 1.14, 0.02);
    const lintel = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(1.29, 0.09, 0.14)), doorFrameMat);
    lintel.position.set(0, 2.28, 0.02);
    g.add(leftJamb, rightJamb, lintel);

    const bar = new THREE.Mesh(
      trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 1.14, 18)),
      darkSteelMat
    );
    bar.rotation.z = Math.PI / 2;
    bar.position.set(0, 2.02, 0.02);
    g.add(bar);

    const gripGeo = trackGeo(new THREE.CylinderGeometry(0.023, 0.023, 0.16, 16));
    for (const sx of [-0.34, 0.34]) {
      const grip = new THREE.Mesh(gripGeo, shortsMat);
      grip.rotation.z = Math.PI / 2;
      grip.position.set(sx, 2.02, 0.02);
      g.add(grip);
    }
    enableShadows(g);
  }

  // 2. Toalha alta na porta (door + high knot at y = 1.88)
  {
    const g = makePropGroup('puxar_vertical:toalha_alta');
    addDoorWithAnchor(g, 1.88);
    enableShadows(g);
  }

  // 3. Sem equipamento (Superman pull no tapete)
  makePropGroup('puxar_vertical:superman_chao');

  // --- PANTURRILHA (3 variations) ---
  // 1. Degrau ou escada (top y = 0.16 + balance wall)
  {
    const g = makePropGroup('panturrilha:degrau');
    const step = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.50, 0.16, 0.68)), oakMat);
    step.position.set(0.29, 0.08, 0);
    g.add(step);
    const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 2.15, 0.90)), doorFrameMat);
    wall.position.set(0.58, 1.075, 0);
    g.add(wall);
    enableShadows(g);
  }

  // 2. Pilha de livros grossos (top y = 0.11 + balance wall)
  {
    const g = makePropGroup('panturrilha:livros');
    addBookStack(g, 0.25, 0.0, 0, 0.42, 0.50, 0.11);
    const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 2.15, 0.90)), doorFrameMat);
    wall.position.set(0.58, 1.075, 0);
    g.add(wall);
    enableShadows(g);
  }

  // 3. Sem objeto (unilateral no chão — balance wall only)
  {
    const g = makePropGroup('panturrilha:chao_unilateral');
    const wall = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.08, 2.15, 0.90)), doorFrameMat);
    wall.position.set(0.58, 1.075, 0);
    g.add(wall);
    enableShadows(g);
  }

  // --- HABILIDADES (3 variations) ---
  // 1. Parallettes de madeira (handles strictly at y = 0.24, z = ±0.26)
  {
    const g = makePropGroup('habilidades:parallettes');
    const handleGeo = trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.40, 16));
    const footGeo = trackGeo(new THREE.BoxGeometry(0.045, 0.21, 0.12));
    for (const sz of [-0.26, 0.26]) {
      const handle = new THREE.Mesh(handleGeo, oakMat);
      handle.rotation.z = Math.PI / 2;
      handle.position.set(0, 0.24, sz);
      g.add(handle);

      for (const sx of [-0.16, 0.16]) {
        const foot = new THREE.Mesh(footGeo, oakMat);
        foot.position.set(sx, BODY_3D.matY + 0.105, sz);
        g.add(foot);
      }
    }
    enableShadows(g);
  }

  // 2. Duas pilhas de livros grossos (top at matY + 0.14, z = ±0.26)
  {
    const g = makePropGroup('habilidades:livros_blocos');
    for (const sz of [-0.26, 0.26]) {
      addBookStack(g, 0.0, BODY_3D.matY, sz, 0.26, 0.20, 0.14);
    }
    enableShadows(g);
  }

  // 3. Sem objeto (Tuck L-sit direto no tapete)
  makePropGroup('habilidades:chao_lsit');

  // --- RUNG-SPECIFIC BENCHES (Agachamento búlgaro & Flexão inclinada) ---
  // Agachamento búlgaro: oak bench behind athlete (top y = 0.44, front edge x = -0.50)
  {
    const g = makePropGroup('agachar:bulgaro');
    const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.60, 0.055, 0.64)), oakMat);
    seat.position.set(-0.80, 0.4125, 0);
    g.add(seat);
    const legGeo = trackGeo(new THREE.BoxGeometry(0.05, 0.385, 0.05));
    for (const lx of [-1.04, -0.56]) {
      for (const lz of [-0.25, 0.25]) {
        const leg = new THREE.Mesh(legGeo, darkSteelMat);
        leg.position.set(lx, 0.1925, lz);
        g.add(leg);
      }
    }
    enableShadows(g);
  }

  // Flexão inclinada: sturdy oak bench in front of athlete (top y = 0.56, left edge x = 0.42)
  {
    const g = makePropGroup('empurrar_horizontal:inclinada');
    const seat = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.68, 0.06, 0.72)), oakMat);
    seat.position.set(0.76, 0.53, 0);
    g.add(seat);
    const legGeo = trackGeo(new THREE.BoxGeometry(0.055, 0.50, 0.055));
    for (const lx of [0.48, 1.04]) {
      for (const lz of [-0.29, 0.29]) {
        const leg = new THREE.Mesh(legGeo, darkSteelMat);
        leg.position.set(lx, 0.25, lz);
        g.add(leg);
      }
    }
    enableShadows(g);
  }

  // =========================================================================
  // DYNAMIC PROPS (Taut Towel Straps & Weighted Backpack synced every frame)
  // =========================================================================
  const towelStrapGeo = trackGeo(new THREE.CylinderGeometry(0.017, 0.022, 1, 10));
  towelStrapGeo.translate(0, 0.5, 0);
  const dynamicTowelLeft = new THREE.Group();
  dynamicTowelLeft.add(new THREE.Mesh(towelStrapGeo, towelMat));
  dynamicTowelLeft.visible = false;
  scene.add(dynamicTowelLeft);

  const dynamicTowelRight = new THREE.Group();
  dynamicTowelRight.add(new THREE.Mesh(towelStrapGeo, towelMat));
  dynamicTowelRight.visible = false;
  scene.add(dynamicTowelRight);

  const dynamicBackpack = new THREE.Group();
  const bagBody = new THREE.Mesh(trackGeo(new THREE.BoxGeometry(0.18, 0.34, 0.30)), backpackMat);
  dynamicBackpack.add(bagBody);
  const bagPocket = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.06, 0.16, 0.22)),
    backpackPocketMat
  );
  bagPocket.position.set(0.10, -0.05, 0);
  dynamicBackpack.add(bagPocket);
  // Top haul handle & side grip straps where hands hold the backpack
  const bagHandle = new THREE.Mesh(
    trackGeo(new THREE.TorusGeometry(0.13, 0.016, 8, 18, Math.PI)),
    shortsMat
  );
  bagHandle.rotation.y = Math.PI / 2;
  bagHandle.position.set(0, 0.15, 0);
  dynamicBackpack.add(bagHandle);
  enableShadows(dynamicBackpack);
  dynamicBackpack.visible = false;
  scene.add(dynamicBackpack);

  return {
    root,
    torsoGroup,
    headGroup,
    leftShoulderCap,
    rightShoulderCap,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    muscleMaterials,
    shadowPlane,
    propsByKey,
    dynamicTowelLeft,
    dynamicTowelRight,
    dynamicBackpack,
    matMesh,
    dispose: () => {
      for (const item of disposables) {
        item.dispose();
      }
    },
  };
}

function applyPoseToRig(
  rig: GymVisualRigHandle,
  patternId: MovementPatternId,
  variantId: string | undefined,
  pose: Pose3D,
  showMuscles: boolean
): void {
  // 1. Toggle static props, dynamic props & mat visibility for exact (pattern, variant, rung)
  const resolvedVariant = variantId ?? getDefaultVariationId(patternId);
  const activePropKey =
    pose.staticPropKey ?? (resolvedVariant ? `${patternId}:${resolvedVariant}` : patternId);

  for (const key of Object.keys(rig.propsByKey)) {
    rig.propsByKey[key].visible = key === activePropKey;
  }

  rig.matMesh.visible =
    pose.showMat !== undefined
      ? pose.showMat
      : patternId !== 'puxar_vertical' && patternId !== 'panturrilha';

  // Dynamic towel straps / weighted backpack
  const dyn = pose.dynamicProp;
  if (dyn && (dyn.kind === 'towel_row' || dyn.kind === 'towel_high') && dyn.anchor) {
    rig.dynamicTowelLeft.visible = true;
    rig.dynamicTowelRight.visible = true;
    rig.dynamicBackpack.visible = false;
    orientSegment3D(rig.dynamicTowelLeft, dyn.anchor, pose.leftArm.wrist, pose.torsoForward, 1);
    orientSegment3D(rig.dynamicTowelRight, dyn.anchor, pose.rightArm.wrist, pose.torsoForward, 1);
  } else if (dyn && dyn.kind === 'backpack' && dyn.center) {
    rig.dynamicTowelLeft.visible = false;
    rig.dynamicTowelRight.visible = false;
    rig.dynamicBackpack.visible = true;
    rig.dynamicBackpack.position.set(dyn.center.x, dyn.center.y, dyn.center.z);
  } else {
    rig.dynamicTowelLeft.visible = false;
    rig.dynamicTowelRight.visible = false;
    rig.dynamicBackpack.visible = false;
  }

  // 2. Dynamic GymVisual anatomical muscle highlighting (pulses on peak contraction!)
  const profile = MUSCLE_ACTIVATION_MAP[patternId];
  const tension = 0.35 + pose.phasePercent * 0.65;

  for (const id of Object.keys(rig.muscleMaterials) as MuscleGroupId[]) {
    const mat = rig.muscleMaterials[id];
    if (!showMuscles) {
      mat.color.setHex(0xb4bfce);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
      continue;
    }

    if (profile.primary.includes(id)) {
      mat.color.setHex(0xc81e1e);
      mat.emissive.setHex(0x881313);
      mat.emissiveIntensity = 0.08 + tension * 0.26;
    } else if (profile.secondary.includes(id)) {
      mat.color.setHex(0xe86b6b);
      mat.emissive.setHex(0x7f1d1d);
      mat.emissiveIntensity = 0.03 + tension * 0.08;
    } else {
      mat.color.setHex(0xb4bfce);
      mat.emissive.setHex(0x000000);
      mat.emissiveIntensity = 0;
    }
  }

  // 3. Orient Torso (pelvis -> chest)
  const spineDir: Vec3 = {
    x: pose.chest.x - pose.pelvis.x,
    y: pose.chest.y - pose.pelvis.y,
    z: pose.chest.z - pose.pelvis.z,
  };
  orientFrame3D(rig.torsoGroup, pose.pelvis, spineDir, pose.torsoForward);

  // 4. Orient Head & Neck (chest -> head)
  const neckDir: Vec3 = {
    x: pose.head.x - pose.chest.x,
    y: pose.head.y - pose.chest.y,
    z: pose.head.z - pose.chest.z,
  };
  orientFrame3D(rig.headGroup, pose.chest, neckDir, pose.torsoForward);

  // 5. Shoulder deltoid caps
  rig.leftShoulderCap.position.set(
    pose.leftArm.shoulder.x,
    pose.leftArm.shoulder.y,
    pose.leftArm.shoulder.z
  );
  rig.rightShoulderCap.position.set(
    pose.rightArm.shoulder.x,
    pose.rightArm.shoulder.y,
    pose.rightArm.shoulder.z
  );

  // 6. Bilateral Arms (using forearm direction to keep biceps anterior & triceps posterior!)
  const applyArm = (meshRig: LimbRigMeshes, arm: SideArm3D) => {
    const bendFwd: Vec3 = {
      x: arm.wrist.x - arm.elbow.x + pose.torsoForward.x * 0.25,
      y: arm.wrist.y - arm.elbow.y + pose.torsoForward.y * 0.25,
      z: arm.wrist.z - arm.elbow.z + pose.torsoForward.z * 0.25,
    };
    orientSegment3D(meshRig.upper, arm.shoulder, arm.elbow, bendFwd, 1);
    meshRig.joint.position.set(arm.elbow.x, arm.elbow.y, arm.elbow.z);
    orientSegment3D(meshRig.lower, arm.elbow, arm.wrist, pose.torsoForward, 1);

    const handDir: Vec3 = {
      x: arm.handTip.x - arm.wrist.x,
      y: arm.handTip.y - arm.wrist.y,
      z: arm.handTip.z - arm.wrist.z,
    };
    orientFrame3D(meshRig.endCap, arm.wrist, handDir, pose.torsoForward);
  };
  applyArm(rig.leftArm, pose.leftArm);
  applyArm(rig.rightArm, pose.rightArm);

  // 7. Bilateral Legs (knee direction keeps quads anterior, hamstrings & calves posterior!)
  const applyLeg = (meshRig: LimbRigMeshes, leg: SideLeg3D) => {
    const midChordX = (leg.hip.x + leg.ankle.x) * 0.5;
    const midChordY = (leg.hip.y + leg.ankle.y) * 0.5;
    const midChordZ = (leg.hip.z + leg.ankle.z) * 0.5;
    const kneeOut: Vec3 = {
      x: leg.knee.x - midChordX + pose.torsoForward.x * 0.35,
      y: leg.knee.y - midChordY + pose.torsoForward.y * 0.35,
      z: leg.knee.z - midChordZ + pose.torsoForward.z * 0.35,
    };
    orientSegment3D(meshRig.upper, leg.hip, leg.knee, kneeOut, 1);
    meshRig.joint.position.set(leg.knee.x, leg.knee.y, leg.knee.z);
    orientSegment3D(meshRig.lower, leg.knee, leg.ankle, kneeOut, 1);

    // Orient athletic shoe along heel -> toe with sole bottom toward floor
    const footDir: Vec3 = {
      x: leg.toe.x - leg.heel.x,
      y: leg.toe.y - leg.heel.y,
      z: leg.toe.z - leg.heel.z,
    };
    const footUp: Vec3 = {
      x: leg.ankle.x - leg.heel.x,
      y: leg.ankle.y - leg.heel.y,
      z: leg.ankle.z - leg.heel.z,
    };
    orientFrame3D(meshRig.endCap, leg.heel, footDir, footUp);
  };
  applyLeg(rig.leftLeg, pose.leftLeg);
  applyLeg(rig.rightLeg, pose.rightLeg);

  // 8. Soft floor contact shadow
  rig.shadowPlane.position.set(
    pose.shadow.x,
    rig.matMesh.visible ? BODY_3D.matY + 0.002 : 0.002,
    pose.shadow.z
  );
  rig.shadowPlane.scale.set(pose.shadow.rx, pose.shadow.rz, 1);
  (rig.shadowPlane.material as THREE.MeshBasicMaterial).opacity = pose.shadow.opacity;
}

function getCameraGoalForPreset(
  patternId: MovementPatternId,
  variantId: string | undefined,
  preset: CameraPreset,
  pose: Pose3D,
  outPos: THREE.Vector3,
  outTarget: THREE.Vector3
): void {
  const t = pose.cameraTarget;
  const d = pose.cameraDistance;
  outTarget.set(t.x, t.y, t.z);

  // Only doorway pull-up faces +Z; all other exercises & variations face +X
  const isFrontPattern =
    patternId === 'puxar_vertical' && (!variantId || variantId === 'barra_porta');

  if (preset === 'lateral') {
    if (isFrontPattern) {
      outPos.set(t.x + d * 0.92, t.y + 0.25, t.z + d * 0.35);
    } else {
      outPos.set(t.x, t.y + 0.24, t.z + d);
    }
    return;
  }

  if (preset === 'frontal') {
    if (isFrontPattern) {
      outPos.set(t.x, t.y + 0.16, t.z + d);
    } else {
      outPos.set(t.x + d * 0.92, t.y + 0.34, t.z + d * 0.32);
    }
    return;
  }

  // Signature GymVisual 3/4 isometric-perspective studio camera
  if (isFrontPattern) {
    outPos.set(t.x + d * 0.42, t.y + 0.28, t.z + d * 0.92);
  } else {
    outPos.set(t.x + d * 0.58, t.y + 0.44, t.z + d * 0.82);
  }
}

export function GymVisual3DViewer({
  patternId,
  variantId,
  rung,
  progress,
  playing,
  slowMo,
  cameraPreset,
  showMuscles,
  compact = false,
  onProgressTick,
  ariaLabel,
}: GymVisual3DViewerProps) {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Mutable refs so React state updates never tear down the WebGL context
  const stateRef = useRef({
    patternId,
    variantId,
    rung,
    progress,
    playing,
    slowMo,
    cameraPreset,
    showMuscles,
    onProgressTick,
    cameraDirty: true,
    userOrbiting: false,
  });

  const prevPatternRef = useRef(patternId);
  const prevVariantRef = useRef(variantId);
  const prevRungRef = useRef(rung);
  const prevPresetRef = useRef(cameraPreset);
  const prevMusclesRef = useRef(showMuscles);
  const prevProgressRef = useRef(progress);
  const requestRenderRef = useRef<((urgent?: boolean) => void) | null>(null);

  // Sync incoming React props into ref & trigger smooth camera transition if needed
  useEffect(() => {
    const s = stateRef.current;
    const patternChanged = prevPatternRef.current !== patternId;
    const variantChanged = prevVariantRef.current !== variantId;
    const rungChanged = prevRungRef.current !== rung;
    const presetChanged = prevPresetRef.current !== cameraPreset;
    const musclesChanged = prevMusclesRef.current !== showMuscles;
    const manualScrub = !playing && Math.abs(prevProgressRef.current - progress) > 0.001;

    s.patternId = patternId;
    s.variantId = variantId;
    s.rung = rung;
    s.progress = progress;
    s.playing = playing;
    s.slowMo = slowMo;
    s.cameraPreset = cameraPreset;
    s.showMuscles = showMuscles;
    s.onProgressTick = onProgressTick;

    const isUrgent =
      patternChanged ||
      variantChanged ||
      rungChanged ||
      presetChanged ||
      musclesChanged ||
      manualScrub;
    if (patternChanged || variantChanged || rungChanged || presetChanged) {
      s.cameraDirty = true;
      s.userOrbiting = false;
      prevPatternRef.current = patternId;
      prevVariantRef.current = variantId;
      prevRungRef.current = rung;
      prevPresetRef.current = cameraPreset;
    }
    if (musclesChanged) {
      prevMusclesRef.current = showMuscles;
    }
    prevProgressRef.current = progress;

    requestRenderRef.current?.(isUrgent);
  }, [patternId, variantId, rung, progress, playing, slowMo, cameraPreset, showMuscles, onProgressTick]);

  // Mount Three.js WebGLRenderer once in dedicated ref container
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareWebGL();
    const width = container.clientWidth || 360;
    const height = container.clientHeight || (compact ? 185 : 256);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    scene.fog = new THREE.Fog(0xf8fafc, 6.2, 12.5);

    const camera = new THREE.PerspectiveCamera(37, width / height, 0.1, 30);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.98;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    container.appendChild(renderer.domElement);

    // Mandatory studio environment map (RoomEnvironment via PMREMGenerator)
    const pmrem = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    const envRT = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();
    pmrem.dispose();

    // 3-Point Warm/Cool GymVisual Studio Lighting Rig (sculpted shading contrast on studio white)
    const hemiLight = new THREE.HemisphereLight(0xf2f6fc, 0xb6c3d4, 0.82);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff9f0, 1.55);
    keyLight.position.set(2.8, 4.6, 3.2);
    if (!isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 12;
      keyLight.shadow.camera.left = -2.2;
      keyLight.shadow.camera.right = 2.2;
      keyLight.shadow.camera.top = 2.6;
      keyLight.shadow.camera.bottom = -1.6;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xdce9fa, 0.72);
    rimLight.position.set(-2.6, 3.0, -2.8);
    scene.add(rimLight);

    const rig = buildGymVisualSceneContent(scene, isSoftwareGl);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true;
    controls.minDistance = 1.45;
    controls.maxDistance = 4.6;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;

    // Initial pose & camera snap (zero initial fly-in stutter)
    const initPose = solvePose3D(
      stateRef.current.patternId,
      stateRef.current.progress,
      stateRef.current.variantId,
      stateRef.current.rung
    );
    applyPoseToRig(
      rig,
      stateRef.current.patternId,
      stateRef.current.variantId,
      initPose,
      stateRef.current.showMuscles
    );
    getCameraGoalForPreset(
      stateRef.current.patternId,
      stateRef.current.variantId,
      stateRef.current.cameraPreset,
      initPose,
      _camGoal,
      _targetGoal
    );
    camera.position.copy(_camGoal);
    controls.target.copy(_targetGoal);
    controls.update();
    stateRef.current.cameraDirty = false;

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let disposed = false;
    let rafId = 0;
    let pollTimerId = 0;
    let cooldownTimerId = 0;
    let activeSync: WebGLSync | null = null;
    let pendingFinishCb: (() => void) | null = null;
    let lastNow = performance.now();
    let uiEmitAccum = 0;
    let renderBusy = false;
    let renderDirty = false;
    let urgentRedraw = false;

    function clearPendingSoftwareWait() {
      if (pollTimerId) {
        window.clearTimeout(pollTimerId);
        pollTimerId = 0;
      }
      if (cooldownTimerId) {
        window.clearTimeout(cooldownTimerId);
        cooldownTimerId = 0;
      }
      if (activeSync) {
        const gl = renderer.getContext() as WebGL2RenderingContext;
        if (gl && typeof gl.deleteSync === 'function') {
          gl.deleteSync(activeSync);
        }
        activeSync = null;
      }
    }

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const scheduleFinish = () => {
        if (disposed) return;
        if (urgentRedraw) {
          urgentRedraw = false;
          pendingFinishCb = null;
          cb();
          return;
        }
        pendingFinishCb = cb;
        cooldownTimerId = window.setTimeout(() => {
          cooldownTimerId = 0;
          const fn = pendingFinishCb;
          pendingFinishCb = null;
          fn?.();
        }, 75);
      };

      if (gl && typeof gl.fenceSync === 'function') {
        const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        activeSync = sync;
        pendingFinishCb = cb;
        gl.flush();
        const waitStart = performance.now();
        const poll = () => {
          pollTimerId = 0;
          if (disposed) {
            if (activeSync) {
              gl.deleteSync(activeSync);
              activeSync = null;
            }
            return;
          }
          const status = activeSync
            ? gl.getSyncParameter(activeSync, gl.SYNC_STATUS)
            : gl.SIGNALED;
          const timedOut = performance.now() - waitStart >= 120;
          if (status === gl.UNSIGNALED && !timedOut) {
            pollTimerId = window.setTimeout(poll, 10);
          } else {
            if (activeSync) {
              gl.deleteSync(activeSync);
              activeSync = null;
            }
            scheduleFinish();
          }
        };
        pollTimerId = window.setTimeout(poll, 10);
      } else {
        scheduleFinish();
      }
    }

    function stepAndRender() {
      if (disposed) return;
      const now = performance.now();
      const dt = Math.min((now - lastNow) / 1000, 0.064);
      lastNow = now;

      const s = stateRef.current;

      if (s.playing) {
        const cycleSec = s.slowMo ? 9.2 : 5.2;
        s.progress = (s.progress + dt / cycleSec) % 1;
        uiEmitAccum += dt;
        // Sync React slider/phase readout ~15fps so DOM never thrashes while WebGL stays 60fps
        if (uiEmitAccum >= 0.065) {
          uiEmitAccum = 0;
          s.onProgressTick?.(s.progress);
        }
      }

      const pose = solvePose3D(s.patternId, s.progress, s.variantId, s.rung);
      applyPoseToRig(rig, s.patternId, s.variantId, pose, s.showMuscles);

      // Smooth exponential camera preset transition (cancels immediately on user orbit drag)
      if (s.cameraDirty && !s.userOrbiting) {
        getCameraGoalForPreset(
          s.patternId,
          s.variantId,
          s.cameraPreset,
          pose,
          _camGoal,
          _targetGoal
        );
        if (isSoftwareGl) {
          camera.position.copy(_camGoal);
          controls.target.copy(_targetGoal);
          s.cameraDirty = false;
        } else {
          const lambda = 7.5;
          camera.position.x = THREE.MathUtils.damp(camera.position.x, _camGoal.x, lambda, dt);
          camera.position.y = THREE.MathUtils.damp(camera.position.y, _camGoal.y, lambda, dt);
          camera.position.z = THREE.MathUtils.damp(camera.position.z, _camGoal.z, lambda, dt);
          controls.target.x = THREE.MathUtils.damp(controls.target.x, _targetGoal.x, lambda, dt);
          controls.target.y = THREE.MathUtils.damp(controls.target.y, _targetGoal.y, lambda, dt);
          controls.target.z = THREE.MathUtils.damp(controls.target.z, _targetGoal.z, lambda, dt);

          if (
            camera.position.distanceToSquared(_camGoal) < 0.0004 &&
            controls.target.distanceToSquared(_targetGoal) < 0.0004
          ) {
            camera.position.copy(_camGoal);
            controls.target.copy(_targetGoal);
            s.cameraDirty = false;
          }
        }
      }

      controls.update();
      renderer.render(scene, camera);
    }

    function scheduleNext() {
      if (disposed) return;
      const s = stateRef.current;
      const needsLoop = s.playing || (s.cameraDirty && !s.userOrbiting);

      const finish = () => {
        renderBusy = false;
        if (disposed) return;
        if (
          urgentRedraw ||
          stateRef.current.playing ||
          (stateRef.current.cameraDirty && !stateRef.current.userOrbiting)
        ) {
          urgentRedraw = false;
          requestRender();
        } else if (renderDirty) {
          renderDirty = false;
          requestRender();
        }
      };

      if (isSoftwareGl) {
        if (needsLoop || renderDirty || urgentRedraw) {
          afterDraw(finish);
        } else {
          renderBusy = false;
        }
      } else {
        if (needsLoop) {
          rafId = window.requestAnimationFrame(() => {
            rafId = 0;
            renderBusy = false;
            requestRender();
          });
        } else {
          renderBusy = false;
          if (renderDirty || urgentRedraw) {
            renderDirty = false;
            urgentRedraw = false;
            requestRender();
          }
        }
      }
    }

    function requestRender(urgent = false) {
      if (disposed) return;
      if (urgent) {
        urgentRedraw = true;
        // Cancel any software-GL idle cooldown or stale fence poll so user clicks redraw immediately
        if (pollTimerId || cooldownTimerId) {
          clearPendingSoftwareWait();
          const fn = pendingFinishCb;
          pendingFinishCb = null;
          fn?.();
          return;
        }
      }
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      urgentRedraw = false;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        if (disposed) return;
        renderDirty = false;
        stepAndRender();
        scheduleNext();
      });
    }

    requestRenderRef.current = requestRender;

    const onControlStart = () => {
      stateRef.current.userOrbiting = true;
      stateRef.current.cameraDirty = false;
    };
    const onControlChange = () => {
      requestRender();
    };
    controls.addEventListener('start', onControlStart);
    controls.addEventListener('change', onControlChange);

    // ResizeObserver keeps aspect ratio crisp across desktop, modal, and mobile viewports
    const ro = new ResizeObserver(() => {
      if (disposed || !mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      if (w > 10 && h > 10) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        requestRender(true);
      }
    });
    ro.observe(container);

    // Kick off initial render
    lastNow = performance.now();
    requestRender(true);

    return () => {
      disposed = true;
      requestRenderRef.current = null;
      pendingFinishCb = null;
      if (rafId) window.cancelAnimationFrame(rafId);
      clearPendingSoftwareWait();
      ro.disconnect();
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', onControlChange);
      controls.dispose();
      rig.dispose();
      envRT.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [compact]);

  return (
    <div
      ref={mountRef}
      role="img"
      aria-label={ariaLabel}
      className={`w-full ${compact ? 'h-48' : 'h-60 sm:h-68'} bg-[#F8FAFC] cursor-grab active:cursor-grabbing select-none overflow-hidden`}
    />
  );
}
