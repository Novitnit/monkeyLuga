import { Schema, type } from "@colyseus/schema";

export class DoorState extends Schema {
  @type("string") id!: string;
  @type("number") x!: number;
  @type("number") y!: number;
  @type("number") w!: number;
  @type("number") h!: number;
  @type("boolean") open: boolean = false;
}
