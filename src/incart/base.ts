import { ARule } from '../rule'
import { CartItem, Condition, UID } from '..'
import ConditionTypes, {
  CategoryCondition,
  JsonConditionType,
  TagCondition,
} from './conditionTypes'
import { CalculationBuffer } from '../buffer'

export abstract class InCartRule extends ARule {
  protected parsedConditions: Condition[]

  public constructor(
    uid: UID,
    priority: number,
    name: string,
    protected readonly conditions: JsonConditionType[]
  ) {
    super(uid, priority, name)

    this.parsedConditions = this.conditions.map(condition =>
      ConditionTypes.parse(condition, uid)
    )
  }

  public getApplicableCartItemUids(buffer: CalculationBuffer): UID[] | 'all' {
    const o = this.getApplicableCartItems(buffer)
    return o === 'all' ? 'all' : o.map(u => u.uid)
  }

  public getApplicableCartItems(buffer: CalculationBuffer): CartItem[] | 'all' {
    const uids: UID[] = []
    // Accept only one condition per each taxnomy types.
    let catCondition: CategoryCondition | undefined
    let tagCondition: TagCondition | undefined
    for (const cond of this.conditions) {
      if (cond.type === 'uids') {
        uids.push(...cond.uids)
      } else if (cond.type === 'quantity_at_least' && cond.uids) {
        uids.push(...cond.uids)
      } else if (cond.type === 'category') {
        catCondition = cond
      } else if (cond.type === 'tag') {
        tagCondition = cond
      }
    }
    return buffer.filterApplicableCartItems(uids, {
      categories: catCondition?.value && {
        condition: catCondition.value.condition === 'and' ? 'AND' : 'OR',
        exclusion: catCondition.value.condition === 'not',
        values: catCondition.value.values,
      },
      tags: tagCondition?.value && {
        condition: tagCondition.value.condition === 'and' ? 'AND' : 'OR',
        exclusion: tagCondition.value.condition === 'not',
        values: tagCondition.value.values,
      },
    })
  }

  public getConditions(): Condition[] {
    return this.parsedConditions
  }
}
