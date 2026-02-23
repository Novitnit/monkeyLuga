import { MapSchema, Schema, type } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";
import { DoorState } from "./DoorState";
import { CheckpointState } from "./CheckpointState";
import { InteractBoxState } from "./InteractBoxState";

export class GameState extends Schema {
  @type({ map: PlayerState })
  players = new MapSchema<PlayerState>();

  @type({ map: DoorState })
  doors = new MapSchema<DoorState>();

  @type({ map: CheckpointState })
  checkpoints = new MapSchema<CheckpointState>();

  @type({ map: InteractBoxState })
  interactBoxes = new MapSchema<InteractBoxState>();
}