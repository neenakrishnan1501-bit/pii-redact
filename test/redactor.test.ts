import { Redactor } from '../src/redactor';
import {
  EmailMatcher,
  PhoneMatcher,
  CreditCardMatcher,
  SSNMatcher,
  MentionMatcher,
  NlpMatcher
} from '../src/matchers';
import { MaskStrategy, HashStrategy, ReplaceStrategy } from '../src/strategies';

describe('Redactor', () => {
  it('should not redact if no matchers are provided', () => {
    const redactor = new Redactor();
    const result = redactor.redact('My email is test@example.com');
    expect(result).toBe('My email is test@example.com');
  });

  describe('Object Redaction', () => {
    it('should recursively redact strings in an object', () => {
      const redactor = new Redactor({ matchers: [EmailMatcher] });
      const payload = {
        user: {
          name: 'John',
          contact: 'Reach me at john.doe@example.com',
          metadata: [
            { email: 'admin@corp.com' },
            { id: 123 }
          ]
        }
      };

      const redacted = redactor.redactObject(payload);

      expect(redacted.user.contact).toBe('Reach me at [EMAIL]');
      expect(redacted.user.metadata[0].email).toBe('[EMAIL]');
      expect(redacted.user.name).toBe('John'); // unaffected
      expect(redacted.user.metadata[1].id).toBe(123); // unaffected
    });
  });

  describe('HTML Redaction', () => {
    it('should redact visible text but not corrupt HTML tags or attributes', () => {
      const redactor = new Redactor({ matchers: [EmailMatcher, PhoneMatcher] });
      const html = `<div id="user-contact" data-phone="(555) 123-4567">
        <p>Contact me at admin@example.com!</p>
        <a href="mailto:admin@example.com">Send Email to admin@example.com</a>
        <span>Call: (555) 123-4567</span>
      </div>`;

      const redactedHtml = redactor.redactHtml(html);

      // Visible text should be redacted
      expect(redactedHtml).toContain('<p>Contact me at [EMAIL]!</p>');
      expect(redactedHtml).toContain('Send Email to [EMAIL]');
      expect(redactedHtml).toContain('Call: [PHONE]');

      // Attributes should remain strictly UNCHANGED
      expect(redactedHtml).toContain('href="mailto:admin@example.com"');
      expect(redactedHtml).toContain('data-phone="(555) 123-4567"');
    });

    it('should ignore script and style tags', () => {
      const redactor = new Redactor({ matchers: [EmailMatcher] });
      const html = `
        <script>const email = "admin@example.com";</script>
        <style>.email::after { content: "admin@example.com"; }</style>
        <p>Email: admin@example.com</p>
      `;

      const redactedHtml = redactor.redactHtml(html);

      // Script and style tags must remain completely untouched
      expect(redactedHtml).toContain('const email = "admin@example.com";');
      expect(redactedHtml).toContain('content: "admin@example.com";');
      // Paragraph text should be redacted
      expect(redactedHtml).toContain('<p>Email: [EMAIL]</p>');
    });
  });

  describe('Strategies', () => {
    it('should use ReplaceStrategy by default', () => {
      const redactor = new Redactor({ matchers: [EmailMatcher] });
      expect(redactor.redact('test@test.com')).toBe('[EMAIL]');
    });

    it('should use custom ReplaceStrategy string', () => {
      const redactor = new Redactor({
        matchers: [EmailMatcher],
        defaultStrategy: new ReplaceStrategy('***HIDDEN***')
      });
      expect(redactor.redact('test@test.com')).toBe('***HIDDEN***');
    });

    it('should use MaskStrategy', () => {
      const redactor = new Redactor({
        matchers: [EmailMatcher],
        defaultStrategy: new MaskStrategy({ unmaskedStart: 2, unmaskedEnd: 4, maskChar: '*' })
      });
      // "test@test.com" length 13
      // start: 2 -> "te"
      // end: 4 -> ".com"
      // middle: 13-6 = 7 "*"
      expect(redactor.redact('test@test.com')).toBe('te*******.com');
    });

    it('should use HashStrategy', () => {
      const hashStrategy = new HashStrategy('sha256');
      const redactor = new Redactor({
        matchers: [EmailMatcher],
        defaultStrategy: hashStrategy
      });
      const original = 'test@test.com';
      const result = redactor.redact(original);
      const expectedHash = require('crypto').createHash('sha256').update(original).digest('hex');
      expect(result).toBe(expectedHash);
    });
  });

  describe('Matchers', () => {
    it('should correctly match and redact phone numbers', () => {
      const redactor = new Redactor({ matchers: [PhoneMatcher] });
      expect(redactor.redact('Call me at (555) 123-4567')).toBe('Call me at [PHONE]');
      expect(redactor.redact('Or 555-123-4567.')).toBe('Or [PHONE].');
    });

    it('should correctly match and redact SSNs', () => {
      const redactor = new Redactor({ matchers: [SSNMatcher] });
      expect(redactor.redact('My SSN is 123-45-6789!')).toBe('My SSN is [SSN]!');
    });

    it('should correctly match and redact Credit Cards', () => {
      const redactor = new Redactor({ matchers: [CreditCardMatcher] });
      expect(redactor.redact('Card: 4111222233334444')).toBe('Card: [CREDIT_CARD]');
    });

    it('should correctly match and redact Mentions', () => {
      const redactor = new Redactor({ matchers: [MentionMatcher] });
      expect(redactor.redact('Hello @john_doe, please check this out v@lid_username.')).toBe('Hello [MENTION], please check this out v@lid_username.');
      expect(redactor.redact('Say hi to @admin-user')).toBe('Say hi to [MENTION]');
    });
  });

  describe('Edge cases', () => {
    it('should handle multiple matches of different types', () => {
      const redactor = new Redactor({ matchers: [EmailMatcher, PhoneMatcher] });
      const text = 'Email test@test.com or call 555-123-4567.';
      expect(redactor.redact(text)).toBe('Email [EMAIL] or call [PHONE].');
    });

    it('should handle overlapping matches gracefully (first match wins)', () => {
      // Create a dummy matcher that intentionally overlaps with email
      const DummyOverlapMatcher = {
        name: 'dummy',
        match: (text: string) => [{ value: 'john.doe@exa', start: 17, end: 29 }]
      };

      const redactor = new Redactor({ matchers: [EmailMatcher, DummyOverlapMatcher] });
      const result = redactor.redact('Contact me at john.doe@example.com for info.');
      // Because EmailMatcher comes first, it should win the overlap conflict
      expect(result).toBe('Contact me at [EMAIL] for info.');
    });
  });

  describe('NlpMatcher (Named Entity Recognition)', () => {
    it('should correctly extract Names, Organizations, and Locations based on NLP context', () => {
      // Default NlpMatcher detects People, Organizations, and Locations
      const redactor = new Redactor({ matchers: [new NlpMatcher()] });
      const text = 'John Smith recently flew to New York to visit Microsoft on an enterprise contract.';

      const redacted = redactor.redact(text);
      expect(redacted).toBe('[PERSON] recently flew to [LOCATION] to visit [ORG] on an enterprise contract.');
    });

    it('should safely combine NLP with RegEx Matchers', () => {
      const redactor = new Redactor({ matchers: [new NlpMatcher(), EmailMatcher, PhoneMatcher] });

      const text = 'Call Michael Scott at 555-123-4567 or email him at mscott@dunder-mifflin.com in Chicago today.';
      const result = redactor.redact(text);

      expect(result).toBe('Call [PERSON] at [PHONE] or email him at [EMAIL] in [LOCATION] today.');
    });

    it('should allow disabling specific NLP entities via config', () => {
      const redactor = new Redactor({
        matchers: [
          new NlpMatcher({ detectLocations: false, detectOrganizations: false })
        ]
      });

      const text = 'Bill Gates founded Microsoft in Albuquerque.';
      const result = redactor.redact(text);

      // Only Bill Gates should be redacted since others are disabled
      expect(result).toBe('[PERSON] founded Microsoft in Albuquerque.');
    });
  });
});
