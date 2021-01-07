import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount case: subtotal > at least', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'subtotal_at_least',
        value: 200,
      },
    ]
    const rule = new FixedPriceRule(1, 0, 'fixedDiscountPrice', conditions, 100)

    const input = {
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
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [1],
      wholeCartDiscount: [
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('no discount case: subtotal < at least', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'subtotal_at_least',
        value: 200,
      },
    ]
    const rule = new FixedPriceRule(2, 0, 'fixedDiscountPrice', conditions, 100)

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
    expect(result).toEqual({ input, meta })
  })
})
