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


import { BaseEvent } from './base.event';
import { InventoryCreatedEvent } from './inventorycreated.event';
import { InventoryUpdatedEvent } from './inventoryupdated.event';
import { InventoryDeletedEvent } from './inventorydeleted.event';
import { InventoryReservedEvent } from './inventoryreserved.event';
import { InventoryReleasedEvent } from './inventoryreleased.event';
import { InventoryAdjustedEvent } from './inventoryadjusted.event';
import { InventoryThresholdBreachedEvent } from './inventorythresholdbreached.event';
import { ReturnRestockedEvent } from './returnrestocked.event';
import { TransferReceivedEvent } from './transferreceived.event';

export type RegisteredEventClass<T extends BaseEvent = BaseEvent> = new (
  aggregateId: string,
  payload: any
) => T;

export interface RegisteredEventDefinition<T extends BaseEvent = BaseEvent> {
  topic: string;
  eventName: string;
  version: string;
  eventClass: RegisteredEventClass<T>;
  retryTopic: string;
  dlqTopic: string;
  maxRetries: number;
  replayable: boolean;
}

const createEventDefinition = <T extends BaseEvent>(
  topic: string,
  eventClass: RegisteredEventClass<T>,
  overrides?: Partial<Omit<RegisteredEventDefinition<T>, 'topic' | 'eventName' | 'eventClass'>>,
): RegisteredEventDefinition<T> => ({
  topic,
  eventName: eventClass.name,
  version: overrides?.version ?? '1.0.0',
  eventClass,
  retryTopic: overrides?.retryTopic ?? topic + '-retry',
  dlqTopic: overrides?.dlqTopic ?? topic + '-dlq',
  maxRetries: overrides?.maxRetries ?? 3,
  replayable: overrides?.replayable ?? true,
});

const EVENT_DEFINITION_OVERRIDES: Partial<Record<string, Partial<Omit<RegisteredEventDefinition, 'topic' | 'eventName' | 'eventClass'>>>> = {
  'inventory-reserved': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
  'inventory-released': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
  'inventory-adjusted': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
  'inventory-threshold-breached': {
    version: '1.0.0',
    maxRetries: 5,
    replayable: true,
  },
};

export const EVENT_DEFINITIONS: Record<string, RegisteredEventDefinition> = {
  'inventory-created': createEventDefinition('inventory-created', InventoryCreatedEvent, EVENT_DEFINITION_OVERRIDES['inventory-created']),
  'inventory-updated': createEventDefinition('inventory-updated', InventoryUpdatedEvent, EVENT_DEFINITION_OVERRIDES['inventory-updated']),
  'inventory-deleted': createEventDefinition('inventory-deleted', InventoryDeletedEvent, EVENT_DEFINITION_OVERRIDES['inventory-deleted']),
  'inventory-reserved': createEventDefinition('inventory-reserved', InventoryReservedEvent, EVENT_DEFINITION_OVERRIDES['inventory-reserved']),
  'inventory-released': createEventDefinition('inventory-released', InventoryReleasedEvent, EVENT_DEFINITION_OVERRIDES['inventory-released']),
  'inventory-adjusted': createEventDefinition('inventory-adjusted', InventoryAdjustedEvent, EVENT_DEFINITION_OVERRIDES['inventory-adjusted']),
  'inventory-threshold-breached': createEventDefinition('inventory-threshold-breached', InventoryThresholdBreachedEvent, EVENT_DEFINITION_OVERRIDES['inventory-threshold-breached']),
};

export const EXTERNAL_EVENT_DEFINITIONS: Record<string, RegisteredEventDefinition> = {
  'return-restocked': createEventDefinition('return-restocked', ReturnRestockedEvent, {
    version: '1.0.0',
    retryTopic: 'return-restocked-retry',
    dlqTopic: 'return-restocked-dlq',
    maxRetries: 5,
    replayable: true,
  }),
  'transfer-received': createEventDefinition('transfer-received', TransferReceivedEvent, {
    version: '1.0.0',
    retryTopic: 'transfer-received-retry',
    dlqTopic: 'transfer-received-dlq',
    maxRetries: 5,
    replayable: true,
  }),
};

const ALL_EVENT_DEFINITIONS: Record<string, RegisteredEventDefinition> = {
  ...EVENT_DEFINITIONS,
  ...EXTERNAL_EVENT_DEFINITIONS,
};

export const EVENT_REGISTRY: Record<string, RegisteredEventClass> = Object.fromEntries(
  Object.values(ALL_EVENT_DEFINITIONS).map((definition) => [definition.topic, definition.eventClass])
);

export const EVENT_TOPICS = Object.values(EVENT_DEFINITIONS).map((definition) => definition.topic);
export const EVENT_RETRY_TOPICS = Object.values(EVENT_DEFINITIONS).map((definition) => definition.retryTopic);
export const EVENT_DLQ_TOPICS = Object.values(EVENT_DEFINITIONS).map((definition) => definition.dlqTopic);
export const EXTERNAL_EVENT_TOPICS = Object.values(EXTERNAL_EVENT_DEFINITIONS).map((definition) => definition.topic);
export const EXTERNAL_EVENT_RETRY_TOPICS = Object.values(EXTERNAL_EVENT_DEFINITIONS).map((definition) => definition.retryTopic);
export const EXTERNAL_EVENT_DLQ_TOPICS = Object.values(EXTERNAL_EVENT_DEFINITIONS).map((definition) => definition.dlqTopic);
export const EVENT_CONSUMER_TOPICS = Array.from(new Set([
  ...EVENT_TOPICS,
  ...EVENT_RETRY_TOPICS,
  ...EXTERNAL_EVENT_TOPICS,
  ...EXTERNAL_EVENT_RETRY_TOPICS,
]));
export const EVENT_ADMIN_TOPICS = Array.from(new Set([
  ...EVENT_TOPICS,
  ...EVENT_RETRY_TOPICS,
  ...EVENT_DLQ_TOPICS,
  ...EXTERNAL_EVENT_RETRY_TOPICS,
  ...EXTERNAL_EVENT_DLQ_TOPICS,
]));

export const resolveEventDefinition = (candidate?: string): RegisteredEventDefinition | undefined => {
  if (!candidate) {
    return undefined;
  }

  if (ALL_EVENT_DEFINITIONS[candidate]) {
    return ALL_EVENT_DEFINITIONS[candidate];
  }

  return Object.values(ALL_EVENT_DEFINITIONS).find(
    (definition) =>
      definition.topic === candidate ||
      definition.retryTopic === candidate ||
      definition.dlqTopic === candidate ||
      definition.eventName === candidate,
  );
};
