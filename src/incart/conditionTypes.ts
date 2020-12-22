import isNil from 'lodash/isNil'
import isEmpty from 'lodash/isEmpty'
import { Condition, UID } from 'index'
import { CalculationBuffer } from '../buffer'

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

export class ConditionTypes {
  static parse(raw: JsonConditionType, salesRuleId?: UID): Condition {
    switch (raw.type) {
      case 'subtotal_at_least':
        return {
          check: async (input: CalculationBuffer) => {
            const subtotal = input.getCartSubtotal()
            const discountWithoutShipping = input.getTotalDiscountWithoutShipping()
            const total = subtotal - discountWithoutShipping
            return total >= raw.value
          },
        }
      case 'quantity_at_least':
        return {
          check: async (input: CalculationBuffer) => {
            const cartItems = input.calculateCartItems(raw.uids)
            return cartItems.totalQty >= raw.value
          },
        }
      case 'new_customer':
        return {
          check: async (input: CalculationBuffer) => {
            return !!input?.customer?.isNewCustomer
          },
        }
      case 'uids':
        return {
          check: async (input: CalculationBuffer) => {
            if (isEmpty(raw.uids)) return false
            return input.items.some(item => raw.uids.includes(item.uid))
          },
        }
      case 'usage_limit':
        return {
          check: async (input: CalculationBuffer) => {
            if (isNil(salesRuleId) || isNil(input.customer?.uniqueId))
              return false

            const salesRuleUsageCount = input.usageCounts?.find(
              usageCount => usageCount.salesRuleId === salesRuleId
            )
            const totalCount = salesRuleUsageCount?.total
            return !isNil(totalCount) ? totalCount < raw.value : false
          },
        }
      case 'uses_per_customer':
        return {
          check: async (input: CalculationBuffer) => {
            if (isNil(salesRuleId)) return false

            const salesRuleUsageCount = input.usageCounts?.find(
              usageCount => usageCount.salesRuleId === salesRuleId
            )
            const byCustomerCount = salesRuleUsageCount?.byCustomer
            return !isNil(byCustomerCount) ? byCustomerCount < raw.value : false
          },
        }
      case 'customer_group':
        return {
          check: async (input: CalculationBuffer) => {
            const setCustomerGroups = new Set(input?.customer?.customerGroups)
            return raw.value.every(customerGroup =>
              setCustomerGroups.has(customerGroup)
            )
          },
        }
    }
  }
}

export default ConditionTypes
