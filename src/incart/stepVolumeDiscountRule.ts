import isEmpty from 'lodash/isEmpty'
import sumBy from 'lodash/sumBy'
import { ARule } from "../rule";
import { CalculationBuffer } from "../buffer";
import { Action, CalculationEngineMeta, Condition, UID } from "../index";
import ConditionTypes, { JsonConditionType } from './conditionTypes';

interface Step {
  startQty: number
  endQty: number | null
  discount: number
  type: "percent" | "fixed"
}

export default class StepVolumeDiscountRule extends ARule {
  constructor(
    uid: UID,
    priority: number,
    name: string,
    private readonly conditions: JsonConditionType[],
    private readonly steps: Step[],
    private readonly uids: UID[],
  ) {
    super(uid, priority, name)
  }

  parsedConditions = this.conditions.map((condition) => ConditionTypes.parse(condition, this.uid))

  processStep = (totalQty: number) => this.steps.find(step => {
    if (!step.endQty) {
      return totalQty >= step.startQty
    }
    return totalQty >= step.startQty && totalQty <= step.endQty
  })

  actions = [
    {
      perform: async (
        calculationBuffer: CalculationBuffer
      ): Promise<CalculationEngineMeta> => {
        const itemsToProcess = calculationBuffer.calculateCartItems(this.uids)
        const totalAmount = sumBy(itemsToProcess.items, (item) => item.totalAmount)
        const step = this.processStep(itemsToProcess.totalQty)
        if (!isEmpty(this.uids)) {
          const itemDiscounts = calculationBuffer.itemDiscounts
            ? calculationBuffer.itemDiscounts
            : []
          itemsToProcess.items.forEach((item) => {
            if (step) {
              if (step.type === "percent") {
                itemDiscounts.push({
                  applicableRuleUid: this.uid,
                  uid: item.uid,
                  perLineDiscountedAmount:
                    (item.totalAmount * step.discount) / 100,
                  setFree: false,
                })
              }
              else if (step.type === "fixed") {
                const discount = (item.totalAmount / totalAmount) * step.discount
                itemDiscounts.push({
                  applicableRuleUid: this.uid,
                  uid: item.uid,
                  perLineDiscountedAmount: discount > item.totalAmount ? item.totalAmount : discount,
                  setFree: false,
                })
              }
            }
          })
          return {
            ...calculationBuffer.itemMeta,
            itemDiscounts
          }
        } else {
          const wholeCartDiscount = calculationBuffer.wholeCartDiscount
            ? calculationBuffer.wholeCartDiscount
            : []
          if (step && step.type === "percent") {
            wholeCartDiscount.push({
              discountedAmount: (totalAmount * step.discount) / 100,
              setFree: false,
              applicableRuleUid: this.uid
            })
          } else if (step && step.type === "fixed") {
            wholeCartDiscount.push({
              discountedAmount: step.discount > totalAmount ? totalAmount : step.discount,
              setFree: false,
              applicableRuleUid: this.uid
            })
          }
          return {
            ...calculationBuffer.itemMeta,
            wholeCartDiscount,
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