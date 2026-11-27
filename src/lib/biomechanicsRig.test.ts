import test from 'node:test';
import assert from 'node:assert/strict';
import { PROGRESSION_LADDERS } from './calisthenicsData';
import {
  BODY_PROPORTIONS,
  computeAthleticPhase,
  dist,
  solveExercisePose,
  solveTwoBoneIK,
} from './biomechanicsRig';
import type { MovementPatternId } from './types';

test('solveTwoBoneIK preserva rigorosamente o comprimento dos dois segmentos ósseos', () => {
  const root = { x: 100, y: 100 };
  const target = { x: 130, y: 132 };
  const len1 = 25;
  const len2 = 23;

  for (const bendDir of [1, -1] as const) {
    const { mid, end } = solveTwoBoneIK(root, target, len1, len2, bendDir);
    assert.ok(Math.abs(dist(root, mid) - len1) < 0.05, 'Segmento 1 deformou');
    assert.ok(Math.abs(dist(mid, end) - len2) < 0.05, 'Segmento 2 deformou');
    assert.ok(dist(end, target) < 0.05, 'End-effector não alcançou alvo alcançável');
  }
});

test('todos os 10 exercícios preservam proporções ósseas constantes e permanecem dentro do palco sem atravessar o solo', () => {
  const patterns = Object.keys(PROGRESSION_LADDERS) as MovementPatternId[];
  const samples = [0, 0.15, 0.35, 0.55, 0.75, 0.9];

  for (const patternId of patterns) {
    for (const u of samples) {
      const pose = solveExercisePose(patternId, u);

      const torsoLen = dist(pose.hip, pose.shoulder);
      const thighLen = dist(pose.hip, pose.knee);
      const shinLen = dist(pose.knee, pose.ankle);
      const upperArmLen = dist(pose.shoulder, pose.elbow);
      const forearmLen = dist(pose.elbow, pose.wrist);

      assert.ok(
        Math.abs(torsoLen - BODY_PROPORTIONS.torso) < 0.6,
        `${patternId} @${u}: tronco deformou (${torsoLen.toFixed(2)} vs ${BODY_PROPORTIONS.torso})`
      );
      assert.ok(
        Math.abs(thighLen - BODY_PROPORTIONS.thigh) < 0.6,
        `${patternId} @${u}: fêmur deformou (${thighLen.toFixed(2)} vs ${BODY_PROPORTIONS.thigh})`
      );
      if (pose.viewMode === 'side') {
        assert.ok(
          Math.abs(shinLen - BODY_PROPORTIONS.shin) < 0.6,
          `${patternId} @${u}: tíbia deformou (${shinLen.toFixed(2)} vs ${BODY_PROPORTIONS.shin})`
        );
      } else {
        assert.ok(
          shinLen > 5 && shinLen <= BODY_PROPORTIONS.shin + 0.6,
          `${patternId} @${u}: tíbia em perspectiva frontal fora do limite (${shinLen.toFixed(2)})`
        );
      }
      assert.ok(
        Math.abs(upperArmLen - BODY_PROPORTIONS.upperArm) < 0.6,
        `${patternId} @${u}: úmero deformou (${upperArmLen.toFixed(2)} vs ${BODY_PROPORTIONS.upperArm})`
      );
      assert.ok(
        Math.abs(forearmLen - BODY_PROPORTIONS.forearm) < 0.6,
        `${patternId} @${u}: antebraço deformou (${forearmLen.toFixed(2)} vs ${BODY_PROPORTIONS.forearm})`
      );

      // Verify head clears top boundary and feet/joints stay above floor (y <= 173.5)
      assert.ok(
        pose.head.y - BODY_PROPORTIONS.headRadius >= 1,
        `${patternId} @${u}: cabeça cortada no topo (y=${(pose.head.y - BODY_PROPORTIONS.headRadius).toFixed(1)})`
      );
      assert.ok(
        pose.ankle.y <= 172.5 && pose.toe.y <= 173.5 && pose.heel.y <= 173.5,
        `${patternId} @${u}: pé atravessou o solo (ankle=${pose.ankle.y.toFixed(1)}, toe=${pose.toe.y.toFixed(1)}, heel=${pose.heel.y.toFixed(1)})`
      );
    }
  }
});

test('contatos de apoio permanecem firmes no solo ou equipamento sem flutuar', () => {
  const pushTop = solveExercisePose('empurrar_horizontal', 0.02);
  const pushBot = solveExercisePose('empurrar_horizontal', 0.6);
  assert.ok(Math.abs(pushTop.wrist.y - 170) < 0.6, 'Mão da flexão flutuou no topo');
  assert.ok(Math.abs(pushBot.wrist.y - 170) < 0.6, 'Mão da flexão flutuou no fundo');

  const pikeTop = solveExercisePose('empurrar_vertical', 0.02);
  const pikeBot = solveExercisePose('empurrar_vertical', 0.6);
  assert.ok(Math.abs(pikeTop.wrist.y - 170) < 0.6, 'Mão do pike flutuou no topo');
  assert.ok(Math.abs(pikeBot.wrist.y - 170) < 0.6, 'Mão do pike flutuou no fundo');

  const rowBot = solveExercisePose('puxar_horizontal', 0.02);
  const rowTop = solveExercisePose('puxar_horizontal', 0.6);
  assert.ok(Math.abs(rowBot.wrist.y - 92) < 0.6, 'Mão da remada soltou da mesa');
  assert.ok(Math.abs(rowTop.wrist.y - 92) < 0.6, 'Mão da remada soltou no topo');

  const dipTop = solveExercisePose('paralelas_triceps', 0.02);
  const dipBot = solveExercisePose('paralelas_triceps', 0.6);
  assert.ok(Math.abs(dipTop.wrist.y - 122) < 0.6, 'Mão do mergulho soltou do banco');
  assert.ok(Math.abs(dipBot.ankle.y - 167) < 0.6, 'Pé do mergulho flutuou');

  const plankStart = solveExercisePose('core', 0.05);
  const plankHold = solveExercisePose('core', 0.5);
  assert.ok(Math.abs(plankStart.elbow.y - 169) < 0.2, 'Cotovelo da prancha saiu do chão');
  assert.ok(Math.abs(plankHold.elbow.y - 169) < 0.2, 'Cotovelo da prancha saiu do chão na isometria');
});

test('agachamento mantém pé plantado no solo durante toda a execução', () => {
  const start = solveExercisePose('agachar', 0.02);
  const bottom = solveExercisePose('agachar', 0.6);
  assert.ok(Math.abs(start.heel.y - 172) < 0.1);
  assert.ok(Math.abs(bottom.heel.y - 172) < 0.1);
  assert.ok(Math.abs(start.ankle.x - bottom.ankle.x) < 0.5, 'Tornozelo não deve deslizar');
  assert.ok(bottom.hip.y > start.hip.y + 20, 'Quadril deve descer claramente no agachamento');
});

test('barra fixa eleva o queixo acima da barra mantendo simetria dos dois braços', () => {
  const hang = solveExercisePose('puxar_vertical', 0.02);
  const peak = solveExercisePose('puxar_vertical', 0.4);
  assert.equal(hang.viewMode, 'front');
  assert.ok(hang.front && peak.front);
  assert.ok(Math.abs(peak.front.leftWrist.y - 35) < 0.6);
  assert.ok(Math.abs(peak.front.rightWrist.y - 35) < 0.6);
  assert.ok(peak.head.y + BODY_PROPORTIONS.headRadius <= 36, 'Queixo deve ultrapassar a barra');
});

test('computeAthleticPhase produz cadência realista tanto para empurrar/agachar quanto para puxar/elevar', () => {
  const start = computeAthleticPhase(0.05, false, false);
  const midDown = computeAthleticPhase(0.32, false, false);
  const pause = computeAthleticPhase(0.6, false, false);
  const endUp = computeAthleticPhase(0.95, false, false);

  assert.equal(start.phaseTag, 'inicio');
  assert.equal(start.value, 0);
  assert.equal(midDown.phaseTag, 'excentrica');
  assert.ok(midDown.value > 0.2 && midDown.value < 0.8);
  assert.equal(pause.phaseTag, 'pausa');
  assert.equal(pause.value, 1);
  assert.equal(endUp.value, 0);

  // Pull/rise pattern: concentric lift first -> top pause -> slow eccentric lowering
  const pullLift = computeAthleticPhase(0.2, false, true);
  const pullTop = computeAthleticPhase(0.4, false, true);
  const pullLower = computeAthleticPhase(0.7, false, true);
  assert.equal(pullLift.phaseTag, 'concentrica');
  assert.equal(pullTop.phaseTag, 'pausa');
  assert.equal(pullTop.value, 1);
  assert.equal(pullLower.phaseTag, 'excentrica');
});
