import pick from 'lodash/pick'
import { CartItemUID, RuleUID } from '../typed'
import { IItemDiscount } from '.'

export class ItemDiscount implements IItemDiscount {
  constructor(
    public readonly applicableRuleUid: RuleUID,
    public readonly uid: CartItemUID,
    public readonly perLineDiscountedAmount: number,
    public readonly setFree: boolean = false
  ) {}

  static make(args: {
    applicableRuleUid: RuleUID
    uid: CartItemUID
    perLineDiscountedAmount: number
    setFree: boolean
  }): ItemDiscount {
    return new ItemDiscount(
      args.applicableRuleUid,
      args.uid,
      args.perLineDiscountedAmount,
      args.setFree
    )
  }

  public isAppliedWith(uid: CartItemUID): boolean {
    return `${this.uid}` === `${uid}`
  }

  public getDiscountedAmount(_uid: CartItemUID): number {
    return this.perLineDiscountedAmount
  }

  public toJSON() {
    return pick(
      this,
      'applicableRuleUid',
      'uid',
      'perLineDiscountedAmount',
      'setFree'
    )
  }
}
