import minBy from 'lodash/minBy'

import { Action, CalculatedCartItems, ItemDiscount, UID } from '..'

import { InCartRule } from './base'
import { CalculationBuffer } from '../buffer'
import { JsonConditionType } from './conditionTypes'
import { DiscountType } from 'rule'

export default class BuyXGetYRule extends InCartRule {
  constructor(
    uid: UID,
    priority: number,
    name: string,
    stopRulesProcessing: boolean,
    discountType: DiscountType,
    notEligibleToPriceTier: boolean,
    conditions: JsonConditionType[],
    private readonly x: number,
    private readonly y: number
  ) {
    super(
      uid,
      priority,
      name,
      stopRulesProcessing,
      discountType,
      notEligibleToPriceTier,
      [...conditions, { type: 'quantity_at_least', value: x + 1 }]
    )
    if (discountType === 'wholeCart') {
      throw new Error(`unsupported discountType for buyXgetY: ${discountType}`)
    }
  }

  private getFreeItems(
    cartItems: CalculatedCartItems,
    freeQty: number
  ): ItemDiscount[] {
    const cheapestItem = minBy(cartItems.items, item => item.totalPerItemPrice)
    if (cheapestItem) {
      const leftQty = cheapestItem.qty - cheapestItem.freeQty
      if (leftQty < freeQty) {
        const newCartItems = {
          ...cartItems,
          items: cartItems.items.filter(({ uid }) => cheapestItem.uid !== uid),
        }
        return Array(leftQty)
          .fill(
            ItemDiscount.make({
              uid: cheapestItem.uid,
              perLineDiscountedAmount: cheapestItem.totalPerItemPrice,
              setFree: true,
              applicableRuleUid: this.uid,
            })
          )
          .concat(this.getFreeItems(newCartItems, freeQty - cheapestItem.qty))
      }
      return Array(freeQty).fill(
        ItemDiscount.make({
          uid: cheapestItem.uid,
          perLineDiscountedAmount: cheapestItem.totalPerItemPrice,
          setFree: true,
          applicableRuleUid: this.uid,
        })
      )
    }
    return []
  }

  actions = [
    {
      perform: async (input: CalculationBuffer) => {
        const { items } = this.getApplicableCartItems(input)
        const cartItems = input.calculateCartItems(items)
        const itemDiscounts = input.itemDiscounts ? input.itemDiscounts : []
        const remainder = cartItems.totalQty % (this.x + this.y)
        const freeQty =
          Math.floor(cartItems.totalQty / (this.x + this.y)) * this.y +
          (remainder > this.x ? remainder - this.x : 0)
        if (freeQty) {
          itemDiscounts.push(...this.getFreeItems(cartItems, freeQty))
        }
        return {
          ...input.itemMeta,
          itemDiscounts,
        }
      },
    },
  ]

  getActions(): Action[] {
    return this.actions
  }
}
