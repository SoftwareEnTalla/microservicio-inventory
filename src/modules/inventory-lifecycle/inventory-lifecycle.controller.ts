import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { InventoryLifecycleService } from './inventory-lifecycle.service';

@ApiTags('inventory-lifecycle')
@ApiBearerAuth()
@ApiUnauthorizedResponse({ description: 'Autenticación requerida.' })
@Controller('inventory-lifecycle')
export class InventoryLifecycleController {
  constructor(private readonly service: InventoryLifecycleService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Resumen agregado del lifecycle operativo de inventory' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Resumen operativo de inventory.' })
  async getSummary(@Query('limit') limit?: string): Promise<Record<string, unknown>> {
    return this.service.getSummary(Number(limit || 8));
  }

  @Post('orders/:orderId/reserve')
  @ApiOperation({ summary: 'Reserva stock para una order desde inventory' })
  @ApiParam({ name: 'orderId', type: String })
  async reserveOrder(
    @Param('orderId') orderId: string,
    @Body() body: { inventoryId?: string; skuId?: string; warehouseId?: string; quantity?: number },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.reserveOrder(orderId, body, authorization);
  }

  @Post('orders/:orderId/release')
  @ApiOperation({ summary: 'Libera stock reservado para una order desde inventory' })
  @ApiParam({ name: 'orderId', type: String })
  async releaseOrder(
    @Param('orderId') orderId: string,
    @Body() body?: { reservationId?: string; reason?: string },
    @Headers('authorization') authorization?: string,
  ): Promise<Record<string, unknown>> {
    return this.service.releaseOrder(orderId, body?.reservationId, body?.reason, authorization);
  }

  @Post('inventory/:inventoryId/quality-hold')
  @ApiOperation({ summary: 'Aplica bloqueo de calidad sobre stock operativo' })
  @ApiParam({ name: 'inventoryId', type: String })
  async applyQualityHold(
    @Param('inventoryId') inventoryId: string,
    @Body() body: { quantity?: number; reason?: string; warehouseId?: string; skuId?: string },
  ): Promise<Record<string, unknown>> {
    return this.service.applyQualityHold(inventoryId, body);
  }

  @Post('inventory/:inventoryId/quality-release')
  @ApiOperation({ summary: 'Libera bloqueo de calidad sobre stock operativo' })
  @ApiParam({ name: 'inventoryId', type: String })
  async releaseQualityHold(
    @Param('inventoryId') inventoryId: string,
    @Body() body: { quantity?: number; reason?: string },
  ): Promise<Record<string, unknown>> {
    return this.service.releaseQualityHold(inventoryId, body);
  }

  @Post('inventory/:inventoryId/reconcile')
  @ApiOperation({ summary: 'Registra conteo y conciliación operativa del inventario' })
  @ApiParam({ name: 'inventoryId', type: String })
  async reconcileInventory(
    @Param('inventoryId') inventoryId: string,
    @Body() body: { countedAvailableQty?: number; countedBlockedQty?: number; countedReservedQty?: number; reason?: string },
  ): Promise<Record<string, unknown>> {
    return this.service.reconcileInventory(inventoryId, body);
  }
}