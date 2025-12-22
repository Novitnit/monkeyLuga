import Phaser from "phaser";
import { getStateCallbacks, type Room } from "colyseus.js";
import type { GameState } from "@isgame/shared";

export class InteractRenderer {
  private scene: Phaser.Scene;
  private room: Room<GameState>;
  private rects = new Map<string, Phaser.GameObjects.Rectangle>();

  constructor(scene: Phaser.Scene, room: Room<GameState>) {
    this.scene = scene;
    this.room = room;
  }

  init() {
    const $ = getStateCallbacks(this.room);

    $(this.room.state).interactBoxes.onAdd((box, id) => {
      const r = this.scene.add.rectangle(
        box.x + box.w / 2,
        box.y + box.h / 2,
        box.w,
        box.h,
        0x00ff00,
        1
      ).setDepth(100);
      this.rects.set(id, r);
    });

    this.room.onMessage("interact_fx", data => {
      const r = this.rects.get(data.boxId);
      if (!r) return;
      r.setFillStyle(0x00ff00, 0.6);
      this.scene.time.delayedCall(200, () => {
        r.setFillStyle(0x00ff00, 0.3);
      });
    });
  }
}
