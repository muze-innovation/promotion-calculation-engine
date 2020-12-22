import orderBy from 'lodash/orderBy'
import {
  CalculationEngineInput,
  CalculationEngineMeta,
  CalculationEngineOutput,
  Condition,
} from './index'
import { CalculationBuffer } from './buffer'

export class CalculationEngine {
  async process(
    input: CalculationEngineInput,
    meta: CalculationEngineMeta
  ): Promise<CalculationEngineOutput> {
    // Sort rules
    const sorted = orderBy(input.rules, ['priority', 'uid'], ['asc', 'desc'])

    // Perform reducing
    let buffer = new CalculationBuffer(input, meta)

    for (const rule of sorted) {
      const conditions = rule.getConditions()
      const actions = rule.getActions()
      const results = !input.ignoreCondition
        ? await Promise.all(conditions.map((o: Condition) => o.check(buffer)))
        : []
      if (results.includes(false)) {
        continue
      }
      const applicableRuleUids = buffer.applicableRuleUids || []
      applicableRuleUids.push(rule.uid)
      buffer.setApplicableRuleUids(applicableRuleUids)
      for (const action of actions) {
        const meta = await action.perform(buffer)
        buffer = buffer.recreate(meta)
      }
    }

    return buffer
  }
}

export default CalculationEngine
