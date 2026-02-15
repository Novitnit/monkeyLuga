// server/src/rooms/GameRoom.ts
import { Room, Client } from "@colyseus/core";
import { GameState, PlayerState, InteractBoxState, DoorState } from "@isgame/shared";
import { map1, InputState } from "@isgame/shared";
import { aabb, RectLike } from "../utils/collision";
import {
  applyHorizontalInput,
  applyJump,
  applyGravity,
  integrate,
  resolvePlatformCollisions,
  isGroundedOnOtherHead,
  resolvePlayerCollisions,
  carryPlayersOnHead,
  hitRectEdge,
} from "./Physics";
import { QuestionService, MathQuestion } from "../services/QuestionService";
import { m5Questions } from "../question/m5";
import { TICK_RATE, DT, QUESTION_DELAY_MS, DEATH_Y } from "./RoomConfig";
export class GameRoom extends Room<GameState> {

  private inputs = new Map<string, InputState>();
  private questionService!: QuestionService;
  private activeQuestionByPlayer = new Map<string, { boxId: string; qid: string }>();
  private pendingQuestionFor = new Set<string>();
  private frozenUntil = new Map<string, number>();
  private openDoorsByPlayer = new Map<string, Set<string>>();
  private tbcShown = new Set<string>();
  private hardFrozen = new Set<string>();
  private colorPalette = [
    "#e53935", // red
    "#1e88e5", // blue
    "#43a047", // green
    "#8e24aa", // purple
    "#fb8c00", // orange
    "#f06292", // pink
    "#00acc1", // teal
    "#fdd835"  // yellow
  ];
  private usedColors = new Set<string>();

  onCreate() {
    this.state = new GameState();
    this.questionService = new QuestionService(m5Questions);
    this.initMap();
    this.registerMessageHandlers();

    this.setSimulationInterval(() => {
      this.updatePlayers();
    }, 1000 / TICK_RATE);
  }

  private initMap() {
    if (map1.interactBoxes) {
      for (const box of map1.interactBoxes) {
        const b = new InteractBoxState();
        b.id = box.id;
        b.x = box.x;
        b.y = box.y;
        b.w = box.w;
        b.h = box.h;
        if (box.opensDoorId) b.opensDoorId = box.opensDoorId;
        this.state.interactBoxes.set(b.id, b);
      }
    }

    if (map1.doors) {
      for (const d of map1.doors) {
        const door = new DoorState();
        door.id = d.id;
        door.x = d.x;
        door.y = d.y;
        door.w = d.w;
        door.h = d.h;
        door.open = false;
        this.state.doors.set(door.id, door);
      }
    }
  }

  private registerMessageHandlers() {
    this.onMessage("input", (client, input) => {
      if (this.isFrozen(client.sessionId)) return;
      this.inputs.set(client.sessionId, input);
    });

    this.onMessage("interact", (client) => {
      if (this.isFrozen(client.sessionId)) return;
      this.handleInteract(client.sessionId);
    });

    this.onMessage("answer_question", (client, data) => {
      if (this.isFrozen(client.sessionId)) return;
      const { questionId, answerId } = data;
      const active = this.activeQuestionByPlayer.get(client.sessionId);
      if (!active) return;
      if (active.qid !== questionId) return;
      const isCorrect = this.questionService.validateAnswer(questionId, answerId);
      if (isCorrect) {
        this.activeQuestionByPlayer.delete(client.sessionId);
        const info = this.state.interactBoxes.get(active.boxId);
        if (info?.opensDoorId) {
          this.openDoorForPlayer(client.sessionId, info.opensDoorId);
        }
      } else {
        this.scheduleQuestionAfterDelay(client, active.boxId);
      }
      client.send("question_result", { isCorrect });
    });
  }

  private openDoorForPlayer(sessionId: string, doorId: string) {
    const set = this.openDoorsByPlayer.get(sessionId) || new Set<string>();
    set.add(doorId);
    this.openDoorsByPlayer.set(sessionId, set);
    const client = this.clients.find(c => c.sessionId === sessionId);
    if (client) client.send("door_update", { doorId, open: true });
  }

  private handleInteract(sessionId: string) {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    for (const box of this.state.interactBoxes.values()) {
      if (aabb(player, box)) {
        this.onInteract(box.id, sessionId);
      }
    }
  }

  private onInteract(boxId: string, sessionId: string) {
    this.broadcast("interact_fx", { boxId, by: sessionId });
    if (this.activeQuestionByPlayer.has(sessionId)) return;
    const client = this.clients.find((c) => c.sessionId === sessionId);
    if (!client) return;
    const q = this.questionService.getRandomQuestion();
    this.activeQuestionByPlayer.set(sessionId, { boxId, qid: q.id });
    this.sendQuestion(client, boxId, q);
  }

  private sendQuestion(
    client: Client,
    boxId: string,
    q: MathQuestion
  ) {
    client.send("question_show", {
      boxId,
      qid: q.id,
      question: q.question,
      choices: q.answer
    });
  }

  onJoin(client: Client) {
    console.log(`${client.sessionId} joined! room id: ${this.roomId}`);

    const player = new PlayerState();
    player.x = map1.playerSpawns.x;
    player.y = map1.playerSpawns.y;
    player.isGrounded = false;
    player.color = this.assignColor();

    this.state.players.set(client.sessionId, player);
    this.openDoorsByPlayer.set(client.sessionId, new Set());
  }

  onLeave(client: Client) {
    this.allowReconnection(client, 5);
    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.releaseColor(player.color);
    }
    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    this.activeQuestionByPlayer.delete(client.sessionId);
    this.openDoorsByPlayer.delete(client.sessionId);
    this.tbcShown.delete(client.sessionId);
    this.hardFrozen.delete(client.sessionId);
    console.log(`${client.sessionId} left! room id: ${this.roomId}`);
  }

  private assignColor(): string {
    for (const c of this.colorPalette) {
      if (!this.usedColors.has(c)) {
        this.usedColors.add(c);
        return c;
      }
    }
    // fallback: generate distinct-ish HSL based on count
    const i = this.usedColors.size;
    const hue = (i * 137) % 360; // golden angle spacing
    const c = `hsl(${hue}, 70%, 55%)`;
    this.usedColors.add(c);
    return c;
  }

  private releaseColor(color: string) {
    if (this.usedColors.has(color)) {
      this.usedColors.delete(color);
    }
  }

  private updatePlayers() {
    this.state.players.forEach((player, id) => {
      if (this.hardFrozen.has(id)) {
        // keep player static while hard-frozen
        player.vx = 0;
        player.vy = 0;
        this.inputs.delete(id);
        return;
      }
      const input = this.isFrozen(id) ? undefined : this.inputs.get(id);
      this.updatePlayer(player, input, id);
      this.inputs.delete(id); // clear input after processing
    });
  }

  private updatePlayer(player: PlayerState, input: InputState | undefined, playerId: string) {
    player.prevY = player.y;
    player.prevX = player.x;
    let wasGrounded = player.isGrounded;
    player.isGrounded = false;

    applyHorizontalInput(player, input);
    // Treat players standing on another player's head as grounded (can jump)
    const others: PlayerState[] = [];
    this.state.players.forEach((p, id) => { if (id !== playerId) others.push(p); });
    if (!wasGrounded && isGroundedOnOtherHead(player, others)) {
      wasGrounded = true;
    }
    applyJump(player, input, wasGrounded);
    applyGravity(player, DT);
    integrate(player, DT);
    const closedDoors = this.getClosedDoorRects(playerId);

    // Trigger question when crossing closed door boundary (pre-resolution)
    const opened = this.openDoorsByPlayer.get(playerId) || new Set<string>();
    this.state.doors.forEach(d => {
      if (opened.has(d.id)) return;
      const doorRect = { x: d.x, y: d.y, w: d.w, h: d.h } as RectLike;
      if (hitRectEdge(player, doorRect)) {
        let boxIdForDoor: string | undefined;
        this.state.interactBoxes.forEach(b => {
          if (b.opensDoorId === d.id && !boxIdForDoor) boxIdForDoor = b.id;
        });
        if (boxIdForDoor) {
          this.onInteract(boxIdForDoor, playerId);
        }
      }
    });

    resolvePlatformCollisions(player, [...(map1.platforms as unknown as RectLike[]), ...closedDoors]);
    // Prevent players from passing through each other
    resolvePlayerCollisions(player, others);
    // Carry players standing on this player's head along with movement
    carryPlayersOnHead(player, others);

    // Door collision handled pre-resolution above

    // ชน KillZones แล้วตายทันที
    const kills = map1.killZones || [];
    for (const z of kills) {
      // console.log(z)
      if (aabb(player, z as unknown as RectLike)) {
        this.respawnPlayer(playerId);
        return;
      }
    }

    // ชน TeleportZones แล้ววาร์ปไปตำแหน่งที่กำหนด
    const tps = map1.teleportZones || [];
    for (const z of tps) {
      // console.log(z)
      if (aabb(player, z as unknown as RectLike)) {
        player.x = z.targetX;
        player.y = z.targetY;
        player.vx = 0;
        player.vy = 0;
        player.isGrounded = false;
        // once teleported, stop further checks this tick
        return;
      }
    }

    // TBC zones: show overlay once per player
    const tbcZones = map1.tbcZones || [];
    if (tbcZones.length > 0 && !this.tbcShown.has(playerId)) {
      for (const z of tbcZones) {
        if (aabb(player, z as unknown as RectLike)) {
          const client = this.clients.find(c => c.sessionId === playerId);
          if (client) client.send("tbc_show");
          this.tbcShown.add(playerId);
          // freeze player permanently until they leave
          this.hardFrozen.add(playerId);
          player.vx = 0;
          player.vy = 0;
          break;
        }
      }
    }

    if (player.y > DEATH_Y) {
      this.respawnPlayer(playerId);
    }
  }

  private getClosedDoorRects(playerId: string): RectLike[] {
    const rects: RectLike[] = [];
    const opened = this.openDoorsByPlayer.get(playerId) || new Set<string>();
    this.state.doors.forEach(d => {
      if (!opened.has(d.id)) {
        rects.push({ x: d.x, y: d.y, w: d.w, h: d.h } as RectLike);
      }
    });
    return rects;
  }

  private respawnPlayer(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    player.x = map1.playerSpawns.x;
    player.y = map1.playerSpawns.y;
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;

    const opened = this.openDoorsByPlayer.get(playerId);
    if (opened && opened.size > 0) {
      const client = this.clients.find(c => c.sessionId === playerId);
      opened.forEach(doorId => {
        if (client) {
          client.send("door_update", { doorId, open: false });
        }
      });
      opened.clear();
    }

    // ยกเลิกคำถามที่ค้างอยู่
    this.activeQuestionByPlayer.delete(playerId);
  }

  private isFrozen(sessionId: string): boolean {
    if (this.hardFrozen.has(sessionId)) return true;
    const until = this.frozenUntil.get(sessionId) || 0;
    if (Date.now() < until) return true;
    if (until) this.frozenUntil.delete(sessionId);
    return false;
  }

  private scheduleQuestionAfterDelay(client: Client, boxId: string) {
    const sessionId = client.sessionId;
    this.pendingQuestionFor.add(sessionId);
    this.frozenUntil.set(sessionId, Date.now() + QUESTION_DELAY_MS);
    setTimeout(() => {
      this.pendingQuestionFor.delete(sessionId);
      const stillHere = this.clients.find((c) => c.sessionId === sessionId);
      if (!stillHere) return;
      const q = this.questionService.getRandomQuestion();
      this.activeQuestionByPlayer.set(sessionId, { boxId, qid: q.id });
      this.sendQuestion(stillHere, boxId, q);
    }, QUESTION_DELAY_MS);
  }
}