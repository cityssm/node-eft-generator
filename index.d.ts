import type { EFTConfiguration, EFTTransaction, EFTTransactionSegment } from './types.js';
export declare class EFTGenerator {
    #private;
    constructor(config: EFTConfiguration);
    getConfiguration(): EFTConfiguration;
    addTransaction(transaction: EFTTransaction): void;
    addCreditTransaction(transactionSegment: EFTTransactionSegment): void;
    addDebitTransaction(transactionSegment: EFTTransactionSegment): void;
    getTransactions(): EFTTransaction[];
    /**
     * Generates a CPA-005 formatted string.
     * @throws Fatal error if the configuration or transactions don't pass validation.
     * @returns Data formatted to the CPA-005 standard.
     */
    toCPA005(): string;
    /**
     * Checks if the current configuration and transactions can be processed into the CPA-005 format.
     * @returns `true` if there will be no fatal errors.
     */
    validateCPA005(): boolean;
}
export { cpaTransactionCodes, isCPATransactionCode } from '@cityssm/cpa-codes';
export type * as types from './types.js';
