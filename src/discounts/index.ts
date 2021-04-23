import { RuleUID, CartItemUID } from '../typed'

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
