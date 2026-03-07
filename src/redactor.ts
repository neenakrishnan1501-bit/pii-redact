import { Matcher, RedactionStrategy, RedactorConfig } from './types';
import { ReplaceStrategy } from './strategies';

export class Redactor {
  private matchers: Matcher[];
  private defaultStrategy: RedactionStrategy;

  constructor(config?: RedactorConfig) {
    this.matchers = config?.matchers || [];
    this.defaultStrategy = config?.defaultStrategy || new ReplaceStrategy();
  }

  /**
   * Redacts PII from an unstructured text string.
   */
  public redact(text: string): string {
    if (!text || typeof text !== 'string') return text;

    // Collect all matches from all matchers
    type MatchWithStrategy = { start: number; end: number; replacement: string };
    const allMatches: MatchWithStrategy[] = [];

    for (const matcher of this.matchers) {
      const results = matcher.match(text);
      for (const result of results) {
        const replacement = this.defaultStrategy.apply(result.value, matcher.name);
        allMatches.push({ start: result.start, end: result.end, replacement });
      }
    }

    // If no matches, return original text
    if (allMatches.length === 0) return text;

    // Sort matches by starting index to avoid overlapping complications,
    // though overlapping handling is basic here (first come first serve by position)
    allMatches.sort((a, b) => a.start - b.start);

    // Apply replacements from back-to-front to avoid messing up indices
    let resultText = text;
    // Filter out overlaps
    const validMatches: MatchWithStrategy[] = [];
    let lastEnd = -1;
    for (const match of allMatches) {
      if (match.start >= lastEnd) {
        validMatches.push(match);
        lastEnd = match.end;
      }
    }

    for (let i = validMatches.length - 1; i >= 0; i--) {
      const { start, end, replacement } = validMatches[i];
      resultText = resultText.substring(0, start) + replacement + resultText.substring(end);
    }

    return resultText;
  }

  /**
   * Recursively traverses an object or array and redacts any string values found.
   */
  public redactObject<T>(obj: T): T {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.redact(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactObject(item)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.redactObject(value);
      }
      return result as T;
    }

    // Number, boolean, etc.
    return obj;
  }
}
