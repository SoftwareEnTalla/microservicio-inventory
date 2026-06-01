import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { InventoryModule } from '../inventory/modules/inventory.module';
import { InventoryReservationModule } from '../inventory-reservation/modules/inventoryreservation.module';
import { InventoryLifecycleController } from './inventory-lifecycle.controller';
import { InventoryLifecycleService } from './inventory-lifecycle.service';

@Module({
  imports: [ConfigModule, InventoryModule, InventoryReservationModule],
  controllers: [InventoryLifecycleController],
  providers: [InventoryLifecycleService],
  exports: [InventoryLifecycleService],
})
export class InventoryLifecycleModule {}