/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Contacto: softwarentalla@gmail.com
 * CEOs: 
 *       Persy Morell Guerra      Email: pmorellpersi@gmail.com  Phone : +53-5336-4654 Linkedin: https://www.linkedin.com/in/persy-morell-guerra-288943357/
 *       Dailyn García Domínguez  Email: dailyngd@gmail.com      Phone : +53-5432-0312 Linkedin: https://www.linkedin.com/in/dailyn-dominguez-3150799b/
 *
 * CTO: Persy Morell Guerra
 * COO: Dailyn García Domínguez and Persy Morell Guerra
 * CFO: Dailyn García Domínguez and Persy Morell Guerra
 *
 * Repositories: 
 *               https://github.com/SoftwareEnTalla 
 *
 *               https://github.com/apokaliptolesamale?tab=repositories
 *
 *
 * Social Networks:
 *
 *              https://x.com/SoftwarEnTalla
 *
 *              https://www.facebook.com/profile.php?id=61572625716568
 *
 *              https://www.instagram.com/softwarentalla/
 *              
 *
 *
 */

import { Column, Entity, OneToOne, JoinColumn, ChildEntity, ManyToOne, OneToMany, ManyToMany, JoinTable, Index, Check, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { CreateInventoryReservationDto, UpdateInventoryReservationDto, DeleteInventoryReservationDto } from '../dtos/all-dto';
import { IsArray, IsBoolean, IsDate, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from 'graphql-type-json';
import { plainToInstance } from 'class-transformer';
import { Inventory } from '../../inventory/entities/inventory.entity';

@Check('chk_inventory_reservation_qty_positive', '"reservedQty" > 0')
@ChildEntity('inventoryreservation')
@ObjectType()
export class InventoryReservation extends BaseEntity {
  @ApiProperty({
    type: String,
    nullable: false,
    description: "Nombre de la instancia de InventoryReservation",
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: "Nombre de la instancia de InventoryReservation", nullable: false })
  @Column({ type: 'varchar', length: 100, nullable: false, comment: 'Este es un campo para nombrar la instancia InventoryReservation' })
  private name!: string;

  @ApiProperty({
    type: String,
    description: "Descripción de la instancia de InventoryReservation",
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: "Descripción de la instancia de InventoryReservation", nullable: false })
  @Column({ type: 'varchar', length: 255, nullable: false, default: "Sin descripción", comment: 'Este es un campo para describir la instancia InventoryReservation' })
  private description!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Código único de reserva',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Código único de reserva', nullable: false })
  @Column({ type: 'varchar', nullable: false, length: 80, unique: true, comment: 'Código único de reserva' })
  reservationCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Inventario asociado',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Inventario asociado', nullable: false })
  @Column({ type: 'uuid', nullable: false, comment: 'Inventario asociado' })
  inventoryId!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Orden comercial asociada',
  })
  @IsUUID()
  @IsOptional()
  @Field(() => String, { description: 'Orden comercial asociada', nullable: true })
  @Column({ type: 'uuid', nullable: true, comment: 'Orden comercial asociada' })
  orderId?: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Transferencia asociada',
  })
  @IsUUID()
  @IsOptional()
  @Field(() => String, { description: 'Transferencia asociada', nullable: true })
  @Column({ type: 'uuid', nullable: true, comment: 'Transferencia asociada' })
  transferOrderId?: string;

  @ApiProperty({
    type: () => Number,
    nullable: false,
    description: 'Cantidad reservada',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad reservada', nullable: false })
  @Column({ type: 'decimal', nullable: false, precision: 14, scale: 2, comment: 'Cantidad reservada' })
  reservedQty!: number;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Estado de la reserva',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Estado de la reserva', nullable: false })
  @Column({ type: 'varchar', nullable: false, length: 40, comment: 'Estado de la reserva' })
  status!: string;

  @ApiProperty({
    type: () => Object,
    nullable: true,
    description: 'Metadatos de reserva',
  })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSON, { description: 'Metadatos de reserva', nullable: true })
  @Column({ type: 'json', nullable: true, comment: 'Metadatos de reserva' })
  metadata?: Record<string, any> = {};

  @ApiProperty({
    type: () => Inventory,
    nullable: false,
    description: 'Relación con Inventory',
  })
  @Field(() => Inventory, { nullable: false })
  @ManyToOne(() => Inventory, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventoryId' })
  inventory!: Inventory;

  protected executeDslLifecycle(): void {
    // No se definieron business-rules en el DSL.
  }

  // Relación con BaseEntity (opcional, si aplica)
  // @OneToOne(() => BaseEntity, { cascade: true })
  // @JoinColumn()
  // base!: BaseEntity;

  constructor() {
    super();
    this.type = 'inventoryreservation';
  }

  // Getters y Setters
  get getName(): string {
    return this.name;
  }
  set setName(value: string) {
    this.name = value;
  }
  get getDescription(): string {
    return this.description;
  }

  // Métodos abstractos implementados
  async create(data: any): Promise<BaseEntity> {
    Object.assign(this, data);
    this.executeDslLifecycle();
    this.modificationDate = new Date();
    return this;
  }
  async update(data: any): Promise<BaseEntity> {
    Object.assign(this, data);
    this.executeDslLifecycle();
    this.modificationDate = new Date();
    return this;
  }
  async delete(id: string): Promise<BaseEntity> {
    this.id = id;
    return this;
  }

  // Método estático para convertir DTOs a entidad con sobrecarga
  static fromDto(dto: CreateInventoryReservationDto): InventoryReservation;
  static fromDto(dto: UpdateInventoryReservationDto): InventoryReservation;
  static fromDto(dto: DeleteInventoryReservationDto): InventoryReservation;
  static fromDto(dto: any): InventoryReservation {
    // plainToInstance soporta todos los DTOs
    return plainToInstance(InventoryReservation, dto);
  }
}
