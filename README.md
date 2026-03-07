# PII Redact

A lightweight and extensible TypeScript library for identifying and redacting Personally Identifiable Information (PII) from both unstructured text and structured objects.

## Installation

```bash
npm install pii-redact
```

## Features

- **Built-in Matchers**: Email, Phone Number, Credit Card, SSN, IP Address, Physical Address, Zipcode, Location Coordinates, Passport, and Driver's License.
- **Built-in Strategies**: Replace, Mask, and Hash.
- **Structured Object Redaction**: Recursively redacts PII throughout deeply nested objects and arrays.
- **Extensible**: Easily provide your own custom regex matchers or complex redaction strategies.
- **TypeScript First**: Strict typings for a robust developer experience.

## Basic Usage

### Understanding DefaultMatchers

`DefaultMatchers` is a convenience array exported by the library that contains all the standard, built-in matchers. If you only want to redact specific types of PII (e.g., only emails and phone numbers), you can pass an array of just the matchers you want:

```typescript
import { Redactor, EmailMatcher, PhoneMatcher } from 'pii-redact';

// This redactor will ONLY look for emails and phone numbers
const redactor = new Redactor({ matchers: [EmailMatcher, PhoneMatcher] });
```

### Unstructured Text Redaction

```typescript
import { Redactor, DefaultMatchers } from 'pii-redact';

// Create a Redactor using the default built-in matchers
const redactor = new Redactor({ matchers: DefaultMatchers });

const originalText = "Hello, my email is admin@example.com and phone is (555) 123-4567.";
const safeText = redactor.redact(originalText);

console.log(safeText);
// Output: "Hello, my email is [EMAIL] and phone is [PHONE]."
```

### Structured Object Redaction

```typescript
import { Redactor, DefaultMatchers } from 'pii-redact';

const redactor = new Redactor({ matchers: DefaultMatchers });

const payload = {
  user: {
    id: 12345,
    name: "John Doe",
    contactDetails: "Contact me at (555) 123-4567",
    emails: ["primary@domain.com", "secondary@domain.com"]
  }
};

const safePayload = redactor.redactObject(payload);

console.log(safePayload.user.contactDetails); // "Contact me at [PHONE]"
console.log(safePayload.user.emails[0]);      // "[EMAIL]"
```

### HTML Redaction

If you have raw HTML and want to redact the visible text *without* breaking tags or attributes, use `.redactHtml()`:

```typescript
import { Redactor, DefaultMatchers } from 'pii-redact';

const redactor = new Redactor({ matchers: DefaultMatchers });

const html = `
  <div id="contact-info" data-email="admin@example.com">
    <p>Please contact me at admin@example.com or call (555) 123-4567.</p>
    <a href="mailto:admin@example.com">Email Admin</a>
  </div>
`;

const safeHtml = redactor.redactHtml(html);

console.log(safeHtml);
/* Output:
  <div id="contact-info" data-email="admin@example.com">
    <p>Please contact me at [EMAIL] or call [PHONE].</p>
    <a href="mailto:admin@example.com">Email Admin</a>
  </div>
*/
```

## Changing the Redaction Strategy

By default, the `Redactor` uses the `ReplaceStrategy` (which replaces matches with e.g. `[EMAIL]`). You can configure this globally:

### Masking

Replaces the characters with asterisks, optionally leaving parts of the string visible for context.

```typescript
import { Redactor, EmailMatcher, MaskStrategy } from 'pii-redact';

const redactor = new Redactor({
  matchers: [EmailMatcher],
  // Leaves 2 chars at the start, and 4 at the end visible:
  defaultStrategy: new MaskStrategy({ maskChar: '*', unmaskedStart: 2, unmaskedEnd: 4 })
});

console.log(redactor.redact('john.doe@example.com'));
// Output: "jo**************.com"
```

### Hashing

Replaces the characters with a cryptographic hash (useful for maintaining uniqueness in analytics databases without retaining the actual PII).

```typescript
import { Redactor, SSNMatcher, HashStrategy } from 'pii-redact';

const redactor = new Redactor({
  matchers: [SSNMatcher],
  defaultStrategy: new HashStrategy('sha256')
});

console.log(redactor.redact('My SSN is 123-45-6789'));
// Output: "My SSN is a3b8d... [sha256 hash]"
```

## Custom Matchers & Strategies

You can easily extend the library by implementing the `Matcher` or `RedactionStrategy` interfaces.

```typescript
import { Matcher, MatchResult, Redactor } from 'pii-redact';

class CustomSecretMatcher implements Matcher {
  name = 'secret_code';
  
  match(text: string): MatchResult[] {
    const results: MatchResult[] = [];
    const regex = /SECRET-[A-Z0-9]{5}/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({ value: match[0], start: match.index, end: match.index + match[0].length });
    }
    return results;
  }
}

const redactor = new Redactor({ matchers: [new CustomSecretMatcher()] });
```

## License

MIT License.
