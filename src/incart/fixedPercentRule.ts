import sumBy from 'lodash/sumBy'
import { Action, CartItem, UID } from 'index'
import { InCartRule } from './base'
import { CalculationBuffer } from '../buffer'
import { JsonConditionType } from './conditionTypes'
import { ItemDiscount, WholeCartDiscount } from '../discounts'
import { WeightDistribution } from '../discounts/WeightDistribution'
import { DiscountType } from 'rule'

export default class FixedPercentRule extends InCartRule {
  /**
   * @param uid - uid of Rule
   * @param priority - priority of Rule
   * @param name - title of Rule
   * @param conditions - JSON condition
   * @param value - 0-100
   */
  constructor(
    uid: UID,
    priority: number,
    name: string,
    stopRulesProcessing: boolean,
    discountType: DiscountType,
    notEligibleToPriceTier: boolean,
    conditions: JsonConditionType[],
    private readonly value: number
  ) {
    super(
      uid,
      priority,
      name,
      stopRulesProcessing,
      discountType,
      notEligibleToPriceTier,
      conditions
    )
  }

  private discountWholeCart(input: CalculationBuffer, items: CartItem[]) {
    const calculatedItems = input.calculateCartItems(items)
    const totalAmount = sumBy(calculatedItems.items, item => item.totalAmount)
    const wholeCartDiscount = input.wholeCartDiscount || []
    const dist = WeightDistribution.make(
      calculatedItems.items.map(item => [`${item.uid}`, item.totalAmount])
    )
    wholeCartDiscount.push(
      WholeCartDiscount.make({
        dist,
        discountedAmount: (totalAmount * this.value) / 100,
        setFree: false,
        applicableRuleUid: this.uid,
      })
    )
    return {
      ...input.itemMeta,
      wholeCartDiscount,
    }
  }

  private discountPerItem(input: CalculationBuffer, items: CartItem[]) {
    const calculatedItems = input.calculateCartItems(items)
    const itemDiscounts = input.itemDiscounts || []
    calculatedItems.items.forEach(item =>
      itemDiscounts.push(
        ItemDiscount.make({
          uid: item.uid,
          perLineDiscountedAmount: (item.totalAmount * this.value) / 100,
          setFree: false,
          applicableRuleUid: this.uid,
        })
      )
    )
    return {
      ...input.itemMeta,
      itemDiscounts,
    }
  }

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        const {
          items,
          uids,
          isWholeCartDiscount,
        } = this.getApplicableCartItems(input)
        switch (this.discountType) {
          case 'wholeCart':
            return this.discountWholeCart(input, items)
          case 'perItem':
            return this.discountPerItem(input, items)
          case 'auto':
            if (isWholeCartDiscount) return this.discountWholeCart(input, items)
            else if (uids.length) return this.discountPerItem(input, items)
            return { ...input.itemMeta }
        }
      },
    },
  ]

  getActions(): Action[] {
    return this.actions
  }
}
