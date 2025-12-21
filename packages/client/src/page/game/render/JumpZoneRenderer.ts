import Phaser from "phaser";
import { map1 } from "@isgame/shared";

export class JumpZoneRenderer {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  init() {
    const zones = map1.highJumpZones || [];
    zones.forEach(z => {
      this.scene.add.rectangle(
        z.x + z.w / 2,
        z.y + z.h / 2,
        z.w,
        z.h,
        0x33ccff,
        0.25
      ).setStrokeStyle(2, 0x33ccff).setDepth(20);
    });
  }
}
