import sumBy from 'lodash/sumBy'
import { Action, Condition, UID } from 'index'
import { InCartRule } from './base'
import { CalculationBuffer } from '../buffer'
import { JsonConditionType } from './conditionTypes'
import { ItemDiscount, WholeCartDiscount } from '../discounts'
import { WeightDistribution } from '../discounts/WeightDistribution'

export default class FixedPriceRule extends InCartRule {
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
        const calculatedItems = input.calculateCartItems(uids)
        if (isAllItems) {
          const subtotal = input.getCartSubtotal()
          const discountWithoutShipping = input.getTotalDiscountWithoutShipping()
          const total = subtotal - discountWithoutShipping
          const wholeCartDiscount = input.wholeCartDiscount || []
          const dist = WeightDistribution.make(
            calculatedItems.items.map(item => [`${item.uid}`, item.totalAmount])
          )
          wholeCartDiscount.push(
            WholeCartDiscount.make({
              applicableRuleUid: this.uid,
              dist,
              discountedAmount: total < this.value ? subtotal : this.value,
            })
          )
          return {
            ...input.itemMeta,
            wholeCartDiscount,
          }
        } else if (uids.length) {
          const itemDiscounts = input.itemDiscounts || []
          const totalAmount = sumBy(
            calculatedItems.items,
            item => item.totalAmount
          )
          calculatedItems.items.forEach(item => {
            const discount = (item.totalAmount / totalAmount) * this.value
            itemDiscounts.push(
              ItemDiscount.make({
                applicableRuleUid: this.uid,
                uid: item.uid,
                perLineDiscountedAmount:
                  discount > item.totalAmount ? item.totalAmount : discount,
                setFree: false,
                isPriceTier: item.isPriceTier || false,
              })
            )
          })
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

  getConditions(): Condition[] {
    return this.parsedConditions
  }
}
