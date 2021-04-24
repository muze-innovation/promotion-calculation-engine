import { Action, UID } from 'index'
import { InCartRule } from './base'
import { CalculationBuffer } from '../buffer'
import { JsonConditionType } from './conditionTypes'
import { ItemDiscount, WholeCartDiscount } from '../discounts'
import { WeightDistribution } from '../discounts/WeightDistribution'

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
    notEligibleToPriceTier: boolean,
    conditions: JsonConditionType[],
    private readonly value: number
  ) {
    super(
      uid,
      priority,
      name,
      stopRulesProcessing,
      notEligibleToPriceTier,
      conditions
    )
  }

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        const { uids, isAllItems } = this.getApplicableCartItemUids(input)
        if (isAllItems) {
          const subtotal = input.getCartSubtotal()
          const discountWithoutShipping = input.getTotalDiscountWithoutShipping()
          const total = subtotal - discountWithoutShipping
          const wholeCartDiscount = input.wholeCartDiscount || []
          const calculatedItems = input.calculateCartItems(uids)
          const dist = WeightDistribution.make(
            calculatedItems.items.map(item => [`${item.uid}`, item.totalAmount])
          )
          wholeCartDiscount.push(
            WholeCartDiscount.make({
              dist,
              discountedAmount: (total * this.value) / 100,
              setFree: false,
              applicableRuleUid: this.uid,
            })
          )
          return {
            ...input.itemMeta,
            wholeCartDiscount,
          }
        } else if (uids.length) {
          const itemDiscounts = input.itemDiscounts || []
          const cartItems = input.calculateCartItems(uids)
          cartItems.items.forEach(item =>
            itemDiscounts.push(
              ItemDiscount.make({
                uid: item.uid,
                perLineDiscountedAmount: (item.totalAmount * this.value) / 100,
                setFree: false,
                applicableRuleUid: this.uid,
                isPriceTier: item.isPriceTier || false,
              })
            )
          )
          return {
            ...input.itemMeta,
            itemDiscounts,
          }
        }
        return { ...input.itemMeta }
      },
    },
  ]

  getActions(): Action[] {
    return this.actions
  }
}
