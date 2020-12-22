import { CalculationEngine } from '../src/engine'
import { FixedPercentRule } from '../src/incart'
// TEST CASE

describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount fixed percent', async () => {
    const rule = new FixedPercentRule(
      'fixed01',
      0,
      'fixedDiscountPercent',
      [],
      20
    )

    const input = {
      items: [
        {
          uid: 'ABC',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 100,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [rule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['fixed01'],
      wholeCartDiscount: [
        {
          discountedAmount: 40,
          setFree: false,
          applicableRuleUid: 'fixed01',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })
})
