# EFT Generator for Node

[![Maintainability](https://api.codeclimate.com/v1/badges/b0fcaa947fb6dee89832/maintainability)](https://codeclimate.com/github/cityssm/node-eft-generator/maintainability)
[![DeepSource](https://app.deepsource.com/gh/cityssm/node-eft-generator.svg/?label=active+issues&show_trend=true&token=cznyFIk-aMahhJdonnA8yjqZ)](https://app.deepsource.com/gh/cityssm/node-eft-generator/?ref=repository-badge)
[![codecov](https://codecov.io/gh/cityssm/node-eft-generator/graph/badge.svg?token=JLS2JHUC4O)](https://codecov.io/gh/cityssm/node-eft-generator)

Formats Electronic Funds Transfer (EFT) data into the CPA 005 standard.

Supports credit (C) and debit (D) record types.
Other logical record types are not supported.

## Installation

```sh
npm install @cityssm/eft-generator
```

## Usage

```javascript
import fs from 'node:fs'
import { EFTGenerator } from '@cityssm/eft-generator'

const eftGenerator = new EFTGenerator({
  originatorId: '0123456789',
  originatorShortName: 'SSM',
  originatorLongName: 'The City of Sault Ste. Marie',
  fileCreationNumber: '0001'
})

eftGenerator.addDebitTransaction({
  bankInstitutionNumber: '111',
  bankTransitNumber: '22222',
  bankAccountNumber: '333333333',
  cpaCode: 385, // Property Taxes
  amount: 1234.56,
  payeeName: 'Test Property Owner'
})

const output = eftGenerator.toCPA005()

fs.writeFileSync('cpa005.txt', output)
```

## Resources

- [Canadian Payments Association Standard 005](https://www.payments.ca/sites/default/files/standard005eng.pdf)
- [Royal Bank CPA-005 Reference](https://www.rbcroyalbank.com/ach/file-451771.pdf)
