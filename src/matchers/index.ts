import { Matcher, MatchResult } from "../types";

/**
 * A base class for Regex-based matchers to avoid boilerplate.
 */
export class RegexMatcher implements Matcher {
  name: string;
  private regex: RegExp;

  constructor(name: string, regex: RegExp) {
    this.name = name;
    // Ensure the regex has the 'g' flag for multiple matches
    if (!regex.flags.includes("g")) {
      this.regex = new RegExp(regex.source, regex.flags + "g");
    } else {
      this.regex = regex;
    }
  }

  match(text: string): MatchResult[] {
    const results: MatchResult[] = [];
    let match;
    // reset lastIndex just in case
    this.regex.lastIndex = 0;
    while ((match = this.regex.exec(text)) !== null) {
      results.push({
        value: match[0],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
    return results;
  }
}

// ============== BUILT-IN MATCHERS ==============

export const EmailMatcher = new RegexMatcher(
  "email",
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
);

export const PhoneMatcher = new RegexMatcher(
  "phone",
  /(?<!\d)(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}(?!\d)/g,
);

export const CreditCardMatcher = new RegexMatcher(
  "credit_card",
  /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
);

export const SSNMatcher = new RegexMatcher(
  "ssn",
  /\b(?!(000|666|9))\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
);

export const IPv4Matcher = new RegexMatcher(
  "ipv4",
  /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
);

export const ZipcodeMatcher = new RegexMatcher(
  "zipcode",
  /\b\d{5}(?:[-\s]\d{4})?\b/g,
);

// US UK Address - very basic, real address parsing is notoriously hard with regex,
// usually NLP or dedicated libs are better, but we provide a structural effort here for standard strings.
export const AddressMatcher = new RegexMatcher(
  "address",
  /\b\d{1,5}\s(?:[a-zA-Z0-9\s.,-]{1,50})\s(?:St|Street|Rd|Road|Ave|Avenue|Blvd|Boulevard|Ln|Lane|Dr|Drive|Ct|Court)\b/gi,
);

export const LocationCoordinatesMatcher = new RegexMatcher(
  "location",
  /[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)/g,
);

// Passport Regex (US example, often alphanumeric 9 chars, varies wildly by country)
export const PassportMatcher = new RegexMatcher(
  "passport",
  /\b(?:[A-Z]{1,2}\d{6,8}|\d{9})\b/g,
);
// Mention Matcher (e.g. @username)
export const MentionMatcher = new RegexMatcher(
  "mention",
  /(?<=^|\s)@[a-zA-Z0-9_\-]+/g,
);

export const DriverLicenseMatcher = new RegexMatcher(
  "driver_license",
  // Varies heavily by state. Covers alphanumeric formats of 7-14 chars commonly seen in the US.
  /\b[A-Za-z0-9]{7,14}\b/g,
);

export const DateOfBirthMatcher = new RegexMatcher(
  "date_of_birth",
  // Matches common DOB formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, MM-DD-YYYY, etc.
  /\b(?:(?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01])[-/](?:19|20)\d{2}|(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12][0-9]|3[01]))\b/g,
);
