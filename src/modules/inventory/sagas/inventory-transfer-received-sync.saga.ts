import { Injectable, Logger } from '@nestjs/common';
import { Saga, CommandBus, EventBus, ofType } from '@nestjs/cqrs';
import { Observable, map, tap } from 'rxjs';
import { LogExecutionTime } from 'src/common/logger/loggers.functions';
import { LoggerClient } from 'src/common/logger/logger.client';
import { logger } from '@core/logs/logger';
import { UpdateInventoryCommand } from '../commands/exporting.command';
import { TransferReceivedEvent } from '../events/transferreceived.event';
import { SagaInventoryFailedEvent } from '../events/inventory-failed.event';
import { InventoryQueryRepository } from '../repositories/inventoryquery.repository';
import { Inventory } from '../entities/inventory.entity';

@Injectable()
export class InventoryTransferReceivedSyncSaga {
  private readonly logger = new Logger(InventoryTransferReceivedSyncSaga.name);

  constructor(
    private readonly commandBus: CommandBus,
    private readonly eventBus: EventBus,
    private readonly inventoryQueryRepository: InventoryQueryRepository,
  ) {}

  @Saga()
  onTransferReceived = ($events: Observable<TransferReceivedEvent>) => {
    return $events.pipe(
      ofType(TransferReceivedEvent),
      tap(event => {
        this.logger.log(`Saga inventory-transfer-received-sync recibió TransferReceived: ${event.aggregateId}`);
        void this.handleTransferReceived(event);
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
    client: LoggerClient.getInstance().registerClient(InventoryTransferReceivedSyncSaga.name).get(InventoryTransferReceivedSyncSaga.name),
  })
  private async handleTransferReceived(event: TransferReceivedEvent): Promise<void> {
    try {
      const payload = event?.payload?.instance ?? {};
      const metadata = payload?.metadata ?? {};
      const skuId = String(metadata?.skuId ?? '').trim();
      const warehouseId = String(payload?.targetWarehouseId ?? metadata?.targetWarehouseId ?? metadata?.warehouseId ?? '').trim();
      const quantity = Number(metadata?.quantity ?? metadata?.qty ?? metadata?.receivedQty ?? 0);

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
              inTransitQty: Math.max(Number((inventory as any)?.inTransitQty ?? 0) - quantity, 0),
              metadata: {
                ...((inventory as any)?.metadata ?? {}),
                lastTransferReceivedAt: new Date().toISOString(),
                lastTransferReceivedOrderId: payload?.transferOrderCode ?? null,
                lastTransferSourceWarehouseId: payload?.sourceWarehouseId ?? null,
                lastTransferTargetWarehouseId: warehouseId,
                lastTransferReceivedQuantity: quantity,
                lastTransferCorrelationId: event?.payload?.metadata?.correlationId ?? event?.aggregateId,
              },
            },
            this.buildCommandMetadata(event, inventory),
          ),
        );
      }
    } catch (error: any) {
      this.logger.error(`Error en inventory-transfer-received-sync: ${error.message}`);
      this.eventBus.publish(new SagaInventoryFailedEvent(error, event));
    }
  }

  private buildCommandMetadata(event: TransferReceivedEvent, inventory: Inventory) {
    const sourceMetadata = event?.payload?.metadata ?? {};
    return {
      instance: inventory,
      metadata: {
        ...sourceMetadata,
        correlationId: sourceMetadata?.correlationId ?? event?.aggregateId,
        causationId: sourceMetadata?.eventId ?? sourceMetadata?.correlationId ?? event?.aggregateId,
        saga: 'inventory-transfer-received-sync',
      },
    };
  }
}