import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  Calendar,
  ClipboardList,
  HelpCircle,
  Layers,
  Menu,
  Play,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { ActiveSessionModal } from './components/ActiveSessionModal';
import { AnamnesisView } from './components/AnamnesisView';
import { ExerciseDemoModal } from './components/ExerciseDemoModal';
import { ManualView } from './components/ManualView';
import { PlanOverview } from './components/PlanOverview';
import { ProgressionsView } from './components/ProgressionsView';
import { TechniqueSafetyView } from './components/TechniqueSafetyView';
import { TrainingLogView } from './components/TrainingLogView';
import { PROGRESSION_LADDERS } from './lib/calisthenicsData';
import {
  DEFAULT_USER_PROFILE,
  INITIAL_DEMO_LOGS,
  applyPresetModel,
  checkDoubleProgression,
  generateTrainingPlan,
} from './lib/programEngine';
import type {
  MovementPatternId,
  PlannedExercise,
  PresetModelId,
  UserProfile,
  WorkoutLogEntry,
} from './lib/types';

type ActiveTab = 'plano' | 'anamnese' | 'progressoes' | 'registro' | 'tecnica' | 'manual';

const PROFILE_STORAGE_KEY = 'calistenia_casa_profile_v1';
const LOGS_STORAGE_KEY = 'calistenia_casa_logs_v1';

const NAV_ITEMS: { id: ActiveTab; label: string; icon: typeof Calendar }[] = [
  { id: 'plano', label: 'Meu Plano', icon: Calendar },
  { id: 'anamnese', label: 'Anamnese e Nível', icon: SlidersHorizontal },
  { id: 'progressoes', label: 'Escadas de Progressão', icon: Layers },
  { id: 'registro', label: 'Registro e Evolução', icon: ClipboardList },
  { id: 'tecnica', label: 'Técnica e Segurança', icon: BookOpen },
  { id: 'manual', label: 'Manual do App', icon: HelpCircle },
];

function loadSavedProfile(): UserProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_PROFILE;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...DEFAULT_USER_PROFILE,
      ...parsed,
      miniTeste: { ...DEFAULT_USER_PROFILE.miniTeste, ...(parsed.miniTeste ?? {}) },
      degrausPorPadrao: {
        ...DEFAULT_USER_PROFILE.degrausPorPadrao,
        ...(parsed.degrausPorPadrao ?? {}),
      },
    };
  } catch {
    return DEFAULT_USER_PROFILE;
  }
}

function loadSavedLogs(): WorkoutLogEntry[] {
  try {
    const raw = window.localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return INITIAL_DEMO_LOGS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : INITIAL_DEMO_LOGS;
  } catch {
    return INITIAL_DEMO_LOGS;
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('plano');
  const [profile, setProfile] = useState<UserProfile>(loadSavedProfile);
  const [logs, setLogs] = useState<WorkoutLogEntry[]>(loadSavedLogs);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [guidedSessionId, setGuidedSessionId] = useState<string | null>(null);
  const [prefillLogExercise, setPrefillLogExercise] = useState<PlannedExercise | null>(null);
  const [techniquePattern, setTechniquePattern] = useState<MovementPatternId | null>(null);
  const [demoModal, setDemoModal] = useState<{
    patternId: MovementPatternId;
    exerciseTitle: string;
    rung?: number;
    variationCue?: string;
  } | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // ignore storage quota errors
    }
  }, [profile]);

  useEffect(() => {
    try {
      window.localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    } catch {
      // ignore storage quota errors
    }
  }, [logs]);

  const plan = useMemo(() => generateTrainingPlan(profile), [profile]);
  const doubleProgressions = useMemo(
    () => checkDoubleProgression(profile, logs),
    [profile, logs]
  );

  // Keep selected session valid when split changes
  const effectiveSessionId = useMemo(() => {
    if (plan.sessoes.some((s) => s.id === selectedSessionId)) {
      return selectedSessionId;
    }
    return plan.sessoes[0]?.id ?? '';
  }, [plan.sessoes, selectedSessionId]);

  const showNotice = (msg: string) => {
    setFeedbackNotice(msg);
    window.setTimeout(() => {
      setFeedbackNotice((curr) => (curr === msg ? null : curr));
    }, 4500);
  };

  const handleSaveProfile = (updated: UserProfile) => {
    setProfile(updated);
    setActiveTab('plano');
    showNotice('Plano atualizado conforme sua anamnese e nível por padrão de movimento.');
  };

  const handleSetPatternRung = (patternId: MovementPatternId, rung: number) => {
    const ladder = PROGRESSION_LADDERS[patternId];
    const clamped = Math.max(1, Math.min(ladder.degraus.length, rung));
    setProfile((prev) => ({
      ...prev,
      degrausPorPadrao: {
        ...prev.degrausPorPadrao,
        [patternId]: clamped,
      },
    }));
    showNotice(
      `${ladder.nome} atualizado para o degrau ${clamped}: ${ladder.degraus[clamped - 1].nome}.`
    );
  };

  const handleAdvancePattern = (patternId: MovementPatternId, delta: 1 | -1) => {
    const current = profile.degrausPorPadrao[patternId] ?? 1;
    handleSetPatternRung(patternId, current + delta);
  };

  const handleApplyPreset = (modelId: PresetModelId) => {
    const updated = applyPresetModel(profile, modelId);
    setProfile(updated);
    setSelectedSessionId('');
    showNotice('Modelo de referência aplicado ao seu plano semanal.');
  };

  const handleAddLog = (entry: Omit<WorkoutLogEntry, 'id'>) => {
    const created: WorkoutLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    setLogs((prev) => [created, ...prev]);
    showNotice(`Registro salvo: ${entry.exercicio} (${entry.series}×${entry.repsOuSegundos}${entry.unidade === 's' ? 's' : ''}).`);
  };

  const handleDeleteLog = (id: string) => {
    setLogs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleCompleteGuidedSession = (entries: Omit<WorkoutLogEntry, 'id'>[]) => {
    if (entries.length > 0) {
      const created = entries.map((e, idx) => ({
        ...e,
        id: `log-${Date.now()}-${idx}`,
      }));
      setLogs((prev) => [...created, ...prev]);
      showNotice(
        `Sessão concluída! ${created.length} exercício(s) registrados automaticamente no histórico.`
      );
    }
    setGuidedSessionId(null);
  };

  const handleQuickLogExercise = (ex: PlannedExercise) => {
    setPrefillLogExercise(ex);
    setActiveTab('registro');
  };

  const handleOpenTechnique = (patternId: MovementPatternId) => {
    setTechniquePattern(patternId);
    setActiveTab('tecnica');
  };

  const activeNavTitle =
    NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? 'Meu Plano';

  const guidedSession =
    guidedSessionId
      ? plan.sessoes.find((s) => s.id === guidedSessionId) ?? null
      : null;

  const readyProgressionCount = doubleProgressions.filter((d) => d.prontoParaAvancar).length;

  return (
    <div className="min-h-screen flex bg-[#F7F8FA] text-neutral-900">
      {/* Desktop Left Sidebar (256px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-neutral-200 z-30">
        <div className="h-16 px-6 flex items-center border-b border-neutral-200">
          <a
            href="#plano"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('plano');
            }}
            className="font-display text-lg font-bold tracking-tight text-neutral-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Activity className="w-5 h-5 text-[#0F3D3E]" aria-hidden="true" />
            Calistenia em Casa
          </a>
        </div>

        <nav aria-label="Navegação principal" className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  active
                    ? 'bg-[#0F3D3E] text-white'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </span>
                {item.id === 'registro' && readyProgressionCount > 0 && (
                  <span
                    className={`font-mono tabular-nums text-xs ${
                      active ? 'text-emerald-200' : 'text-emerald-700 font-semibold'
                    }`}
                  >
                    +{readyProgressionCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-neutral-200 text-xs text-neutral-500 space-y-1">
          <div className="font-medium text-neutral-800">{plan.resumoObjetivo}</div>
          <div>
            {profile.diasPorSemana}x/sem · {profile.tempoSessaoMin} min
            {profile.semanaDeload ? ' · Deload' : ''}
          </div>
          <div className="pt-1 text-[11px] text-neutral-400">
            Dados salvos localmente no navegador
          </div>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Menu de navegação"
        >
          <div
            className="fixed inset-0 bg-neutral-950/50"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-neutral-200 z-10">
            <div className="h-14 px-5 flex items-center justify-between border-b border-neutral-200">
              <span className="font-display text-base font-bold text-neutral-900">
                Calistenia em Casa
              </span>
              <button
                type="button"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Fechar menu"
                className="p-2 rounded-lg text-neutral-600 hover:bg-neutral-100"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileNavOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium ${
                      active
                        ? 'bg-[#0F3D3E] text-white'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Clean Contextual Top Bar (<= 15% mobile height) */}
        <header className="sticky top-0 z-20 h-14 lg:h-16 bg-white/95 backdrop-blur-xs border-b border-neutral-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menu de navegação"
              className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-neutral-100 shrink-0"
            >
              <Menu className="w-5 h-5" aria-hidden="true" />
            </button>
            <div className="flex items-center gap-2 text-sm text-neutral-500 truncate">
              <span className="hidden sm:inline">Calistenia em Casa</span>
              <span className="hidden sm:inline" aria-hidden="true">
                /
              </span>
              <span className="font-semibold text-neutral-900 truncate">
                {activeNavTitle}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setGuidedSessionId(effectiveSessionId)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0F3D3E] text-white text-xs sm:text-sm font-medium hover:bg-[#0B2E2F] transition-colors whitespace-nowrap shrink-0"
          >
            <Play className="w-3.5 h-3.5" aria-hidden="true" />
            Iniciar sessão
          </button>
        </header>

        {/* Subtle Transient Feedback Banner */}
        {feedbackNotice && (
          <div
            role="status"
            aria-live="polite"
            className="mx-4 sm:mx-6 lg:mx-8 mt-4 px-4 py-3 rounded-lg bg-[#0F3D3E] text-white text-xs sm:text-sm flex items-center justify-between gap-3"
          >
            <span>{feedbackNotice}</span>
            <button
              type="button"
              onClick={() => setFeedbackNotice(null)}
              aria-label="Dispensar aviso"
              className="text-neutral-200 hover:text-white shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Active View Viewport */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-[1200px] w-full mx-auto">
          {activeTab === 'plano' && (
            <PlanOverview
              profile={profile}
              plan={plan}
              selectedSessionId={effectiveSessionId}
              onSelectSession={setSelectedSessionId}
              doubleProgressions={doubleProgressions}
              onToggleDeload={() =>
                setProfile((prev) => ({
                  ...prev,
                  semanaDeload: !prev.semanaDeload,
                }))
              }
              onToggleApartment={() =>
                setProfile((prev) => ({
                  ...prev,
                  modoApartamento: !prev.modoApartamento,
                }))
              }
              onAdvancePattern={handleAdvancePattern}
              onApplyPreset={handleApplyPreset}
              onStartGuidedSession={(id) => setGuidedSessionId(id)}
              onQuickLogExercise={handleQuickLogExercise}
              onOpenTechnique={handleOpenTechnique}
              onOpenExerciseDemo={(ex) =>
                setDemoModal({
                  patternId: ex.patternId,
                  exerciseTitle: ex.nome,
                  rung: ex.degrauAtual,
                  variationCue: ex.dicaExecucao,
                })
              }
              onOpenAnamnesis={() => setActiveTab('anamnese')}
              onChangeCycleWeek={(week) =>
                setProfile((prev) => ({ ...prev, semanaCiclo: week }))
              }
            />
          )}

          {activeTab === 'anamnese' && (
            <AnamnesisView
              profile={profile}
              onSaveProfile={handleSaveProfile}
              onCancel={() => setActiveTab('plano')}
            />
          )}

          {activeTab === 'progressoes' && (
            <ProgressionsView
              profile={profile}
              onSetPatternRung={handleSetPatternRung}
              onOpenPatternDemo={(patternId, title, rung, cue) =>
                setDemoModal({
                  patternId,
                  exerciseTitle: title,
                  rung,
                  variationCue: cue,
                })
              }
            />
          )}

          {activeTab === 'registro' && (
            <TrainingLogView
              profile={profile}
              logs={logs}
              doubleProgressions={doubleProgressions}
              prefillExercise={prefillLogExercise}
              onClearPrefill={() => setPrefillLogExercise(null)}
              onAddLog={handleAddLog}
              onDeleteLog={handleDeleteLog}
              onAdvancePattern={handleAdvancePattern}
            />
          )}

          {activeTab === 'tecnica' && (
            <TechniqueSafetyView initialPatternFilter={techniquePattern} />
          )}

          {activeTab === 'manual' && (
            <ManualView
              onNavigate={(tab) => setActiveTab(tab)}
              onStartGuidedSession={() => setGuidedSessionId(effectiveSessionId)}
              onOpenSampleDemo={(patternId, title, rung, cue) =>
                setDemoModal({
                  patternId,
                  exerciseTitle: title,
                  rung,
                  variationCue: cue,
                })
              }
            />
          )}
        </main>
      </div>

      {/* Active Guided Workout Modal */}
      {guidedSession && (
        <ActiveSessionModal
          session={guidedSession}
          onClose={() => setGuidedSessionId(null)}
          onCompleteSession={handleCompleteGuidedSession}
        />
      )}

      {/* Exercise Photo & Animated Guide Modal */}
      {demoModal && (
        <ExerciseDemoModal
          patternId={demoModal.patternId}
          exerciseTitle={demoModal.exerciseTitle}
          rung={demoModal.rung}
          variationCue={demoModal.variationCue}
          onClose={() => setDemoModal(null)}
        />
      )}
    </div>
  );
}
