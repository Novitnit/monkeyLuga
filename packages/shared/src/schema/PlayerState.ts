import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
  @type("number") x = 0;
  @type("number") y = 0;

  @type("number") w = 45;
  @type("number") h = 50;

  @type("number") prevY = 0;
  @type("number") prevX = 0;

  @type("number") vy = 0;
  @type("number") vx = 0;
  @type("boolean") isGrounded = false;

  @type("number") speed = 500;

  @type("string") color = "#ffffff";

  @type("boolean") jumpBlocked = false;

  @type("number") deathCount = 0;
}