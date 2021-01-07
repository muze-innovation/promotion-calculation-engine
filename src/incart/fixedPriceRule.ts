import sumBy from 'lodash/sumBy'
import { Action, Condition, UID } from 'index'
import { InCartRule } from './base'
import { CalculationBuffer } from '../buffer'
import { JsonConditionType } from './conditionTypes'

export default class FixedPriceRule extends InCartRule {
  constructor(
    uid: UID,
    priority: number,
    name: string,
    conditions: JsonConditionType[],
    private readonly value: number
  ) {
    super(uid, priority, name, conditions)
  }

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        const uids = this.getApplicableCartItemUids(input)
        if (uids === 'all') {
          const subtotal = input.getCartSubtotal()
          const discountWithoutShipping = input.getTotalDiscountWithoutShipping()
          const total = subtotal - discountWithoutShipping
          const wholeCartDiscount = input.wholeCartDiscount
            ? input.wholeCartDiscount
            : []
          wholeCartDiscount.push({
            discountedAmount: total < this.value ? subtotal : this.value,
            setFree: false,
            applicableRuleUid: this.uid,
          })
          return {
            ...input.itemMeta,
            wholeCartDiscount,
          }
        } else if (uids.length) {
          const itemDiscounts = input.itemDiscounts ? input.itemDiscounts : []
          const itemsToProcess = input.calculateCartItems(uids)
          const totalAmount = sumBy(
            itemsToProcess.items,
            item => item.totalAmount
          )
          itemsToProcess.items.forEach(item => {
            const discount = (item.totalAmount / totalAmount) * this.value
            itemDiscounts.push({
              applicableRuleUid: this.uid,
              uid: item.uid,
              perLineDiscountedAmount:
                discount > item.totalAmount ? item.totalAmount : discount,
              setFree: false,
            })
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
