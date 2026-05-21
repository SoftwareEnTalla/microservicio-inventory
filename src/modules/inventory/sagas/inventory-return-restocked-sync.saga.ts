import { Injectable, Logger } from '@nestjs/common';
import { Saga, CommandBus, EventBus, ofType } from '@nestjs/cqrs';
import { Observable, map, tap } from 'rxjs';
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';
import { logger } from '@core/logs/logger';
import { UpdateInventoryCommand } from '../commands/exporting.command';
import { ReturnRestockedEvent } from '../events/returnrestocked.event';
import { SagaInventoryFailedEvent } from '../events/inventory-failed.event';
import { InventoryQueryRepository } from '../repositories/inventoryquery.repository';
import { Inventory } from '../entities/inventory.entity';

@Injectable()
export class InventoryReturnRestockedSyncSaga {
  private readonly logger = new Logger(InventoryReturnRestockedSyncSaga.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly inventoryQueryRepository: InventoryQueryRepository,
  ) {}

  @Saga()
  onReturnRestocked = ($events: Observable<ReturnRestockedEvent>) => {
    return $events.pipe(
      ofType(ReturnRestockedEvent),
      tap(event => {
        this.logger.log(`Saga inventory-return-restocked-sync recibió ReturnRestocked: ${event.aggregateId}`);
        void this.handleReturnRestocked(event);
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
    client: LoggerClient.getInstance().registerClient(InventoryReturnRestockedSyncSaga.name).get(InventoryReturnRestockedSyncSaga.name),
  })
  private async handleReturnRestocked(event: ReturnRestockedEvent): Promise<void> {
    try {
      const payload = event?.payload?.instance ?? {};
      const metadata = payload?.metadata ?? {};
      const skuId = String(metadata?.skuId ?? '').trim();
      const warehouseId = String(metadata?.warehouseId ?? '').trim();
      const quantity = Number(metadata?.quantity ?? metadata?.qty ?? metadata?.restockQty ?? 0);

      if (!skuId || !warehouseId || !Number.isFinite(quantity) || quantity <= 0) {
        return;
      }

      const [inventories] = await this.inventoryQueryRepository.findAndCount({ skuId, warehouseId });
      if (!inventories.length) {
        return;
      }

      for (const inventory of inventories) {
        await this.commandBus.execute(
          new UpdateInventoryCommand(
            {
              id: inventory.id,
              availableQty: Number((inventory as any)?.availableQty ?? 0) + quantity,
              metadata: {
                ...((inventory as any)?.metadata ?? {}),
                lastReturnRestockedAt: new Date().toISOString(),
                lastReturnOrderId: payload?.orderId ?? null,
                lastReturnShipmentId: payload?.shipmentId ?? null,
                lastReturnRestockedQuantity: quantity,
                lastReturnRestockDecision: payload?.restockDecision ?? null,
                lastReturnCorrelationId: event?.payload?.metadata?.correlationId ?? event?.aggregateId,
              },
            },
            this.buildCommandMetadata(event, inventory),
          ),
        );
      }
    } catch (error: any) {
      this.logger.error(`Error en inventory-return-restocked-sync: ${error.message}`);
      this.eventBus.publish(new SagaInventoryFailedEvent(error, event));
    }
  }

  private buildCommandMetadata(event: ReturnRestockedEvent, inventory: Inventory) {
    const sourceMetadata = event?.payload?.metadata ?? {};
    return {
      instance: inventory,
      metadata: {
        ...sourceMetadata,
        correlationId: sourceMetadata?.correlationId ?? event?.aggregateId,
        causationId: sourceMetadata?.eventId ?? sourceMetadata?.correlationId ?? event?.aggregateId,
        saga: 'inventory-return-restocked-sync',
      },
    };
  }
}