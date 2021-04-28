import { WholeCartDiscount } from '../src'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'
import { WeightDistribution } from '../src/discounts/WeightDistribution'

// Test Case
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('match customerGroups', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_group',
        value: ['tagB', 'tagA'],
      },
    ]
    const rule = new FixedPriceRule(
      'customerTag01',
      0,
      'fixedDiscountPrice',
      false,
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
        customerGroups: ['tagA', 'tagB', 'tagC'],
      },
      items: [
        {
          uid: 'uid01',
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
      applicableRuleUids: ['customerTag01'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 'customerTag01',
          dist: WeightDistribution.make([['uid01', 200]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('not match customerGroups', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'customer_group',
        value: ['tagA', 'tagB', 'tagC'],
      },
    ]
    const rule = new FixedPriceRule(
      'customerTag02',
      0,
      'fixedDiscountPrice',
      false,
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
        customerGroups: ['tagC'],
      },
      items: [
        {
          uid: 'uid01',
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
          uid: 'customerTag02',
          errors: ["This promotion doesn't apply to your customer group"],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('customerGroups match all combine many rules', async () => {
    const firstRule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'customer_group',
          value: ['tagA'],
        },
      ],
      100
    )

    const secondRule = new FixedPriceRule(
      2,
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'customer_group',
          value: ['tagB'],
        },
      ],
      200
    )

    const input = {
      customer: {
        uniqueId: 1,
        email: 'test@test.com',
        msisdn: 'A',
        isNewCustomer: true,
        customerGroups: ['tagA', 'tagB'],
      },
      items: [
        {
          uid: 'uid01',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [firstRule, secondRule],
    }

    const meta = {
      applicableRuleUids: [2, 1],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 200,
          setFree: false,
          applicableRuleUid: 2,
          dist: WeightDistribution.make([['uid01', 500]]),
        }),
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
          dist: WeightDistribution.make([['uid01', 300]]),
        }),
      ],
    }

    const result = await engine.process(input, {})
    expect(result.meta).toEqual(meta)
  })

  it('customerGroups match some combine many rules', async () => {
    const firstRule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'customer_group',
          value: ['tagA'],
        },
      ],
      100
    )

    const secondRule = new FixedPriceRule(
      2,
      0,
      'fixedDiscountPrice',
      false,
      false,
      [
        {
          type: 'customer_group',
          value: ['tagC'],
        },
      ],
      200
    )

    const input = {
      customer: {
        uniqueId: 1,
        email: 'test@test.com',
        msisdn: 'A',
        isNewCustomer: true,
        customerGroups: ['tagA', 'tagB'],
      },
      items: [
        {
          uid: 'uid01',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [firstRule, secondRule],
    }

    const meta = {
      applicableRuleUids: [1],
      unapplicableRules: [
        {
          uid: 2,
          errors: ["This promotion doesn't apply to your customer group"],
        },
      ],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
          dist: WeightDistribution.make([['uid01', 500]]),
        }),
      ],
    }

    const result = await engine.process(input, {})
    expect(result.meta).toEqual(meta)
  })
})
