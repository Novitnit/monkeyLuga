// server/src/rooms/GameRoom.ts
import { Room, Client } from "@colyseus/core";
import { GameState, PlayerState, InteractBoxState } from "@isgame/shared";
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

// Using RectLike and MathQuestion from modules

const TICK_RATE = 20;
const DT = 1 / TICK_RATE;

// Physics constants are defined in Physics.ts

export class GameRoom extends Room<GameState> {

  private inputs = new Map<string, InputState>();
  private questionService!: QuestionService;
  private activeQuestionByPlayer = new Map<string, { boxId: string; qid: string }>();
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

    this.questionService = new QuestionService("./src/question/m5.json");

    // init interact boxes จาก map
    if (map1.interactBoxes) {
      for (const box of map1.interactBoxes) {
        const b = new InteractBoxState();
        b.id = box.id;
        b.x = box.x;
        b.y = box.y;
        b.w = box.w;
        b.h = box.h;
        this.state.interactBoxes.set(b.id, b);
      }
    }

    this.onMessage("input", (client, input) => {
      this.inputs.set(client.sessionId, input);
    });

    this.onMessage("interact", (client) => {
      this.handleInteract(client.sessionId);
    });

    this.onMessage("getNewQuestion", (client) => {
      const active = this.activeQuestionByPlayer.get(client.sessionId);
      if (!active) return;

      const q = this.questionService.getRandomQuestion();
      this.activeQuestionByPlayer.set(client.sessionId, {
        boxId: active.boxId,
        qid: q.id
      });

      this.sendQuestion(client, active.boxId, q);
    });

    this.onMessage("answer_question", (client, data) => {
      const { questionId, answerId } = data;

      const active = this.activeQuestionByPlayer.get(client.sessionId);
      if (!active) return;

      if (active.qid !== questionId) return;

      const isCorrect = this.questionService.validateAnswer(questionId, answerId);

      if (isCorrect) {
        this.activeQuestionByPlayer.delete(client.sessionId);
      }

      client.send("question_result", { isCorrect });
    });

    this.setSimulationInterval(() => {
      this.updatePlayers();
    }, 1000 / TICK_RATE);
  }

  // removed deprecated local question loading methods

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
    if (boxId !== "id1") return;
    if (this.activeQuestionByPlayer.has(sessionId)) return;

    const q = this.questionService.getRandomQuestion();
    this.activeQuestionByPlayer.set(sessionId, { boxId, qid: q.id });
    const client = this.clients.find((c) => c.sessionId === sessionId);
    if (!client) return;
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
      const input = this.inputs.get(id);
      this.updatePlayer(player, input);
      this.inputs.delete(id); // clear input after processing
    });
  }

  private updatePlayer(player: PlayerState, input?: InputState) {
    player.prevY = player.y;
    player.prevX = player.x;
    const wasGrounded = player.isGrounded;
    player.isGrounded = false;

    applyHorizontalInput(player, input);
    applyJump(player, input, wasGrounded);
    applyGravity(player, DT);
    integrate(player, DT);
    resolvePlatformCollisions(player, map1.platforms as unknown as RectLike[]);
  }
}
// no local AABB; use aabb from utils