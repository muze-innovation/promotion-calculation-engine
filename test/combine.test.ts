import { CalculationEngine } from '../src/engine'
import { BuyXGetYRule, StepVolumeDiscountRule } from '../src/incart'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('Can create buy-3-get-2 rule with step volume discount for uid TEST with 5 item in Cart.', async () => {
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule('BuyXGetYUId01', 1, 'buyXGetY', [], x, y)
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'StepUId01',
      0,
      'Step volume Discount',
      [{
        type: 'uids',
        uids: ["TEST"],
      }],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 0,
          type: "percent",
        },
        {
          startQty: 4,
          endQty: 7,
          discount: 10,
          type: "percent",
        },
        {
          startQty: 8,
          endQty: null,
          discount: 15,
          type: "percent",
        },
      ],
      ["TEST"],
    )

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
        {
          uid: 'TEST2',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [buyXGetY, stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['StepUId01', 'BuyXGetYUId01'],
      itemDiscounts: [
        {
          uid: 'TEST',
          perLineDiscountedAmount: 300,
          setFree: false,
          applicableRuleUid: 'StepUId01'
        },
        {
          uid: 'TEST',
          perLineDiscountedAmount: 450,
          setFree: true,
          applicableRuleUid: 'BuyXGetYUId01'
        },
        {
          uid: 'TEST',
          perLineDiscountedAmount: 450,
          setFree: true,
          applicableRuleUid: 'BuyXGetYUId01'
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can create step volume discount for uid TEST with 5 item and then buy-3-get-2 rule with in Cart.', async () => {
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(10, 0, 'buyXGetY', [], x, y)
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      11,
      1,
      'Step volume Discount',
      [],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 5,
          type: "percent",
        },
        {
          startQty: 4,
          endQty: 6,
          discount: 10,
          type: "percent",
        },
        {
          startQty: 7,
          endQty: null,
          discount: 15,
          type: "percent",
        },
      ],
      []
    )

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 3,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST2',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 150, // TODO: Should get these 2 as 'Y'
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST3',
          cartItemIndexKey: '0',
          qty: 1,
          perItemPrice: 400,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [buyXGetY, stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      applicableRuleUids: [10, 11],
      itemDiscounts: [
        {
          uid: 'TEST2',
          perLineDiscountedAmount: 150,
          setFree: true,
          applicableRuleUid: 10
        },
        {
          uid: 'TEST3',
          perLineDiscountedAmount: 400,
          setFree: true,
          applicableRuleUid: 10
        },
      ],
      wholeCartDiscount: [
        {
          discountedAmount: 75,
          setFree: false,
          applicableRuleUid: 11
        }
      ]
    }
    expect(result).toEqual({ input, meta })
  })

})
