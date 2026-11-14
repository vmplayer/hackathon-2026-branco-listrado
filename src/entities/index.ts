import { Check, Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('areas')
@Check('ck_areas_nome', `nome IN ('A','B','C','D')`)
export class Area {
  @PrimaryGeneratedColumn() id!: number;
  @Column({ type: 'char', length: 1, unique: true }) nome!: string;
}

@Entity('microareas')
export class Microarea {
  @PrimaryGeneratedColumn() id!: number;
  @Index('idx_microareas_area')
  @Column({ type: 'int' }) area_id!: number;
  @ManyToOne(() => Area, { nullable: false, onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'area_id' }) area!: Area;
  @Column({ type: 'varchar', length: 150, nullable: true }) descricao!: string | null;
  @Column({ type: 'varchar', length: 150 }) cidade!: string;
  @Column({ type: 'varchar', length: 100 }) bairro!: string;
  @Column({ type: 'varchar', length: 9, nullable: true }) cep!: string | null;
  @Column({ type: 'text', nullable: true }) complemento!: string | null;
  @Column({ type: 'boolean', default: true }) ativa!: boolean;
}

@Entity('ruas')
@Unique('uq_ruas_microarea_numero', ['microarea_id', 'numero'])
@Check('ck_ruas_numero', 'numero BETWEEN 1 AND 40')
export class Rua {
  @PrimaryGeneratedColumn() id!: number;
  @Index('idx_ruas_microarea')
  @Column({ type: 'int' }) microarea_id!: number;
  @ManyToOne(() => Microarea, { nullable: false, onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'microarea_id' }) microarea!: Microarea;
  @Column({ type: 'int' }) numero!: number;
  @Column({ type: 'varchar', length: 150 }) nome!: string;
}

@Entity('familia')
export class Familia {
  @PrimaryGeneratedColumn() id!: number;
  @Index('idx_familia_rua')
  @Column({ type: 'int' }) ruas_id!: number;
  @ManyToOne(() => Rua, { nullable: false, onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'ruas_id' }) rua!: Rua;
  @Column({ type: 'int' }) numero!: number;
  @Column({ type: 'varchar', length: 100, nullable: true }) complemento!: string | null;
  @Column({ type: 'varchar', length: 150 }) responsavel!: string;
  @Column({ type: 'boolean', default: true }) ativa!: boolean;
}

@Entity('agentes')
@Check('ck_agentes_cpf', `cpf ~ '^[0-9]{11}$'`)
export class Agente {
  @PrimaryGeneratedColumn() id!: number;
  @Index('idx_agentes_microarea')
  @Column({ type: 'int' }) microarea_id!: number;
  @ManyToOne(() => Microarea, { nullable: false, onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'microarea_id' }) microarea!: Microarea;
  @Column({ type: 'varchar', length: 120 }) nome!: string;
  @Column({ type: 'char', length: 11, unique: true }) cpf!: string;
  @Column({ type: 'varchar', length: 20 }) telefone!: string;
  @Column({ type: 'varchar', length: 150, nullable: true }) email!: string | null;
  @Column({ type: 'date', default: () => 'CURRENT_DATE' }) data_cadastro!: string;
  @Column({ type: 'boolean', default: true }) ativo!: boolean;
}

@Entity('pacientes')
@Check('ck_pacientes_cpf', `cpf ~ '^[0-9]{11}$'`)
@Check('ck_pacientes_sus', `carteira_sus ~ '^[0-9]{15}$'`)
@Check('ck_pacientes_sexo', `sexo IN ('M','F')`)
@Check('ck_pacientes_sangue', `tipo_sanguineo IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')`)
export class Paciente {
  @PrimaryGeneratedColumn() id!: number;
  @Index('idx_pacientes_familia')
  @Column({ type: 'int' }) familia_id!: number;
  @ManyToOne(() => Familia, { nullable: false, onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'familia_id' }) familia!: Familia;
  @Column({ type: 'varchar', length: 15, unique: true }) carteira_sus!: string;
  @Column({ type: 'varchar', length: 120 }) nome!: string;
  @Column({ type: 'char', length: 11, unique: true }) cpf!: string;
  @Column({ type: 'varchar', length: 150, nullable: true }) email!: string | null;
  @Column({ type: 'date' }) data_nasc!: string;
  @Column({ type: 'char', length: 1 }) sexo!: string;
  @Column({ type: 'varchar', length: 20 }) telefone!: string;
  @Column({ type: 'text', nullable: true }) alergia!: string | null;
  @Column({ type: 'varchar', length: 3, nullable: true }) tipo_sanguineo!: string | null;
  @Column({ type: 'text', nullable: true }) historico!: string | null;
  @Column({ type: 'boolean', default: true }) ativo!: boolean;
}

@Entity('visitas')
@Check('ck_visitas_situacao', `situacao IN ('REALIZADA','AUSENTE','RECUSADA','REAGENDADA')`)
@Check('ck_visitas_proxima', 'prox_visita IS NULL OR prox_visita >= data_visita')
@Check('ck_visitas_encaminhamento', 'encaminhamento = FALSE OR descricao_encaminhamento IS NOT NULL')
export class Visita {
  @PrimaryGeneratedColumn() id!: number;
  @Index('idx_visitas_paciente')
  @Column({ type: 'int' }) pacientes_id!: number;
  @ManyToOne(() => Paciente, { nullable: false, onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'pacientes_id' }) paciente!: Paciente;
  @Index('idx_visitas_agente')
  @Column({ type: 'int' }) agentes_id!: number;
  @ManyToOne(() => Agente, { nullable: false, onDelete: 'NO ACTION', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'agentes_id' }) agente!: Agente;
  @Index('idx_visitas_data')
  @Column({ type: 'date' }) data_visita!: string;
  @Column({ type: 'varchar', length: 30 }) situacao!: string;
  @Column({ type: 'text', nullable: true }) orientacao!: string | null;
  @Column({ type: 'text', nullable: true }) historico!: string | null;
  @Column({ type: 'boolean', default: false }) encaminhamento!: boolean;
  @Column({ type: 'text', nullable: true }) descricao_encaminhamento!: string | null;
  @Column({ type: 'date', nullable: true }) prox_visita!: string | null;
  @Column({ type: 'text', nullable: true }) observacao!: string | null;
}

export const entities = [Area, Microarea, Rua, Familia, Agente, Paciente, Visita];
