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
      'auto',
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
      'auto',
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

  it('can handle wholecart discount (product selected)', async () => {
    const rule = new FixedPercentRule(
      'fixed10',
      0,
      'fixedDiscountPercent',
      false,
      'wholeCart',
      false,
      [
        {
          type: 'uids',
          uids: ['ABC1'],
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
      applicableRuleUids: ['fixed10'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 20,
          setFree: false,
          applicableRuleUid: 'fixed10',
          dist: WeightDistribution.make([['ABC1', 200]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('can handle perItem discount (apply to all products)', async () => {
    const rule = new FixedPercentRule(
      'fixed10perc',
      0,
      'fixedDiscountPercent',
      false,
      'perItem',
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
      applicableRuleUids: ['fixed10perc'],
      itemDiscounts: [
        ItemDiscount.make({
          perLineDiscountedAmount: 20,
          setFree: false,
          applicableRuleUid: 'fixed10perc',
          uid: 'ABC1',
        }),
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

  it('can handle cart subtotal = 0 (wholecart discount)', async () => {
    const rule = new FixedPercentRule(
      'fixed10',
      0,
      'fixedDiscountPercent',
      false,
      'auto',
      false,
      [],
      10
    )

    const input = {
      items: [
        {
          uid: 'ABC1',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 0,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['fixed10'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 0,
          setFree: false,
          applicableRuleUid: 'fixed10',
          dist: WeightDistribution.make([['ABC1', 0]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('can handle cart subtotal = 0 (perItem discount)', async () => {
    const rule = new FixedPercentRule(
      'fixed10perc',
      0,
      'fixedDiscountPercent',
      false,
      'perItem',
      false,
      [],
      10
    )

    const input = {
      items: [
        {
          uid: 'ABC1',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 0,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['fixed10perc'],
      itemDiscounts: [
        ItemDiscount.make({
          perLineDiscountedAmount: 0,
          setFree: false,
          applicableRuleUid: 'fixed10perc',
          uid: 'ABC1',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
