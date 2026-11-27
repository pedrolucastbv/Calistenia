import { useEffect, useMemo, useState } from 'react';
import { Check, Eye, Info, Pause, Play, RotateCcw, Timer, X } from 'lucide-react';
import { getExerciseVisualGuide } from '../lib/exerciseMedia';
import { describeFeelingScore } from '../lib/feelingScale';
import type { WorkoutLogEntry, WorkoutSession } from '../lib/types';
import { ExerciseMotionPlayer } from './ExerciseDemoModal';
import { FeelingScaleLegend } from './FeelingScaleLegend';

interface ActiveSessionModalProps {
  session: WorkoutSession;
  onClose: () => void;
  onCompleteSession: (entries: Omit<WorkoutLogEntry, 'id'>[]) => void;
}

interface ExerciseRunState {
  completedSets: boolean[];
  achievedReps: string;
  cleanForm: boolean;
  feeling: number;
  note: string;
}

function getTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate()
  ).padStart(2, '0')}`;
}

export function ActiveSessionModal({
  session,
  onClose,
  onCompleteSession,
}: ActiveSessionModalProps) {
  const allExercises = useMemo(
    () => [...session.blocoPrincipal, ...session.coreFinalizador],
    [session]
  );

  const [runStates, setRunStates] = useState<Record<string, ExerciseRunState>>(() => {
    const initial: Record<string, ExerciseRunState> = {};
    for (const ex of allExercises) {
      initial[ex.id] = {
        completedSets: Array.from({ length: ex.series }, () => false),
        achievedReps: String(ex.faixaMax),
        cleanForm: true,
        feeling: 7,
        note: '',
      };
    }
    return initial;
  });

  // Rest / Circuit Timer
  const defaultTimerSec = session.modoCircuito
    ? session.trabalhoCircuitoSeg ?? 40
    : allExercises[0]?.descansoSegundos ?? 75;
  const [timerSeconds, setTimerSeconds] = useState(defaultTimerSec);
  const [timerRunning, setTimerRunning] = useState(false);
  const [circuitPhase, setCircuitPhase] = useState<'trabalho' | 'descanso'>('trabalho');
  const [openGuideId, setOpenGuideId] = useState<string | null>(null);
  const [showFeelingLegend, setShowFeelingLegend] = useState(false);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          if (session.modoCircuito) {
            setCircuitPhase((phase) => {
              const nextPhase = phase === 'trabalho' ? 'descanso' : 'trabalho';
              return nextPhase;
            });
            return circuitPhase === 'trabalho'
              ? session.descansoCircuitoSeg ?? 20
              : session.trabalhoCircuitoSeg ?? 40;
          }
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning, session, circuitPhase]);

  const toggleSet = (exerciseId: string, setIndex: number, restSec: number) => {
    setRunStates((prev) => {
      const current = prev[exerciseId];
      const nextSets = [...current.completedSets];
      const willBeChecked = !nextSets[setIndex];
      nextSets[setIndex] = willBeChecked;

      if (willBeChecked && !session.modoCircuito) {
        setTimerSeconds(restSec);
        setTimerRunning(true);
      }

      return {
        ...prev,
        [exerciseId]: { ...current, completedSets: nextSets },
      };
    });
  };

  const totalSets = allExercises.reduce((acc, ex) => acc + ex.series, 0);
  const doneSets = Object.values(runStates).reduce(
    (acc, st) => acc + st.completedSets.filter(Boolean).length,
    0
  );

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleFinish = () => {
    const today = getTodayIso();
    const entries: Omit<WorkoutLogEntry, 'id'>[] = [];

    for (const ex of allExercises) {
      const st = runStates[ex.id];
      const completedCount = st.completedSets.filter(Boolean).length;
      if (completedCount === 0) continue;

      const parsedReps = Number(st.achievedReps) || ex.faixaMin;
      entries.push({
        data: today,
        patternId: ex.patternId,
        exercicio: ex.nome,
        variacao: `Degrau ${ex.degrauAtual} · ${ex.patternNome}`,
        degrau: ex.degrauAtual,
        series: completedCount,
        repsOuSegundos: parsedReps,
        alvoTopo: ex.faixaMax,
        unidade: ex.unidade,
        tecnicaLimpa: st.cleanForm,
        sensacao: st.feeling,
        observacao:
          st.note.trim() || `Sessão guiada (${session.codigo}) · ${ex.rirTexto}`,
      });
    }

    onCompleteSession(entries);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-session-title"
      className="fixed inset-0 z-50 bg-neutral-950/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Top Modal Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-neutral-500">
              Sessão guiada · {doneSets}/{totalSets} séries concluídas
            </div>
            <h2
              id="guided-session-title"
              className="font-display text-xl font-semibold text-neutral-900"
            >
              {session.titulo}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar sessão guiada"
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Sticky Timer Bar */}
        <div className="px-6 py-4 bg-neutral-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4">
            <Timer className="w-6 h-6 text-emerald-400 shrink-0" aria-hidden="true" />
            <div>
              <div className="text-xs text-neutral-400">
                {session.modoCircuito
                  ? `Circuito — Fase: ${circuitPhase === 'trabalho' ? 'Trabalho (40s)' : 'Descanso (20s)'}`
                  : 'Cronômetro de descanso'}
              </div>
              <div
                data-testid="rest-timer-display"
                className="font-mono tabular-nums text-3xl font-semibold tracking-tight"
              >
                {formatTimer(timerSeconds)}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!session.modoCircuito && (
              <div className="flex items-center gap-1 mr-1">
                {[60, 75, 90, 150, 180].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => {
                      setTimerSeconds(sec);
                      setTimerRunning(false);
                    }}
                    className={`px-2.5 py-1.5 rounded text-xs font-mono tabular-nums transition-colors ${
                      timerSeconds === sec && !timerRunning
                        ? 'bg-white text-neutral-900 font-semibold'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {sec >= 120 ? `${sec / 60}m` : `${sec}s`}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-500 transition-colors whitespace-nowrap"
            >
              {timerRunning ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Iniciar timer
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setCircuitPhase('trabalho');
                setTimerSeconds(defaultTimerSec);
              }}
              aria-label="Reiniciar cronômetro"
              className="p-2 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            >
              <RotateCcw className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Exercises Checklist Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F7F8FA]">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-neutral-600">
              <span>
                Marque cada série concluída para disparar o descanso e registre repetições + sensação (1–10).
              </span>
              <button
                type="button"
                onClick={() => setShowFeelingLegend((prev) => !prev)}
                aria-expanded={showFeelingLegend}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F3D3E] hover:underline whitespace-nowrap"
              >
                <Info className="w-3.5 h-3.5" aria-hidden="true" />
                {showFeelingLegend ? 'Ocultar escala de Sensação' : 'Escala de Sensação (1–10)'}
              </button>
            </div>
            {showFeelingLegend && <FeelingScaleLegend compact />}
          </div>

          {allExercises.map((ex, index) => {
            const st = runStates[ex.id];
            const media = getExerciseVisualGuide(ex.patternId, ex.degrauAtual);
            const isGuideOpen = openGuideId === ex.id;
            return (
              <div
                key={ex.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => setOpenGuideId(isGuideOpen ? null : ex.id)}
                      aria-expanded={isGuideOpen}
                      aria-label={`Ver demonstração de ${ex.nome}`}
                      className="w-20 h-15 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 hover:border-[#0F3D3E] transition-colors"
                    >
                      <img
                        src={media.fotoUrl}
                        alt={media.fotoAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                    <div className="min-w-0">
                      <div className="text-xs text-neutral-500">
                        0{index + 1}. {ex.patternNome} · {ex.rirTexto} · Descanso {ex.descansoTexto}
                      </div>
                      <h3 className="text-base font-semibold text-neutral-900 mt-0.5">
                        {ex.nome}
                      </h3>
                      <p className="text-xs text-neutral-600 mt-1">{ex.dicaExecucao}</p>
                    </div>
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    <div className="font-mono tabular-nums text-xs font-semibold text-neutral-800">
                      Meta: {ex.series}×{ex.faixaMin}–{ex.faixaMax}
                      {ex.unidade === 's' ? 's' : ''}
                    </div>
                    <button
                      type="button"
                      onClick={() => setOpenGuideId(isGuideOpen ? null : ex.id)}
                      aria-expanded={isGuideOpen}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-[#0F3D3E] hover:text-[#0F3D3E] whitespace-nowrap"
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      {isGuideOpen ? 'Ocultar guia' : 'Ver como fazer'}
                    </button>
                  </div>
                </div>

                {isGuideOpen && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-200">
                    <div className="space-y-2">
                      <div className="aspect-4/3 rounded-lg overflow-hidden border border-neutral-200 bg-neutral-100">
                        <img
                          src={media.fotoUrl}
                          alt={media.fotoAlt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {media.legendaFoto}
                      </p>
                      <div className="text-xs text-neutral-700">
                        <strong>Respiração:</strong> {media.respiracao}
                      </div>
                    </div>
                    <div className="space-y-3">
                      <ExerciseMotionPlayer
                        patternId={ex.patternId}
                        rung={ex.degrauAtual}
                        exerciseTitle={ex.nome}
                        compact
                      />
                      <ol className="space-y-1.5 text-xs text-neutral-700">
                        {media.passosExecucao.map((step) => (
                          <li key={step.fase}>
                            <strong className="font-mono text-[#0F3D3E]">{step.fase}.</strong>{' '}
                            <strong className="text-neutral-900">{step.titulo}:</strong>{' '}
                            {step.detalhe}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                )}

                {/* Set checkboxes */}
                <div className="flex flex-wrap items-center gap-2">
                  {st.completedSets.map((done, setIdx) => (
                    <button
                      key={setIdx}
                      type="button"
                      onClick={() => toggleSet(ex.id, setIdx, ex.descansoSegundos)}
                      aria-pressed={done}
                      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono tabular-nums font-medium transition-colors duration-100 ${
                        done
                          ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                          : 'bg-white border-neutral-300 text-neutral-700 hover:border-neutral-400'
                      }`}
                    >
                      {done && <Check className="w-3.5 h-3.5" aria-hidden="true" />}
                      Série {setIdx + 1}
                    </button>
                  ))}
                </div>

                {/* Inline performance inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 items-start">
                  <div>
                    <label
                      htmlFor={`run-reps-${ex.id}`}
                      className="block text-xs text-neutral-600 mb-1"
                    >
                      {ex.unidade === 's' ? 'Segundos realizados' : 'Reps realizadas / série'}
                    </label>
                    <input
                      id={`run-reps-${ex.id}`}
                      type="number"
                      min={1}
                      value={st.achievedReps}
                      onChange={(e) =>
                        setRunStates((prev) => ({
                          ...prev,
                          [ex.id]: { ...prev[ex.id], achievedReps: e.target.value },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 font-mono tabular-nums text-xs"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`run-feel-${ex.id}`}
                      className="block text-xs text-neutral-600 mb-1"
                    >
                      Sensação (1–10)
                    </label>
                    <input
                      id={`run-feel-${ex.id}`}
                      type="number"
                      min={1}
                      max={10}
                      value={st.feeling}
                      onChange={(e) =>
                        setRunStates((prev) => ({
                          ...prev,
                          [ex.id]: {
                            ...prev[ex.id],
                            feeling: Math.max(1, Math.min(10, Number(e.target.value) || 7)),
                          },
                        }))
                      }
                      className="w-full px-2.5 py-1.5 rounded-md border border-neutral-300 font-mono tabular-nums text-xs"
                    />
                    {(() => {
                      const band = describeFeelingScore(st.feeling);
                      return band ? (
                        <p className="text-[11px] text-neutral-500 mt-1">
                          {band.titulo} · {band.rir}
                        </p>
                      ) : null;
                    })()}
                  </div>

                  <div className="flex items-center sm:pt-6">
                    <label className="inline-flex items-center gap-2 text-xs text-neutral-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={st.cleanForm}
                        onChange={(e) =>
                          setRunStates((prev) => ({
                            ...prev,
                            [ex.id]: { ...prev[ex.id], cleanForm: e.target.checked },
                          }))
                        }
                        className="h-4 w-4 rounded border-neutral-300 text-[#0F3D3E]"
                      />
                      Técnica limpa
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Action Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <p className="text-xs text-neutral-500">
            Exercícios com pelo menos 1 série marcada serão salvos automaticamente no Registro de Treinos.
          </p>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 whitespace-nowrap"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleFinish}
              disabled={doneSets === 0}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-[#0F3D3E] text-white text-sm font-medium hover:bg-[#0B2E2F] disabled:opacity-40 whitespace-nowrap"
            >
              <Check className="w-4 h-4" aria-hidden="true" />
              Concluir e salvar ({doneSets} séries)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
