import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Camera,
  Check,
  Film,
  Pause,
  Play,
  Rotate3d,
  Wind,
  X,
} from 'lucide-react';
import {
  computeAthleticPhase,
  isPullOrRisePattern,
} from '../lib/biomechanicsRig';
import { PROGRESSION_LADDERS } from '../lib/calisthenicsData';
import { getExerciseVisualGuide } from '../lib/exerciseMedia';
import {
  getDefaultVariationId,
  getObjectVariations,
  isIsometricPose,
  MUSCLE_ACTIVATION_MAP,
} from '../lib/gymVisualRig3D';
import type { MovementPatternId } from '../lib/types';
import { GymVisual3DViewer, type CameraPreset } from './GymVisual3DViewer';

interface ExerciseMotionPlayerProps {
  patternId: MovementPatternId;
  rung?: number;
  exerciseTitle?: string;
  compact?: boolean;
}

function getPhaseBadgeLabel(
  phaseTag: 'inicio' | 'excentrica' | 'pausa' | 'concentrica' | 'isometria',
  isPullOrRise: boolean
): string {
  if (phaseTag === 'inicio') return 'Posição inicial';
  if (phaseTag === 'isometria') return 'Sustentação ativa';
  if (phaseTag === 'pausa') return isPullOrRise ? 'Pausa no topo' : 'Pausa no fundo';
  if (phaseTag === 'concentrica') return isPullOrRise ? 'Subida firme' : 'Empurrada firme';
  return 'Descida controlada';
}

/**
 * Interactive GymVisual-style 3D anatomical exercise motion player with
 * real-time primary/synergist muscle activation, 3 household object variations
 * when equipment is used, 360° orbit camera, and frame scrubbing.
 */
export function ExerciseMotionPlayer({
  patternId,
  rung,
  exerciseTitle,
  compact = false,
}: ExerciseMotionPlayerProps) {
  const guide = getExerciseVisualGuide(patternId, rung);
  const muscles = MUSCLE_ACTIVATION_MAP[patternId];
  const objectVariations = getObjectVariations(patternId);
  const isIso = isIsometricPose(patternId, rung);
  const isPullOrRise =
    patternId === 'dobradica_posterior' && (rung === 3 || rung === 4)
      ? false
      : isPullOrRisePattern(patternId);

  const [playing, setPlaying] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return true;
  });
  const [slowMo, setSlowMo] = useState(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('3/4');
  const [showMuscles, setShowMuscles] = useState(true);
  const [variantId, setVariantId] = useState<string | undefined>(() =>
    getDefaultVariationId(patternId, rung, exerciseTitle)
  );
  const [progress, setProgress] = useState(() => (isIso ? 0.45 : 0.06));

  useEffect(() => {
    setVariantId(getDefaultVariationId(patternId, rung, exerciseTitle));
    setProgress(isIso ? 0.45 : 0.06);
  }, [patternId, rung, exerciseTitle, isIso]);

  const handleProgressTick = useCallback((next: number) => {
    setProgress(next);
  }, []);

  const activeVariation =
    objectVariations.find((v) => v.id === variantId) ?? objectVariations[0];

  const { phaseTag, phaseIndex } = computeAthleticPhase(
    progress,
    isIso,
    isPullOrRise
  );

  const activePhaseLabel = activeVariation
    ? activeVariation.phaseCues[phaseIndex - 1]
    : phaseIndex === 1
      ? guide.fasesAnimacao.fase1
      : phaseIndex === 2
        ? guide.fasesAnimacao.fase2
        : guide.fasesAnimacao.fase3;

  const phaseTagLabel = getPhaseBadgeLabel(phaseTag, isPullOrRise);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* 3-Option Household Object Variation Switcher (only for exercises that use objects) */}
      {objectVariations.length > 0 && (
        <div className="px-3.5 py-2.5 bg-[#F8FAFC] border-b border-neutral-200 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-neutral-700 shrink-0">
              Variação com objeto ({objectVariations.length} opções)
            </span>
            {activeVariation && (
              <span className="text-[11px] text-neutral-500 truncate text-right">
                {activeVariation.objectLabel}
              </span>
            )}
          </div>
          <div
            role="group"
            aria-label="Escolher variação de objeto para este exercício"
            className="grid grid-cols-3 gap-1 rounded-lg bg-neutral-200/70 p-0.5"
          >
            {objectVariations.map((opt) => {
              const selected = activeVariation?.id === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setVariantId(opt.id);
                    setProgress(isIso ? 0.45 : 0.06);
                  }}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors text-center leading-tight ${
                    selected
                      ? 'bg-[#0F3D3E] text-white shadow-xs'
                      : 'text-neutral-700 hover:text-neutral-950 hover:bg-white/60'
                  }`}
                >
                  {opt.shortLabel}
                </button>
              );
            })}
          </div>
          {activeVariation && (
            <p className="text-[11px] text-neutral-600 leading-snug">
              <strong className="font-semibold text-neutral-800">Montagem:</strong>{' '}
              {activeVariation.setupTip}{' '}
              <span className="text-neutral-500">{activeVariation.safetyNote}</span>
            </p>
          )}
        </div>
      )}

      {/* 3D GymVisual Studio Stage (unobstructed center, solid HUD strip above/below) */}
      <div className="relative bg-[#F8FAFC]">
        <GymVisual3DViewer
          patternId={patternId}
          variantId={activeVariation?.id}
          rung={rung}
          progress={progress}
          playing={playing}
          slowMo={slowMo}
          cameraPreset={cameraPreset}
          showMuscles={showMuscles}
          compact={compact}
          onProgressTick={handleProgressTick}
          ariaLabel={`Animação anatômica 3D estilo GymVisual${activeVariation ? ` (${activeVariation.label})` : ''}: ${guide.fotoAlt}`}
        />

        {/* Minimal unboxed top-left phase readout (no backdrop-blur over WebGL) */}
        <div className="absolute top-2.5 left-3.5 text-[11px] font-medium text-neutral-600 pointer-events-none select-none">
          <span className="text-[#0F3D3E] font-semibold">{phaseTagLabel}</span>
          {!compact && (
            <span className="text-neutral-500"> · Arraste para girar 3D</span>
          )}
        </div>
      </div>

      {/* Muscle Activation Legend (GymVisual signature red/coral anatomy key) */}
      <div className="px-4 py-2.5 bg-[#FAFBFD] border-t border-neutral-200 flex items-start justify-between gap-3 text-[11px]">
        <div className="min-w-0 space-y-0.5 text-neutral-700 leading-snug">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-[2px] bg-[#C81E1E] inline-block shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">
              <strong className="font-semibold text-neutral-900">Principal:</strong>{' '}
              {muscles.primaryLabelPt}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-neutral-600">
            <span
              className="w-2.5 h-2.5 rounded-[2px] bg-[#E86B6B] inline-block shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">Sinergistas: {muscles.secondaryLabelPt}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowMuscles((m) => !m)}
          className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded border transition-colors whitespace-nowrap ${
            showMuscles
              ? 'border-[#C81E1E]/30 bg-[#C81E1E]/10 text-[#991B1B]'
              : 'border-neutral-300 bg-white text-neutral-600 hover:text-neutral-900'
          }`}
        >
          {showMuscles ? 'Músculos: ativos' : 'Músculos: ocultos'}
        </button>
      </div>

      {/* Unified bottom controls: Frame scrubber, Phase readout, Camera angle, Speed, Play/Pause */}
      <div className="px-4 py-3 bg-white border-t border-neutral-200 space-y-2.5">
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={99}
            value={Math.round(progress * 100)}
            onChange={(e) => {
              setPlaying(false);
              setProgress(Number(e.target.value) / 100);
            }}
            aria-label="Avançar ou voltar fase do movimento"
            className="w-full h-1.5 accent-[#0F3D3E] cursor-pointer"
          />
          <span className="text-[11px] font-mono tabular-nums text-neutral-500 shrink-0 w-9 text-right">
            {Math.round(progress * 100)}%
          </span>
        </div>

        {/* Row 1: Full-width phase guidance + cadence (zero overlap or vertical crushing) */}
        <div className="min-w-0 space-y-0.5">
          <div className="text-xs font-medium text-neutral-900 leading-snug">
            {activePhaseLabel}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono tabular-nums">
            {guide.cadencia}
          </div>
        </div>

        {/* Row 2: Camera presets (left) + Speed & Play/Pause (right) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <div
            role="group"
            aria-label="Ângulo da câmera 3D"
            className="inline-flex items-center rounded-md border border-neutral-300 bg-neutral-50 p-0.5"
          >
            <Rotate3d
              className="w-3.5 h-3.5 text-neutral-500 mx-1.5 shrink-0"
              aria-hidden="true"
            />
            {(['3/4', 'lateral', 'frontal'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setCameraPreset(preset)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors capitalize ${
                  cameraPreset === preset
                    ? 'bg-[#0F3D3E] text-white'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSlowMo((s) => !s)}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-mono tabular-nums transition-colors ${
                slowMo
                  ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                  : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
              }`}
            >
              {slowMo ? '0.5x' : '1x'}
            </button>
            <button
              type="button"
              onClick={() => setPlaying((pl) => !pl)}
              aria-label={
                playing
                  ? 'Pausar demonstração animada'
                  : 'Reproduzir demonstração animada'
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-50 whitespace-nowrap"
            >
              {playing ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  Pausar
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Animar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ExerciseDemoModalProps {
  patternId: MovementPatternId;
  exerciseTitle: string;
  rung?: number;
  variationCue?: string;
  onClose: () => void;
}

export function ExerciseDemoModal({
  patternId,
  exerciseTitle,
  rung,
  variationCue,
  onClose,
}: ExerciseDemoModalProps) {
  // Default directly to the 3D GymVisual animation tab so users see the animated movement immediately!
  const [mediaMode, setMediaMode] = useState<'animacao' | 'foto'>('animacao');
  const [imgError, setImgError] = useState(false);

  const guide = getExerciseVisualGuide(patternId, rung);
  const ladder = PROGRESSION_LADDERS[patternId];

  useEffect(() => {
    setImgError(false);
  }, [patternId, rung]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-demo-title"
      className="fixed inset-0 z-50 bg-neutral-950/60 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white border border-neutral-200 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 flex items-start justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-neutral-500">
              {ladder.nome}
              {rung ? ` · Degrau ${rung}` : ''} · Guia visual de execução
            </div>
            <h2
              id="exercise-demo-title"
              className="font-display text-xl font-semibold text-neutral-900 mt-0.5"
            >
              {exerciseTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar guia visual"
            className="p-2 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: 3D GymVisual Animated Player / Studio Photo */}
          <div className="lg:col-span-6 space-y-4">
            <div
              role="tablist"
              aria-label="Modo de visualização do exercício"
              className="inline-flex items-center gap-1 p-1 bg-neutral-100 rounded-lg"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mediaMode === 'animacao'}
                onClick={() => setMediaMode('animacao')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  mediaMode === 'animacao'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Film className="w-3.5 h-3.5" aria-hidden="true" />
                Animação 3D (músculos)
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mediaMode === 'foto'}
                onClick={() => setMediaMode('foto')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                  mediaMode === 'foto'
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Camera className="w-3.5 h-3.5" aria-hidden="true" />
                Foto técnica
              </button>
            </div>

            {mediaMode === 'animacao' ? (
              <ExerciseMotionPlayer
                patternId={patternId}
                rung={rung}
                exerciseTitle={exerciseTitle}
              />
            ) : (
              <figure className="space-y-2.5">
                <div className="aspect-4/3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                  {!imgError ? (
                    <img
                      src={guide.fotoUrl}
                      alt={guide.fotoAlt}
                      referrerPolicy="no-referrer"
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-neutral-600">
                      <span className="font-display text-base font-semibold">
                        {ladder.nome}
                      </span>
                      <span className="text-xs mt-1">{guide.legendaFoto}</span>
                    </div>
                  )}
                </div>
                <figcaption className="text-xs text-neutral-600 leading-relaxed">
                  {guide.legendaFoto}
                </figcaption>
              </figure>
            )}

            {/* Cadence & Breathing Summary */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-900">
                <Wind className="w-4 h-4 text-[#0F3D3E]" aria-hidden="true" />
                Ritmo e respiração
              </div>
              <div className="text-xs text-neutral-700 font-mono tabular-nums">
                Cadência: {guide.cadencia}
              </div>
              <div className="text-xs text-neutral-700">
                Respiração: {guide.respiracao}
              </div>
            </div>

            {variationCue && (
              <div className="p-4 rounded-xl bg-[#0F3D3E]/[0.05] border border-[#0F3D3E]/20 text-xs text-neutral-800 space-y-1">
                <div className="font-semibold text-[#0F3D3E]">
                  Foco desta variação no seu plano
                </div>
                <p className="leading-relaxed">{variationCue}</p>
              </div>
            )}
          </div>

          {/* Right: Step-by-step instructions & checkpoints */}
          <div className="lg:col-span-6 space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-900">
                Execução passo a passo
              </h3>
              <ol className="space-y-3">
                {guide.passosExecucao.map((step) => (
                  <li
                    key={step.fase}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200"
                  >
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#0F3D3E] mt-0.5 shrink-0">
                      {step.fase}.
                    </span>
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-neutral-900">
                        {step.titulo}
                      </div>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        {step.detalhe}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">
                Pontos de atenção na postura
              </h3>
              <ul className="space-y-1.5">
                {guide.pontosAtencao.map((pt, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                    <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <h3 className="text-sm font-semibold text-amber-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700" aria-hidden="true" />
                Erros comuns a evitar
              </h3>
              <ul className="space-y-1.5">
                {guide.errosEvitar.map((err, idx) => (
                  <li key={idx} className="text-xs text-neutral-700 leading-relaxed">
                    • {err}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-neutral-200 bg-neutral-50 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#0F3D3E] text-white text-sm font-medium hover:bg-[#0B2E2F] transition-colors whitespace-nowrap"
          >
            Entendi, voltar ao treino
          </button>
        </div>
      </div>
    </div>
  );
}
