import { useEffect, useState } from 'react';
import { ArrowUp, Download, Info, Plus, Search, Trash2 } from 'lucide-react';
import { PROGRESSION_LADDERS } from '../lib/calisthenicsData';
import { describeFeelingScore } from '../lib/feelingScale';
import { formatLogsToCsv } from '../lib/programEngine';
import { FeelingScaleLegend } from './FeelingScaleLegend';
import type {
  DoubleProgressionStatus,
  MovementPatternId,
  PlannedExercise,
  UserProfile,
  WorkoutLogEntry,
} from '../lib/types';

interface TrainingLogViewProps {
  profile: UserProfile;
  logs: WorkoutLogEntry[];
  doubleProgressions: DoubleProgressionStatus[];
  prefillExercise: PlannedExercise | null;
  onClearPrefill: () => void;
  onAddLog: (entry: Omit<WorkoutLogEntry, 'id'>) => void;
  onDeleteLog: (id: string) => void;
  onAdvancePattern: (patternId: MovementPatternId, delta: 1 | -1) => void;
}

const PATTERN_IDS = Object.keys(PROGRESSION_LADDERS) as MovementPatternId[];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TrainingLogView({
  profile,
  logs,
  doubleProgressions,
  prefillExercise,
  onClearPrefill,
  onAddLog,
  onDeleteLog,
  onAdvancePattern,
}: TrainingLogViewProps) {
  const [patternId, setPatternId] = useState<MovementPatternId>(
    prefillExercise?.patternId ?? 'empurrar_horizontal'
  );
  const [data, setData] = useState(getTodayIso());
  const [series, setSeries] = useState(String(prefillExercise?.series ?? 3));
  const [repsOuSegundos, setRepsOuSegundos] = useState(
    prefillExercise ? String(prefillExercise.faixaMax) : ''
  );
  const [sensacao, setSensacao] = useState('7');
  const [showFeelingScale, setShowFeelingScale] = useState(false);
  const [tecnicaLimpa, setTecnicaLimpa] = useState(true);
  const [observacao, setObservacao] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPattern, setFilterPattern] = useState<MovementPatternId | 'todos'>('todos');

  useEffect(() => {
    if (prefillExercise) {
      setPatternId(prefillExercise.patternId);
      setSeries(String(prefillExercise.series));
      setRepsOuSegundos(String(prefillExercise.faixaMax));
      setFormError(null);
      onClearPrefill();
    }
  }, [prefillExercise, onClearPrefill]);

  const activeLadder = PROGRESSION_LADDERS[patternId];
  const currentRung = profile.degrausPorPadrao[patternId] ?? 1;
  const activeStep =
    activeLadder.degraus[Math.max(0, Math.min(activeLadder.degraus.length - 1, currentRung - 1))];
  const isStrength = profile.objetivo === 'forca' || profile.objetivo === 'habilidade';
  const targetRange = isStrength
    ? activeStep.faixaSugeridaForca
    : activeStep.faixaSugeridaHipertrofia;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!data.trim()) {
      setFormError('Informe a data do treino.');
      return;
    }

    const parsedSets = Number(series);
    const parsedReps = Number(repsOuSegundos);
    const parsedFeeling = Number(sensacao);

    if (!series.trim() || Number.isNaN(parsedSets) || parsedSets < 1 || parsedSets > 20) {
      setFormError('Informe um número válido de séries (entre 1 e 20).');
      return;
    }

    if (
      !repsOuSegundos.trim() ||
      Number.isNaN(parsedReps) ||
      parsedReps < 1 ||
      parsedReps > 600
    ) {
      setFormError(
        `Informe um valor válido de ${
          targetRange.unidade === 's' ? 'segundos' : 'repetições'
        } realizados.`
      );
      return;
    }

    if (
      !sensacao.trim() ||
      Number.isNaN(parsedFeeling) ||
      parsedFeeling < 1 ||
      parsedFeeling > 10
    ) {
      setFormError('A sensação (esforço percebido) deve estar entre 1 e 10.');
      return;
    }

    onAddLog({
      data,
      patternId,
      exercicio: activeStep.nome,
      variacao: `Degrau ${activeStep.degrau} · ${activeLadder.nome}`,
      degrau: activeStep.degrau,
      series: parsedSets,
      repsOuSegundos: parsedReps,
      alvoTopo: targetRange.max,
      unidade: targetRange.unidade,
      tecnicaLimpa,
      sensacao: parsedFeeling,
      observacao: observacao.trim(),
    });

    setRepsOuSegundos('');
    setObservacao('');
  };

  const handleExportCsv = () => {
    const csv = formatLogsToCsv(logs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `registro-calistenia-${getTodayIso()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter((entry) => {
    if (filterPattern !== 'todos' && entry.patternId !== filterPattern) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        entry.exercicio.toLowerCase().includes(q) ||
        entry.variacao.toLowerCase().includes(q) ||
        entry.observacao.toLowerCase().includes(q) ||
        entry.data.includes(q)
      );
    }
    return true;
  });

  const activeTrackers = doubleProgressions.filter(
    (dp) => dp.sessoesLimpasNoTopo > 0 || dp.patternId === 'empurrar_horizontal' || dp.patternId === 'puxar_horizontal' || dp.patternId === 'agachar'
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-500">
            Registro simples e acompanhamento de dupla progressão
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mt-1">
            Registro de treinos e evolução
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Anote séries, repetições, sensação (1–10) e observações. Ao fechar 2 sessões limpas seguidas no topo da faixa, o sistema libera o próximo degrau.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={logs.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-40 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          <Download className="w-4 h-4" aria-hidden="true" />
          Exportar CSV
        </button>
      </div>

      {/* Double Progression Status Strip */}
      <section aria-label="Status de dupla progressão" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {activeTrackers.slice(0, 3).map((item) => (
          <div
            key={item.patternId}
            className={`p-4 rounded-xl border ${
              item.prontoParaAvancar
                ? 'bg-emerald-50/70 border-emerald-200'
                : 'bg-white border-neutral-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
              <span>{item.patternNome}</span>
              <span className="font-mono tabular-nums font-semibold text-neutral-900">
                {Math.min(item.sessoesLimpasNoTopo, 2)}/2 sessões
              </span>
            </div>
            <div className="text-sm font-semibold text-neutral-900 mt-1 truncate">
              {item.variacaoAtual}
            </div>
            {item.prontoParaAvancar && item.proximaVariacao ? (
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-emerald-800 truncate">
                  Pronto: {item.proximaVariacao}
                </span>
                <button
                  type="button"
                  onClick={() => onAdvancePattern(item.patternId, 1)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 whitespace-nowrap shrink-0"
                >
                  <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                  Avançar
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 mt-2">
                {item.proximaVariacao
                  ? `Próximo degrau: ${item.proximaVariacao}`
                  : 'Topo da escada atingido'}
              </p>
            )}
          </div>
        ))}
      </section>

      {/* Quick Manual Log Form */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6">
        <h2 className="font-display text-lg font-semibold text-neutral-900 mb-4">
          Novo registro de exercício
        </h2>

        {formError && (
          <div
            role="alert"
            className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-800"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="log-date" className="block text-xs font-medium text-neutral-700 mb-1">
                Data
              </label>
              <input
                id="log-date"
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              />
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <label htmlFor="log-pattern" className="block text-xs font-medium text-neutral-700 mb-1">
                Padrão de movimento (usa seu degrau ativo)
              </label>
              <select
                id="log-pattern"
                value={patternId}
                onChange={(e) => setPatternId(e.target.value as MovementPatternId)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm bg-white focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              >
                {PATTERN_IDS.map((pid) => {
                  const l = PROGRESSION_LADDERS[pid];
                  const r = profile.degrausPorPadrao[pid] ?? 1;
                  const s = l.degraus[r - 1];
                  return (
                    <option key={pid} value={pid}>
                      {l.nome} — D{r}: {s.nome}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label htmlFor="log-sets" className="block text-xs font-medium text-neutral-700 mb-1">
                Séries concluídas
              </label>
              <input
                id="log-sets"
                type="number"
                min={1}
                max={20}
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                placeholder="3"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono tabular-nums text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            <div>
              <label htmlFor="log-reps" className="block text-xs font-medium text-neutral-700 mb-1">
                {targetRange.unidade === 's'
                  ? `Segundos por série (meta topo: ${targetRange.max}s)`
                  : `Reps por série (meta topo: ${targetRange.max})`}
              </label>
              <input
                id="log-reps"
                type="number"
                min={1}
                max={600}
                value={repsOuSegundos}
                onChange={(e) => setRepsOuSegundos(e.target.value)}
                placeholder={`Ex.: ${targetRange.max}`}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono tabular-nums text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label htmlFor="log-feeling" className="text-xs font-medium text-neutral-700">
                  Sensação (1–10)
                </label>
                <button
                  type="button"
                  onClick={() => setShowFeelingScale((prev) => !prev)}
                  aria-expanded={showFeelingScale}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-[#0F3D3E] hover:underline whitespace-nowrap"
                >
                  <Info className="w-3 h-3" aria-hidden="true" />
                  {showFeelingScale ? 'Ocultar escala' : 'Ver escala'}
                </button>
              </div>
              <input
                id="log-feeling"
                type="number"
                min={1}
                max={10}
                value={sensacao}
                onChange={(e) => setSensacao(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono tabular-nums text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              />
              {(() => {
                const band = describeFeelingScore(Number(sensacao));
                return (
                  <p className="text-[11px] text-neutral-500 mt-1">
                    {band
                      ? `${band.titulo} · ${band.rir}`
                      : 'Informe um número de 1 (muito leve) a 10 (máximo)'}
                  </p>
                );
              })()}
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="log-note" className="block text-xs font-medium text-neutral-700 mb-1">
                Observação (técnica, descanso, sensação articular)
              </label>
              <input
                id="log-note"
                type="text"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Ex.: Descida controlada 3s, sem dor no ombro"
                className="w-full px-3 py-2 rounded-lg border border-neutral-300 text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              />
            </div>
          </div>

          {showFeelingScale && (
            <FeelingScaleLegend activeScore={Number(sensacao)} compact />
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={tecnicaLimpa}
                onChange={(e) => setTecnicaLimpa(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-300 text-[#0F3D3E]"
              />
              Todas as séries feitas com técnica limpa (sem quebrar a forma)
            </label>

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F3D3E] text-white text-sm font-medium hover:bg-[#0B2E2F] transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Salvar registro
            </button>
          </div>
        </form>
      </section>

      {/* History Table */}
      <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            Histórico ({filteredLogs.length})
          </h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative">
              <Search
                className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Buscar registros"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar exercício ou nota..."
                className="pl-9 pr-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white w-full sm:w-56 focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              />
            </div>

            <select
              aria-label="Filtrar por padrão de movimento"
              value={filterPattern}
              onChange={(e) =>
                setFilterPattern(e.target.value as MovementPatternId | 'todos')
              }
              className="px-3 py-2 text-xs rounded-lg border border-neutral-300 bg-white text-neutral-700 focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
            >
              <option value="todos">Todos os padrões</option>
              {PATTERN_IDS.map((pid) => (
                <option key={pid} value={pid}>
                  {PROGRESSION_LADDERS[pid].nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <p className="text-sm font-medium text-neutral-800">
              Nenhum registro encontrado para este filtro.
            </p>
            <p className="text-xs text-neutral-500">
              Use o formulário acima ou conclua uma Sessão Guiada para salvar seu histórico de evolução.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500 bg-neutral-50/70">
                  <th className="py-3 pl-5 pr-3">Data</th>
                  <th className="py-3 px-3">Exercício</th>
                  <th className="py-3 px-3">Séries × Reps</th>
                  <th className="py-3 px-3">Variação</th>
                  <th className="py-3 px-3 text-right">Sensação</th>
                  <th className="py-3 px-3">Observação</th>
                  <th className="py-3 pl-3 pr-5 text-right">Excluir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {filteredLogs.map((entry) => {
                  const hitTop = entry.tecnicaLimpa && entry.repsOuSegundos >= entry.alvoTopo;
                  return (
                    <tr key={entry.id} className="hover:bg-neutral-50/70 align-top">
                      <td className="py-3 pl-5 pr-3 font-mono tabular-nums text-xs text-neutral-600 whitespace-nowrap">
                        {entry.data}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-neutral-900">{entry.exercicio}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">
                          {entry.tecnicaLimpa ? 'Técnica limpa' : 'Forma parcial'}
                          {hitTop && (
                            <span className="text-emerald-700 font-medium">
                              {' '}
                              · Topo da faixa atingido
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-neutral-900 font-medium whitespace-nowrap">
                        {entry.series}×{entry.repsOuSegundos}
                        {entry.unidade === 's' ? 's' : ''}
                      </td>
                      <td className="py-3 px-3 text-xs text-neutral-600">{entry.variacao}</td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="font-mono tabular-nums text-neutral-900 font-medium">
                          {entry.sensacao}/10
                        </div>
                        {(() => {
                          const band = describeFeelingScore(entry.sensacao);
                          return band ? (
                            <div className="text-[11px] text-neutral-500 mt-0.5">
                              {band.titulo}
                            </div>
                          ) : null;
                        })()}
                      </td>
                      <td className="py-3 px-3 text-xs text-neutral-600 max-w-xs">
                        {entry.observacao || '—'}
                      </td>
                      <td className="py-3 pl-3 pr-5 text-right">
                        <button
                          type="button"
                          onClick={() => onDeleteLog(entry.id)}
                          aria-label={`Excluir registro de ${entry.exercicio} em ${entry.data}`}
                          className="p-1.5 rounded-md text-neutral-400 hover:text-red-700 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
