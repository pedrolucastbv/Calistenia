import { useState } from 'react';
import { AlertOctagon, Search, ShieldCheck } from 'lucide-react';
import {
  SAFETY_PRACTICAL_RULES,
  SAFETY_RED_FLAGS,
  TECHNIQUE_GUIDES,
} from '../lib/calisthenicsData';
import { getExerciseVisualGuide } from '../lib/exerciseMedia';
import type { MovementPatternId } from '../lib/types';
import { ExerciseMotionPlayer } from './ExerciseDemoModal';

interface TechniqueSafetyViewProps {
  initialPatternFilter: MovementPatternId | null;
}

export function TechniqueSafetyView({
  initialPatternFilter,
}: TechniqueSafetyViewProps) {
  const [query, setQuery] = useState('');
  const [selectedGuideId, setSelectedGuideId] = useState<string>(() => {
    if (initialPatternFilter) {
      const match = TECHNIQUE_GUIDES.find((g) => g.patternId === initialPatternFilter);
      if (match) return match.id;
    }
    return TECHNIQUE_GUIDES[0].id;
  });

  const filteredGuides = TECHNIQUE_GUIDES.filter((g) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      g.exercicio.toLowerCase().includes(q) ||
      g.errosComuns.some(
        (e) =>
          e.erro.toLowerCase().includes(q) ||
          e.correcaoPrioritaria.toLowerCase().includes(q)
      ) ||
      g.pontosChave.alinhamento.toLowerCase().includes(q)
    );
  });

  const activeGuide =
    filteredGuides.find((g) => g.id === selectedGuideId) ?? filteredGuides[0] ?? null;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs text-neutral-500">
          Seções 6 e 8 · Correção de execução e protocolos de segurança
        </p>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900 mt-1">
          Guia de técnica e segurança
        </h1>
        <p className="text-sm text-neutral-600 mt-1 max-w-2xl">
          Foque em 1–2 correções prioritárias por vez (alinhamento, escápulas, respiração e amplitude). Se a forma quebrar ou surgir dor articular, regrida o exercício imediatamente.
        </p>
      </div>

      {/* Technique Correction Explorer */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-4 space-y-3">
          <div className="relative">
            <Search
              className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Buscar exercício ou erro comum"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: lombar, ombros, joelho, punho..."
              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-neutral-300 bg-white focus-visible:outline-2 focus-visible:outline-[#0F3D3E]"
            />
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-2 space-y-1">
            {filteredGuides.length === 0 ? (
              <p className="p-3 text-xs text-neutral-500">
                Nenhum guia encontrado para "{query}".
              </p>
            ) : (
              filteredGuides.map((guide) => {
                const active = activeGuide?.id === guide.id;
                return (
                  <button
                    key={guide.id}
                    type="button"
                    onClick={() => setSelectedGuideId(guide.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#0F3D3E] text-white'
                        : 'text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    {guide.exercicio}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl p-6 space-y-6">
          {activeGuide ? (() => {
            const media = getExerciseVisualGuide(activeGuide.patternId);
            return (
            <>
              <div>
                <h2 className="font-display text-xl font-semibold text-neutral-900">
                  {activeGuide.exercicio}
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Foto técnica, demonstração animada e pontos-chave de execução limpa
                </p>
              </div>

              {/* Visual photo + live biomechanical animation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <figure className="space-y-2">
                  <div className="aspect-4/3 rounded-xl overflow-hidden border border-neutral-200 bg-neutral-100">
                    <img
                      src={media.fotoUrl}
                      alt={media.fotoAlt}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <figcaption className="text-xs text-neutral-600 leading-relaxed">
                    {media.legendaFoto}
                  </figcaption>
                </figure>
                <div className="flex flex-col justify-between gap-2">
                  <ExerciseMotionPlayer patternId={activeGuide.patternId} compact />
                  <p className="text-xs text-neutral-600">
                    <strong className="text-neutral-900">Respiração:</strong> {media.respiracao}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="text-xs font-semibold text-neutral-900">Alinhamento</div>
                  <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                    {activeGuide.pontosChave.alinhamento}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="text-xs font-semibold text-neutral-900">Escápulas</div>
                  <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                    {activeGuide.pontosChave.escapulas}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="text-xs font-semibold text-neutral-900">Respiração</div>
                  <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                    {activeGuide.pontosChave.respiracao}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200">
                  <div className="text-xs font-semibold text-neutral-900">
                    Amplitude e tempo
                  </div>
                  <p className="text-xs text-neutral-700 mt-1 leading-relaxed">
                    {activeGuide.pontosChave.amplitudeETempo}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-neutral-100">
                <h3 className="text-sm font-semibold text-neutral-900">
                  Erros comuns e correções prioritárias (1–2 ajustes por vez)
                </h3>
                <div className="space-y-3">
                  {activeGuide.errosComuns.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg border border-neutral-200 bg-white space-y-1.5"
                    >
                      <div className="text-xs font-semibold text-amber-800">
                        Erro comum: {item.erro}
                      </div>
                      <p className="text-sm text-neutral-800 leading-relaxed">
                        <strong className="font-semibold">Correção:</strong>{' '}
                        {item.correcaoPrioritaria}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-lg bg-neutral-50 border border-neutral-200 text-xs text-neutral-700">
                <strong className="text-neutral-900">Regressão imediata recomendada: </strong>
                {activeGuide.regressaoSegura}
              </div>
            </>
            );
          })() : (
            <p className="text-sm text-neutral-600">
              Selecione um exercício ao lado para ver os pontos-chave e correções.
            </p>
          )}
        </div>
      </section>

      {/* Safety Protocol Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-red-50/70 border border-red-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-red-900">
            <AlertOctagon className="w-5 h-5 shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold">
              Quando interromper imediatamente
            </h2>
          </div>
          <p className="text-xs text-red-900/90 leading-relaxed">
            Este aplicativo não substitui médico nem fisioterapeuta. Pare o treino e procure avaliação profissional diante de qualquer um destes sinais:
          </p>
          <ul className="space-y-2 text-sm text-red-950">
            {SAFETY_RED_FLAGS.map((flag, idx) => (
              <li key={idx} className="leading-snug">
                • {flag}
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-7 bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-neutral-900">
            <ShieldCheck className="w-5 h-5 text-[#0F3D3E] shrink-0" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold">
              Regras práticas de segurança em casa
            </h2>
          </div>
          <div className="divide-y divide-neutral-100">
            {SAFETY_PRACTICAL_RULES.map((rule) => (
              <div key={rule.titulo} className="py-3.5 first:pt-0 last:pb-0">
                <h3 className="text-sm font-semibold text-neutral-900">{rule.titulo}</h3>
                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                  {rule.detalhe}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
