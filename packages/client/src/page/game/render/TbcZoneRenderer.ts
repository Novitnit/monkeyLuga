import Phaser from "phaser";
import { map1 } from "@isgame/shared";

export class TbcZoneRenderer {
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) { this.scene = scene; }

  init() {
    const zones = map1.tbcZones || [];
    zones.forEach(z => {
      this.scene.add.rectangle(
        z.x + z.w / 2,
        z.y + z.h / 2,
        z.w,
        z.h,
        0x82f591,
        0.8
      ).setStrokeStyle(2, 0x82f591).setDepth(20);
    });
  }
}
