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
} from "./Physics";
import { QuestionService, MathQuestion } from "../services/QuestionService";
import { m5Questions } from "../question/m5";

const TICK_RATE = 20;
const DT = 1 / TICK_RATE;
const QUESTION_DELAY_MS = 2000;
const DEATH_Y = 700;
export class GameRoom extends Room<GameState> {

  private inputs = new Map<string, InputState>();
  private questionService!: QuestionService;
  private activeQuestionByPlayer = new Map<string, { boxId: string; qid: string }>();
  private pendingQuestionFor = new Set<string>();
  private frozenUntil = new Map<string, number>();
  private openDoorsByPlayer = new Map<string, Set<string>>();
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
          const set = this.openDoorsByPlayer.get(client.sessionId) || new Set<string>();
          set.add(info.opensDoorId);
          this.openDoorsByPlayer.set(client.sessionId, set);
          client.send("door_update", { doorId: info.opensDoorId, open: true });
        }
      } else {
        this.scheduleQuestionAfterDelay(client, active.boxId);
      }

      client.send("question_result", { isCorrect });
    });

    this.setSimulationInterval(() => {
      this.updatePlayers();
    }, 1000 / TICK_RATE);
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
      const input = this.isFrozen(id) ? undefined : this.inputs.get(id);
      this.updatePlayer(player, input, id);
      this.inputs.delete(id); // clear input after processing
    });
  }

  private updatePlayer(player: PlayerState, input: InputState | undefined, playerId: string) {
    player.prevY = player.y;
    player.prevX = player.x;
    const wasGrounded = player.isGrounded;
    player.isGrounded = false;

    applyHorizontalInput(player, input);
    applyJump(player, input, wasGrounded);
    applyGravity(player, DT);
    integrate(player, DT);
    // รวมแพลตฟอร์มกับประตูที่ยังไม่เปิด เพื่อทำให้ชนได้
    const staticPlatforms = map1.platforms as unknown as RectLike[];
    const closedDoors: RectLike[] = [];
    const opened = this.openDoorsByPlayer.get(playerId) || new Set<string>();
    this.state.doors.forEach(d => {
      if (!opened.has(d.id)) {
        closedDoors.push({ x: d.x, y: d.y, w: d.w, h: d.h } as RectLike);
      }
    });
    resolvePlatformCollisions(player, [...staticPlatforms, ...closedDoors]);

    // ตรวจเช็คการตาย/ตกจากฉาก
    if (player.y > DEATH_Y) {
      this.respawnPlayer(playerId);
    }
  }

  private respawnPlayer(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;
    // ย้ายกลับจุดเริ่มต้นและรีเซ็ตความเร็ว
    player.x = map1.playerSpawns.x;
    player.y = map1.playerSpawns.y;
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;

    // ปิดประตูทั้งหมดสำหรับผู้เล่นนี้ (รีเซ็ตสถานะเฉพาะผู้เล่น)
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