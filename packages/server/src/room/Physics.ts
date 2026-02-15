import { PlayerState } from "@isgame/shared";
import { InputState, map1 } from "@isgame/shared";
import { aabb, RectLike } from "../utils/collision";

export const GRAVITY = 1200;
export const JUMP_FORCE = 500;

export function applyHorizontalInput(player: PlayerState, input?: InputState) {
  if (input?.left) {
    player.vx = -player.speed;
  } else if (input?.right) {
    player.vx = player.speed;
  } else {
    player.vx = 0;
  }
}

export function applyJump(
  player: PlayerState,
  input: InputState | undefined,
  wasGrounded: boolean
) {
  if (input?.jump && wasGrounded) {
    let jumpForce = JUMP_FORCE;
    const zones = map1.highJumpZones || [];
    for (const z of zones) {
      // ใช้ multiplier ถ้าตั้งค่าไว้ ไม่งั้นดีฟอลต์ 1.5
      if (aabb(player, z as unknown as RectLike)) {
        const mult = z.multiplier ?? 1.5;
        jumpForce = Math.max(jumpForce, JUMP_FORCE * mult);
        break;
      }
    }
    player.vy = -jumpForce;
    player.isGrounded = false;
  }
}

export function applyGravity(player: PlayerState, dt: number) {
  player.vy += GRAVITY * dt;
}

export function integrate(player: PlayerState, dt: number) {
  player.x += player.vx * dt;
  player.y += player.vy * dt;
}

export function resolvePlatformCollisions(
  player: PlayerState,
  platforms: RectLike[]
) {
  for (const p of platforms) {
    const bottomPrev = player.prevY + player.h / 2;
    const bottomNow = player.y + player.h / 2;
    const topPrev = player.prevY - player.h / 2;
    const topNow = player.y - player.h / 2;

    const leftPrev = player.prevX - player.w / 2;
    const leftNow = player.x - player.w / 2;
    const rightPrev = player.prevX + player.w / 2;
    const rightNow = player.x + player.w / 2;

    // Land on top
    if (bottomPrev <= p.y && bottomNow >= p.y && aabb(player, p)) {
      player.y = p.y - player.h / 2;
      player.vy = 0;
      player.isGrounded = true;
    }

    // Hit from below
    if (topPrev >= p.y + p.h && topNow <= p.y + p.h && aabb(player, p)) {
      player.y = p.y + p.h + player.h / 2;
      player.vy = 0;
    }

    // Hit left side of platform
    if (rightPrev <= p.x && rightNow >= p.x && aabb(player, p)) {
      player.x = p.x - player.w / 2;
      player.vx = 0;
    }

    // Hit right side of platform
    if (leftPrev >= p.x + p.w && leftNow <= p.x + p.w && aabb(player, p)) {
      player.x = p.x + p.w + player.w / 2;
      player.vx = 0;
    }
  }
}

// Treat as grounded if player's feet are resting on another player's head
export function isGroundedOnOtherHead(player: PlayerState, others: PlayerState[]) {
  const eps = 2;
  for (const o of others) {
    const horizOverlap = Math.abs(player.x - o.x) < (player.w + o.w) / 2;
    const playerBottom = player.y + player.h / 2;
    const otherTop = o.y - o.h / 2;
    if (horizOverlap && Math.abs(playerBottom - otherTop) <= eps) {
      return true;
    }
  }
  return false;
}

// Resolve collisions between the current player and other players (simple separation)
export function resolvePlayerCollisions(player: PlayerState, others: PlayerState[]) {
  for (const o of others) {
    // compute overlap along axes using center-based boxes
    const dx = player.x - o.x;
    const dy = player.y - o.y;
    const overlapX = player.w / 2 + o.w / 2 - Math.abs(dx);
    const overlapY = player.h / 2 + o.h / 2 - Math.abs(dy);

    if (overlapX > 0 && overlapY > 0) {
      // separate along the smaller penetration axis
      if (overlapX < overlapY) {
        // push horizontally
        if (dx < 0) {
          player.x = o.x - (player.w / 2 + o.w / 2);
        } else {
          player.x = o.x + (player.w / 2 + o.w / 2);
        }
        player.vx = 0;
      } else {
        // push vertically
        if (dy < 0) {
          // player is above other
          player.y = o.y - (player.h / 2 + o.h / 2);
          player.vy = 0;
          player.isGrounded = true;
        } else {
          // player is below other
          player.y = o.y + (player.h / 2 + o.h / 2);
          player.vy = 0;
        }
      }
    }
  }
}

// Carry any players standing on this player's head by this tick's movement
function isStandingOnHead(base: PlayerState, other: PlayerState, eps: number): boolean {
  const horizOverlap = Math.abs(other.x - base.x) < (other.w + base.w) / 2;
  const otherBottom = other.y + other.h / 2;
  const baseTop = base.y - base.h / 2;
  return horizOverlap && Math.abs(otherBottom - baseTop) <= eps;
}

export function carryPlayersOnHead(base: PlayerState, others: PlayerState[]) {
  const eps = 2;
  const dx = base.x - base.prevX;
  const dy = base.y - base.prevY;
  if (dx === 0 && dy === 0) return;

  for (const o of others) {
    if (!isStandingOnHead(base, o, eps)) continue;
    o.x += dx;
    o.y += dy;
    o.isGrounded = true;
    if (dy < 0 && o.vy > 0) o.vy = 0;
    o.prevX = o.x - dx;
    o.prevY = o.y - dy;
  }
}

// Detect crossing into a rectangle boundary this tick (pre-resolution)
export function hitRectEdge(player: PlayerState, rect: RectLike): boolean {
  const bottomPrev = player.prevY + player.h / 2;
  const bottomNow = player.y + player.h / 2;
  const topPrev = player.prevY - player.h / 2;
  const topNow = player.y - player.h / 2;

  const leftPrev = player.prevX - player.w / 2;
  const leftNow = player.x - player.w / 2;
  const rightPrev = player.prevX + player.w / 2;
  const rightNow = player.x + player.w / 2;

  // Crossing top surface
  if (bottomPrev <= rect.y && bottomNow >= rect.y && aabb(player, rect)) return true;
  // Crossing bottom surface
  if (topPrev >= rect.y + rect.h && topNow <= rect.y + rect.h && aabb(player, rect)) return true;
  // Crossing left edge
  if (rightPrev <= rect.x && rightNow >= rect.x && aabb(player, rect)) return true;
  // Crossing right edge
  if (leftPrev >= rect.x + rect.w && leftNow <= rect.x + rect.w && aabb(player, rect)) return true;

  return false;
}