import { CalculationBuffer } from './buffer'
import { ARule } from './rule'

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
  categories: string[] | number[]

  /**
   * Meta information of given CartItem.
   *
   * Engine might use these fields to calculate whether or not to apply the promotion.
   * Or calculate how much discount should this specific line get.
   */
  tags: string[]
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
}

export interface ItemDiscount {
  uid: UID
  perLineDiscountedAmount: number
  setFree: boolean
  applicableRuleUid: UID
}

export interface ShippingDiscount {
  uid: UID
  discountedAmount: number
  setFree: boolean
  applicableRuleUid: UID
}

export interface WholeCartDiscount {
  discountedAmount: number
  setFree: boolean
  applicableRuleUid: UID
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
   * Discount calculated per items.
   */
  itemDiscounts?: ItemDiscount[]

  /**
   * Discount per shipping information given
   */
  shippingDiscount?: ShippingDiscount[]

  /**
   * Discount per whole cart.
   */
  wholeCartDiscount?: WholeCartDiscount[]
}

export interface CalculatedCartItem extends CartItem {
  totalAmount: number
  totalDiscounted: number
  totalPerItemPrice: number
  freeQty: number
}

export interface CalculatedCartItems {
  items: CalculatedCartItem[]
  totalQty: number,
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
  check(input: CalculationBuffer): Promise<boolean>
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
