import orderBy from 'lodash/orderBy'
import {
  CalculationEngineInput,
  CalculationEngineMeta,
  CalculationEngineOutput,
  CalculationEngineOption,
  Condition,
} from 'index'
import { CalculationBuffer } from './buffer'

export class CalculationEngine {
  async process(
    input: CalculationEngineInput,
    meta: CalculationEngineMeta,
    rawOptions?: CalculationEngineOption
  ): Promise<CalculationEngineOutput> {
    // Sort rules
    const sorted = orderBy(input.rules, ['priority', 'uid'], ['asc', 'desc'])
    const opt = {
      ...rawOptions,
      verbose: !rawOptions?.verbose
        ? (...message: string[]) =>
            rawOptions?.verbose?.apply(['[CLE]', ...message])
        : undefined,
    }

    // Perform reducing
    let buffer = new CalculationBuffer(input, meta)

    for (const rule of sorted) {
      const conditions = rule.getConditions()
      const actions = rule.getActions()
      const results = input.ignoreCondition
        ? []
        : await Promise.all(conditions.map((o: Condition) => o.check(buffer)))
      if (results.includes(false)) {
        continue
      }
      opt.verbose && opt.verbose(`Processing rule "${rule.name}"`)
      const applicableRuleUids = buffer.applicableRuleUids || []
      applicableRuleUids.push(rule.uid)
      buffer.setApplicableRuleUids(applicableRuleUids)
      for (const action of actions) {
        const meta = await action.perform(buffer)
        opt.verbose &&
          opt.verbose(`Result of "${rule.name}" ... ${JSON.stringify(meta)}`)
        buffer = buffer.recreate(meta)
      }
    }

    return buffer
  }
}

export default CalculationEngine
