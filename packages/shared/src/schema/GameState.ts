import { MapSchema, Schema, type } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { InteractBoxState } from "./InteractBoxState";
import { DoorState } from "./DoorState";

export class GameState extends Schema {
  @type({ map: PlayerState })
  players = new MapSchema<PlayerState>();

  @type({ map: InteractBoxState })
  interactBoxes = new MapSchema<InteractBoxState>();

  @type({ map: DoorState })
  doors = new MapSchema<DoorState>();
}