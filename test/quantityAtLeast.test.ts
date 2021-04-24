import { CalculationEngineInput, WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount case: quantity >= at least', async () => {
    const rule = new FixedPriceRule(
      'quantity01',
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'quantity_at_least',
          value: 3,
        },
      ],
      100
    )

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
        {
          uid: 'DEF',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['quantity01'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 'quantity01',
          dist: WeightDistribution.make([
            ['ABC', 200],
            ['DEF', 400],
          ]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('no discount case: quantity < at least', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'quantity_at_least',
        value: 3,
      },
    ]
    const rule = new FixedPriceRule(
      'quantity02',
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
        {
          uid: 'DEF',
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
          uid: 'quantity02',
          errors: ["Item quantities doesn't reach the minimum requirement."],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
