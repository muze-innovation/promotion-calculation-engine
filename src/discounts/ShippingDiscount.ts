import pick from 'lodash/pick'
import { CartItemUID, RuleUID } from '../typed'
import { IShippingDiscount } from '.'

export class ShippingDiscount implements IShippingDiscount {
  constructor(
    public readonly applicableRuleUid: RuleUID,
    public readonly uid: CartItemUID,
    public readonly discountedAmount: number,
    public readonly setFree: boolean = false
  ) {}

  static make(args: {
    applicableRuleUid: RuleUID
    uid: CartItemUID
    discountedAmount: number
    setFree: boolean
  }): ShippingDiscount {
    return new ShippingDiscount(
      args.applicableRuleUid,
      args.uid,
      args.discountedAmount,
      args.setFree
    )
  }

  public isAppliedWith(uid: CartItemUID): boolean {
    return `${this.uid}` === `${uid}`
  }

  public getDiscountedAmount(_uid: CartItemUID): number {
    return 0
  }

  public toJSON() {
    return pick(
      this,
      'applicableRuleUid',
      'uids',
      'discountedAmount',
      'setFree'
    )
  }
}
