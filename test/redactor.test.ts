import { Redactor } from '../src/redactor';
import { 
  EmailMatcher, 
  PhoneMatcher, 
  CreditCardMatcher, 
  SSNMatcher,
  MentionMatcher
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
      // Create a dummy matcher that matches everything
      const dummy1 = { name: 'dummy1', match: () => [{ value: 'abc', start: 0, end: 3 }] };
      const dummy2 = { name: 'dummy2', match: () => [{ value: 'bc', start: 1, end: 3 }] };
      const redactor = new Redactor({ matchers: [dummy2, dummy1] });
      
      const text = 'abc def';
      // Based on our implementation, `allMatches` is sorted by start index
      // dummy1 starts at 0, dummy2 starts at 1
      // validMatches will pick dummy1, then lastEnd = 3
      // dummy2 start = 1 < lastEnd(3), so it gets filtered out
      expect(redactor.redact(text)).toBe('[DUMMY1] def');
    });
  });
});
