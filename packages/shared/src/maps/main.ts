export type Platform = {
  x: number;
  y: number;
  w: number;
  h: number;
};

type PushBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type InteractBox = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  // เมื่อผู้เล่นตอบคำถามถูก ให้เปิดประตูนี้
  opensDoorId?: string;
};

type playerSpawn = {
  x: number;
  y: number;
}

export type mapData = {
    platforms: Platform[];
    playerSpawns: playerSpawn;
    pushBoxes?: PushBox[];
    interactBoxes?: InteractBox[];
  doors?: Door[];
  highJumpZones?: HighJumpZone[];
  killZones?: KillZone[];
  teleportZones?: TeleportZone[];
  tbcZones?: ToBeContinuedZone[];
}

type Door = {
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
  x: number;
  y: number;
  w: number;
  h: number;
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