import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;

  @type("number") vy = 0;
  @type("number") vx = 0;
  @type("boolean") isGrounded = false;
}