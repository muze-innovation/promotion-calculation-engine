import { CalculationEngine } from '../src/engine'
import { BuyXGetYRule } from '../src/incart'
// TEST CASE

describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  const discountItem = {
    uid: 'TEST',
    perLineDiscountedAmount: 500,
    setFree: true,
    applicableRuleUid: '0001',
  }

  it('Can create buy-3-get-2 rule for uid TEST with 5 item in Cart.', async () => {
    const uid = '0001'
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(uid, 0, 'buyXGetY', false, [], x, y)

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
    const buyXGetY = new BuyXGetYRule(uid, 0, 'buyXGetY', false, [], x, y)

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
    const buyXGetY = new BuyXGetYRule(uid, 0, 'buyXGetY', false, [], x, y)

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

  it('Can create pick-3-pay-2 rule for uid TEST AND buy-1-get-1 for UID TEST2 in Cart.', async () => {
    const uid1 = '0001'
    const buyXGetY_32 = new BuyXGetYRule(
      uid1,
      0,
      'buyXGetY_32',
      false,
      [
        {
          type: 'quantity_at_least',
          value: 3,
          uids: ['TEST'],
        },
      ],
      2,
      1
    )
    const uid2 = '0002'
    const buyXGetY_11 = new BuyXGetYRule(
      uid2,
      1,
      'buyXGetY_11',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST2'],
        },
      ],
      1,
      1
    )

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 6,
          perItemPrice: 145,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST2',
          cartItemIndexKey: '1',
          qty: 6,
          perItemPrice: 990,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [buyXGetY_32, buyXGetY_11],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [uid1, uid2],
      itemDiscounts: [
        {
          uid: 'TEST',
          perLineDiscountedAmount: 145,
          setFree: true,
          applicableRuleUid: '0001',
        },
        {
          uid: 'TEST',
          perLineDiscountedAmount: 145,
          setFree: true,
          applicableRuleUid: '0001',
        },
        {
          uid: 'TEST2',
          perLineDiscountedAmount: 990,
          setFree: true,
          applicableRuleUid: '0002',
        },
        {
          uid: 'TEST2',
          perLineDiscountedAmount: 990,
          setFree: true,
          applicableRuleUid: '0002',
        },
        {
          uid: 'TEST2',
          perLineDiscountedAmount: 990,
          setFree: true,
          applicableRuleUid: '0002',
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })
})
