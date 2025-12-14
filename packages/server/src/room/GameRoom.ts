// server/src/rooms/GameRoom.ts
import { Room, Client } from "colyseus";
import { GameState, PlayerState } from "@isgame/shared/schema";

type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

const TICK_RATE = 20;
const DT = 1 / TICK_RATE;

const SPEED = 200;
const GRAVITY = 1200;
const JUMP_FORCE = 500;
const GROUND_Y = 0;

export class GameRoom extends Room<GameState> {

  private inputs = new Map<string, InputState>();

  onCreate() {
    this.state = new GameState();
    console.log("GameRoom created!", this.roomId);
    this.onMessage("input", (client, input) => {
        this.inputs.set(client.sessionId, input);
    });

    this.setSimulationInterval(() => {
      this.updatePlayers();
    }, 1000 / TICK_RATE);
  }

  onJoin(client: Client) {
    console.log(`${client.sessionId} joined! room id: ${this.roomId}`);

    const player = new PlayerState();
    player.x = 0;
    player.y = GROUND_Y;

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
      this.allowReconnection(client, 5);
    this.state.players.delete(client.sessionId);
    this.inputs.delete(client.sessionId);
    console.log(`${client.sessionId} left! room id: ${this.roomId}`);
  }

  private updatePlayers() {
    this.state.players.forEach((player, id) => {
      const input = this.inputs.get(id);
      this.updatePlayer(player, input);
      this.inputs.delete(id); // clear input after processing
    });
  }

  private updatePlayer(player: PlayerState, input?: InputState) {
    // horizontal
    if (input?.left) {
      player.vx = -SPEED;
    } else if (input?.right) {
      player.vx = SPEED;
    } else {
      player.vx = 0;
    }

    
    // jump
    if (input?.jump && player.isGrounded) {
        // console.log(input)
        player.vy = -JUMP_FORCE;
        player.isGrounded = false;
    }

    // gravity
    player.vy += GRAVITY * DT;

    // integrate
    player.x += player.vx * DT;
    player.y += player.vy * DT;

    // ground collision
    if (player.y >= GROUND_Y) {
      player.y = GROUND_Y;
      player.vy = 0;
      player.isGrounded = true;
    }
  }
}


// {
//   "left":true,
//   "right": false,
//   "jump": false
// }