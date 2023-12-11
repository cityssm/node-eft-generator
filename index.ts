import { formatToCPA005, validateCPA005 } from './formats/cpa005.js'
import type {
  EFTConfiguration,
  EFTTransaction,
  EFTTransactionSegment
} from './types.js'

export class EFTGenerator {
  readonly #config: EFTConfiguration
  readonly #transactions: EFTTransaction[]

  constructor(config: EFTConfiguration) {
    this.#config = config
    this.#transactions = []
  }

  getConfiguration(): EFTConfiguration {
    return this.#config
  }

  addTransaction(transaction: EFTTransaction): void {
    this.#transactions.push(transaction)
  }

  addCreditTransaction(transactionSegment: EFTTransactionSegment): void {
    this.addTransaction({
      recordType: 'C',
      segments: [transactionSegment]
    })
  }

  addDebitTransaction(transactionSegment: EFTTransactionSegment): void {
    this.addTransaction({
      recordType: 'D',
      segments: [transactionSegment]
    })
  }

  getTransactions(): EFTTransaction[] {
    return this.#transactions
  }

  /**
   * Generates a CPA-005 formatted string.
   * @throws Fatal error if the configuration or transactions don't pass validation.
   * @returns Data formatted to the CPA-005 standard.
   */
  toCPA005(): string {
    return formatToCPA005(this)
  }

  /**
   * Checks if the current configuration and transactions can be processed into the CPA-005 format successfully.
   * @returns `true` if there will be no fatal errors.
   */
  validateCPA005(): boolean {
    try {
      validateCPA005(this)
      return true
    } catch {
      return false
    }
  }
}

export { CPA_CODES, isValidCPACode } from './cpaCodes.js'
export type * as types from './types.js'
