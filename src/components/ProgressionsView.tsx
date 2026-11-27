import { useState } from 'react';
import { Check, Eye, Wrench } from 'lucide-react';
import {
  EQUIPMENT_LABELS,
  HOME_EQUIPMENT_GUIDES,
  PROGRESSION_LADDERS,
} from '../lib/calisthenicsData';
import { getExerciseVisualGuide } from '../lib/exerciseMedia';
import { hasEquipment } from '../lib/programEngine';
import type { MovementPatternId, UserProfile } from '../lib/types';

interface ProgressionsViewProps {
  profile: UserProfile;
  onSetPatternRung: (patternId: MovementPatternId, rung: number) => void;
  onOpenPatternDemo: (patternId: MovementPatternId, title: string, rung: number, cue: string) => void;
}

const PATTERN_ORDER: MovementPatternId[] = [
  'empurrar_horizontal',
  'empurrar_vertical',
  'paralelas_triceps',
  'puxar_horizontal',
  'puxar_vertical',
  'agachar',
  'dobradica_posterior',
  'panturrilha',
  'core',
  'habilidades',
];

export function ProgressionsView({
  profile,
  onSetPatternRung,
  onOpenPatternDemo,
}: ProgressionsViewProps) {
  const [selectedPattern, setSelectedPattern] = useState<MovementPatternId | 'equipamentos'>(
    'empurrar_horizontal'
  );

  const activeLadder =
    selectedPattern === 'equipamentos' ? null : PROGRESSION_LADDERS[selectedPattern];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-neutral-500">
          Referência técnica de progressões e regressões
        </p>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mt-1">
          Escadas de progressão por padrão de movimento
        </h1>
        <p className="text-sm text-neutral-600 mt-1 max-w-3xl">
          Meta de cada etapa: 3 séries limpas no topo da faixa por 2 sessões seguidas antes de avançar. Escolha seu degrau atual em cada padrão para atualizar o plano imediatamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Pattern navigation list */}
        <nav
          aria-label="Padrões de movimento"
          className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-2 space-y-1"
        >
          {PATTERN_ORDER.map((patternId) => {
            const ladder = PROGRESSION_LADDERS[patternId];
            const currentRung = profile.degrausPorPadrao[patternId] ?? 1;
            const active = selectedPattern === patternId;
            return (
              <button
                key={patternId}
                type="button"
                onClick={() => setSelectedPattern(patternId)}
                aria-current={active ? 'page' : undefined}
                className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center justify-between gap-3 transition-colors ${
                  active
                    ? 'bg-[#0F3D3E] text-white'
                    : 'text-neutral-800 hover:bg-neutral-100'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{ladder.nome}</div>
                  <div
                    className={`text-xs truncate ${
                      active ? 'text-neutral-200' : 'text-neutral-500'
                    }`}
                  >
                    {ladder.grupo}
                  </div>
                </div>
                <span
                  className={`font-mono tabular-nums text-xs shrink-0 ${
                    active ? 'text-white' : 'text-neutral-500'
                  }`}
                >
                  {currentRung}/{ladder.degraus.length}
                </span>
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setSelectedPattern('equipamentos')}
              className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-2.5 text-sm font-medium transition-colors ${
                selectedPattern === 'equipamentos'
                  ? 'bg-[#0F3D3E] text-white'
                  : 'text-neutral-800 hover:bg-neutral-100'
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0" aria-hidden="true" />
              Equipamento caseiro e alternativas
            </button>
          </div>
        </nav>

        {/* Ladder details or Equipment guide */}
        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {selectedPattern === 'equipamentos' ? (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="font-display text-xl font-semibold text-neutral-900">
                  Equipamento caseiro e alternativas seguras
                </h2>
                <p className="text-sm text-neutral-600 mt-1">
                  Soluções práticas para progredir carga e puxadas em casa sem academia.
                </p>
              </div>
              <div className="divide-y divide-neutral-100">
                {HOME_EQUIPMENT_GUIDES.map((guide) => (
                  <div key={guide.item} className="py-4 first:pt-0 last:pb-0 space-y-1">
                    <h3 className="text-sm font-semibold text-neutral-900">
                      {guide.item}
                    </h3>
                    <p className="text-sm text-neutral-700">{guide.uso}</p>
                    <p className="text-xs text-amber-800">
                      Segurança: {guide.cuidadoSeguranca}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            activeLadder && (() => {
              const activeRungNum = profile.degrausPorPadrao[activeLadder.id] ?? 1;
              const media = getExerciseVisualGuide(activeLadder.id, activeRungNum);
              const activeStepObj = activeLadder.degraus[activeRungNum - 1];
              return (
              <div>
                <div className="p-6 border-b border-neutral-200 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                  <div className="md:col-span-7 space-y-2">
                    <div className="text-xs text-neutral-500">
                      Grupo: {activeLadder.grupo} · Degrau ativo:{' '}
                      <span className="font-mono tabular-nums text-neutral-900 font-semibold">
                        {activeRungNum}/{activeLadder.degraus.length}
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-semibold text-neutral-900">
                      {activeLadder.nome}
                    </h2>
                    <p className="text-sm text-neutral-600">{activeLadder.descricaoMeta}</p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() =>
                          onOpenPatternDemo(
                            activeLadder.id,
                            activeStepObj.nome,
                            activeRungNum,
                            activeStepObj.dicaExecucao
                          )
                        }
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#0F3D3E]/30 bg-[#0F3D3E]/[0.05] text-xs font-medium text-[#0F3D3E] hover:bg-[#0F3D3E]/10 transition-colors whitespace-nowrap"
                      >
                        <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                        Ver foto e animação passo a passo
                      </button>
                    </div>
                  </div>
                  <div className="md:col-span-5">
                    <button
                      type="button"
                      onClick={() =>
                        onOpenPatternDemo(
                          activeLadder.id,
                          activeStepObj.nome,
                          activeRungNum,
                          activeStepObj.dicaExecucao
                        )
                      }
                      aria-label={`Abrir demonstração visual de ${activeLadder.nome}`}
                      className="block w-full aspect-4/3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100 hover:border-[#0F3D3E] transition-colors"
                    >
                      <img
                        src={media.fotoUrl}
                        alt={media.fotoAlt}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  </div>
                  {activeLadder.notaSemBarra && (
                    <p className="md:col-span-12 text-xs text-neutral-700 bg-neutral-50 border border-neutral-200 rounded-lg p-3">
                      {activeLadder.notaSemBarra}
                    </p>
                  )}
                </div>

                <div className="divide-y divide-neutral-100">
                  {activeLadder.degraus.map((step) => {
                    const isCurrent =
                      profile.degrausPorPadrao[activeLadder.id] === step.degrau;
                    const missingEq = (step.equipamentoNecessario ?? []).filter(
                      (eq) => !hasEquipment(profile.equipamentos, eq)
                    );
                    const blockedByApartment =
                      profile.modoApartamento && Boolean(step.possuiSalto);

                    return (
                      <div
                        key={step.degrau}
                        className={`p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                          isCurrent ? 'bg-[#0F3D3E]/[0.04]' : 'bg-white'
                        }`}
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex flex-wrap items-baseline gap-2">
                            <span className="font-mono tabular-nums text-xs font-semibold text-neutral-500">
                              0{step.degrau}.
                            </span>
                            <h3 className="text-sm font-semibold text-neutral-900">
                              {blockedByApartment && step.substitutoSemSalto
                                ? `${step.substitutoSemSalto} (substituto silencioso)`
                                : step.nome}
                            </h3>
                            {isCurrent && (
                              <span className="text-xs font-semibold text-[#0F3D3E]">
                                · Ativo no plano
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 font-mono tabular-nums">
                            <span>
                              Força: 3×{step.faixaSugeridaForca.min}–{step.faixaSugeridaForca.max}
                              {step.faixaSugeridaForca.unidade === 's' ? 's' : ''}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>
                              Hipertrofia: 3×{step.faixaSugeridaHipertrofia.min}–
                              {step.faixaSugeridaHipertrofia.max}
                              {step.faixaSugeridaHipertrofia.unidade === 's' ? 's' : ''}
                            </span>
                            {step.categoriaCore && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="font-sans">{step.categoriaCore}</span>
                              </>
                            )}
                          </div>

                          <p className="text-xs text-neutral-600 leading-relaxed">
                            {step.dicaExecucao}
                          </p>

                          {missingEq.length > 0 && (
                            <p className="text-xs text-amber-800">
                              Equipamento não marcado na anamnese:{' '}
                              {missingEq.map((eq) => EQUIPMENT_LABELS[eq].nome).join(', ')}.
                            </p>
                          )}

                          {step.riscoAlto && (
                            <p className="text-xs text-red-700">
                              Exercício avançado: não leve até a falha técnica; descanse 2–3 min.
                            </p>
                          )}
                        </div>

                        <div className="shrink-0 flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              onOpenPatternDemo(
                                activeLadder.id,
                                blockedByApartment && step.substitutoSemSalto
                                  ? step.substitutoSemSalto
                                  : step.nome,
                                step.degrau,
                                step.dicaExecucao
                              )
                            }
                            aria-label={`Ver execução de ${step.nome}`}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-xs font-medium text-neutral-700 hover:border-[#0F3D3E] hover:text-[#0F3D3E] transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                            Ver execução
                          </button>

                          {isCurrent ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0F3D3E] whitespace-nowrap">
                              <Check className="w-4 h-4" aria-hidden="true" />
                              Degrau atual
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() =>
                                onSetPatternRung(activeLadder.id, step.degrau)
                              }
                              className="px-3.5 py-2 rounded-lg border border-neutral-300 bg-white text-xs font-medium text-neutral-800 hover:border-[#0F3D3E] hover:text-[#0F3D3E] transition-colors whitespace-nowrap"
                            >
                              Definir como atual
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
