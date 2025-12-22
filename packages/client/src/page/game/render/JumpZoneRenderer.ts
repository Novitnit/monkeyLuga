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
        0xd7f542,
        0.8
      ).setStrokeStyle(2, 0xd7f542).setDepth(20);
    });
  }
}
