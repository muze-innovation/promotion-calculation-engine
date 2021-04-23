import values from 'lodash/values'
import { CartItemUID, RuleUID } from '../typed'
import { IWholeCartDiscount } from '.'
import pick from 'lodash/pick'

interface Distribution {
  /**
   * Compute distributed factor max value = 1, smallest value = 0
   * TODO: Consider change this to fraction.js
   * @param cartItemUID
   */
  getDistributedFactor(cartItemUID: string): number
}

class WeightDistribution implements Distribution {
  private totalWeight: number = 0
  constructor(public readonly cartItemUidToWeight: { [key: string]: number }) {
    this.totalWeight = values(this.cartItemUidToWeight).reduce(
      (c, v) => c + v,
      0
    )
  }

  getDistributedFactor(cartItemUID: string): number {
    // Prevent divided by zero.
    if (this.totalWeight === 0) {
      return 0
    }
    const weight = this.cartItemUidToWeight[`${cartItemUID}`]
    return weight / this.totalWeight
  }
}

export class WholeCartDiscount implements IWholeCartDiscount {
  private _distribution: Distribution

  constructor(
    public readonly applicableRuleUid: RuleUID,
    public readonly uids: CartItemUID[],
    public readonly discountedAmount: number,
    public readonly setFree: boolean = false
  ) {
    this._distribution = new WeightDistribution({})
  }

  static make(args: {
    applicableRuleUid: RuleUID
    uids: CartItemUID[]
    discountedAmount: number
    setFree?: boolean
  }): WholeCartDiscount {
    return new WholeCartDiscount(
      args.applicableRuleUid,
      args.uids,
      args.discountedAmount,
      args.setFree || false
    )
  }

  public isAppliedWith(uid: CartItemUID): boolean {
    return this.uids.includes(`${uid}`)
  }

  public getDiscountedAmount(uid: CartItemUID): number {
    return (
      this._distribution.getDistributedFactor(`${uid}`) * this.discountedAmount
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
