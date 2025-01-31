export interface IWeb3Login {
  message: 'Login to Gala'
  date: string
}

export interface ISignedWeb3Login extends IWeb3Login {
  signature: string
}

export interface SignedDto {
  signature: string
  prefix: string
  uniqueKey: string
}
