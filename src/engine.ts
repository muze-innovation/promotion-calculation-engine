import orderBy from 'lodash/orderBy'
import isEmpty from 'lodash/isEmpty'
import flatten from 'lodash/flatten'
import uniq from 'lodash/uniq'
import {
  CalculationEngineInput,
  CalculationEngineMeta,
  CalculationEngineOutput,
  CalculationEngineOption,
  Condition,
  UnapplicableRule,
  UID,
} from 'index'
import { CalculationBuffer } from './buffer'

const appendRuleErrors = (
  previousUnapplicableRules: UnapplicableRule[] = [],
  ruleUid: UID,
  error: string[]
): UnapplicableRule[] => [
  ...previousUnapplicableRules,
  {
    uid: ruleUid,
    errors: error,
  },
]

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
    let stopRulesProcessing = false
    for (const rule of sorted) {
      // Add error to unprocessed rules.
      const previousUnapplicableRules = buffer.unapplicableRules
      if (stopRulesProcessing) {
        buffer.setUnapplicableRules(
          appendRuleErrors(previousUnapplicableRules, rule.uid, [
            'This promotion cannot be applied.',
          ])
        )
        continue
      }

      const conditions = rule.getConditions()
      const actions = rule.getActions()
      const conditionResults = !input.ignoreCondition
        ? await Promise.all(conditions.map((o: Condition) => o.check(buffer)))
        : []
      const flattenConditionResults = uniq(flatten(conditionResults))
      if (!isEmpty(flattenConditionResults)) {
        buffer.setUnapplicableRules(
          appendRuleErrors(
            previousUnapplicableRules,
            rule.uid,
            flattenConditionResults
          )
        )
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

      // Discard subsequence rules.
      if (rule.stopRulesProcessing) {
        stopRulesProcessing = true
      }
    }

    return buffer
  }
}

export default CalculationEngine
