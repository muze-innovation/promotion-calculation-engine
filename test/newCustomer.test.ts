import { WholeCartDiscount } from '../src'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'
import { WeightDistribution } from '../src/discounts/WeightDistribution'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('new customer case', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'new_customer',
      },
    ]
    const rule = new FixedPriceRule(
      'newCustomer01',
      0,
      'fixedDiscountPrice',
      false,
      'auto',
      false,
      conditions,
      100
    )

    const input = {
      customer: {
        uniqueId: 1,
        email: 'test@test.com',
        msisdn: 'A',
        isNewCustomer: true,
      },
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
      applicableRuleUids: ['newCustomer01'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          applicableRuleUid: 'newCustomer01',
          discountedAmount: 100,
          setFree: false,
          dist: WeightDistribution.make([['ABC', 100]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('old customer case', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'new_customer',
      },
    ]
    const rule = new FixedPriceRule(
      'newCustomer02',
      0,
      'fixedDiscountPrice',
      false,
      'auto',
      false,
      conditions,
      100
    )

    const input = {
      customer: {
        uniqueId: 1,
        email: 'test@test.com',
        msisdn: 'A',
        isNewCustomer: false,
      },
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
          uid: 'newCustomer02',
          errors: ['This promotion only apply to new customer.'],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
