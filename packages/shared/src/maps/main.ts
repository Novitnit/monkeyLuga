type Platform = {
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
}