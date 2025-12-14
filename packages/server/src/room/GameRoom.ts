// server/src/rooms/GameRoom.ts
import { Room, Client } from "colyseus";
import { GameState, PlayerState } from "@isgame/shared/schema";

export class GameRoom extends Room<GameState> {

  onCreate() {
    this.state = new GameState();
    console.log("GameRoom created!"+ this.roomId);
  }

  onJoin(client: Client) {

    console.log(`${client.sessionId} joined! room id: ${this.roomId}`);

    const player = new PlayerState();

    this.state.players.set(client.sessionId, player);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
    console.log(`${client.sessionId} left! room id: ${this.roomId}`);
  }
}
