import test from 'node:test';
import assert from 'node:assert/strict';
import { describeFeelingScore, FEELING_SCALE_BANDS } from './feelingScale';

test('FEELING_SCALE_BANDS covers every integer from 1 to 10 without gaps', () => {
  for (let score = 1; score <= 10; score += 1) {
    const match = describeFeelingScore(score);
    assert.ok(match, `Nota ${score} deveria mapear para uma faixa da escala`);
  }
  assert.equal(FEELING_SCALE_BANDS.length, 5);
});

test('describeFeelingScore maps key bands accurately', () => {
  assert.equal(describeFeelingScore(1)?.titulo, 'Muito leve');
  assert.equal(describeFeelingScore(4)?.titulo, 'Muito leve');
  assert.equal(describeFeelingScore(5)?.titulo, 'Moderado');
  assert.equal(describeFeelingScore(6)?.titulo, 'Moderado');
  assert.equal(describeFeelingScore(7)?.titulo, 'Ideal de treino');
  assert.equal(describeFeelingScore(7)?.ideal, true);
  assert.equal(describeFeelingScore(8)?.rir, 'RIR 2–3');
  assert.equal(describeFeelingScore(9)?.titulo, 'Bem pesado');
  assert.equal(describeFeelingScore(10)?.titulo, 'Esforço máximo');
});

test('describeFeelingScore returns null for out-of-range or invalid numbers', () => {
  assert.equal(describeFeelingScore(0), null);
  assert.equal(describeFeelingScore(11), null);
  assert.equal(describeFeelingScore(Number.NaN), null);
});
