
CREATE TABLE cidade (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(150) NOT NULL
);

CREATE TABLE microareas (
    id SERIAL PRIMARY KEY,
    cidade_id INT NOT NULL,
    descricao VARCHAR(150),
    obs TEXT,
    ativa BOOLEAN NOT NULL DEFAULT TRUE,

    FOREIGN KEY (cidade_id) REFERENCES cidade(id)
);

CREATE TABLE familia (
    id SERIAL PRIMARY KEY,
    microarea_id INT NOT NULL,
    endereco VARCHAR(100) NOT NULL,
    numero INT NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    cep VARCHAR(9),
    responsavel VARCHAR(150) NOT NULL,

    FOREIGN KEY (microarea_id) REFERENCES microareas(id)
);

CREATE TABLE pacientes (
    id SERIAL PRIMARY KEY,
    carteira_sus VARCHAR(15) NOT NULL UNIQUE,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    email VARCHAR(150),
    endereco VARCHAR(300) NOT NULL,
    data_nasc DATE NOT NULL,
    sexo CHAR(1) CHECK (sexo IN ('M','F')),
    telefone VARCHAR(20) NOT NULL,
    alergia TEXT,
    tipo_sanguineo VARCHAR(5),
    historico TEXT
);

CREATE TABLE agentes (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    data_cadastro DATE NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE medicos (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE,
    crm VARCHAR(10) NOT NULL UNIQUE,
    crm_uf CHAR(2) NOT NULL UNIQUE,
    especialidade VARCHAR(80) NOT NULL,
    telefone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    data_cadastro DATE NOT NULL DEFAULT CURRENT_DATE,
    ativo BOOLEAN NOT NULL DEFAULT TRUE

);

CREATE TABLE visitas (
    id SERIAL PRIMARY KEY,
    pacientes_id INT NOT NULL,
    agentes_id INT NOT NULL,
    data_visita DATE NOT NULL,
    situacao VARCHAR(30) NOT NULL,
    orientacao TEXT,
    historico TEXT,
    encaminhamento BOOLEAN DEFAULT FALSE,
    descricao_encaminhamento TEXT,
    prox_visita DATE,
    observacao TEXT,

    FOREIGN KEY (pacientes_id) REFERENCES pacientes(id),
    FOREIGN KEY (agentes_id) REFERENCES agentes(id)
);

CREATE TABLE consultas (
    id SERIAL PRIMARY KEY,
    pacientes_id INT NOT NULL,
    medicos_id INT NOT NULL,
    visitas_id INT,
    data_hora TIMESTAMP NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AGENDADA' CHECK (status IN ('AGENDADA','REALIZADA','CANCELADA','FALTOU')),
    motivo TEXT NOT NULL,
    diagnostico TEXT,
    prescricao TEXT,
    retorno DATE,
    observacao TEXT,
    data_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (pacientes_id) REFERENCES pacientes(id),
    FOREIGN KEY (medicos_id) REFERENCES medicos(id),
    FOREIGN KEY (visitas_id) REFERENCES visitas(id)
);

