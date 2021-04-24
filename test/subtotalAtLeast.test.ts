import { CalculationEngineInput, WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount case: subtotal > at least', async () => {
    const input: CalculationEngineInput = {
      items: [
        {
          uid: 'ABC',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [
        new FixedPriceRule(
          'ruleA',
          0,
          'fixedDiscountPrice',
          false,
          false,
          [
            {
              type: 'subtotal_at_least',
              value: 200,
            },
          ],
          100
        ),
      ],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['ruleA'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 'ruleA',
          dist: WeightDistribution.make([['ABC', 200]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('no discount case: subtotal < at least', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'subtotal_at_least',
        value: 200,
      },
    ]
    const rule = new FixedPriceRule(
      2,
      0,
      'fixedDiscountPrice',
      false,
      false,
      conditions,
      100
    )

    const input = {
      items: [
        {
          uid: 'ABC',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 100,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      unapplicableRules: [
        {
          uid: 2,
          errors: ["Subtotal amount doesn't reach the minimum requirement."],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
