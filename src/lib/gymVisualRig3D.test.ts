import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRESSION_LADDERS } from './calisthenicsData';
import { getExerciseVisualGuide } from './exerciseMedia';
import {
  BODY_3D,
  getDefaultVariationId,
  getObjectVariations,
  MUSCLE_ACTIVATION_MAP,
  OBJECT_VARIATIONS_BY_PATTERN,
  solvePose3D,
  solveTwoBoneIK3D,
  v3,
  v3Dist,
} from './gymVisualRig3D';
import type { MovementPatternId } from './types';

test('solveTwoBoneIK3D preserva exatamente os comprimentos ósseos em 3D e respeita o polo', () => {
  const root = v3(0, 1.4, 0.2);
  const target = v3(0.35, 1.0, 0.28);
  const { mid, end } = solveTwoBoneIK3D(root, target, 0.3, 0.27, v3(-1, 0, 0.5));

  assert.ok(Math.abs(v3Dist(root, mid) - 0.3) < 0.002);
  assert.ok(Math.abs(v3Dist(mid, end) - 0.27) < 0.002);
  assert.ok(v3Dist(end, target) < 0.002);
  assert.ok(
    mid.x < (root.x + target.x) * 0.5,
    'Cotovelo deve deslocar-se na direção do vetor polo (-X) em relação ao eixo raiz-alvo'
  );
});

test('todos os 10 padrões 3D mantêm ossos bilaterais invariantes e sem atravessar o piso', () => {
  const patterns = Object.keys(PROGRESSION_LADDERS) as MovementPatternId[];
  const samples = [0.02, 0.2, 0.4, 0.58, 0.8, 0.95];

  for (const patternId of patterns) {
    assert.ok(
      MUSCLE_ACTIVATION_MAP[patternId].primary.length > 0,
      `${patternId}: mapa de ativação muscular ausente`
    );

    for (const u of samples) {
      const p = solvePose3D(patternId, u);
      const torsoLen = v3Dist(p.pelvis, p.chest);
      assert.ok(
        Math.abs(torsoLen - BODY_3D.torso) < 0.015,
        `${patternId} @${u}: tronco 3D deformou (${torsoLen.toFixed(3)} vs ${BODY_3D.torso})`
      );

      for (const [label, arm] of [
        ['L', p.leftArm],
        ['R', p.rightArm],
      ] as const) {
        const ua = v3Dist(arm.shoulder, arm.elbow);
        const fa = v3Dist(arm.elbow, arm.wrist);
        assert.ok(
          Math.abs(ua - BODY_3D.upperArm) < 0.015,
          `${patternId} ${label} @${u}: úmero deformou (${ua.toFixed(3)})`
        );
        assert.ok(
          Math.abs(fa - BODY_3D.forearm) < 0.015,
          `${patternId} ${label} @${u}: antebraço deformou (${fa.toFixed(3)})`
        );
      }

      for (const [label, leg] of [
        ['L', p.leftLeg],
        ['R', p.rightLeg],
      ] as const) {
        const th = v3Dist(leg.hip, leg.knee);
        const sh = v3Dist(leg.knee, leg.ankle);
        assert.ok(
          Math.abs(th - BODY_3D.thigh) < 0.015,
          `${patternId} ${label} @${u}: fêmur deformou (${th.toFixed(3)})`
        );
        assert.ok(
          Math.abs(sh - BODY_3D.shin) < 0.015,
          `${patternId} ${label} @${u}: tíbia deformou (${sh.toFixed(3)})`
        );
        assert.ok(
          leg.ankle.y >= 0 && leg.toe.y >= 0 && leg.heel.y >= 0,
          `${patternId} ${label} @${u}: pé atravessou o solo (y < 0)`
        );
      }
    }
  }
});

test('contatos 3D permanecem firmemente apoiados no tapete, mesa, banco e barra fixa', () => {
  const pushTop = solvePose3D('empurrar_horizontal', 0.02);
  const pushBot = solvePose3D('empurrar_horizontal', 0.6);
  assert.ok(Math.abs(pushTop.rightArm.wrist.y - (BODY_3D.matY + 0.02)) < 0.012, 'Mão da flexão flutuou no topo');
  assert.ok(Math.abs(pushBot.rightArm.wrist.y - (BODY_3D.matY + 0.02)) < 0.012, 'Mão da flexão flutuou no fundo');
  assert.ok(pushBot.rightArm.elbow.z > pushBot.rightArm.shoulder.z, 'Cotovelo direito deve abrir em ~45°');
  assert.ok(pushBot.leftArm.elbow.z < pushBot.leftArm.shoulder.z, 'Cotovelo esquerdo deve abrir simetricamente');

  const pikeTop = solvePose3D('empurrar_vertical', 0.02);
  const pikeBot = solvePose3D('empurrar_vertical', 0.6);
  assert.ok(Math.abs(pikeTop.rightArm.wrist.y - (BODY_3D.matY + 0.02)) < 0.015, 'Mão do pike flutuou no topo');
  assert.ok(Math.abs(pikeBot.rightArm.wrist.y - (BODY_3D.matY + 0.02)) < 0.015, 'Mão do pike flutuou no fundo');

  const dipTop = solvePose3D('paralelas_triceps', 0.02);
  const dipBot = solvePose3D('paralelas_triceps', 0.6);
  assert.ok(Math.abs(dipTop.rightArm.wrist.y - 0.575) < 0.015, 'Mão do mergulho soltou do banco');
  assert.ok(Math.abs(dipBot.rightLeg.ankle.y - (BODY_3D.matY + BODY_3D.ankleH)) < 0.015, 'Pé do mergulho flutuou');

  const rowBot = solvePose3D('puxar_horizontal', 0.02);
  const rowTop = solvePose3D('puxar_horizontal', 0.4);
  assert.ok(Math.abs(rowBot.rightArm.wrist.y - 0.90) < 0.015, 'Mão da remada soltou da mesa embaixo');
  assert.ok(Math.abs(rowTop.rightArm.wrist.y - 0.90) < 0.015, 'Mão da remada soltou da mesa no topo');

  const hang = solvePose3D('puxar_vertical', 0.02);
  const top = solvePose3D('puxar_vertical', 0.4);
  assert.ok(Math.abs(hang.leftArm.wrist.y - 2.02) < 0.015);
  assert.ok(Math.abs(top.rightArm.wrist.y - 2.02) < 0.015);
  assert.ok(top.head.y - BODY_3D.headR > 1.98, 'Queixo deve ultrapassar a barra no topo');
});

test('todos os 5 padrões com objetos oferecem exatamente 3 variações com física 3D íntegra', () => {
  const objectPatterns: MovementPatternId[] = [
    'puxar_horizontal',
    'puxar_vertical',
    'paralelas_triceps',
    'panturrilha',
    'habilidades',
  ];
  const samples = [0.04, 0.35, 0.65, 0.9];

  assert.equal(Object.keys(OBJECT_VARIATIONS_BY_PATTERN).length, 5);

  for (const patternId of objectPatterns) {
    const variations = getObjectVariations(patternId);
    assert.equal(variations.length, 3, `${patternId} deve oferecer exatamente 3 variações com objeto`);

    for (const v of variations) {
      assert.ok(v.setupTip.length > 10 && v.safetyNote.length > 10);
      for (const u of samples) {
        const p = solvePose3D(patternId, u, v.id);
        assert.ok(
          Math.abs(v3Dist(p.pelvis, p.chest) - BODY_3D.torso) < 0.02,
          `${patternId}:${v.id} @${u} deformou tronco`
        );
        for (const arm of [p.leftArm, p.rightArm]) {
          assert.ok(
            Math.abs(v3Dist(arm.shoulder, arm.elbow) - BODY_3D.upperArm) < 0.02,
            `${patternId}:${v.id} @${u} deformou úmero`
          );
          assert.ok(
            Math.abs(v3Dist(arm.elbow, arm.wrist) - BODY_3D.forearm) < 0.02,
            `${patternId}:${v.id} @${u} deformou antebraço`
          );
        }
        for (const leg of [p.leftLeg, p.rightLeg]) {
          assert.ok(
            Math.abs(v3Dist(leg.hip, leg.knee) - BODY_3D.thigh) < 0.02,
            `${patternId}:${v.id} @${u} deformou fêmur`
          );
          assert.ok(
            Math.abs(v3Dist(leg.knee, leg.ankle) - BODY_3D.shin) < 0.02,
            `${patternId}:${v.id} @${u} deformou tíbia`
          );
          assert.ok(
            leg.ankle.y >= 0 && leg.toe.y >= 0 && leg.heel.y >= 0,
            `${patternId}:${v.id} @${u} atravessou o solo`
          );
        }
      }
    }
  }

  // Verify dynamic props move properly
  const bagLow = solvePose3D('puxar_horizontal', 0.02, 'mochila');
  const bagHigh = solvePose3D('puxar_horizontal', 0.4, 'mochila');
  assert.equal(bagLow.dynamicProp?.kind, 'backpack');
  assert.ok(
    (bagHigh.dynamicProp?.center?.y ?? 0) > (bagLow.dynamicProp?.center?.y ?? 0) + 0.18,
    'Mochila deve subir junto com as mãos na remada curvada'
  );

  const towelRow = solvePose3D('puxar_horizontal', 0.4, 'toalha_porta');
  assert.equal(towelRow.dynamicProp?.kind, 'towel_row');
  assert.ok(towelRow.dynamicProp?.anchor && towelRow.dynamicProp.anchor.x > 0.6);

  // Verify floor-only patterns have no object variations
  assert.equal(getObjectVariations('agachar').length, 0);
  assert.equal(getObjectVariations('empurrar_horizontal').length, 0);
});

test('variações específicas por degrau alinham nome, foto e animação 3D (unilaterais, búlgaro, stiff, flexões e core)', () => {
  // 1. Ponte de glúteo bilateral (degrau 1) vs unilateral (degrau 2)
  const bridgeBi = solvePose3D('dobradica_posterior', 0.4, undefined, 1);
  const bridgeUni = solvePose3D('dobradica_posterior', 0.4, undefined, 2);
  assert.ok(
    bridgeBi.leftLeg.ankle.y < 0.13 && bridgeBi.rightLeg.ankle.y < 0.13,
    'Ponte bilateral deve manter os dois pés apoiados no tapete'
  );
  assert.ok(
    bridgeUni.rightLeg.ankle.y < 0.13 && bridgeUni.leftLeg.ankle.y > 0.45,
    'Ponte unilateral deve manter um pé no tapete e a outra perna elevada e estendida'
  );

  // 2. Stiff unilateral (degrau 4): equilíbrio em 1 perna e perna de trás estendida
  const rdlPeak = solvePose3D('dobradica_posterior', 0.6, undefined, 4);
  assert.ok(rdlPeak.rightLeg.ankle.y < 0.13, 'Pé de apoio do stiff unilateral deve ficar no tapete');
  assert.ok(
    rdlPeak.leftLeg.ankle.y > 0.5 && rdlPeak.leftLeg.ankle.x < -0.65,
    'Perna traseira do stiff unilateral deve estender atrás em linha com o tronco'
  );

  // 3. Panturrilha bilateral (degrau 1) vs unilateral (degrau 2) no degrau
  const calfBi = solvePose3D('panturrilha', 0.4, 'degrau', 1);
  const calfUni = solvePose3D('panturrilha', 0.4, 'degrau', 2);
  assert.ok(
    Math.abs(calfBi.leftLeg.ankle.y - calfBi.rightLeg.ankle.y) < 0.01,
    'Panturrilha bilateral deve manter ambos os pés apoiados no degrau'
  );
  assert.ok(
    calfUni.leftLeg.ankle.y > calfUni.rightLeg.ankle.y + 0.15,
    'Panturrilha unilateral (degrau 2) deve recolher a perna livre atrás mesmo no degrau'
  );

  // 4. Agachamento búlgaro (degrau 4) e Pistol squat (degrau 6)
  const bulgarian = solvePose3D('agachar', 0.6, undefined, 4);
  assert.equal(bulgarian.staticPropKey, 'agachar:bulgaro');
  assert.ok(bulgarian.leftLeg.ankle.y > 0.42 && bulgarian.rightLeg.ankle.y < 0.13);

  const pistol = solvePose3D('agachar', 0.6, undefined, 6);
  assert.ok(pistol.rightLeg.ankle.y < 0.13 && pistol.leftLeg.ankle.x > 0.4);

  // 5. Flexão inclinada (2), joelhos (3) e diamante (6)
  const pushIncline = solvePose3D('empurrar_horizontal', 0.05, undefined, 2);
  assert.equal(pushIncline.staticPropKey, 'empurrar_horizontal:inclinada');
  assert.ok(pushIncline.rightArm.wrist.y > 0.55);

  const pushDiamond = solvePose3D('empurrar_horizontal', 0.6, undefined, 6);
  assert.ok(Math.abs(pushDiamond.rightArm.wrist.z) < 0.08);

  // 6. Integridade óssea 3D em todos os novos degraus especiais
  const rungCases: Array<[MovementPatternId, number]> = [
    ['dobradica_posterior', 2],
    ['dobradica_posterior', 3],
    ['dobradica_posterior', 4],
    ['panturrilha', 1],
    ['panturrilha', 2],
    ['agachar', 4],
    ['agachar', 6],
    ['empurrar_horizontal', 2],
    ['empurrar_horizontal', 3],
    ['empurrar_horizontal', 6],
    ['core', 1],
    ['core', 3],
    ['core', 5],
  ];
  for (const [patternId, rung] of rungCases) {
    for (const u of [0.05, 0.35, 0.6, 0.9]) {
      const p = solvePose3D(patternId, u, undefined, rung);
      assert.ok(
        Math.abs(v3Dist(p.pelvis, p.chest) - BODY_3D.torso) < 0.02,
        `${patternId} degrau ${rung} @${u}: tronco deformou`
      );
      for (const arm of [p.leftArm, p.rightArm]) {
        assert.ok(Math.abs(v3Dist(arm.shoulder, arm.elbow) - BODY_3D.upperArm) < 0.02);
        assert.ok(Math.abs(v3Dist(arm.elbow, arm.wrist) - BODY_3D.forearm) < 0.02);
      }
      for (const leg of [p.leftLeg, p.rightLeg]) {
        assert.ok(Math.abs(v3Dist(leg.hip, leg.knee) - BODY_3D.thigh) < 0.02);
        assert.ok(Math.abs(v3Dist(leg.knee, leg.ankle) - BODY_3D.shin) < 0.02);
        assert.ok(
          leg.ankle.y >= 0 && leg.toe.y >= 0 && leg.heel.y >= 0,
          `${patternId} degrau ${rung} @${u}: pé abaixo do solo`
        );
      }
    }
  }

  // 7. Fotos distintas por degrau (unilateral vs bilateral / búlgaro / stiff)
  assert.notEqual(
    getExerciseVisualGuide('dobradica_posterior', 1).fotoUrl,
    getExerciseVisualGuide('dobradica_posterior', 2).fotoUrl
  );
  assert.notEqual(
    getExerciseVisualGuide('dobradica_posterior', 2).fotoUrl,
    getExerciseVisualGuide('dobradica_posterior', 4).fotoUrl
  );
  assert.notEqual(
    getExerciseVisualGuide('panturrilha', 1).fotoUrl,
    getExerciseVisualGuide('panturrilha', 2).fotoUrl
  );
  assert.notEqual(
    getExerciseVisualGuide('agachar', 2).fotoUrl,
    getExerciseVisualGuide('agachar', 4).fotoUrl
  );

  // 8. Seleção automática de variação com objeto compatível com o degrau
  assert.equal(getDefaultVariationId('paralelas_triceps', 1), 'mesa_triceps');
  assert.equal(getDefaultVariationId('paralelas_triceps', 2), 'banco');
  assert.equal(getDefaultVariationId('paralelas_triceps', 3), 'duas_cadeiras');
  assert.equal(getDefaultVariationId('puxar_horizontal', 3), 'toalha_porta');
  assert.equal(
    getDefaultVariationId('puxar_vertical', 1, 'Hang passivo — sem barra: Superman pull'),
    'superman_chao'
  );
});
