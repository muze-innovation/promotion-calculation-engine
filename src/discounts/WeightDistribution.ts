import values from 'lodash/values'
import isNil from 'lodash/isNil'
import { IDistribution } from '.'
import fromPairs from 'lodash/fromPairs'

export class WeightDistribution implements IDistribution {
  private totalWeight: number = 0

  constructor(public readonly cartItemUidToWeight: { [key: string]: number }) {
    this.totalWeight = values(this.cartItemUidToWeight).reduce(
      (c, v) => c + v,
      0
    )
  }

  included(cartItemUID: string): boolean {
    return !isNil(this.cartItemUidToWeight[`${cartItemUID}`])
  }

  getDistributedFactor(cartItemUID: string): number {
    // Prevent divided by zero.
    if (this.totalWeight === 0) {
      return 0
    }
    const weight = this.cartItemUidToWeight[`${cartItemUID}`]
    return weight / this.totalWeight
  }

  /**
   * Create Weight Distribution from argument
   * @param args
   * @returns WeightDistribution object
   */
  static make(wegihtPairs: [string, number][]) {
    return new WeightDistribution(fromPairs(wegihtPairs))
  }
}
