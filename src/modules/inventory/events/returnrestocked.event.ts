import { BaseEvent, PayloadEvent } from './base.event';

export class ReturnRestockedEvent extends BaseEvent {
  constructor(
    public readonly aggregateId: string,
    public readonly payload: PayloadEvent<any>
  ) {
    super(aggregateId);
  }
}