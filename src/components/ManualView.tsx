import { useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  ChevronDown,
  ClipboardList,
  Film,
  Layers,
  Play,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { MovementPatternId } from '../lib/types';
import { FeelingScaleLegend } from './FeelingScaleLegend';

export type ManualNavTarget =
  | 'plano'
  | 'anamnese'
  | 'progressoes'
  | 'registro'
  | 'tecnica'
  | 'manual';

interface ManualViewProps {
  onNavigate: (tab: ManualNavTarget) => void;
  onStartGuidedSession: () => void;
  onOpenSampleDemo: (
    patternId: MovementPatternId,
    title: string,
    rung: number,
    cue: string
  ) => void;
}

interface ManualChapter {
  id: string;
  numero: string;
  titulo: string;
  tituloCurto: string;
  resumo: string;
  icon: typeof Calendar;
  passos: string[];
  recursos: { nome: string; detalhe: string }[];
  dicaPratica: string;
  acaoLabel: string;
  acaoTipo: 'nav' | 'session' | 'demo';
  navTarget?: ManualNavTarget;
}

const MANUAL_CHAPTERS: ManualChapter[] = [
  {
    id: 'plano',
    numero: '01',
    titulo: 'Meu Plano, Divisão Semanal e Modelos',
    tituloCurto: 'Meu Plano e Modelos',
    resumo:
      'Gera automaticamente sua agenda semanal respeitando dias disponíveis, equilíbrio entre empurrar e puxar, descanso e nível atual por padrão.',
    icon: Calendar,
    passos: [
      'Escolha um dos 4 modelos prontos (Iniciante 3x, Intermediário 4x, Circuito 20–25 min ou Apartamento) ou personalize pela Anamnese.',
      'Navegue pelos dias da agenda semanal ou pelas abas de treino (A, B, Push, Pull, Pernas, Core) para inspecionar aquecimento, bloco principal e volta à calma.',
      'Clique sobre o nome de qualquer exercício na tabela para abrir próxima progressão, regressão segura e botões rápidos de avançar ou regredir degrau.',
      'Ative os interruptores de Semana de Deload (50% das séries, RIR 4+) ou Modo Apartamento (silencioso, sem saltos) sempre que precisar.',
    ],
    recursos: [
      {
        nome: 'Equilíbrio Push / Pull',
        detalhe:
          'Monitora séries semanais de puxar e empurrar para manter saúde dos ombros (Puxar ≥ Empurrar).',
      },
      {
        nome: 'Semana do ciclo (1–6)',
        detalhe:
          'Acompanha seu progresso no bloco atual e sugere deload automaticamente nas semanas 5–6.',
      },
      {
        nome: 'Botões rápidos por exercício',
        detalhe:
          'Cada linha traz miniatura fiel ao degrau, "Como fazer" (Player 3D + Foto) e "Registrar".',
      },
    ],
    dicaPratica:
      'Em dias corridos, clique em "Trocar para circuito 20–25 min" no rodapé do plano para manter consistência sem pular o treino.',
    acaoLabel: 'Ir para Meu Plano',
    acaoTipo: 'nav',
    navTarget: 'plano',
  },
  {
    id: 'anamnese',
    numero: '02',
    titulo: 'Anamnese, Equipamentos e Mini-Teste',
    tituloCurto: 'Anamnese e Mini-Teste',
    resumo:
      'Calibra seu nível real de forma independente em cada padrão de movimento e aplica adaptações automáticas para equipamentos e lesões.',
    icon: SlidersHorizontal,
    passos: [
      'Defina objetivo principal (força, hipertrofia, perda de gordura, resistência, habilidades ou saúde geral), dias/semana e duração da sessão.',
      'Marque quais equipamentos você possui em casa (nenhum, mesa/cadeira/toalha, mochila, elástico, barra fixa ou paralelas).',
      'Informe áreas sensíveis (ombro, punho, joelho, lombar, cotovelo) ou condições especiais para ativar alertas e substituições seguras.',
      'Preencha o Mini-Teste (flexões, agachamentos, prancha e puxada) e clique em "Calcular degraus pelo mini-teste" para posicionar cada padrão automaticamente.',
    ],
    recursos: [
      {
        nome: 'Nível por padrão de movimento',
        detalhe:
          'Permite estar no degrau 4 em agachamento e no degrau 2 em empurrar ao mesmo tempo, sem forçar um nível único.',
      },
      {
        nome: 'Adaptações automáticas de segurança',
        detalhe:
          'Reduz amplitude ou substitui exercícios de impacto quando lesões ou modo apartamento estão marcados.',
      },
    ],
    dicaPratica:
      'Sempre que adquirir um equipamento novo (como uma barra fixa de porta) ou mudar sua rotina de dias, atualize a Anamnese e salve.',
    acaoLabel: 'Abrir Anamnese e Nível',
    acaoTipo: 'nav',
    navTarget: 'anamnese',
  },
  {
    id: 'player3d',
    numero: '03',
    titulo: 'Player 3D Anatômico, Fotos e 3 Variações com Objetos',
    tituloCurto: 'Player 3D e 3 Variações',
    resumo:
      'Demonstrações 3D interativas estilo GymVisual com destaque muscular dinâmico, câmera 360° e foto técnica alinhada ao degrau exato do exercício.',
    icon: Film,
    passos: [
      'Clique em "Como fazer" na tabela do plano ou em "Ver execução" nas Escadas de Progressão para abrir o guia visual.',
      'Arraste sobre a cena 3D para girar o ângulo livremente ou alterne entre as câmeras 3/4, Lateral e Frontal.',
      'Use o seletor de velocidade (1x / 0.5x), o controle deslizante de fase (0–99%) e o botão "Músculos: ativos" para estudar o movimento em câmera lenta.',
      'Nos exercícios que usam móveis ou objetos (remadas, barra, tríceps, panturrilha e L-sit), escolha entre 3 variações caseiras (ex.: mesa, toalha na porta ou mochila).',
    ],
    recursos: [
      {
        nome: 'Músculos principais e sinergistas',
        detalhe:
          'Vermelho carmesim destaca os músculos principais ativos e coral indica os sinergistas com intensidade sincronizada à contração.',
      },
      {
        nome: 'Fidelidade por degrau',
        detalhe:
          'Variações unilaterais (como Ponte de glúteo unilateral, Stiff unilateral e Panturrilha unilateral) e específicas (Búlgaro, Flexão inclinada, Dead bug) exibem foto e animação 3D correspondentes.',
      },
      {
        nome: 'Aba Foto técnica + Passo a passo',
        detalhe:
          'Alterna entre a animação 3D e foto de estúdio com cadência, respiração, checklist de postura e erros comuns.',
      },
    ],
    dicaPratica:
      'Antes de tentar um degrau novo pela primeira vez, pause a animação 3D em 0.5x e confira o alinhamento dos cotovelos, joelhos e quadril em vista lateral.',
    acaoLabel: 'Testar Player 3D agora',
    acaoTipo: 'demo',
  },
  {
    id: 'sessao',
    numero: '04',
    titulo: 'Sessão Guiada e Cronômetro Inteligente',
    tituloCurto: 'Sessão Guiada e Timer',
    resumo:
      'Modo de treino em tempo real com marcação de séries, cronômetro automático de descanso (ou circuito 40s/20s) e salvamento direto no registro.',
    icon: Play,
    passos: [
      'Clique em "Iniciar sessão" no topo do aplicativo ou em "Iniciar sessão guiada" no cartão do treino do dia.',
      'A cada série concluída, marque o botão "Série 1, 2, 3..." — o cronômetro de descanso inicia automaticamente no tempo indicado para aquele exercício.',
      'Se ficar em dúvida durante o treino, clique em "Ver como fazer" dentro do cartão do exercício para abrir o Player 3D compacto e a foto sem sair da sessão.',
      'Informe as repetições/segundos realizados, sensação (1–10) e se a técnica foi limpa; ao final, clique em "Concluir e salvar" para gravar tudo no histórico.',
    ],
    recursos: [
      {
        nome: 'Atalhos de descanso (60s a 3m)',
        detalhe:
          'Ajuste o cronômetro rapidamente entre descansos de hipertrofia (60–90s) e força (2–3 min).',
      },
      {
        nome: 'Modo Circuito automático',
        detalhe:
          'No Modelo 3 (Pouco Tempo), o timer alterna automaticamente entre 40s de trabalho e 20s de descanso.',
      },
    ],
    dicaPratica:
      'Marque "Técnica limpa" apenas quando completar as repetições com amplitude total e controle — isso alimenta a regra de Dupla Progressão com precisão.',
    acaoLabel: 'Abrir sessão guiada',
    acaoTipo: 'session',
  },
  {
    id: 'progressoes',
    numero: '05',
    titulo: 'Escadas de Progressão e Equipamento Caseiro',
    tituloCurto: 'Escadas e Equipamentos',
    resumo:
      'Biblioteca completa com os 10 padrões de movimento (de iniciante a avançado) e guia seguro de adaptações com itens domésticos.',
    icon: Layers,
    passos: [
      'Selecione qualquer um dos 10 padrões na lista à esquerda (Empurrar, Puxar, Agachar, Dobradiça, Panturrilha, Core e Habilidades).',
      'Compare faixas sugeridas de Força e Hipertrofia em cada degrau e clique em "Ver execução" para visualizar a animação 3D e foto daquela etapa específica.',
      'Clique em "Definir como atual" em qualquer degrau para atualizar seu plano semanal instantaneamente.',
      'Acesse "Equipamento caseiro e alternativas" no final da lista para conferir cuidados com mesa, toalha na porta, mochila e cadeiras.',
    ],
    recursos: [
      {
        nome: 'Substituições para modo apartamento',
        detalhe:
          'Degraus com salto exibem automaticamente o substituto silencioso quando o Modo Apartamento está ligado.',
      },
      {
        nome: 'Avisos de equipamento e risco alto',
        detalhe:
          'Destaca exercícios avançados (como Pistol squat, Muscle-up e Parada de mão) que exigem descanso longo e técnica rigorosa.',
      },
    ],
    dicaPratica:
      'Não tenha pressa de pular degraus: dominar a cadência controlada (3s descendo) gera mais força e protege tendões.',
    acaoLabel: 'Abrir Escadas de Progressão',
    acaoTipo: 'nav',
    navTarget: 'progressoes',
  },
  {
    id: 'registro',
    numero: '06',
    titulo: 'Registro de Treinos, Dupla Progressão e Exportação CSV',
    tituloCurto: 'Registro e Exportar CSV',
    resumo:
      'Diário estruturado que analisa automaticamente quando você está pronto para subir de degrau e permite exportar todo o histórico em planilha.',
    icon: ClipboardList,
    passos: [
      'Registre séries pela Sessão Guiada, pelo botão "Registrar" na tabela do plano ou manualmente pelo formulário de Novo Registro.',
      'Acompanhe no painel de Dupla Progressão quantas sessões limpas no topo da faixa você já acumulou em cada padrão (meta: 2 sessões seguidas).',
      'Quando um padrão completar 2/2 sessões limpas, clique em "Avançar para próximo degrau" para progredir automaticamente no plano.',
      'Use o filtro por padrão de movimento para revisar seu histórico ou clique em "Exportar CSV" para baixar uma cópia de segurança.',
    ],
    recursos: [
      {
        nome: 'Regra de Dupla Progressão automática',
        detalhe:
          'Só libera o avanço quando as duas últimas sessões do degrau atual atingem o topo da faixa com técnica marcada como limpa.',
      },
      {
        nome: 'Escala de Sensação (1–10 / RPE)',
        detalhe:
          'Mede o esforço percebido ao fim das séries: 1–4 muito leve, 5–6 moderado, 7–8 ideal de treino (RIR 2–3), 9 bem pesado (RIR ~1) e 10 esforço máximo.',
      },
      {
        nome: 'Exportação compatível com planilhas',
        detalhe:
          'Gera arquivo .csv com data, exercício, variação, séries × reps, sensação (1–10) e observações.',
      },
    ],
    dicaPratica:
      'Quando um exercício que parecia nota 8–9 passa a parecer 6–7 com a mesma quantidade de repetições, é sinal claro de ganho de força para avançar de degrau.',
    acaoLabel: 'Abrir Registro e Evolução',
    acaoTipo: 'nav',
    navTarget: 'registro',
  },
  {
    id: 'tecnica',
    numero: '07',
    titulo: 'Técnica, Segurança e Armazenamento Local',
    tituloCurto: 'Técnica e Dados Locais',
    resumo:
      'Manual de correções posturais, regras de respiração/RIR, alertas de dor articular e privacidade total com salvamento local no navegador.',
    icon: ShieldCheck,
    passos: [
      'Consulte a aba "Técnica e Segurança" sempre que sentir dúvida sobre alinhamento escapular, posição de cotovelos, lombar ou joelhos.',
      'Filtre o guia por padrão de movimento ou abra direto pelo botão "Ver correção de técnica" dentro de qualquer exercício do plano.',
      'Aplique a regra da dor: desconforto muscular de esforço é esperado; dor articular aguda ou pontada exige parar, regredir ou trocar o exercício.',
    ],
    recursos: [
      {
        nome: 'Dados 100% locais no navegador',
        detalhe:
          'Seu perfil de anamnese, degraus atuais e histórico de treinos ficam salvos automaticamente no localStorage do dispositivo, sem precisar criar conta.',
      },
      {
        nome: 'Referência de RIR e Deload',
        detalhe:
          'Explica na prática como calibrar 1–3 repetições na reserva (RIR) e quando aplicar uma semana leve de recuperação.',
      },
    ],
    dicaPratica:
      'Como os dados ficam salvos localmente no navegador, faça um backup periódico em "Registro e Evolução → Exportar CSV" se trocar de aparelho.',
    acaoLabel: 'Abrir Técnica e Segurança',
    acaoTipo: 'nav',
    navTarget: 'tecnica',
  },
];

interface FaqItem {
  id: string;
  pergunta: string;
  resposta: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-sensacao',
    pergunta: 'O que significa a nota de Sensação (1–10) nos registros?',
    resposta:
      'É a sua percepção subjetiva de esforço (RPE) no exercício: 1–4 indica muito leve (aquecimento ou deload), 5–6 moderado (RIR 4+), 7–8 é a faixa ideal de treino (desafiador com técnica limpa e 2–3 repetições na reserva), 9 bem pesado (sobraria ~1 repetição) e 10 esforço máximo/falha.',
  },
  {
    id: 'faq-dupla-progressao',
    pergunta: 'Como funciona o avanço automático pela Dupla Progressão?',
    resposta:
      'Primeiro você evolui nas repetições dentro da faixa sugerida (por exemplo, de 3×8 até 3×12). Quando completar o topo da faixa com "Técnica limpa" marcada por 2 sessões seguidas no mesmo degrau, o aplicativo exibe o botão verde "Avançar" no topo do Plano e na aba Registro.',
  },
  {
    id: 'faq-objetos',
    pergunta: 'Não tenho mesa firme ou barra fixa — o que faço nos exercícios com objeto?',
    resposta:
      'Abra "Como fazer" no exercício. Todos os 5 padrões que utilizam objetos (Puxar Horizontal, Puxar Vertical, Paralelas/Tríceps, Panturrilha e Habilidades) possuem um seletor com 3 variações interativas em 3D, incluindo opções com toalha na porta, mochila, pilha de livros ou sem nenhum objeto direto no tapete.',
  },
  {
    id: 'faq-unilateral',
    pergunta: 'Nos exercícios unilaterais, devo registrar as repetições de cada lado?',
    resposta:
      'Sim. Quando o exercício indica "/ lado" (como Ponte de glúteo unilateral, Stiff unilateral ou Agachamento búlgaro), a meta é por perna. Comece sempre pelo lado mais fraco e faça o mesmo número de repetições limpas no outro lado.',
  },
  {
    id: 'faq-deload',
    pergunta: 'Quando devo ativar a Semana de Deload?',
    resposta:
      'Recomendamos 1 semana de deload a cada 4 a 6 semanas de treino consistente, ou antes caso perceba queda de rendimento, sono ruim ou fadiga articular. Ao ligar o interruptor no topo do Meu Plano, o volume cai para 50–60% das séries com RIR 4+ automaticamente.',
  },
  {
    id: 'faq-dados',
    pergunta: 'Onde ficam salvos meus treinos e configurações?',
    resposta:
      'Tudo é salvo automaticamente no armazenamento local (localStorage) do seu navegador. Seus dados não saem do seu dispositivo, e você pode exportar seu diário em arquivo CSV a qualquer momento na aba Registro e Evolução.',
  },
];

export function ManualView({
  onNavigate,
  onStartGuidedSession,
  onOpenSampleDemo,
}: ManualViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(MANUAL_CHAPTERS[0].id);
  const [openFaqId, setOpenFaqId] = useState<string | null>(FAQ_ITEMS[0].id);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredChapters = useMemo(() => {
    if (!normalizedQuery) return MANUAL_CHAPTERS;
    return MANUAL_CHAPTERS.filter((ch) => {
      const haystack = [
        ch.titulo,
        ch.resumo,
        ch.dicaPratica,
        ...ch.passos,
        ...ch.recursos.flatMap((r) => [r.nome, r.detalhe]),
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [normalizedQuery]);

  const activeChapter =
    filteredChapters.find((c) => c.id === selectedChapterId) ??
    filteredChapters[0] ??
    MANUAL_CHAPTERS[0];

  const handleChapterAction = (chapter: ManualChapter) => {
    if (chapter.acaoTipo === 'session') {
      onStartGuidedSession();
      return;
    }
    if (chapter.acaoTipo === 'demo') {
      onOpenSampleDemo(
        'dobradica_posterior',
        'Ponte de glúteo unilateral',
        2,
        'Por lado: mantenha a pelve nivelada com apenas um pé apoiado e a outra perna estendida alinhada com a coxa.'
      );
      return;
    }
    if (chapter.navTarget) {
      onNavigate(chapter.navTarget);
    }
  };

  return (
    <div className="space-y-8">
      {/* Editorial Header + Search */}
      <section className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs text-neutral-500">
            Guia completo de uso · Calistenia em Casa
          </p>
          <h1 className="font-display text-2xl lg:text-3xl font-semibold tracking-tight text-neutral-900">
            Manual do App e Funcionalidades
          </h1>
          <p className="text-sm text-neutral-600 max-w-2xl">
            Entenda como montar seu plano semanal, usar o player 3D anatômico com variações caseiras, conduzir a sessão guiada e evoluir com segurança.
          </p>
        </div>

        <div className="relative w-full lg:w-80 shrink-0">
          <Search
            className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar funcionalidade ou dúvida..."
            aria-label="Buscar no manual do aplicativo"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-neutral-300 bg-white text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:border-[#0F3D3E]"
          />
        </div>
      </section>

      {/* Quick-Start 3-Step Strip */}
      <section aria-label="Guia rápido em 3 passos" className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            Comece em 3 passos
          </h2>
          <span className="text-xs text-neutral-500">
            Fluxo recomendado para a primeira semana
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => onNavigate('anamnese')}
            className="text-left p-5 rounded-xl bg-white border border-neutral-200 hover:border-[#0F3D3E]/50 hover:bg-neutral-50/70 transition-colors flex flex-col justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="font-mono tabular-nums text-xs font-semibold text-[#0F3D3E]">
                PASSO 01
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Calibre seu perfil na Anamnese
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Informe dias por semana, equipamentos disponíveis, possíveis desconfortos articulares e o mini-teste inicial.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F3D3E]">
              Ir para Anamnese
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            onClick={onStartGuidedSession}
            className="text-left p-5 rounded-xl bg-white border border-neutral-200 hover:border-[#0F3D3E]/50 hover:bg-neutral-50/70 transition-colors flex flex-col justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="font-mono tabular-nums text-xs font-semibold text-[#0F3D3E]">
                PASSO 02
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Execute a Sessão Guiada com Player 3D
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Confira o movimento em 3D (com 3 opções de objeto caseiro), marque cada série e acompanhe o descanso automático.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F3D3E]">
              Iniciar sessão agora
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('registro')}
            className="text-left p-5 rounded-xl bg-white border border-neutral-200 hover:border-[#0F3D3E]/50 hover:bg-neutral-50/70 transition-colors flex flex-col justify-between gap-4"
          >
            <div className="space-y-1.5">
              <div className="font-mono tabular-nums text-xs font-semibold text-[#0F3D3E]">
                PASSO 03
              </div>
              <h3 className="text-sm font-semibold text-neutral-900">
                Evolua pela Dupla Progressão
              </h3>
              <p className="text-xs text-neutral-600 leading-relaxed">
                Complete 2 sessões limpas no topo da faixa de repetições para destravar o próximo degrau com segurança.
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0F3D3E]">
              Ver Registro e Evolução
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </span>
          </button>
        </div>
      </section>

      {/* Main 2-Column Chapter Explorer */}
      <section aria-label="Capítulos do manual" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <nav
          aria-label="Índice de funcionalidades"
          className="lg:col-span-4 bg-white border border-neutral-200 rounded-xl p-2 space-y-1"
        >
          {filteredChapters.length === 0 ? (
            <div className="p-4 text-xs text-neutral-500 text-center space-y-2">
              <p>Nenhum capítulo encontrado para &ldquo;{searchQuery}&rdquo;.</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-[#0F3D3E] font-medium hover:underline"
              >
                Limpar busca
              </button>
            </div>
          ) : (
            filteredChapters.map((chapter) => {
              const Icon = chapter.icon;
              const isSelected = activeChapter.id === chapter.id;
              return (
                <button
                  key={chapter.id}
                  type="button"
                  onClick={() => setSelectedChapterId(chapter.id)}
                  aria-current={isSelected ? 'page' : undefined}
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'bg-[#0F3D3E] text-white'
                      : 'text-neutral-800 hover:bg-neutral-100'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div
                      className={`font-mono tabular-nums text-[11px] ${
                        isSelected ? 'text-neutral-200' : 'text-neutral-500'
                      }`}
                    >
                      Capítulo {chapter.numero}
                    </div>
                    <div className="text-sm font-medium leading-snug">{chapter.tituloCurto}</div>
                  </div>
                </button>
              );
            })
          )}
        </nav>

        {/* Active Chapter Details */}
        <article className="lg:col-span-8 bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-neutral-200 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="font-mono tabular-nums text-xs text-neutral-500">
                Capítulo {activeChapter.numero} de 0{MANUAL_CHAPTERS.length}
              </div>
              <h2 className="font-display text-xl font-semibold text-neutral-900">
                {activeChapter.titulo}
              </h2>
              <p className="text-sm text-neutral-600 leading-relaxed">
                {activeChapter.resumo}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleChapterAction(activeChapter)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#0F3D3E] text-white text-xs font-medium hover:bg-[#0B2E2F] transition-colors whitespace-nowrap shrink-0"
            >
              {activeChapter.acaoLabel}
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Step by step */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-neutral-900">
                Como usar na prática
              </h3>
              <ol className="space-y-2.5">
                {activeChapter.passos.map((passo, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 p-3.5 rounded-lg bg-neutral-50 border border-neutral-200 text-sm text-neutral-700 leading-relaxed"
                  >
                    <span className="font-mono tabular-nums text-xs font-semibold text-[#0F3D3E] mt-0.5 shrink-0">
                      0{idx + 1}.
                    </span>
                    <span>{passo}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Included features */}
            <div className="space-y-3 pt-2 border-t border-neutral-100">
              <h3 className="text-sm font-semibold text-neutral-900">
                Recursos incluídos nesta área
              </h3>
              <ul className="space-y-2.5">
                {activeChapter.recursos.map((rec) => (
                  <li key={rec.nome} className="flex items-start gap-2.5 text-sm">
                    <Check
                      className="w-4 h-4 text-[#0F3D3E] shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="text-neutral-700 leading-relaxed">
                      <strong className="font-semibold text-neutral-900">{rec.nome}:</strong>{' '}
                      {rec.detalhe}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {activeChapter.id === 'registro' && <FeelingScaleLegend />}

            {/* Practical tip */}
            <div className="p-4 rounded-xl bg-[#0F3D3E]/[0.05] border border-[#0F3D3E]/20 text-xs text-neutral-800 space-y-1">
              <div className="font-semibold text-[#0F3D3E] flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                Dica prática
              </div>
              <p className="leading-relaxed">{activeChapter.dicaPratica}</p>
            </div>
          </div>
        </article>
      </section>

      {/* Expandable FAQ Accordion */}
      <section aria-label="Perguntas frequentes" className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            Perguntas frequentes
          </h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Respostas rápidas sobre progressão, objetos caseiros e funcionamento offline
          </p>
        </div>

        <div className="divide-y divide-neutral-100">
          {FAQ_ITEMS.map((item) => {
            const isOpen = openFaqId === item.id;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 hover:bg-neutral-50/70 transition-colors"
                >
                  <span className="text-sm font-medium text-neutral-900">
                    {item.pergunta}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${
                      isOpen ? 'rotate-180 text-[#0F3D3E]' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-sm text-neutral-600 leading-relaxed max-w-3xl">
                    {item.resposta}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
