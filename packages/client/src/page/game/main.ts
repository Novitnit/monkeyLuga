import Base from "../basePage";
import Phaser from "phaser";
import GameScene from "./GameScene";
import { navigateTo } from "../../routing";
import { Client, Room } from "colyseus.js";
import type { GameState } from "@isgame/shared";

// ---- singleton client + cached room (ไม่ต้องสร้างไฟล์ใหม่) ----
function getClient(): Client {
  const g = globalThis as any;
  const ip = import.meta.env.VITE_API_URL || `ws://localhost/api`;
  if (!g.__colyClient) g.__colyClient = new Client(ip);
  return g.__colyClient as Client;
}

function setCachedRoom(room: Room<GameState>) {
  (globalThis as any).__cachedGameRoom = room;
}

function popCachedRoom(roomId: string): Room<GameState> | undefined {
  const g = globalThis as any;
  const r = g.__cachedGameRoom as Room<GameState> | undefined;
  if (r && r.roomId === roomId) {
    g.__cachedGameRoom = undefined;
    return r;
  }
  return undefined;
}
// ------------------------------------------------------------

export class GameMainPage extends Base {
  private game?: Phaser.Game;

  constructor() {
    super();
  }

  async render(root: HTMLElement, params?: Record<string, string>): Promise<void> {
    if (this.game) {
      this.game.destroy(true);
      this.game = undefined;
    }

    root.innerHTML = `<div id="game-container" style="width: 100%; height: 100%;"></div>`;

    const client = getClient();
    let roomId = params?.roomId;

    if (!roomId) {
      const room = await client.create<GameState>("game");
      roomId = room.roomId;

      setCachedRoom(room);

      navigateTo(`/game/${roomId}`);
      return;
    }

    const cachedRoom = popCachedRoom(roomId);

    this.game = new Phaser.Game({
      type: Phaser.CANVAS,
      parent: "game-container",
      width: "100%",
      height: "100%",
      scene: [GameScene],
      backgroundColor: "#2d2d2d",
    });

    this.game.scene.start("game", {
      roomId,
      room: cachedRoom,
    });
  }
}
