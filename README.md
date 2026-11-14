# hackathon-2026
Repositório do Hackathon 2026

Table microareas {
  id serial [pk]
  cidade varchar(150) [not null]
  descricao varchar(150)
  bairro varchar(100) [not null]
  complemento text
  ativa boolean [not null, default: true]
}

Table familia {
  id serial [pk]
  microareas_id int [not null]
  numero int [not null]
  responsavel varchar(150) [not null]
  status varchar(20) [not null, default: 'ATIVA']
}

Table pacientes {
  id serial [pk]
  familia_id int
  nome varchar(120) [not null]
  cpf varchar(11) [not null, unique]
  email varchar(150)
  endereco varchar(300) [not null]
  data_nasc date [not null]
  sexo char(1)
  telefone varchar(20) [not null]
}

Table agentes {
  id serial [pk]
  microareas_id int
  nome varchar(120) [not null]
  cpf varchar(11) [not null, unique]
  telefone varchar(20) [not null]
  email varchar(150)
  data_cadastro date [not null]
  ativo boolean [not null, default: true]
}

Table visitas {
  id serial [pk]
  pacientes_id int [not null]
  agentes_id int [not null]
  data_visita date [not null]
  situacao varchar(30) [not null]
  orientacao text
  encaminhamento boolean [not null, default: false]
  descricao_encaminhamento text
  prox_visita date
  observacao text
}

Ref: familia.microareas_id > microareas.id
Ref: pacientes.familia_id > familia.id
Ref: agentes.microareas_id > microareas.id
Ref: visitas.pacientes_id > pacientes.id
Ref: visitas.agentes_id > agentes.id
