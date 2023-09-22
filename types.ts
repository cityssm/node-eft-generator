export interface EFTHeader {
  /**
   * Also known as
   * - Client Number
   * - Company ID
   * - Customer Number
   */
  originatorId: string

  /**
   * Four digit number.
   * Should be different from previous 10 numbers submitted for processing.
   */
  fileCreationNumber: string

  /**
   * If not set, will use today.
   */
  fileCreationDate?: Date

  /**
   * Also known as:
   * - Processing Centre
   */
  destinationDataCentre?: string

  destinationCurrency?: 'CAD' | 'USD'
}

export interface EFTTransaction {
  /**
   * C = Credit - sending funds
   * D = Debit  - receiving funds
   */
  recordType: 'C' | 'D'

  segments: EFTTransactionSegment[]
}

export interface EFTTransactionSegment {
  cpaCode: number

  /**
   * In dollars
   */
  amount: number

  /**
   * If not set, will use today.
   */
  paymentDate?: Date

  /**
   * Three digits
   */
  bankInstitutionNumber: string

  /**
   * Five digits
   */
  bankTransitNumber: string

  bankAccountNumber: string

  payeeName: string

  crossReferenceNumber?: string
}
