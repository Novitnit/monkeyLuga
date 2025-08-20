import { Socket } from "socket.io";
import { ClientToServerEvents , InterServerEvents, ServerToClientEvents, SocketData} from "../types/scoket";
import log from '../log';
import { randomRoomId } from "./Roomstyle";

export function createRoom(socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) {
    socket.on("createRoom", (data) => {
        log.info(socket.data.user.name, `Creating room with difficulty: ${data.difficulty}`);
        const roomId = randomRoomId();
        socket.emit('createRoomSuccess', { roomId });
    });
}