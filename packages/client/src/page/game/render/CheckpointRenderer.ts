import Phaser from "phaser";
import { getStateCallbacks, type Room } from "colyseus.js";
import type { GameState } from "@isgame/shared";

export class CheckpointRenderer {
  private scene: Phaser.Scene;
  private room: Room<GameState>;
  private graphics = new Map<string, Phaser.GameObjects.Graphics>();
  private localActivated = new Set<string>();

  constructor(scene: Phaser.Scene, room: Room<GameState>) {
    this.scene = scene;
    this.room = room;
    console.log('CheckpointRenderer created');
  }

  init() {
    console.log('CheckpointRenderer init');
    const $ = getStateCallbacks(this.room);

    // Listen for per-player checkpoint activations from server
    this.room.onMessage("checkpoint_activated", (data: { id: string }) => {
      this.localActivated.add(data.id);
      const g = this.graphics.get(data.id);
      if (g) {
        // trigger redraw by fetching the checkpoint state and drawing
        const cp = (this.room.state as any).checkpoints.get(data.id);
        if (cp) {
          // reuse the draw logic by calling onChange handler indirectly
          // simply clear and redraw here
          g.clear();
          // pole
          g.lineStyle(4, 0x8B4513, 1);
          g.lineBetween(
            cp.x + cp.w / 2,
            cp.y + cp.h,
            cp.x + cp.w / 2,
            cp.y
          );
          const fillColor = this.localActivated.has(data.id) ? 0x00ff00 : 0xffff00;
          g.fillStyle(fillColor, 1);
          g.fillTriangle(
            cp.x + cp.w / 2, cp.y,
            cp.x + cp.w, cp.y + cp.h / 3,
            cp.x + cp.w / 2, cp.y + cp.h / 2
          );
          g.lineStyle(2, 0x000000, 1);
          g.strokeTriangle(
            cp.x + cp.w / 2, cp.y,
            cp.x + cp.w, cp.y + cp.h / 3,
            cp.x + cp.w / 2, cp.y + cp.h / 2
          );
        }
      }
    });

    $(this.room.state).checkpoints.onAdd((checkpoint, id) => {
      console.log('checkpoint added', id, checkpoint);

      const g = this.scene.add.graphics();
      g.setDepth(2);
      this.graphics.set(id, g);

      const draw = (cp: any) => {
        g.clear();
        // pole
        g.lineStyle(4, 0x8B4513, 1);
        g.lineBetween(
          cp.x + cp.w / 2,
          cp.y + cp.h,
          cp.x + cp.w / 2,
          cp.y
        );
        // flag color: prefer per-player activation if present
        const fillColor = this.localActivated.has(id) ? 0x00ff00 : (cp.activated ? 0x00ff00 : 0xffff00);
        g.fillStyle(fillColor, 1);
        g.fillTriangle(
          cp.x + cp.w / 2, cp.y,
          cp.x + cp.w, cp.y + cp.h / 3,
          cp.x + cp.w / 2, cp.y + cp.h / 2
        );
        g.lineStyle(2, 0x000000, 1);
        g.strokeTriangle(
          cp.x + cp.w / 2, cp.y,
          cp.x + cp.w, cp.y + cp.h / 3,
          cp.x + cp.w / 2, cp.y + cp.h / 2
        );
      };

      draw(checkpoint);

      // redraw on change
      $(checkpoint).onChange(() => draw(checkpoint));

      // remove graphics when checkpoint removed
      $(this.room.state).checkpoints.onRemove((_, rid) => {
        if (rid === id) {
          const gg = this.graphics.get(id);
          gg?.destroy();
          this.graphics.delete(id);
        }
      });
    });
  }
}