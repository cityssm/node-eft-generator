import { formatToCPA005 } from './formats/cpa005.js'
import type * as types from './types.js'

export class EFTGenerator {
  _header: types.EFTHeader
  #transactions: types.EFTTransaction[]

  _defaults = {
    originatorShortName: '',
    originatorLongName: ''
  }

  constructor(header?: types.EFTHeader) {
    if (header !== undefined) {
      this.setHeader(header)
    }

    this.#transactions = []
  }

  setHeader(header: types.EFTHeader): void {
    this._header = header
  }

  setDefault(
    defaultName: keyof typeof this._defaults,
    defaultValue: string
  ): void {
    this._defaults[defaultName] = defaultValue
  }

  addTransaction(transaction: types.EFTTransaction): void {
    this.#transactions.push(transaction)
  }

  addCreditTransaction(transactionSegment: types.EFTTransactionSegment): void {
    this.addTransaction({
      recordType: 'C',
      segments: [transactionSegment]
    })
  }

  addDebitTransaction(transactionSegment: types.EFTTransactionSegment): void {
    this.addTransaction({
      recordType: 'D',
      segments: [transactionSegment]
    })
  }

  getTransactions(): types.EFTTransaction[] {
    return this.#transactions
  }

  toCPA005(): string {
    return formatToCPA005(this)
  }
}

export { cpaCodes } from './cpaCodes.js'
