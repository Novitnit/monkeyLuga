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