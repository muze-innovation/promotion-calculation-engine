import { CalculationBuffer } from './buffer'
import { ARule } from 'rule'
import {
  IItemDiscount,
  IShippingDiscount,
  IWholeCartDiscount,
} from './discounts'

export * from './discounts'

/**
 * Represent single customer meta data to processes through our engine.
 */
export interface Customer {
  /**
   * Uniqueness Identifier
   */
  uniqueId: string | number

  /**
   * For Rules validation
   */
  email: string

  /**
   * For Rules' validation
   */
  msisdn: string

  /**
   * Customer's Flag.
   */
  isNewCustomer: boolean

  /**
   * Customer's Flag.
   */
  tier?: string

  customerGroups?: string[]
}

export type UID = string | number

/**
 * Interface represent one cart item.
 */
export interface CartItem {
  /**
   * A unique key identifier
   *
   * Engine will use this key to associated the discount to given item basis.
   */
  uid: UID

  /**
   * CartItem index key
   */
  cartItemIndexKey?: string

  /**
   * Quantity of same `uniqueKey` in purchased.
   */
  qty: number

  /**
   * Item price per pieces.
   */
  perItemPrice: number

  /**
   * Meta information of given CartItem.
   *
   * Engine might use these fields to calculate whether or not to apply the promotion.
   * Or calculate how much discount should this specific line get.
   */
  categories?: (string | number)[]

  /**
   * Meta information of given CartItem.
   *
   * Engine might use these fields to calculate whether or not to apply the promotion.
   * Or calculate how much discount should this specific line get.
   */
  tags?: string[]

  attributes?: Record<string, (string | number)[]> | {}

  /**
   * Is item effected by PriceTier?
   */
  isPriceTier?: boolean
}

export interface Shipping {
  type: string
  fee: number
}

export interface DeliveryAddress {
  uid: UID
  postalCode: string
  city: string
  country: string
  shipping: Shipping
}

/**
 * System's input
 */
export interface UsageCount {
  salesRuleId: UID
  total?: number
  byCustomer?: number
}

export interface CalculationEngineInput {
  deliveryAddresses?: DeliveryAddress[]
  items: CartItem[]
  customer?: Customer
  rules: ARule[]
  usageCounts?: UsageCount[]
  ignoreCondition?: boolean
  creditCardPrefix?: string
}

export interface UnapplicableRule {
  uid: UID
  errors: string[]
}

/**
 * System calculation result use this as a carry over from one step to another.
 */
export interface CalculationEngineMeta {
  /**
   * all rules id that can apply to cart
   */
  applicableRuleUids?: UID[]

  /**
   * all rules id and error that can't apply to cart
   * along with its errors
   */
  unapplicableRules?: UnapplicableRule[]

  /**
   * Discount calculated per items.
   */
  itemDiscounts?: IItemDiscount[]

  /**
   * Discount per shipping information given
   */
  shippingDiscount?: IShippingDiscount[]

  /**
   * Discount per whole cart.
   */
  wholeCartDiscount?: IWholeCartDiscount[]
}

export interface CalculationEngineOption {
  /**
   * Print verbose message
   */
  verbose?: (...message: string[]) => void
}

export interface CalculatedCartItem extends CartItem {
  totalAmount: number
  totalDiscounted: number
  totalPerItemPrice: number
  freeQty: number
}

export interface CalculatedCartItems {
  items: CalculatedCartItem[]
  totalQty: number
}

export interface Action {
  /**
   * Calculate and perform changes to buffer, then produce a new meta.
   */
  perform(input: CalculationBuffer): Promise<CalculationEngineMeta>
}

export interface Condition {
  /**
   * Call this method to evaluate condition whether we should apply the actions or not?
   *
   * @param input
   */
  check(input: CalculationBuffer): Promise<string[]>
}

export type CalculationEngineOutput = CalculationEngineInput &
  CalculationEngineMeta

export { CalculationEngine } from './engine'

export {
  BuyXGetYRule,
  FixedPercentRule,
  FixedPriceRule,
  StepVolumeDiscountRule,
  FreeShippingRule,
} from './incart'
