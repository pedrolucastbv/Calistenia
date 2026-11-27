import { FEELING_SCALE_BANDS } from '../lib/feelingScale';

interface FeelingScaleLegendProps {
  /** Optional current score (1–10) to subtly highlight its matching band */
  activeScore?: number | null;
  /** Compact variant for inside modals or inline form drawers */
  compact?: boolean;
}

export function FeelingScaleLegend({
  activeScore = null,
  compact = false,
}: FeelingScaleLegendProps) {
  return (
    <div
      className={`rounded-lg border border-neutral-200 bg-neutral-50/80 ${
        compact ? 'p-3 space-y-2' : 'p-4 space-y-3'
      }`}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-xs font-semibold text-neutral-900">
          Escala de Sensação (Esforço Percebido · RPE 1–10)
        </div>
        <div className="text-[11px] text-neutral-500">
          Meta recomendada: notas 7–8 (RIR 2–3) · Deload: notas 4–6
        </div>
      </div>

      <div className="divide-y divide-neutral-200/80 border-t border-neutral-200/80">
        {FEELING_SCALE_BANDS.map((band) => {
          const isCurrent =
            activeScore !== null &&
            Number.isFinite(activeScore) &&
            Math.round(activeScore) >= band.min &&
            Math.round(activeScore) <= band.max;

          return (
            <div
              key={band.faixa}
              className={`grid grid-cols-1 sm:grid-cols-12 gap-x-3 gap-y-0.5 py-2 text-xs transition-colors ${
                isCurrent
                  ? 'bg-[#0F3D3E]/[0.06] -mx-2 px-2 rounded'
                  : ''
              }`}
            >
              <div className="sm:col-span-3 flex items-baseline gap-2">
                <span
                  className={`font-mono tabular-nums font-semibold ${
                    band.ideal
                      ? 'text-[#0F3D3E]'
                      : 'text-neutral-900'
                  }`}
                >
                  {band.faixa}
                </span>
                <span className="font-medium text-neutral-900">{band.titulo}</span>
              </div>
              <div className="sm:col-span-2 font-mono tabular-nums text-[11px] text-neutral-600">
                {band.rir}
              </div>
              <div className="sm:col-span-7 text-neutral-600 leading-relaxed">
                {band.descricao}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
