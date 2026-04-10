import { StandardCheckoutClient, Env } from 'pg-sdk-node'
import { env } from './env.js'

export function createPhonePeClient(){
  const sdkEnv = env.phonepeEnv === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX
  return StandardCheckoutClient.getInstance(env.clientId, env.clientSecret, env.clientVersion, sdkEnv)
}

