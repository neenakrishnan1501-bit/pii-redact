import crypto from 'crypto';
import { RedactionStrategy } from '../types';

/**
 * Replaces the matched PII with a static string.
 */
export class ReplaceStrategy implements RedactionStrategy {
  name = 'replace';
  private replacement: string;

  /**
   * @param replacement The string to replace the PII with. If not provided, it defaults to using the matcher name (e.g., [EMAIL]).
   */
  constructor(replacement?: string) {
    this.replacement = replacement || '';
  }

  apply(_matchedValue: string, matcherName?: string): string {
    if (this.replacement) {
      return this.replacement;
    }
    return `[${(matcherName || 'REDACTED').toUpperCase()}]`;
  }
}

/**
 * Masks the matched PII by replacing most characters with a masking character,
 * while leaving a few visible to provide context.
 */
export class MaskStrategy implements RedactionStrategy {
  name = 'mask';
  private maskChar: string;
  private unmaskedStart: number;
  private unmaskedEnd: number;

  /**
   * @param options.maskChar The character to use for masking (default: '*')
   * @param options.unmaskedStart Number of characters to leave unmasked at the start (default: 1)
   * @param options.unmaskedEnd Number of characters to leave unmasked at the end (default: 1)
   */
  constructor(options?: { maskChar?: string; unmaskedStart?: number; unmaskedEnd?: number }) {
    this.maskChar = options?.maskChar || '*';
    this.unmaskedStart = options?.unmaskedStart ?? 1;
    this.unmaskedEnd = options?.unmaskedEnd ?? 1;
  }

  apply(matchedValue: string): string {
    const length = matchedValue.length;
    if (length <= this.unmaskedStart + this.unmaskedEnd) {
      return this.maskChar.repeat(length);
    }

    const start = matchedValue.slice(0, this.unmaskedStart);
    const end = matchedValue.slice(length - this.unmaskedEnd);
    const middle = this.maskChar.repeat(length - this.unmaskedStart - this.unmaskedEnd);

    return `${start}${middle}${end}`;
  }
}

/**
 * Replaces the matched PII with a cryptographic hash.
 * Useful for preserving uniqueness without revealing the actual value.
 */
export class HashStrategy implements RedactionStrategy {
  name = 'hash';
  private algorithm: string;

  /**
   * @param algorithm The cryptographic hash algorithm to use (default: 'sha256')
   */
  constructor(algorithm: string = 'sha256') {
    this.algorithm = algorithm;
  }

  apply(matchedValue: string): string {
    return crypto.createHash(this.algorithm).update(matchedValue).digest('hex');
  }
}
