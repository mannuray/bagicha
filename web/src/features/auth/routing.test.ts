import { describe, expect, it } from 'vitest';
import { testUser } from '../../test/render';
import { homeFor, nextOnboardingStep } from './schemas';

const fresh = testUser({ district: null, region_cluster: null, garden_types: [] });
const lacksRegion = testUser({ region_cluster: null });
const complete = testUser();

describe('homeFor: where a user lands (splash, sign-in, guards)', () => {
  it('signed out → login; complete → home', () => {
    expect(homeFor(null)).toBe('/login');
    expect(homeFor(complete)).toBe('/');
  });

  it('a new user starts at language; a returning user who only lacks a region goes straight to it', () => {
    expect(homeFor(fresh)).toBe('/onboarding/language');
    expect(homeFor(lacksRegion)).toBe('/onboarding/region');
  });
});

describe('nextOnboardingStep: language → region → garden → home', () => {
  it('after language comes region', () => {
    expect(nextOnboardingStep(fresh, 'language')).toBe('/onboarding/region');
  });

  it('after region: garden, or home when the profile is now complete', () => {
    expect(nextOnboardingStep(testUser({ garden_types: [] }), 'region')).toBe('/onboarding/garden');
    expect(nextOnboardingStep(complete, 'region')).toBe('/');
  });

  it('after garden: home when complete, else wherever onboarding resumes', () => {
    expect(nextOnboardingStep(complete, 'garden')).toBe('/');
    expect(nextOnboardingStep(testUser({ district: null }), 'garden')).toBe('/onboarding/language');
  });
});
