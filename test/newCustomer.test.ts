import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'
import { JsonConditionType } from '../src/incart/conditionTypes'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()


  it('old customer case', async () => {
    const conditions: JsonConditionType[] = [{
      type: 'subtotal_at_least',
      value: 200
    }]
    const rule = new FixedPriceRule('newCustomer01', 0, 'fixedDiscountPrice', conditions, 100, [])

    const input = {
      customer: {
        uniqueId: 1,
        email: 'test@test.com',
        msisdn: 'A',
        isNewCustomer: true,
        customerTags: [],
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

    const meta = {}
    expect(result).toEqual({ input, meta })
  })

  it('old customer case', async () => {
    const conditions: JsonConditionType[] = [{
      type: 'subtotal_at_least',
      value: 200
    }]
    const rule = new FixedPriceRule('newCustomer02', 0, 'fixedDiscountPrice', conditions, 100, [])

    const input = {
      customer: {
        uniqueId: 1,
        email: 'test@test.com',
        msisdn: 'A',
        isNewCustomer: true,
        customerTags: [],
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

    const meta = {}
    expect(result).toEqual({ input, meta })
  })


})
