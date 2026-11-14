// Cada campo contém: nome na API, rótulo, tipo e se é obrigatório.
// Para um select, o quinto item contém as opções.
const cadastros = {
  areas: {
    titulo: 'Áreas', colunas: ['id', 'nome'],
    campos: [['nome', 'Nome', 'select', true, ['A', 'B', 'C', 'D']]]
  },
  microareas: {
    titulo: 'Microáreas', colunas: ['id', 'area_id', 'cidade', 'bairro', 'ativa'],
    campos: [
      ['area_id', 'ID da área', 'number', true], ['descricao', 'Descrição', 'text'],
      ['cidade', 'Cidade', 'text', true], ['bairro', 'Bairro', 'text', true],
      ['cep', 'CEP', 'text'], ['complemento', 'Complemento', 'textarea'],
      ['ativa', 'Ativa', 'boolean']
    ]
  },
  ruas: {
    titulo: 'Ruas', colunas: ['id', 'microarea_id', 'numero', 'nome'],
    campos: [
      ['microarea_id', 'ID da microárea', 'number', true],
      ['numero', 'Número da rua (1 a 40)', 'number', true], ['nome', 'Nome', 'text', true]
    ]
  },
  familia: {
    titulo: 'Famílias', colunas: ['id', 'ruas_id', 'numero', 'responsavel', 'ativa'],
    campos: [
      ['ruas_id', 'ID da rua', 'number', true], ['numero', 'Número da casa', 'number', true],
      ['complemento', 'Complemento', 'text'], ['responsavel', 'Responsável', 'text', true],
      ['ativa', 'Ativa', 'boolean']
    ]
  },
  agentes: {
    titulo: 'Agentes', colunas: ['id', 'nome', 'microarea_id', 'telefone', 'ativo'],
    campos: [
      ['microarea_id', 'ID da microárea', 'number', true], ['nome', 'Nome', 'text', true],
      ['cpf', 'CPF (11 dígitos)', 'text', true], ['telefone', 'Telefone', 'tel', true],
      ['email', 'Email', 'email'], ['data_cadastro', 'Data do cadastro', 'date'],
      ['ativo', 'Ativo', 'boolean']
    ]
  },
  pacientes: {
    titulo: 'Pacientes', colunas: ['id', 'nome', 'familia_id', 'telefone', 'ativo'],
    campos: [
      ['familia_id', 'ID da família', 'number', true], ['nome', 'Nome', 'text', true],
      ['cpf', 'CPF (11 dígitos)', 'text', true], ['carteira_sus', 'SUS (15 dígitos)', 'text', true],
      ['email', 'Email', 'email'], ['data_nasc', 'Data de nascimento', 'date', true],
      ['sexo', 'Sexo', 'select', true, ['M', 'F']], ['telefone', 'Telefone', 'tel', true],
      ['tipo_sanguineo', 'Tipo sanguíneo', 'select', false, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']],
      ['alergia', 'Alergias', 'textarea'], ['historico', 'Histórico clínico', 'textarea'],
      ['ativo', 'Ativo', 'boolean']
    ]
  },
  visitas: {
    titulo: 'Visitas', colunas: ['id', 'pacientes_id', 'agentes_id', 'data_visita', 'situacao'],
    campos: [
      ['pacientes_id', 'ID do paciente', 'number', true], ['agentes_id', 'ID do agente', 'number', true],
      ['data_visita', 'Data da visita', 'date', true],
      ['situacao', 'Situação', 'select', true, ['REALIZADA', 'AUSENTE', 'RECUSADA', 'REAGENDADA']],
      ['orientacao', 'Orientação', 'textarea'], ['historico', 'Ocorrências da visita', 'textarea'],
      ['encaminhamento', 'Encaminhamento', 'boolean'],
      ['descricao_encaminhamento', 'Descrição do encaminhamento', 'textarea'],
      ['prox_visita', 'Próxima visita', 'date'], ['observacao', 'Observação', 'textarea']
    ]
  }
};

let recurso = 'areas';
let pagina = 1;
let editandoId = null;
let carregamento = 0;
const formulario = document.getElementById('formulario');
const editor = document.getElementById('editor');
const mensagem = document.getElementById('mensagem');

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? 'erro' : '';
  mensagem.hidden = false;
}

// Todas as operações usam a API do mesmo servidor que entrega esta página.
async function chamarApi(caminho, metodo = 'GET', dados) {
  const opcoes = { method: metodo };
  if (dados) {
    opcoes.headers = { 'Content-Type': 'application/json' };
    opcoes.body = JSON.stringify(dados);
  }
  let resposta;
  try {
    resposta = await fetch('/api/' + caminho, opcoes);
  } catch {
    throw new Error('Não foi possível conectar. Verifique se o backend está funcionando.');
  }
  if (resposta.status === 204) return;
  const resultado = await resposta.json();
  if (!resposta.ok) {
    const detalhes = (resultado.errors || []).map(erro => erro.field + ': ' + erro.message);
    throw new Error([resultado.message || 'Não foi possível concluir a operação.', ...detalhes].join('\n'));
  }
  return resultado;
}

function nomeColuna(nome) {
  if (nome === 'id') return 'ID';
  return cadastros[recurso].campos.find(campo => campo[0] === nome)[1];
}

async function listar() {
  const pedido = ++carregamento;
  const tabela = document.getElementById('registros');
  const cabecalho = document.getElementById('cabecalho');
  const config = cadastros[recurso];
  document.getElementById('titulo').textContent = config.titulo;
  document.getElementById('descricao-tabela').textContent = 'Cadastros: ' + config.titulo;
  document.getElementById('anterior').disabled = true;
  document.getElementById('proxima').disabled = true;
  document.getElementById('resumo').textContent = 'Carregando...';
  tabela.replaceChildren();
  cabecalho.replaceChildren();
  const linhaTitulo = document.createElement('tr');
  for (const coluna of [...config.colunas, 'acoes']) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = coluna === 'acoes' ? 'Ações' : nomeColuna(coluna);
    linhaTitulo.appendChild(th);
  }
  cabecalho.appendChild(linhaTitulo);
  try {
    const resultado = await chamarApi(recurso + '?page=' + pagina + '&limit=10');
    if (pedido !== carregamento) return;
    // Se o último registro de uma página for excluído, volte uma página.
    if (resultado.data.length === 0 && pagina > 1) {
      pagina--;
      return listar();
    }
    for (const registro of resultado.data) {
      const linha = document.createElement('tr');
      for (const coluna of config.colunas) {
        const td = document.createElement('td');
        const valor = registro[coluna];
        td.textContent = typeof valor === 'boolean' ? (valor ? 'Sim' : 'Não') : (valor ?? '—');
        linha.appendChild(td);
      }
      const acoes = document.createElement('td');
      const grupo = document.createElement('div');
      grupo.className = 'acoes';
      const editar = document.createElement('button');
      editar.textContent = 'Editar';
      editar.onclick = () => abrirFormulario(registro);
      const excluir = document.createElement('button');
      excluir.textContent = 'Excluir';
      excluir.className = 'excluir';
      excluir.onclick = () => excluirRegistro(registro.id, excluir);
      grupo.append(editar, excluir);
      acoes.appendChild(grupo);
      linha.appendChild(acoes);
      tabela.appendChild(linha);
    }
    if (!resultado.data.length) {
      const linha = tabela.insertRow();
      const celula = linha.insertCell();
      celula.colSpan = config.colunas.length + 1;
      celula.className = 'vazio';
      celula.textContent = 'Nenhum cadastro por aqui. Clique em “Novo cadastro” para começar.';
    }
    document.getElementById('resumo').textContent = resultado.total + ' registro(s) · Página ' + pagina + ' de ' + Math.max(1, resultado.totalPages);
    document.getElementById('anterior').disabled = pagina <= 1;
    document.getElementById('proxima').disabled = pagina >= resultado.totalPages;
  } catch (erro) {
    if (pedido !== carregamento) return;
    document.getElementById('resumo').textContent = 'Não foi possível carregar os registros.';
    avisar(erro.message, true);
  }
}

function abrirFormulario(registro = null) {
  editandoId = registro ? registro.id : null;
  document.getElementById('titulo-formulario').textContent = registro ? 'Editar cadastro #' + registro.id : 'Novo cadastro · ' + cadastros[recurso].titulo;
  const campos = document.getElementById('campos');
  campos.replaceChildren();
  for (const [nome, titulo, tipo, obrigatorio, opcoes] of cadastros[recurso].campos) {
    const label = document.createElement('label');
    label.textContent = titulo + (obrigatorio ? ' *' : '');
    const input = document.createElement(tipo === 'select' || tipo === 'boolean' ? 'select' : tipo === 'textarea' ? 'textarea' : 'input');
    input.name = nome;
    input.id = 'campo-' + nome;
    input.required = Boolean(obrigatorio);
    if (tipo === 'select' || tipo === 'boolean') {
      const valores = tipo === 'boolean' ? ['true', 'false'] : ['', ...opcoes];
      for (const valor of valores) {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = tipo === 'boolean' ? (valor === 'true' ? 'Sim' : 'Não') : (valor || 'Selecione');
        input.appendChild(option);
      }
    } else if (tipo !== 'textarea') {
      input.type = tipo;
    }
    if (tipo === 'number') {
      input.step = '1';
      input.max = '2147483647';
      input.min = nome.endsWith('_id') ? '1' : '-2147483648';
      if (recurso === 'ruas' && nome === 'numero') { input.min = '1'; input.max = '40'; }
    }
    if (nome === 'cpf' || nome === 'carteira_sus') {
      const tamanho = nome === 'cpf' ? 11 : 15;
      input.pattern = '[0-9]{' + tamanho + '}';
      input.maxLength = tamanho;
      input.inputMode = 'numeric';
      input.title = 'Informe ' + tamanho + ' dígitos sem pontuação';
    }
    if (tipo === 'textarea') label.className = 'campo-longo';
    if (registro) input.value = registro[nome] ?? '';
    else if (tipo === 'boolean') input.value = nome === 'encaminhamento' ? 'false' : 'true';
    label.appendChild(input);
    campos.appendChild(label);
  }
  atualizarRegrasVisita();
  editor.hidden = false;
  campos.querySelector('input, select, textarea').focus();
}

function atualizarRegrasVisita() {
  if (recurso !== 'visitas') return;
  const encaminhamento = formulario.elements.namedItem('encaminhamento');
  const descricao = formulario.elements.namedItem('descricao_encaminhamento');
  const data = formulario.elements.namedItem('data_visita');
  const proxima = formulario.elements.namedItem('prox_visita');
  descricao.required = encaminhamento.value === 'true';
  proxima.min = data.value;
}
formulario.addEventListener('change', atualizarRegrasVisita);

formulario.addEventListener('submit', async function (evento) {
  evento.preventDefault();
  const dados = {};
  for (const [nome, , tipo] of cadastros[recurso].campos) {
    const valor = formulario.elements.namedItem(nome).value.trim();
    if (nome === 'data_cadastro' && !valor) continue; // O banco aplica a data padrão.
    dados[nome] = tipo === 'boolean' ? valor === 'true' : tipo === 'number' ? Number(valor) : (valor || null);
  }
  bloquear(true);
  try {
    await chamarApi(recurso + (editandoId ? '/' + editandoId : ''), editandoId ? 'PATCH' : 'POST', dados);
    editor.hidden = true;
    avisar('Cadastro salvo com sucesso.');
    await listar();
  } catch (erro) {
    avisar(erro.message, true);
  } finally { bloquear(false); }
});

async function excluirRegistro(id, botao) {
  if (!confirm('Excluir o cadastro #' + id + '? Esta ação não pode ser desfeita.')) return;
  bloquear(true);
  botao.disabled = true;
  try {
    await chamarApi(recurso + '/' + id, 'DELETE');
    editor.hidden = true;
    avisar('Cadastro excluído.');
    await listar();
  } catch (erro) {
    avisar(erro.message, true);
  } finally { bloquear(false); botao.disabled = false; }
}

// Evita trocar o cadastro enquanto uma alteração está sendo enviada.
function bloquear(bloqueado) {
  document.querySelectorAll('nav button, #novo, #salvar, #cancelar, .acoes button').forEach(botao => {
    botao.disabled = bloqueado;
  });
  formulario.querySelectorAll('input, select, textarea').forEach(campo => { campo.disabled = bloqueado; });
}

document.querySelectorAll('nav button').forEach(botao => {
  botao.onclick = function () {
    recurso = botao.dataset.recurso;
    pagina = 1;
    editor.hidden = true;
    mensagem.hidden = true;
    document.querySelectorAll('nav button').forEach(item => {
      item.classList.toggle('selecionado', item === botao);
      item.setAttribute('aria-pressed', String(item === botao));
    });
    listar();
  };
});
document.getElementById('novo').onclick = () => abrirFormulario();
document.getElementById('cancelar').onclick = () => { editor.hidden = true; document.getElementById('novo').focus(); };
document.getElementById('anterior').onclick = () => { pagina--; listar(); };
document.getElementById('proxima').onclick = () => { pagina++; listar(); };
listar();
