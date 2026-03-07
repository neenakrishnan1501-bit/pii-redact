export * from "./types";
export * from "./redactor";
export * from "./strategies";

import {
  EmailMatcher,
  PhoneMatcher,
  CreditCardMatcher,
  SSNMatcher,
  IPv4Matcher,
  ZipcodeMatcher,
  AddressMatcher,
  LocationCoordinatesMatcher,
  PassportMatcher,
  DriverLicenseMatcher,
  MentionMatcher,
  DateOfBirthMatcher,
} from "./matchers";

export * from "./matchers";

export const DefaultMatchers = [
  EmailMatcher,
  PhoneMatcher,
  CreditCardMatcher,
  SSNMatcher,
  IPv4Matcher,
  ZipcodeMatcher,
  LocationCoordinatesMatcher,
  PassportMatcher,
  DriverLicenseMatcher,
  MentionMatcher,
  DateOfBirthMatcher,
  // Address matcher is typically noisy without NLP, so it's included but should be used with caution
  AddressMatcher,
];
