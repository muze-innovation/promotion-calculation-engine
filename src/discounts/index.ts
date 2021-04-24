import { RuleUID, CartItemUID } from '../typed'

export interface IDistribution {
  /**
   * Compute distributed factor max value = 1, smallest value = 0
   * TODO: Consider change this to fraction.js
   * @param cartItemUID
   */
  getDistributedFactor(cartItemUID: string): number

  /**
   * Check if distribution included specific cartItem or not?
   * @param cartItemUID
   */
  included(cartItemUID: string): boolean
}

export interface BaseDiscount {
  applicableRuleUid: RuleUID
  setFree: boolean

  /**
   * Ability to check if discount has been applied with
   * given cartItem
   *
   * @param uid
   */
  isAppliedWith(uid: CartItemUID): boolean

  /**
   * Get (distributed) specific discount value for given cartItem
   * @param uid
   */
  getDiscountedAmount(uid: CartItemUID): number

  /**
   * Export to simple JSON data nodes.
   */
  toJSON(): any
}

export interface IItemDiscount extends BaseDiscount {
  uid: CartItemUID
  perLineDiscountedAmount: number
  isPriceTier?: boolean
}

export interface IShippingDiscount extends BaseDiscount {
  uid: CartItemUID
  discountedAmount: number
}

export interface IWholeCartDiscount extends BaseDiscount {
  discountedAmount: number
}

export * from './ItemDiscount'
export * from './ShippingDiscount'
export * from './WholeCartDiscount'
