import Phaser from "phaser";
import { map1 } from "@isgame/shared";

export class MovingPlatformRenderer {
  private scene: Phaser.Scene;
  private platforms: any[] = [];
  private startTime = Date.now();

  constructor(scene: Phaser.Scene) { 
    this.scene = scene; 
  }

  init() {
    const platforms = map1.movingPlatforms || [];
    platforms.forEach(p => {
      // Main platform
      const rect = this.scene.add.rectangle(
        p.x + p.w / 2,
        p.y + p.h / 2,
        p.w,
        p.h,
        0x8B6914,
        0.9
      ).setStrokeStyle(2, 0x654321).setDepth(5);

      // Shadow platform showing range of movement
      let shadowRect: Phaser.GameObjects.Rectangle | undefined;
      if (p.moveDistance && p.moveDistance > 0) {
        const shadowWidth = p.w + p.moveDistance;
        const shadowX = p.x + p.w / 2 + p.moveDistance / 2;
        shadowRect = this.scene.add.rectangle(
          shadowX,
          p.y + p.h / 2,
          shadowWidth,
          p.h,
          0x999999,
          0.2
        ).setStrokeStyle(1, 0x666666, 0.3).setDepth(4);
      }

      this.platforms.push({
        platform: p,
        rect,
        shadowRect
      });
    });

    // Update animated platforms every frame
    this.scene.events.on('update', () => {
      this.updateAnimations();
    });
  }

  private updateAnimations() {
    const elapsed = (Date.now() - this.startTime) / 1000; // Convert to seconds

    this.platforms.forEach(({ platform, rect }) => {
      if (!platform.moveDistance || platform.moveDistance === 0) {
        return; // No animation
      }

      const speed = platform.moveSpeed || 100; // pixels per second
      const distance = platform.moveDistance || 0;
      const startOffset = platform.startPhase ?? 0;

      // Convert pixel offset to progress offset
      const clampedOffset = Math.max(-distance, Math.min(distance, startOffset));
      const startProgressOffset = Math.asin(clampedOffset / distance) / Math.PI;

      // Calculate movement using sine wave for back-and-forth motion
      const cycle = (distance * 2) / speed; // Time for one complete cycle
      const progress = (elapsed % cycle) / cycle; // 0 to 1
      const adjustedProgress = (progress + startProgressOffset) % 1;
      const sineValue = Math.sin(adjustedProgress * Math.PI); // 0 to 1 to 0
      const offsetX = sineValue * distance;

      rect.x = platform.x + platform.w / 2 + offsetX;
    });
  }
}
