import type { EFTGenerator } from '../index.js';
import type { ValidationWarning } from '../types.js';
export declare const NEWLINE = "\r\n";
export declare function validateCPA005(eftGenerator: EFTGenerator): ValidationWarning[];
export declare function formatToCPA005(eftGenerator: EFTGenerator): string;
