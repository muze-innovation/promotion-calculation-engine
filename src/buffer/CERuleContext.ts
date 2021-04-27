import { UID } from '..'
import { CalculationBuffer, TaxonomyQuery } from './CEBuffer'

export type PriceTierFilterOption = 'only' | 'exclude' | 'include'
export type TaxonomyConditions =  { categories?: TaxonomyQuery; tags?: TaxonomyQuery }


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
  categories: (string | number)[]

  /**
   * Meta information of given CartItem.
   *
   * Engine might use these fields to calculate whether or not to apply the promotion.
   * Or calculate how much discount should this specific line get.
   */
  tags: string[]

  /**
   * Is item effected by PriceTier?
   */
  isPriceTier?: boolean
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

export class CERuleContext {
  constructor(
    public readonly uids: UID[],
    public readonly excludePriceTier: PriceTierFilterOption,
    public readonly taxonomyConditions: TaxonomyConditions) {
  }

  getCartSubtotal(buffer: CalculationBuffer): number {
    // TODO: Implement this
  }

  getTotalDiscountWithoutShipping(buffer: CalculationBuffer): number {
    // TODO: Implement this
  }

  calculateCartItems(buffer: CalculationBuffer, uids?: UID[]): CalculatedCartItems {
    // TODO: Implement this
  }

  public getApplicableCartItems(
    buffer: CalculationBuffer
  ): { items: CartItem[]; isAllItems: boolean } {
    const result = buffer.filterApplicableCartItems(
      this.uids,
      this.excludePriceTier,
      this.taxonomyConditions,
    )
    return result
  }
}