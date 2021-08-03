import sumBy from 'lodash/sumBy'
import minBy from 'lodash/minBy'
import isNil from 'lodash/isNil'
import Fraction from 'fraction.js'

import { Action, CartItem, UID } from 'index'
import { InCartRule } from './base'
import { JsonConditionType } from './conditionTypes'
import { CalculationBuffer } from '../buffer'
import { ItemDiscount, WholeCartDiscount } from '../discounts'
import { WeightDistribution } from '../discounts/WeightDistribution'
import { sumBy as sumByFraction } from '../utils'
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
    private readonly steps: Step[],
    private readonly maxDiscount?: number
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
    if (!isNil(maxDiscount) && !(maxDiscount > 0)) {
      throw new Error('maxDiscount must be number greater than 0.')
    }
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
      const discount = (totalAmount * step.discount) / 100
      const totalDiscount = this.maxDiscount
        ? Math.min(discount, this.maxDiscount)
        : discount
      wholeCartDiscount.push(
        WholeCartDiscount.make({
          discountedAmount: totalDiscount,
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
    const totalAmount = sumByFraction(
      calculatedItems.items,
      item => item.totalAmount
    )
    const step = this.processStep(calculatedItems.totalQty)
    const itemDiscounts = input.itemDiscounts || []
    calculatedItems.items.forEach(item => {
      if (!step) {
        return
      }
      if (step.type === 'percent') {
        const discount = totalAmount.mul(step.discount).div(100)
        const totalDiscount =
          this.maxDiscount && discount.valueOf() > this.maxDiscount
            ? new Fraction(this.maxDiscount)
            : discount
        const itemTotalAmountRatio = totalAmount.valueOf()
          ? new Fraction(item.totalAmount).div(totalAmount)
          : new Fraction(0)
        itemDiscounts.push(
          ItemDiscount.make({
            applicableRuleUid: this.uid,
            uid: item.uid,
            perLineDiscountedAmount: totalDiscount
              .mul(itemTotalAmountRatio)
              .valueOf(), // Use this to mitigate signature changes
            setFree: false,
          })
        )
      } else if (step.type === 'fixed') {
        const discount = new Fraction(item.totalAmount)
          .div(totalAmount)
          .mul(step.discount)
        itemDiscounts.push(
          ItemDiscount.make({
            applicableRuleUid: this.uid,
            uid: item.uid,
            perLineDiscountedAmount:
              discount.valueOf() > item.totalAmount
                ? item.totalAmount
                : discount.valueOf(), // Use this to mitigate signature changes
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
