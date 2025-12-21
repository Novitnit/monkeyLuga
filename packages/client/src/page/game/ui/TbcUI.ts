import Phaser from "phaser";
import type { Room } from "colyseus.js";
import type { GameState } from "@isgame/shared";
import { navigateTo } from "../../../routing";

export class TbcUI {
  private scene: Phaser.Scene;
  private room: Room<GameState>;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, room: Room<GameState>) {
    this.scene = scene;
    this.room = room;
  }

  init() {
    this.room.onMessage("tbc_show", () => {
      if (this.container) return;
      this.build();
    });
    // Do not auto-hide; overlay persists until the player leaves the room
  }

  private build() {
    const { width, height } = this.scene.scale;
    const bg = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.7).setDepth(3000);
    const panel = this.scene.add.rectangle(width/2, height/2, 560, 220, 0xffffff, 1).setDepth(3001).setStrokeStyle(2, 0x000000);
    const title = this.scene.add.text(width/2, height/2 - 20, "To be continued...", {
      fontSize: "32px",
      color: "#000"
    }).setOrigin(0.5);
    const btnText = this.scene.add.text(width/2, height/2 + 70, "OK", {
      fontSize: "20px",
      color: "#000",
    }).setOrigin(0.5).setDepth(3002).setInteractive({ useHandCursor: true });

    btnText.on("pointerdown", () => {
        this.room.leave();
    });

    this.container = this.scene.add.container(0, 0, [bg, panel, title, btnText]).setDepth(3000);
    [bg, panel, title, btnText].forEach(o => (o as any).setScrollFactor(0));

    // no ESC handler: keep overlay until disconnect
  }

  close() {
    if (!this.container) return;
    this.container.destroy(true);
    this.container = undefined;
  }
}
