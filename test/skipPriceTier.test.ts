import { ItemDiscount, WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule, FixedPercentRule } from '../src/incart'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('discount case: subtotal > at least', async () => {
    const rules = [
      // Price tier discount rule
      new FixedPriceRule(
        '_PRICE_TIER',
        0,
        'fixedDiscountPrice',
        false,
        'auto',
        false,
        [
          {
            type: 'uids',
            uids: ['price_tier_product'],
          },
        ],
        250
      ),
      // Not eligible to price tier rule
      new FixedPercentRule(
        2,
        0,
        'fixedPercentPrice',
        false,
        'auto',
        true,
        [
          {
            type: 'subtotal_at_least',
            value: 1000,
          },
        ],
        10
      ),
    ]

    const input = {
      items: [
        {
          uid: 'price_tier_product',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 300,
          categories: ['Main'],
          tags: ['TAG#1'],
          isPriceTier: true,
        },
        {
          uid: 'ABC',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules,
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['_PRICE_TIER', 2],
      itemDiscounts: [
        {
          applicableRuleUid: '_PRICE_TIER',
          perLineDiscountedAmount: 250,
          setFree: false,
          uid: 'price_tier_product',
        },
      ],
      wholeCartDiscount: [
        WholeCartDiscount.make({
          dist: WeightDistribution.make([['ABC', 1000]]),
          discountedAmount: 100,
          setFree: false,
          applicableRuleUid: 2,
        }),
      ],
    }
    expect(result.meta).toEqual(meta)
  })

  it('no discount case: subtotal < at least', async () => {
    const rules = [
      // Price tier discount rule
      new FixedPriceRule(
        '_PRICE_TIER',
        0,
        'fixedDiscountPrice',
        false,
        'auto',
        false,
        [
          {
            type: 'uids',
            uids: ['price_tier_product'],
          },
        ],
        250
      ),
      // Not eligible to price tier rule
      new FixedPercentRule(
        2,
        0,
        'fixedPercentPrice',
        false,
        'auto',
        true,
        [
          {
            type: 'subtotal_at_least',
            value: 1000,
          },
        ],
        10
      ),
    ]

    const input = {
      items: [
        {
          uid: 'price_tier_product',
          cartItemIndexKey: '0',
          qty: 5,
          perItemPrice: 300,
          categories: ['Main'],
          tags: ['TAG#1'],
          isPriceTier: true,
        },
        {
          uid: 'ABC',
          cartItemIndexKey: '0',
          qty: 3,
          perItemPrice: 200,
          categories: ['Main'],
          tags: ['TAG#1'],
        },
      ],
      rules,
    }

    const result = await engine.process(input, {})

    const meta = {
      applicableRuleUids: ['_PRICE_TIER'],
      itemDiscounts: [
        ItemDiscount.make({
          applicableRuleUid: '_PRICE_TIER',
          perLineDiscountedAmount: 250,
          setFree: false,
          uid: 'price_tier_product',
        }),
      ],
      unapplicableRules: [
        {
          uid: 2,
          errors: ["Subtotal amount doesn't reach the minimum requirement."],
        },
      ],
    }
    expect(result.meta).toEqual(meta)
  })
})
