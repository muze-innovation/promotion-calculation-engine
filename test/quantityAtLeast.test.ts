import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount case: quantity >= at least', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'quantity_at_least',
        value: 3,
      },
    ]
    const rule = new FixedPriceRule(
      'quantity01',
      0,
      'fixedDiscountPrice',
      conditions,
      100,
      []
    )

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
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 'quantity01',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
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
      conditions,
      100,
      []
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

    const meta = {}
    expect(result).toEqual({ input, meta })
  })
})
