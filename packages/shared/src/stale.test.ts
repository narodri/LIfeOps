import { describe, expect, it } from 'vitest';
import { staleLevel } from './index';

describe('staleLevel',()=>{
  const now = new Date('2026-05-26T00:00:00Z');
  it('warning at 7 days',()=>expect(staleLevel('2026-05-19T00:00:00Z',now)).toBe('warning'));
  it('strong at 14 days',()=>expect(staleLevel('2026-05-12T00:00:00Z',now)).toBe('strong'));
});
