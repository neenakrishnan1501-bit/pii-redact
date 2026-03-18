import { Matcher, RedactionStrategy, RedactorConfig, RedactObjectOptions } from './types';
import { ReplaceStrategy } from './strategies';
import { parse, TextNode, HTMLElement } from 'node-html-parser';

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
        const replacement = this.defaultStrategy.apply(result.value, result.name || matcher.name);
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
   * 
   * @param obj The payload to redact.
   * @param options Configuration for targeting or ignoring specific object keys.
   * @param currentKey Internal parameter used for tracking the recursive JSON tree.
   */
  public redactObject<T>(obj: T, options?: RedactObjectOptions, currentKey?: string): T {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      if (options?.keysToRedact) {
        if (!currentKey || !options.keysToRedact.includes(currentKey)) {
          return obj as unknown as T;
        }
        
        const redacted = this.redact(obj);
        // If the user explicitly requested this key to be redacted, but no internal structural 
        // regex match was found inside the string, forcefully redact the entire string using the key name.
        if (redacted === obj && currentKey) {
          return this.defaultStrategy.apply(obj, currentKey.toUpperCase()) as unknown as T;
        }
        
        return redacted as unknown as T;
      }
      return this.redact(obj) as unknown as T;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.redactObject(item, options, currentKey)) as unknown as T;
    }

    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (options?.ignoreKeys?.includes(key)) {
          result[key] = value;
          continue;
        }
        result[key] = this.redactObject(value, options, key);
      }
      return result as T;
    }

    // Number, boolean, etc.
    return obj;
  }

  /**
   * Safely redacts PII from an HTML string without corrupting tags or attributes.
   */
  public redactHtml(htmlString: string): string {
    if (!htmlString || typeof htmlString !== 'string') return htmlString;

    const root = parse(htmlString);

    const traverse = (node: any) => {
      // If it's a TextNode, redact its content safely
      if (node.nodeType === 3) { // 3 is Node.TEXT_NODE in DOM, represented by TextNode here
        const textNode = node as TextNode;
        if (textNode.rawText && textNode.rawText.trim()) {
          // Replace rawText with the redacted version
          textNode.rawText = this.redact(textNode.rawText);
        }
      } else if (node.nodeType === 1) { // 1 is Node.ELEMENT_NODE
        const element = node as HTMLElement;
        // Do not traverse into <script> or <style> tags to avoid breaking logic/css
        if (element.tagName && ['SCRIPT', 'STYLE'].includes(element.tagName.toUpperCase())) {
          return;
        }
        for (const child of element.childNodes) {
          traverse(child);
        }
      }
    };

    traverse(root);

    return root.toString();
  }
}
