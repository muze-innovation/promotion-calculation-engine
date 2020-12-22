import { ARule } from '../rule'
import { Action, Condition, UID } from 'index'
import { CalculationBuffer } from '../buffer'
import ConditionTypes, { JsonConditionType } from './conditionTypes'

export default class FreeShippingRule extends ARule {
  constructor(
    uid: UID,
    priority: number,
    name: string,
    private readonly conditions: JsonConditionType[]
  ) {
    super(uid, priority, name)
  }

  parsedConditions = this.conditions.map(condition =>
    ConditionTypes.parse(condition, this.uid)
  )

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        const allShippingFees = input.getAllShippingFees()
        const discountAmount = input.getShippingDiscountAmount()
        const shippingDiscount = input.shippingDiscount
          ? input.shippingDiscount
          : []
        if (allShippingFees) {
          allShippingFees.forEach(shippingFee => {
            const discount = shippingFee.shippingFee - discountAmount
            if (discount) {
              shippingDiscount.push({
                uid: shippingFee.uid,
                discountedAmount: discount,
                setFree: true,
                applicableRuleUid: this.uid,
              })
            }
          })
        }
        return {
          ...input.itemMeta,
          shippingDiscount,
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
