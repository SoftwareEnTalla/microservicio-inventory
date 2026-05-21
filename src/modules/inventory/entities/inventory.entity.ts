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
import { CreateInventoryDto, UpdateInventoryDto, DeleteInventoryDto } from '../dtos/all-dto';
import { IsArray, IsBoolean, IsDate, IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Field, Float, Int, ObjectType } from "@nestjs/graphql";
import GraphQLJSON from 'graphql-type-json';
import { plainToInstance } from 'class-transformer';
import { InventoryReservation } from '../../inventory-reservation/entities/inventory-reservation.entity';

@Check('chk_inventory_available_non_negative', '"availableQty" >= 0')
@Check('chk_inventory_reserved_non_negative', '"reservedQty" >= 0')
@ChildEntity('inventory')
@ObjectType()
export class Inventory extends BaseEntity {
  @ApiProperty({
    type: String,
    nullable: false,
    description: "Nombre de la instancia de Inventory",
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: "Nombre de la instancia de Inventory", nullable: false })
  @Column({ type: 'varchar', length: 100, nullable: false, comment: 'Este es un campo para nombrar la instancia Inventory' })
  private name!: string;

  @ApiProperty({
    type: String,
    description: "Descripción de la instancia de Inventory",
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: "Descripción de la instancia de Inventory", nullable: false })
  @Column({ type: 'varchar', length: 255, nullable: false, default: "Sin descripción", comment: 'Este es un campo para describir la instancia Inventory' })
  private description!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Código interno del inventario',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Código interno del inventario', nullable: false })
  @Column({ type: 'varchar', nullable: false, length: 80, unique: true, comment: 'Código interno del inventario' })
  code!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'SKU sincronizado desde Product',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'SKU sincronizado desde Product', nullable: false })
  @Column({ type: 'uuid', nullable: false, comment: 'SKU sincronizado desde Product' })
  skuId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Almacén donde reside el stock',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Almacén donde reside el stock', nullable: false })
  @Column({ type: 'uuid', nullable: false, comment: 'Almacén donde reside el stock' })
  warehouseId!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Lote si aplica',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Lote si aplica', nullable: true })
  @Column({ type: 'varchar', nullable: true, length: 80, comment: 'Lote si aplica' })
  lotCode?: string = '';

  @ApiProperty({
    type: () => Number,
    nullable: false,
    description: 'Cantidad disponible',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad disponible', nullable: false })
  @Column({ type: 'decimal', nullable: false, precision: 14, scale: 2, comment: 'Cantidad disponible' })
  availableQty!: number;

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
    type: () => Number,
    nullable: false,
    description: 'Cantidad bloqueada',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad bloqueada', nullable: false })
  @Column({ type: 'decimal', nullable: false, precision: 14, scale: 2, comment: 'Cantidad bloqueada' })
  blockedQty!: number;

  @ApiProperty({
    type: () => Number,
    nullable: false,
    description: 'Cantidad en tránsito',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad en tránsito', nullable: false })
  @Column({ type: 'decimal', nullable: false, precision: 14, scale: 2, comment: 'Cantidad en tránsito' })
  inTransitQty!: number;

  @ApiProperty({
    type: () => Number,
    nullable: true,
    description: 'Punto de reposición',
  })
  @IsNumber()
  @IsOptional()
  @Field(() => Float, { description: 'Punto de reposición', nullable: true })
  @Column({ type: 'decimal', nullable: true, precision: 14, scale: 2, comment: 'Punto de reposición' })
  reorderPoint?: number = 0;

  @ApiProperty({
    type: () => Object,
    nullable: true,
    description: 'Metadatos operativos del inventario',
  })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSON, { description: 'Metadatos operativos del inventario', nullable: true })
  @Column({ type: 'json', nullable: true, comment: 'Metadatos operativos del inventario' })
  metadata?: Record<string, any> = {};

  @ApiProperty({
    type: () => [InventoryReservation],
    nullable: true,
    description: 'Reservas activas',
  })
  @Field(() => [InventoryReservation], { nullable: true })
  @OneToMany(() => InventoryReservation, (inventoryReservation) => inventoryReservation.inventory)
  reservations?: InventoryReservation[];

  protected executeDslLifecycle(): void {
    // No se definieron business-rules en el DSL.
  }

  // Relación con BaseEntity (opcional, si aplica)
  // @OneToOne(() => BaseEntity, { cascade: true })
  // @JoinColumn()
  // base!: BaseEntity;

  constructor() {
    super();
    this.type = 'inventory';
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
  static fromDto(dto: CreateInventoryDto): Inventory;
  static fromDto(dto: UpdateInventoryDto): Inventory;
  static fromDto(dto: DeleteInventoryDto): Inventory;
  static fromDto(dto: any): Inventory {
    // plainToInstance soporta todos los DTOs
    return plainToInstance(Inventory, dto);
  }
}
