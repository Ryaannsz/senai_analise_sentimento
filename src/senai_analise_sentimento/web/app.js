const formulario = document.getElementById("formulario");
const campo = document.getElementById("texto");
const botao = document.getElementById("analisar");
const limpar = document.getElementById("limpar");
const erro = document.getElementById("erro");
const resultado = document.getElementById("resultado");
const sentimento = document.getElementById("sentimento");
const barra = document.getElementById("medidor-barra");
const confiancaTexto = document.getElementById("confianca-texto");

const MINIMO = 3;

function mostrarErro(mensagem) {
  erro.textContent = mensagem;
  erro.hidden = false;
  campo.setAttribute("aria-invalid", "true");
}

function esconderErro() {
  erro.hidden = true;
  erro.textContent = "";
  campo.removeAttribute("aria-invalid");
}

function definirHumor(humor) {
  document.body.dataset.humor = humor;
}

function mostrarResultado({ sentimento: rotulo, confianca }) {
  const porcentagem = Math.round(confianca * 100);
  definirHumor(rotulo);
  sentimento.textContent = rotulo;
  confiancaTexto.textContent = `${porcentagem}% de confiança`;
  resultado.hidden = false;
  barra.style.width = "0";
  requestAnimationFrame(() => {
    barra.style.width = `${porcentagem}%`;
  });
  limpar.hidden = false;
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  resultado.scrollIntoView({ behavior: semMovimento ? "auto" : "smooth", block: "nearest" });
}

function reiniciar() {
  definirHumor("neutro");
  resultado.hidden = true;
  limpar.hidden = true;
  campo.value = "";
  esconderErro();
  campo.focus();
}

async function mensagemDoErro(resposta) {
  if (resposta.status === 422) {
    return `Escreva pelo menos ${MINIMO} caracteres e no máximo 1000.`;
  }
  try {
    const corpo = await resposta.json();
    if (typeof corpo.detail === "string") return corpo.detail;
  } catch {
    // corpo sem JSON: usa a mensagem padrão abaixo
  }
  return `A API respondeu com erro ${resposta.status}. Tente de novo em instantes.`;
}

async function analisar() {
  const texto = campo.value.trim();
  if (texto.length < MINIMO) {
    mostrarErro(`Escreva pelo menos ${MINIMO} caracteres para o modelo ter o que ler.`);
    campo.focus();
    return;
  }

  esconderErro();
  botao.disabled = true;
  botao.textContent = "Analisando…";

  try {
    const resposta = await fetch("/sentimento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texto }),
    });
    if (!resposta.ok) {
      mostrarErro(await mensagemDoErro(resposta));
      return;
    }
    mostrarResultado(await resposta.json());
  } catch {
    mostrarErro("Não foi possível falar com a API. Confira se o servidor está rodando.");
  } finally {
    botao.disabled = false;
    botao.textContent = "Analisar sentimento";
  }
}

formulario.addEventListener("submit", (evento) => {
  evento.preventDefault();
  analisar();
});

campo.addEventListener("keydown", (evento) => {
  if (evento.key === "Enter" && (evento.ctrlKey || evento.metaKey)) {
    evento.preventDefault();
    analisar();
  }
});

campo.addEventListener("input", () => {
  if (!erro.hidden) esconderErro();
});

limpar.addEventListener("click", reiniciar);
