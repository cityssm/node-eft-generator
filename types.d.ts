export interface EFTHeader {
    originatorId: string;
    fileCreationNumber: string;
    fileCreationDate?: Date;
    destinationDataCentre?: string;
    destinationCurrency?: 'CAD' | 'USD';
}
export interface EFTTransaction {
    recordType: 'C' | 'D';
    segments: EFTTransactionSegment[];
}
export interface EFTTransactionSegment {
    cpaCode: number;
    amount: number;
    paymentDate?: Date;
    bankInstitutionNumber: string;
    bankTransitNumber: string;
    bankAccountNumber: string;
    payeeName: string;
    crossReferenceNumber?: string;
}
