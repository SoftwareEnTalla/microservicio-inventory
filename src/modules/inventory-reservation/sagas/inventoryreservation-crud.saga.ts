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
  InventoryReservationCreatedEvent,
  InventoryReservationUpdatedEvent,
  InventoryReservationDeletedEvent,

} from '../events/exporting.event';
import {
  SagaInventoryReservationFailedEvent
} from '../events/inventoryreservation-failed.event';
import {
  CreateInventoryReservationCommand,
  UpdateInventoryReservationCommand,
  DeleteInventoryReservationCommand
} from '../commands/exporting.command';

//Logger - Codetrace
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';
import { logger } from '@core/logs/logger';

@Injectable()
export class InventoryReservationCrudSaga {
  private readonly logger = new Logger(InventoryReservationCrudSaga.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus
  ) {}

  // Reacción a evento de creación
  @Saga()
  onInventoryReservationCreated = ($events: Observable<InventoryReservationCreatedEvent>) => {
    return $events.pipe(
      ofType(InventoryReservationCreatedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para creación de InventoryReservation: ${event.aggregateId}`);
        void this.handleInventoryReservationCreated(event);
      }),
      map(() => null)
    );
  };

  // Reacción a evento de actualización
  @Saga()
  onInventoryReservationUpdated = ($events: Observable<InventoryReservationUpdatedEvent>) => {
    return $events.pipe(
      ofType(InventoryReservationUpdatedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para actualización de InventoryReservation: ${event.aggregateId}`);
        void this.handleInventoryReservationUpdated(event);
      }),
      map(() => null)
    );
  };

  // Reacción a evento de eliminación
  @Saga()
  onInventoryReservationDeleted = ($events: Observable<InventoryReservationDeletedEvent>) => {
    return $events.pipe(
      ofType(InventoryReservationDeletedEvent),
      tap(event => {
        this.logger.log(`Saga iniciada para eliminación de InventoryReservation: ${event.aggregateId}`);
        void this.handleInventoryReservationDeleted(event);
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
      .registerClient(InventoryReservationCrudSaga.name)
      .get(InventoryReservationCrudSaga.name),
  })
  private async handleInventoryReservationCreated(event: InventoryReservationCreatedEvent): Promise<void> {
    try {
      this.logger.log(`Saga InventoryReservation Created completada: ${event.aggregateId}`);
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
      .registerClient(InventoryReservationCrudSaga.name)
      .get(InventoryReservationCrudSaga.name),
  })
  private async handleInventoryReservationUpdated(event: InventoryReservationUpdatedEvent): Promise<void> {
    try {
      this.logger.log(`Saga InventoryReservation Updated completada: ${event.aggregateId}`);
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
      .registerClient(InventoryReservationCrudSaga.name)
      .get(InventoryReservationCrudSaga.name),
  })
  private async handleInventoryReservationDeleted(event: InventoryReservationDeletedEvent): Promise<void> {
    try {
      this.logger.log(`Saga InventoryReservation Deleted completada: ${event.aggregateId}`);
      // Lógica post-eliminación (ej: limpiar relaciones)
    } catch (error: any) {
      this.handleSagaError(error, event);
    }
  }

  // Método para manejo de errores en sagas
  private handleSagaError(error: Error, event: any) {
    this.logger.error(`Error en saga para evento ${event.constructor.name}: ${error.message}`);
    this.eventBus.publish(new SagaInventoryReservationFailedEvent( error,event));
  }
}
