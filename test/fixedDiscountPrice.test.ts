import { ItemDiscount, WholeCartDiscount } from '../src'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
// TEST CASE

describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount fixed price : discount < subtotal', async () => {
    const rule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      false,
      false,
      [],
      100
    )

    const input = {
      items: [
        {
          uid: 'ABC',
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
      applicableRuleUids: [1],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
          uids: [],
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('discount fixed price : discount > subtotal', async () => {
    const rule = new FixedPriceRule(
      'fixedDiscountPrice0001',
      0,
      'fixedDiscountPrice',
      false,
      false,
      [],
      500
    )

    const input = {
      items: [
        {
          uid: 'ABC',
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
      applicableRuleUids: ['fixedDiscountPrice0001'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 400,
          setFree: false,
          applicableRuleUid: 'fixedDiscountPrice0001',
          uids: [],
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('discount fixed price : fixed price has uids', async () => {
    const rule = new FixedPriceRule(
      '0001',
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'uids',
          uids: ['ABC', 'EFG'],
        },
      ],
      200
    )
    const input = {
      items: [
        {
          uid: 'ABC',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'EFG',
          cartItemIndexKey: '1',
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
      applicableRuleUids: ['0001'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'ABC',
          perLineDiscountedAmount: 100,
          setFree: false,
          applicableRuleUid: '0001',
        }),
        ItemDiscount.make({
          uid: 'EFG',
          perLineDiscountedAmount: 100,
          setFree: false,
          applicableRuleUid: '0001',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('discount fixed price : fixed price has uids but got only one uid that match', async () => {
    const rule = new FixedPriceRule(
      '0001',
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'uids',
          uids: ['ABC'],
        },
      ],
      200
    )
    const input = {
      items: [
        {
          uid: 'ABC',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'EFG',
          cartItemIndexKey: '1',
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
      applicableRuleUids: ['0001'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'ABC',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: '0001',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('discount fixed price : fixed price has uids but not match', async () => {
    const rule = new FixedPriceRule(
      '0004',
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'uids',
          uids: ['ABC'],
        },
      ],
      200
    )
    const input = {
      items: [
        {
          uid: 'EFG',
          cartItemIndexKey: '1',
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
      unapplicableRules: [
        {
          uid: '0004',
          errors: [
            "This promotion doesn't apply to any product in this order.",
          ],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
