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


import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from "@nestjs/common";
import { DeleteResult, UpdateResult } from "typeorm";
import { InventoryReservation } from "../entities/inventory-reservation.entity";
import { CreateInventoryReservationDto, UpdateInventoryReservationDto, DeleteInventoryReservationDto } from "../dtos/all-dto";
 
import { InventoryReservationCommandRepository } from "../repositories/inventoryreservationcommand.repository";
import { InventoryReservationQueryRepository } from "../repositories/inventoryreservationquery.repository";
import { InventoryReservationResponse, InventoryReservationsResponse } from "../types/inventoryreservation.types";
import { Helper } from "src/common/helpers/helpers";
//Logger
import { LogExecutionTime } from "src/common/logger/loggers.functions";
import { LoggerClient } from "src/common/logger/logger.client";
import { logger } from '@core/logs/logger';

import { CommandBus } from "@nestjs/cqrs";
import { EventStoreService } from "../shared/event-store/event-store.service";
import { KafkaEventPublisher } from "../shared/adapters/kafka-event-publisher";
import { ModuleRef } from "@nestjs/core";
import { InventoryReservationQueryService } from "./inventoryreservationquery.service";
import { BaseEvent } from "../events/base.event";
import { InventoryQueryRepository } from "../../inventory/repositories/inventoryquery.repository";
import { InventoryCommandService } from "../../inventory/services/inventorycommand.service";


@Injectable()
export class InventoryReservationCommandService implements OnModuleInit {
  // Private properties
  readonly #logger = new Logger(InventoryReservationCommandService.name);
  //Constructo del servicio InventoryReservationCommandService
  constructor(
    private readonly repository: InventoryReservationCommandRepository,
    private readonly queryRepository: InventoryReservationQueryRepository,
    private readonly inventoryQueryRepository: InventoryQueryRepository,
    private readonly inventoryCommandService: InventoryCommandService,
    private readonly commandBus: CommandBus,
    private readonly eventStore: EventStoreService,
    private readonly eventPublisher: KafkaEventPublisher,
    private moduleRef: ModuleRef
  ) {
    //Inicialice aquí propiedades o atributos
  }


  @LogExecutionTime({
    layer: "service",
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
      .registerClient(InventoryReservationQueryService.name)
      .get(InventoryReservationQueryService.name),
  })
  onModuleInit() {
    //Se ejecuta en la inicialización del módulo
  }

  private dslValue(entityData: Record<string, any>, currentData: Record<string, any>, inputData: Record<string, any>, field: string): any {
    return entityData?.[field] ?? currentData?.[field] ?? inputData?.[field];
  }

  private normalizeNumericValue(value: any): number {
    const numericValue = Number(value ?? 0);
    return Number.isFinite(numericValue) ? numericValue : 0;
  }

  private async adjustInventoryBalance(inventoryId: string, reservedDelta: number): Promise<{ inventoryId: string; availableQty: number; reservedQty: number }> {
    const inventory = await this.inventoryQueryRepository.findById(inventoryId);

    if (!inventory) {
      throw new NotFoundException("Inventory asociado no encontrado.");
    }

    const currentAvailableQty = this.normalizeNumericValue(inventory.availableQty);
    const currentReservedQty = this.normalizeNumericValue(inventory.reservedQty);
    const currentBlockedQty = this.normalizeNumericValue((inventory as any)?.blockedQty);
    const effectiveAvailableQty = Math.max(currentAvailableQty - currentBlockedQty, 0);
    const nextAvailableQty = currentAvailableQty - reservedDelta;
    const nextReservedQty = currentReservedQty + reservedDelta;

    if (reservedDelta > 0 && effectiveAvailableQty < reservedDelta) {
      throw new BadRequestException("No hay stock disponible suficiente para registrar la reserva solicitada.");
    }

    if (nextAvailableQty < 0 || nextReservedQty < 0) {
      throw new BadRequestException("La operación de reserva/liberación deja cantidades de inventario inválidas.");
    }

    await this.inventoryCommandService.update(inventoryId, {
      availableQty: nextAvailableQty,
      reservedQty: nextReservedQty,
    } as any);

    return {
      inventoryId,
      availableQty: currentAvailableQty,
      reservedQty: currentReservedQty,
    };
  }

  private async rollbackInventoryBalance(snapshot: { inventoryId: string; availableQty: number; reservedQty: number } | null): Promise<void> {
    if (!snapshot) {
      return;
    }

    await this.inventoryCommandService.update(snapshot.inventoryId, {
      availableQty: snapshot.availableQty,
      reservedQty: snapshot.reservedQty,
    } as any);
  }

  private async publishDslDomainEvents(events: BaseEvent[]): Promise<void> {
    for (const event of events) {
      await this.eventPublisher.publish(event as any);
      if (process.env.EVENT_STORE_ENABLED === "true") {
        await this.eventStore.appendEvent('inventory-reservation-' + event.aggregateId, event);
      }
    }
  }

  private async applyDslServiceRules(
    operation: "create" | "update" | "delete",
    inputData: Record<string, any>,
    entity?: InventoryReservation | null,
    current?: InventoryReservation | null,
    publishEvents: boolean = true,
  ): Promise<void> {
    const entityData = ((entity ?? {}) as Record<string, any>);
    const currentData = ((current ?? {}) as Record<string, any>);
    const pendingEvents: BaseEvent[] = [];
// No se definieron business-rules target=service.
    if (publishEvents) {
      await this.publishDslDomainEvents(pendingEvents);
    }
  }

  @LogExecutionTime({
    layer: "service",
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
      .registerClient(InventoryReservationCommandService.name)
      .get(InventoryReservationCommandService.name),
  })
  async create(
    createInventoryReservationDtoInput: CreateInventoryReservationDto
  ): Promise<InventoryReservationResponse<InventoryReservation>> {
    let inventorySnapshot: { inventoryId: string; availableQty: number; reservedQty: number } | null = null;
    try {
      logger.info("Receiving in service:", createInventoryReservationDtoInput);
      const candidate = InventoryReservation.fromDto(createInventoryReservationDtoInput);
      inventorySnapshot = await this.adjustInventoryBalance(
        candidate.inventoryId,
        this.normalizeNumericValue(candidate.reservedQty),
      );
      await this.applyDslServiceRules("create", createInventoryReservationDtoInput as Record<string, any>, candidate, null, false);
      const entity = await this.repository.create(candidate);
      await this.applyDslServiceRules("create", createInventoryReservationDtoInput as Record<string, any>, entity, null, true);
      logger.info("Entity created on service:", entity);
      // Respuesta si el inventoryreservation no existe
      if (!entity)
        throw new NotFoundException("Entidad InventoryReservation no encontrada.");
      // Devolver inventoryreservation
      return {
        ok: true,
        message: "InventoryReservation obtenido con éxito.",
        data: entity,
      };
    } catch (error) {
      if (inventorySnapshot) {
        try {
          await this.rollbackInventoryBalance(inventorySnapshot);
        } catch (rollbackError) {
          this.#logger.error('No se pudo revertir el ajuste de inventario tras fallar la creación de la reserva.', rollbackError as any);
        }
      }
      logger.info("Error creating entity on service:", error);
      // Imprimir error
      logger.error(error);
      // Lanzar error
      return Helper.throwCachedError(error);
    }
  }


  @LogExecutionTime({
    layer: "service",
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
      .registerClient(InventoryReservationCommandService.name)
      .get(InventoryReservationCommandService.name),
  })
  async bulkCreate(
    createInventoryReservationDtosInput: CreateInventoryReservationDto[]
  ): Promise<InventoryReservationsResponse<InventoryReservation>> {
    try {
      const entities = await this.repository.bulkCreate(
        createInventoryReservationDtosInput.map((entity) => InventoryReservation.fromDto(entity))
      );

      // Respuesta si el inventoryreservation no existe
      if (!entities)
        throw new NotFoundException("Entidades InventoryReservations no encontradas.");
      // Devolver inventoryreservation
      return {
        ok: true,
        message: "InventoryReservations creados con éxito.",
        data: entities,
        count: entities.length,
      };
    } catch (error) {
      // Imprimir error
      logger.error(error);
      // Lanzar error
      return Helper.throwCachedError(error);
    }
  }


  @LogExecutionTime({
    layer: "service",
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
      .registerClient(InventoryReservationCommandService.name)
      .get(InventoryReservationCommandService.name),
  })
  async update(
    id: string,
    partialEntity: UpdateInventoryReservationDto
  ): Promise<InventoryReservationResponse<InventoryReservation>> {
    const inventorySnapshots: Array<{ inventoryId: string; availableQty: number; reservedQty: number }> = [];
    try {
      const currentEntity = await this.queryRepository.findById(id);
      if (!currentEntity) {
        throw new NotFoundException("Instancias de InventoryReservation no encontradas.");
      }

      const mergedReservation = {
        ...(currentEntity as Record<string, any>),
        ...(partialEntity as Record<string, any>),
      };
      const candidate = InventoryReservation.fromDto(mergedReservation as any);

      const currentReservedQty = this.normalizeNumericValue(currentEntity.reservedQty);
      const nextReservedQty = this.normalizeNumericValue(mergedReservation.reservedQty);
      const nextInventoryId = String(mergedReservation.inventoryId ?? currentEntity.inventoryId);

      if (currentEntity.inventoryId !== nextInventoryId) {
        inventorySnapshots.push(await this.adjustInventoryBalance(currentEntity.inventoryId, -currentReservedQty));
        try {
          inventorySnapshots.push(await this.adjustInventoryBalance(nextInventoryId, nextReservedQty));
        } catch (error) {
          await this.rollbackInventoryBalance(inventorySnapshots[0]);
          throw error;
        }
      } else {
        const reservedDelta = nextReservedQty - currentReservedQty;
        if (reservedDelta !== 0) {
          inventorySnapshots.push(await this.adjustInventoryBalance(nextInventoryId, reservedDelta));
        }
      }

      await this.applyDslServiceRules("update", partialEntity as Record<string, any>, candidate, currentEntity, false);
      const entity = await this.repository.update(
        id,
        candidate
      );
      await this.applyDslServiceRules("update", partialEntity as Record<string, any>, entity, currentEntity, true);
      // Respuesta si el inventoryreservation no existe
      if (!entity)
        throw new NotFoundException("Entidades InventoryReservations no encontradas.");
      // Devolver inventoryreservation
      return {
        ok: true,
        message: "InventoryReservation actualizada con éxito.",
        data: entity,
      };
    } catch (error) {
      for (const snapshot of inventorySnapshots.reverse()) {
        try {
          await this.rollbackInventoryBalance(snapshot);
        } catch (rollbackError) {
          this.#logger.error('No se pudo revertir el ajuste de inventario tras fallar la actualización de la reserva.', rollbackError as any);
        }
      }
      // Imprimir error
      logger.error(error);
      // Lanzar error
      return Helper.throwCachedError(error);
    }
  }


  @LogExecutionTime({
    layer: "service",
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
      .registerClient(InventoryReservationCommandService.name)
      .get(InventoryReservationCommandService.name),
  })
  async bulkUpdate(
    partialEntity: UpdateInventoryReservationDto[]
  ): Promise<InventoryReservationsResponse<InventoryReservation>> {
    try {
      const entities = await this.repository.bulkUpdate(
        partialEntity.map((entity) => InventoryReservation.fromDto(entity))
      );
      // Respuesta si el inventoryreservation no existe
      if (!entities)
        throw new NotFoundException("Entidades InventoryReservations no encontradas.");
      // Devolver inventoryreservation
      return {
        ok: true,
        message: "InventoryReservations actualizadas con éxito.",
        data: entities,
        count: entities.length,
      };
    } catch (error) {
      // Imprimir error
      logger.error(error);
      // Lanzar error
      return Helper.throwCachedError(error);
    }
  }

   @LogExecutionTime({
    layer: "service",
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
      .registerClient(InventoryReservationCommandService.name)
      .get(InventoryReservationCommandService.name),
  })
  async delete(id: string): Promise<InventoryReservationResponse<InventoryReservation>> {
    let inventorySnapshot: { inventoryId: string; availableQty: number; reservedQty: number } | null = null;
    try {
      const entity = await this.queryRepository.findById(id);
      // Respuesta si el inventoryreservation no existe
      if (!entity)
        throw new NotFoundException("Instancias de InventoryReservation no encontradas.");

      const inventory = await this.inventoryQueryRepository.findById(entity.inventoryId);
      const releasableReservedQty = Math.min(
        this.normalizeNumericValue(entity.reservedQty),
        this.normalizeNumericValue(inventory?.reservedQty),
      );

      if (releasableReservedQty > 0) {
        inventorySnapshot = await this.adjustInventoryBalance(
          entity.inventoryId,
          -releasableReservedQty,
        );
      }

      await this.applyDslServiceRules("delete", { id }, entity, entity, false);

      const result = await this.repository.delete(id);
      await this.applyDslServiceRules("delete", { id }, entity, entity, true);
      // Devolver inventoryreservation
      return {
        ok: true,
        message: "Instancia de InventoryReservation eliminada con éxito.",
        data: entity,
      };
    } catch (error) {
      if (inventorySnapshot) {
        try {
          await this.rollbackInventoryBalance(inventorySnapshot);
        } catch (rollbackError) {
          this.#logger.error('No se pudo revertir el ajuste de inventario tras fallar la eliminación de la reserva.', rollbackError as any);
        }
      }
      // Imprimir error
      logger.error(error);
      // Lanzar error
      return Helper.throwCachedError(error);
    }
  }

  @LogExecutionTime({
    layer: "service",
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
      .registerClient(InventoryReservationCommandService.name)
      .get(InventoryReservationCommandService.name),
  })
  async bulkDelete(ids: string[]): Promise<DeleteResult> {
    return await this.repository.bulkDelete(ids);
  }
}

