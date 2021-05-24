import { RuleUID } from '../typed'
import {
  IWholeCartDiscount,
  IItemDiscount,
  IShippingDiscount,
} from '../discounts'
import {
  CalculationEngineInput,
  CalculationEngineMeta,
  CalculationEngineOutput,
  DeliveryAddress,
  CartItem,
  Customer,
  CalculatedCartItems,
  UID,
  UsageCount,
  UnapplicableRule,
} from 'index'
import { ARule } from '../rule'

import sumBy from 'lodash/sumBy'
import sum from 'lodash/sum'

export interface TaxonomyQuery {
  /**
   * Using 'AND' will need all conditions met.
   * Using 'OR' will need at least one taxonomy met.
   */
  condition: 'AND' | 'OR'

  /**
   * If true, applicable condition will be used to prevent adding product into processing pool.
   */
  exclusion: boolean

  /**
   * List of value to compare against given CartItem
   * If this value contain empty list. The taxnomoy condition is considered as disabled
   */
  values: (string | number)[]
}

class TaxonomyQueryProcessor {
  private valueSet: Set<string>

  constructor(
    public readonly type: 'category' | 'tag',
    public readonly q: TaxonomyQuery
  ) {
    this.valueSet = new Set<string>((q.values || []).map(String))
  }

  get isValid(): boolean {
    return this.valueSet.size > 0
  }

  isMatch(item: CartItem): 'include' | 'exclude' | false {
    const poolToQuery = this.type === 'category' ? item.categories : item.tags
    const matchedCount = poolToQuery.reduce<number>(
      (c, tax) => c + (this.valueSet.has(`${tax}`) ? 1 : 0),
      0
    )
    let matched: boolean
    switch (this.q.condition) {
      case 'AND':
        matched = matchedCount === this.valueSet.size
        break
      case 'OR':
        matched = matchedCount > 0
        break
    }
    return matched
      ? this.q.exclusion
        ? 'exclude'
        : 'include'
      : this.q.exclusion
      ? 'include'
      : false
  }

  static make(type: 'category' | 'tag', q: TaxonomyQuery | undefined) {
    return new TaxonomyQueryProcessor(
      type,
      q || {
        condition: 'AND',
        exclusion: false,
        values: [],
      }
    )
  }
}

export class CalculationBuffer implements CalculationEngineOutput {
  constructor(
    public readonly input: CalculationEngineInput,
    public readonly meta: CalculationEngineMeta,
    public readonly excludePriceTier?: boolean
  ) {}

  public recreate(meta?: CalculationEngineMeta): CalculationBuffer {
    return new CalculationBuffer(this.input, meta ?? this.meta)
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

  get shippingDiscount(): IShippingDiscount[] | undefined {
    return this.meta.shippingDiscount
  }

  get applicableRuleUids(): UID[] | undefined {
    return this.meta.applicableRuleUids
  }

  get unapplicableRules(): UnapplicableRule[] | undefined {
    return this.meta.unapplicableRules
  }

  get itemDiscounts(): IItemDiscount[] | undefined {
    return this.meta.itemDiscounts
  }

  get wholeCartDiscount(): IWholeCartDiscount[] | undefined {
    return this.meta.wholeCartDiscount
  }

  get itemMeta(): CalculationEngineMeta | undefined {
    return this.meta
  }

  get usageCounts(): UsageCount[] | undefined {
    return this.input.usageCounts
  }

  get creditCardPrefix(): string | undefined {
    return this.input.creditCardPrefix
  }

  /**
   * Filter list of items based on UID, categories, tags,
   *
   * Condition supported:
   *
   * One of:
   *    1. selectedUids
   *    1. taxonomies.categories
   *    1. taxonomies.tags
   *
   * In combination with
   *    1. price tier
   *        1. Use 'only' to filter only price tier items.
   *        1. Use 'exclude' to remove all price tier items.
   *        1. Use 'include' (default) to ignore price tier condition.
   *
   * @returns list of CartItems those applicable to certain condition.
   */
  public filterApplicableCartItems(
    selectedUids: UID[],
    priceTier: 'only' | 'exclude' | 'include',
    taxonomies?: { categories?: TaxonomyQuery; tags?: TaxonomyQuery }
  ): { items: CartItem[]; isWholeCartDiscount: boolean } {
    const categories = TaxonomyQueryProcessor.make(
      'category',
      taxonomies?.categories
    )
    const tags = TaxonomyQueryProcessor.make('tag', taxonomies?.tags)
    const uids = new Set<string>(
      (selectedUids && selectedUids.map(String)) || []
    )
    // No conditions applied
    const isWholeCartDiscount =
      uids.size === 0 && !categories.isValid && !tags.isValid
    // Return true if such object should be included in the result
    const filterPriceTier = (item: CartItem): boolean => {
      return (
        priceTier === 'include' ||
        (Boolean(item.isPriceTier)
          ? priceTier === 'only' // item is price-tier, include when mode === 'only'
          : priceTier === 'exclude') // item is not price-tier, include when mode === 'exclude'
      )
    }

    const items = this.items.filter(filterPriceTier).filter(item => {
      // Process UID whitelist
      const itemUid = `${item.uid}`
      if (uids.size > 0 && uids.has(itemUid)) {
        return true
      }
      if (categories.isValid) {
        const r = categories.isMatch(item)
        if (r) {
          return r === 'include'
        }
      }
      if (tags.isValid) {
        const r = tags.isMatch(item)
        if (r) {
          return r === 'include'
        }
      }
      return isWholeCartDiscount
    })
    return {
      items,
      isWholeCartDiscount,
    }
  }

  /**
   * Retrieve total value associated discount values for given UID
   * @param uid
   * @returns
   */
  getItemDiscountAmount(uid: UID): number {
    const wholeCartDiscountAmount = sumBy(this.wholeCartDiscount, discount =>
      discount.getDiscountedAmount(uid)
    )
    const itemDiscountsAmount = sumBy(this.itemDiscounts, discount =>
      discount.isAppliedWith(uid) ? discount.getDiscountedAmount(uid) : 0
    )
    return wholeCartDiscountAmount + itemDiscountsAmount
  }

  /**
   * Retrieve total discounts
   * @returns
   */
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
        (acc: number, item: IItemDiscount) =>
          acc + item.perLineDiscountedAmount,
        0
      )
    }
    return 0
  }

  getCartSubtotal(items?: CartItem[]): number {
    return sumBy(
      items || this.items,
      ({ perItemPrice, qty }) => perItemPrice * qty
    )
  }

  getTotalDiscountWithoutShipping(uids?: UID[]): number {
    if (!uids) {
      const totalWholeCartDiscount = sumBy(
        this.wholeCartDiscount,
        'discountedAmount'
      )
      const totalItemDiscounts = sumBy(
        this.itemDiscounts,
        'perLineDiscountedAmount'
      )
      return totalWholeCartDiscount + totalItemDiscounts
    } else {
      const eachItemDiscounts = uids.map(uid => this.getItemDiscountAmount(uid))
      return sum(eachItemDiscounts)
    }
  }

  pushApplicableRuleUids(applicableRuleUid: RuleUID): void {
    this.meta.applicableRuleUids = this.meta.applicableRuleUids || []
    this.meta.applicableRuleUids.push(applicableRuleUid)
  }

  setUnapplicableRules(unapplicableRules: UnapplicableRule[]): void {
    this.meta.unapplicableRules = unapplicableRules
  }

  // TODO: Add extra methods there.

  calculateCartItems(items?: CartItem[]): CalculatedCartItems {
    const applicableCartItems = items || this.items
    return applicableCartItems.reduce(
      (acc: CalculatedCartItems, cur: CartItem) => {
        const freeQty = this.getFreeQtyFor(cur.uid)
        const totalDiscounted = this.getItemDiscountAmount(cur.uid)
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
   * Find cheapest of CartItem in uid group.
   * @param uid - UID of item
   */
  getCheapestItemFromGroupBySku(uid: string | number): CartItem | undefined {
    const itemGroup = this.items.filter(item => item.uid === uid)
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
    return this.items.reduce((acc: number, item: CartItem) => {
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
