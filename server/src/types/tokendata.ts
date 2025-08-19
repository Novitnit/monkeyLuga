export interface TokenData {
  name: string,
  sub: string,
  id: string,
  role: "ADMIN" | "USER"
  iat: number,
  exp : number
  jti : string
}
