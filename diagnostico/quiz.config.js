/* Audácia · quiz da receita · TODO O TEXTO E TODA A PONTUAÇÃO MORAM AQUI.
 *
 * Pode editar à vontade: perguntas, opções, pontos, resultados, abertura, captura, WhatsApp e a
 * prévia de compartilhamento. A lógica (logica/motor.js) só lê este arquivo.
 *
 * Depois de editar:
 *   node publicar.mjs --teste       roda os testes, copia este arquivo pra página e sobe a prévia
 *   (mudou pergunta, opção ou ponto? suba também o servidor: ver LEIA.md, "Servidor")
 *
 * Como os pontos funcionam
 *   - Cada opção tem `pontos`, por bloco: { atracao, conversao, controle }.
 *   - Cada pergunta tem `maximo`: o máximo possível em cada bloco. Uma pergunta só entra na conta de
 *     um bloco quando a opção escolhida dá ponto (mesmo que zero) naquele bloco. Exemplo: em A2,
 *     "Chega gente, mas pouca compra" dá Atração 2 e Conversão 0, e por isso conta 0 de 2 em Conversão.
 *   - `naoSei: true` marca a opção como "não sei": cada uma tira mais 1 ponto da nota de Controle.
 *   - `vai` diz para qual pergunta a opção leva (só na P1 e na P2).
 */
export default {
  versao: 'v1 · 12/10/2026',

  /* ── abertura ─────────────────────────────────────────────────────────────────────────────── */
  abertura: {
    titulo: 'Veja em 3 minutos onde a sua empresa está deixando dinheiro na mesa.',
    destaque: 'dinheiro na mesa', // trecho do título que vai em amarelo (vazio: nenhum)
    apoio: 'Não é sobre marketing, não é sobre vendas, é sobre receita. Responda e descubra onde ela trava.',
    linha: '7 perguntas · 3 minutos',
    botao: 'Começar o diagnóstico',
  },

  /* prévia do link (Instagram, WhatsApp). A imagem é gerada deste título: node prova/og.mjs */
  compartilhamento: {
    titulo: 'Veja em 3 minutos onde a sua empresa está deixando dinheiro na mesa.',
    descricao: 'Não é sobre marketing, não é sobre vendas, é sobre receita. Responda e descubra onde ela trava.',
    tituloAba: 'Diagnóstico de receita · Audácia',
  },

  blocos: {
    atracao: { nome: 'Atração', pergunta: 'Chega gente?' },
    conversao: { nome: 'Conversão', pergunta: 'Quem chega vira cliente?' },
    controle: { nome: 'Controle', pergunta: 'Você sabe os números?' },
  },

  /* ── perguntas ────────────────────────────────────────────────────────────────────────────── */
  perguntas: {
    P1: {
      bloco: 'atracao',
      titulo: 'Hoje, de onde vem a maioria dos seus clientes?',
      maximo: { atracao: 1 },
      opcoes: [
        { id: 'indicacao', texto: 'Indicação e boca a boca', pontos: { atracao: 0 }, vai: 'A1' },
        { id: 'instagram', texto: 'Instagram e conteúdo', pontos: { atracao: 1 }, vai: 'A2' },
        { id: 'varios', texto: 'Vários canais misturados', pontos: { atracao: 1 }, vai: 'A2' },
        { id: 'anuncio', texto: 'Anúncio pago', pontos: { atracao: 1 }, vai: 'A3', anuncio: true },
      ],
    },
    A1: {
      bloco: 'atracao',
      titulo: 'Se as indicações parassem no mês que vem, de onde viriam os próximos clientes?',
      maximo: { atracao: 2 },
      opcoes: [
        { id: 'nao_sei', texto: 'Não sei', pontos: { atracao: 0 }, naoSei: true },
        { id: 'correr', texto: 'Teria que correr atrás', pontos: { atracao: 0 } },
        { id: 'outro_canal', texto: 'Tenho outro canal funcionando', pontos: { atracao: 2 } },
      ],
    },
    A2: {
      bloco: 'atracao',
      titulo: 'Isso está trazendo gente suficiente?',
      maximo: { atracao: 2, conversao: 2 },
      opcoes: [
        { id: 'pouca_gente', texto: 'Chega pouca gente', pontos: { atracao: 0 } },
        { id: 'pouca_compra', texto: 'Chega gente, mas pouca compra', pontos: { atracao: 2, conversao: 0 } },
        { id: 'vende_bem', texto: 'Chega e vende bem', pontos: { atracao: 2 } },
        { id: 'nao_sei', texto: 'Não sei dizer', pontos: { atracao: 0 }, naoSei: true },
      ],
    },
    A3: {
      bloco: 'atracao',
      titulo: 'O anúncio está trazendo resultado?',
      maximo: { atracao: 2, conversao: 2 },
      opcoes: [
        { id: 'caro', texto: 'Chega gente, mas sai caro', pontos: { atracao: 1 } },
        { id: 'nao_compra', texto: 'Chega gente, mas não compra', pontos: { atracao: 2, conversao: 0 } },
        { id: 'se_paga', texto: 'Traz cliente e se paga', pontos: { atracao: 2 } },
        { id: 'nao_sei', texto: 'Não sei se se paga', pontos: { atracao: 0 }, naoSei: true },
      ],
    },
    P2: {
      bloco: 'conversao',
      titulo: 'Quando alguém se interessa, quem atende?',
      maximo: { conversao: 2 },
      opcoes: [
        { id: 'eu', texto: 'Eu mesmo, no WhatsApp, quando dá', pontos: { conversao: 0 }, vai: 'B1' },
        { id: 'equipe', texto: 'Alguém da equipe, no WhatsApp, sem processo definido', pontos: { conversao: 1 }, vai: 'B1' },
        { id: 'crm', texto: 'Uma equipe com processo e CRM', pontos: { conversao: 2 }, vai: 'B2', crm: true },
      ],
    },
    B1: {
      bloco: 'conversao',
      titulo: 'Quem pergunta preço e não compra na hora, alguém volta a falar com ele?',
      maximo: { conversao: 2 },
      opcoes: [
        { id: 'quase_nunca', texto: 'Quase nunca', pontos: { conversao: 0 } },
        { id: 'as_vezes', texto: 'Às vezes, quando lembra', pontos: { conversao: 1 } },
        { id: 'dia_certo', texto: 'Sim, com dia certo', pontos: { conversao: 2 } },
      ],
    },
    B2: {
      bloco: 'conversao',
      titulo: 'De cada 10 interessados, quantos viram cliente?',
      maximo: { conversao: 2 },
      opcoes: [
        { id: '0_1', texto: '0 a 1', pontos: { conversao: 0 } },
        { id: '2_3', texto: '2 a 3', pontos: { conversao: 1 } },
        { id: '4_mais', texto: '4 ou mais', pontos: { conversao: 2 } },
        { id: 'nao_sei', texto: 'Não sei o número', pontos: { conversao: 0 }, naoSei: true },
      ],
    },

    /* as cinco versões da pergunta extra: o motor escolhe uma (regra em `extra`, abaixo) */
    X_ATRACAO: {
      bloco: 'atracao',
      titulo: 'Quantas pessoas novas te procuram por mês?',
      maximo: { atracao: 2 },
      opcoes: [
        { id: 'menos_10', texto: 'Menos de 10', pontos: { atracao: 0 } },
        { id: '10_50', texto: '10 a 50', pontos: { atracao: 1 } },
        { id: 'mais_50', texto: 'Mais de 50', pontos: { atracao: 2 } },
        { id: 'nao_sei', texto: 'Não sei', pontos: { atracao: 0 }, naoSei: true },
      ],
    },
    X_ATRACAO_ANUNCIO: {
      bloco: 'controle',
      titulo: 'Quanto você paga por cada contato do anúncio?',
      maximo: { controle: 2 },
      opcoes: [
        { id: 'sei', texto: 'Sei', pontos: { controle: 2 } },
        { id: 'mais_ou_menos', texto: 'Mais ou menos', pontos: { controle: 1 } },
        { id: 'nao_sei', texto: 'Não sei', pontos: { controle: 0 }, naoSei: true },
      ],
    },
    X_CONVERSAO_SEM_CRM: {
      bloco: 'conversao',
      titulo: 'Em quanto tempo o interessado recebe a primeira resposta?',
      maximo: { conversao: 2 },
      opcoes: [
        { id: 'minutos', texto: 'Minutos', pontos: { conversao: 2 } },
        { id: 'horas', texto: 'Algumas horas', pontos: { conversao: 1 } },
        { id: 'outro_dia', texto: 'No outro dia ou mais', pontos: { conversao: 0 } },
        { id: 'depende', texto: 'Depende do dia', pontos: { conversao: 0 } },
      ],
    },
    X_CONVERSAO_COM_CRM: {
      bloco: 'conversao',
      titulo: 'Quem não comprou fica guardado pra receber contato depois?',
      maximo: { conversao: 2 },
      opcoes: [
        { id: 'organizado', texto: 'Sim, organizado', pontos: { conversao: 2 } },
        { id: 'whatsapp', texto: 'Fica perdido no WhatsApp', pontos: { conversao: 0 } },
        { id: 'nao', texto: 'Não', pontos: { conversao: 0 } },
      ],
    },
    X_CONTROLE: {
      bloco: 'controle',
      titulo: 'Você acompanha quanto entrou de receita por canal, todo mês?',
      maximo: { controle: 2 },
      opcoes: [
        { id: 'sim', texto: 'Sim', pontos: { controle: 2 } },
        { id: 'mais_ou_menos', texto: 'Mais ou menos', pontos: { controle: 1 } },
        { id: 'nao', texto: 'Não', pontos: { controle: 0 } },
      ],
    },

    P3: {
      bloco: 'controle',
      titulo: 'Você sabe quanto vale um cliente, somando tudo o que ele paga ao longo do tempo?',
      maximo: { controle: 2 },
      opcoes: [
        { id: 'sei', texto: 'Sei o número', pontos: { controle: 2 } },
        { id: 'ideia', texto: 'Tenho uma ideia', pontos: { controle: 1 } },
        { id: 'nao_sei', texto: 'Não sei', pontos: { controle: 0 }, naoSei: true },
      ],
    },
    P4: {
      bloco: 'controle',
      titulo: 'Se a procura dobrasse no mês que vem, o que aconteceria?',
      maximo: { controle: 2 },
      opcoes: [
        { id: 'dobro', texto: 'Venderíamos o dobro', pontos: { controle: 2 } },
        { id: 'perderia', texto: 'Venderíamos mais, mas perderíamos muita gente no caminho', pontos: { controle: 1 } },
        { id: 'nao_daria', texto: 'Não daríamos conta', pontos: { controle: 0 } },
      ],
    },
  },

  /* ordem: P1 → (A1|A2|A3) → P2 → (B1|B2) → extra → P3 → P4 */
  ordem: ['P1', '@P1', 'P2', '@P2', '@extra', 'P3', 'P4'],

  /* A extra vai pro bloco mais fraco depois de B1/B2. Empate: na ordem de `desempate`.
   * Controle ainda não tem pergunta nesse ponto, então a nota parcial dele é 10 menos 1 por
   * "não sei" dado até ali (A VALIDAR com o Patrick). */
  extra: {
    desempate: ['conversao', 'atracao', 'controle'],
    atracao: 'X_ATRACAO',
    atracaoAnuncio: 'X_ATRACAO_ANUNCIO', // quando a P1 foi "Anúncio pago"
    conversaoSemCrm: 'X_CONVERSAO_SEM_CRM',
    conversaoComCrm: 'X_CONVERSAO_COM_CRM', // quando a P2 foi "Uma equipe com processo e CRM"
    controle: 'X_CONTROLE',
  },

  notas: {
    penalidadeNaoSei: 1, // cada "não sei" tira isso da nota de Controle (nunca abaixo de 0)
    desempateFuro: ['conversao', 'atracao', 'controle'],
    maquinaAcimaDe: 7, // os três ACIMA disso (7 não conta) = "Sua máquina roda"
  },

  /* ── captura ──────────────────────────────────────────────────────────────────────────────── */
  captura: {
    titulo: 'Seu diagnóstico está pronto. Pra onde a gente manda?',
    campos: {
      nome: 'Nome',
      whatsapp: 'WhatsApp',
      empresa: 'Empresa ou @ do Instagram',
      segmento: 'Segmento',
      segmentoOutro: 'Qual?',
      faturamento: 'Faturamento anual',
    },
    segmentos: [
      'Academia ou box',
      'Estúdio (pilates, funcional, dança)',
      'Clínica ou saúde',
      'Assessoria ou escola de esporte',
      'Loja ou e-commerce',
      'Serviço para empresas',
      'Outro',
    ],
    faturamentos: [
      'Até R$ 500 mil',
      'R$ 500 mil a 1 milhão',
      'R$ 1 a 3 milhões',
      'Acima de R$ 3 milhões',
      'Prefiro não dizer',
    ],
    autorizacao: 'Autorizo a Audácia a usar esses dados para me enviar o diagnóstico e entrar em contato.',
    botao: 'Ver meu diagnóstico',
    erro: 'Não deu pra enviar agora. Confira a conexão e tente de novo.',
  },

  /* ── resultado ────────────────────────────────────────────────────────────────────────────── */
  resultado: {
    rotuloNotas: 'Sua receita em três partes',
    rotuloFuro: 'Onde ela mais trava',
    diagnosticos: {
      atracao: {
        titulo: 'Sua receita depende da sorte.',
        texto: 'Os clientes chegam, mas não por uma máquina sua, e no mês que a indicação secar a receita cai junto.',
        video: null, // [FALTA INSUMO: vídeo do Patrick sobre Atração] link do YouTube, Vimeo ou .mp4
      },
      conversao: {
        titulo: 'Chega gente, e o dinheiro vaza no meio.',
        texto: 'O interesse existe, mas quem não compra na hora some, e ninguém volta pra buscar.',
        video: null, // [FALTA INSUMO: vídeo do Patrick sobre Conversão]
      },
      controle: {
        titulo: 'Você está dirigindo no escuro.',
        texto: 'Sem os números, não dá pra saber onde investir nem o que está dando certo.',
        video: null, // [FALTA INSUMO: vídeo do Patrick sobre Controle]
      },
      maquina: {
        titulo: 'Sua máquina roda.',
        texto: 'O próximo passo é crescer sem quebrar.',
        video: null, // [FALTA INSUMO: vídeo do Patrick para quem tirou acima de 7 nos três]
      },
    },
    videoReservado: 'vídeo do Patrick',
    /* 12/10: o convite com botão de WhatsApp saiu do final, a pedido dele. O resultado termina no vídeo. */
  },

  /* ── medição (regra de 10/10: os 4 códigos em toda página; o publicador recusa "ir ao ar" sem eles) ── */
  medicao: {
    trackerKey: '531800281d17a03a5f799f5c4f04bb41', // tracker da Audácia (cliente Audácia na plataforma)
    googleTag: null, // [FALTA INSUMO: id do Google Tag / GA4 da Audácia, ex. G-XXXXXXX]
    metaPixel: null, // [FALTA INSUMO: id do pixel do Meta da Audácia]
    clarity: null, // [FALTA INSUMO: id do projeto Clarity da Audácia]
  },

  publicacao: {
    projeto: 'audacia-diagnostico', // Cloudflare Pages (prévia antiga, continua de pé)
    pasta: 'diagnostico', // pasta dentro do audacia-site
    url: 'https://audacia.marketing/diagnostico/', // no ar pelo repositório audacia-site (GitHub Pages)
    servidor: 'https://uwsrhlifgdpmkezduimk.supabase.co/functions/v1/audacia-quiz',
  },
};
