import * as assert from 'node:assert'
import fs from 'node:fs'

import { EFTGenerator, CPA_CODES } from '../index.js'

describe('eft-generator - CPA-005', () => {
  it('Creates valid CPA-005 formatted output', () => {
    const eftGenerator = new EFTGenerator({
      originatorId: '0123456789',
      originatorLongName: 'The City of Sault Ste. Marie',
      originatorShortName: 'SSM',
      fileCreationNumber: '0001'
    })

    assert.strictEqual(eftGenerator.getTransactions().length, 0)

    eftGenerator.addTransaction({
      recordType: 'D',
      segments: [
        {
          bankInstitutionNumber: '111',
          bankTransitNumber: '22222',
          bankAccountNumber: '333333333',
          cpaCode: CPA_CODES.PropertyTaxes,
          amount: 1234.56,
          payeeName: 'Test Property Owner'
        },
        {
          bankInstitutionNumber: '222',
          bankTransitNumber: '33333',
          bankAccountNumber: '4444444444',
          cpaCode: CPA_CODES.PropertyTaxes,
          amount: 2345.67,
          payeeName: 'Test Property Owner 2'
        }
      ]
    })

    assert.strictEqual(eftGenerator.getTransactions().length, 1)

    try {
      assert.ok(eftGenerator.validateCPA005())
    } catch (error) {
      console.log(error)
    }

    const output = eftGenerator.toCPA005()

    fs.writeFileSync('test/output/cpa005.txt', output)

    assert.ok(output.length > 0)
    assert.strictEqual(output.charAt(0), 'A')
  })

  it('Throws error when originatorId length is too long.', () => {
    const eftGenerator = new EFTGenerator({
      originatorId: '12345678901234567890',
      originatorLongName: '',
      fileCreationNumber: '0001'
    })

    try {
      eftGenerator.toCPA005()
      assert.fail()
    } catch {
      assert.ok(true)
    }
  })

  it('Throws error when fileCreationNumber is invalid.', () => {
    const eftGenerator = new EFTGenerator({
      originatorId: '1',
      originatorLongName: '',
      fileCreationNumber: 'abcdefg'
    })

    try {
      eftGenerator.toCPA005()
      assert.fail()
    } catch {
      assert.ok(true)
    }
  })

  it('Warns on missing originatorShortName', () => {
    const eftGenerator = new EFTGenerator({
      originatorId: '01',
      originatorLongName:
        'This name exceeds the 30 character limit and will be truncated.',
      fileCreationNumber: '0001'
    })

    assert.ok(eftGenerator.validateCPA005())
  })
})
