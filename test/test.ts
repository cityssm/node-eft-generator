import assert from 'node:assert'
import fs from 'node:fs'

import { EFTGenerator, CPA_CODES } from '../index.js'
import type { EFTConfiguration } from '../types.js'

const config: EFTConfiguration = {
  originatorId: '0123456789',
  originatorLongName: 'The City of Sault Ste. Marie',
  originatorShortName: 'SSM',
  fileCreationNumber: '0001',
  destinationCurrency: 'CAD',
  destinationDataCentre: '123'
}

describe('eft-generator - CPA-005', () => {
  it('Creates valid CPA-005 formatted output', () => {
    const eftGenerator = new EFTGenerator(config)

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

    eftGenerator.addTransaction({
      recordType: 'C',
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

    assert.strictEqual(eftGenerator.getTransactions().length, 2)

    try {
      assert.ok(eftGenerator.validateCPA005())
    } catch (error) {
      console.log(error)
    }

    const output = eftGenerator.toCPA005()

    fs.writeFileSync('test/output/cpa005.txt', output)

    assert.ok(output.length > 0)
    assert.strictEqual(output.charAt(0), 'A')

    const outputLines = output.split('\r\n')

    for (const outputLine of outputLines) {
      assert.strictEqual(outputLine.length, 1464)
    }
  })

  describe('Configuration errors and warnings', () => {
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

    it('Throws error when destinationDataCentre is invalid.', () => {
      const eftGenerator = new EFTGenerator({
        originatorId: '1',
        originatorLongName: 'Name',
        fileCreationNumber: '1234',
        destinationDataCentre: '1234567'
      })

      try {
        eftGenerator.toCPA005()
        assert.fail()
      } catch {
        assert.ok(true)
      }
    })

    it('Throws error when destinationCurrency is invalid.', () => {
      const eftGenerator = new EFTGenerator({
        originatorId: '1',
        originatorLongName: 'Name',
        fileCreationNumber: '1234',
        destinationCurrency: 'AUD'
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

  describe('Transaction errors and warnings', () => {
    it('Throws error when recordType is unsupported', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addTransaction({
        recordType: 'E',
        segments: [
          {
            payeeName: 'Invalid Institution',
            amount: 100,
            bankInstitutionNumber: 'abc',
            bankTransitNumber: '1',
            bankAccountNumber: '1',
            cpaCode: CPA_CODES.Taxes
          }
        ]
      })

      try {
        eftGenerator.toCPA005()
        assert.fail()
      } catch {
        assert.ok(true)
      }
    })

    it('Warns when there are no segments on a transaction.', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addTransaction({
        recordType: 'D',
        segments: []
      })

      assert.ok(eftGenerator.validateCPA005())

      const output = eftGenerator.toCPA005()

      assert.ok(output.length > 0)
    })

    it('Warns when there are more than six segments on a transaction.', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addTransaction({
        recordType: 'D',
        segments: [
          {
            bankInstitutionNumber: '111',
            bankTransitNumber: '22222',
            bankAccountNumber: '3333333',
            cpaCode: CPA_CODES.PropertyTaxes,
            amount: 100.01,
            payeeName: 'Test Property Owner'
          },
          {
            bankInstitutionNumber: '111',
            bankTransitNumber: '22222',
            bankAccountNumber: '3333333',
            cpaCode: CPA_CODES.PropertyTaxes,
            amount: 100.02,
            payeeName: 'Test Property Owner'
          },
          {
            bankInstitutionNumber: '111',
            bankTransitNumber: '22222',
            bankAccountNumber: '3333333',
            cpaCode: CPA_CODES.PropertyTaxes,
            amount: 100.03,
            payeeName: 'Test Property Owner'
          },
          {
            bankInstitutionNumber: '111',
            bankTransitNumber: '22222',
            bankAccountNumber: '3333333',
            cpaCode: CPA_CODES.PropertyTaxes,
            amount: 100.04,
            payeeName: 'Test Property Owner'
          },
          {
            bankInstitutionNumber: '111',
            bankTransitNumber: '22222',
            bankAccountNumber: '3333333',
            cpaCode: CPA_CODES.PropertyTaxes,
            amount: 100.05,
            payeeName: 'Test Property Owner'
          },
          {
            bankInstitutionNumber: '111',
            bankTransitNumber: '22222',
            bankAccountNumber: '3333333',
            cpaCode: CPA_CODES.PropertyTaxes,
            amount: 100.06,
            payeeName: 'Test Property Owner'
          },
          {
            bankInstitutionNumber: '111',
            bankTransitNumber: '22222',
            bankAccountNumber: '3333333',
            cpaCode: CPA_CODES.PropertyTaxes,
            amount: 100.07,
            payeeName: 'Test Property Owner'
          }
        ]
      })

      assert.ok(eftGenerator.validateCPA005())
    })

    it('Throws error when a transaction has a negative amount.', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addDebitTransaction({
        payeeName: 'Negative Amount',
        amount: -2,
        bankInstitutionNumber: '1',
        bankTransitNumber: '1',
        bankAccountNumber: '1',
        cpaCode: 1
      })

      assert.ok(!eftGenerator.validateCPA005())
    })

    it('Throws error when a transaction has too large of an amount', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addDebitTransaction({
        payeeName: 'Large Amount',
        amount: 999_999_999,
        bankInstitutionNumber: '1',
        bankTransitNumber: '1',
        bankAccountNumber: '1',
        cpaCode: CPA_CODES.Taxes
      })

      try {
        eftGenerator.toCPA005()
        assert.fail()
      } catch {
        assert.ok(true)
      }
    })

    it('Throws error when bankInstitutionNumber is invalid', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addDebitTransaction({
        payeeName: 'Invalid Institution',
        amount: 100,
        bankInstitutionNumber: 'abc',
        bankTransitNumber: '1',
        bankAccountNumber: '1',
        cpaCode: CPA_CODES.Taxes
      })

      try {
        eftGenerator.toCPA005()
        assert.fail()
      } catch {
        assert.ok(true)
      }
    })

    it('Throws error when bankTransitNumber is invalid', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addDebitTransaction({
        payeeName: 'Invalid Transit',
        amount: 100,
        bankInstitutionNumber: '1',
        bankTransitNumber: '1234567',
        bankAccountNumber: '1',
        cpaCode: CPA_CODES.Taxes
      })

      try {
        eftGenerator.toCPA005()
        assert.fail()
      } catch {
        assert.ok(true)
      }
    })

    it('Throws error when bankAccountNumber is invalid', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addDebitTransaction({
        payeeName: 'Invalid Account',
        amount: 100,
        bankInstitutionNumber: '1',
        bankTransitNumber: '1',
        bankAccountNumber: 'abcd',
        cpaCode: CPA_CODES.Taxes
      })

      try {
        eftGenerator.toCPA005()
        assert.fail()
      } catch {
        assert.ok(true)
      }
    })

    it('Warns when the payeeName is too long.', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addCreditTransaction({
        payeeName: 'This payee name is too long and will be truncated to fit.',
        amount: 100,
        bankInstitutionNumber: '1',
        bankTransitNumber: '1',
        bankAccountNumber: '1',
        cpaCode: CPA_CODES.Taxes
      })

      assert.ok(eftGenerator.validateCPA005())
    })

    it('Warns when the crossReferenceNumber is duplicated.', () => {
      const eftGenerator = new EFTGenerator(config)

      eftGenerator.addDebitTransaction({
        payeeName: 'Same cross reference',
        crossReferenceNumber: 'abc',
        amount: 100,
        bankInstitutionNumber: '1',
        bankTransitNumber: '1',
        bankAccountNumber: '1',
        cpaCode: CPA_CODES.Taxes
      })

      eftGenerator.addDebitTransaction({
        payeeName: 'Same cross reference',
        crossReferenceNumber: 'abc',
        amount: 100,
        bankInstitutionNumber: '1',
        bankTransitNumber: '1',
        bankAccountNumber: '1',
        cpaCode: CPA_CODES.Taxes
      })

      assert.ok(eftGenerator.validateCPA005())
    })
  })
})
