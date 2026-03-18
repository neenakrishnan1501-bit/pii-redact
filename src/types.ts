export interface Matcher {
  /** Uniquely identifies the type of PII (e.g., 'email', 'phone') */
  name: string;
  
  /** 
   * Finds all instances of the PII in the given text. 
   * Returns an array of objects containing the matched string and its start/end indices.
   */
  match(text: string): MatchResult[];
}

export interface MatchResult {
  value: string;
  start: number;
  end: number;
  /** Optional override for the strategy replacement name */
  name?: string;
}

export interface RedactionStrategy {
  /** Uniquely identifies the strategy (e.g., 'replace', 'mask', 'hash') */
  name: string;

  /**
   * Applies the strategy to a matched PII string.
   * @param matchedValue The actual PII string found
   * @param matcherName The type of PII (e.g., 'email')
   */
  apply(matchedValue: string, matcherName?: string): string;
}

export interface RedactorConfig {
  /** The built-in or custom matchers to enable */
  matchers?: Matcher[];
  
  /** The default fallback strategy if a specific matcher doesn't override it */
  defaultStrategy?: RedactionStrategy;
}

export interface RedactObjectOptions {
  /** Array of specific property keys to redact. If provided, ONLY these keys will be redacted. */
  keysToRedact?: string[];
  
  /** Array of property keys to completely ignore and skip redacting. */
  ignoreKeys?: string[];
}
