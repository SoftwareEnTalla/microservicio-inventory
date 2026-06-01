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
import { InventoryReservationCommandController } from "../controllers/inventoryreservationcommand.controller";
import { InventoryReservationQueryController } from "../controllers/inventoryreservationquery.controller";
import { InventoryReservationCommandService } from "../services/inventoryreservationcommand.service";
import { InventoryReservationQueryService } from "../services/inventoryreservationquery.service";

import { InventoryReservationCommandRepository } from "../repositories/inventoryreservationcommand.repository";
import { InventoryReservationQueryRepository } from "../repositories/inventoryreservationquery.repository";
import { InventoryReservationRepository } from "../repositories/inventoryreservation.repository";
import { InventoryReservationResolver } from "../graphql/inventoryreservation.resolver";
import { InventoryReservationAuthGuard } from "../guards/inventoryreservationauthguard.guard";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InventoryReservation } from "../entities/inventory-reservation.entity";
import { BaseEntity } from "../entities/base.entity";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-redis-store";
import { CqrsModule } from "@nestjs/cqrs";
import { KafkaModule } from "./kafka.module";
import { CreateInventoryReservationHandler } from "../commands/handlers/createinventoryreservation.handler";
import { UpdateInventoryReservationHandler } from "../commands/handlers/updateinventoryreservation.handler";
import { DeleteInventoryReservationHandler } from "../commands/handlers/deleteinventoryreservation.handler";
import { GetInventoryReservationByIdHandler } from "../queries/handlers/getinventoryreservationbyid.handler";
import { GetInventoryReservationByFieldHandler } from "../queries/handlers/getinventoryreservationbyfield.handler";
import { GetAllInventoryReservationHandler } from "../queries/handlers/getallinventoryreservation.handler";
import { InventoryReservationCrudSaga } from "../sagas/inventoryreservation-crud.saga";

import { EVENT_TOPICS } from "../events/event-registry";

//Interceptors
import { InventoryReservationInterceptor } from "../interceptors/inventoryreservation.interceptor";
import { InventoryReservationLoggingInterceptor } from "../interceptors/inventoryreservation.logging.interceptor";

//Event-Sourcing dependencies
import { EventStoreService } from "../shared/event-store/event-store.service";
import { InventoryModule } from "../../inventory/modules/inventory.module";

@Module({
  imports: [
    CqrsModule,
    KafkaModule,
    InventoryModule,
    TypeOrmModule.forFeature([BaseEntity, InventoryReservation]), // Incluir BaseEntity para herencia
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
  controllers: [InventoryReservationCommandController, InventoryReservationQueryController],
  providers: [
    //Services
    EventStoreService,
    InventoryReservationQueryService,
    InventoryReservationCommandService,
  
    //Repositories
    InventoryReservationCommandRepository,
    InventoryReservationQueryRepository,
    InventoryReservationRepository,      
    //Resolvers
    InventoryReservationResolver,
    //Guards
    InventoryReservationAuthGuard,
    //Interceptors
    InventoryReservationInterceptor,
    InventoryReservationLoggingInterceptor,
    //CQRS Handlers
    CreateInventoryReservationHandler,
    UpdateInventoryReservationHandler,
    DeleteInventoryReservationHandler,
    GetInventoryReservationByIdHandler,
    GetInventoryReservationByFieldHandler,
    GetAllInventoryReservationHandler,
    InventoryReservationCrudSaga,
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
    InventoryReservationQueryService,
    InventoryReservationCommandService,
  
    //Repositories
    InventoryReservationCommandRepository,
    InventoryReservationQueryRepository,
    InventoryReservationRepository,      
    //Resolvers
    InventoryReservationResolver,
    //Guards
    InventoryReservationAuthGuard,
    //Interceptors
    InventoryReservationInterceptor,
    InventoryReservationLoggingInterceptor,
  ],
})
export class InventoryReservationModule {}

