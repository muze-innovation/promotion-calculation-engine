import { ItemDiscount, WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { StepVolumeDiscountRule } from '../src/incart'

// TEST CASE
describe('Step Volume Discount', () => {
  const engine = new CalculationEngine()

  it('can match for uid TEST with 3 item in Cart.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume01',
      0,
      'Can create step volume discount rule for uid TEST with 3 item in Cart.',
      false,
      'auto',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 0,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 15,
          type: 'percent',
        },
        {
          startQty: 9,
          endQty: null,
          discount: 20,
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
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['stepVolume01'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          applicableRuleUid: 'stepVolume01',
          discountedAmount: 0,
          setFree: false,
          dist: WeightDistribution.make([['TEST', 1500]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('can match for uid TEST with 5 item in Cart.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume02',
      0,
      'Step volume Discount',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST_MATCH_3'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 5,
          type: 'percent',
        },
        {
          startQty: 4,
          endQty: null,
          discount: 10,
          type: 'percent',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST_MATCH_3',
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
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['stepVolume02'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST_MATCH_3',
          perLineDiscountedAmount: 75,
          setFree: false,
          applicableRuleUid: 'stepVolume02',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('can match for uid TEST with 10 item in Cart.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume03',
      0,
      'Can create step volume discount rule for uid TEST with 10 item in Cart',
      false,
      'auto',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 10,
          type: 'percent',
        },
        {
          startQty: 9,
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
          qty: 10,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      applicableRuleUids: ['stepVolume03'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          discountedAmount: 750,
          setFree: false,
          applicableRuleUid: 'stepVolume03',
          dist: WeightDistribution.make([['TEST', 5000]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('can handle unmatched UID', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume04',
      0,
      'Cannot create step volume discount rule for not match Uid',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST1'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: null,
          discount: 10,
          type: 'percent',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 10,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 10,
          perItemPrice: 400,
          categories: ['Main1'],
          tags: ['TAG#2'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      unapplicableRules: [
        {
          uid: 'stepVolume04',
          errors: [
            "This promotion doesn't apply to any product in this order.",
            "Item quantities doesn't reach the minimum requirement.",
          ],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('can handle only matched UID products', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume05',
      0,
      'Can calculate step only product that match product condition',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST1'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: null,
          discount: 10,
          type: 'percent',
        },
      ]
    )

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
        {
          uid: 'TEST1',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 400,
          categories: ['Main1'],
          tags: ['TAG#2'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      applicableRuleUids: ['stepVolume05'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST1',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: 'stepVolume05',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can handle combined 2 items steps', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume06',
      0,
      'Can calculate step only product that match product condition',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST', 'TEST1'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: null,
          discount: 10,
          type: 'percent',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 8,
          perItemPrice: 100,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST1',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 100,
          categories: ['Main1'],
          tags: ['TAG#2'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      applicableRuleUids: ['stepVolume06'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 80,
          setFree: false,
          applicableRuleUid: 'stepVolume06',
        }),
        ItemDiscount.make({
          uid: 'TEST1',
          perLineDiscountedAmount: 20,
          setFree: false,
          applicableRuleUid: 'stepVolume06',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('fixed discount case: 5 pieces of same item get 200 discount.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume01',
      0,
      '5 items in cart get 200 discount.',
      false,
      'auto',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 100,
          type: 'fixed',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 200,
          type: 'fixed',
        },
        {
          startQty: 6,
          endQty: null,
          discount: 400,
          type: 'fixed',
        },
      ]
    )

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
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['fixedStepVolume01'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          applicableRuleUid: 'fixedStepVolume01',
          discountedAmount: 200,
          setFree: false,
          dist: WeightDistribution.make([['TEST', 2500]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('fixed discount case: 2 item 10 pieces in total get 400 discount.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume02',
      0,
      '8 items in cart get 400 discount.',
      false,
      'auto',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 100,
          type: 'fixed',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 200,
          type: 'fixed',
        },
        {
          startQty: 9,
          endQty: null,
          discount: 400,
          type: 'fixed',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST1',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST2',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['fixedStepVolume02'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          applicableRuleUid: 'fixedStepVolume02',
          discountedAmount: 400,
          setFree: false,
          dist: WeightDistribution.make([
            ['TEST1', 2500],
            ['TEST2', 2500],
          ]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('fixed discount case: 1 of product uids matches salesrule uid condition', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume03',
      0,
      '1 of product uids matches salesrule uid condition',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST1', 'TEST2'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 200,
          type: 'fixed',
        },
        {
          startQty: 5,
          endQty: null,
          discount: 500,
          type: 'fixed',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST1',
          cartItemIndexKey: '0',
          qty: 4,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST3',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 400,
          categories: ['Main1'],
          tags: ['TAG#2'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      applicableRuleUids: ['fixedStepVolume03'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST1',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: 'fixedStepVolume03',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('fixed discount case: multiple product uids match salesrule uid condition', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume04',
      0,
      'multiple product uids match salesrule uid condition',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST1', 'TEST2'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 200,
          type: 'fixed',
        },
        {
          startQty: 5,
          endQty: null,
          discount: 500,
          type: 'fixed',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST1',
          cartItemIndexKey: '0',
          qty: 3,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST2',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 500,
          categories: ['Main1'],
          tags: ['TAG#2'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      applicableRuleUids: ['fixedStepVolume04'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST1',
          perLineDiscountedAmount: 300,
          setFree: false,
          applicableRuleUid: 'fixedStepVolume04',
        }),
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: 'fixedStepVolume04',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('no fixed discount case: product uids not match salesrule uid condition', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume04',
      0,
      'multiple product uids match salesrule uid condition',
      false,
      'auto',
      false,
      [
        {
          type: 'uids',
          uids: ['TEST1', 'TEST2'],
        },
      ],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 200,
          type: 'fixed',
        },
        {
          startQty: 5,
          endQty: null,
          discount: 500,
          type: 'fixed',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST3',
          cartItemIndexKey: '0',
          qty: 3,
          perItemPrice: 500,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST4',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 500,
          categories: ['Main1'],
          tags: ['TAG#2'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      unapplicableRules: [
        {
          uid: 'fixedStepVolume04',
          errors: [
            "This promotion doesn't apply to any product in this order.",
            "Item quantities doesn't reach the minimum requirement.",
          ],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('no discount case: product quantity not meet salesrule requirement', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume04',
      0,
      'multiple product uids match salesrule uid condition',
      false,
      'auto',
      false,
      [],
      [
        {
          startQty: 3,
          endQty: 4,
          discount: 200,
          type: 'fixed',
        },
        {
          startQty: 5,
          endQty: null,
          discount: 500,
          type: 'fixed',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST4',
          cartItemIndexKey: '0',
          qty: 2,
          perItemPrice: 500,
          categories: ['Main1'],
          tags: ['TAG#2'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})
    const meta = {
      unapplicableRules: [
        {
          uid: 'fixedStepVolume04',
          errors: ["Item quantities doesn't reach the minimum requirement."],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('percent discount case: whole cart discount (product selected)', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume01',
      0,
      'Can create step volume discount rule for uid TEST with 3 item in Cart.',
      false,
      'wholeCart',
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
          endQty: 4,
          discount: 0,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 10,
          type: 'percent',
        },
        {
          startQty: 9,
          endQty: null,
          discount: 20,
          type: 'percent',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 8,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST2',
          cartItemIndexKey: '0',
          qty: 10,
          perItemPrice: 300,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['stepVolume01'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          applicableRuleUid: 'stepVolume01',
          discountedAmount: 160,
          setFree: false,
          dist: WeightDistribution.make([['TEST', 1600]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('fixed discount case: per item discount (apply to all products)', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume01',
      0,
      'Can create step volume discount rule for uid TEST with 3 item in Cart.',
      false,
      'perItem',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 0,
          type: 'fixed',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 300,
          type: 'fixed',
        },
        {
          startQty: 9,
          endQty: null,
          discount: 700,
          type: 'fixed',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST1',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
        {
          uid: 'TEST2',
          cartItemIndexKey: '0',
          qty: 10,
          perItemPrice: 300,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['stepVolume01'],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST1',
          perLineDiscountedAmount: 175,
          setFree: false,
          applicableRuleUid: 'stepVolume01',
        }),
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 525,
          setFree: false,
          applicableRuleUid: 'stepVolume01',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('percent discount case: cart subtotal = 0 (wholeCart discount) ', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume01',
      0,
      'Can create step volume discount rule for uid TEST with 3 item in Cart.',
      false,
      'wholeCart',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 0,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 10,
          type: 'percent',
        },
        {
          startQty: 9,
          endQty: null,
          discount: 20,
          type: 'percent',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 8,
          perItemPrice: 0,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['stepVolume01'],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          applicableRuleUid: 'stepVolume01',
          discountedAmount: 0,
          setFree: false,
          dist: WeightDistribution.make([['TEST', 0]]),
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('percent discount case: cart subtotal = 0 (perItem discount) ', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume01',
      0,
      'Can create step volume discount rule for uid TEST with 3 item in Cart.',
      false,
      'perItem',
      false,
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 0,
          type: 'percent',
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 10,
          type: 'percent',
        },
        {
          startQty: 9,
          endQty: null,
          discount: 20,
          type: 'percent',
        },
      ]
    )

    const input = {
      items: [
        {
          uid: 'TEST',
          cartItemIndexKey: '0',
          qty: 8,
          perItemPrice: 0,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['stepVolume01'],
      itemDiscounts: [
        ItemDiscount.make({
          applicableRuleUid: 'stepVolume01',
          perLineDiscountedAmount: 0,
          setFree: false,
          uid: 'TEST',
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
