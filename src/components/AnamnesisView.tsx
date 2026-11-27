import { useState } from 'react';
import { Check, Info, RotateCcw, ShieldAlert } from 'lucide-react';
import {
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  INJURY_LABELS,
  LEVEL_LABELS,
  SPECIAL_CONDITION_LABELS,
} from '../lib/calisthenicsData';
import { deriveInitialLevels, evaluateMiniTest } from '../lib/programEngine';
import type {
  EquipmentId,
  ExperienceLevel,
  InjuryArea,
  SessionDuration,
  SpecialCondition,
  TrainingGoal,
  UserProfile,
} from '../lib/types';

interface AnamnesisViewProps {
  profile: UserProfile;
  onSaveProfile: (updated: UserProfile) => void;
  onCancel: () => void;
}

export function AnamnesisView({
  profile,
  onSaveProfile,
  onCancel,
}: AnamnesisViewProps) {
  const [draft, setDraft] = useState<UserProfile>(profile);
  const [recalcRungs, setRecalcRungs] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isMinor = draft.condicoesEspeciais.includes('menor_idade');
  const liveLevels = draft.usarMiniTeste
    ? evaluateMiniTest(draft.miniTeste, draft.nivelGeral, isMinor)
    : {
        empurrar: draft.nivelGeral,
        puxar: draft.nivelGeral,
        pernas: draft.nivelGeral,
        core: draft.nivelGeral,
      };

  const toggleEquipment = (id: EquipmentId) => {
    setDraft((prev) => {
      if (id === 'nenhum') {
        return { ...prev, equipamentos: ['nenhum'] };
      }
      const withoutNone = prev.equipamentos.filter((e) => e !== 'nenhum');
      const exists = withoutNone.includes(id);
      const next = exists
        ? withoutNone.filter((e) => e !== id)
        : [...withoutNone, id];
      return { ...prev, equipamentos: next.length === 0 ? ['nenhum'] : next };
    });
  };

  const toggleInjury = (area: InjuryArea) => {
    setDraft((prev) => ({
      ...prev,
      lesoes: prev.lesoes.includes(area)
        ? prev.lesoes.filter((a) => a !== area)
        : [...prev.lesoes, area],
    }));
  };

  const toggleCondition = (cond: SpecialCondition) => {
    setDraft((prev) => ({
      ...prev,
      condicoesEspeciais: prev.condicoesEspeciais.includes(cond)
        ? prev.condicoesEspeciais.filter((c) => c !== cond)
        : [...prev.condicoesEspeciais, cond],
    }));
  };

  const updateMiniTestField = (
    field: keyof UserProfile['miniTeste'],
    raw: string
  ) => {
    if (raw.trim() === '') {
      setDraft((prev) => ({
        ...prev,
        miniTeste: { ...prev.miniTeste, [field]: null },
      }));
      return;
    }
    const parsed = Number(raw);
    setDraft((prev) => ({
      ...prev,
      miniTeste: { ...prev.miniTeste, [field]: parsed },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (draft.usarMiniTeste && !isMinor) {
      const vals = [
        draft.miniTeste.flexoes,
        draft.miniTeste.agachamentos,
        draft.miniTeste.barras,
        draft.miniTeste.pranchaSegundos,
      ];
      if (vals.some((v) => v !== null && (Number.isNaN(v) || v < 0))) {
        setErrorMsg('Os valores do mini-teste não podem ser negativos.');
        return;
      }
    }

    if (draft.equipamentos.length === 0) {
      setErrorMsg('Selecione ao menos uma opção de equipamento (ou "Nenhum").');
      return;
    }

    const finalProfile: UserProfile = {
      ...draft,
      degrausPorPadrao: recalcRungs
        ? deriveInitialLevels(draft)
        : draft.degrausPorPadrao,
    };

    onSaveProfile(finalProfile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl" noValidate>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-500">
            Seções 1 e 2 · Anamnese rápida e avaliação por padrão de movimento
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mt-1">
            Personalizar plano de treino
          </h1>
          <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
            Informe apenas o essencial: objetivo, nível por padrão de movimento, equipamento em casa, frequência e limitações físicas.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 whitespace-nowrap shrink-0 self-start sm:self-auto"
        >
          Voltar ao plano
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800 font-medium"
        >
          {errorMsg}
        </div>
      )}

      {/* 1. Objetivo */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            01. Objetivo principal
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Define faixas de repetições, tempos de descanso (60–90s vs 2–3 min) e prioridades da sessão.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(GOAL_LABELS) as TrainingGoal[]).map((goalId) => {
            const active = draft.objetivo === goalId;
            return (
              <button
                key={goalId}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, objetivo: goalId }))}
                aria-pressed={active}
                className={`text-left p-4 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-[#0F3D3E] ${
                  active
                    ? 'border-[#0F3D3E] bg-[#0F3D3E]/[0.04]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-900">
                    {GOAL_LABELS[goalId].titulo}
                  </span>
                  {active && <Check className="w-4 h-4 text-[#0F3D3E] shrink-0" aria-hidden="true" />}
                </div>
                <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed">
                  {GOAL_LABELS[goalId].descricao}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Nível e Mini-Teste por Padrão */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-neutral-900">
              02. Nível e mini-teste por padrão de movimento
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">
              Você pode ser intermediário em empurrar e iniciante em puxar — o mini-teste calibra cada escada separadamente.
            </p>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={draft.usarMiniTeste}
              disabled={isMinor}
              onChange={(e) =>
                setDraft((prev) => ({ ...prev, usarMiniTeste: e.target.checked }))
              }
              className="h-4 w-4 rounded border-neutral-300 text-[#0F3D3E] focus:ring-[#0F3D3E]"
            />
            Usar mini-teste
          </label>
        </div>

        {/* Fallback general level */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-neutral-700">
            Nível geral de experiência constante
          </span>
          <div className="grid grid-cols-3 gap-2 max-w-lg">
            {(['iniciante', 'intermediario', 'avancado'] as ExperienceLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDraft((prev) => ({ ...prev, nivelGeral: lvl }))}
                aria-pressed={draft.nivelGeral === lvl}
                className={`py-2.5 px-3 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                  draft.nivelGeral === lvl
                    ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                {LEVEL_LABELS[lvl]}
              </button>
            ))}
          </div>
        </div>

        {isMinor ? (
          <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900">
            Para menores de 18 anos, testes de repetição máxima ficam desativados. O foco será técnica limpa, coordenação e consistência.
          </div>
        ) : (
          draft.usarMiniTeste && (
            <div className="space-y-4 pt-3 border-t border-neutral-100">
              <p className="text-xs text-neutral-600">
                Informe o máximo de repetições (ou segundos) com <strong>técnica limpa</strong>, sem falhar até a forma quebrar:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label
                    htmlFor="mt-flexoes"
                    className="block text-xs font-medium text-neutral-700 mb-1"
                  >
                    Flexão no chão (reps)
                  </label>
                  <input
                    id="mt-flexoes"
                    type="number"
                    min={0}
                    max={200}
                    value={draft.miniTeste.flexoes ?? ''}
                    onChange={(e) => updateMiniTestField('flexoes', e.target.value)}
                    placeholder="Ex.: 10"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono tabular-nums text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
                  />
                  <div className="text-xs text-neutral-500 mt-1">
                    &lt;8 ini · 8–25 inter · &gt;25 avan →{' '}
                    <strong className="text-neutral-900">{LEVEL_LABELS[liveLevels.empurrar]}</strong>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="mt-agachamentos"
                    className="block text-xs font-medium text-neutral-700 mb-1"
                  >
                    Agachamento livre (reps)
                  </label>
                  <input
                    id="mt-agachamentos"
                    type="number"
                    min={0}
                    max={300}
                    value={draft.miniTeste.agachamentos ?? ''}
                    onChange={(e) => updateMiniTestField('agachamentos', e.target.value)}
                    placeholder="Ex.: 22"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono tabular-nums text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
                  />
                  <div className="text-xs text-neutral-500 mt-1">
                    &lt;20 ini · 20–40 inter · &gt;40 avan →{' '}
                    <strong className="text-neutral-900">{LEVEL_LABELS[liveLevels.pernas]}</strong>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="mt-barras"
                    className="block text-xs font-medium text-neutral-700 mb-1"
                  >
                    Barra fixa limpa (reps)
                  </label>
                  <input
                    id="mt-barras"
                    type="number"
                    min={0}
                    max={100}
                    value={draft.miniTeste.barras ?? ''}
                    onChange={(e) => updateMiniTestField('barras', e.target.value)}
                    placeholder="0 se ainda não faz"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono tabular-nums text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
                  />
                  <div className="text-xs text-neutral-500 mt-1">
                    &lt;1 ini · 1–8 inter · &gt;8 avan →{' '}
                    <strong className="text-neutral-900">{LEVEL_LABELS[liveLevels.puxar]}</strong>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="mt-prancha"
                    className="block text-xs font-medium text-neutral-700 mb-1"
                  >
                    Prancha completa (seg)
                  </label>
                  <input
                    id="mt-prancha"
                    type="number"
                    min={0}
                    max={600}
                    value={draft.miniTeste.pranchaSegundos ?? ''}
                    onChange={(e) => updateMiniTestField('pranchaSegundos', e.target.value)}
                    placeholder="Ex.: 40"
                    className="w-full px-3 py-2 rounded-lg border border-neutral-300 font-mono tabular-nums text-sm focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
                  />
                  <div className="text-xs text-neutral-500 mt-1">
                    &lt;30s ini · 30–90s inter · &gt;90s avan →{' '}
                    <strong className="text-neutral-900">{LEVEL_LABELS[liveLevels.core]}</strong>
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </section>

      {/* 3. Equipamentos em casa */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            03. Equipamento disponível em casa
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Selecione o que você tem hoje. Sem barra fixa, o motor adapta puxadas para mesa, toalha na porta ou mochila.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(Object.keys(EQUIPMENT_LABELS) as EquipmentId[]).map((eqId) => {
            const active = draft.equipamentos.includes(eqId);
            return (
              <button
                key={eqId}
                type="button"
                onClick={() => toggleEquipment(eqId)}
                aria-pressed={active}
                className={`text-left p-4 rounded-lg border transition-colors ${
                  active
                    ? 'border-[#0F3D3E] bg-[#0F3D3E]/[0.04]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-neutral-900">
                    {EQUIPMENT_LABELS[eqId].nome}
                  </span>
                  {active && <Check className="w-4 h-4 text-[#0F3D3E] shrink-0" aria-hidden="true" />}
                </div>
                <p className="text-xs text-neutral-600 mt-1">
                  {EQUIPMENT_LABELS[eqId].detalhe}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Frequência, Tempo e Divisão */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-5">
        <h2 className="font-display text-lg font-semibold text-neutral-900">
          04. Dias por semana e tempo por sessão
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <span className="block text-xs font-medium text-neutral-700">
              Quantos dias por semana? (sempre mantém ≥ 1 dia de descanso)
            </span>
            <div className="grid grid-cols-5 gap-2">
              {([2, 3, 4, 5, 6] as const).map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, diasPorSemana: days }))}
                  aria-pressed={draft.diasPorSemana === days}
                  className={`py-2.5 rounded-lg border font-mono tabular-nums text-sm font-medium transition-colors ${
                    draft.diasPorSemana === days
                      ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                      : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  {days}x
                </button>
              ))}
            </div>
            <p className="text-xs text-neutral-500">
              {draft.diasPorSemana === 2 && 'Divisão sugerida: Full Body A / Full Body B'}
              {draft.diasPorSemana === 3 && 'Divisão sugerida: Full Body A / B / A (alternando semanas)'}
              {draft.diasPorSemana === 4 && 'Divisão sugerida: Push / Pull / Pernas / Core+Habilidade ou Upper / Lower'}
              {draft.diasPorSemana >= 5 && 'Divisão sugerida: Push / Pull / Pernas repetido + dia leve/mobilidade'}
            </p>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-medium text-neutral-700">
              Tempo disponível por sessão
            </span>
            <div className="grid grid-cols-3 gap-2">
              {([
                { min: 25 as SessionDuration, label: '20–25 min', sub: 'Circuito' },
                { min: 45 as SessionDuration, label: '35–45 min', sub: 'Padrão' },
                { min: 60 as SessionDuration, label: '50–60 min', sub: 'Completo' },
              ]).map((opt) => (
                <button
                  key={opt.min}
                  type="button"
                  onClick={() => setDraft((prev) => ({ ...prev, tempoSessaoMin: opt.min }))}
                  aria-pressed={draft.tempoSessaoMin === opt.min}
                  className={`py-2 px-3 rounded-lg border text-center transition-colors ${
                    draft.tempoSessaoMin === opt.min
                      ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                      : 'bg-white border-neutral-300 text-neutral-800 hover:bg-neutral-50'
                  }`}
                >
                  <div className="font-mono tabular-nums text-xs font-semibold">
                    {opt.label}
                  </div>
                  <div
                    className={`text-[11px] ${
                      draft.tempoSessaoMin === opt.min ? 'text-neutral-200' : 'text-neutral-500'
                    }`}
                  >
                    {opt.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {draft.diasPorSemana === 4 && draft.tempoSessaoMin !== 25 && (
          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <span className="block text-xs font-medium text-neutral-700">
              Preferência de divisão para 4 dias/semana
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({
                    ...prev,
                    preferenciaDivisao4Dias: 'push_pull_pernas_core',
                  }))
                }
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium ${
                  draft.preferenciaDivisao4Dias === 'push_pull_pernas_core'
                    ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Push / Pull / Pernas / Core + Habilidade (Modelo 2)
              </button>
              <button
                type="button"
                onClick={() =>
                  setDraft((prev) => ({ ...prev, preferenciaDivisao4Dias: 'upper_lower' }))
                }
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium ${
                  draft.preferenciaDivisao4Dias === 'upper_lower'
                    ? 'bg-[#0F3D3E] border-[#0F3D3E] text-white'
                    : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                Upper / Lower / Upper / Lower
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 5 & 6. Restrições do Ambiente, Lesões e Segurança */}
      <section className="bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            05. Ambiente, dores articulares e segurança
          </h2>

          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.modoApartamento}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, modoApartamento: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-300 text-[#0F3D3E]"
              />
              Apartamento silencioso (sem saltos / sem barulho)
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.espacoPequeno}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, espacoPequeno: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-300 text-[#0F3D3E]"
              />
              Espaço pequeno
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-neutral-800 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.pisoEscorregadio}
                onChange={(e) =>
                  setDraft((prev) => ({ ...prev, pisoEscorregadio: e.target.checked }))
                }
                className="h-4 w-4 rounded border-neutral-300 text-[#0F3D3E]"
              />
              Piso escorregadio
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-700" aria-hidden="true" />
            <span className="text-sm font-semibold text-neutral-900">
              Lesões, dores ou limitações atuais
            </span>
          </div>
          <p className="text-xs text-neutral-600">
            Nunca treine através de dor articular. Marque áreas sensíveis para regredir automaticamente os padrões afetados e receber recomendações seguras.
          </p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(INJURY_LABELS) as InjuryArea[]).map((area) => {
              const selected = draft.lesoes.includes(area);
              return (
                <button
                  key={area}
                  type="button"
                  onClick={() => toggleInjury(area)}
                  aria-pressed={selected}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                    selected
                      ? 'bg-red-50 border-red-300 text-red-900'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {INJURY_LABELS[area].nome}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-neutral-100 space-y-3">
          <span className="block text-sm font-semibold text-neutral-900">
            Condições especiais (protocolo conservador)
          </span>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(SPECIAL_CONDITION_LABELS) as SpecialCondition[]).map((cond) => {
              const selected = draft.condicoesEspeciais.includes(cond);
              return (
                <button
                  key={cond}
                  type="button"
                  onClick={() => toggleCondition(cond)}
                  aria-pressed={selected}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap ${
                    selected
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-white border-neutral-300 text-neutral-700 hover:bg-neutral-50'
                  }`}
                >
                  {SPECIAL_CONDITION_LABELS[cond].nome}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer Submit Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-neutral-200 rounded-xl p-5">
        <label className="inline-flex items-start gap-2.5 text-xs text-neutral-700 cursor-pointer">
          <input
            type="checkbox"
            checked={recalcRungs}
            onChange={(e) => setRecalcRungs(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-neutral-300 text-[#0F3D3E]"
          />
          <span>
            <strong className="text-neutral-900">Recalcular degraus iniciais</strong> de cada escada de progressão conforme este mini-teste e equipamentos.
          </span>
        </label>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setDraft(profile)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm font-medium text-neutral-700 hover:bg-neutral-50 whitespace-nowrap"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            Desfazer
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F3D3E] text-white text-sm font-medium hover:bg-[#0B2E2F] transition-colors whitespace-nowrap"
          >
            <Info className="w-4 h-4" aria-hidden="true" />
            Gerar plano personalizado
          </button>
        </div>
      </div>
    </form>
  );
}
