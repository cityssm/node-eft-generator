import type { EFTConfiguration, EFTTransaction, EFTTransactionSegment } from './types.js';
export declare class EFTGenerator {
    #private;
    constructor(config: EFTConfiguration);
    getConfiguration(): EFTConfiguration;
    addTransaction(transaction: EFTTransaction): void;
    addCreditTransaction(transactionSegment: EFTTransactionSegment): void;
    addDebitTransaction(transactionSegment: EFTTransactionSegment): void;
    getTransactions(): EFTTransaction[];
    toCPA005(): string;
    validateCPA005(): boolean;
}
export { CPA_CODES, isValidCPACode } from './cpaCodes.js';
export type * as types from './types.js';
