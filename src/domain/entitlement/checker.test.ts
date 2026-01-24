import { describe, it, expect } from 'vitest';
import {
  canAccessAssetPage,
  canAccessMemo,
  canAccessNLSearch,
  canCreateMarks,
  canUseTags,
  isActiveSubscription,
  getAvailableFeatures,
  type UserEntitlement,
} from './checker';

describe('canAccessAssetPage', () => {
  it('returns false for null entitlement', () => {
    expect(canAccessAssetPage(null)).toBe(false);
  });

  it('returns false for free plan', () => {
    const entitlement: UserEntitlement = { plan: 'free', status: 'active' };
    expect(canAccessAssetPage(entitlement)).toBe(false);
  });

  it('returns true for pro plan with active status', () => {
    const entitlement: UserEntitlement = { plan: 'pro', status: 'active' };
    expect(canAccessAssetPage(entitlement)).toBe(true);
  });

  it('returns true for lifetime plan with active status', () => {
    const entitlement: UserEntitlement = { plan: 'lifetime', status: 'active' };
    expect(canAccessAssetPage(entitlement)).toBe(true);
  });

  it('returns false for pro plan with canceled status', () => {
    const entitlement: UserEntitlement = { plan: 'pro', status: 'canceled' };
    expect(canAccessAssetPage(entitlement)).toBe(false);
  });

  it('returns true for pro plan with past_due status (grace period)', () => {
    const entitlement: UserEntitlement = { plan: 'pro', status: 'past_due' };
    expect(canAccessAssetPage(entitlement)).toBe(true);
  });

  it('returns true for pro plan with trialing status', () => {
    const entitlement: UserEntitlement = { plan: 'pro', status: 'trialing' };
    expect(canAccessAssetPage(entitlement)).toBe(true);
  });
});

describe('canAccessMemo', () => {
  it('returns false for null entitlement', () => {
    expect(canAccessMemo(null)).toBe(false);
  });

  it('returns false for free plan', () => {
    const entitlement: UserEntitlement = { plan: 'free', status: 'active' };
    expect(canAccessMemo(entitlement)).toBe(false);
  });

  it('returns true for pro plan', () => {
    const entitlement: UserEntitlement = { plan: 'pro', status: 'active' };
    expect(canAccessMemo(entitlement)).toBe(true);
  });

  it('returns true for lifetime plan', () => {
    const entitlement: UserEntitlement = { plan: 'lifetime', status: 'active' };
    expect(canAccessMemo(entitlement)).toBe(true);
  });
});

describe('canAccessNLSearch', () => {
  it('returns false for null entitlement', () => {
    expect(canAccessNLSearch(null)).toBe(false);
  });

  it('returns false for free plan', () => {
    const entitlement: UserEntitlement = { plan: 'free', status: 'active' };
    expect(canAccessNLSearch(entitlement)).toBe(false);
  });

  it('returns true for pro plan', () => {
    const entitlement: UserEntitlement = { plan: 'pro', status: 'active' };
    expect(canAccessNLSearch(entitlement)).toBe(true);
  });

  it('returns true for lifetime plan', () => {
    const entitlement: UserEntitlement = { plan: 'lifetime', status: 'active' };
    expect(canAccessNLSearch(entitlement)).toBe(true);
  });
});

describe('canCreateMarks', () => {
  it('returns true for null entitlement (free feature)', () => {
    expect(canCreateMarks(null)).toBe(true);
  });

  it('returns true for free plan', () => {
    const entitlement: UserEntitlement = { plan: 'free', status: 'active' };
    expect(canCreateMarks(entitlement)).toBe(true);
  });

  it('returns true for pro plan', () => {
    const entitlement: UserEntitlement = { plan: 'pro', status: 'active' };
    expect(canCreateMarks(entitlement)).toBe(true);
  });
});

describe('canUseTags', () => {
  it('returns true for any entitlement (free feature)', () => {
    expect(canUseTags(null)).toBe(true);
    expect(canUseTags({ plan: 'free', status: 'active' })).toBe(true);
    expect(canUseTags({ plan: 'pro', status: 'active' })).toBe(true);
  });
});

describe('isActiveSubscription', () => {
  it('returns true for active status', () => {
    expect(isActiveSubscription('active')).toBe(true);
  });

  it('returns true for trialing status', () => {
    expect(isActiveSubscription('trialing')).toBe(true);
  });

  it('returns true for past_due status (grace period)', () => {
    expect(isActiveSubscription('past_due')).toBe(true);
  });

  it('returns false for canceled status', () => {
    expect(isActiveSubscription('canceled')).toBe(false);
  });

  it('returns false for incomplete status', () => {
    expect(isActiveSubscription('incomplete')).toBe(false);
  });

  it('returns false for unpaid status', () => {
    expect(isActiveSubscription('unpaid')).toBe(false);
  });
});

describe('getAvailableFeatures', () => {
  it('returns only free features for null entitlement', () => {
    const features = getAvailableFeatures(null);
    expect(features).toEqual({
      assetPage: false,
      memos: false,
      nlSearch: false,
      marks: true,
      tags: true,
    });
  });

  it('returns only free features for free plan', () => {
    const features = getAvailableFeatures({ plan: 'free', status: 'active' });
    expect(features).toEqual({
      assetPage: false,
      memos: false,
      nlSearch: false,
      marks: true,
      tags: true,
    });
  });

  it('returns all features for pro plan', () => {
    const features = getAvailableFeatures({ plan: 'pro', status: 'active' });
    expect(features).toEqual({
      assetPage: true,
      memos: true,
      nlSearch: true,
      marks: true,
      tags: true,
    });
  });

  it('returns all features for lifetime plan', () => {
    const features = getAvailableFeatures({ plan: 'lifetime', status: 'active' });
    expect(features).toEqual({
      assetPage: true,
      memos: true,
      nlSearch: true,
      marks: true,
      tags: true,
    });
  });

  it('returns only free features for canceled pro plan', () => {
    const features = getAvailableFeatures({ plan: 'pro', status: 'canceled' });
    expect(features).toEqual({
      assetPage: false,
      memos: false,
      nlSearch: false,
      marks: true,
      tags: true,
    });
  });
});
