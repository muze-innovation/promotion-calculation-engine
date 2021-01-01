import { Action } from 'index'
import { InCartRule } from './base'
import { CalculationBuffer } from '../buffer'

export default class FreeShippingRule extends InCartRule {

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
}
