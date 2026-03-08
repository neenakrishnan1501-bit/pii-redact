import { Matcher, MatchResult } from '../types';
import nlp from 'compromise';

export interface NlpMatcherConfig {
  detectPeople?: boolean;
  detectOrganizations?: boolean;
  detectLocations?: boolean;
}

/**
 * A matcher that uses Natural Language Processing (via compromise) 
 * to detect named entities through sentence context rather than regex.
 */
export class NlpMatcher implements Matcher {
  name: string;
  private config: NlpMatcherConfig;

  constructor(config?: NlpMatcherConfig) {
    this.name = 'nlp';
    this.config = {
      detectPeople: true,
      detectOrganizations: true,
      detectLocations: true,
      ...config
    };
  }

  match(text: string): MatchResult[] {
    const results: MatchResult[] = [];
    const doc = nlp(text);

    if (this.config.detectPeople) {
      const people = doc.people().out('offset') as any[];
      people.forEach(p => {
        results.push({
          value: p.text, // e.g. "John Smith"
          name: 'person', // Override name for specific replacement (e.g. [PERSON])
          start: p.offset.start,
          end: p.offset.start + p.offset.length
        });
      });
    }

    if (this.config.detectOrganizations) {
      const orgs = doc.organizations().out('offset') as any[];
      orgs.forEach(o => {
        results.push({
          value: o.text, // e.g. "Google"
          name: 'org', // Override name for specific replacement (e.g. [ORG])
          start: o.offset.start,
          end: o.offset.start + o.offset.length
        });
      });
    }

    if (this.config.detectLocations) {
      const places = doc.places().out('offset') as any[];
      places.forEach(p => {
        results.push({
          value: p.text, // e.g. "New York"
          name: 'location', // Override name for specific replacement (e.g. [LOCATION])
          start: p.offset.start,
          end: p.offset.start + p.offset.length
        });
      });
    }

    return results;
  }
}
