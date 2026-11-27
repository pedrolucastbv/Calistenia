import { useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Play,
  PlusCircle,
  ShieldAlert,
  VolumeX,
} from 'lucide-react';
import { PRESET_MODELS } from '../lib/calisthenicsData';
import { getExerciseVisualGuide } from '../lib/exerciseMedia';
import type {
  DoubleProgressionStatus,
  GeneratedPlan,
  MovementPatternId,
  PlannedExercise,
  PresetModelId,
  UserProfile,
} from '../lib/types';

const STUDIO_HERO_IMAGE =
  '/src/assets/images/calisthenics_home_studio_1795738935862.jpg';

interface PlanOverviewProps {
  profile: UserProfile;
  plan: GeneratedPlan;
  selectedSessionId: string;
  onSelectSession: (sessionId: string) => void;
  doubleProgressions: DoubleProgressionStatus[];
  onToggleDeload: () => void;
  onToggleApartment: () => void;
  onAdvancePattern: (patternId: MovementPatternId, delta: 1 | -1) => void;
  onApplyPreset: (modelId: PresetModelId) => void;
  onStartGuidedSession: (sessionId: string) => void;
  onQuickLogExercise: (exercise: PlannedExercise) => void;
  onOpenTechnique: (patternId: MovementPatternId) => void;
  onOpenExerciseDemo: (exercise: PlannedExercise) => void;
  onOpenAnamnesis: () => void;
  onChangeCycleWeek: (week: number) => void;
}

export function PlanOverview({
  profile,
  plan,
  selectedSessionId,
  onSelectSession,
  doubleProgressions,
  onToggleDeload,
  onToggleApartment,
  onAdvancePattern,
  onApplyPreset,
  onStartGuidedSession,
  onQuickLogExercise,
  onOpenTechnique,
  onOpenExerciseDemo,
  onOpenAnamnesis,
  onChangeCycleWeek,
}: PlanOverviewProps) {
  const [checkedWarmup, setCheckedWarmup] = useState<Record<string, boolean>>({});
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);
  const [heroImgError, setHeroImgError] = useState(false);

  const activeSession =
    plan.sessoes.find((s) => s.id === selectedSessionId) ?? plan.sessoes[0];

  const readyProgressions = doubleProgressions.filter((dp) => dp.prontoParaAvancar);

  const toggleWarmupItem = (id: string) => {
    setCheckedWarmup((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTarget = (ex: PlannedExercise) => {
    if (ex.modoCircuito) {
      return `${ex.series} rodadas · 40s`;
    }
    const range =
      ex.faixaMin === ex.faixaMax
        ? `${ex.faixaMin}${ex.unidade === 's' ? 's' : ''}`
        : `${ex.faixaMin}–${ex.faixaMax}${ex.unidade === 's' ? 's' : ''}`;
    return `${ex.series}×${range}${ex.unilateral ? ' / lado' : ''}`;
  };

  return (
    <div className="space-y-8">
      {/* Editorial Summary Banner — 2-column stretch split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
              <span>{plan.modeloBase}</span>
              <span aria-hidden="true">·</span>
              <span>Semana {profile.semanaCiclo} do ciclo</span>
              {profile.semanaDeload && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-amber-700">Semana de Deload ativa</span>
                </>
              )}
            </div>

            <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900">
              Seu plano semanal de calistenia em casa
            </h1>

            <p className="text-sm lg:text-[15px] leading-relaxed text-neutral-600 max-w-2xl">
              Objetivo em <strong className="font-semibold text-neutral-900">{plan.resumoObjetivo}</strong>, divisão{' '}
              <strong className="font-semibold text-neutral-900">{plan.resumoDivisao}</strong> e nível{' '}
              <strong className="font-semibold text-neutral-900">{plan.resumoNivel}</strong>. Descanso de{' '}
              <span className="font-mono tabular-nums text-neutral-900">{plan.descansoPadraoTexto}</span> e intensidade em{' '}
              <span className="font-mono tabular-nums text-neutral-900">{plan.rirPadraoTexto}</span>.
            </p>
          </div>

          {/* Action bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={onOpenAnamnesis}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-neutral-800 text-sm font-medium hover:bg-neutral-50 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-900"
            >
              Personalizar anamnese
            </button>

            <button
              type="button"
              onClick={() => onStartGuidedSession(activeSession.id)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#0F3D3E]/25 bg-[#0F3D3E]/[0.06] text-[#0F3D3E] text-sm font-medium hover:bg-[#0F3D3E]/12 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D3E]"
            >
              <Play className="w-4 h-4" aria-hidden="true" />
              Abrir {activeSession.codigo}
            </button>

            <div className="flex items-center gap-2 ml-auto">
              <label htmlFor="cycle-week-select" className="text-xs text-neutral-500 whitespace-nowrap">
                Ciclo:
              </label>
              <select
                id="cycle-week-select"
                value={profile.semanaCiclo}
                onChange={(e) => onChangeCycleWeek(Number(e.target.value))}
                className="text-xs font-mono tabular-nums border border-neutral-300 rounded-md px-2.5 py-2 bg-white text-neutral-800 focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              >
                {[1, 2, 3, 4, 5, 6].map((w) => (
                  <option key={w} value={w}>
                    Semana {w}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right visual slot */}
        <div className="lg:col-span-5 relative min-h-[200px] lg:min-h-full bg-neutral-100">
          {!heroImgError ? (
            <img
              src={STUDIO_HERO_IMAGE}
              alt="Espaço minimalista de calistenia em casa com tapete antiderrapante, parallettes de madeira e elástico de resistência"
              referrerPolicy="no-referrer"
              onError={() => setHeroImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-100 to-neutral-200 text-neutral-600">
              <span className="font-display text-lg font-semibold">Estúdio em Casa</span>
              <span className="text-xs mt-1">Treino progressivo com peso corporal</span>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950/75 via-neutral-950/35 to-transparent p-5 text-white">
            <p className="text-xs text-neutral-200">
              Sobrecarga progressiva · Equilíbrio Push/Pull · Técnica limpa
            </p>
          </div>
        </div>
      </section>

      {/* Full-width Weekly Volume & Programming Metrics Strip */}
      <section aria-label="Resumo de volume semanal" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs text-neutral-500">Equilíbrio Push / Pull</div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono tabular-nums text-lg sm:text-xl font-semibold text-neutral-900 whitespace-nowrap">
              {plan.volumeSemanal.puxar} / {plan.volumeSemanal.empurrar}
            </span>
            <span className="text-xs text-neutral-500 whitespace-nowrap">séries/sem</span>
          </div>
          <p className="mt-1 text-xs text-emerald-700 font-medium leading-snug">
            {plan.volumeSemanal.equilibrioPushPullOk
              ? 'Puxar ≥ Empurrar (ombros protegidos)'
              : 'Ajuste volume de puxar'}
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4">
          <div className="text-xs text-neutral-500">Volume Pernas & Core</div>
          <div className="mt-1.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-mono tabular-nums text-lg sm:text-xl font-semibold text-neutral-900 whitespace-nowrap">
              {plan.volumeSemanal.pernas} · {plan.volumeSemanal.core}
            </span>
            <span className="text-xs text-neutral-500 whitespace-nowrap">séries/sem</span>
          </div>
          <p className="mt-1 text-xs text-neutral-500 leading-snug">
            Ref.: 6–10 ini · 10–16 inter · 12–20 avan
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">Semana de Deload</span>
            <button
              type="button"
              role="switch"
              aria-checked={profile.semanaDeload}
              aria-label="Alternar semana de deload"
              onClick={onToggleDeload}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D3E] ${
                profile.semanaDeload ? 'bg-amber-600' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profile.semanaDeload ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-neutral-900">
              {profile.semanaDeload ? 'Ativo (50% séries · RIR 4+)' : 'Desativado'}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Recomendado a cada 4–6 semanas
            </p>
          </div>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">Modo Apartamento</span>
            <button
              type="button"
              role="switch"
              aria-checked={profile.modoApartamento}
              aria-label="Alternar modo apartamento silencioso"
              onClick={onToggleApartment}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F3D3E] ${
                profile.modoApartamento ? 'bg-[#0F3D3E]' : 'bg-neutral-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  profile.modoApartamento ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="mt-2">
            <div className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
              {profile.modoApartamento ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-[#0F3D3E]" aria-hidden="true" />
                  Silencioso (sem saltos)
                </>
              ) : (
                'Padrão (com impacto leve)'
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              Troca saltos por cadência lenta
            </p>
          </div>
        </div>
      </section>

      {/* Double Progression Unlocked Banner */}
      {readyProgressions.length > 0 && (
        <section
          aria-label="Progressões prontas para avançar"
          className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-5"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-semibold text-emerald-800">
                Regra de Dupla Progressão atingida (2 sessões limpas no topo da faixa)
              </div>
              <p className="text-sm text-neutral-800">
                Você completou o topo das repetições com técnica limpa por 2 treinos seguidos em{' '}
                <strong>{readyProgressions.map((r) => r.patternNome).join(', ')}</strong>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {readyProgressions.map((item) => (
                <button
                  key={item.patternId}
                  type="button"
                  onClick={() => onAdvancePattern(item.patternId, 1)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-medium hover:bg-emerald-800 transition-colors whitespace-nowrap shrink-0"
                >
                  <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                  Avançar {item.patternNome}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Deload suggestion on week 5-6 */}
      {plan.sugestaoDeload && (
        <section className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
            <p className="text-sm text-neutral-800">
              Você está na <strong>Semana {profile.semanaCiclo}</strong> do ciclo. Considere ativar uma{' '}
              <strong>Semana de Deload</strong> (50–60% das séries, RIR 4+, sem falhar) para consolidar ganhos e poupar articulações.
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleDeload}
            className="px-3.5 py-2 rounded-lg border border-amber-300 bg-white text-amber-900 text-xs font-medium hover:bg-amber-100/60 transition-colors whitespace-nowrap shrink-0"
          >
            Ativar deload agora
          </button>
        </section>
      )}

      {/* Safety / Injury / Fat-Loss Guidance Notices */}
      {(plan.avisosSeguranca.length > 0 || plan.dicaPerdaGordura) && (
        <section
          aria-label="Adaptações e orientações de segurança"
          className="bg-white border border-neutral-200 rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-neutral-900">
            <ShieldAlert className="w-4 h-4 text-[#0F3D3E]" aria-hidden="true" />
            Adaptações ativas no seu plano
          </div>
          <ul className="space-y-2 text-sm text-neutral-700">
            {plan.avisosSeguranca.map((aviso, idx) => (
              <li key={idx} className="leading-relaxed">
                • {aviso}
              </li>
            ))}
            {plan.dicaPerdaGordura && (
              <li className="leading-relaxed text-neutral-800 font-medium">
                • {plan.dicaPerdaGordura}
              </li>
            )}
          </ul>
        </section>
      )}

      {/* Quick Preset Models Selector */}
      <section aria-label="Modelos de treino prontos" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            Modelos de referência (troca rápida)
          </h2>
          <span className="text-xs text-neutral-500">
            Protocolos base de treinamento
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
          {(Object.keys(PRESET_MODELS) as PresetModelId[]).map((id) => {
            const preset = PRESET_MODELS[id];
            return (
              <button
                key={id}
                type="button"
                onClick={() => onApplyPreset(id)}
                className="text-left p-4 rounded-xl bg-white border border-neutral-200 hover:border-[#0F3D3E]/50 hover:bg-neutral-50/70 transition-colors focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
              >
                <div className="text-sm font-semibold text-neutral-900">
                  {preset.titulo}
                </div>
                <div className="text-xs text-neutral-500 mt-1">{preset.subtitulo}</div>
                <p className="text-xs text-neutral-600 mt-2 leading-relaxed">
                  {preset.resumo}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Weekly Calendar Strip + Session Selector */}
      <section aria-label="Agenda semanal" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold text-neutral-900">
            Agenda semanal e sessão do dia
          </h2>
          <div
            role="tablist"
            aria-label="Sessões do programa"
            className="flex flex-wrap items-center gap-1 p-1 bg-neutral-200/70 rounded-lg"
          >
            {plan.sessoes.map((sess) => {
              const active = sess.id === activeSession.id;
              return (
                <button
                  key={sess.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => onSelectSession(sess.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-white text-neutral-900 shadow-xs'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  {sess.codigo}
                </button>
              );
            })}
          </div>
        </div>

        {/* 7-day strip */}
        <div className="flex overflow-x-auto gap-2 pb-1 sm:grid sm:grid-cols-7 sm:overflow-visible sm:pb-0">
          {plan.agendaSemanal.map((slot) => {
            const isSelected = slot.sessaoId === activeSession.id;
            const clickable = slot.sessaoId !== null;
            return clickable ? (
              <button
                key={slot.diaSemana}
                type="button"
                onClick={() => slot.sessaoId && onSelectSession(slot.sessaoId)}
                className={`min-w-[96px] sm:min-w-0 p-3 rounded-lg border text-left transition-colors focus-visible:outline-2 focus-visible:outline-[#0F3D3E] shrink-0 ${
                  isSelected
                    ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                    : 'bg-white border-neutral-200 text-neutral-800 hover:border-neutral-300'
                }`}
              >
                <div
                  className={`text-xs font-mono ${
                    isSelected ? 'text-neutral-200' : 'text-neutral-500'
                  }`}
                >
                  {slot.diaSemana}
                </div>
                <div className="text-xs font-semibold mt-1 truncate">{slot.label}</div>
              </button>
            ) : (
              <div
                key={slot.diaSemana}
                className="min-w-[84px] sm:min-w-0 p-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 text-neutral-400 shrink-0"
              >
                <div className="text-xs font-mono">{slot.diaSemana}</div>
                <div className="text-xs font-medium mt-1 truncate">Descanso</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Active Session Structure (4 Sections per SKILL Section 4) */}
      <section className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-neutral-500">
              <span>{activeSession.codigo}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">~{activeSession.duracaoEstimadaMin} min</span>
              <span aria-hidden="true">·</span>
              <span>{activeSession.subtitulo}</span>
            </div>
            <h3 className="font-display text-xl font-semibold text-neutral-900 mt-1">
              {activeSession.titulo}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onStartGuidedSession(activeSession.id)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0F3D3E] text-white text-sm font-medium hover:bg-[#0B2E2F] transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-4 h-4" aria-hidden="true" />
            Iniciar sessão guiada
          </button>
        </div>

        {/* 1. Aquecimento */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex items-baseline justify-between gap-2 mb-3">
            <h4 className="text-sm font-semibold text-neutral-900">
              01. Aquecimento (5–8 min)
            </h4>
            <span className="text-xs text-neutral-500">
              Marque ao concluir cada bloco
            </span>
          </div>
          <div className="divide-y divide-neutral-100">
            {activeSession.aquecimento.map((item) => {
              const checked = Boolean(checkedWarmup[`${activeSession.id}-${item.id}`]);
              return (
                <label
                  key={item.id}
                  className="flex items-start gap-3 py-2.5 cursor-pointer hover:bg-neutral-50/60 px-2 -mx-2 rounded-md"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleWarmupItem(`${activeSession.id}-${item.id}`)}
                    className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-[#0F3D3E] focus:ring-[#0F3D3E]"
                  />
                  <div className="flex-1 min-w-0">
                    <span
                      className={`text-sm ${
                        checked ? 'line-through text-neutral-400' : 'text-neutral-800'
                      }`}
                    >
                      {item.nome}
                    </span>
                    <span className="ml-2 text-xs font-mono tabular-nums text-neutral-500">
                      ({item.duracao})
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {/* 2. Bloco Principal — Scannable Table */}
        <div className="p-6 border-b border-neutral-200">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
            <h4 className="text-sm font-semibold text-neutral-900">
              02. Bloco principal {activeSession.modoCircuito ? '(Circuito 40s / 20s)' : '(20–40 min)'}
            </h4>
            <span className="text-xs text-neutral-500">
              Clique em um exercício para ver progressão, regressão e ajustes
            </span>
          </div>

          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
                  <th className="py-2.5 pr-4">Exercício e padrão</th>
                  <th className="py-2.5 px-3">Séries × Reps</th>
                  <th className="py-2.5 px-3">Descanso</th>
                  <th className="py-2.5 px-3">Observação e execução</th>
                  <th className="py-2.5 pl-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 text-sm">
                {[...activeSession.blocoPrincipal, ...activeSession.coreFinalizador].map((ex) => {
                  const isExpanded = expandedExerciseId === ex.id;
                  const media = getExerciseVisualGuide(ex.patternId, ex.degrauAtual);
                  return (
                    <tr key={ex.id} className="group hover:bg-neutral-50/70 align-top">
                      <td className="py-3.5 pr-4">
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => onOpenExerciseDemo(ex)}
                            aria-label={`Ver demonstração visual de ${ex.nome}`}
                            className="w-16 h-12 rounded-md overflow-hidden border border-neutral-200 bg-neutral-100 shrink-0 hover:border-[#0F3D3E] focus-visible:outline-2 focus-visible:outline-[#0F3D3E] transition-colors"
                          >
                            <img
                              src={media.fotoUrl}
                              alt={media.fotoAlt}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedExerciseId(isExpanded ? null : ex.id)
                            }
                            aria-expanded={isExpanded}
                            className="text-left font-medium text-neutral-900 hover:text-[#0F3D3E] flex items-start gap-1.5 min-w-0"
                          >
                            <ChevronRight
                              className={`w-4 h-4 mt-0.5 shrink-0 text-neutral-400 transition-transform ${
                                isExpanded ? 'rotate-90 text-[#0F3D3E]' : ''
                              }`}
                              aria-hidden="true"
                            />
                            <div className="min-w-0">
                              <div>{ex.nome}</div>
                              <div className="text-xs text-neutral-500 font-normal mt-0.5">
                                {ex.patternNome} · Degrau {ex.degrauAtual} · {ex.rirTexto}
                              </div>
                            </div>
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="mt-3 ml-5 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-xs space-y-2">
                            <div>
                              <span className="font-semibold text-neutral-800">Próxima progressão: </span>
                              <span className="text-neutral-700">
                                {ex.proximaVariacao ?? 'Topo da escada atingido — progrida via tempo lento ou mochila.'}
                              </span>
                            </div>
                            <div>
                              <span className="font-semibold text-neutral-800">Regressão segura: </span>
                              <span className="text-neutral-700">{ex.regressao}</span>
                            </div>
                            {ex.notaAdaptacao && (
                              <div className="text-amber-800 font-medium">
                                Adaptação: {ex.notaAdaptacao}
                              </div>
                            )}
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => onOpenExerciseDemo(ex)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#0F3D3E]/30 bg-white text-[#0F3D3E] hover:bg-[#0F3D3E]/5 whitespace-nowrap"
                              >
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                Foto e animação
                              </button>
                              <button
                                type="button"
                                onClick={() => onAdvancePattern(ex.patternId, -1)}
                                disabled={ex.degrauAtual <= 1}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 disabled:opacity-40 whitespace-nowrap"
                              >
                                <ArrowDown className="w-3.5 h-3.5" aria-hidden="true" />
                                Regredir degrau
                              </button>
                              <button
                                type="button"
                                onClick={() => onAdvancePattern(ex.patternId, 1)}
                                disabled={!ex.proximaVariacao}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-[#0F3D3E]/30 bg-white text-[#0F3D3E] hover:bg-[#0F3D3E]/5 disabled:opacity-40 whitespace-nowrap"
                              >
                                <ArrowUp className="w-3.5 h-3.5" aria-hidden="true" />
                                Avançar degrau
                              </button>
                              <button
                                type="button"
                                onClick={() => onOpenTechnique(ex.patternId)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 whitespace-nowrap"
                              >
                                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                                Ver correção de técnica
                              </button>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-neutral-900 font-medium whitespace-nowrap">
                        {formatTarget(ex)}
                      </td>
                      <td className="py-3.5 px-3 font-mono tabular-nums text-neutral-600 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                          {ex.descansoTexto}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-600 max-w-sm">
                        <p className="leading-snug">{ex.dicaExecucao}</p>
                        {ex.notaAdaptacao && !isExpanded && (
                          <p className="text-xs text-amber-800 mt-1">{ex.notaAdaptacao}</p>
                        )}
                      </td>
                      <td className="py-3.5 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenExerciseDemo(ex)}
                            aria-label={`Como fazer ${ex.nome}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-[#0F3D3E] hover:text-[#0F3D3E] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            Como fazer
                          </button>
                          <button
                            type="button"
                            onClick={() => onQuickLogExercise(ex)}
                            aria-label={`Registrar ${ex.nome}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-[#0F3D3E] hover:text-[#0F3D3E] transition-colors"
                          >
                            <PlusCircle className="w-3.5 h-3.5" aria-hidden="true" />
                            Registrar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Volta à calma */}
        <div className="p-6 bg-neutral-50/50">
          <h4 className="text-sm font-semibold text-neutral-900 mb-2.5">
            03. Volta à calma (3–5 min)
          </h4>
          <ul className="space-y-2">
            {activeSession.voltaACalma.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 text-sm text-neutral-700"
              >
                <span className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#0F3D3E] shrink-0" aria-hidden="true" />
                  {item.nome}
                </span>
                <span className="text-xs font-mono tabular-nums text-neutral-500 whitespace-nowrap">
                  {item.duracao}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Follow-up Personal Trainer Prompt (Section 5) */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 rounded-xl bg-white border border-neutral-200 text-sm">
        <p className="text-neutral-700">
          {profile.modoApartamento
            ? 'Treino adaptado para apartamento silencioso. Quer ajustar seu equipamento ou refazer o mini-teste por padrão?'
            : 'Treinando em apartamento ou com tempo corrido hoje? Você pode adaptar esta sessão em um clique.'}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {!profile.modoApartamento && (
            <button
              type="button"
              onClick={onToggleApartment}
              className="px-3.5 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-50 whitespace-nowrap"
            >
              Adaptar para apartamento
            </button>
          )}
          <button
            type="button"
            onClick={() => onApplyPreset('modelo_3')}
            className="px-3.5 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:bg-neutral-50 whitespace-nowrap"
          >
            Trocar para circuito 20–25 min
          </button>
        </div>
      </section>
    </div>
  );
}
