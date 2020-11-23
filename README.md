# Promotion Calculation Engine

Utility Promotion Calculation with TypeScript

## Installation
Use the node package manager [npm](https://www.npmjs.com/get-npm/) to install foobar.
```bash
npm install
```
recommended node version: 12

## How Calculation Engine Works
[Rules] -> [Calculate Engine] -> [Calculated Result]

## Usage

```typescript
import { CalculationEngine } from 'promotion-calculation-engine'

const calculationEngine = new CalculationEngine()
const calculateOrder = await calculationEngine.process({
    rules,
    items,
    deliveryAddresses,
    customer: {
      uniqueId: customer.id,
      email: customer.email,
      msisdn: customer.mobileNo,
      isNewCustomer: customer.isNewCustomer,
    } || null,
    usageCounts: [{
       salesRuleId: rule.id,
       total: 10,
       byCustomer: 1
    }],
  }, {
  
})
  
```

## Test and Development

See example rules in test folder

To run all test rules use command
### `npm run test` or `yarn test`
