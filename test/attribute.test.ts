import { ItemDiscount } from '../src'
import { CalculationEngine } from '../src/engine'
import {
  BuyXGetYRule,
  FixedPercentRule,
  FixedPriceRule,
  StepVolumeDiscountRule,
} from '../src/incart'
// TEST CASE

describe('Category Conditions', () => {
  const engine = new CalculationEngine()

  // Cart content without Rules
  const cartContentWithoutRules = {
    items: [
      {
        uid: 'TEST',
        cartItemIndexKey: '0',
        qty: 5,
        perItemPrice: 500,
        attributes: {
          custom_attr: ['a', 'b', 'c'],
        },
      },
      {
        uid: 'TEST2',
        cartItemIndexKey: '0',
        qty: 3,
        perItemPrice: 200,
        attributes: {
          custom_attr: ['a'],
        },
      },
      {
        uid: 'TEST3',
        cartItemIndexKey: '0',
        qty: 2,
        perItemPrice: 500,
        attributes: {
          custom_attr: ['b'],
        },
      },
      {
        uid: 'TEST4',
        cartItemIndexKey: '0',
        qty: 1,
        perItemPrice: 1000,
        attributes: {},
      },
    ],
    rules: [],
  }

  const ruleIdThatMatch = '0001'

  it('Can apply not condition', async () => {
    const totalValueApplicableToDiscount = 500 * 2 + 1 * 1000
    const itemDiscounts = [
      ItemDiscount.make({
        uid: 'TEST3',
        perLineDiscountedAmount:
          10 * ((500 * 2) / totalValueApplicableToDiscount), // 10 THB - split by value
        setFree: false,
        applicableRuleUid: ruleIdThatMatch,
      }),
      ItemDiscount.make({
        uid: 'TEST4',
        perLineDiscountedAmount:
          10 * ((1 * 1000) / totalValueApplicableToDiscount), // 10 THB - split by value
        setFree: false,
        applicableRuleUid: ruleIdThatMatch,
      }),
    ]
    const discountAmount = new FixedPriceRule(
      ruleIdThatMatch,
      0,
      '10 THB per item on selected item',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'not',
            attributeCode: 'custom_attr',
            values: ['a'],
          },
        },
      ],
      10
    ) // 10 THB

    const input = {
      ...cartContentWithoutRules,
      rules: [discountAmount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts,
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can apply or condition', async () => {
    const totalValueApplicableToDiscount = 500 * 5 + 3 * 200 + 2 * 500
    const itemDiscounts = [
      ItemDiscount.make({
        uid: 'TEST',
        perLineDiscountedAmount:
          100 * ((500 * 5) / totalValueApplicableToDiscount), // 100 THB - split by value
        setFree: false,
        applicableRuleUid: ruleIdThatMatch,
      }),
      ItemDiscount.make({
        uid: 'TEST2',
        perLineDiscountedAmount:
          100 * ((3 * 200) / totalValueApplicableToDiscount), // 100 THB - split by value
        setFree: false,
        applicableRuleUid: ruleIdThatMatch,
      }),
      ItemDiscount.make({
        uid: 'TEST3',
        perLineDiscountedAmount:
          100 * ((2 * 500) / totalValueApplicableToDiscount), // 100 THB - split by value
        setFree: false,
        applicableRuleUid: ruleIdThatMatch,
      }),
    ]
    const discountAmount = new FixedPriceRule(
      ruleIdThatMatch,
      0,
      '100 THB per item on selected item',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'or',
            attributeCode: 'custom_attr',
            values: ['a', 'b'],
          },
        },
      ],
      100
    ) // 100 THB

    const input = {
      ...cartContentWithoutRules,
      rules: [discountAmount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts,
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can apply and condition', async () => {
    const itemDiscounts = [
      ItemDiscount.make({
        uid: 'TEST',
        perLineDiscountedAmount: 200, // 200 THB - split by value (but noting to split)
        setFree: false,
        applicableRuleUid: ruleIdThatMatch,
      }),
    ]
    const discountAmount = new FixedPriceRule(
      ruleIdThatMatch,
      0,
      '100 THB per item on selected item',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'and',
            attributeCode: 'custom_attr',
            values: ['a', 'b'],
          },
        },
      ],
      200
    ) // 200 THB

    const input = {
      ...cartContentWithoutRules,
      rules: [discountAmount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts,
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can apply attribute based selection for % discount.', async () => {
    const discountItem = ItemDiscount.make({
      uid: 'TEST',
      perLineDiscountedAmount: 250, // 50 * 5
      setFree: false,
      applicableRuleUid: ruleIdThatMatch,
    })
    const discountPercent = new FixedPercentRule(
      ruleIdThatMatch,
      0,
      '10% on selected item',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'and',
            attributeCode: 'custom_attr',
            values: ['c'],
          },
        },
      ],
      10
    ) // 10% discount

    const input = {
      ...cartContentWithoutRules,
      rules: [discountPercent],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [discountItem],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can apply attribute based selection for amount discount.', async () => {
    const discountAmount = new FixedPriceRule(
      ruleIdThatMatch,
      0,
      '100 THB on selected item',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'and',
            attributeCode: 'custom_attr',
            values: ['c'],
          },
        },
      ],
      100
    ) // 100 THB

    const input = {
      ...cartContentWithoutRules,
      rules: [discountAmount],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 100, // (Fixed)
          setFree: false,
          applicableRuleUid: ruleIdThatMatch,
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can apply attribute based selection for % step discount.', async () => {
    const discountStepPercent = new StepVolumeDiscountRule(
      ruleIdThatMatch,
      0,
      '20% on selected >5 item',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'and',
            attributeCode: 'custom_attr',
            values: ['a'],
          },
        },
      ],
      [
        {
          discount: 5,
          type: 'percent',
          startQty: 1,
          endQty: 2,
        },
        {
          discount: 10,
          type: 'percent',
          startQty: 3,
          endQty: 4,
        },
        {
          discount: 20,
          type: 'percent',
          startQty: 5,
          endQty: null,
        },
      ]
    )

    const input = {
      ...cartContentWithoutRules,
      rules: [discountStepPercent],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 500, // 500 * 20% * 5
          setFree: false,
          applicableRuleUid: ruleIdThatMatch,
        }),
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 120, // 200 * 20% * 3
          setFree: false,
          applicableRuleUid: ruleIdThatMatch,
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('Can be applied with buy x get y rule', async () => {
    const buyXGetYRule = new BuyXGetYRule(
      ruleIdThatMatch,
      0,
      'Buy 4 get 7 (Cheapest of least UID)',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'and',
            attributeCode: 'custom_attr',
            values: ['a'],
          },
        },
      ],
      4,
      7
    )

    const input = {
      ...cartContentWithoutRules,
      rules: [buyXGetYRule],
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 200,
          setFree: true,
          applicableRuleUid: ruleIdThatMatch,
        }),
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 200,
          setFree: true,
          applicableRuleUid: ruleIdThatMatch,
        }),
        ItemDiscount.make({
          uid: 'TEST2',
          perLineDiscountedAmount: 200,
          setFree: true,
          applicableRuleUid: ruleIdThatMatch,
        }),
        ItemDiscount.make({
          uid: 'TEST',
          perLineDiscountedAmount: 500,
          setFree: true,
          applicableRuleUid: ruleIdThatMatch,
        }),
      ],
    }
    expect(result.meta.itemDiscounts?.length).toEqual(meta.itemDiscounts.length)
    expect(result.meta).toEqual(meta)
  })

  it('Can correct disable buy x get y condition, when attribute does not matched requirements', async () => {
    const buyXGetYRule = new BuyXGetYRule(
      ruleIdThatMatch,
      0,
      'Buy 8 get 1 (Cheapest of least UID)',
      false,
      'auto',
      false,
      [
        {
          type: 'attribute',
          value: {
            condition: 'and',
            attributeCode: 'custom_attr',
            values: ['a'],
          },
        },
      ],
      8,
      1
    )

    const input = {
      ...cartContentWithoutRules,
      rules: [buyXGetYRule],
    }

    const result = await engine.process(input, {})

    const meta = {
      unapplicableRules: [
        {
          uid: '0001',
          errors: ["Item quantities doesn't reach the minimum requirement."],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
