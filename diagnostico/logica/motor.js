/* Audácia · quiz da receita · o motor.
 *
 * Só regra, nenhum texto: tudo o que se lê vem do quiz.config.js. O mesmo arquivo roda na página,
 * no servidor (edge function audacia-quiz, que recalcula as notas antes de gravar no CRM) e nos
 * testes (node --test logica/motor.test.mjs).
 *
 * `respostas` é sempre { P1: 'anuncio', A3: 'se_paga', ... } (id da pergunta → id da opção).
 */

export const BLOCOS = ['atracao', 'conversao', 'controle'];

export function opcaoDe(cfg, idPergunta, idOpcao) {
  const p = cfg.perguntas[idPergunta];
  return p ? p.opcoes.find((o) => o.id === idOpcao) || null : null;
}

/* soma pontos obtidos e possíveis de um conjunto de respostas */
function somar(cfg, respostas, ids) {
  const obtido = { atracao: 0, conversao: 0, controle: 0 };
  const possivel = { atracao: 0, conversao: 0, controle: 0 };
  let naoSei = 0;
  for (const id of ids) {
    const o = opcaoDe(cfg, id, respostas[id]);
    if (!o) continue;
    const max = cfg.perguntas[id].maximo || {};
    for (const b of Object.keys(o.pontos || {})) {
      obtido[b] += o.pontos[b];
      possivel[b] += max[b] ?? 2;
    }
    if (o.naoSei) naoSei += 1;
  }
  return { obtido, possivel, naoSei };
}

const arred = (n) => Math.round(n * 10) / 10;

/* notas parciais depois de B1/B2, pra escolher a extra */
export function notasParciais(cfg, respostas, ids) {
  const { obtido, possivel, naoSei } = somar(cfg, respostas, ids);
  const pen = cfg.notas.penalidadeNaoSei;
  const n = {};
  for (const b of BLOCOS) {
    if (possivel[b] > 0) n[b] = (obtido[b] / possivel[b]) * 10;
    else n[b] = b === 'controle' ? 10 : null; // Controle sem pergunta ainda: parte de 10
  }
  n.controle = Math.max(0, n.controle - naoSei * pen);
  return n;
}

export function maisFraco(notas, desempate) {
  let melhor = null;
  for (const b of desempate) {
    if (notas[b] == null) continue;
    if (melhor == null || notas[b] < notas[melhor] - 1e-9) melhor = b;
  }
  return melhor;
}

export function escolherExtra(cfg, respostas) {
  const ids = [ramo(cfg, 'P1', respostas), ramo(cfg, 'P2', respostas)].filter(Boolean);
  const parcial = notasParciais(cfg, respostas, ['P1', 'P2', ...ids]);
  const bloco = maisFraco(parcial, cfg.extra.desempate);
  const e = cfg.extra;
  if (bloco === 'atracao') return opcaoDe(cfg, 'P1', respostas.P1)?.anuncio ? e.atracaoAnuncio : e.atracao;
  if (bloco === 'conversao') return opcaoDe(cfg, 'P2', respostas.P2)?.crm ? e.conversaoComCrm : e.conversaoSemCrm;
  return e.controle;
}

/* para onde a opção escolhida em P1 ou P2 leva */
function ramo(cfg, id, respostas) {
  const o = opcaoDe(cfg, id, respostas[id]);
  return o ? o.vai : null;
}

/* A sequência de perguntas dada as respostas até agora. Devolve { seq, completo }: `seq` para na
 * primeira pergunta que ainda não dá pra saber (a próxima a responder já está nela). */
export function sequencia(cfg, respostas) {
  const seq = [];
  for (const passo of cfg.ordem) {
    let id = passo;
    if (passo === '@P1' || passo === '@P2') {
      id = ramo(cfg, passo.slice(1), respostas);
      if (!id) return { seq, completo: false };
    } else if (passo === '@extra') {
      const b = seq.find((x) => x === 'B1' || x === 'B2');
      if (!b || !respostas[b]) return { seq, completo: false };
      id = escolherExtra(cfg, respostas);
    }
    seq.push(id);
    if (!respostas[id]) return { seq, completo: false };
  }
  return { seq, completo: true };
}

export const TOTAL_PERGUNTAS = 7;

/* o resultado final: notas de 0 a 10, furo, diagnóstico */
export function calcular(cfg, respostas) {
  const { seq, completo } = sequencia(cfg, respostas);
  if (!completo) throw new Error('quiz incompleto');
  const { obtido, possivel, naoSei } = somar(cfg, respostas, seq);
  const notas = {};
  for (const b of BLOCOS) notas[b] = possivel[b] > 0 ? (obtido[b] / possivel[b]) * 10 : 0;
  notas.controle = Math.max(0, notas.controle - naoSei * cfg.notas.penalidadeNaoSei);
  for (const b of BLOCOS) notas[b] = arred(notas[b]);

  const furo = maisFraco(notas, cfg.notas.desempateFuro);
  const maquina = BLOCOS.every((b) => notas[b] > cfg.notas.maquinaAcimaDe);
  /* a nota que aparece nunca fica abaixo do mínimo (zero parece erro); o furo já saiu da real */
  const minimo = cfg.notas.minimoExibido ?? 0;
  const exibidas = {};
  for (const b of BLOCOS) exibidas[b] = Math.max(minimo, notas[b]);
  return {
    seq, notas: exibidas, notasBrutas: notas, furo, naoSei, maquina,
    diagnostico: maquina ? 'maquina' : furo,
    pontos: { obtido, possivel },
  };
}

/* nota pra exibir: 6.7 → "6,7"; 7 → "7" */
export function notaTexto(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ',');
}

/* respostas em texto, na ordem respondida (pra ficha do CRM e o resumo) */
export function respostasEmTexto(cfg, respostas, seq) {
  return seq.map((id) => {
    const p = cfg.perguntas[id];
    const o = opcaoDe(cfg, id, respostas[id]);
    return { id, bloco: p.bloco, pergunta: p.titulo, resposta: o ? o.texto : '', naoSei: !!o?.naoSei };
  });
}
