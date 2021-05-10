import { WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('Logged in case: applicable to all type of customer', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_type',
        value: 'all',
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
      customer: {
        uniqueId: 1,
        email: 'xx@xxxx.com',
        msisdn: 'x',
        isNewCustomer: false,
      },
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

  it('Logged in case: applicable to logged in customer only', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_type',
        value: 'customer',
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
      customer: {
        uniqueId: 1,
        email: 'xx@xxxx.com',
        msisdn: 'x',
        isNewCustomer: false,
      },
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

  it('Logged in case: applicable to guest only)', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_type',
        value: 'guest',
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
      customer: {
        uniqueId: 1,
        email: 'xx@xxxx.com',
        msisdn: 'x',
        isNewCustomer: false,
      },
    }

    const result = await engine.process(input, {})

    const meta = {
      unapplicableRules: [
        {
          uid: 1,
          errors: ['This promotion is only apply to guest.'],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Guest case: applicable to all type of customer', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_type',
        value: 'all',
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

  it('Guest case: applicable to logged in customer only', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_type',
        value: 'customer',
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
          errors: ['This promotion is only apply to logged in customer.'],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Guest case: applicable to guest only)', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_type',
        value: 'guest',
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
})
