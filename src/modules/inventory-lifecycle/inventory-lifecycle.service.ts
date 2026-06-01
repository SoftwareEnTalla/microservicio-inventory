import { BadRequestException, Injectable, NotFoundException, Optional } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Inventory } from '../inventory/entities/inventory.entity';
import { InventoryCommandService } from '../inventory/services/inventorycommand.service';
import { InventoryQueryRepository } from '../inventory/repositories/inventoryquery.repository';
import { InventoryReservation } from '../inventory-reservation/entities/inventory-reservation.entity';
import { InventoryReservationCommandService } from '../inventory-reservation/services/inventoryreservationcommand.service';
import { InventoryReservationQueryRepository } from '../inventory-reservation/repositories/inventoryreservationquery.repository';

type InventorySummaryRow = {
  id: string;
  name: string;
  code: string;
  skuId: string;
  warehouseId: string;
  availableQty: number;
  reservedQty: number;
  blockedQty: number;
  inTransitQty: number;
  reorderPoint: number;
  metadata?: Record<string, any> | null;
  modificationDate?: Date | string | null;
};

@Injectable()
export class InventoryLifecycleService {
  constructor(
    @Optional() @InjectDataSource() private readonly dataSource: DataSource | undefined,
    private readonly inventoryQueryRepository: InventoryQueryRepository,
    private readonly inventoryCommandService: InventoryCommandService,
    private readonly inventoryReservationQueryRepository: InventoryReservationQueryRepository,
    private readonly inventoryReservationCommandService: InventoryReservationCommandService,
  ) {}

  async getSummary(limit: number = 8): Promise<Record<string, unknown>> {
    const inventories = await this.inventoryQueryRepository.findAll({ take: Math.max(limit, 50) });
    const reservations = await this.inventoryReservationQueryRepository.findAll({ take: 250 });

    const activeReservations = reservations.filter((reservation) => reservation?.isActive !== false && String(reservation?.status || '').toUpperCase() !== 'RELEASED');
    const belowReorder = inventories.filter((inventory) => Number(inventory.reorderPoint ?? 0) > 0 && Number(inventory.availableQty ?? 0) <= Number(inventory.reorderPoint ?? 0));
    const qualityHeld = inventories.filter((inventory) => Number(inventory.blockedQty ?? 0) > 0);
    const withOrderReservations = activeReservations.filter((reservation) => Boolean(reservation.orderId));
    const synchronizedWithContext = inventories.filter((inventory) => Boolean((inventory as any)?.metadata?.lastProductSyncStatus === 'SYNCED') && Boolean((inventory as any)?.metadata?.lastWarehouseSyncStatus === 'SYNCED'));

    const totals = inventories.reduce((accumulator, inventory) => {
      accumulator.availableQty += Number(inventory.availableQty ?? 0);
      accumulator.reservedQty += Number(inventory.reservedQty ?? 0);
      accumulator.blockedQty += Number(inventory.blockedQty ?? 0);
      accumulator.inTransitQty += Number(inventory.inTransitQty ?? 0);
      return accumulator;
    }, {
      availableQty: 0,
      reservedQty: 0,
      blockedQty: 0,
      inTransitQty: 0,
    });

    const latest = [...inventories]
      .sort((left, right) => new Date(String((right as any)?.modificationDate || 0)).getTime() - new Date(String((left as any)?.modificationDate || 0)).getTime())
      .slice(0, Math.max(1, Math.min(limit, 20)))
      .map((inventory) => ({
        id: inventory.id,
        name: (inventory as any).getName ?? (inventory as any).name ?? inventory.code,
        code: inventory.code,
        skuId: inventory.skuId,
        warehouseId: inventory.warehouseId,
        availableQty: Number(inventory.availableQty ?? 0),
        reservedQty: Number(inventory.reservedQty ?? 0),
        blockedQty: Number(inventory.blockedQty ?? 0),
        inTransitQty: Number(inventory.inTransitQty ?? 0),
        reorderPoint: Number(inventory.reorderPoint ?? 0),
        metadata: inventory.metadata ?? {},
        modificationDate: inventory.modificationDate ?? null,
      }));

    return {
      ok: true,
      message: 'Resumen operativo de inventory obtenido con éxito.',
      data: {
        totals: {
          totalInventories: inventories.length,
          totalReservations: activeReservations.length,
          orderLinkedReservations: withOrderReservations.length,
          belowReorderPointInventories: belowReorder.length,
          qualityHeldInventories: qualityHeld.length,
          synchronizedInventories: synchronizedWithContext.length,
          availableQty: totals.availableQty,
          reservedQty: totals.reservedQty,
          blockedQty: totals.blockedQty,
          inTransitQty: totals.inTransitQty,
          reservationCoveragePercent: inventories.length > 0 ? Math.round((withOrderReservations.length / inventories.length) * 100) : 0,
          syncCoveragePercent: inventories.length > 0 ? Math.round((synchronizedWithContext.length / inventories.length) * 100) : 0,
        },
        latest,
      },
      count: latest.length,
    };
  }

  async reserveOrder(
    orderId: string,
    payload: { inventoryId?: string; skuId?: string; warehouseId?: string; quantity?: number },
    authorization?: string,
  ): Promise<Record<string, unknown>> {
    const quantity = Number(payload?.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('La reserva requiere una cantidad positiva.');
    }

    const inventory = await this.resolveInventory(payload);
    const activeReservations = await this.findActiveReservations(orderId);
    const matchingReservation = activeReservations.find((reservation) => reservation.inventoryId === inventory.id);
    if (matchingReservation) {
      return {
        ok: true,
        message: 'La reserva de stock ya existía para la order.',
        data: {
          id: matchingReservation.id,
          reservationId: matchingReservation.id,
          status: matchingReservation.status,
          inventoryId: matchingReservation.inventoryId,
          applied: false,
        },
      };
    }

    if (activeReservations.length) {
      await this.releaseReservations(activeReservations);
    }

    await this.ensureOperationalReferences(inventory, payload, authorization);

    const freeQty = this.computeFreeQty(inventory);
    if (freeQty < quantity) {
      throw new BadRequestException(`El inventario ${inventory.id} no tiene saldo libre suficiente para reservar ${quantity}. Disponible libre: ${freeQty}.`);
    }

    const response = await this.inventoryReservationCommandService.create({
      name: `Reserva ${orderId}`,
      description: `Reserva operativa originada por la order ${orderId}`,
      reservationCode: `RES-${orderId.slice(0, 8).toUpperCase()}-${Date.now()}`,
      inventoryId: inventory.id,
      orderId,
      reservedQty: quantity,
      status: 'RESERVED',
      createdBy: 'orders-service',
      isActive: true,
      metadata: {
        source: 'inventory-lifecycle',
        orderId,
        skuId: inventory.skuId,
        warehouseId: inventory.warehouseId,
        requestedQty: quantity,
      },
    } as any);

    const reservation = response?.data as InventoryReservation | undefined;
    await this.updateInventoryMetadata(inventory, {
      lastOrderReservationId: reservation?.id ?? null,
      lastOrderReservationOrderId: orderId,
      lastOrderReservationQty: quantity,
      lastOrderReservationAt: new Date().toISOString(),
      lastOrderReservationStatus: reservation?.status ?? 'RESERVED',
    });

    return {
      ok: true,
      message: 'Reserva operativa creada con éxito en inventory.',
      data: {
        id: reservation?.id ?? null,
        reservationId: reservation?.id ?? null,
        status: reservation?.status ?? 'RESERVED',
        inventoryId: inventory.id,
        availableQty: Number((await this.inventoryQueryRepository.findById(inventory.id))?.availableQty ?? 0),
        reservedQty: Number((await this.inventoryQueryRepository.findById(inventory.id))?.reservedQty ?? 0),
        applied: true,
      },
    };
  }

  async releaseOrder(orderId: string, reservationId?: string, reason?: string, authorization?: string): Promise<Record<string, unknown>> {
    const reservations = await this.findReservationsForRelease(orderId, reservationId);
    if (!reservations.length) {
      return {
        ok: true,
        message: 'No existe reserva activa para liberar en inventory.',
        data: {
          orderId,
          reservationId: reservationId ?? null,
          applied: false,
        },
      };
    }

    const primaryReservation = reservations[0];
    const inventory = await this.inventoryQueryRepository.findById(primaryReservation.inventoryId);
    if (!inventory) {
      throw new NotFoundException(`No existe inventory ${primaryReservation.inventoryId} asociado a la reserva ${primaryReservation.id}`);
    }

    await this.ensureOperationalReferences(inventory, {
      skuId: inventory.skuId,
      warehouseId: inventory.warehouseId,
    }, authorization);

    await this.releaseReservations(reservations);
    await this.updateInventoryMetadata(inventory, {
      lastOrderReleaseReservationId: primaryReservation.id,
      lastOrderReleaseOrderId: orderId,
      lastOrderReleaseReason: String(reason || '').trim() || null,
      lastOrderReleaseAt: new Date().toISOString(),
      lastOrderReleaseCount: reservations.length,
    });

    const refreshedInventory = await this.inventoryQueryRepository.findById(inventory.id);
    return {
      ok: true,
      message: 'Reserva operativa liberada con éxito en inventory.',
      data: {
        orderId,
        reservationId: primaryReservation.id,
        releasedReservationIds: reservations.map((reservation) => reservation.id),
        status: 'RELEASED',
        inventoryId: inventory.id,
        availableQty: Number(refreshedInventory?.availableQty ?? 0),
        reservedQty: Number(refreshedInventory?.reservedQty ?? 0),
        applied: true,
      },
    };
  }

  async applyQualityHold(
    inventoryId: string,
    payload: { quantity?: number; reason?: string; warehouseId?: string; skuId?: string },
  ): Promise<Record<string, unknown>> {
    const inventory = await this.getInventoryOrFail(inventoryId);
    const quantity = Number(payload?.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('El bloqueo de calidad requiere una cantidad positiva.');
    }

    const holdableQty = this.computeFreeQty(inventory);
    if (holdableQty < quantity) {
      throw new BadRequestException(`No existe saldo libre suficiente para bloquear ${quantity}. Disponible libre: ${holdableQty}.`);
    }

    const nextBlockedQty = Number(inventory.blockedQty ?? 0) + quantity;
    await this.inventoryCommandService.update(inventoryId, {
      blockedQty: nextBlockedQty,
      metadata: {
        ...(inventory.metadata ?? {}),
        lastQualityHoldAt: new Date().toISOString(),
        lastQualityHoldQty: quantity,
        lastQualityHoldReason: String(payload?.reason || '').trim() || 'QUALITY_REVIEW',
      },
    } as any);

    return this.buildInventoryOperationResponse('Bloqueo de calidad aplicado con éxito.', inventoryId);
  }

  async releaseQualityHold(
    inventoryId: string,
    payload: { quantity?: number; reason?: string },
  ): Promise<Record<string, unknown>> {
    const inventory = await this.getInventoryOrFail(inventoryId);
    const quantity = Number(payload?.quantity ?? 0);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new BadRequestException('La liberación de calidad requiere una cantidad positiva.');
    }

    const currentBlockedQty = Number(inventory.blockedQty ?? 0);
    if (currentBlockedQty < quantity) {
      throw new BadRequestException(`No se puede liberar ${quantity} porque el inventario sólo tiene ${currentBlockedQty} bloqueados.`);
    }

    await this.inventoryCommandService.update(inventoryId, {
      blockedQty: currentBlockedQty - quantity,
      metadata: {
        ...(inventory.metadata ?? {}),
        lastQualityReleaseAt: new Date().toISOString(),
        lastQualityReleaseQty: quantity,
        lastQualityReleaseReason: String(payload?.reason || '').trim() || 'QUALITY_RELEASE',
      },
    } as any);

    return this.buildInventoryOperationResponse('Bloqueo de calidad liberado con éxito.', inventoryId);
  }

  async reconcileInventory(
    inventoryId: string,
    payload: { countedAvailableQty?: number; countedBlockedQty?: number; countedReservedQty?: number; reason?: string },
  ): Promise<Record<string, unknown>> {
    const inventory = await this.getInventoryOrFail(inventoryId);
    const countedAvailableQty = this.resolveOptionalNumber(payload?.countedAvailableQty, Number(inventory.availableQty ?? 0));
    const countedBlockedQty = this.resolveOptionalNumber(payload?.countedBlockedQty, Number(inventory.blockedQty ?? 0));
    const countedReservedQty = this.resolveOptionalNumber(payload?.countedReservedQty, Number(inventory.reservedQty ?? 0));

    await this.inventoryCommandService.update(inventoryId, {
      availableQty: countedAvailableQty,
      blockedQty: countedBlockedQty,
      reservedQty: countedReservedQty,
      metadata: {
        ...(inventory.metadata ?? {}),
        lastCycleCountAt: new Date().toISOString(),
        lastCycleCountReason: String(payload?.reason || '').trim() || 'CYCLE_COUNT',
        lastCycleCountDiff: {
          availableQty: countedAvailableQty - Number(inventory.availableQty ?? 0),
          blockedQty: countedBlockedQty - Number(inventory.blockedQty ?? 0),
          reservedQty: countedReservedQty - Number(inventory.reservedQty ?? 0),
        },
      },
    } as any);

    return this.buildInventoryOperationResponse('Conteo y conciliación aplicados con éxito.', inventoryId);
  }

  private async findActiveReservations(orderId: string): Promise<InventoryReservation[]> {
    const [reservations] = await this.inventoryReservationQueryRepository.findAndCount({ orderId });
    return reservations.filter((reservation) => reservation?.isActive !== false && String(reservation?.status || '').toUpperCase() !== 'RELEASED');
  }

  private async findReservationsForRelease(orderId: string, reservationId?: string): Promise<InventoryReservation[]> {
    if (reservationId) {
      const reservation = await this.inventoryReservationQueryRepository.findById(reservationId);
      if (reservation && reservation.isActive !== false && String(reservation.status || '').toUpperCase() !== 'RELEASED') {
        return [reservation];
      }
    }

    return this.findActiveReservations(orderId);
  }

  private async releaseReservations(reservations: InventoryReservation[]): Promise<void> {
    for (const reservation of reservations) {
      await this.inventoryReservationCommandService.delete(reservation.id);
    }
  }

  private async resolveInventory(payload: { inventoryId?: string; skuId?: string; warehouseId?: string }): Promise<Inventory> {
    if (payload?.inventoryId) {
      return this.getInventoryOrFail(payload.inventoryId);
    }

    if (!payload?.skuId || !payload?.warehouseId) {
      throw new BadRequestException('Inventory requiere inventoryId o el par skuId/warehouseId para resolver la reserva.');
    }

    const [inventories] = await this.inventoryQueryRepository.findAndCount({ skuId: payload.skuId, warehouseId: payload.warehouseId });
    const inventory = inventories.find((candidate) => candidate?.isActive !== false);
    if (!inventory) {
      throw new NotFoundException(`No existe inventory activo para sku ${payload.skuId} en warehouse ${payload.warehouseId}`);
    }

    return inventory;
  }

  private async getInventoryOrFail(inventoryId: string): Promise<Inventory> {
    const inventory = await this.inventoryQueryRepository.findById(inventoryId);
    if (!inventory) {
      throw new NotFoundException(`No existe inventory ${inventoryId}`);
    }
    return inventory;
  }

  private computeFreeQty(inventory: Inventory): number {
    return Math.max(Number(inventory.availableQty ?? 0) - Number(inventory.blockedQty ?? 0), 0);
  }

  private resolveOptionalNumber(value: unknown, fallback: number): number {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : fallback;
  }

  private async updateInventoryMetadata(inventory: Inventory, fragment: Record<string, unknown>): Promise<void> {
    await this.inventoryCommandService.update(inventory.id, {
      metadata: {
        ...(inventory.metadata ?? {}),
        ...fragment,
      },
    } as any);
  }

  private async buildInventoryOperationResponse(message: string, inventoryId: string): Promise<Record<string, unknown>> {
    const refreshed = await this.inventoryQueryRepository.findById(inventoryId);
    return {
      ok: true,
      message,
      data: {
        inventoryId,
        availableQty: Number(refreshed?.availableQty ?? 0),
        reservedQty: Number(refreshed?.reservedQty ?? 0),
        blockedQty: Number(refreshed?.blockedQty ?? 0),
        inTransitQty: Number(refreshed?.inTransitQty ?? 0),
        metadata: refreshed?.metadata ?? {},
      },
    };
  }

  private async ensureOperationalReferences(
    inventory: Inventory,
    payload: { skuId?: string; warehouseId?: string },
    authorization?: string,
  ): Promise<void> {
    const skuId = String(payload?.skuId ?? inventory.skuId ?? '').trim();
    const warehouseId = String(payload?.warehouseId ?? inventory.warehouseId ?? '').trim();

    const productSync = await this.probeReference((process.env.PRODUCT_API_BASE_URL || 'http://host.docker.internal:3002/api').replace(/\/$/, ''), `/products/query/${skuId}`, authorization);
    const warehouseSync = await this.probeReference((process.env.WAREHOUSE_API_BASE_URL || 'http://host.docker.internal:3010/api').replace(/\/$/, ''), `/warehouses/query/${warehouseId}`, authorization);

    await this.updateInventoryMetadata(inventory, {
      lastProductSyncAt: new Date().toISOString(),
      lastProductSyncStatus: productSync ? 'SYNCED' : 'UNREACHABLE',
      lastWarehouseSyncAt: new Date().toISOString(),
      lastWarehouseSyncStatus: warehouseSync ? 'SYNCED' : 'UNREACHABLE',
    });
  }

  private async probeReference(baseUrl: string, path: string, authorization?: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(authorization ? { Authorization: authorization } : {}),
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}