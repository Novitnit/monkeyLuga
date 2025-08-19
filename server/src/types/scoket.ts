export interface ServerToClientEvents {
  
}

export interface ClientToServerEvents {
  
}

export interface InterServerEvents {

}

export interface SocketData {
  user:{
    uuid:string
    name:string
    role:"USER"|"ADMIN"
  }
}