# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-03-18
### Added
- **Structured JSON Key Targeting**: The `redactObject` method now accepts an options configuration object. You can now use `keysToRedact` to explicitly redact only specific JSON object keys, and `ignoreKeys` to entirely skip the redaction traversal of logical branches.
- Default fallback strategy evaluation for explicit keys inside `keysToRedact` that possess no standard regex or NLP matches.
- Automated security scanning via **CodeQL** integrated through GitHub Actions workflow.
- Updated extended SEO and compliance indexing keywords into `package.json` (`hipaa`, `log-sanitization`, `data-privacy`, `compliance`, etc.).
- Refreshed documentation in `README.md` introducing the "Why Use `pii-redact`?" section and addressing Object Redaction capabilities.
- Live Website Demo updated to allow real-time browser testing of nested `redactObject` JSON structures.

## [1.0.1] - 2026-03-xx
### Added
- Initial stable release.
- Optional Natural Language Processing (NLP) integration using `compromise`.
- Support for comprehensive HTML parsing and Node redaction.
- Hash, Mask, and Replace strategies.
- 10+ core Regex matchers (Email, SSN, Credit Card, IP Address, etc).
