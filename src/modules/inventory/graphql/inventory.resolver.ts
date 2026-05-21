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
import { Inventory } from "../entities/inventory.entity";

//Definición de comandos
import {
  CreateInventoryCommand,
  UpdateInventoryCommand,
  DeleteInventoryCommand,
} from "../commands/exporting.command";

import { CommandBus } from "@nestjs/cqrs";
import { InventoryQueryService } from "../services/inventoryquery.service";


import { InventoryResponse, InventorysResponse } from "../types/inventory.types";
import { FindManyOptions } from "typeorm";
import { PaginationArgs } from "src/common/dto/args/pagination.args";
import { fromObject } from "src/utils/functions";

//Logger
import { LogExecutionTime } from "src/common/logger/loggers.functions";
import { LoggerClient } from "src/common/logger/logger.client";
import { logger } from '@core/logs/logger';

import { v4 as uuidv4 } from "uuid";

//Definición de tdos
import { UpdateInventoryDto, 
CreateOrUpdateInventoryDto, 
InventoryValueInput, 
InventoryDto, 
CreateInventoryDto } from "../dtos/all-dto";
 

//@UseGuards(JwtGraphQlAuthGuard)
@Resolver(() => Inventory)
export class InventoryResolver {

   //Constructor del resolver de Inventory
  constructor(
    private readonly service: InventoryQueryService,
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  // Mutaciones
  @Mutation(() => InventoryResponse<Inventory>)
  async createInventory(
    @Args("input", { type: () => CreateInventoryDto }) input: CreateInventoryDto
  ): Promise<InventoryResponse<Inventory>> {
    return this.commandBus.execute(new CreateInventoryCommand(input));
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Mutation(() => InventoryResponse<Inventory>)
  async updateInventory(
    @Args("id", { type: () => String }) id: string,
    @Args("input") input: UpdateInventoryDto
  ): Promise<InventoryResponse<Inventory>> {
    const payLoad = input;
    return this.commandBus.execute(
      new UpdateInventoryCommand(payLoad, {
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Mutation(() => InventoryResponse<Inventory>)
  async createOrUpdateInventory(
    @Args("data", { type: () => CreateOrUpdateInventoryDto })
    data: CreateOrUpdateInventoryDto
  ): Promise<InventoryResponse<Inventory>> {
    if (data.id) {
      const existingInventory = await this.service.findById(data.id);
      if (existingInventory) {
        return this.commandBus.execute(
          new UpdateInventoryCommand(data, {
            instance: data,
            metadata: {
              initiatedBy:
                (data.input as CreateInventoryDto | UpdateInventoryDto).createdBy ||
                'system',
              correlationId: data.id,
            },
          })
        );
      }
    }
    return this.commandBus.execute(
      new CreateInventoryCommand(data, {
        instance: data,
        metadata: {
          initiatedBy:
            (data.input as CreateInventoryDto | UpdateInventoryDto).createdBy ||
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Mutation(() => Boolean)
  async deleteInventory(
    @Args("id", { type: () => String }) id: string
  ): Promise<boolean> {
    return this.commandBus.execute(new DeleteInventoryCommand(id));
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  // Queries
  @Query(() => InventorysResponse<Inventory>)
  async inventorys(
    options?: FindManyOptions<Inventory>,
    paginationArgs?: PaginationArgs
  ): Promise<InventorysResponse<Inventory>> {
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Query(() => InventorysResponse<Inventory>)
  async inventory(
    @Args("id", { type: () => String }) id: string
  ): Promise<InventoryResponse<Inventory>> {
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Query(() => InventorysResponse<Inventory>)
  async inventorysByField(
    @Args("field", { type: () => String }) field: string,
    @Args("value", { type: () => InventoryValueInput }) value: InventoryValueInput,
    @Args("page", { type: () => Number, defaultValue: 1 }) page: number,
    @Args("limit", { type: () => Number, defaultValue: 10 }) limit: number
  ): Promise<InventorysResponse<Inventory>> {
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Query(() => InventorysResponse<Inventory>)
  async inventorysWithPagination(
    @Args("page", { type: () => Number, defaultValue: 1 }) page: number,
    @Args("limit", { type: () => Number, defaultValue: 10 }) limit: number
  ): Promise<InventorysResponse<Inventory>> {
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Query(() => Number)
  async totalInventorys(): Promise<number> {
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Query(() => InventorysResponse<Inventory>)
  async searchInventorys(
    @Args("where", { type: () => InventoryDto, nullable: false })
    where: Record<string, any>
  ): Promise<InventorysResponse<Inventory>> {
    const inventorys = await this.service.findAndCount(where);
    return inventorys;
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Query(() => InventoryResponse<Inventory>, { nullable: true })
  async findOneInventory(
    @Args("where", { type: () => InventoryDto, nullable: false })
    where: Record<string, any>
  ): Promise<InventoryResponse<Inventory>> {
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
      .registerClient(InventoryResolver.name)

      .get(InventoryResolver.name),
    })
  @Query(() => InventoryResponse<Inventory>)
  async findOneInventoryOrFail(
    @Args("where", { type: () => InventoryDto, nullable: false })
    where: Record<string, any>
  ): Promise<InventoryResponse<Inventory> | Error> {
    return this.service.findOneOrFail(where);
  }
}

