import { describe, expect, it } from 'vitest';
import { displayName, initialsOf, missingIdentityIds } from './identity-cache';

describe('identity cache helpers', () => {
  it('lists only ids that still need fetching', () => {
    const cached = new Map([['a', {}]]);
    expect(missingIdentityIds(['a', 'b', 'b', '', undefined, null, 'c'], cached, new Set(['c']))).toEqual(['b']);
  });

  it('names and initials', () => {
    expect(displayName({ id: '1', fullName: 'Nguyễn Văn Minh', username: 'minh' })).toBe('Nguyễn Văn Minh');
    expect(displayName({ id: '1', username: 'minh' })).toBe('minh');
    expect(displayName(undefined)).toBe('Người dùng');
    expect(initialsOf('Nguyễn Văn Minh')).toBe('NM');
    expect(initialsOf('admin')).toBe('A');
    expect(initialsOf('  ')).toBe('?');
  });
});
