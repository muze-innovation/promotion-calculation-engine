import { createHash } from 'crypto'
import { WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('Valid credit card prefix case', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'credit_card_prefix',
        value: ['123456', '654321'],
      },
    ]
    const rule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      false,
      'auto',
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
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [rule],
      creditCardPrefix: createHash('md5')
        .update('123456')
        .digest('hex'),
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [1],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
          dist: WeightDistribution.make([['ABC', 200]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Invalid credit card prefix case', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'credit_card_prefix',
        value: ['123456', '654321'],
      },
    ]
    const rule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      false,
      'auto',
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
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [rule],
      creditCardPrefix: createHash('md5')
        .update('111111')
        .digest('hex'),
    }

    const result = await engine.process(input, {})

    const meta = {
      unapplicableRules: [
        {
          uid: 1,
          errors: ["This promotion doesn't apply to your credit card."],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Credit card number is not entered', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'credit_card_prefix',
        value: ['123456', '654321'],
      },
    ]
    const rule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      false,
      'auto',
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
          uid: 1,
          errors: ['Please enter your credit card and try again.'],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
