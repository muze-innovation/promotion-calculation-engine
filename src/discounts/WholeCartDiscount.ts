import { CartItemUID, RuleUID } from '../typed'
import { IDistribution, IWholeCartDiscount } from '.'
import pick from 'lodash/pick'

export class WholeCartDiscount implements IWholeCartDiscount {
  constructor(
    public readonly applicableRuleUid: RuleUID,
    public readonly distribution: IDistribution,
    public readonly discountedAmount: number,
    public readonly setFree: boolean = false
  ) {}

  static make(args: {
    applicableRuleUid: RuleUID
    dist: IDistribution
    discountedAmount: number
    setFree?: boolean
  }): WholeCartDiscount {
    return new WholeCartDiscount(
      args.applicableRuleUid,
      args.dist,
      args.discountedAmount,
      args.setFree || false
    )
  }

  public isAppliedWith(uid: CartItemUID): boolean {
    return this.distribution.included(`${uid}`)
  }

  public getDiscountedAmount(uid: CartItemUID): number {
    return (
      this.distribution.getDistributedFactor(`${uid}`) * this.discountedAmount
    )
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
