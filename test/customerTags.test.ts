import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

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
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 'customerTag01',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
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
    const meta = {}
    expect(result).toEqual({ input, meta })
  })

  it('customerGroups match all combine many rules', async () => {
    const firstConditions: JsonConditionType[] = [
      {
        type: 'customer_group',
        value: ['tagA'],
      },
    ]

    const secondConditions: JsonConditionType[] = [
      {
        type: 'customer_group',
        value: ['tagB'],
      },
    ]

    const firstRule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      firstConditions,
      100
    )

    const secondRule = new FixedPriceRule(
      2,
      0,
      'fixedDiscountPrice',
      secondConditions,
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
        {
          discountedAmount: 200,
          setFree: false,
          applicableRuleUid: 2,
        },
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
        },
      ],
    }

    const result = await engine.process(input, {})
    expect(result).toEqual({ input, meta })
  })

  it('customerGroups match all combine many rules', async () => {
    const firstConditions: JsonConditionType[] = [
      {
        type: 'customer_group',
        value: ['tagA'],
      },
    ]

    const secondConditions: JsonConditionType[] = [
      {
        type: 'customer_group',
        value: ['tagC'],
      },
    ]

    const firstRule = new FixedPriceRule(
      1,
      0,
      'fixedDiscountPrice',
      firstConditions,
      100
    )

    const secondRule = new FixedPriceRule(
      2,
      0,
      'fixedDiscountPrice',
      secondConditions,
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
      wholeCartDiscount: [
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 1,
        },
      ],
    }

    const result = await engine.process(input, {})
    expect(result).toEqual({ input, meta })
  })
})
