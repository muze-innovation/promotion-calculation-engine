import isNil from 'lodash/isNil'
import isEmpty from 'lodash/isEmpty'
import keyBy from 'lodash/keyBy'
import { Condition, UID } from 'index'
import { CalculationBuffer } from '../buffer'
import { ARule } from 'rule'
import { CERuleContext } from 'buffer/CERuleContext'

export interface SubTotalAtLeastCondition {
  type: 'subtotal_at_least'
  value: number
}

export interface QuantityAtLeastCondition {
  type: 'quantity_at_least'
  value: number
  uids?: UID[]
}

export interface NewCustomerCondition {
  type: 'new_customer'
}

export interface UidCondition {
  type: 'uids'
  uids: UID[]
}

export interface CategoryCondition {
  type: 'category'
  value: {
    condition: 'and' | 'or' | 'not'
    values: string[]
  }
}

export interface TagCondition {
  type: 'tag'
  value: {
    condition: 'and' | 'or' | 'not'
    values: string[]
  }
}

export interface UsageLimitCondition {
  type: 'usage_limit'
  value: number
}

export interface UsesPerCustomerCondition {
  type: 'uses_per_customer'
  value: number
}

export interface CustomerGroupCondition {
  type: 'customer_group'
  value: string[]
}

export type JsonConditionType =
  | QuantityAtLeastCondition
  | SubTotalAtLeastCondition
  | NewCustomerCondition
  | UidCondition
  | UsageLimitCondition
  | UsesPerCustomerCondition
  | CustomerGroupCondition
  | CategoryCondition
  | TagCondition

export class ConditionTypes {
  static parse(
    context: CERuleContext,
    raw: JsonConditionType,
    salesRuleId: UID,
    removePriceTierItemsBeforeApply: boolean
  ): Condition {
    switch (raw.type) {
      case 'subtotal_at_least':
        return {
          check: async (input: CalculationBuffer) => {
            const subtotal = input.getCartSubtotal()
            const discountWithoutShipping = input.getTotalDiscountWithoutShipping()
            const total = subtotal - discountWithoutShipping
            const errors = []
            if (total < raw.value) {
              errors.push(
                "Subtotal amount doesn't reach the minimum requirement."
              )
            }
            return errors
          },
        }
      case 'quantity_at_least':
        return {
          check: async (input: CalculationBuffer) => {
            const cartItems = input.calculateCartItems(raw.uids)
            const errors = []
            if (cartItems.totalQty < raw.value) {
              errors.push(
                "Item quantities doesn't reach the minimum requirement."
              )
            }
            return errors
          },
        }
      case 'new_customer':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            if (!input?.customer?.isNewCustomer) {
              errors.push('This promotion only apply to new customer.')
            }
            return errors
          },
        }
      case 'uids':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            if (isEmpty(raw.uids)) {
              errors.push("This promotion doesn't apply to any product.")
            } else {
              const conditionUids = keyBy(raw.uids)
              if (!input.items.some(item => conditionUids[item.uid])) {
                errors.push(
                  "This promotion doesn't apply to any product in this order."
                )
              }
            }
            return errors
          },
        }
      case 'category':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            if (
              !raw.value ||
              !raw.value.values ||
              raw.value.values.length <= 0
            ) {
              errors.push('Something went wrong.')
            } else {
              const found = input.filterApplicableCartItems(
                [],
                removePriceTierItemsBeforeApply ? 'exclude' : 'include',
                {
                  categories: {
                    condition: raw.value.condition === 'and' ? 'AND' : 'OR',
                    exclusion: raw.value.condition === 'not',
                    values: raw.value.values.map(o => `${o}`),
                  },
                }
              )
              if (isEmpty(found)) {
                errors.push(
                  "This promotion doesn't apply to any product in this order."
                )
              }
            }
            return errors
          },
        }
      case 'tag':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            if (
              !raw.value ||
              !raw.value.values ||
              raw.value.values.length <= 0
            ) {
              errors.push('Something went wrong.')
            } else {
              const found = input.filterApplicableCartItems(
                [],
                removePriceTierItemsBeforeApply ? 'exclude' : 'include',
                {
                  tags: {
                    condition: raw.value.condition === 'and' ? 'AND' : 'OR',
                    exclusion: raw.value.condition === 'not',
                    values: raw.value.values,
                  },
                }
              )
              if (isEmpty(found)) {
                errors.push(
                  "This promotion doesn't apply to any product in this order."
                )
              }
            }
            return errors
          },
        }
      case 'usage_limit':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            if (isNil(salesRuleId)) {
              errors.push('Something went wrong.')
            } else {
              const salesRuleUsageCount = input.usageCounts?.find(
                usageCount => usageCount.salesRuleId === salesRuleId
              )
              const totalCount = salesRuleUsageCount?.total
              if (isNil(totalCount) || isNil(input.customer?.uniqueId)) {
                errors.push('This promotion is only apply to a member.')
              } else if (totalCount >= raw.value) {
                errors.push('This promotion usage limit has been exceeded.')
              }
            }
            return errors
          },
        }
      case 'uses_per_customer':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            if (isNil(salesRuleId)) {
              errors.push('Something went wrong.')
            } else {
              const salesRuleUsageCount = input.usageCounts?.find(
                usageCount => usageCount.salesRuleId === salesRuleId
              )
              const byCustomerCount = salesRuleUsageCount?.byCustomer
              if (isNil(byCustomerCount) || isNil(input.customer?.uniqueId)) {
                errors.push('This promotion is only apply to a member.')
              } else if (byCustomerCount >= raw.value) {
                errors.push(
                  'Your usage limit for this promotion has been exceeded.'
                )
              }
            }
            return errors
          },
        }
      case 'customer_group':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            const setCustomerGroups = new Set(input?.customer?.customerGroups)
            if (
              !raw.value.every(customerGroup =>
                setCustomerGroups.has(customerGroup)
              )
            ) {
              errors.push("This promotion doesn't apply to your customer group")
            }
            return errors
          },
        }
    }
  }
}

export default ConditionTypes
