import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount case: usage count < usage limit', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'usage_limit',
        value: 200,
      },
    ]
    const rule = new FixedPriceRule(1, 0, 'fixedDiscountPrice', conditions, 100)

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
      usageCounts: [{ salesRuleId: 1, total: 199 }],
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

  it('no discount case: usage count >= usage limit', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'usage_limit',
        value: 200,
      },
    ]
    const rule = new FixedPriceRule(2, 0, 'fixedDiscountPrice', conditions, 100)

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
      usageCounts: [{ salesRuleId: 2, total: 200 }],
    }

    const result = await engine.process(input, {})

    const meta = {}
    expect(result).toEqual({ input, meta })
  })

  it('cause has ignoreCondition: usage count >= usage limit but has ignoreCondition', async () => {
    const conditions: JsonConditionType[] = [
      {
        type: 'usage_limit',
        value: 100,
      },
    ]
    const rule = new FixedPriceRule(1, 0, 'fixedDiscountPrice', conditions, 100)

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
      usageCounts: [{ salesRuleId: 1, total: 100 }],
      ignoreCondition: true,
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
})
