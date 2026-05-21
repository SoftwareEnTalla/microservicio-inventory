/*
 * Copyright (c) 2026 SoftwarEnTalla
 * Licencia: MIT
 * Contacto: softwarentalla@gmail.com
 */

import { Inventory } from '../entities/inventory.entity';
import { BaseEvent, PayloadEvent } from './base.event';
import { v4 as uuidv4 } from 'uuid';

export class TransferReceivedEvent extends BaseEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly payload: PayloadEvent<any | Inventory>
  ) {
    super(aggregateId);
  }

  static create(
    instanceId: string,
    instance: any | Inventory,
    userId: string,
    correlationId?: string
  ): TransferReceivedEvent {
    return new TransferReceivedEvent(instanceId, {
      instance,
      metadata: {
        initiatedBy: userId,
        correlationId: correlationId || uuidv4(),
      },
    });
  }
}