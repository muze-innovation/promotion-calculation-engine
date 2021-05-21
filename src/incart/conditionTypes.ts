import { Condition, UID } from 'index'
import { CalculationBuffer, CERuleContext } from '../buffer'

import isNil from 'lodash/isNil'
import isEmpty from 'lodash/isEmpty'
import { createHash } from 'crypto'

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

export interface CustomerTypeCondition {
  type: 'customer_type'
  value: 'all' | 'customer' | 'guest'
}

export interface CreditCardPrefixCondition {
  type: 'credit_card_prefix'
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
  | CustomerTypeCondition
  | CreditCardPrefixCondition

export class ConditionTypes {
  static parse(
    context: CERuleContext,
    raw: JsonConditionType,
    salesRuleId: UID
  ): Condition {
    switch (raw.type) {
      case 'subtotal_at_least':
        return {
          check: async (input: CalculationBuffer) => {
            const { items, uids } = context.getApplicableCartItems(input)
            const subtotal = input.getCartSubtotal(items)
            const discountWithoutShipping = input.getTotalDiscountWithoutShipping(
              uids
            )
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
            const cartItems = context.calculateCartItems(input)
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
              const { items } = context.getApplicableCartItems(input)
              if (isEmpty(items)) {
                errors.push(
                  "This promotion doesn't apply to any product in this order."
                )
              }
            }
            return errors
          },
        }
      case 'category':
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
              const { items } = context.getApplicableCartItems(input)
              if (isEmpty(items)) {
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
            const salesRuleUsageCount = input.usageCounts?.find(
              usageCount => usageCount.salesRuleId === salesRuleId
            )
            const totalCount = salesRuleUsageCount?.total
            if (isNil(salesRuleId) || isNil(totalCount)) {
              errors.push('Something went wrong.')
            } else if (totalCount >= raw.value) {
              errors.push('This promotion usage limit has been exceeded.')
            }
            return errors
          },
        }
      case 'uses_per_customer':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            const salesRuleUsageCount = input.usageCounts?.find(
              usageCount => usageCount.salesRuleId === salesRuleId
            )
            const byCustomerCount = salesRuleUsageCount?.byCustomer
            if (isNil(salesRuleId) || isNil(byCustomerCount)) {
              errors.push('Something went wrong.')
            } else if (byCustomerCount >= raw.value) {
              errors.push(
                'Your usage limit for this promotion has been exceeded.'
              )
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
              errors.push(
                "This promotion doesn't apply to your customer group."
              )
            }
            return errors
          },
        }
      case 'customer_type':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            switch (raw.value) {
              case 'all':
                break
              case 'customer':
                if (isNil(input.customer?.uniqueId)) {
                  errors.push(
                    'This promotion is only apply to logged in customer.'
                  )
                }
                break
              case 'guest':
                if (input.customer?.uniqueId) {
                  errors.push('This promotion is only apply to guest.')
                }
                break
              default:
                errors.push('Something went wrong.')
            }
            return errors
          },
        }
      case 'credit_card_prefix':
        return {
          check: async (input: CalculationBuffer) => {
            const errors = []
            if (!input.creditCardPrefix) {
              errors.push('Please enter your credit card and try again.')
            } else {
              const hashedConditionValues = raw.value.map(value =>
                createHash('md5')
                  .update(value)
                  .digest('hex')
              )
              if (!hashedConditionValues.includes(input.creditCardPrefix)) {
                errors.push("This promotion doesn't apply to your credit card.")
              }
            }
            return errors
          },
        }
    }
  }
}

export default ConditionTypes
