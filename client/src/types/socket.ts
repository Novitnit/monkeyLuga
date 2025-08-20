export interface ServerToClientEvents {
  createRoomSuccess: (data: { roomId: string }) => void;
}

export interface ClientToServerEvents {
  createRoom: (data: { difficulty: "M1" | "M2" | "M3" }) => void;
}