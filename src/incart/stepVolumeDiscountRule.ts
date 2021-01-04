import sumBy from 'lodash/sumBy'
import { Action, UID } from 'index'
import { InCartRule } from './base'
import { JsonConditionType } from './conditionTypes'
import { CalculationBuffer } from '../buffer'

interface Step {
  startQty: number
  endQty: number | null
  discount: number
  type: 'percent' | 'fixed'
}

export default class StepVolumeDiscountRule extends InCartRule {
  constructor(
    uid: UID,
    priority: number,
    name: string,
    conditions: JsonConditionType[],
    private readonly steps: Step[]
  ) {
    super(uid, priority, name, conditions)
  }

  processStep = (totalQty: number) =>
    this.steps.find(step => {
      if (!step.endQty) {
        return totalQty >= step.startQty
      }
      return totalQty >= step.startQty && totalQty <= step.endQty
    })

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        let uids = this.getApplicableCartItemUids(input)
        const itemsToProcess = input.calculateCartItems(
          uids === 'all' ? [] : uids
        )
        const totalAmount = sumBy(
          itemsToProcess.items,
          item => item.totalAmount
        )
        const step = this.processStep(itemsToProcess.totalQty)
        if (uids !== 'all' && uids.length > 0) {
          const itemDiscounts = input.itemDiscounts ? input.itemDiscounts : []
          itemsToProcess.items.forEach(item => {
            if (step) {
              if (step.type === 'percent') {
                itemDiscounts.push({
                  applicableRuleUid: this.uid,
                  uid: item.uid,
                  perLineDiscountedAmount:
                    (item.totalAmount * step.discount) / 100,
                  setFree: false,
                })
              } else if (step.type === 'fixed') {
                const discount =
                  (item.totalAmount / totalAmount) * step.discount
                itemDiscounts.push({
                  applicableRuleUid: this.uid,
                  uid: item.uid,
                  perLineDiscountedAmount:
                    discount > item.totalAmount ? item.totalAmount : discount,
                  setFree: false,
                })
              }
            }
          })
          return {
            ...input.itemMeta,
            itemDiscounts,
          }
        } else {
          const wholeCartDiscount = input.wholeCartDiscount
            ? input.wholeCartDiscount
            : []
          if (step && step.type === 'percent') {
            wholeCartDiscount.push({
              discountedAmount: (totalAmount * step.discount) / 100,
              setFree: false,
              applicableRuleUid: this.uid,
            })
          } else if (step && step.type === 'fixed') {
            wholeCartDiscount.push({
              discountedAmount:
                step.discount > totalAmount ? totalAmount : step.discount,
              setFree: false,
              applicableRuleUid: this.uid,
            })
          }
          return {
            ...input.itemMeta,
            wholeCartDiscount,
          }
        }
      },
    },
  ]

  getActions(): Action[] {
    return this.actions
  }
}
