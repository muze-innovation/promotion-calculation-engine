import { Action, Condition, UID } from 'index'

export abstract class ARule {
  constructor(
    public readonly uid: UID,
    public readonly priority: number,
    public readonly name: string,
    public readonly stopRulesProcessing: boolean
  ) {}

  abstract getActions(): Action[]

  abstract getConditions(): Condition[]
}
