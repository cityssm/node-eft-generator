import type * as types from './types.js';
export declare class EFTGenerator {
    #private;
    _header: types.EFTHeader;
    _defaults: {
        originatorShortName: string;
        originatorLongName: string;
    };
    constructor(header?: types.EFTHeader);
    setHeader(header: types.EFTHeader): void;
    setDefault(defaultName: keyof typeof this._defaults, defaultValue: string): void;
    addTransaction(transaction: types.EFTTransaction): void;
    addCreditTransaction(transactionSegment: types.EFTTransactionSegment): void;
    addDebitTransaction(transactionSegment: types.EFTTransactionSegment): void;
    getTransactions(): types.EFTTransaction[];
    toCPA005(): string;
}
export { cpaCodes } from './cpaCodes.js';
