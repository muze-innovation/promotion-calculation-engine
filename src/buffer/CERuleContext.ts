import { CartItem, UID } from '..'
import { CalculationBuffer, TaxonomyQuery } from './CEBuffer'

export type PriceTierFilterOption = 'only' | 'exclude' | 'include'
export type TaxonomyConditions = {
  categories?: TaxonomyQuery
  tags?: TaxonomyQuery
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
    public readonly taxonomyConditions: TaxonomyConditions
  ) {}

  getCartSubtotal(buffer: CalculationBuffer): number {
    // TODO: Implement this
    const { items } = this.getApplicableCartItems(buffer)
    return buffer.getCartSubtotal(items)
  }

  getTotalDiscountWithoutShipping(buffer: CalculationBuffer): number {
    // TODO: Implement this
    const { uids } = this.getApplicableCartItems(buffer)
    return buffer.getTotalDiscountWithoutShipping(uids)
  }

  calculateCartItems(buffer: CalculationBuffer): CalculatedCartItems {
    // TODO: Implement this
    const { items } = this.getApplicableCartItems(buffer)
    return buffer.calculateCartItems(items)
  }

  public getApplicableCartItems(
    buffer: CalculationBuffer
  ): { items: CartItem[]; uids: UID[]; isWholeCartDiscount: boolean } {
    const filteredItems = buffer.filterApplicableCartItems(
      this.uids,
      this.excludePriceTier,
      this.taxonomyConditions
    )
    return {
      ...filteredItems,
      uids: filteredItems.items.map(item => item.uid),
    }
  }
}
