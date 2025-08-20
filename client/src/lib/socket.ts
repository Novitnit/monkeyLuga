// web-app/lib/socket.ts
import { ServerToClientEvents , ClientToServerEvents} from "@/types/socket";
import { io, Socket } from "socket.io-client";

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export function getSocket(token?: string) {
  if(!token && !socket) throw new Error("No token provided");
  socket ||= io(process.env.NEXT_PUBLIC_SOCKET_URL as string, {
    auth: { token },
    transports: ["websocket"],
  });
  try{
    if(!socket.connected){
      socket.connect();

      socket.on("connect_error", (err) => {
        throw new Error("Socket connection error: " + err);
      })
    }
    return socket;
  }catch(e){
    throw new Error("Failed to connect to socket server: " + e);
  }
}

export function haveSocket() {
  if(!socket){
    return false;
  }
  return true;
}
