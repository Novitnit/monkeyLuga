import Phaser from "phaser";
import { getStateCallbacks, type Room } from "colyseus.js";
import type { GameState } from "@isgame/shared";

export class DoorRenderer {
  private scene: Phaser.Scene;
  private room: Room<GameState>;
  private rects = new Map<string, Phaser.GameObjects.Rectangle>();
  private localOpen = new Set<string>();

  constructor(scene: Phaser.Scene, room: Room<GameState>) {
    this.scene = scene;
    this.room = room;
  }

  init() {
    const $ = getStateCallbacks(this.room);

    $(this.room.state).doors.onAdd((door, id) => {
      const r = this.scene.add.rectangle(
        door.x + door.w / 2,
        door.y + door.h / 2,
        door.w,
        door.h,
        0x996633,
        this.localOpen.has(id) ? 0.0 : 1.0
      ).setDepth(1);
      r.setVisible(!this.localOpen.has(id));
      this.rects.set(id, r);

      $(door).onChange(() => {
        const dr = this.rects.get(id);
        if (!dr) return;
        // keep server state if used, but local per-player override below
        dr.setFillStyle(0x996633, door.open ? 0.0 : 1.0);
        dr.setVisible(!door.open);
      });
    });

    // per-player door updates
    this.room.onMessage("door_update", (data: { doorId: string; open: boolean }) => {
      const { doorId, open } = data;
      const r = this.rects.get(doorId);
      if (!r) return;
      if (open) {
        this.localOpen.add(doorId);
        r.setFillStyle(0x996633, 0.0);
        r.setVisible(false);
      } else {
        this.localOpen.delete(doorId);
        r.setFillStyle(0x996633, 1.0);
        r.setVisible(true);
      }
    });
  }
}
