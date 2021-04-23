import sumBy from 'lodash/sumBy'
import isEmpty from 'lodash/isEmpty'

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
  private excludePriceTierItems: CartItem[]

  constructor(
    public readonly input: CalculationEngineInput,
    public readonly meta: CalculationEngineMeta,
    public readonly excludePriceTier?: boolean,
    excludePriceTierItems?: CartItem[]
  ) {
    this.excludePriceTierItems =
      excludePriceTierItems ??
      input.items.filter(({ isPriceTier }) => !isPriceTier)
  }

  public recreate(
    meta?: CalculationEngineMeta,
    excludePriceTier?: boolean
  ): CalculationBuffer {
    return new CalculationBuffer(
      this.input,
      meta ?? this.meta,
      excludePriceTier ?? this.excludePriceTier,
      this.excludePriceTierItems
    )
  }

  get deliveryAddresses(): DeliveryAddress[] | undefined {
    return this.input.deliveryAddresses
  }

  get items(): CartItem[] {
    return this.excludePriceTier ? this.excludePriceTierItems : this.input.items
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

  /**
   * Filter list of items based on UID, categories, tags,
   */
  filterApplicableCartItems(
    rawUids: UID[],
    taxonomies?: { categories?: TaxonomyQuery; tags?: TaxonomyQuery }
  ): CartItem[] | 'all' {
    const categories = TaxonomyQueryProcessor.make(
      'category',
      taxonomies?.categories
    )
    const tags = TaxonomyQueryProcessor.make('tag', taxonomies?.tags)
    const uids = new Set<string>((rawUids && rawUids.map(String)) || [])
    if (uids.size === 0 && !categories.isValid && !tags.isValid) {
      return 'all'
    }
    return this.items.filter(item => {
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
      return false
    })
  }

  /**
   * Retrieve total value associated discount values for given UID
   * @param uid
   * @returns
   */
  getDiscountForAmount(uid: UID): number {
    return sumBy(this.itemDiscounts, (item: IItemDiscount) =>
      item.uid === uid ? item.perLineDiscountedAmount : 0
    )
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

  getCartSubtotal(): number {
    return sumBy(this.items, ({ perItemPrice, qty }) => perItemPrice * qty)
  }

  getTotalDiscountWithoutShipping(): number {
    const totalItemDiscounts = sumBy(this.meta.itemDiscounts, item =>
      this.excludePriceTierItems && item.isPriceTier
        ? 0
        : item.perLineDiscountedAmount
    )
    const totalWholeCartDiscount = sumBy(
      this.meta.wholeCartDiscount,
      item => item.discountedAmount
    )
    return totalItemDiscounts + totalWholeCartDiscount
  }

  pushApplicableRuleUids(applicableRuleUid: RuleUID): void {
    this.meta.applicableRuleUids = this.meta.applicableRuleUids || []
    this.meta.applicableRuleUids.push(applicableRuleUid)
  }

  setUnapplicableRules(unapplicableRules: UnapplicableRule[]): void {
    this.meta.unapplicableRules = unapplicableRules
  }

  // TODO: Add extra methods there.

  calculateCartItems(uids?: UID[]): CalculatedCartItems {
    const loadAll = isEmpty(uids)
    return this.items.reduce(
      (acc: CalculatedCartItems, cur: CartItem) => {
        if (!loadAll && !uids?.includes(cur.uid)) return { ...acc }
        const freeQty = this.getFreeQtyFor(cur.uid)
        const totalDiscounted = this.getDiscountForAmount(cur.uid)
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
