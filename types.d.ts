export interface EFTConfiguration {
    originatorId: string;
    originatorShortName?: string;
    originatorLongName: string;
    fileCreationNumber: string;
    fileCreationDate?: Date;
    destinationDataCentre?: string;
    destinationCurrency?: 'CAD' | 'USD';
    returnInstitutionNumber?: string;
    returnTransitNumber?: string;
    returnAccountNumber?: string;
}
export interface EFTTransaction {
    recordType: 'C' | 'D';
    segments: EFTTransactionSegment[];
}
export interface EFTTransactionSegment {
    cpaCode: `${number}`;
    amount: number;
    paymentDate?: Date;
    bankInstitutionNumber: string;
    bankTransitNumber: string;
    bankAccountNumber: string;
    payeeName: string;
    crossReferenceNumber?: string;
}
export type ValidationWarning = {
    warning: string;
} & ({
    warningField: keyof EFTConfiguration | 'transactions';
} | {
    transactionIndex: number;
    warningField: keyof EFTTransaction;
} | {
    transactionIndex: number;
    transactionSegmentIndex: number;
    warningField: keyof EFTTransactionSegment;
});
