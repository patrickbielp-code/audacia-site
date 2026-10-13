/* Audácia · quiz da receita · o app da página.
 *
 * Todo texto vem de quiz.config.js e toda regra de logica/motor.js (os dois são copiados pra cá
 * pelo montar.mjs; o original fica na raiz da pasta do quiz).
 *
 * Eventos no rastreador da Audácia (com as UTMs da URL): pageview (o tracker.js manda sozinho),
 * quiz_iniciado (tocou em Começar), quiz_resposta (cada pergunta: mostra onde as pessoas param),
 * quiz_concluido (respondeu a P4) e lead_capturado (gravado pelo SERVIDOR, quando o lead entra).
 */
import cfg from './quiz.config.js?v=e720b3f3';
import { sequencia, calcular, notaTexto, BLOCOS, TOTAL_PERGUNTAS } from './logica/motor.js?v=e720b3f3';

const RT = window.QUIZ_RUNTIME || {};
const TRACKER = window.AUDACIA_TRACKER || {};
const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const CHAVE = 'audacia-quiz-receita-v1';
const LETRAS = 'ABCDEFG';

/* ── estado (sobrevive a recarregar a aba, não a fechar) ── */
let estado = carregar() || novo();
function novo() {
  return { sessao: uuid(), respostas: {}, pos: 0, tela: 'abertura', iniciou: false, concluiu: false, enviado: false, contato: null };
}
function carregar() { try { return JSON.parse(sessionStorage.getItem(CHAVE)); } catch (_) { return null; } }
function salvar() { try { sessionStorage.setItem(CHAVE, JSON.stringify(estado)); } catch (_) { /* aba privada */ } }
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/* ── eventos ── */
function utms() {
  const o = {};
  for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid']) {
    const v = params.get(k);
    if (v) o[k] = v;
  }
  return o;
}
function visitorId() {
  const m = document.cookie.match(/(?:^|;\s*)audacia_vid=([^;]+)/);
  return m ? m[1] : null;
}
function evento(tipo, props = {}) {
  try {
    window.gtag && window.gtag('event', tipo, props);
    window.fbq && window.fbq('trackCustom', tipo, props);
    window.clarity && window.clarity('event', tipo);
  } catch (_) { /* medição nunca derruba o quiz */ }
  const vid = visitorId();
  if (!vid || !TRACKER.endpoint) return;
  const corpo = JSON.stringify({
    visitor_id: vid, event_type: tipo, url: location.href, path: location.pathname, title: document.title,
    referrer: document.referrer || '', ...utms(),
    properties: { quiz: 'receita', sessao: estado.sessao, ...props },
  });
  try {
    fetch(TRACKER.endpoint + '?key=' + encodeURIComponent(TRACKER.key), {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: corpo, keepalive: true, mode: 'cors', credentials: 'omit',
    }).catch(() => {});
  } catch (_) { /* idem */ }
}

/* ── telas ── */
function mostrar(tela, foco) {
  document.querySelectorAll('.tela').forEach((el) => { el.hidden = el.dataset.tela !== tela; });
  estado.tela = tela;
  salvar();
  $('voltar').hidden = !(tela === 'pergunta' || tela === 'captura');
  window.scrollTo(0, 0);
  if (foco) requestAnimationFrame(() => $(foco)?.focus({ preventScroll: true }));
}

function textoComAcento(el, texto, acento) {
  el.textContent = '';
  const i = acento ? texto.indexOf(acento) : -1;
  if (i < 0) { el.textContent = texto; return; }
  const s = document.createElement('span');
  s.className = 'acento';
  s.textContent = acento;
  const resto = texto.slice(i + acento.length);
  const pont = resto.match(/^[.!?]/);
  if (pont) {
    const q = document.createElement('span');
    q.className = 'pontuacao';
    q.textContent = pont[0];
    el.append(texto.slice(0, i), s, q, resto.slice(1));
  } else el.append(texto.slice(0, i), s, resto);
}

/* título com o ponto final apertado (o ponto da Plus Jakarta a 800 fica solto da palavra) */
function titulo(el, texto) {
  el.textContent = '';
  const partes = String(texto).split(/(?<=\p{L})\./u);
  partes.forEach((t, i) => {
    el.append(t);
    if (i < partes.length - 1) {
      const s = document.createElement('span');
      s.className = 'pontuacao';
      s.textContent = '.';
      el.append(s);
    }
  });
}

function montarAbertura() {
  const a = cfg.abertura;
  textoComAcento($('abertura-titulo'), a.titulo, a.destaque);
  $('abertura-apoio').textContent = a.apoio;
  /* "7 perguntas · 3 minutos" vira duas partes com um ponto amarelo no meio */
  const linha = $('abertura-linha');
  linha.textContent = '';
  a.linha.split('·').map((t) => t.trim()).filter(Boolean).forEach((t, i) => {
    if (i) linha.append(document.createElement('b'));
    const s = document.createElement('span');
    s.textContent = t;
    linha.append(s);
  });
  $('comecar-txt').textContent = a.botao;
}

/* ── pergunta ── */
function renderPergunta() {
  const { seq } = sequencia(cfg, estado.respostas);
  const id = seq[estado.pos];
  const p = cfg.perguntas[id];
  const n = estado.pos + 1;
  const pct = Math.round((estado.pos / TOTAL_PERGUNTAS) * 100);
  $('progresso-barra').style.width = pct + '%';
  $('progresso-pct').textContent = pct + '% pronto';
  $('progresso-bloco').textContent = cfg.blocos[p.bloco].nome;

  const box = $('pergunta');
  box.style.animation = 'none';
  void box.offsetWidth;
  box.style.animation = '';
  $('pergunta-titulo').textContent = p.titulo;
  const opcoes = $('opcoes');
  opcoes.textContent = '';
  p.opcoes.forEach((o, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opcao';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(estado.respostas[id] === o.id));
    const l = document.createElement('span');
    l.className = 'letra';
    l.textContent = LETRAS[i];
    const t = document.createElement('span');
    t.textContent = o.texto;
    b.append(l, t);
    b.addEventListener('click', () => responder(id, o.id, b));
    opcoes.append(b);
  });
}

let travado = false;
function responder(id, opcao, botao) {
  if (travado) return;
  travado = true;
  document.querySelectorAll('.opcao').forEach((b) => b.setAttribute('aria-checked', String(b === botao)));

  /* trocar uma resposta apaga as que vieram depois dela (o caminho pode mudar) */
  const { seq } = sequencia(cfg, estado.respostas);
  const mantidas = {};
  for (const q of seq.slice(0, estado.pos)) mantidas[q] = estado.respostas[q];
  mantidas[id] = opcao;
  estado.respostas = mantidas;
  evento('quiz_resposta', { pergunta: id, resposta: opcao, n: estado.pos + 1 });

  setTimeout(() => {
    travado = false;
    const s = sequencia(cfg, estado.respostas);
    if (s.completo) {
      if (!estado.concluiu) {
        estado.concluiu = true;
        const r = calcular(cfg, estado.respostas);
        evento('quiz_concluido', { furo: r.furo, diagnostico: r.diagnostico, ...r.notas });
      }
      salvar();
      irCaptura();
    } else {
      estado.pos += 1;
      salvar();
      renderPergunta();
      $('pergunta-titulo').focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }
  }, 220);
}

/* ── captura ── */
function montarCaptura() {
  const c = cfg.captura;
  titulo($('captura-titulo'), c.titulo);
  $('l-nome').textContent = c.campos.nome;
  $('l-whatsapp').textContent = c.campos.whatsapp;
  $('l-empresa').textContent = c.campos.empresa;
  $('l-segmento').textContent = c.campos.segmento;
  $('l-segmento-outro').textContent = c.campos.segmentoOutro;
  $('l-faturamento').textContent = c.campos.faturamento;
  $('l-autoriza').textContent = c.autorizacao;
  $('enviar-txt').textContent = c.botao;
  const sel = $('f-segmento');
  for (const s of c.segmentos) sel.append(new Option(s, s));
  sel.addEventListener('change', () => { $('campo-outro').hidden = sel.value !== c.segmentos[c.segmentos.length - 1]; });
  const fx = $('f-faturamento');
  c.faturamentos.forEach((f, i) => {
    const l = document.createElement('label');
    l.className = 'faixa';
    l.innerHTML = `<input type="radio" name="faturamento" value=""><span></span>`;
    l.querySelector('input').value = f;
    l.querySelector('input').id = 'fat-' + i;
    l.querySelector('span').textContent = f;
    fx.append(l);
  });
  $('f-whatsapp').addEventListener('input', (e) => { e.target.value = mascara(e.target.value); });
  $('form').addEventListener('submit', enviar);
}

function mascara(v) {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('55') && d.length > 11) d = d.slice(2);
  d = d.slice(0, 11);
  if (d.length <= 2) return d.length ? '(' + d : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function irCaptura() {
  mostrar('captura', 'captura-titulo');
}

async function enviar(e) {
  e.preventDefault();
  const c = cfg.captura;
  const nome = $('f-nome').value.trim();
  const zap = $('f-whatsapp').value.replace(/\D/g, '');
  const empresa = $('f-empresa').value.trim();
  const segmento = $('f-segmento').value;
  const outro = $('f-segmento-outro').value.trim();
  const fat = document.querySelector('input[name="faturamento"]:checked')?.value || '';
  const autorizou = $('f-autoriza').checked;

  const invalidos = [];
  const marca = (el, ruim) => { el.setAttribute('aria-invalid', String(ruim)); if (ruim) invalidos.push(el); };
  marca($('f-nome'), nome.length < 2);
  marca($('f-whatsapp'), !(zap.length === 10 || zap.length === 11) || /^(\d)\1+$/.test(zap));
  marca($('f-empresa'), empresa.length < 2);
  $('f-autoriza').closest('.autoriza').classList.toggle('invalido', !autorizou);
  if (!autorizou) invalidos.push($('f-autoriza'));
  const erro = $('form-erro');
  if (invalidos.length) {
    erro.hidden = false;
    erro.textContent = !autorizou && invalidos.length === 1 ? 'Falta marcar a autorização.' : 'Confira os campos marcados.';
    invalidos[0].focus();
    return;
  }
  erro.hidden = true;

  const contato = {
    nome, whatsapp: zap, empresa,
    segmento: segmento === c.segmentos[c.segmentos.length - 1] && outro ? `${segmento}: ${outro}` : segmento,
    faturamento: fat, autorizou,
  };
  const btn = $('enviar');
  btn.setAttribute('aria-busy', 'true');
  try {
    const r = await fetch(RT.servidor, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessao: estado.sessao, visitor_id: visitorId(), respostas: estado.respostas, contato,
        pagina: location.origin + location.pathname, url: location.href, referrer: document.referrer || '', ...utms(),
      }),
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.ok) throw new Error(j.erro || 'falhou');
    estado.enviado = true;
    estado.contato = { nome, empresa };
    salvar();
    try {
      window.fbq && window.fbq('track', 'Lead');
      window.gtag && window.gtag('event', 'generate_lead');
    } catch (_) { /* idem */ }
    irResultado();
  } catch (_) {
    erro.hidden = false;
    erro.textContent = c.erro;
  } finally {
    btn.removeAttribute('aria-busy');
  }
}

/* ── resultado ── */
function irResultado() {
  const r = calcular(cfg, estado.respostas);
  const R = cfg.resultado;
  $('r-rotulo-notas').textContent = R.rotuloNotas;
  const box = $('notas');
  box.textContent = '';
  for (const b of BLOCOS) {
    const el = document.createElement('div');
    const furo = !r.maquina && b === r.furo;
    el.className = 'nota' + (furo ? ' furo' : '');
    el.innerHTML = `${furo ? '<span class="nota-selo"></span>' : ''}<span class="nota-nome"></span><span class="nota-valor"><span></span><small>/10</small></span><span class="nota-pergunta"></span><span class="nota-pontos" aria-hidden="true"></span>`;
    if (furo) el.querySelector('.nota-selo').textContent = R.rotuloFuro;
    el.querySelector('.nota-nome').textContent = cfg.blocos[b].nome;
    el.querySelector('.nota-pergunta').textContent = cfg.blocos[b].pergunta;
    el.querySelector('.nota-valor span').textContent = notaTexto(r.notas[b]);
    const pontos = el.querySelector('.nota-pontos');
    const cheios = Math.floor(r.notas[b] + 1e-9);
    const meio = r.notas[b] - cheios >= 0.5;
    for (let i = 0; i < 10; i++) {
      const p = document.createElement('i');
      if (i < cheios) p.className = 'cheio';
      else if (i === cheios && meio) p.className = 'meio';
      pontos.append(p);
    }
    box.append(el);
  }
  const d = R.diagnosticos[r.diagnostico];
  titulo($('diag-titulo'), d.titulo);
  $('diag-texto').textContent = d.texto;
  montarVideo(d.video, R.videoReservado);
  mostrar('resultado', 'diag-titulo');
}

function montarVideo(url, reservado) {
  const v = $('video');
  v.textContent = '';
  if (!url) {
    const r = document.createElement('div');
    r.className = 'video-reservado';
    r.innerHTML = '<b aria-hidden="true">▶</b><span></span>';
    r.querySelector('span').textContent = reservado;
    v.append(r);
    return;
  }
  const yt = url.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (yt || vm) {
    const f = document.createElement('iframe');
    f.src = yt ? `https://www.youtube-nocookie.com/embed/${yt[1]}?rel=0&playsinline=1` : `https://player.vimeo.com/video/${vm[1]}`;
    f.allow = 'autoplay; fullscreen; picture-in-picture';
    f.allowFullscreen = true;
    f.title = reservado;
    v.append(f);
  } else {
    const el = document.createElement('video');
    el.src = url;
    el.controls = true;
    el.playsInline = true;
    el.preload = 'metadata';
    v.append(el);
  }
}

/* ── ligar ── */
montarAbertura();
montarCaptura();
document.title = cfg.compartilhamento.tituloAba;

$('comecar').addEventListener('click', () => {
  const b = $('comecar');
  if (b.classList.contains('indo')) return;
  if (!estado.iniciou) {
    estado.iniciou = true;
    evento('quiz_iniciado');
  }
  /* o disco desliza até a ponta antes de trocar de tela */
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  b.classList.add('indo');
  setTimeout(() => {
    b.classList.remove('indo');
    estado.pos = 0;
    mostrar('pergunta', 'pergunta-titulo');
    renderPergunta();
  }, calmo ? 0 : 430);
});
$('voltar').addEventListener('click', () => {
  if (estado.tela === 'captura') {
    estado.pos = TOTAL_PERGUNTAS - 1;
    mostrar('pergunta', 'pergunta-titulo');
    renderPergunta();
  } else if (estado.pos > 0) {
    estado.pos -= 1;
    salvar();
    renderPergunta();
  } else {
    mostrar('abertura');
  }
});

/* volta pra onde a pessoa estava, se recarregou a aba */
if (estado.tela === 'resultado' && estado.enviado) irResultado();
else if (estado.tela === 'captura' && sequencia(cfg, estado.respostas).completo) irCaptura();
else if (estado.tela === 'pergunta' && estado.iniciou) { mostrar('pergunta'); renderPergunta(); }
else mostrar('abertura');
