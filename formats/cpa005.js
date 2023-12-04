import { toModernJulianDate } from '@cityssm/modern-julian-date';
import Debug from 'debug';
import { CPA_CODES } from '../index.js';
const debug = Debug('eft-generator:cpa005');
function toJulianDate(date) {
    return '0' + toModernJulianDate(date).toString().slice(2);
}
function validateConfig(eftConfig) {
    let warningCount = 0;
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
        debug('originatorShortName not defined, using originatorLongName.');
        warningCount += 1;
        eftConfig.originatorShortName = eftConfig.originatorLongName;
    }
    if (eftConfig.originatorShortName.length > 15) {
        debug(`originatorShortName will be truncated: ${eftConfig.originatorShortName}`);
        warningCount += 1;
    }
    if (eftConfig.originatorLongName.length > 30) {
        debug(`originatorLongName will be truncated: ${eftConfig.originatorLongName}`);
        warningCount += 1;
    }
    if (!['', 'CAD', 'USD'].includes(eftConfig.destinationCurrency ?? '')) {
        throw new Error(`Unsupported destinationCurrency: ${eftConfig.destinationCurrency}`);
    }
    return warningCount;
}
function validateTransactions(eftTransactions) {
    let warningCount = 0;
    if (eftTransactions.length === 0) {
        debug('There are no transactions to include in the file.');
        warningCount += 1;
    }
    else if (eftTransactions.length > 999999999) {
        throw new Error('Transaction count exceeds 999,999,999.');
    }
    const cpaCodeNumbers = Object.values(CPA_CODES);
    const crossReferenceNumbers = new Set();
    for (const transaction of eftTransactions) {
        if (transaction.segments.length === 0) {
            debug('Transaction record has no segments, will be ignored.');
            warningCount += 1;
        }
        if (transaction.segments.length > 6) {
            debug('Transaction record has more than 6 segments, will be split into multiple transactions.');
            warningCount += 1;
        }
        if (!['C', 'D'].includes(transaction.recordType)) {
            throw new Error(`Unsupported recordType: ${transaction.recordType}`);
        }
        for (const segment of transaction.segments) {
            if (!cpaCodeNumbers.includes(segment.cpaCode)) {
                debug(`Unknown CPA code: ${segment.cpaCode}`);
                warningCount += 1;
            }
            if (segment.amount <= 0) {
                throw new Error(`Segment amount cannot be less than or equal to zero: ${segment.amount}`);
            }
            if (segment.amount >= 100000000) {
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
                debug(`payeeName will be truncated: ${segment.payeeName}`);
                warningCount += 1;
            }
            if (segment.crossReferenceNumber !== undefined) {
                if (crossReferenceNumbers.has(segment.crossReferenceNumber)) {
                    debug(`crossReferenceNumber should be unique: ${segment.crossReferenceNumber}`);
                    warningCount += 1;
                }
                crossReferenceNumbers.add(segment.crossReferenceNumber);
            }
        }
    }
    return warningCount;
}
export function validateCPA005(eftGenerator) {
    return (validateConfig(eftGenerator.getConfiguration()) +
        validateTransactions(eftGenerator.getTransactions()));
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
    const warningCount = validateCPA005(eftGenerator);
    if (warningCount > 0) {
        debug(`Proceeding with ${warningCount} warnings.`);
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
                    ''.padEnd(1, ' ') +
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
                    ''.padEnd(12, ' ') +
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
        ''.padEnd(1396, ' ');
    outputLines.push(trailer);
    return outputLines.join('\r\n');
}
