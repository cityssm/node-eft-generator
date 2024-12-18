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
    /**
     * Generates a CPA-005 formatted string.
     * @throws Fatal error if the configuration or transactions don't pass validation.
     * @returns Data formatted to the CPA-005 standard.
     */
    toCPA005() {
        return formatToCPA005(this);
    }
    /**
     * Checks if the current configuration and transactions can be processed into the CPA-005 format.
     * @returns `true` if there will be no fatal errors.
     */
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
