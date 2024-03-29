import { ItemDiscount, WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { BuyXGetYRule, StepVolumeDiscountRule } from '../src/incart'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('Can create buy-3-get-2 rule with step volume discount for uid TEST with 5 item in Cart.', async () => {
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(
      'BuyXGetYUId01',
      1,
      'buyXGetY',
      false,
      'auto',
      false,
      [],
      x,
      y
    )
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'StepUId01',
      0,
      'Step volume Discount',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 0,
          type: 'percent',
        },
        {
          startQty: 4,
          endQty: 7,
          discount: 10,
          type: 'percent',
        },
        {
          startQty: 8,
          endQty: null,
          discount: 15,
          type: 'percent',
        },
      ]
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
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 300,
          setFree: false,
          applicableRuleUid: 'StepUId01',
        }),
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 450,
          setFree: true,
          applicableRuleUid: 'BuyXGetYUId01',
        }),
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 450,
          setFree: true,
          applicableRuleUid: 'BuyXGetYUId01',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can create step volume discount for uid TEST with 5 item and then buy-3-get-2 rule with in Cart.', async () => {
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(
      10,
      0,
      'buyXGetY',
      false,
      'auto',
      false,
      [],
      x,
      y
    )
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      11,
      1,
      'Step volume Discount',
      false,
      'auto',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 5,
          type: 'percent',
        },
        {
          startQty: 4,
          endQty: 6,
          discount: 10,
          type: 'percent',
        },
        {
          startQty: 7,
          endQty: null,
          discount: 15,
          type: 'percent',
        },
      ]
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
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 150,
          setFree: true,
          applicableRuleUid: 10,
        }),
        ItemDiscount.make({
          uid: 'TEST3',
          perLineDiscountedAmount: 400,
          setFree: true,
          applicableRuleUid: 10,
        }),
      ],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 75,
          setFree: false,
          applicableRuleUid: 11,
          dist: WeightDistribution.make([
            ['TEST', 1500],
            ['TEST3', 0],
            ['TEST2', 0],
          ]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can create fixed amount step volume discount for uid TEST then buy-3-get-2 rule.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'step01',
      0,
      'Step volume Discount',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 0,
          type: 'fixed',
        },
        {
          startQty: 4,
          endQty: 7,
          discount: 300,
          type: 'fixed',
        },
        {
          startQty: 8,
          endQty: null,
          discount: 600,
          type: 'fixed',
        },
      ]
    )
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(
      'buyXGetY01',
      1,
      'buyXGetY',
      false,
      'auto',
      false,
      [],
      x,
      y
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
      applicableRuleUids: ['step01', 'buyXGetY01'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 300,
          setFree: false,
          applicableRuleUid: 'step01',
        }),
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 450,
          setFree: true,
          applicableRuleUid: 'buyXGetY01',
        }),
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 450,
          setFree: true,
          applicableRuleUid: 'buyXGetY01',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can create buy-3-get-2 rule then fixed amount step volume discount.', async () => {
    const x = 3
    const y = 2
    const buyXGetY = new BuyXGetYRule(
      'buyXGetY02',
      0,
      'buyXGetY',
      false,
      'auto',
      false,
      [],
      x,
      y
    )
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'step02',
      1,
      'Step volume Discount',
      false,
      'auto',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 0,
          type: 'fixed',
        },
        {
          startQty: 4,
          endQty: 6,
          discount: 100,
          type: 'fixed',
        },
        {
          startQty: 7,
          endQty: null,
          discount: 300,
          type: 'fixed',
        },
      ]
    )

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
      applicableRuleUids: ['buyXGetY02', 'step02'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 150,
          setFree: true,
          applicableRuleUid: 'buyXGetY02',
        }),
        ItemDiscount.make({
          uid: 'TEST3',
          perLineDiscountedAmount: 400,
          setFree: true,
          applicableRuleUid: 'buyXGetY02',
        }),
      ],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 'step02',
          dist: WeightDistribution.make([
            ['TEST', 2000],
            ['TEST3', 0],
            ['TEST2', 0],
          ]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
