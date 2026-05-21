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


import { Injectable, Logger } from '@nestjs/common';
import { Saga, CommandBus, EventBus, ofType } from '@nestjs/cqrs';
import { Observable, map, tap } from 'rxjs';
import {
  InventoryCreatedEvent,
  InventoryUpdatedEvent,
  InventoryDeletedEvent,
  InventoryReservedEvent,
  InventoryReleasedEvent,
  InventoryAdjustedEvent,
  InventoryThresholdBreachedEvent,
} from '../events/exporting.event';
import {
  SagaInventoryFailedEvent
} from '../events/inventory-failed.event';
import {
  CreateInventoryCommand,
  UpdateInventoryCommand,
  DeleteInventoryCommand
} from '../commands/exporting.command';

//Logger - Codetrace
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';
import { logger } from '@core/logs/logger';

@Injectable()
export class InventoryCrudSaga {
  private readonly logger = new Logger(InventoryCrudSaga.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus
  ) {}

  // Reacción a evento de creación
  @Saga()
  onInventoryCreated = ($events: Observable<InventoryCreatedEvent>) => {
    return $events.pipe(
      ofType(InventoryCreatedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para creación de Inventory: ${event.aggregateId}`);
        void this.handleInventoryCreated(event);
      }),
      map(() => null)
    );
  };

  // Reacción a evento de actualización
  @Saga()
  onInventoryUpdated = ($events: Observable<InventoryUpdatedEvent>) => {
    return $events.pipe(
      ofType(InventoryUpdatedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para actualización de Inventory: ${event.aggregateId}`);
        void this.handleInventoryUpdated(event);
      }),
      map(() => null)
    );
  };

  // Reacción a evento de eliminación
  @Saga()
  onInventoryDeleted = ($events: Observable<InventoryDeletedEvent>) => {
    return $events.pipe(
      ofType(InventoryDeletedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para eliminación de Inventory: ${event.aggregateId}`);
        void this.handleInventoryDeleted(event);
      }),
      map(() => null)
    );
  };

  @Saga()
  onInventoryReserved = ($events: Observable<InventoryReservedEvent>) => {
    return $events.pipe(
      ofType(InventoryReservedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio InventoryReserved: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @Saga()
  onInventoryReleased = ($events: Observable<InventoryReleasedEvent>) => {
    return $events.pipe(
      ofType(InventoryReleasedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio InventoryReleased: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @Saga()
  onInventoryAdjusted = ($events: Observable<InventoryAdjustedEvent>) => {
    return $events.pipe(
      ofType(InventoryAdjustedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio InventoryAdjusted: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @Saga()
  onInventoryThresholdBreached = ($events: Observable<InventoryThresholdBreachedEvent>) => {
    return $events.pipe(
      ofType(InventoryThresholdBreachedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para evento de dominio InventoryThresholdBreached: ${event.aggregateId}`);
      }),
      map(() => null)
    );
  };

  @LogExecutionTime({
    layer: 'saga',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace saga event:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de saga:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryCrudSaga.name)
      .get(InventoryCrudSaga.name),
  })
  private async handleInventoryCreated(event: InventoryCreatedEvent): Promise<void> {
    try {
      this.logger.log(`Saga Inventory Created completada: ${event.aggregateId}`);
      // Lógica post-creación (ej: enviar notificación, ejecutar comandos adicionales)
    } catch (error: any) {
      this.handleSagaError(error, event);
    }
  }

  @LogExecutionTime({
    layer: 'saga',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace saga event:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de saga:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryCrudSaga.name)
      .get(InventoryCrudSaga.name),
  })
  private async handleInventoryUpdated(event: InventoryUpdatedEvent): Promise<void> {
    try {
      this.logger.log(`Saga Inventory Updated completada: ${event.aggregateId}`);
      // Lógica post-actualización (ej: actualizar caché)
    } catch (error: any) {
      this.handleSagaError(error, event);
    }
  }

  @LogExecutionTime({
    layer: 'saga',
    callback: async (logData, client) => {
      try {
        logger.info('Codetrace saga event:', [logData, client]);
        return await client.send(logData);
      } catch (error) {
        logger.info('Error enviando traza de saga:', logData);
        throw error;
      }
    },
    client: LoggerClient.getInstance()
      .registerClient(InventoryCrudSaga.name)
      .get(InventoryCrudSaga.name),
  })
  private async handleInventoryDeleted(event: InventoryDeletedEvent): Promise<void> {
    try {
      this.logger.log(`Saga Inventory Deleted completada: ${event.aggregateId}`);
      // Lógica post-eliminación (ej: limpiar relaciones)
    } catch (error: any) {
      this.handleSagaError(error, event);
    }
  }

  // Método para manejo de errores en sagas
  private handleSagaError(error: Error, event: any) {
    this.logger.error(`Error en saga para evento ${event.constructor.name}: ${error.message}`);
    this.eventBus.publish(new SagaInventoryFailedEvent( error,event));
  }
}
