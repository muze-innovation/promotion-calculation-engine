import sumBy from 'lodash/sumBy'
import { Action, UID } from 'index'
import { InCartRule } from './base'
import { JsonConditionType } from './conditionTypes'
import { CalculationBuffer } from '../buffer'
import { ItemDiscount, WholeCartDiscount } from '../discounts'
import { WeightDistribution } from '../discounts/WeightDistribution'

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
    stopRulesProcessing: boolean,
    notEligibleToPriceTier: boolean,
    conditions: JsonConditionType[],
    private readonly steps: Step[]
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

  /**
   * Decide which step it should be computed.
   * @param totalQty
   * @returns Step object that matched given endQty
   */
  private processStep(totalQty: number) {
    return this.steps.find(step => {
      if (!step.endQty) {
        return totalQty >= step.startQty
      }
      return totalQty >= step.startQty && totalQty <= step.endQty
    })
  }

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        let { isAllItems, uids } = this.getApplicableCartItemUids(input)
        const calculatedItems = input.calculateCartItems(uids)
        const totalAmount = sumBy(
          calculatedItems.items,
          item => item.totalAmount
        )
        const step = this.processStep(calculatedItems.totalQty)
        if (isAllItems) {
          const wholeCartDiscount = input.wholeCartDiscount || []
          const dist = WeightDistribution.make(
            calculatedItems.items.map(item => [`${item.uid}`, item.totalAmount])
          )
          if (step && step.type === 'percent') {
            wholeCartDiscount.push(
              WholeCartDiscount.make({
                discountedAmount: (totalAmount * step.discount) / 100,
                setFree: false,
                applicableRuleUid: this.uid,
                dist,
              })
            )
          } else if (step && step.type === 'fixed') {
            wholeCartDiscount.push(
              WholeCartDiscount.make({
                discountedAmount:
                  step.discount > totalAmount ? totalAmount : step.discount,
                setFree: false,
                applicableRuleUid: this.uid,
                dist,
              })
            )
          }
          return {
            ...input.itemMeta,
            wholeCartDiscount,
          }
        } else if (uids.length > 0) {
          const itemDiscounts = input.itemDiscounts || []
          calculatedItems.items.forEach(item => {
            if (!step) {
              return
            }
            if (step.type === 'percent') {
              itemDiscounts.push(
                ItemDiscount.make({
                  applicableRuleUid: this.uid,
                  uid: item.uid,
                  perLineDiscountedAmount:
                    (item.totalAmount * step.discount) / 100,
                  setFree: false,
                  isPriceTier: item.isPriceTier || false,
                })
              )
            } else if (step.type === 'fixed') {
              const discount = (item.totalAmount / totalAmount) * step.discount
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
            }
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
}
