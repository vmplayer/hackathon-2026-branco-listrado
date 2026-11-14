// Cada campo contém: nome na API, rótulo, tipo e se é obrigatório.
// Para um select, o quinto item contém as opções.
const cadastros = {
  cidades: {
    titulo: 'Cidades', colunas: ['id', 'nome'],
    campos: [['nome', 'Nome da cidade', 'text', true]]
  },
  microareas: {
    titulo: 'Microáreas', colunas: ['id', 'cidade_id', 'descricao', 'observacao', 'ativa'],
    campos: [
      ['cidade_id', 'Cidade', 'relation', true, 'cidades'],
      ['descricao', 'Descrição', 'text'], ['observacao', 'Observação', 'textarea'],
      ['ativa', 'Ativa', 'boolean']
    ]
  },
  familia: {
    titulo: 'Famílias', colunas: ['id', 'microarea_id', 'endereco', 'numero', 'bairro', 'cep', 'responsavel'],
    campos: [
      ['microarea_id', 'Microárea', 'relation', true, 'microareas'],
      ['descricao', 'Descrição', 'text'], ['endereco', 'Endereço', 'text', true],
      ['numero', 'Número', 'number', true], ['bairro', 'Bairro', 'text', true],
      ['cep', 'CEP', 'text'], ['responsavel', 'Responsável', 'text', true]
    ]
  },
  agentes: {
    titulo: 'Agentes', colunas: ['id', 'nome', 'microarea_id', 'telefone', 'ativo'],
    campos: [
      ['microarea_id', 'Microárea', 'relation', true, 'microareas'], ['nome', 'Nome', 'text', true],
      ['cpf', 'CPF (11 dígitos)', 'text', true], ['telefone', 'Telefone', 'tel', true],
      ['email', 'Email', 'email'], ['senha_acesso', 'Senha de acesso (mínimo 8 caracteres)', 'password'],
      ['data_cadastro', 'Data do cadastro', 'date'],
      ['ativo', 'Ativo', 'boolean']
    ]
  },
  pacientes: {
    titulo: 'Pacientes', colunas: ['id', 'nome', 'familia_id', 'endereco', 'telefone'],
    campos: [
      ['familia_id', 'Família', 'relation', true, 'familia'], ['nome', 'Nome', 'text', true],
      ['cpf', 'CPF (11 dígitos)', 'text', true], ['carteira_sus', 'SUS (15 dígitos)', 'text', true],
      ['email', 'Email', 'email'], ['endereco', 'Endereço', 'text', true], ['data_nasc', 'Data nasc.', 'date', true],
      ['sexo', 'Sexo', 'select', true, ['M', 'F']], ['telefone', 'Telefone', 'tel', true],
      ['tipo_sanguineo', 'Tipo sanguíneo', 'select', false, ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']],
      ['alergia', 'Alergias', 'textarea'], ['historico', 'Histórico clínico', 'textarea'],
      ['ativo', 'Ativo', 'boolean']
    ]
  },
  visitas: {
    titulo: 'Visitas', colunas: ['id', 'pacientes_id', 'agentes_id', 'data_visita', 'situacao'],
    campos: [
      ['pacientes_id', 'Paciente', 'relation', true, 'pacientes'], ['agentes_id', 'Agente', 'relation', true, 'agentes'],
      ['data_visita', 'Data da visita', 'date', true],
      ['situacao', 'Situação', 'select', true, ['IDOSO', 'CRIANCA', 'GESTANTE', 'ACAMADO', 'OUTRO']],
      ['orientacao', 'Orientação', 'textarea'], ['historico', 'Ocorrências da visita', 'textarea'],
      ['encaminhamento', 'Encaminhamento', 'boolean'],
      ['descricao_encaminhamento', 'Descrição do encaminhamento', 'textarea'],
      ['prox_visita', 'Próxima visita', 'date'], ['observacao', 'Observação', 'textarea']
    ]
  },
  medicos: {
    titulo: 'Médicos', colunas: ['id', 'nome', 'crm', 'crm_uf', 'especialidade', 'telefone', 'ativo'],
    campos: [
      ['nome', 'Nome', 'text', true], ['cpf', 'CPF (11 dígitos)', 'text', true],
      ['crm', 'CRM', 'text', true], ['crm_uf', 'UF do CRM', 'text', true],
      ['especialidade', 'Especialidade', 'text', true], ['telefone', 'Telefone', 'tel', true],
      ['email', 'Email', 'email'], ['senha_acesso', 'Senha de acesso (mínimo 8 caracteres)', 'password'],
      ['data_cadastro', 'Data do cadastro', 'date'],
      ['ativo', 'Ativo', 'boolean']
    ]
  },
  consultas: {
    titulo: 'Consultas', colunas: ['id', 'pacientes_id', 'medicos_id', 'data_ultima_visita', 'data_hora', 'status', 'motivo', 'data_registro'],
    campos: [
      ['pacientes_id', 'Paciente', 'relation', true, 'pacientes'], ['medicos_id', 'Médico', 'relation', true, 'medicos'],
      ['visitas_id', 'ID da visita', 'relation', false, 'visitas'], ['data_ultima_visita', 'Data da última visita', 'date'],
      ['data_hora', 'Data e hora', 'datetime-local', true],
      ['status', 'Status', 'select', true, ['AGENDADA', 'REALIZADA', 'CANCELADA', 'FALTOU']],
      ['motivo', 'Motivo', 'textarea', true], ['diagnostico', 'Diagnóstico', 'textarea'],
      ['prescricao', 'Prescrição', 'textarea'], ['retorno', 'Data de retorno', 'date'],
      ['observacao', 'Observação', 'textarea']
    ]
  }
};

let recurso = 'cidades';
let grupoAtual = 'cidades';
let pagina = 1;
let editandoId = null;
let carregamento = 0;
const formulario = document.getElementById('formulario');
const editor = document.getElementById('editor');
const mensagem = document.getElementById('mensagem');
const subnavegacao = document.getElementById('subnavegacao');
const perfilModal = document.getElementById('perfil-modal');
const recursosComPerfil = ['familia', 'visitas', 'pacientes', 'agentes', 'medicos'];
const relacionamentos = {};
let usuarioAtual = null;

const grupos = {
  cidades: [['cidades', 'Cidades'], ['microareas', 'Microáreas']],
  familia: [['familia', 'Famílias'], ['pacientes', 'Pacientes']],
  visitas: [['visitas', 'Visitas']],
  consultas: [['consultas', 'Consultas']],
  agentes: [['agentes', 'Agentes']],
  medicos: [['medicos', 'Médicos']]
};

function podeAlterar(recursoAtual) {
  if (!usuarioAtual) return false;
  if (usuarioAtual.perfil === 'ADMIN') return true;
  if (usuarioAtual.perfil === 'MEDICO') return ['familia', 'pacientes', 'visitas', 'consultas'].includes(recursoAtual);
  return ['familia', 'pacientes', 'visitas'].includes(recursoAtual);
}

function gruposPermitidos() {
  if (usuarioAtual?.perfil === 'ADMIN') return Object.keys(grupos);
  if (usuarioAtual?.perfil === 'MEDICO') return ['cidades', 'familia', 'visitas', 'consultas'];
  return ['cidades', 'familia', 'visitas'];
}

function aplicarPermissoes() {
  const permitidos = gruposPermitidos();
  document.querySelectorAll('nav button').forEach(botao => {
    botao.hidden = !permitidos.includes(botao.dataset.grupo);
  });
  document.getElementById('novo').hidden = !podeAlterar(recurso);
  document.getElementById('usuario-atual').textContent = usuarioAtual.nome + ' · ' + usuarioAtual.perfil;
}

function entrarNoApp() {
  document.getElementById('login-screen').hidden = true;
  document.querySelector('header').hidden = false;
  document.querySelector('main').hidden = false;
  const primeiroGrupo = gruposPermitidos()[0];
  grupoAtual = primeiroGrupo;
  recurso = grupos[primeiroGrupo][0][0];
  document.querySelectorAll('nav button').forEach(botao => {
    const selecionado = botao.dataset.grupo === primeiroGrupo;
    botao.classList.toggle('selecionado', selecionado);
    botao.setAttribute('aria-pressed', String(selecionado));
  });
  aplicarPermissoes();
  mostrarSubnavegacao();
  selecionarRecurso(recurso);
}

function avisar(texto, erro = false) {
  mensagem.textContent = texto;
  mensagem.className = erro ? 'erro' : '';
  mensagem.hidden = false;
}

function selecionarRecurso(novoRecurso) {
  recurso = novoRecurso;
  pagina = 1;
  editor.hidden = true;
  mensagem.hidden = true;
  document.getElementById('novo').hidden = !podeAlterar(recurso);
  subnavegacao.querySelectorAll('button').forEach(botao => {
    const selecionado = botao.dataset.recurso === recurso;
    botao.classList.toggle('selecionado', selecionado);
    botao.setAttribute('aria-pressed', String(selecionado));
  });
  listar();
}

function mostrarSubnavegacao() {
  subnavegacao.replaceChildren();
  const recursos = grupos[grupoAtual];
  if (recursos.length === 1) {
    subnavegacao.hidden = true;
    return;
  }
  subnavegacao.hidden = false;
  recursos.forEach(([nome, titulo]) => {
    const botao = document.createElement('button');
    botao.type = 'button';
    botao.dataset.recurso = nome;
    botao.textContent = titulo;
    botao.onclick = () => selecionarRecurso(nome);
    subnavegacao.appendChild(botao);
  });
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
  const campo = cadastros[recurso].campos.find(item => item[0] === nome);
  return campo ? campo[1] : nome.replaceAll('_', ' ');
}

function rotuloRelacionamento(recursoRelacionado, registro) {
  if (recursoRelacionado === 'cidades') return registro.nome;
  if (recursoRelacionado === 'microareas') return registro.descricao || 'Microárea #' + registro.id;
  if (recursoRelacionado === 'familia') return registro.responsavel || 'Família #' + registro.id;
  if (recursoRelacionado === 'pacientes' || recursoRelacionado === 'agentes' || recursoRelacionado === 'medicos') return registro.nome;
  if (recursoRelacionado === 'visitas') return registro.data_visita + ' · ' + registro.situacao;
  return '#' + registro.id;
}

async function carregarRelacionamento(recursoRelacionado) {
  if (relacionamentos[recursoRelacionado]) return;
  const registros = [];
  let paginaRelacionamento = 1;
  let totalPaginas = 1;
  do {
    const resultado = await chamarApi(recursoRelacionado + '?page=' + paginaRelacionamento + '&limit=100');
    registros.push(...resultado.data);
    totalPaginas = resultado.totalPages;
    paginaRelacionamento++;
  } while (paginaRelacionamento <= totalPaginas);
  relacionamentos[recursoRelacionado] = registros;
}

function recursosRelacionadosDoCadastro() {
  return cadastros[recurso].campos
    .filter(campo => campo[2] === 'relation')
    .map(campo => campo[4]);
}

function textoDaTabela(coluna, valor) {
  const campo = cadastros[recurso].campos.find(item => item[0] === coluna);
  if (campo && campo[2] === 'relation' && valor != null) {
    const registro = (relacionamentos[campo[4]] || []).find(item => item.id === valor);
    return registro ? rotuloRelacionamento(campo[4], registro) : 'ID ' + valor;
  }
  return typeof valor === 'boolean' ? (valor ? 'Sim' : 'Não') : (valor ?? '—');
}

async function buscarTodos(recursoRelacionado, filtros = {}) {
  const registros = [];
  let paginaRelacionamento = 1;
  let totalPaginas = 1;
  do {
    const parametros = new URLSearchParams({ page: String(paginaRelacionamento), limit: '100' });
    Object.entries(filtros).forEach(([chave, valor]) => parametros.set(chave, String(valor)));
    const resultado = await chamarApi(recursoRelacionado + '?' + parametros.toString());
    registros.push(...resultado.data);
    totalPaginas = resultado.totalPages;
    paginaRelacionamento++;
  } while (paginaRelacionamento <= totalPaginas);
  return registros;
}

function adicionarDetalhe(container, rotulo, valor) {
  const item = document.createElement('div');
  const titulo = document.createElement('strong');
  titulo.textContent = rotulo;
  const texto = document.createElement('span');
  texto.textContent = valor ?? '—';
  item.append(titulo, texto);
  container.appendChild(item);
}

function adicionarFeed(container, titulo, meta, texto) {
  const item = document.createElement('article');
  item.className = 'feed-item';
  const cabecalho = document.createElement('div');
  cabecalho.className = 'feed-cabecalho';
  const nome = document.createElement('strong');
  nome.textContent = titulo;
  const data = document.createElement('time');
  data.textContent = meta || '';
  cabecalho.append(nome, data);
  const conteudo = document.createElement('p');
  conteudo.textContent = texto || 'Sem observações registradas.';
  item.append(cabecalho, conteudo);
  container.appendChild(item);
}

async function abrirPerfil(registro) {
  const detalhes = document.getElementById('perfil-detalhes');
  const feed = document.getElementById('perfil-feed');
  const titulo = document.getElementById('perfil-titulo');
  const tipo = document.getElementById('perfil-tipo');
  const avatar = document.getElementById('perfil-avatar');
  detalhes.replaceChildren();
  feed.replaceChildren();
  titulo.textContent = 'Carregando...';
  tipo.textContent = cadastros[recurso].titulo.toUpperCase();
  avatar.textContent = (registro.nome || registro.responsavel || 'P').slice(0, 1).toUpperCase();
  perfilModal.hidden = false;
  try {
    if (recurso === 'familia') {
      titulo.textContent = registro.responsavel || 'Família #' + registro.id;
      adicionarDetalhe(detalhes, 'Endereço', `${registro.endereco}, ${registro.numero} · ${registro.bairro}`);
      adicionarDetalhe(detalhes, 'CEP', registro.cep);
      const pacientes = await buscarTodos('pacientes', { familia_id: registro.id });
      pacientes.forEach(paciente => adicionarFeed(feed, paciente.nome, 'Paciente', `Cartão SUS: ${paciente.carteira_sus}`));
      for (const paciente of pacientes) {
        const visitas = await buscarTodos('visitas', { pacientes_id: paciente.id });
        visitas.forEach(visita => adicionarFeed(feed, 'Visita · ' + paciente.nome, visita.data_visita, visita.situacao));
      }
    } else if (recurso === 'pacientes') {
      titulo.textContent = registro.nome;
      adicionarDetalhe(detalhes, 'Cartão SUS', registro.carteira_sus);
      adicionarDetalhe(detalhes, 'CPF', registro.cpf);
      adicionarDetalhe(detalhes, 'Endereço', registro.endereco);
      const [visitas, consultas] = await Promise.all([
        buscarTodos('visitas', { pacientes_id: registro.id }),
        buscarTodos('consultas', { pacientes_id: registro.id })
      ]);
      visitas.forEach(visita => adicionarFeed(feed, 'Visita · ' + visita.situacao, visita.data_visita, visita.orientacao));
      consultas.forEach(consulta => adicionarFeed(feed, 'Consulta · ' + consulta.status, consulta.data_hora, consulta.motivo));
    } else if (recurso === 'agentes') {
      titulo.textContent = registro.nome;
      adicionarDetalhe(detalhes, 'CPF', registro.cpf);
      adicionarDetalhe(detalhes, 'Telefone', registro.telefone);
      const visitas = await buscarTodos('visitas', { agentes_id: registro.id });
      visitas.forEach(visita => adicionarFeed(feed, 'Visita · ' + visita.situacao, visita.data_visita, visita.orientacao));
    } else if (recurso === 'medicos') {
      titulo.textContent = registro.nome;
      adicionarDetalhe(detalhes, 'Especialidade', registro.especialidade);
      adicionarDetalhe(detalhes, 'CRM', `${registro.crm}/${registro.crm_uf}`);
      const consultas = await buscarTodos('consultas', { medicos_id: registro.id });
      consultas.forEach(consulta => adicionarFeed(feed, 'Consulta · ' + consulta.status, consulta.data_hora, consulta.motivo));
    } else {
      const paciente = (relacionamentos.pacientes || []).find(item => item.id === registro.pacientes_id);
      titulo.textContent = 'Visita de ' + (paciente ? paciente.nome : '#' + registro.pacientes_id);
      adicionarDetalhe(detalhes, 'Data', registro.data_visita);
      adicionarDetalhe(detalhes, 'Situação', registro.situacao);
      adicionarDetalhe(detalhes, 'Encaminhamento', registro.encaminhamento ? 'Sim' : 'Não');
      adicionarFeed(feed, 'Orientação', registro.data_visita, registro.orientacao);
    }
    if (!feed.children.length) adicionarFeed(feed, 'Nenhum registro', '', 'Ainda não há eventos para exibir.');
  } catch (erro) {
    perfilModal.hidden = true;
    avisar(erro.message, true);
  }
}

async function listar() {
  const pedido = ++carregamento;
  const tabela = document.getElementById('registros');
  const cabecalho = document.getElementById('cabecalho');
  const config = cadastros[recurso];
  await Promise.all(recursosRelacionadosDoCadastro().map(carregarRelacionamento));
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
    th.textContent = coluna === 'acoes' ? '' : nomeColuna(coluna);
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
        td.textContent = textoDaTabela(coluna, valor);
        const ehAreaDoAgente = usuarioAtual?.perfil === 'AGENTE' &&
          ((recurso === 'microareas' && registro.id === usuarioAtual.microarea_id) ||
           (recurso === 'cidades' && registro.id === usuarioAtual.cidade_id));
        if (ehAreaDoAgente && coluna === config.colunas[0]) {
          linha.className = 'sua-area';
          const destaque = document.createElement('span');
          destaque.className = 'area-destaque';
          destaque.textContent = 'Sua área';
          td.appendChild(destaque);
        }
        linha.appendChild(td);
      }
      const acoes = document.createElement('td');
      const grupo = document.createElement('div');
      grupo.className = 'acoes';
      if (recursosComPerfil.includes(recurso)) {
        const perfil = document.createElement('button');
        perfil.textContent = '◉';
        perfil.className = 'icone-acao';
        perfil.title = 'Ver perfil';
        perfil.setAttribute('aria-label', 'Ver perfil de ' + (registro.nome || registro.responsavel || 'registro #' + registro.id));
        perfil.onclick = () => abrirPerfil(registro);
        grupo.appendChild(perfil);
      }
      if (podeAlterar(recurso)) {
        const editar = document.createElement('button');
        editar.textContent = '✎';
        editar.className = 'icone-acao';
        editar.title = 'Editar cadastro';
        editar.setAttribute('aria-label', 'Editar cadastro #' + registro.id);
        editar.onclick = () => abrirFormulario(registro);
        const excluir = document.createElement('button');
        excluir.textContent = '🗑';
        excluir.className = 'icone-acao excluir';
        excluir.title = 'Excluir cadastro';
        excluir.setAttribute('aria-label', 'Excluir cadastro #' + registro.id);
        excluir.onclick = () => excluirRegistro(registro.id, excluir);
        grupo.append(editar, excluir);
      }
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

async function abrirFormulario(registro = null) {
  editandoId = registro ? registro.id : null;
  document.getElementById('titulo-formulario').textContent = registro ? 'Editar cadastro #' + registro.id : 'Novo cadastro · ' + cadastros[recurso].titulo;
  const campos = document.getElementById('campos');
  campos.replaceChildren();
  await Promise.all(recursosRelacionadosDoCadastro().map(carregarRelacionamento));
  for (const [nome, titulo, tipo, obrigatorio, opcoes] of cadastros[recurso].campos) {
    const label = document.createElement('label');
    label.textContent = titulo + (obrigatorio ? ' *' : '');
    const input = document.createElement(tipo === 'select' || tipo === 'boolean' || tipo === 'relation' ? 'select' : tipo === 'textarea' ? 'textarea' : 'input');
    input.name = nome;
    input.id = 'campo-' + nome;
    input.required = Boolean(obrigatorio);
    if (tipo === 'select' || tipo === 'boolean' || tipo === 'relation') {
      const valores = tipo === 'boolean' ? ['true', 'false'] :
        tipo === 'relation' ? ['', ...relacionamentos[opcoes].map(item => String(item.id))] : ['', ...opcoes];
      for (const valor of valores) {
        const option = document.createElement('option');
        option.value = valor;
        option.textContent = tipo === 'boolean' ? (valor === 'true' ? 'Sim' : 'Não') :
          tipo === 'relation' ? (valor ? rotuloRelacionamento(opcoes, relacionamentos[opcoes].find(item => String(item.id) === valor)) : 'Selecione') :
          (valor || 'Selecione');
        input.appendChild(option);
      }
    } else if (tipo !== 'textarea') {
      input.type = tipo;
    }
    if (tipo === 'number' || tipo === 'relation') {
      input.step = '1';
      input.max = '2147483647';
      input.min = '1';
      if (tipo === 'number' && !nome.endsWith('_id')) input.min = '-2147483648';
    }
    if (nome === 'cpf' || nome === 'carteira_sus') {
      const tamanho = nome === 'cpf' ? 11 : 15;
      input.pattern = '[0-9]{' + tamanho + '}';
      input.maxLength = tamanho;
      input.inputMode = 'numeric';
      input.title = 'Informe ' + tamanho + ' dígitos sem pontuação';
    }
    if (tipo === 'textarea') label.className = 'campo-longo';
    if (registro) {
      const valor = registro[nome] ?? '';
      input.value = tipo === 'datetime-local' ? String(valor).slice(0, 16) : valor;
    }
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
    if ((nome === 'data_cadastro' || nome === 'senha_acesso') && !valor) continue;
    dados[nome] = tipo === 'boolean' ? valor === 'true' :
      tipo === 'number' || tipo === 'relation' ? (valor ? Number(valor) : null) : (valor || null);
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
  document.querySelectorAll('nav button, #subnavegacao button, #novo, #salvar, #cancelar, .acoes button').forEach(botao => {
    botao.disabled = bloqueado;
  });
  formulario.querySelectorAll('input, select, textarea').forEach(campo => { campo.disabled = bloqueado; });
}

document.querySelectorAll('nav button').forEach(botao => {
  botao.onclick = function () {
    grupoAtual = botao.dataset.grupo;
    document.querySelectorAll('nav button').forEach(item => {
      item.classList.toggle('selecionado', item === botao);
      item.setAttribute('aria-pressed', String(item === botao));
    });
    mostrarSubnavegacao();
    selecionarRecurso(grupos[grupoAtual][0][0]);
  };
});
document.getElementById('novo').onclick = () => abrirFormulario();
document.getElementById('cancelar').onclick = () => { editor.hidden = true; document.getElementById('novo').focus(); };
document.getElementById('anterior').onclick = () => { pagina--; listar(); };
document.getElementById('proxima').onclick = () => { pagina++; listar(); };
document.getElementById('fechar-perfil').onclick = () => { perfilModal.hidden = true; };
perfilModal.onclick = evento => { if (evento.target === perfilModal) perfilModal.hidden = true; };
document.getElementById('login-formulario').onsubmit = async evento => {
  evento.preventDefault();
  const erro = document.getElementById('login-mensagem');
  erro.hidden = true;
  try {
    usuarioAtual = await chamarApi('auth/login', 'POST', {
      email: document.getElementById('login-email').value,
      senha: document.getElementById('login-senha').value
    });
    entrarNoApp();
  } catch (falha) {
    erro.textContent = falha.message;
    erro.hidden = false;
  }
};
document.getElementById('sair').onclick = async () => {
  await chamarApi('auth/logout', 'POST');
  window.location.reload();
};
document.querySelector('header').hidden = true;
document.querySelector('main').hidden = true;
chamarApi('auth/me').then(usuario => {
  usuarioAtual = usuario;
  entrarNoApp();
}).catch(() => {
  document.getElementById('login-screen').hidden = false;
});
