import { CalculationEngine } from '../src/engine'
import { BuyXGetYRule, FixedPercentRule, FixedPriceRule, StepVolumeDiscountRule } from '../src/incart'
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
        categories: ['TEST_CAT_SINGLE'],
        tags: ['TAG#1'],
      },
      {
        uid: 'TEST2',
        cartItemIndexKey: '0',
        qty: 3,
        perItemPrice: 500,
        categories: [],
        tags: ['TAG#2'],
      },
      {
        uid: 'TEST3',
        cartItemIndexKey: '0',
        qty: 2,
        perItemPrice: 500,
        categories: ['TEST_CAT_3_SKUS'],
        tags: ['TAG#3'],
      },
      {
        uid: 'TEST4',
        cartItemIndexKey: '0',
        qty: 1,
        perItemPrice: 1000,
        categories: ['TEST_CAT_3_SKUS'],
        tags: ['TAG#4'],
      },
      {
        uid: 'TEST5',
        cartItemIndexKey: '0',
        qty: 2,
        perItemPrice: 1000,
        categories: ['TEST_CAT_3_SKUS'],
        tags: ['TAG#5'],
      },
    ],
    rules: [],
  }

  const ruleIdThatMatch = '0001'

  it('Can apply category based selection for % discount.', async () => {
    const discountItem = {
      uid: 'TEST',
      perLineDiscountedAmount: 250, // 50 * 5
      setFree: false,
      applicableRuleUid: ruleIdThatMatch,
    }
    const discountPercent = new FixedPercentRule(ruleIdThatMatch, 0, '10% on selected item', [
      {
        type: 'category',
        value: { condition: 'and', values: ['TEST_CAT_SINGLE'] }
      }
    ], 10) // 10% discount

    const input = {
      ...cartContentWithoutRules,
      rules: [
        discountPercent
      ]
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [discountItem],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can apply category based selection for amount discount.', async () => {
    const discountAmount = new FixedPriceRule(ruleIdThatMatch, 0, '10% on selected item', [
      {
        type: 'category',
        value: { condition: 'and', values: ['TEST_CAT_SINGLE'] }
      }
    ], 100) // 100 THB

    const input = {
      ...cartContentWithoutRules,
      rules: [
        discountAmount
      ]
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [
        {
          uid: 'TEST',
          perLineDiscountedAmount: 100, // (Fixed)
          setFree: false,
          applicableRuleUid: ruleIdThatMatch,
        }
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can apply category based selection for % step discount.', async () => {
    const discountStepPercent = new StepVolumeDiscountRule(ruleIdThatMatch, 0, '20% on selected >5 item', [
      {
        type: 'category',
        value: { condition: 'and', values: ['TEST_CAT_3_SKUS'] }
      }
    ], [
      {
        discount: 5,
        type: 'percent',
        startQty: 1,
        endQty: 2
      },
      {
        discount: 10,
        type: 'percent',
        startQty: 3,
        endQty: 4
      },
      {
        discount: 20,
        type: 'percent',
        startQty: 5,
        endQty: null
      },
    ])

    const input = {
      ...cartContentWithoutRules,
      rules: [
        discountStepPercent
      ]
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [
        {
          uid: 'TEST3',
          perLineDiscountedAmount: 200, // 500 * 20% * 2
          setFree: false,
          applicableRuleUid: ruleIdThatMatch,
        },
        {
          uid: 'TEST4',
          perLineDiscountedAmount: 200, // 1000 * 20% * 1
          setFree: false,
          applicableRuleUid: ruleIdThatMatch,
        },
        {
          uid: 'TEST5',
          perLineDiscountedAmount: 400, // 1000 * 20% * 2
          setFree: false,
          applicableRuleUid: ruleIdThatMatch,
        }
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can be applied with buy x get y rule', async () => {
    const buyXGetYRule = new BuyXGetYRule(ruleIdThatMatch, 0, 'Buy 2 get 3 (Cheapest of least UID)', [
      {
        type: 'category',
        value: { condition: 'and', values: ['TEST_CAT_3_SKUS'] }
      }
    ], 2, 3)

    const input = {
      ...cartContentWithoutRules,
      rules: [
        buyXGetYRule
      ]
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [
        {
          uid: 'TEST3',
          perLineDiscountedAmount: 500, // 500
          setFree: true,
          applicableRuleUid: ruleIdThatMatch,
        },
        {
          uid: 'TEST3',
          perLineDiscountedAmount: 500, // 500
          setFree: true,
          applicableRuleUid: ruleIdThatMatch,
        },
        {
          uid: 'TEST4',
          perLineDiscountedAmount: 1000, // 1000
          setFree: true,
          applicableRuleUid: ruleIdThatMatch,
        },
      ],
    }
    expect(result.itemDiscounts?.length).toEqual(meta.itemDiscounts.length)
    expect(result).toEqual({ input, meta })
  })

  it('Can correct disable buy x get y condition, when category does not matched requirements', async () => {
    const buyXGetYRule = new BuyXGetYRule(ruleIdThatMatch, 0, 'Buy 5 get 1 (Cheapest of least UID)', [
      {
        type: 'category',
        value: { condition: 'and', values: ['TEST_CAT_3_SKUS'] }
      }
    ], 5, 1)

    const input = {
      ...cartContentWithoutRules,
      rules: [
        buyXGetYRule
      ]
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: [ruleIdThatMatch],
      itemDiscounts: [],
    }
    expect(result).toEqual({ input, meta })
  })
})