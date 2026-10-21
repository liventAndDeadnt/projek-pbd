export type Role = {
  idrole: number
  nama_role: string
}

export type User = {
  iduser: number
  username: string
  idrole: number
  role: string
}
