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
export class BaseInventoryReservationDto {
  @ApiProperty({
    type: () => String,
    description: 'Nombre de instancia CreateInventoryReservation',
    example: 'Nombre de instancia CreateInventoryReservation',
    nullable: false,
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  name: string = '';

  // Propiedades predeterminadas de la clase CreateInventoryReservationDto según especificación del sistema

  @ApiProperty({
    type: () => Date,
    description: 'Fecha de creación de la instancia (CreateInventoryReservation).',
    example: 'Fecha de creación de la instancia (CreateInventoryReservation).',
    nullable: false,
  })
  @IsDate()
  @IsNotEmpty()
  @Field(() => Date, { nullable: false })
  creationDate: Date = new Date(); // Fecha de creación por defecto, con precisión hasta milisegundos

  @ApiProperty({
    type: () => Date,
    description: 'Fecha de actualización de la instancia (CreateInventoryReservation).',
    example: 'Fecha de actualización de la instancia (CreateInventoryReservation).',
    nullable: false,
  })
  @IsDate()
  @IsNotEmpty()
  @Field(() => Date, { nullable: false })
  modificationDate: Date = new Date(); // Fecha de modificación por defecto, con precisión hasta milisegundos

  @ApiProperty({
    type: () => String,
    description:
      'Usuario que realiza la creación de la instancia (CreateInventoryReservation).',
    example:
      'Usuario que realiza la creación de la instancia (CreateInventoryReservation).',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  createdBy?: string; // Usuario que crea el objeto

  @ApiProperty({
    type: () => Boolean,
    description: 'Estado de activación de la instancia (CreateInventoryReservation).',
    example: 'Estado de activación de la instancia (CreateInventoryReservation).',
    nullable: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  @Field(() => Boolean, { nullable: false })
  isActive: boolean = false; // Por defecto, el objeto no está activo

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Código único de reserva',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Código único de reserva', nullable: false })
  reservationCode!: string;

  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Inventario asociado',
  })
  @IsUUID()
  @IsNotEmpty()
  @Field(() => String, { description: 'Inventario asociado', nullable: false })
  inventoryId!: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Orden comercial asociada',
  })
  @IsUUID()
  @IsOptional()
  @Field(() => String, { description: 'Orden comercial asociada', nullable: true })
  orderId?: string;

  @ApiProperty({
    type: () => String,
    nullable: true,
    description: 'Transferencia asociada',
  })
  @IsUUID()
  @IsOptional()
  @Field(() => String, { description: 'Transferencia asociada', nullable: true })
  transferOrderId?: string;

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
    type: () => String,
    nullable: false,
    description: 'Estado de la reserva',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { description: 'Estado de la reserva', nullable: false })
  status!: string;

  @ApiProperty({
    type: () => Object,
    nullable: true,
    description: 'Metadatos de reserva',
  })
  @IsObject()
  @IsOptional()
  @Field(() => GraphQLJSON, { description: 'Metadatos de reserva', nullable: true })
  metadata?: Record<string, any> = {};

  // Constructor
  constructor(partial: Partial<BaseInventoryReservationDto>) {
    Object.assign(this, partial);
  }
}




@InputType()
export class InventoryReservationDto extends BaseInventoryReservationDto {
  // Propiedades específicas de la clase InventoryReservationDto en cuestión

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
  constructor(partial: Partial<InventoryReservationDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<InventoryReservationDto>): InventoryReservationDto {
    const instance = new InventoryReservationDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
} 




@InputType()
export class InventoryReservationValueInput {
  @ApiProperty({
    type: () => String,
    nullable: false,
    description: 'Campo de filtro',
  })
  @Field({ nullable: false })
  fieldName: string = 'id';

  @ApiProperty({
    type: () => InventoryReservationDto,
    nullable: false,
    description: 'Valor del filtro',
  })
  @Field(() => InventoryReservationDto, { nullable: false })
  fieldValue: any; // Permite cualquier tipo
} 




@ObjectType()
export class InventoryReservationOutPutDto extends BaseInventoryReservationDto {
  // Propiedades específicas de la clase InventoryReservationOutPutDto en cuestión

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
  constructor(partial: Partial<InventoryReservationOutPutDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<InventoryReservationOutPutDto>): InventoryReservationOutPutDto {
    const instance = new InventoryReservationOutPutDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
}



@InputType()
export class CreateInventoryReservationDto extends BaseInventoryReservationDto {
  // Propiedades específicas de la clase CreateInventoryReservationDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a crear',
    example:
      'Se proporciona un identificador de CreateInventoryReservation a crear \(opcional\) ',
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  id?: string;

  // Constructor
  constructor(partial: Partial<CreateInventoryReservationDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<CreateInventoryReservationDto>): CreateInventoryReservationDto {
    const instance = new CreateInventoryReservationDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
}



@InputType()
export class CreateOrUpdateInventoryReservationDto {
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
    type: () => CreateInventoryReservationDto,
    description: 'Instancia CreateInventoryReservation o UpdateInventoryReservation',
    nullable: true,
  })
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Field(() => CreateInventoryReservationDto, { nullable: true })
  input?: CreateInventoryReservationDto | UpdateInventoryReservationDto; // Asegúrate de que esto esté correcto
}



@InputType()
export class DeleteInventoryReservationDto {
  // Propiedades específicas de la clase DeleteInventoryReservationDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a eliminar',
    example: 'Se proporciona un identificador de DeleteInventoryReservation a eliminar',
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
      'Se proporciona una lista de identificadores de DeleteInventoryReservation a eliminar',
    default: [],
  })
  @IsString()
  @IsOptional()
  @Field(() => String, { nullable: true })
  ids?: string[];
}



@InputType()
export class UpdateInventoryReservationDto extends BaseInventoryReservationDto {
  // Propiedades específicas de la clase UpdateInventoryReservationDto en cuestión

  @ApiProperty({
    type: () => String,
    description: 'Identificador de instancia a actualizar',
    example: 'Se proporciona un identificador de UpdateInventoryReservation a actualizar',
  })
  @IsString()
  @IsNotEmpty()
  @Field(() => String, { nullable: false })
  id!: string;

  // Constructor
  constructor(partial: Partial<UpdateInventoryReservationDto>) {
    super(partial);
    Object.assign(this, partial);
  }

  // Método estático para construir la instancia
  static build(data: Partial<UpdateInventoryReservationDto>): UpdateInventoryReservationDto {
    const instance = new UpdateInventoryReservationDto(data);
    instance.creationDate = new Date(); // Actualiza la fecha de creación al momento de la creación
    instance.modificationDate = new Date(); // Actualiza la fecha de modificación al momento de la creación
    return instance;
  }
} 



