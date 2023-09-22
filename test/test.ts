import * as assert from 'node:assert'
import fs from 'node:fs'

import { EFTGenerator, cpaCodes } from '../index.js'
import type { EFTHeader, EFTTransaction } from '../types.js'

const headerData: EFTHeader = {
  originatorId: '0123456789',
  fileCreationNumber: '0001'
}

const transactionData: EFTTransaction = {
  recordType: 'D',
  segments: [
    {
      bankInstitutionNumber: '111',
      bankTransitNumber: '22222',
      bankAccountNumber: '333333333',
      cpaCode: cpaCodes.PropertyTaxes,
      amount: 1234.56,
      payeeName: 'Test Property Owner'
    },
    {
      bankInstitutionNumber: '222',
      bankTransitNumber: '33333',
      bankAccountNumber: '4444444444',
      cpaCode: cpaCodes.PropertyTaxes,
      amount: 2345.67,
      payeeName: 'Test Property Owner 2'
    }
  ]
}

describe('eft-generator', () => {
  it('Creates a CPA-005 formatted output', () => {
    const eftGenerator = new EFTGenerator(headerData)

    eftGenerator.setDefault('originatorShortName', 'SSM')
    eftGenerator.setDefault(
      'originatorLongName',
      'The City of Sault Ste. Marie'
    )

    eftGenerator.addTransaction(transactionData)

    const output = eftGenerator.toCPA005()

    fs.writeFileSync('test/output/cpa005.txt', output)

    assert.ok(output.length > 0)
    assert.strictEqual(output.charAt(0), 'A')
  })
})
