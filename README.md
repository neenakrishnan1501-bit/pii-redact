# PII Redact

![NPM Version](https://img.shields.io/npm/v/pii-redact?style=flat-square&color=blue)
![NPM License](https://img.shields.io/npm/l/pii-redact?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square&logo=typescript)

A lightweight, zero-dependency (core), and highly extensible library for identifying and redacting Personally Identifiable Information (PII) from text, HTML, and JSON objects. Perfect for complying with GDPR, CCPA, and general data privacy standards.

## Why Use `pii-redact`?

In an era of strict data confidentiality, preventing the leakage of **Personally Identifiable Information (PII)** is crucial to avoid severe compliance penalties and protect user privacy. `pii-redact` is an extremely fast and reliable utility designed for Node.js and the browser to address common security use-cases:

- 🛡️ **Comprehensive Data Protection & Compliance**: Ensures that your application correctly handles sensitive data, checking the boxes for **HIPAA**, **GDPR**, **CCPA**, and **SOC2** audits.
- 📜 **Log Sanitization & Observability**: Clean network payloads and server logs seamlessly so you never mistakenly store unencrypted credit cards, SSNs, or emails in logging tools like Datadog, Splunk, or Sentry.
- 🕵️ **Data Anonymization / De-identification**: Safely scrape, extract, and share real-world datasets for testing or analytics by masking, replacing, or cryptographically hashing private data.
- 🤖 **Secure LLM & AI Pipelines**: Prevent proprietary user data from bleeding out into your Large Language Model prompts. Redact individuals, physical locations, and corporate names securely using cutting-edge Natural Language Processing (Named Entity Recognition).

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

#### Advanced: Targeting Specific JSON Keys

For large payloads, you can specify an extra options object to explicitly tell the redactor which object keys it should target (or ignore entirely).

```typescript
const payload = {
  id: "user_123",            // We might want to keep this
  username: "jdoe99",         // Targeted for explicit redaction
  publicProfile: { 
    bio: "Software Engineer" // Ignored entirely
  },
  privateData: {
    email: "john@example.com"
  }
};

const safePayload = redactor.redactObject(payload, {
  // If provided, the redactor will ONLY process these specific keys.
  // It will forcefully redact their values using the Key name if no standard regex matches!
  keysToRedact: ['username', 'email'], 
  
  // Entire logical branches to skip processing (saves performance and avoids false hits)
  ignoreKeys: ['publicProfile']
});

console.log(safePayload.username); // "[USERNAME]"
console.log(safePayload.publicProfile.bio); // "Software Engineer" (unaffected)
console.log(safePayload.id); // "user_123" (unaffected)
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

### Advanced: NLP Named Entity Recognition

By default, the library uses extremely fast RegEx matchers. However, RegEx is purely structural and cannot reliably detect things like People's names or specific Geographic locations without context.

To solve this, `pii-redact` ships with an optional Natural Language Processing (NLP) integration via `compromise`. It intelligently reads the context of a sentence to detect **People, Organizations, and Locations**.

Because NLP adds a slight performance overhead and dependency weight, it is *not* included in `DefaultMatchers`. You must explicitly import it if you want context-aware redaction.

```typescript
import { Redactor, NlpMatcher, DefaultMatchers } from 'pii-redact';

// Combine the NLP Matcher with standard RegEx Matchers
const redactor = new Redactor({ 
  matchers: [
    new NlpMatcher(), // Detects People, Orgs, Locations
    ...DefaultMatchers // Detects Phones, Emails, SSNs, etc.
  ]
});

const text = "John Smith flew to Chicago to visit Microsoft on his (555) 123-4567 phone.";

console.log(redactor.redact(text));
// Output: "[PERSON] flew to [LOCATION] to visit [ORG] on his [PHONE] phone."
```

You can optionally configure what the `NlpMatcher` specifically looks for:

```typescript
new NlpMatcher({
  detectPeople: true,
  detectOrganizations: false,
  detectLocations: false
})
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

## Running the Demo

A simple static HTML demo is included in the `demo/` folder to test the library purely in your browser.

1. Navigate to the `demo` directory: `cd demo`
2. Open `index.html` in any web browser (e.g. `open index.html` on Mac).
3. Type any text and test the different redaction strategies!

## License

MIT License.
