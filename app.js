/**********************
 * VARIÁVEIS GLOBAIS
 **********************/
let professorLogado = localStorage.getItem("professorLogado") || null;

let unidadeAtual = JSON.parse(localStorage.getItem("unidadeAtual")) || null;

let turmas = [];
let turmaAtiva = null;
let alunos = [];

let historico = [];
let aulaAtual = null;
let aulaNumeroAtual = null;

let pesosConceito = JSON.parse(localStorage.getItem("pesosConceito")) || {
  A: 1, B: 0.8, C: 0.6, D: 0.4, E: 0.2, SR: 0, F: 0
};

/**********************
 * CHAVES PADRÃO
 **********************/
function chaveTurmas() {
  return `prof_${professorLogado}_turmas`;
}
function chaveHistorico() {
  return `prof_${professorLogado}_historico`;
}
function chaveTurmaAtiva() {
  return `prof_${professorLogado}_turmaAtiva`;
}

const alunosDiv = document.getElementById("alunos");


/**********************
 * LOGIN
 **********************/
function login() {
  const nome = loginNome.value.trim();
  const senha = loginSenha.value.trim();
  if (!nome || !senha) return alert("Preencha nome e senha.");

  professorLogado = nome;
  localStorage.setItem("professorLogado", professorLogado);

  carregarDadosProfessor();
  mostrarAba("inicio");
}

function logout() {
  localStorage.removeItem("professorLogado");
  location.reload();
}

/**********************
 * CARREGAMENTO INICIAL
 **********************/
function carregarDadosProfessor() {
  turmas = JSON.parse(localStorage.getItem(chaveTurmas())) || [];
  historico = JSON.parse(localStorage.getItem(chaveHistorico())) || [];
  turmaAtiva = localStorage.getItem(chaveTurmaAtiva());
  carregarSelectTurmas();
  if (turmaAtiva) selecionarTurma(turmaAtiva);
  atualizarPainel();
}

/**********************
 * ABAS
 **********************/
window.mostrarAba = function (id) {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(id).style.display = "block";

  const aba = document.getElementById(id);
  if (aba) aba.classList.add("ativa");

  if (id === "aulas") listarAulas();
  if (id === "relatorios") gerarRelatorioTurma();
};


/**********************
 * UNIDADE
 **********************/
function exigirUnidade() {
  if (!unidadeAtual) {
    alert("Cadastre a unidade primeiro.");
    mostrarAba("unidade");
    return false;
  }
  return true;
}

function salvarUnidade() {
  const nome = document.getElementById("nomeUnidade").value.trim();
  const valor = Number(document.getElementById("valorUnidade").value);

  if (!nome || !valor) {
    alert("Preencha todos os campos da unidade.");
    return;
  }

  unidadeAtual = {
    nome,
    valor,
    totalAulas: unidadeAtual?.totalAulas || 0
  };

  localStorage.setItem("unidadeAtual", JSON.stringify(unidadeAtual));
  carregarUnidade();

  alert("Unidade salva com sucesso!");
}


function carregarUnidade() {
  const salva = localStorage.getItem("unidadeAtual");

  if (salva) {
    unidadeAtual = JSON.parse(salva);

    // Atualiza visual
    document.getElementById("resumoUnidade").textContent =
      `${unidadeAtual.nome} (valor ${unidadeAtual.valor})`;
  } else {
    unidadeAtual = null;
    document.getElementById("resumoUnidade").textContent = "Nenhuma";
  }
}


/**********************
 * TURMAS
 **********************/
function salvarTurma() {
  if (!exigirUnidade()) return;

  const nome = turmaNome.value.trim();
  const lista = alunosTexto.value.split("\n").filter(a => a.trim());

  if (!nome || lista.length === 0) {
    alert("Informe turma e alunos.");
    return;
  }

  turmas.push({ nome, alunos: lista });
  localStorage.setItem(chaveTurmas(), JSON.stringify(turmas));

  selecionarTurma(nome);

  turmaNome.value = "";
  alunosTexto.value = "";
}

function selecionarTurma(nome) {
  const t = turmas.find(t => t.nome === nome);
  if (!t) return;

  turmaAtiva = nome;
  alunos = [...t.alunos];

  localStorage.setItem(chaveTurmaAtiva(), turmaAtiva);

  turmaAtivaNome.textContent = turmaAtiva;
  listarAlunos();
  listarAulas();
  atualizarPainel();
}

function carregarSelectTurmas() {
  selectTurma.innerHTML = "<option value=''>-- Selecione --</option>";
  turmas.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.nome;
    opt.textContent = t.nome;
    if (t.nome === turmaAtiva) opt.selected = true;
    selectTurma.appendChild(opt);
  });
}

function trocarTurma() {
  const nome = selectTurma.value;
  if (!nome) return;

  selecionarTurma(nome);
}

function editarTurma() {
  if (!turmaAtiva) {
    alert("Selecione uma turma.");
    return;
  }

  const turma = turmas.find(t => t.nome === turmaAtiva);
  if (!turma) return;

  const novoNome = prompt("Nome da turma:", turma.nome);
  if (!novoNome) return;

  const alunosEditados = prompt(
    "Alunos (um por linha):",
    turma.alunos.join("\n")
  );

  if (!alunosEditados) return;

  const novosAlunos = alunosEditados
    .split("\n")
    .map(a => a.trim())
    .filter(a => a);

  const nomeAntigo = turma.nome;

  turma.nome = novoNome;
  turma.alunos = novosAlunos;

  // atualiza histórico
  historico.forEach(h => {
    if (h.turma === nomeAntigo) {
      h.turma = novoNome;
    }
  });

  turmaAtiva = novoNome;
  alunos = [...novosAlunos];

  localStorage.setItem(chaveTurmas(), JSON.stringify(turmas));
  localStorage.setItem(chaveHistorico(), JSON.stringify(historico));
  localStorage.setItem(chaveTurmaAtiva(), turmaAtiva);

  carregarSelectTurmas();
  selecionarTurma(turmaAtiva);

  alert("Turma editada com sucesso!");
}

function editarAlunos() {
  if (!turmaAtiva) {
    alert("Selecione uma turma.");
    return;
  }

  const turma = turmas.find(t => t.nome === turmaAtiva);
  if (!turma) return;

  const lista = turma.alunos
    .map((a, i) => `${i + 1}. ${a}`)
    .join("\n");

  const escolha = prompt(
    "Digite o número do aluno para editar:\n\n" + lista
  );

  const index = Number(escolha) - 1;
  if (isNaN(index) || !turma.alunos[index]) return;

  const novoNome = prompt(
    "Novo nome do aluno:",
    turma.alunos[index]
  );

  if (!novoNome) return;

  const antigo = turma.alunos[index];
  turma.alunos[index] = novoNome;

  // atualiza histórico
  historico.forEach(h => {
    if (h.turma === turmaAtiva) {
      h.registros.forEach(r => {
        if (r.aluno === antigo) {
          r.aluno = novoNome;
        }
      });
    }
  });

  alunos = [...turma.alunos];

  localStorage.setItem(chaveTurmas(), JSON.stringify(turmas));
  localStorage.setItem(chaveHistorico(), JSON.stringify(historico));

  selecionarTurma(turmaAtiva);

  alert("Aluno atualizado!");
}

function clonarTurma() {
  if (!turmaAtiva) {
    alert("Selecione uma turma.");
    return;
  }

  const turma = turmas.find(t => t.nome === turmaAtiva);
  if (!turma) return;

  const novoNome = prompt(
    "Nome da turma clonada:",
    turma.nome + " (Cópia)"
  );

  if (!novoNome) return;

  turmas.push({
    nome: novoNome,
    alunos: [...turma.alunos]
  });

  localStorage.setItem(chaveTurmas(), JSON.stringify(turmas));

  carregarSelectTurmas();
  selecionarTurma(novoNome);

  alert("Turma clonada com sucesso!");
}

function excluirTurma() {
  if (!turmaAtiva) {
    alert("Selecione uma turma.");
    return;
  }

  const confirmar = confirm(
    `Tem certeza que deseja excluir a turma "${turmaAtiva}"?\n\nEssa ação NÃO pode ser desfeita.`
  );

  if (!confirmar) return;

  turmas = turmas.filter(t => t.nome !== turmaAtiva);
  historico = historico.filter(h => h.turma !== turmaAtiva);

  localStorage.setItem(chaveTurmas(), JSON.stringify(turmas));
  localStorage.setItem(chaveHistorico(), JSON.stringify(historico));
  localStorage.removeItem(chaveTurmaAtiva());

  turmaAtiva = null;
  alunos = [];

  carregarSelectTurmas();
  mostrarAba("turma");

  alert("Turma excluída.");
}



/**********************
 * AULAS
 **********************/
function salvarAula() {
  if (!exigirUnidade() || !turmaAtiva) {
    alert("Selecione uma turma.");
    return;
  }

  aulaAtual = {
    nome: aula.value,
    conteudo: conteudo.value,
    data: data.value
  };

  if (!aulaAtual.nome || !aulaAtual.data) {
    alert("Preencha todos os campos da aula.");
    return;
  }

  unidadeAtual.totalAulas++;
  aulaNumeroAtual = unidadeAtual.totalAulas;

  historico.push({
    turma: turmaAtiva,
    aula: aulaAtual,
    aulaNumero: aulaNumeroAtual,
    registros: []
  });

  localStorage.setItem("unidadeAtual", JSON.stringify(unidadeAtual));
  localStorage.setItem(chaveHistorico(), JSON.stringify(historico));

  mostrarAba("acompanhamento");
  carregarAlunos();
  atualizarPainel();
}

function listarAulas() {
  listaAulas.innerHTML = "";

  const aulas = historico
    .filter(h => h.turma === turmaAtiva)
    .sort((a, b) => a.aulaNumero - b.aulaNumero);

  if (!aulas.length) {
    listaAulas.innerHTML = "<li>Nenhuma aula registrada.</li>";
    return;
  }

  aulas.forEach((item, index) => {
    const li = document.createElement("li");
    li.textContent = `Aula ${item.aulaNumero} - ${item.aula.nome}`;
    if (index === aulas.length - 1) {
      li.style.fontWeight = "bold";
      li.style.background = "#e8f5e9";
    }
    listaAulas.appendChild(li);
  });
}

/**********************
 * ACOMPANHAMENTO
 **********************/
function carregarAlunos() {
  alunosDiv.innerHTML = "";
  alunos.forEach(nome => {
    alunosDiv.innerHTML += `
      <div>
        ${nome}
        <select>
          <option>A</option><option>B</option><option>C</option>
          <option>D</option><option>E</option><option>SR</option><option>F</option>
        </select>
      </div>`;
  });
}

function salvarAcompanhamento() {
  const selects = document.querySelectorAll("#alunos select");

  const registros = [];
  selects.forEach((s, i) => {
    registros.push({ aluno: alunos[i], conceito: s.value });
  });

  const aula = historico.find(
    h => h.turma === turmaAtiva && h.aulaNumero === aulaNumeroAtual
  );

  aula.registros = registros;
  localStorage.setItem(chaveHistorico(), JSON.stringify(historico));

  alert("Acompanhamento salvo!");
}

/**********************
 * RELATÓRIO
 **********************/
function gerarRelatorioTurma() {
  tabelaTurma.innerHTML = "";
  cabecalhoRelatorio.innerHTML = "";
  nomeTurmaRelatorio.textContent = turmaAtiva || "Nenhuma";

  if (!turmaAtiva) return;

  const aulas = historico.filter(h => h.turma === turmaAtiva);
  if (!aulas.length) return;

  const valorPorAula = unidadeAtual.valor / aulas.length;

  cabecalhoRelatorio.innerHTML = "<th>Aluno</th>";
  aulas.forEach(a => {
    cabecalhoRelatorio.innerHTML += `<th>Aula ${a.aulaNumero}</th>`;
  });
  cabecalhoRelatorio.innerHTML += "<th>Total</th>";

  alunos.forEach(aluno => {
    let soma = 0;
    let html = `<td>${aluno}</td>`;

    aulas.forEach(aula => {
      const reg = aula.registros.find(r => r.aluno === aluno);
      const conceito = reg ? reg.conceito : "SR";
      const nota = pesosConceito[conceito] * valorPorAula;
      soma += nota;

      html += `<td>${conceito}<br><small>${nota.toFixed(1)}</small></td>`;
    });

    html += `<td><strong>${soma.toFixed(1)}</strong></td>`;
    const tr = document.createElement("tr");
    tr.innerHTML = html;
    tabelaTurma.appendChild(tr);
  });
}

// 🔓 EXPOR FUNÇÕES PARA O HTML (necessário no mobile)
window.mostrarAba = mostrarAba;
window.salvarUnidade = salvarUnidade;
window.salvarTurma = salvarTurma;
window.salvarAula = salvarAula;
window.salvarAcompanhamento = salvarAcompanhamento;
window.trocarTurma = trocarTurma;
window.login = login;
window.logout = logout;

/**********************
 * INIT
 **********************/
window.onload = () => {
  const salvo = localStorage.getItem("professorLogado");

  if (!salvo) {
    mostrarAba("login");
    return;
  }

  professorLogado = salvo;

  // carrega dados persistidos
  carregarDadosProfessor();
  carregarSelectTurmas();

  // restaura unidade na interface
  if (unidadeAtual) {
    resumoUnidade.textContent = unidadeAtual.nome;
  }

  mostrarAba("inicio");
};
