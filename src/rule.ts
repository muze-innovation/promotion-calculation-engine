import { Action, Condition, UID } from 'index'

export type DiscountType = 'auto' | 'wholeCart' | 'perItem'

export abstract class ARule {
  constructor(
    public readonly uid: UID,
    public readonly priority: number,
    public readonly name: string,
    public readonly stopRulesProcessing: boolean,
    public readonly discountType: DiscountType
  ) {
    if (!/(auto|wholeCart|perItem)/.test(discountType)) {
      throw new Error(`invalid discountType: ${discountType}`)
    }
  }

  abstract getActions(): Action[]

  abstract getConditions(): Condition[]
}
