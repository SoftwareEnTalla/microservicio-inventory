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


import { Module } from "@nestjs/common";
import { InventoryCommandController } from "../controllers/inventorycommand.controller";
import { InventoryQueryController } from "../controllers/inventoryquery.controller";
import { InventoryCommandService } from "../services/inventorycommand.service";
import { InventoryQueryService } from "../services/inventoryquery.service";

import { InventoryCommandRepository } from "../repositories/inventorycommand.repository";
import { InventoryQueryRepository } from "../repositories/inventoryquery.repository";
import { InventoryRepository } from "../repositories/inventory.repository";
import { InventoryResolver } from "../graphql/inventory.resolver";
import { InventoryAuthGuard } from "../guards/inventoryauthguard.guard";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Inventory } from "../entities/inventory.entity";
import { BaseEntity } from "../entities/base.entity";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
import { CqrsModule } from "@nestjs/cqrs";
import { KafkaModule } from "./kafka.module";
import { CreateInventoryHandler } from "../commands/handlers/createinventory.handler";
import { UpdateInventoryHandler } from "../commands/handlers/updateinventory.handler";
import { DeleteInventoryHandler } from "../commands/handlers/deleteinventory.handler";
import { GetInventoryByIdHandler } from "../queries/handlers/getinventorybyid.handler";
import { GetInventoryByFieldHandler } from "../queries/handlers/getinventorybyfield.handler";
import { GetAllInventoryHandler } from "../queries/handlers/getallinventory.handler";
import { InventoryCrudSaga } from "../sagas/inventory-crud.saga";
import { InventoryReturnRestockedSyncSaga } from "../sagas/inventory-return-restocked-sync.saga";
import { InventoryTransferReceivedSyncSaga } from "../sagas/inventory-transfer-received-sync.saga";

import { EVENT_TOPICS } from "../events/event-registry";

//Interceptors
import { InventoryInterceptor } from "../interceptors/inventory.interceptor";
import { InventoryLoggingInterceptor } from "../interceptors/inventory.logging.interceptor";

//Event-Sourcing dependencies
import { EventStoreService } from "../shared/event-store/event-store.service";

@Module({
  imports: [
    CqrsModule,
    KafkaModule,
    TypeOrmModule.forFeature([BaseEntity, Inventory]), // Incluir BaseEntity para herencia
    CacheModule.registerAsync({
      useFactory: async () => {
        try {
          const store = await redisStore({
            socket: { host: process.env.REDIS_HOST || "data-center-redis", port: parseInt(process.env.REDIS_PORT || "6379", 10) },
            ttl: parseInt(process.env.REDIS_TTL || "60", 10),
          });
          return { store: store as any, isGlobal: true };
        } catch {
          return { isGlobal: true }; // fallback in-memory
        }
      },
    }),
  ],
  controllers: [InventoryCommandController, InventoryQueryController],
  providers: [
    //Services
    EventStoreService,
    InventoryQueryService,
    InventoryCommandService,
  
    //Repositories
    InventoryCommandRepository,
    InventoryQueryRepository,
    InventoryRepository,      
    //Resolvers
    InventoryResolver,
    //Guards
    InventoryAuthGuard,
    //Interceptors
    InventoryInterceptor,
    InventoryLoggingInterceptor,
    //CQRS Handlers
    CreateInventoryHandler,
    UpdateInventoryHandler,
    DeleteInventoryHandler,
    GetInventoryByIdHandler,
    GetInventoryByFieldHandler,
    GetAllInventoryHandler,
    InventoryCrudSaga,
    InventoryReturnRestockedSyncSaga,
    InventoryTransferReceivedSyncSaga,
    //Configurations
    {
      provide: 'EVENT_SOURCING_CONFIG',
      useFactory: () => ({
        enabled: process.env.EVENT_SOURCING_ENABLED !== 'false',
        kafkaEnabled: process.env.KAFKA_ENABLED !== 'false',
        eventStoreEnabled: process.env.EVENT_STORE_ENABLED === 'true',
        publishEvents: true,
        useProjections: true,
        topics: EVENT_TOPICS
      })
    },
  ],
  exports: [
    CqrsModule,
    KafkaModule,
    //Services
    EventStoreService,
    InventoryQueryService,
    InventoryCommandService,
  
    //Repositories
    InventoryCommandRepository,
    InventoryQueryRepository,
    InventoryRepository,      
    //Resolvers
    InventoryResolver,
    //Guards
    InventoryAuthGuard,
    //Interceptors
    InventoryInterceptor,
    InventoryLoggingInterceptor,
  ],
})
export class InventoryModule {}

