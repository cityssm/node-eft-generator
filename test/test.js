import * as assert from 'node:assert';
import fs from 'node:fs';
import { EFTGenerator, CPA_CODES } from '../index.js';
const configData = {
    originatorId: '0123456789',
    originatorLongName: 'The City of Sault Ste. Marie',
    originatorShortName: 'SSM',
    fileCreationNumber: '0001'
};
const transactionData = {
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
};
describe('eft-generator', () => {
    it('Creates a CPA-005 formatted output', () => {
        const eftGenerator = new EFTGenerator(configData);
        eftGenerator.addTransaction(transactionData);
        assert.ok(eftGenerator.validateCPA005());
        const output = eftGenerator.toCPA005();
        fs.writeFileSync('test/output/cpa005.txt', output);
        assert.ok(output.length > 0);
        assert.strictEqual(output.charAt(0), 'A');
    });
});
