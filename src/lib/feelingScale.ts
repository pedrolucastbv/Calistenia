export interface FeelingScaleBand {
  faixa: string;
  min: number;
  max: number;
  titulo: string;
  rir: string;
  descricao: string;
  ideal?: boolean;
}

export const FEELING_SCALE_BANDS: FeelingScaleBand[] = [
  {
    faixa: '1–4',
    min: 1,
    max: 4,
    titulo: 'Muito leve',
    rir: 'RIR 5+',
    descricao: 'Aquecimento, técnica ou deload; sobram muitas repetições com folga.',
  },
  {
    faixa: '5–6',
    min: 5,
    max: 6,
    titulo: 'Moderado',
    rir: 'RIR 4+',
    descricao: 'Ritmo confortável; daria para fazer 4 ou mais repetições limpas extras.',
  },
  {
    faixa: '7–8',
    min: 7,
    max: 8,
    titulo: 'Ideal de treino',
    rir: 'RIR 2–3',
    descricao: 'Desafiador, com técnica limpa e 2 a 3 repetições ainda na reserva.',
    ideal: true,
  },
  {
    faixa: '9',
    min: 9,
    max: 9,
    titulo: 'Bem pesado',
    rir: 'RIR ~1',
    descricao: 'Quase no limite; sobraria no máximo 1 repetição com boa forma.',
  },
  {
    faixa: '10',
    min: 10,
    max: 10,
    titulo: 'Esforço máximo',
    rir: 'RIR 0 (falha)',
    descricao: 'Sem repetições extras possíveis; evite atingir com frequência para preservar a técnica.',
  },
];

export function describeFeelingScore(score: number): FeelingScaleBand | null {
  if (!Number.isFinite(score)) return null;
  const rounded = Math.round(score);
  if (rounded < 1 || rounded > 10) return null;
  return (
    FEELING_SCALE_BANDS.find((band) => rounded >= band.min && rounded <= band.max) ??
    null
  );
}
