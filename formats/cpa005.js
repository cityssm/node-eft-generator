import { isCPATransactionCode } from '@cityssm/cpa-codes';
import { toShortModernJulianDate } from '@cityssm/modern-julian-date';
import Debug from 'debug';
const debug = Debug('eft-generator:cpa005');
export const NEWLINE = '\r\n';
function toJulianDate(date) {
    return ('0' + toShortModernJulianDate(date));
}
function validateConfig(eftConfig) {
    const validationWarnings = [];
    if (eftConfig.originatorId.length > 10) {
        throw new Error(`originatorId length exceeds 10: ${eftConfig.originatorId}`);
    }
    if (!/^\d{1,4}$/.test(eftConfig.fileCreationNumber)) {
        throw new Error(`fileCreationNumber should be 1 to 4 digits: ${eftConfig.fileCreationNumber}`);
    }
    if (!/^\d{0,5}$/.test(eftConfig.destinationDataCentre ?? '')) {
        throw new Error(`destinationDataCentre should be 1 to 5 digits: ${eftConfig.destinationDataCentre}`);
    }
    if (eftConfig.originatorShortName === undefined) {
        validationWarnings.push({
            warningField: 'originatorShortName',
            warning: 'originatorShortName not defined, using originatorLongName.'
        });
        eftConfig.originatorShortName = eftConfig.originatorLongName;
    }
    if (eftConfig.originatorShortName.length > 15) {
        validationWarnings.push({
            warningField: 'originatorShortName',
            warning: `originatorShortName will be truncated to 15 characters: ${eftConfig.originatorShortName}`
        });
    }
    if (eftConfig.originatorLongName.length > 30) {
        validationWarnings.push({
            warningField: 'originatorLongName',
            warning: `originatorLongName will be truncated to 30 characters: ${eftConfig.originatorLongName}`
        });
    }
    if (!['', 'CAD', 'USD'].includes(eftConfig.destinationCurrency ?? '')) {
        throw new Error(`Unsupported destinationCurrency: ${eftConfig.destinationCurrency}`);
    }
    let returnAccountUndefinedCount = 0;
    if (eftConfig.returnInstitutionNumber === undefined) {
        returnAccountUndefinedCount += 1;
    }
    else if (!/^\d{1,3}$/.test(eftConfig.returnInstitutionNumber)) {
        throw new Error(`returnInstitutionNumber should be 1 to 3 digits: ${eftConfig.returnInstitutionNumber}`);
    }
    if (eftConfig.returnTransitNumber === undefined) {
        returnAccountUndefinedCount += 1;
    }
    else if (!/^\d{1,5}$/.test(eftConfig.returnTransitNumber)) {
        throw new Error(`returnTransitNumber should be 1 to 3 digits: ${eftConfig.returnTransitNumber}`);
    }
    if (eftConfig.returnAccountNumber === undefined) {
        returnAccountUndefinedCount += 1;
    }
    else if (!/^\d{1,12}$/.test(eftConfig.returnAccountNumber)) {
        throw new Error(`returnAccountNumber should be 1 to 3 digits: ${eftConfig.returnAccountNumber}`);
    }
    if (returnAccountUndefinedCount > 0 && returnAccountUndefinedCount < 3) {
        throw new Error('returnInstitutionNumber, returnTransitNumber, and returnAccountNumber must by defined together, or not defined at all.');
    }
    return validationWarnings;
}
function validateTransactions(eftTransactions) {
    const validationWarnings = [];
    if (eftTransactions.length === 0) {
        validationWarnings.push({
            warningField: 'transactions',
            warning: 'There are no transactions to include in the file.'
        });
    }
    else if (eftTransactions.length > 999_999_999) {
        throw new Error('Transaction count exceeds 999,999,999.');
    }
    const crossReferenceNumbers = new Set();
    for (const [transactionIndex, transaction] of eftTransactions.entries()) {
        if (transaction.segments.length === 0) {
            validationWarnings.push({
                transactionIndex,
                warningField: 'segments',
                warning: 'Transaction record has no segments, will be ignored.'
            });
        }
        else if (transaction.segments.length > 6) {
            validationWarnings.push({
                transactionIndex,
                warningField: 'segments',
                warning: 'Transaction record has more than 6 segments, will be split into multiple transactions.'
            });
        }
        if (!['C', 'D'].includes(transaction.recordType)) {
            throw new Error(`Unsupported recordType: ${transaction.recordType}`);
        }
        for (const [transactionSegmentIndex, segment] of transaction.segments.entries()) {
            if (!isCPATransactionCode(segment.cpaCode)) {
                validationWarnings.push({
                    transactionIndex,
                    transactionSegmentIndex,
                    warningField: 'cpaCode',
                    warning: `Unknown CPA code: ${segment.cpaCode}`
                });
            }
            if (segment.amount <= 0) {
                throw new Error(`Segment amount cannot be less than or equal to zero: ${segment.amount}`);
            }
            else if (segment.amount >= 100_000_000) {
                throw new Error(`Segment amount cannot exceed $100,000,000: ${segment.amount}`);
            }
            if (!/^\d{1,3}$/.test(segment.bankInstitutionNumber)) {
                throw new Error(`bankInstitutionNumber should be 1 to 3 digits: ${segment.bankInstitutionNumber}`);
            }
            if (!/^\d{1,5}$/.test(segment.bankTransitNumber)) {
                throw new Error(`bankTransitNumber should be 1 to 5 digits: ${segment.bankTransitNumber}`);
            }
            if (!/^\d{1,12}$/.test(segment.bankAccountNumber)) {
                throw new Error(`bankAccountNumber should be 1 to 12 digits: ${segment.bankAccountNumber}`);
            }
            if (segment.payeeName.length > 30) {
                validationWarnings.push({
                    transactionIndex,
                    transactionSegmentIndex,
                    warningField: 'payeeName',
                    warning: `payeeName will be truncated to 30 characters: ${segment.payeeName}`
                });
            }
            if (segment.crossReferenceNumber !== undefined) {
                if (crossReferenceNumbers.has(segment.crossReferenceNumber)) {
                    validationWarnings.push({
                        transactionIndex,
                        transactionSegmentIndex,
                        warningField: 'crossReferenceNumber',
                        warning: `crossReferenceNumber should be unique: ${segment.crossReferenceNumber}`
                    });
                }
                crossReferenceNumbers.add(segment.crossReferenceNumber);
            }
        }
    }
    return validationWarnings;
}
export function validateCPA005(eftGenerator) {
    const validationWarnings = validateConfig(eftGenerator.getConfiguration());
    validationWarnings.push(...validateTransactions(eftGenerator.getTransactions()));
    return validationWarnings;
}
function formatHeader(eftConfig) {
    const fileCreationJulianDate = toJulianDate(eftConfig.fileCreationDate ?? new Date());
    let dataCentre = ''.padEnd(5, ' ');
    if (eftConfig.destinationDataCentre !== undefined) {
        dataCentre = eftConfig.destinationDataCentre.padStart(5, '0');
    }
    let destinationCurrency = ''.padEnd(3, ' ');
    if (eftConfig.destinationCurrency !== undefined) {
        destinationCurrency = eftConfig.destinationCurrency;
    }
    return ('A' +
        '1'.padStart(9, '0') +
        eftConfig.originatorId.padEnd(10, ' ') +
        eftConfig.fileCreationNumber.padStart(4, '0').slice(-4) +
        fileCreationJulianDate +
        dataCentre +
        ''.padEnd(20, ' ') +
        destinationCurrency +
        ''.padEnd(1406, ' '));
}
export function formatToCPA005(eftGenerator) {
    const validationWarnings = validateCPA005(eftGenerator);
    if (validationWarnings.length > 0) {
        debug(`Proceeding with ${validationWarnings.length} warnings.`);
        debug(validationWarnings);
    }
    const eftConfig = eftGenerator.getConfiguration();
    const outputLines = [];
    outputLines.push(formatHeader(eftConfig));
    let recordCount = 1;
    let record = '';
    let totalValueDebits = 0;
    let totalNumberDebits = 0;
    let totalValueCredits = 0;
    let totalNumberCredits = 0;
    for (const transaction of eftGenerator.getTransactions()) {
        record = '';
        for (let segmentIndex = 0; segmentIndex < transaction.segments.length; segmentIndex += 1) {
            if (segmentIndex % 6 === 0) {
                if (segmentIndex > 0) {
                    outputLines.push(record);
                }
                recordCount += 1;
                if (transaction.recordType === 'C') {
                    totalNumberCredits += 1;
                }
                else {
                    totalNumberDebits += 1;
                }
                record =
                    transaction.recordType +
                        recordCount.toString().padStart(9, '0') +
                        eftConfig.originatorId.padEnd(10, ' ') +
                        eftConfig.fileCreationNumber.padStart(4, '0');
            }
            const segment = transaction.segments[segmentIndex];
            const paymentJulianDate = toJulianDate(segment.paymentDate ?? new Date());
            let crossReferenceNumber = segment.crossReferenceNumber;
            if (crossReferenceNumber === undefined) {
                crossReferenceNumber =
                    'f' +
                        eftConfig.fileCreationNumber +
                        'r' +
                        recordCount.toString() +
                        's' +
                        (segmentIndex + 1).toString();
            }
            const originatorShortName = eftConfig.originatorShortName ?? eftConfig.originatorLongName;
            record +=
                segment.cpaCode.toString() +
                    Math.round(segment.amount * 100)
                        .toString()
                        .padStart(10, '0') +
                    paymentJulianDate +
                    ''.padStart(1, '0') +
                    segment.bankInstitutionNumber.padStart(3, '0') +
                    segment.bankTransitNumber.padStart(5, '0') +
                    segment.bankAccountNumber.padEnd(12, ' ') +
                    ''.padStart(22, '0') +
                    ''.padStart(3, '0') +
                    originatorShortName.padEnd(15, ' ').slice(0, 15) +
                    segment.payeeName.padEnd(30, ' ').slice(0, 30) +
                    eftConfig.originatorLongName.padEnd(30, ' ').slice(0, 30) +
                    eftConfig.originatorId.padEnd(10, ' ') +
                    crossReferenceNumber.padEnd(19, ' ').slice(0, 19) +
                    ''.padStart(1, '0') +
                    (eftConfig.returnInstitutionNumber === undefined
                        ? ''.padEnd(3, ' ')
                        : eftConfig.returnInstitutionNumber.padStart(3, '0')) +
                    (eftConfig.returnTransitNumber === undefined
                        ? ''.padEnd(5, ' ')
                        : eftConfig.returnTransitNumber.padStart(5, '0')) +
                    (eftConfig.returnAccountNumber ?? '').padEnd(12, ' ') +
                    ''.padEnd(15, ' ') +
                    ''.padEnd(22, ' ') +
                    ''.padEnd(2, ' ') +
                    ''.padStart(11, '0');
            if (transaction.recordType === 'C') {
                totalValueCredits += segment.amount;
            }
            else {
                totalValueDebits += segment.amount;
            }
        }
        if (record !== '') {
            outputLines.push(record.padEnd(1464, ' '));
        }
    }
    const trailer = 'Z' +
        (recordCount + 1).toString().padStart(9, '0') +
        eftConfig.originatorId.padEnd(10, ' ') +
        eftConfig.fileCreationNumber.padStart(4, '0').slice(-4) +
        Math.round(totalValueDebits * 100)
            .toString()
            .padStart(14, '0') +
        totalNumberDebits.toString().padStart(8, '0') +
        Math.round(totalValueCredits * 100)
            .toString()
            .padStart(14, '0') +
        totalNumberCredits.toString().padStart(8, '0') +
        '0'.padStart(14, '0') +
        '0'.padStart(8, '0') +
        '0'.padStart(14, '0') +
        '0'.padStart(8, '0') +
        ''.padEnd(1352, ' ');
    outputLines.push(trailer);
    return outputLines.join(NEWLINE);
}
