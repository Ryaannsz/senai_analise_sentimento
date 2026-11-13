const campo = document.getElementById("texto");
const limpar = document.getElementById("limpar");
const dica = document.getElementById("dica");
const erro = document.getElementById("erro");
const resultado = document.getElementById("resultado");
const sentimento = document.getElementById("sentimento");
const chance = document.getElementById("chance");
const raiz = document.documentElement;

const NEUTRO = 0.5;
const FAIXA_NEUTRA = 0.1; // entre 40% e 60% de chance o texto é tratado como neutro
const MINIMO_HTTP = 3; // a rota HTTP exige pelo menos 3 caracteres

const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");

/* Cores */

// Escala do humor: 0 = negativo, 1 = positivo. Mesmas cores do styles.css.
const ESCALA = [
  [0, "#b3261e"],
  [0.25, "#e8573a"],
  [0.5, "#f2b33d"],
  [0.75, "#7cc46a"],
  [1, "#17723f"],
].map(([posicao, hex]) => [posicao, hexParaRgb(hex)]);

const TINTA_ESCURA = hexParaRgb("#1d1a16");
const TINTA_CLARA = hexParaRgb("#fffaf2");

function hexParaRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbParaCss([r, g, b]) {
  return `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)})`;
}

function limitar(valor) {
  return Math.min(1, Math.max(0, valor));
}

function corDoHumor(humor) {
  const h = limitar(humor);
  for (let i = 1; i < ESCALA.length; i++) {
    const [fim, corFim] = ESCALA[i];
    if (h <= fim) {
      const [inicio, corInicio] = ESCALA[i - 1];
      const t = (h - inicio) / (fim - inicio);
      return corInicio.map((canal, c) => canal + (corFim[c] - canal) * t);
    }
  }
  return ESCALA[ESCALA.length - 1][1];
}

function luminancia(rgb) {
  const [r, g, b] = rgb.map((canal) => {
    const s = canal / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/* Texto do resultado */

function rotulo(chancePositivo) {
  if (chancePositivo >= NEUTRO + FAIXA_NEUTRA) return "positivo";
  if (chancePositivo <= NEUTRO - FAIXA_NEUTRA) return "negativo";
  return "neutro";
}

function trocarPalavra(novoRotulo) {
  if (sentimento.textContent === novoRotulo) return;
  sentimento.textContent = novoRotulo;
  sentimento.classList.remove("trocando");
  void sentimento.offsetWidth; // reinicia a animação de troca
  sentimento.classList.add("trocando");
}

/* Pintura: tudo que depende do humor exibido é atualizado aqui, a cada quadro. */

let tintaAtual = null;
let porcentagemAtual = null;

function pintar(humorBruto) {
  const humor = limitar(humorBruto);
  const fundo = corDoHumor(humor);

  raiz.style.setProperty("--humor", humor.toFixed(4));
  raiz.style.setProperty("--fundo", rgbParaCss(fundo));
  raiz.style.setProperty("--nuvem-1", rgbParaCss(corDoHumor(humor - 0.18)));
  raiz.style.setProperty("--nuvem-2", rgbParaCss(corDoHumor(humor + 0.06)));
  raiz.style.setProperty("--nuvem-3", rgbParaCss(corDoHumor(humor + 0.18)));

  const tinta = contraste(fundo, TINTA_ESCURA) >= contraste(fundo, TINTA_CLARA) ? "escura" : "clara";
  if (tinta !== tintaAtual) {
    tintaAtual = tinta;
    raiz.style.setProperty("--tinta", rgbParaCss(tinta === "escura" ? TINTA_ESCURA : TINTA_CLARA));
  }

  if (!resultado.hidden) {
    const porcentagem = Math.round(humor * 100);
    if (porcentagem !== porcentagemAtual) {
      porcentagemAtual = porcentagem;
      chance.textContent = `${porcentagem}% de chance de ser positivo`;
    }
    trocarPalavra(rotulo(humor));
  }
}

/*
  Animação com mola: o humor exibido é puxado até o valor do modelo,
  com um leve embalo. Novas leituras chegam a cada tecla e a mola
  absorve as mudanças sem trancos.
*/

const RIGIDEZ = 90;
const AMORTECIMENTO = 2 * 0.78 * Math.sqrt(RIGIDEZ); // um pouco abaixo do crítico

let alvo = NEUTRO;
let posicao = NEUTRO;
let velocidade = 0;
let quadro = null;
let ultimoTempo = 0;

function passo(agora) {
  const dt = Math.min((agora - ultimoTempo) / 1000, 1 / 30);
  ultimoTempo = agora;

  const aceleracao = RIGIDEZ * (alvo - posicao) - AMORTECIMENTO * velocidade;
  velocidade += aceleracao * dt;
  posicao += velocidade * dt;

  const parado = Math.abs(alvo - posicao) < 0.0005 && Math.abs(velocidade) < 0.0005;
  if (parado) {
    posicao = alvo;
    velocidade = 0;
  }
  pintar(posicao);
  quadro = parado ? null : requestAnimationFrame(passo);
}

function irPara(novoAlvo) {
  alvo = limitar(novoAlvo);
  if (semMovimento.matches) {
    posicao = alvo;
    velocidade = 0;
    pintar(posicao);
    return;
  }
  if (quadro === null) {
    ultimoTempo = performance.now();
    quadro = requestAnimationFrame(passo);
  }
}

/* Mensagens */

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.hidden = false;
}

function esconderErro() {
  erro.hidden = true;
  erro.textContent = "";
}

function receberLeitura(chancePositivo) {
  if (campo.value.trim() === "") return;
  esconderErro();
  if (resultado.hidden) {
    resultado.hidden = false;
    dica.hidden = true;
    porcentagemAtual = null;
  }
  irPara(chancePositivo);
}

/* Conexão ao vivo (WebSocket), com HTTP como reserva enquanto ela não abre. */

let socket = null;
let idEnviado = 0;
let idRecebido = 0;
let tentativas = 0;

function conectar() {
  const protocolo = location.protocol === "https:" ? "wss" : "ws";
  socket = new WebSocket(`${protocolo}://${location.host}/ws/sentimento`);

  socket.addEventListener("open", () => {
    tentativas = 0;
    if (campo.value.trim()) enviar();
  });

  socket.addEventListener("message", (evento) => {
    const dados = JSON.parse(evento.data);
    if (dados.erro) {
      mostrarErro(dados.erro);
      return;
    }
    if (dados.id <= idRecebido) return; // resposta antiga chegou atrasada
    idRecebido = dados.id;
    receberLeitura(dados.positivo);
  });

  socket.addEventListener("close", () => {
    socket = null;
    const espera = Math.min(500 * 2 ** tentativas, 8000);
    tentativas += 1;
    setTimeout(conectar, espera);
  });
}

let pedidoHttp = null;

async function enviarPorHttp(texto) {
  if (texto.length < MINIMO_HTTP) return;
  pedidoHttp?.abort();
  pedidoHttp = new AbortController();
  try {
    const resposta = await fetch("/sentimento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
      signal: pedidoHttp.signal,
    });
    if (!resposta.ok) {
      const corpo = await resposta.json().catch(() => ({}));
      mostrarErro(typeof corpo.detail === "string" ? corpo.detail : `A API respondeu com erro ${resposta.status}.`);
      return;
    }
    const { sentimento: classe, confianca } = await resposta.json();
    receberLeitura(classe === "positivo" ? confianca : 1 - confianca);
  } catch (falha) {
    if (falha.name !== "AbortError") {
      mostrarErro("Não foi possível falar com a API. Confira se o servidor está rodando.");
    }
  }
}

function enviar() {
  const texto = campo.value.trim();
  if (socket?.readyState === WebSocket.OPEN) {
    idEnviado += 1;
    socket.send(JSON.stringify({ id: idEnviado, texto }));
  } else {
    enviarPorHttp(texto);
  }
}

campo.addEventListener("input", () => {
  limpar.hidden = campo.value.length === 0;

  if (campo.value.trim() === "") {
    pedidoHttp?.abort();
    esconderErro();
    resultado.hidden = true;
    dica.hidden = false;
    irPara(NEUTRO);
    return;
  }

  enviar();
});

limpar.addEventListener("click", () => {
  campo.value = "";
  campo.dispatchEvent(new Event("input"));
  campo.focus();
});

pintar(posicao);
conectar();
