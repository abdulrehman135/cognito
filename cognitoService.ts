import fetch from 'cross-fetch'
import {
  AuthenticationDetails,
  ClientMetadata,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession
} from 'amazon-cognito-identity-js'
// @ts-expect-error
import log from 'SyntheticsLogger'

interface CognitoToken {
  accessToken: string
  refreshToken: string
  groups: string[]
}

const wait = async (interval: number): Promise<void> => await new Promise(resolve => setTimeout(resolve, interval))

export async function retry<T> (fn: () => Promise<T>, retriesLeft = 3, retryDelay = 200): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    await wait(retryDelay)
    if (retriesLeft === 0) {
      throw error
    }
    return await retry(fn, --retriesLeft, retryDelay)
  }
}

export class CognitoService {
  private readonly cognitoUserPool: CognitoUserPool

  private readonly authRetryCount = 0
  private readonly authRetryDelay = 200

  private static service: CognitoService

  static instance (ClientId: string, UserPoolId: string): CognitoService {
    this.service = this.service !== undefined
      ? this.service
      : new CognitoService({
        ClientId,
        UserPoolId
      })
    return this.service
  }

  private constructor (params: { UserPoolId: string, ClientId: string }) {
    log.error(JSON.stringify(params))
    this.cognitoUserPool = new CognitoUserPool(params)
  }

  async authenticate (userId: string, password: string): Promise<CognitoToken> {
    log.error(JSON.stringify({ userId, password }))
    return await retry(async () => await this._authenticate(userId, password), this.authRetryCount, this.authRetryDelay)
  }

  private async _authenticate (userId: string, password: string): Promise<CognitoToken> {
    const authenticationUser = new CognitoUser({ Username: userId, Pool: this.cognitoUserPool })
    return await new Promise((resolve, reject) => {
      log.error(JSON.stringify({ password }))
      authenticationUser.authenticateUser(new AuthenticationDetails({
        Username: userId,
        Password: password,
        ClientMetadata: {
          Username: userId
        } as ClientMetadata
      }), {
        onSuccess: (session) => {
          log.error(JSON.stringify(session))
          resolve(this.extractTokenInformation(session))
        },
        onFailure: (error) => {
          log.error(JSON.stringify(error))
          reject(error)
        },
        newPasswordRequired: (_userAttributes, requiredAttributes) => {
          log.error(JSON.stringify({ _userAttributes, requiredAttributes }))
          authenticationUser.completeNewPasswordChallenge(password, requiredAttributes, {
            onSuccess: (session) => {
              log.error(JSON.stringify(session))
              resolve(this.extractTokenInformation(session))
            },
            onFailure: (error) => {
              log.error(JSON.stringify(error))
              reject(error)
            }
          })
        }
      })
    })
  }

  private extractTokenInformation (session: CognitoUserSession): CognitoToken {
    const accessToken = session.getAccessToken()
    const refreshToken = session.getRefreshToken().getToken()
    const payload = accessToken.decodePayload()
    const groups = payload['cognito:groups']

    return {
      accessToken: accessToken.getJwtToken(),
      refreshToken,
      groups: groups
    }
  }

  async login (userId: string, password: string): Promise<CognitoToken> {
    return await this.authenticate(userId, password)
  }

  async logout (userId: string): Promise<void> {
    const authenticationUser = new CognitoUser({ Username: userId, Pool: this.cognitoUserPool })
    return await new Promise((resolve, reject) => {
      authenticationUser.signOut(() => {
        resolve()
      })
    })
  }
}
