import { formatToCPA005 } from './formats/cpa005.js';
export class EFTGenerator {
    _header;
    #transactions;
    _defaults = {
        originatorShortName: '',
        originatorLongName: ''
    };
    constructor(header) {
        if (header !== undefined) {
            this.setHeader(header);
        }
        this.#transactions = [];
    }
    setHeader(header) {
        this._header = header;
    }
    setDefault(defaultName, defaultValue) {
        this._defaults[defaultName] = defaultValue;
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
}
export { cpaCodes } from './cpaCodes.js';
