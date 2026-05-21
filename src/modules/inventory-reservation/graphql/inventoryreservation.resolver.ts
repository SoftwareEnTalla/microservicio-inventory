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


import { Resolver, Query, Mutation, Args } from "@nestjs/graphql";

//Definición de entidades
import { InventoryReservation } from "../entities/inventory-reservation.entity";

//Definición de comandos
import {
  CreateInventoryReservationCommand,
  UpdateInventoryReservationCommand,
  DeleteInventoryReservationCommand,
} from "../commands/exporting.command";

import { CommandBus } from "@nestjs/cqrs";
import { InventoryReservationQueryService } from "../services/inventoryreservationquery.service";


import { InventoryReservationResponse, InventoryReservationsResponse } from "../types/inventoryreservation.types";
import { FindManyOptions } from "typeorm";
import { PaginationArgs } from "src/common/dto/args/pagination.args";
import { fromObject } from "src/utils/functions";

//Logger
import { LogExecutionTime } from "src/common/logger/loggers.functions";
import { LoggerClient } from "src/common/logger/logger.client";
import { logger } from '@core/logs/logger';

import { v4 as uuidv4 } from "uuid";

//Definición de tdos
import { UpdateInventoryReservationDto, 
CreateOrUpdateInventoryReservationDto, 
InventoryReservationValueInput, 
InventoryReservationDto, 
CreateInventoryReservationDto } from "../dtos/all-dto";
 

//@UseGuards(JwtGraphQlAuthGuard)
@Resolver(() => InventoryReservation)
export class InventoryReservationResolver {

   //Constructor del resolver de InventoryReservation
  constructor(
    private readonly service: InventoryReservationQueryService,
    private readonly commandBus: CommandBus
  ) {}

  @LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  // Mutaciones
  @Mutation(() => InventoryReservationResponse<InventoryReservation>)
  async createInventoryReservation(
    @Args("input", { type: () => CreateInventoryReservationDto }) input: CreateInventoryReservationDto
  ): Promise<InventoryReservationResponse<InventoryReservation>> {
    return this.commandBus.execute(new CreateInventoryReservationCommand(input));
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Mutation(() => InventoryReservationResponse<InventoryReservation>)
  async updateInventoryReservation(
    @Args("id", { type: () => String }) id: string,
    @Args("input") input: UpdateInventoryReservationDto
  ): Promise<InventoryReservationResponse<InventoryReservation>> {
    const payLoad = input;
    return this.commandBus.execute(
      new UpdateInventoryReservationCommand(payLoad, {
        instance: payLoad,
        metadata: {
          initiatedBy: payLoad.createdBy || 'system',
          correlationId: payLoad.id,
        },
      })
    );
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Mutation(() => InventoryReservationResponse<InventoryReservation>)
  async createOrUpdateInventoryReservation(
    @Args("data", { type: () => CreateOrUpdateInventoryReservationDto })
    data: CreateOrUpdateInventoryReservationDto
  ): Promise<InventoryReservationResponse<InventoryReservation>> {
    if (data.id) {
      const existingInventoryReservation = await this.service.findById(data.id);
      if (existingInventoryReservation) {
        return this.commandBus.execute(
          new UpdateInventoryReservationCommand(data, {
            instance: data,
            metadata: {
              initiatedBy:
                (data.input as CreateInventoryReservationDto | UpdateInventoryReservationDto).createdBy ||
                'system',
              correlationId: data.id,
            },
          })
        );
      }
    }
    return this.commandBus.execute(
      new CreateInventoryReservationCommand(data, {
        instance: data,
        metadata: {
          initiatedBy:
            (data.input as CreateInventoryReservationDto | UpdateInventoryReservationDto).createdBy ||
            'system',
          correlationId: data.id || uuidv4(),
        },
      })
    );
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Mutation(() => Boolean)
  async deleteInventoryReservation(
    @Args("id", { type: () => String }) id: string
  ): Promise<boolean> {
    return this.commandBus.execute(new DeleteInventoryReservationCommand(id));
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  // Queries
  @Query(() => InventoryReservationsResponse<InventoryReservation>)
  async inventoryreservations(
    options?: FindManyOptions<InventoryReservation>,
    paginationArgs?: PaginationArgs
  ): Promise<InventoryReservationsResponse<InventoryReservation>> {
    return this.service.findAll(options, paginationArgs);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Query(() => InventoryReservationsResponse<InventoryReservation>)
  async inventoryreservation(
    @Args("id", { type: () => String }) id: string
  ): Promise<InventoryReservationResponse<InventoryReservation>> {
    return this.service.findById(id);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Query(() => InventoryReservationsResponse<InventoryReservation>)
  async inventoryreservationsByField(
    @Args("field", { type: () => String }) field: string,
    @Args("value", { type: () => InventoryReservationValueInput }) value: InventoryReservationValueInput,
    @Args("page", { type: () => Number, defaultValue: 1 }) page: number,
    @Args("limit", { type: () => Number, defaultValue: 10 }) limit: number
  ): Promise<InventoryReservationsResponse<InventoryReservation>> {
    return this.service.findByField(
      field,
      value,
      fromObject.call(PaginationArgs, { page: page, limit: limit })
    );
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Query(() => InventoryReservationsResponse<InventoryReservation>)
  async inventoryreservationsWithPagination(
    @Args("page", { type: () => Number, defaultValue: 1 }) page: number,
    @Args("limit", { type: () => Number, defaultValue: 10 }) limit: number
  ): Promise<InventoryReservationsResponse<InventoryReservation>> {
    const paginationArgs = fromObject.call(PaginationArgs, {
      page: page,
      limit: limit,
    });
    return this.service.findWithPagination({}, paginationArgs);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Query(() => Number)
  async totalInventoryReservations(): Promise<number> {
    return this.service.count();
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Query(() => InventoryReservationsResponse<InventoryReservation>)
  async searchInventoryReservations(
    @Args("where", { type: () => InventoryReservationDto, nullable: false })
    where: Record<string, any>
  ): Promise<InventoryReservationsResponse<InventoryReservation>> {
    const inventoryreservations = await this.service.findAndCount(where);
    return inventoryreservations;
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Query(() => InventoryReservationResponse<InventoryReservation>, { nullable: true })
  async findOneInventoryReservation(
    @Args("where", { type: () => InventoryReservationDto, nullable: false })
    where: Record<string, any>
  ): Promise<InventoryReservationResponse<InventoryReservation>> {
    return this.service.findOne(where);
  }


@LogExecutionTime({
    layer: 'resolver',
    callback: async (logData, client) => {
      // Puedes usar el cliente proporcionado o ignorarlo y usar otro
      try{
        logger.info('Información del cliente y datos a enviar:',[logData,client]);
        return await client.send(logData);
      }
      catch(error){
        logger.info('Ha ocurrido un error al enviar la traza de log: ', logData);
        logger.info('ERROR-LOG: ', error);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryReservationResolver.name)

      .get(InventoryReservationResolver.name),
    })
  @Query(() => InventoryReservationResponse<InventoryReservation>)
  async findOneInventoryReservationOrFail(
    @Args("where", { type: () => InventoryReservationDto, nullable: false })
    where: Record<string, any>
  ): Promise<InventoryReservationResponse<InventoryReservation> | Error> {
    return this.service.findOneOrFail(where);
  }
}

