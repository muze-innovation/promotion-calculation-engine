import { CalculationEngine } from '../src/engine'
import { FreeShippingRule } from '../src/incart'
// TEST CASE

describe('Calculation Engine', () => {
  const engine = new CalculationEngine()
  it('Free shipping', async () => {
    const freeShipping = new FreeShippingRule('freeShipping01', 0, 'freeShipping', [])

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      deliveryAddresses: [{
        uid: 'shipping_1',
        postalCode: '00000',
        city: 'string',
        country: 'string',
        shipping: {
          fee: 10,
          type: 'test'
        },
      }],
      rules: [freeShipping],
    }
    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['freeShipping01'],
      shippingDiscount: [{
        uid: 'shipping_1',
        discountedAmount: 10,
        setFree: true,
        applicableRuleUid: 'freeShipping01'
      }],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Free shipping no shipping fee', async () => {
    const freeShipping = new FreeShippingRule('freeShipping02', 0, 'freeShipping', [])

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      deliveryAddresses: [{
        uid: 'shipping_2',
        postalCode: '00000',
        city: 'string',
        country: 'string',
        shipping: {
          fee: 0,
          type: 'test'
        },
      }],
      rules: [freeShipping],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['freeShipping02'],
      shippingDiscount: [],
    }
    expect(result).toEqual({ input, meta })
  })

})
