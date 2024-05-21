import { formatToCPA005, validateCPA005 } from './formats/cpa005.js';
export class EFTGenerator {
    #config;
    #transactions;
    constructor(config) {
        this.#config = config;
        this.#transactions = [];
    }
    getConfiguration() {
        return this.#config;
    }
    addTransaction(transaction) {
        this.#transactions.push(transaction);
    }
    addCreditTransaction(transactionSegment) {
        this.addTransaction({
            recordType: 'C',
            segments: [transactionSegment]
        });
    }
    addDebitTransaction(transactionSegment) {
        this.addTransaction({
            recordType: 'D',
            segments: [transactionSegment]
        });
    }
    getTransactions() {
        return this.#transactions;
    }
    toCPA005() {
        return formatToCPA005(this);
    }
    validateCPA005() {
        try {
            validateCPA005(this);
            return true;
        }
        catch {
            return false;
        }
    }
}
export { cpaTransactionCodes, isCPATransactionCode } from '@cityssm/cpa-codes';
