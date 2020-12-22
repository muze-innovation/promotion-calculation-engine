import sumBy from 'lodash/sumBy'
import isEmpty from 'lodash/isEmpty'
import {
  CalculationEngineInput,
  CalculationEngineMeta,
  CalculationEngineOutput,
  DeliveryAddress,
  CartItem,
  Customer,
  ShippingDiscount,
  ItemDiscount,
  WholeCartDiscount,
  CalculatedCartItems,
  UID,
  UsageCount,
} from 'index'
import { ARule } from 'rule'

export class CalculationBuffer implements CalculationEngineOutput {
  constructor(
    public readonly input: CalculationEngineInput,
    public readonly meta: CalculationEngineMeta
  ) {
    //
  }

  recreate(meta: CalculationEngineMeta): CalculationBuffer {
    return new CalculationBuffer(this.input, meta)
  }

  get deliveryAddresses(): DeliveryAddress[] | undefined {
    return this.input.deliveryAddresses
  }

  get items(): CartItem[] {
    return this.input.items
  }

  get customer(): Customer | undefined {
    return this.input.customer
  }

  get rules(): ARule[] {
    return this.input.rules
  }

  get shippingDiscount(): ShippingDiscount[] | undefined {
    return this.meta.shippingDiscount
  }

  get applicableRuleUids(): UID[] | undefined {
    return this.meta.applicableRuleUids
  }

  get itemDiscounts(): ItemDiscount[] | undefined {
    return this.meta.itemDiscounts
  }

  get wholeCartDiscount(): WholeCartDiscount[] | undefined {
    return this.meta.wholeCartDiscount
  }

  get itemMeta(): CalculationEngineMeta | undefined {
    return this.meta
  }

  get usageCounts(): UsageCount[] | undefined {
    return this.input.usageCounts
  }

  getDiscountFor(uid: UID) {
    return sumBy(this.itemDiscounts, (item: ItemDiscount) =>
      item.uid === uid ? item.perLineDiscountedAmount : 0
    )
  }

  getShippingDiscountAmount() {
    return sumBy(this.meta.shippingDiscount, item => item.discountedAmount)
  }

  getAllShippingFees() {
    return this.input.deliveryAddresses?.map(deliveryAddress => ({
      uid: deliveryAddress?.uid,
      shippingFee: deliveryAddress?.shipping?.fee,
    }))
  }

  getFreeQtyFor(uid: string | number) {
    return sumBy(this.meta.itemDiscounts, item =>
      item.uid === uid && item.setFree ? 1 : 0
    )
  }

  getAllItemDiscounts(): number {
    if (this.itemDiscounts?.length) {
      return this.itemDiscounts.reduce(
        (acc: number, item: ItemDiscount) => acc + item.perLineDiscountedAmount,
        0
      )
    }
    return 0
  }

  getCartSubtotal(): number {
    return sumBy(this.items, ({ perItemPrice, qty }) => perItemPrice * qty)
  }

  getTotalDiscountWithoutShipping(): number {
    const totalItemDiscounts = sumBy(
      this.meta.itemDiscounts,
      item => item.perLineDiscountedAmount
    )
    const totalWholeCartDiscount = sumBy(
      this.meta.wholeCartDiscount,
      item => item.discountedAmount
    )
    return totalItemDiscounts + totalWholeCartDiscount
  }

  setApplicableRuleUids(applicableRuleUids: UID[]): void {
    this.meta.applicableRuleUids = applicableRuleUids
  }

  // TODO: Add extra methods there.

  calculateCartItems(uids?: UID[]): CalculatedCartItems {
    return this.input.items.reduce(
      (acc: CalculatedCartItems, cur: CartItem) => {
        if (!isEmpty(uids) && !uids?.includes(cur.uid)) return { ...acc }
        const freeQty = this.getFreeQtyFor(cur.uid)
        const totalDiscounted = this.getDiscountFor(cur.uid)
        const totalAmount = cur.perItemPrice * cur.qty - totalDiscounted
        const totalPerItemPrice = totalAmount / (cur.qty - freeQty)
        return {
          items: [
            ...acc.items,
            {
              ...cur,
              totalAmount,
              totalDiscounted,
              totalPerItemPrice,
              freeQty,
            },
          ],
          totalQty: acc.totalQty + cur.qty - freeQty,
        }
      },
      { items: [], totalQty: 0 }
    )
  }

  /**
   * Utility method return cheapest of CartItem in uid group.
   */
  getCheapestItemFromGroupBySku(uid: string | number): CartItem | undefined {
    const itemGroup = this.input.items.filter(item => item.uid === uid)
    if (itemGroup) {
      return itemGroup.reduce(
        (minPriceItem: CartItem, item: CartItem) =>
          item.perItemPrice < minPriceItem.perItemPrice ? item : minPriceItem,
        itemGroup[0]
      )
    }
    return undefined
  }

  getCartTotalQty(): number {
    return this.input.items.reduce((acc: number, item: CartItem) => {
      return acc + item.qty
    }, 0)
  }

  countSetFreeInItemDiscounts(uid?: UID): number {
    if (this.meta.itemDiscounts?.length) {
      return this.meta.itemDiscounts.filter(itemDiscount => {
        if (uid) {
          return itemDiscount.setFree && itemDiscount.uid === uid
        }
        return itemDiscount.setFree
      }).length
    }
    return 0
  }
}
