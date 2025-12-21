import Phaser from "phaser";
import { map1 } from "@isgame/shared";

export class TeleportZoneRenderer {
  private scene: Phaser.Scene;
  constructor(scene: Phaser.Scene) { this.scene = scene; }

  init() {
    const zones = map1.teleportZones || [];
    zones.forEach(z => {
      const r = this.scene.add.rectangle(
        z.x + z.w / 2,
        z.y + z.h / 2,
        z.w,
        z.h,
        0x6633ff,
        0.25
      ).setStrokeStyle(2, 0x6633ff).setDepth(20);
    //   this.scene.add.line(
    //     z.targetX,
    //     z.targetY,
    //     -10, 0,
    //     10, 0,
    //     0x6633ff
    //   ).setDepth(21);
    //   this.scene.add.line(
    //     z.targetX,
    //     z.targetY,
    //     0, -10,
    //     0, 10,
    //     0x6633ff
    //   ).setDepth(21);
    });
  }
}
