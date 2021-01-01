import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
// TEST CASE

describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount fixed price : discount < subtotal', async () => {
    const rule = new FixedPriceRule(1, 0, 'fixedDiscountPrice', [], 100)

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
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('discount fixed price : discount > subtotal', async () => {
    const rule = new FixedPriceRule(
      'fixedDiscountPrice0001',
      0,
      'fixedDiscountPrice',
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
        {
          discountedAmount: 400,
          setFree: false,
          applicableRuleUid: 'fixedDiscountPrice0001',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('discount fixed price : fixed price has uids', async () => {
    const rule = new FixedPriceRule(
      '0001',
      0,
      'fixedDiscountPrice',
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
        {
          uid: 'ABC',
          perLineDiscountedAmount: 100,
          setFree: false,
          applicableRuleUid: '0001',
        },
        {
          uid: 'EFG',
          perLineDiscountedAmount: 100,
          setFree: false,
          applicableRuleUid: '0001',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('discount fixed price : fixed price has uids but got only one uid that match', async () => {
    const rule = new FixedPriceRule(
      '0001',
      0,
      'fixedDiscountPrice',
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
        {
          uid: 'ABC',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: '0001',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('discount fixed price : fixed price has uids but not match', async () => {
    const rule = new FixedPriceRule(
      '0004',
      0,
      'fixedDiscountPrice',
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

    const meta = {}
    expect(result).toEqual({ input, meta })
  })
})
