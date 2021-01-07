import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount case: customer usage count < usage per customer limit', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'uses_per_customer',
        value: 5,
      },
    ]
    const rule = new FixedPriceRule(
      '01',
      0,
      'fixedDiscountPrice',
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
      usageCounts: [{ salesRuleId: '01', byCustomer: 4 }],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['01'],
      wholeCartDiscount: [
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: '01',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('no discount case: customer usage count >= usage per customer limit', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'uses_per_customer',
        value: 5,
      },
    ]
    const rule = new FixedPriceRule(
      '02',
      0,
      'fixedDiscountPrice',
      conditions,
      100
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
      ],
      rules: [rule],
      customer: {
        uniqueId: 1,
        email: 'xx@xxxx.com',
        msisdn: 'x',
        isNewCustomer: false,
      },
      usageCounts: [{ salesRuleId: '02', byCustomer: 5 }],
    }

    const result = await engine.process(input, {})

    const meta = {
      unapplicableRules: [
        {
          uid: '02',
          errors: ["Your usage limit for this promotion has been exceeded."],
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('cause has ignoreCondition: customer usage count >= usage per customer limit', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'uses_per_customer',
        value: 1,
      },
    ]
    const rule = new FixedPriceRule(
      '03',
      0,
      'fixedDiscountPrice',
      conditions,
      100
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
      ],
      rules: [rule],
      customer: {
        uniqueId: 1,
        email: 'xx@xxxx.com',
        msisdn: 'x',
        isNewCustomer: false,
      },
      usageCounts: [{ salesRuleId: '03', byCustomer: 1 }],
      ignoreCondition: true,
    }
    const result = await engine.process(input, {})
    const meta = {
      applicableRuleUids: ['03'],
      wholeCartDiscount: [
        {
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: '03',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })
})
