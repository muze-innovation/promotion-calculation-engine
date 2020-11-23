import { CalculationEngine } from '../src/engine'
import { StepVolumeDiscountRule } from '../src/incart'

// TEST CASE
describe('Calculation Engine', () => {
  const engine = new CalculationEngine()

  it('Can create step volume discount rule for uid TEST with 3 item in Cart.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume01',
      0,
      'Can create step volume discount rule for uid TEST with 3 item in Cart.',
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 0,
          type: "percent",
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 15,
          type: "percent",
        },
        {
          startQty: 9,
          endQty: null,
          discount: 20,
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
      ],
      rules: [stepVolumeDiscount],
    }

    const result = await engine.process(input, {})

    const meta = { applicableRuleUids: ['stepVolume01'], wholeCartDiscount: [{ applicableRuleUid: 'stepVolume01', discountedAmount: 0, setFree: false }] }
    expect(result).toEqual({ input, meta })
  })

  it('Can create step volume discount rule for uid TEST with 5 item in Cart.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume02',
      0,
      'Step volume Discount',
      [{
        type: 'uids',
        uids: ['TEST'],
      }],
      [
        {
          startQty: 1,
          endQty: 3,
          discount: 5,
          type: "percent",
        },
        {
          startQty: 4,
          endQty: null,
          discount: 10,
          type: "percent",
        },
      ],
      ['TEST'],
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
        {
          uid: 'TEST',
          perLineDiscountedAmount: 75,
          setFree: false,
          applicableRuleUid: 'stepVolume02'
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can create step volume discount rule for uid TEST with 10 item in Cart.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume03',
      0,
      'Can create step volume discount rule for uid TEST with 10 item in Cart',
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: "percent",
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 10,
          type: "percent",
        },
        {
          startQty: 9,
          endQty: null,
          discount: 15,
          type: "percent",
        },
      ],
      [],
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
        {
          discountedAmount: 750,
          setFree: false,
          applicableRuleUid: 'stepVolume03'
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Cannot create step volume discount rule for not match Uid', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume04',
      0,
      'Cannot create step volume discount rule for not match Uid',
      [{
        type: 'uids',
        uids: ['TEST1'],
      }],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: "percent",
        },
        {
          startQty: 5,
          endQty: null,
          discount: 10,
          type: "percent",
        },
      ],
      ['TEST1'],
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
    const meta = {}
    expect(result).toEqual({ input, meta })
  })

  it('Can calculate step only product that match product condition', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume05',
      0,
      'Can calculate step only product that match product condition',
      [{
        type: 'uids',
        uids: ['TEST1'],
      }],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: "percent",
        },
        {
          startQty: 5,
          endQty: null,
          discount: 10,
          type: "percent",
        },
      ],
      ['TEST1'],
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
        {
          uid: 'TEST1',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: 'stepVolume05'
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('Can calculate combine 2 items steps', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'stepVolume06',
      0,
      'Can calculate step only product that match product condition',
      [{
        type: 'uids',
        uids: ['TEST', 'TEST1'],
      }],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 5,
          type: "percent",
        },
        {
          startQty: 5,
          endQty: null,
          discount: 10,
          type: "percent",
        },
      ],
      ['TEST', 'TEST1'],
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
      applicableRuleUids: ['stepVolume06',],
      itemDiscounts: [
        {
          uid: 'TEST',
          perLineDiscountedAmount: 80,
          setFree: false,
          applicableRuleUid: 'stepVolume06'
        },
        {
          uid: 'TEST1',
          perLineDiscountedAmount: 20,
          setFree: false,
          applicableRuleUid: 'stepVolume06'
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('fixed discount case: 5 pieces of same item get 200 discount.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume01',
      0,
      '5 items in cart get 200 discount.',
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 100,
          type: "fixed",
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 200,
          type: "fixed",
        },
        {
          startQty: 6,
          endQty: null,
          discount: 400,
          type: "fixed",
        },
      ],
      []
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

    const meta = { applicableRuleUids: ['fixedStepVolume01'], wholeCartDiscount: [{ applicableRuleUid: 'fixedStepVolume01', discountedAmount: 200, setFree: false }] }
    expect(result).toEqual({ input, meta })
  })

  it('fixed discount case: 2 item 10 pieces in total get 400 discount.', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume02',
      0,
      '8 items in cart get 400 discount.',
      [],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 100,
          type: "fixed",
        },
        {
          startQty: 5,
          endQty: 8,
          discount: 200,
          type: "fixed",
        },
        {
          startQty: 9,
          endQty: null,
          discount: 400,
          type: "fixed",
        },
      ],
      []
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

    const meta = { applicableRuleUids: ['fixedStepVolume02'], wholeCartDiscount: [{ applicableRuleUid: 'fixedStepVolume02', discountedAmount: 400, setFree: false }] }
    expect(result).toEqual({ input, meta })
  })

  it('fixed discount case: 1 of product uids matches salesrule uid condition', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume03',
      0,
      '1 of product uids matches salesrule uid condition',
      [{
        type: 'uids',
        uids: ['TEST1','TEST2'],
      }],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 200,
          type: "fixed",
        },
        {
          startQty: 5,
          endQty: null,
          discount: 500,
          type: "fixed",
        },
      ],
      ['TEST1','TEST2'],
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
        {
          uid: 'TEST1',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: 'fixedStepVolume03'
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('fixed discount case: multiple product uids match salesrule uid condition', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume04',
      0,
      'multiple product uids match salesrule uid condition',
      [{
        type: 'uids',
        uids: ['TEST1','TEST2'],
      }],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 200,
          type: "fixed",
        },
        {
          startQty: 5,
          endQty: null,
          discount: 500,
          type: "fixed",
        },
      ],
      ['TEST1','TEST2'],
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
        {
          uid: 'TEST1',
          perLineDiscountedAmount: 300,
          setFree: false,
          applicableRuleUid: 'fixedStepVolume04'
        },
        {
          uid: 'TEST2',
          perLineDiscountedAmount: 200,
          setFree: false,
          applicableRuleUid: 'fixedStepVolume04'
        },
      ],
    }
    expect(result).toEqual({ input, meta })
  })

  it('no fixed discount case: product uids not match salesrule uid condition', async () => {
    const stepVolumeDiscount = new StepVolumeDiscountRule(
      'fixedStepVolume04',
      0,
      'multiple product uids match salesrule uid condition',
      [{
        type: 'uids',
        uids: ['TEST1','TEST2'],
      }],
      [
        {
          startQty: 1,
          endQty: 4,
          discount: 200,
          type: "fixed",
        },
        {
          startQty: 5,
          endQty: null,
          discount: 500,
          type: "fixed",
        },
      ],
      ['TEST1','TEST2'],
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
    const meta = {}
    expect(result).toEqual({ input, meta })
  })

})
