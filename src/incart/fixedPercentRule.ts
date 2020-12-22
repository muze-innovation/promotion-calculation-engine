import isEmpty from 'lodash/isEmpty'
import { ARule } from '../rule'
import { Action, Condition, UID } from 'index'
import { CalculationBuffer } from '../buffer'
import ConditionTypes, { JsonConditionType } from './conditionTypes'

export default class FixedPercentRule extends ARule {
  constructor(
    uid: UID,
    priority: number,
    name: string,
    private readonly conditions: JsonConditionType[],
    private readonly value: number,
    private readonly uids?: UID[]
  ) {
    super(uid, priority, name)
  }

  parsedConditions = this.conditions.map(condition =>
    ConditionTypes.parse(condition, this.uid)
  )

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        if (isEmpty(this.uids)) {
          const subtotal = input.getCartSubtotal()
          const discountWithoutShipping = input.getTotalDiscountWithoutShipping()
          const total = subtotal - discountWithoutShipping
          const wholeCartDiscount = input.wholeCartDiscount
            ? input.wholeCartDiscount
            : []
          wholeCartDiscount.push({
            discountedAmount: (total * this.value) / 100,
            setFree: false,
            applicableRuleUid: this.uid,
          })
          return {
            ...input.itemMeta,
            wholeCartDiscount,
          }
        } else {
          const itemDiscounts = input.itemDiscounts ? input.itemDiscounts : []
          const cartItems = input.calculateCartItems(this.uids)
          cartItems.items.forEach(item =>
            itemDiscounts.push({
              uid: item.uid,
              perLineDiscountedAmount: (item.totalAmount * this.value) / 100,
              setFree: false,
              applicableRuleUid: this.uid,
            })
          )
          return {
            ...input.itemMeta,
            itemDiscounts,
          }
        }
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
