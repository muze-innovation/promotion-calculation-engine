import { ARule } from "../rule";
import sumBy from 'lodash/sumBy';
import { Action, Condition,UID } from "../index";
import { CalculationBuffer } from "../buffer";
import ConditionTypes, { JsonConditionType } from './conditionTypes';

export default class FixedPriceRule extends ARule {
  constructor(
    uid: UID,
    priority: number,
    name: string,
    private readonly conditions: JsonConditionType[],
    private readonly value: number,
    private readonly uids: UID[],
  ) {
    super(uid, priority, name)
  }

  parsedConditions = this.conditions.map((condition) => ConditionTypes.parse(condition, this.uid))

  actions = [{
    perform: async (input: CalculationBuffer) => {
      if (this.uids.length) {
        const itemDiscounts = input.itemDiscounts
          ? input.itemDiscounts
          : []
        const itemsToProcess = input.calculateCartItems(this.uids)
        const totalAmount = sumBy(itemsToProcess.items, (item) => item.totalAmount)
        itemsToProcess.items.forEach((item) => {
          const discount = (item.totalAmount / totalAmount) * this.value
          itemDiscounts.push({
            applicableRuleUid: this.uid,
            uid: item.uid,
            perLineDiscountedAmount: discount > item.totalAmount ? item.totalAmount : discount,
            setFree: false,
          })
        })
        return {
          ...input.itemMeta,
          itemDiscounts
        }
      } else {
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
          wholeCartDiscount
        }
      }
    }
  }]

  getActions(): Action[] {
    return this.actions
  }

  getConditions(): Condition[] {
    return this.parsedConditions
  }
}
