import { ItemDiscount, WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
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

  const inputNoRuleDistAll = WeightDistribution.make([
    ['ABC1', 200],
    ['ABC2', 11],
  ])

  it('can handle perItem discount', async () => {
    const rule = new FixedPercentRule(
      'fixed10perc',
      0,
      'fixedDiscountPercent',
      false,
      false,
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
        ItemDiscount.make({
          perLineDiscountedAmount: 1.1,
          setFree: false,
          applicableRuleUid: 'fixed10perc',
          uid: 'ABC2',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('can handle wholecart discount', async () => {
    const rule = new FixedPercentRule(
      'fixed10',
      0,
      'fixedDiscountPercent',
      false,
      false,
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
        WholeCartDiscount.make({
          discountedAmount: 21.1, // (200 + 11) * 10%
          setFree: false,
          applicableRuleUid: 'fixed10',
          dist: inputNoRuleDistAll,
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
