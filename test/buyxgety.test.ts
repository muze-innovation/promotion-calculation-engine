import { CalculationEngine } from '../src/engine'
import { BuyXGetYRule } from '../src/incart'
// TEST CASE

describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  const discountItem = {
    uid: 'TEST',
    perLineDiscountedAmount: 500,
    setFree: true,
    applicableRuleUid: '0001'
  }

  it('Can create buy-3-get-2 rule for uid TEST with 5 item in Cart.', async () => {
    const uid = '0001'
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(uid, 0, 'buyXGetY', [], x, y)

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [buyXGetY],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['0001'],
      itemDiscounts: Array(2).fill(discountItem),
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can create buy-3-get-2 rule for uid TEST with 4 item in Cart.', async () => {
    const uid = '0001'
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(uid, 0, 'buyXGetY', [], x, y)

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 4,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [buyXGetY],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['0001'],
      itemDiscounts: Array(1).fill(discountItem),
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can create buy-3-get-2 rule for uid TEST with 6 item in Cart.', async () => {
    const uid = '0001'
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(uid, 0, 'buyXGetY', [], x, y)

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 6,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [buyXGetY],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['0001'],
      itemDiscounts: Array(2).fill(discountItem),
    }
    expect(result).toEqual({ input, meta })
  })
})
