import { ItemDiscount, WholeCartDiscount } from '../src'
import { WeightDistribution } from '../src/discounts/WeightDistribution'
import { CalculationEngine } from '../src/engine'
import { FixedPercentRule, StepVolumeDiscountRule } from '../src/incart'

describe('Max discount', () => {
  const engine = new CalculationEngine()

  const inputNoRule = {
    items: [
      {
        uid: 'ABC1',
        cartItemIndexKey: '0',
        qty: 3,
        perItemPrice: 1000,
        categories: ['Main'],
        tags: ['TAG#1'],
      },
      {
        uid: 'ABC2',
        cartItemIndexKey: '0',
        qty: 4,
        perItemPrice: 500,
        categories: ['Non-Main'],
        tags: ['TAG#1'],
      },
    ],
  }

  const inputNoRuleDistAll = WeightDistribution.make([
    ['ABC1', 3000],
    ['ABC2', 2000],
  ])

  describe('Fixed percent rule', () => {
    it.each`
      maxDiscount
      ${-100}
      ${0}
      ${[]}
      ${[100, 200]}
      ${''}
      ${'0'}
      ${{}}
      ${{ maxDiscount: 200 }}
    `(
      'can throw error when maxDiscount is $maxDiscount which is invalid',
      ({ maxDiscount }) => {
        expect(
          () =>
            new FixedPercentRule(
              'fixed10perc',
              0,
              'fixedDiscountPercent',
              false,
              'auto',
              false,
              [],
              10,
              maxDiscount
            )
        ).toThrow()
      }
    )

    it('can limit whole cart discount', async () => {
      const rule = new FixedPercentRule(
        'fixed10perc',
        0,
        'fixedDiscountPercent',
        false,
        'auto',
        false,
        [],
        10,
        300
      )

      const input = {
        ...inputNoRule,
        rules: [rule],
      }

      const result = await engine.process(input, {})

      const meta = {
        applicableRuleUids: ['fixed10perc'],
        wholeCartDiscount: [
          WholeCartDiscount.make({
            discountedAmount: 300,
            dist: inputNoRuleDistAll,
            setFree: false,
            applicableRuleUid: 'fixed10perc',
          }),
        ],
      }
      expect(result.meta).toEqual(meta)
    })

    it('can limit per item discount', async () => {
      const rule = new FixedPercentRule(
        'fixed10perc',
        0,
        'fixedDiscountPercent',
        false,
        'perItem',
        false,
        [],
        10,
        300
      )

      const input = {
        ...inputNoRule,
        rules: [rule],
      }

      const result = await engine.process(input, {})

      const meta = {
        applicableRuleUids: ['fixed10perc'],
        itemDiscounts: [
          ItemDiscount.make({
            perLineDiscountedAmount: 180,
            setFree: false,
            applicableRuleUid: 'fixed10perc',
            uid: 'ABC1',
          }),
          ItemDiscount.make({
            perLineDiscountedAmount: 120,
            setFree: false,
            applicableRuleUid: 'fixed10perc',
            uid: 'ABC2',
          }),
        ],
      }
      expect(result.meta).toEqual(meta)
    })
  })

  describe('Step percent rule', () => {
    it.each`
      maxDiscount
      ${-100}
      ${0}
      ${[]}
      ${[100, 200]}
      ${''}
      ${'0'}
      ${{}}
      ${{ maxDiscount: 200 }}
    `(
      'can throw error when maxDiscount is $maxDiscount which is invalid',
      ({ maxDiscount }) => {
        expect(
          () =>
            new StepVolumeDiscountRule(
              'stepVolume',
              0,
              'percentStepVolume',
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
                  discount: 10,
                  type: 'percent',
                },
                {
                  startQty: 9,
                  endQty: null,
                  discount: 20,
                  type: 'percent',
                },
              ],
              maxDiscount
            )
        ).toThrow()
      }
    )

    it('can limit whole cart discount', async () => {
      const rule = new StepVolumeDiscountRule(
        'stepVolume',
        0,
        'percentStepVolume',
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
            discount: 10,
            type: 'percent',
          },
          {
            startQty: 9,
            endQty: null,
            discount: 20,
            type: 'percent',
          },
        ],
        300
      )

      const input = {
        ...inputNoRule,
        rules: [rule],
      }

      const result = await engine.process(input, {})

      const meta = {
        applicableRuleUids: ['stepVolume'],
        wholeCartDiscount: [
          WholeCartDiscount.make({
            discountedAmount: 300,
            dist: inputNoRuleDistAll,
            setFree: false,
            applicableRuleUid: 'stepVolume',
          }),
        ],
      }
      expect(result.meta).toEqual(meta)
    })

    it('can limit per item discount', async () => {
      const rule = new StepVolumeDiscountRule(
        'stepVolume',
        0,
        'percentStepVolume',
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
        ],
        300
      )

      const input = {
        ...inputNoRule,
        rules: [rule],
      }

      const result = await engine.process(input, {})

      const meta = {
        applicableRuleUids: ['stepVolume'],
        itemDiscounts: [
          ItemDiscount.make({
            perLineDiscountedAmount: 180,
            setFree: false,
            applicableRuleUid: 'stepVolume',
            uid: 'ABC1',
          }),
          ItemDiscount.make({
            perLineDiscountedAmount: 120,
            setFree: false,
            applicableRuleUid: 'stepVolume',
            uid: 'ABC2',
          }),
        ],
      }
      expect(result.meta).toEqual(meta)
    })
  })
})
