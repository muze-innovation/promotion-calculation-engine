import { WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { FixedPriceRule } from '../src/incart'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  const items = [
    {
      uid: 'ABC1',
      cartItemIndexKey: '0',
      qty: 2,
      perItemPrice: 1000,
      categories: ['Main'],
      tags: ['TAG#1'],
    },
    {
      uid: 'ABC2',
      cartItemIndexKey: '0',
      qty: 1,
      perItemPrice: 500,
      categories: ['Non-Main'],
      tags: ['TAG#1'],
    },
  ]

  const createRulesAndResult = (rulesAmount: number, stopAtIndex: number) => {
    const { rules, result } = new Array(rulesAmount).fill(undefined).reduce(
      (acc, _, index) => ({
        rules: [
          ...acc.rules,
          new FixedPriceRule(
            `fixed10baht${index}`,
            index,
            'fixedPriceRule',
            stopAtIndex === index,
            'auto',
            false,
            [],
            10
          ),
        ],
        result: {
          applicableRuleUids: [
            ...acc.result.applicableRuleUids,
            ...(index <= stopAtIndex ? [`fixed10baht${index}`] : []),
          ],
          wholeCartDiscount: [
            ...acc.result.wholeCartDiscount,
            ...(index <= stopAtIndex
              ? [
                  WholeCartDiscount.make({
                    applicableRuleUid: `fixed10baht${index}`,
                    discountedAmount: 10,
                    setFree: false,
                    dist: WeightDistribution.make([
                      ['ABC1', 2000 - 8 * index],
                      ['ABC2', 500 - 2 * index],
                    ]),
                  }),
                ]
              : []),
          ],
          unapplicableRules: [
            ...acc.result.unapplicableRules,
            ...(index > stopAtIndex
              ? [
                  {
                    uid: `fixed10baht${index}`,
                    errors: ['This promotion cannot be applied.'],
                  },
                ]
              : []),
          ],
        },
      }),
      {
        rules: [],
        result: {
          applicableRuleUids: [],
          wholeCartDiscount: [],
          unapplicableRules: [],
        },
      }
    )
    return [rules, result]
  }

  it('can stop rules processing', async () => {
    const rulesAmount = 10
    const stopAt = 4
    const [rules, expectedResult] = createRulesAndResult(rulesAmount, stopAt)

    const input = {
      items,
      rules,
    }

    const result = await engine.process(input, {})

    expect(result.meta).toEqual(expectedResult)
  })
})
