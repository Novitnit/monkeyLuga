import { describe, it, expect } from 'vitest';
import { PlayerState } from '@isgame/shared';
import { carryPlayersOnHead } from '../Physics';

function makePlayer(x: number, y: number, w = 45, h = 50): PlayerState {
  const p = new PlayerState();
  p.x = x; p.y = y; p.w = w; p.h = h;
  p.prevX = x; p.prevY = y;
  return p;
}

describe('carryPlayersOnHead', () => {
  it('moves standing player with base movement', () => {
    const base = makePlayer(0, 0);
    // Ensure standing alignment after base movement: baseTop = -5 - 25 = -30
    // So otherBottom must be -30 -> other.y = -55
    const other = makePlayer(0, -55);

    // simulate base movement this tick
    base.prevX = 0; base.prevY = 0;
    base.x = 10; base.y = -5;

    carryPlayersOnHead(base, [other]);

    expect(other.x).toBe(10);
    expect(other.y).toBe(-60);
    expect(other.isGrounded).toBe(true);
  });

  it('does not move non-standing players', () => {
    const base = makePlayer(0, 0);
    const other = makePlayer(100, -50); // horizontally far

    base.prevX = 0; base.prevY = 0;
    base.x = 10; base.y = -5;

    carryPlayersOnHead(base, [other]);

    expect(other.x).toBe(100);
    expect(other.y).toBe(-50);
  });
});
