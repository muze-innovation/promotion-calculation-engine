import { CalculationEngine } from '../src/engine'
import { FixedPercentRule } from '../src/incart'
// TEST CASE

describe('Discount with fixed percent', () => {
  const engine = new CalculationEngine()

  const inputNoRule = {
    items: [
      {
        uid: 'ABC1',
        cartItemIndexKey: '0',
        qty: 2,
        perItemPrice: 100,
        categories: ['Main'],
        tags: ['TAG#1'],
      },
      {
        uid: 'ABC2',
        cartItemIndexKey: '0',
        qty: 1,
        perItemPrice: 11,
        categories: ['Non-Main'],
        tags: ['TAG#1'],
      },
    ],
  }

  it('can handle perItem discount', async () => {
    const rule = new FixedPercentRule(
      'fixed10perc',
      0,
      'fixedDiscountPercent',
      [
        {
          type: 'uids',
          uids: ['ABC2'],
        },
      ],
      10
    )

    const input = {
      ...inputNoRule,
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['fixed10perc'],
      itemDiscounts: [
        {
          perLineDiscountedAmount: 1.1,
          setFree: false,
          applicableRuleUid: 'fixed10perc',
          uid: 'ABC2',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('can handle wholcart discount', async () => {
    const rule = new FixedPercentRule(
      'fixed10',
      0,
      'fixedDiscountPercent',
      [],
      10
    )

    const input = {
      ...inputNoRule,
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['fixed10'],
      wholeCartDiscount: [
        {
          discountedAmount: 21.1, // (200 + 11) * 10%
          setFree: false,
          applicableRuleUid: 'fixed10',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })
})
