import { RuleUID } from '../typed'
import {
  IItemDiscount,
  IShippingDiscount,
  IWholeCartDiscount,
} from '../discounts'
import { CalculationEngineMeta, UnapplicableRule } from '..'

// Implemenation of CalculationEngineMeta
export class CEMeta implements CalculationEngineMeta {
  /**
   * all rules id that can apply to cart
   */
  applicableRuleUids: RuleUID[] = []

  /**
   * all rules id and error that can't apply to cart
   * along with its errors
   */
  unapplicableRules: UnapplicableRule[] = []

  /**
   * Discount calculated per items.
   */
  itemDiscounts: IItemDiscount[] = []

  /**
   * Discount per shipping information given
   */
  shippingDiscount: IShippingDiscount[] = []

  /**
   * Discount per whole cart.
   */
  wholeCartDiscount: IWholeCartDiscount[] = []
}
