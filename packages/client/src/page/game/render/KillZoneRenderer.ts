import Phaser from "phaser";
import { map1 } from "@isgame/shared";

export class KillZoneRenderer {
  private scene: Phaser.Scene;
  private zones: any[] = [];
  private startTime = Date.now();

  constructor(scene: Phaser.Scene) { this.scene = scene; }

  init() {
    const zones = map1.killZones || [];
    zones.forEach(z => {
      this.zones.push({
        zone: z,
        rect: this.scene.add.rectangle(
          z.x + z.w / 2,
          z.y + z.h / 2,
          z.w,
          z.h,
          0xff3333,
          1
        ).setStrokeStyle(2, 0xff3333).setDepth(20)
      });
    });

    // Update animated killzones every frame
    this.scene.events.on('update', () => {
      this.updateAnimations();
    });
  }

  private updateAnimations() {
    const elapsed = (Date.now() - this.startTime) / 1000; // Convert to seconds

    this.zones.forEach(({ zone, rect }) => {
      if (!zone.moveDistance || zone.moveDistance === 0) {
        return; // No animation
      }

      const speed = zone.moveSpeed || 100; // pixels per second
      const distance = zone.moveDistance || 0;

      // Calculate movement using sine wave for back-and-forth motion
      const cycle = (distance * 2) / speed; // Time for one complete cycle
      const progress = (elapsed % cycle) / cycle; // 0 to 1
      const sineValue = Math.sin(progress * Math.PI); // 0 to 1 to 0
      const offsetX = sineValue * distance;

      rect.x = zone.x + zone.w / 2 + offsetX;
    });
  }
}
