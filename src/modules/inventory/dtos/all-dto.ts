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

import { InputType, Field, Float, Int, ObjectType } from '@nestjs/graphql';
import GraphQLJSON from 'graphql-type-json';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsObject,
  IsUUID,
  ValidateNested,
} from 'class-validator';




@InputType()
export class BaseInventoryDto {
  @ApiProperty({
    type: () => String,
    description: 'Nombre de instancia CreateInventory',
    example: 'Nombre de instancia CreateInventory',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  name: string = '';

  // Propiedades predeterminadas de la clase CreateInventoryDto según especificación del sistema

  @ApiProperty({
    type: () => Date,
    description: 'Fecha de creación de la instancia (CreateInventory).',
    example: 'Fecha de creación de la instancia (CreateInventory).',
    nullable: false,
  })
  @IsDate()
  @IsNotEmpty()
  @Field(() => Date, { nullable: false })
  creationDate: Date = new Date(); // Fecha de creación por defecto, con precisión hasta milisegundos

  @ApiProperty({
    type: () => Date,
    description: 'Fecha de actualización de la instancia (CreateInventory).',
    example: 'Fecha de actualización de la instancia (CreateInventory).',
    nullable: false,
  })
  @IsDate()
  @IsNotEmpty()
  @Field(() => Date, { nullable: false })
  modificationDate: Date = new Date(); // Fecha de modificación por defecto, con precisión hasta milisegundos

  @ApiProperty({
    type: () => String,
    description:
      'Usuario que realiza la creación de la instancia (CreateInventory).',
    example:
      'Usuario que realiza la creación de la instancia (CreateInventory).',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  createdBy?: string; // Usuario que crea el objeto

  @ApiProperty({
    type: () => Boolean,
    description: 'Estado de activación de la instancia (CreateInventory).',
    example: 'Estado de activación de la instancia (CreateInventory).',
    nullable: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  @Field(() => Boolean, { nullable: false })
  isActive: boolean = false; // Por defecto, el objeto no está activo

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Código interno del inventario',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Código interno del inventario', nullable: false })
  code!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'SKU sincronizado desde Product',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'SKU sincronizado desde Product', nullable: false })
  skuId!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Almacén donde reside el stock',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Almacén donde reside el stock', nullable: false })
  warehouseId!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Lote si aplica',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { description: 'Lote si aplica', nullable: true })
  lotCode?: string = '';

  @ApiProperty({
    type: () => Number,
    nullable: false,
    description: 'Cantidad disponible',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad disponible', nullable: false })
  availableQty!: number;

  @ApiProperty({
    type: () => Number,
    nullable: false,
    description: 'Cantidad reservada',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad reservada', nullable: false })
  reservedQty!: number;

  @ApiProperty({
    type: () => Number,
    nullable: false,
    description: 'Cantidad bloqueada',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad bloqueada', nullable: false })
  blockedQty!: number;

  @ApiProperty({
    type: () => Number,
    nullable: false,
    description: 'Cantidad en tránsito',
  })
  @IsNumber()
  @IsNotEmpty()
  @Field(() => Float, { description: 'Cantidad en tránsito', nullable: false })
  inTransitQty!: number;

  @ApiProperty({
    type: () => Number,
    nullable: true,
    description: 'Punto de reposición',
  })
  @IsNumber()
  @IsOptional()
  @Field(() => Float, { description: 'Punto de reposición', nullable: true })
  reorderPoint?: number = 0;

  @ApiProperty({
    type: () => Object,
    nullable: true,
    description: 'Metadatos operativos del inventario',
  })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSON, { description: 'Metadatos operativos del inventario', nullable: true })
  metadata?: Record<string, any> = {};

  // Constructor
  constructor(partial: Partial<BaseInventoryDto>) {
    Object.assign(this, partial);
  }
}




@InputType()
export class InventoryDto extends BaseInventoryDto {
  // Propiedades específicas de la clase InventoryDto en cuestión

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Identificador único de la instancia',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  // Constructor
  constructor(partial: Partial<InventoryDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<InventoryDto>): InventoryDto {
    const instance = new InventoryDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
} 




@InputType()
export class InventoryValueInput {
  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Campo de filtro',
  })
  @Field({ nullable: false })
  fieldName: string = 'id';

  @ApiProperty({
    type: () => InventoryDto,
    nullable: false,
    description: 'Valor del filtro',
  })
  @Field(() => InventoryDto, { nullable: false })
  fieldValue: any; // Permite cualquier tipo
} 




@ObjectType()
export class InventoryOutPutDto extends BaseInventoryDto {
  // Propiedades específicas de la clase InventoryOutPutDto en cuestión

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Identificador único de la instancia',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  // Constructor
  constructor(partial: Partial<InventoryOutPutDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<InventoryOutPutDto>): InventoryOutPutDto {
    const instance = new InventoryOutPutDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
}



@InputType()
export class CreateInventoryDto extends BaseInventoryDto {
  // Propiedades específicas de la clase CreateInventoryDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a crear',
    example:
      'Se proporciona un identificador de CreateInventory a crear \(opcional\) ',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  // Constructor
  constructor(partial: Partial<CreateInventoryDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<CreateInventoryDto>): CreateInventoryDto {
    const instance = new CreateInventoryDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
}



@InputType()
export class CreateOrUpdateInventoryDto {
  @ApiProperty({
    type: () => String,
    description: 'Identificador',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  @ApiProperty({
    type: () => CreateInventoryDto,
    description: 'Instancia CreateInventory o UpdateInventory',
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Field(() => CreateInventoryDto, { nullable: true })
  input?: CreateInventoryDto | UpdateInventoryDto; // Asegúrate de que esto esté correcto
}



@InputType()
export class DeleteInventoryDto {
  // Propiedades específicas de la clase DeleteInventoryDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a eliminar',
    example: 'Se proporciona un identificador de DeleteInventory a eliminar',
    default: '',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  id: string = '';

  @ApiProperty({
    type: () => String,
    description: 'Lista de identificadores de instancias a eliminar',
    example:
      'Se proporciona una lista de identificadores de DeleteInventory a eliminar',
    default: [],
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  ids?: string[];
}



@InputType()
export class UpdateInventoryDto extends BaseInventoryDto {
  // Propiedades específicas de la clase UpdateInventoryDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a actualizar',
    example: 'Se proporciona un identificador de UpdateInventory a actualizar',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  id!: string;

  // Constructor
  constructor(partial: Partial<UpdateInventoryDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<UpdateInventoryDto>): UpdateInventoryDto {
    const instance = new UpdateInventoryDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
} 



