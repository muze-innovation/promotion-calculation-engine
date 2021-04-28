import { Condition, UID, CartItem } from '..'
import { JsonConditionType } from './conditionTypes'
import {
  CalculationBuffer,
  TaxonomyQuery,
  PriceTierFilterOption,
} from '../buffer'

import { ARule } from '../rule'
import ConditionTypes from './conditionTypes'
import { CERuleContext } from '../buffer'

export abstract class InCartRule extends ARule {
  protected parsedConditions: Condition[]
  protected context: CERuleContext

  public constructor(
    uid: UID,
    priority: number,
    name: string,
    stopRulesProcessing: boolean,
    notEligibleToPriceTier: boolean,
    protected readonly conditions: JsonConditionType[]
  ) {
    super(uid, priority, name, stopRulesProcessing, notEligibleToPriceTier)

    const uids: UID[] = []
    let priceTier: PriceTierFilterOption = this.notEligibleToPriceTier
      ? 'exclude'
      : 'include'
    let categories: TaxonomyQuery | undefined = undefined
    let tags: TaxonomyQuery | undefined = undefined
    for (const cond of this.conditions) {
      if (cond.type === 'uids') {
        uids.push(...cond.uids)
      } else if (cond.type === 'quantity_at_least' && cond.uids) {
        uids.push(...cond.uids)
      } else if (cond.type === 'category') {
        categories = cond.value && {
          condition: cond.value.condition === 'and' ? 'AND' : 'OR',
          exclusion: cond.value.condition === 'not',
          values: cond.value.values,
        }
      } else if (cond.type === 'tag') {
        tags = cond.value && {
          condition: cond.value.condition === 'and' ? 'AND' : 'OR',
          exclusion: cond.value.condition === 'not',
          values: cond.value.values,
        }
      }
    }
    this.context = new CERuleContext(uids, priceTier, {
      categories,
      tags,
    })

    this.parsedConditions = this.conditions.map(condition =>
      ConditionTypes.parse(this.context, condition, uid)
    )
  }

  public getApplicableCartItems(
    buffer: CalculationBuffer
  ): { items: CartItem[]; uids: UID[]; isWholeCartDiscount: boolean } {
    return this.context.getApplicableCartItems(buffer)
  }

  public getConditions(): Condition[] {
    return this.parsedConditions
  }
}
