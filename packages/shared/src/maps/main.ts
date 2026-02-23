export type Platform = {
  x: number;
  y: number;
  w: number;
  h: number;
};

export type MovingPlatform = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  moveDistance: number; // Distance to move on X axis
  moveSpeed: number; // Speed of movement (pixels per second)
  startPhase?: number; // Starting offset in pixels (0 to moveDistance, e.g., 400 = start 50% of the way right if moveDistance is 800)
};

type PushBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type playerSpawn = {
  x: number;
  y: number;
}

export type mapData = {
    platforms: Platform[];
    playerSpawns: playerSpawn;
    pushBoxes?: PushBox[];
    movingPlatforms?: MovingPlatform[];
  doors?: Door[];
  highJumpZones?: HighJumpZone[];
  killZones?: KillZone[];
  teleportZones?: TeleportZone[];
  tbcZones?: ToBeContinuedZone[];
  checkpoints?: Checkpoint[];
}

type Door = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Checkpoint = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type HighJumpZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  // คูณแรงกระโดดเมื่ออยู่ในโซนนี้ (เช่น 1.5 = กระโดดสูงขึ้น 50%)
  multiplier?: number;
};

type KillZone = {
  id?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // Animation properties (optional)
  moveDistance?: number; // How far to move on X axis
  moveSpeed?: number; // Speed of movement (pixels per second)
};

export type TeleportZone = {
  x: number;
  y: number;
  w: number;
  h: number;
  targetX: number;
  targetY: number;
};

export type ToBeContinuedZone = {
  x: number;
  y: number;
  w: number;
  h: number;
};