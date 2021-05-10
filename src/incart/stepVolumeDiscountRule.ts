import sumBy from 'lodash/sumBy'
import minBy from 'lodash/minBy'
import { Action, CartItem, UID } from 'index'
import { InCartRule } from './base'
import { JsonConditionType } from './conditionTypes'
import { CalculationBuffer } from '../buffer'
import { ItemDiscount, WholeCartDiscount } from '../discounts'
import { WeightDistribution } from '../discounts/WeightDistribution'
import { DiscountType } from 'rule'

interface Step {
  startQty: number
  endQty: number | null
  discount: number
  type: 'percent' | 'fixed'
}

export default class StepVolumeDiscountRule extends InCartRule {
  private static modifyCondition(
    conditions: JsonConditionType[],
    steps: Step[]
  ): JsonConditionType[] {
    const minQuantityRequired = minBy(steps, step => step.startQty)?.startQty
    if (minQuantityRequired)
      return [
        ...conditions,
        { type: 'quantity_at_least', value: minQuantityRequired },
      ]
    return conditions
  }

  constructor(
    uid: UID,
    priority: number,
    name: string,
    stopRulesProcessing: boolean,
    discountType: DiscountType,
    notEligibleToPriceTier: boolean,
    conditions: JsonConditionType[],
    private readonly steps: Step[]
  ) {
    super(
      uid,
      priority,
      name,
      stopRulesProcessing,
      discountType,
      notEligibleToPriceTier,
      StepVolumeDiscountRule.modifyCondition(conditions, steps)
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

  private discountWholeCart(input: CalculationBuffer, items: CartItem[]) {
    const calculatedItems = input.calculateCartItems(items)
    const totalAmount = sumBy(calculatedItems.items, item => item.totalAmount)
    const step = this.processStep(calculatedItems.totalQty)
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
  }

  private discountPerItem(input: CalculationBuffer, items: CartItem[]) {
    const calculatedItems = input.calculateCartItems(items)
    const totalAmount = sumBy(calculatedItems.items, item => item.totalAmount)
    const step = this.processStep(calculatedItems.totalQty)
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
            perLineDiscountedAmount: (item.totalAmount * step.discount) / 100,
            setFree: false,
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
          })
        )
      }
    })
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
          isWholeCartDiscount,
          uids,
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
