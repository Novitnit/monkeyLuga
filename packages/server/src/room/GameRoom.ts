// server/src/rooms/GameRoom.ts
import { Room, Client } from "@colyseus/core";
import { GameState, PlayerState, DoorState, CheckpointState } from "@isgame/shared";
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
  private lastCheckpoint = new Map<string, { x: number; y: number }>();
  private deathQuestionByPlayer = new Map<string, string>(); // playerId -> questionId
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

  private startTime = Date.now();

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

    if (map1.checkpoints) {
      for (const c of map1.checkpoints) {
        const checkpoint = new CheckpointState();
        checkpoint.id = c.id;
        checkpoint.x = c.x;
        checkpoint.y = c.y;
        checkpoint.w = c.w;
        checkpoint.h = c.h;
        checkpoint.activated = false;
        this.state.checkpoints.set(checkpoint.id, checkpoint);
      }
    }
  }

  private registerMessageHandlers() {
    this.onMessage("input", (client, input) => {
      if (this.isFrozen(client.sessionId)) return;
      this.inputs.set(client.sessionId, input);
    });

    this.onMessage("answer_question", (client, data) => {
      const { questionId, answerId } = data;
      const active = this.activeQuestionByPlayer.get(client.sessionId);
      if (!active) return;
      if (active.qid !== questionId) return;
      const isCorrect = this.questionService.validateAnswer(questionId, answerId);
      if (isCorrect) {
        this.activeQuestionByPlayer.delete(client.sessionId);
        this.deathQuestionByPlayer.delete(client.sessionId);
        // Unfreeze player after correct answer
        this.frozenUntil.delete(client.sessionId);
        // Open door if this was a door interaction
        if (active.boxId.startsWith("door_")) {
          this.openDoorForPlayer(client.sessionId, active.boxId.replace("door_", ""));
        }
      } else {
        if (active.boxId === "death") {
          // Wrong answer on death question, respawn at main spawn point
          this.respawnAtMainSpawn(client.sessionId);
          this.activeQuestionByPlayer.delete(client.sessionId);
          this.deathQuestionByPlayer.delete(client.sessionId);
        } else if (active.boxId.startsWith("door_")) {
          // Wrong answer on door question: respawn at main spawn point
          this.respawnAtMainSpawn(client.sessionId);
          this.activeQuestionByPlayer.delete(client.sessionId);
        } else {
          this.scheduleQuestionAfterDelay(client, active.boxId);
        }
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

  private showDoorQuestion(playerId: string, doorId: string) {
    if (this.activeQuestionByPlayer.has(playerId)) return;
    const client = this.clients.find((c) => c.sessionId === playerId);
    if (!client) return;
    const q = this.questionService.getRandomQuestion();
    this.activeQuestionByPlayer.set(playerId, { boxId: `door_${doorId}`, qid: q.id });
    // Freeze player while showing question
    this.frozenUntil.set(playerId, Date.now() + QUESTION_DELAY_MS);
    client.send("question_show", {
      boxId: `door_${doorId}`,
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

    // If frozen, clear all horizontal movement
    if (input === undefined) {
      player.vx = 0;
    } else {
      applyHorizontalInput(player, input);
    }
    // Treat players standing on another player's head as grounded (can jump)
    const others: PlayerState[] = [];
    this.state.players.forEach((p, id) => { if (id !== playerId) others.push(p); });
    if (!wasGrounded && isGroundedOnOtherHead(player, others)) {
      wasGrounded = true;
    }
    // Only allow jump if not frozen
    if (input !== undefined) {
      applyJump(player, input, wasGrounded);
    }
    applyGravity(player, DT);
    integrate(player, DT);
    
    // Apply moving platform velocity before collision resolution
    // so it's factored into the collision calculations
    const movingPlatformVx = this.getMovingPlatformVelocity(player);
    player.vx += movingPlatformVx;
    
    const closedDoors = this.getClosedDoorRects(playerId);

    // Trigger question when crossing closed door boundary (pre-resolution)
    const opened = this.openDoorsByPlayer.get(playerId) || new Set<string>();
    this.state.doors.forEach(d => {
      if (opened.has(d.id)) return;
      const doorRect = { x: d.x, y: d.y, w: d.w, h: d.h } as RectLike;
      if (hitRectEdge(player, doorRect)) {
        // Show question for this door
        this.showDoorQuestion(playerId, d.id);
      }
    });

    resolvePlatformCollisions(player, [...(map1.platforms as unknown as RectLike[]), ...closedDoors, ...this.getAnimatedMovingPlatforms()]);
    
    // Prevent players from passing through each other
    resolvePlayerCollisions(player, others);
    // Carry players standing on this player's head along with movement
    carryPlayersOnHead(player, others);

    // Door collision handled pre-resolution above

    // ชน KillZones แล้วตายทันที
    const kills = map1.killZones || [];
    for (const z of kills) {
      // Get animated position if applicable
      const killZone = this.getAnimatedKillZone(z);
      if (aabb(player, killZone as unknown as RectLike)) {
        this.handleDeath(playerId);
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

    // Checkpoint collision: activate checkpoint and save respawn position
    const checkpoints = map1.checkpoints || [];
    for (const c of checkpoints) {
      if (aabb(player, c as unknown as RectLike)) {
        const checkpointState = this.state.checkpoints.get(c.id);
        if (checkpointState) {
          // Always save position when touching checkpoint
          this.lastCheckpoint.set(playerId, { x: c.x + c.w / 2, y: c.y });
          // Notify only this player that they've activated the checkpoint
          const client = this.clients.find(cu => cu.sessionId === playerId);
          if (client) {
            client.send("checkpoint_activated", { id: c.id });
          }
        }
      }
    }

    if (player.y > DEATH_Y) {
      this.handleDeath(playerId);
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

    // Respawn at last checkpoint or default spawn
    const checkpoint = this.lastCheckpoint.get(playerId);
    if (checkpoint) {
      player.x = checkpoint.x;
      player.y = checkpoint.y;
    } else {
      player.x = map1.playerSpawns.x;
      player.y = map1.playerSpawns.y;
    }

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
    this.deathQuestionByPlayer.delete(playerId);
    const client = this.clients.find(c => c.sessionId === playerId);
    if (client) {
      client.send("respawn", { x: player.x, y: player.y });
    }
  }

  private respawnAtMainSpawn(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;

    // Always respawn at main spawn point
    player.x = map1.playerSpawns.x;
    player.y = map1.playerSpawns.y;
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;

    // Reset checkpoint
    this.lastCheckpoint.delete(playerId);

    // Reset activated state of all checkpoints so player visual state is cleared
    this.state.checkpoints.forEach(cp => {
      cp.activated = false;
    });

    // Ensure player is unfrozen so they can move after being respawned
    this.frozenUntil.delete(playerId);
    this.hardFrozen.delete(playerId);

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
      const client = this.clients.find(c => c.sessionId === playerId);
      if (client) {
        client.send("respawn", { x: player.x, y: player.y });
      }

    // ยกเลิกคำถามที่ค้างอยู่
    this.activeQuestionByPlayer.delete(playerId);
    this.deathQuestionByPlayer.delete(playerId);
  }

  private handleDeath(playerId: string) {
    const player = this.state.players.get(playerId);
    if (!player) return;

    player.deathCount++;

    // First, respawn player at checkpoint/spawn location
    const checkpoint = this.lastCheckpoint.get(playerId);
    if (checkpoint) {
      player.x = checkpoint.x;
      player.y = checkpoint.y;
    } else {
      player.x = map1.playerSpawns.x;
      player.y = map1.playerSpawns.y;
    }
    player.vx = 0;
    player.vy = 0;
    player.isGrounded = false;

    // Reset all opened doors
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

    // Then show question
    const question = this.questionService.getRandomQuestion();
    if (!question) {
      // No questions available, player stays at respawn
      return;
    }

    this.deathQuestionByPlayer.set(playerId, question.id);
    this.activeQuestionByPlayer.set(playerId, { boxId: "death", qid: question.id });
    // Freeze player while showing death question
    this.frozenUntil.set(playerId, Date.now() + QUESTION_DELAY_MS);

    const client = this.clients.find(c => c.sessionId === playerId);
    if (client) {
      client.send("question_show", {
        boxId: "death",
        qid: question.id,
        question: question.question,
        choices: question.answer
      });
    }
  }

  private isFrozen(sessionId: string): boolean {
    if (this.hardFrozen.has(sessionId)) return true;
    const until = this.frozenUntil.get(sessionId) || 0;
    if (Date.now() < until) return true;
    if (until) this.frozenUntil.delete(sessionId);
    return false;
  }

  private getAnimatedKillZone(zone: any): RectLike {
    if (!zone.moveDistance || zone.moveDistance === 0) {
      return { x: zone.x, y: zone.y, w: zone.w, h: zone.h };
    }

    const elapsed = (Date.now() - this.startTime) / 1000; // Convert to seconds
    const speed = zone.moveSpeed || 100; // pixels per second
    const distance = zone.moveDistance || 0;
    
    // Calculate movement using sine wave for back-and-forth motion
    const cycle = (distance * 2) / speed; // Time for one complete cycle
    const progress = (elapsed % cycle) / cycle; // 0 to 1
    const sineValue = Math.sin(progress * Math.PI); // 0 to 1 to 0
    const offsetX = sineValue * distance;

    return { x: zone.x + offsetX, y: zone.y, w: zone.w, h: zone.h };
  }

  private getAnimatedMovingPlatforms(): (RectLike & {prevX?: number, prevY?: number})[] {
    const platforms: (RectLike & {prevX?: number, prevY?: number})[] = [];
    const movingPlatforms = map1.movingPlatforms || [];

    for (const p of movingPlatforms) {
      if (!p.moveDistance || p.moveDistance === 0) {
        platforms.push({ x: p.x, y: p.y, w: p.w, h: p.h });
        continue;
      }

      const elapsed = (Date.now() - this.startTime) / 1000;
      const speed = p.moveSpeed || 100;
      const distance = p.moveDistance || 0;
      const startOffset = p.startPhase ?? 0;

      // Convert pixel offset to progress offset
      const clampedOffset = Math.max(-distance, Math.min(distance, startOffset));
      const startProgressOffset = Math.asin(clampedOffset / distance) / Math.PI;

      const cycle = (distance * 2) / speed;
      const progress = (elapsed % cycle) / cycle;
      const adjustedProgress = (progress + startProgressOffset) % 1;
      const sineValue = Math.sin(adjustedProgress * Math.PI);
      const offsetX = sineValue * distance;

      // Calculate prev position
      const elapsedPrev = elapsed - DT;
      const progressPrev = (elapsedPrev % cycle) / cycle;
      const adjustedProgressPrev = (progressPrev + startProgressOffset) % 1;
      const sineValuePrev = Math.sin(adjustedProgressPrev * Math.PI);
      const offsetXPrev = sineValuePrev * distance;

      platforms.push({ x: p.x + offsetX, y: p.y, w: p.w, h: p.h, prevX: p.x + offsetXPrev, prevY: p.y });
    }

    return platforms;
  }

  private getMovingPlatformVelocity(player: PlayerState): number {
    const movingPlatforms = map1.movingPlatforms || [];
    const elapsed = (Date.now() - this.startTime) / 1000;

    for (const p of movingPlatforms) {
      if (!p.moveDistance || p.moveDistance === 0) continue;

      const speed = p.moveSpeed || 100;
      const distance = p.moveDistance || 0;
      const startOffset = p.startPhase ?? 0;

      // Convert pixel offset to progress offset
      const clampedOffset = Math.max(-distance, Math.min(distance, startOffset));
      const startProgressOffset = Math.asin(clampedOffset / distance) / Math.PI;

      const cycle = (distance * 2) / speed;
      const progress = (elapsed % cycle) / cycle;
      const adjustedProgress = (progress + startProgressOffset) % 1;

      // Calculate velocity (derivative of sine wave)
      const cosValue = Math.cos(adjustedProgress * Math.PI);
      const velocityScale = (distance * Math.PI / cycle);
      const platformVx = cosValue * velocityScale;

      // Get animated platform position
      const sineValue = Math.sin(adjustedProgress * Math.PI);
      const offsetX = sineValue * distance;
      const animatedPlatform = { x: p.x + offsetX, y: p.y, w: p.w, h: p.h };

      // Calculate prev position
      const elapsedPrev = elapsed - DT;
      const progressPrev = (elapsedPrev % cycle) / cycle;
      const adjustedProgressPrev = (progressPrev + startProgressOffset) % 1;
      const sineValuePrev = Math.sin(adjustedProgressPrev * Math.PI);
      const offsetXPrev = sineValuePrev * distance;
      const prevAnimatedPlatform = { x: p.x + offsetXPrev, y: p.y, w: p.w, h: p.h };

      // Check for side collisions and resolve
      const bottomPrev = player.prevY + player.h / 2;
      const bottomNow = player.y + player.h / 2;
      const rightPrev = player.prevX + player.w / 2;
      const rightNow = player.x + player.w / 2;
      const leftPrev = player.prevX - player.w / 2;
      const leftNow = player.x - player.w / 2;

      // Hit left side of platform
      if (rightPrev <= prevAnimatedPlatform.x && rightNow >= animatedPlatform.x && aabb(player, animatedPlatform as unknown as RectLike)) {
        player.x = animatedPlatform.x - player.w / 2;
        player.vx = platformVx;
        return 0; // Don't add extra velocity
      }

      // Hit right side of platform
      if (leftPrev >= prevAnimatedPlatform.x + prevAnimatedPlatform.w && leftNow <= animatedPlatform.x + animatedPlatform.w && aabb(player, animatedPlatform as unknown as RectLike)) {
        player.x = animatedPlatform.x + animatedPlatform.w + player.w / 2;
        player.vx = platformVx;
        return 0;
      }

      // Check if player is on top (for velocity addition)
      if (aabb(player, animatedPlatform as unknown as RectLike)) {
        return platformVx;
      }
    }

    return 0;
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
      // Send question_show to client so UI opens after delay
      stillHere.send("question_show", {
        boxId: boxId,
        qid: q.id,
        question: q.question,
        choices: q.answer
      });
    }, QUESTION_DELAY_MS);
  }
}