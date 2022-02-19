import axios from 'axios'
import { SRPClient, calculateSignature, getNowString } from 'amazon-user-pool-srp-client'
 
function call (action, body) {
  const request = {
    url: 'https://cognito-idp.us-east-1.amazonaws.com',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': action
    },
    data: JSON.stringify(body),
    transformResponse: (data) => data
  }
 
  return axios(request)
  .then((result) => JSON.parse(result.data))
  .catch((error) => {
    const _err = JSON.parse(error.response.data)
    const err = new Error()
    err.code = _err.__type
    err.message = _err.message
    return Promise.reject(err)
  })
}
 
export function login (email, password) {
  const userPoolId = 'us-east-1_haGqWPxAx'
  const srp = new SRPClient(userPoolId)
  const SRP_A = srp.calculateA()
  return call('AWSCognitoIdentityProviderService.InitiateAuth', {
    ClientId: '23si15egh9q0bne4uvsg06nv4',
    AuthFlow: 'USER_SRP_AUTH',
    AuthParameters: {
      USERNAME: email,
      SRP_A
    }
  })
  .then(({ ChallengeName, ChallengeParameters, Session }) => {
    console.log({ ChallengeName, ChallengeParameters, Session })
    const hkdf = srp.getPasswordAuthenticationKey(ChallengeParameters.USER_ID_FOR_SRP, password, ChallengeParameters.SRP_B, ChallengeParameters.SALT)
    const dateNow = getNowString()
    const signatureString = calculateSignature(hkdf, userPoolId, ChallengeParameters.USER_ID_FOR_SRP, ChallengeParameters.SECRET_BLOCK, dateNow)
    console.log({signatureString})
    return call('AWSCognitoIdentityProviderService.RespondToAuthChallenge', {
      ClientId: '23si15egh9q0bne4uvsg06nv4',
      ChallengeName,
      ChallengeResponses: {
        PASSWORD_CLAIM_SIGNATURE: signatureString,
        PASSWORD_CLAIM_SECRET_BLOCK: ChallengeParameters.SECRET_BLOCK,
        TIMESTAMP: dateNow,
        USERNAME: ChallengeParameters.USER_ID_FOR_SRP
      },
      Session
    })
    .then(({ AuthenticationResult }) => ({ username: ChallengeParameters.USERNAME, credentials: AuthenticationResult }))
  })
}
 
/* Additional calls as part of standalone user pool client */
 
export function refreshCredentials (refreshToken) {
  return call('AWSCognitoIdentityProviderService.InitiateAuth', {
    ClientId: process.env.CognitoUserPoolClientWeb,
    AuthFlow: 'REFRESH_TOKEN_AUTH',
    AuthParameters: {
      REFRESH_TOKEN: refreshToken
    }
  })
  .then(({ AuthenticationResult }) => ({ ...AuthenticationResult, RefreshToken: AuthenticationResult.RefreshToken || refreshToken }))
}
 
export function signup (Username, Password, AttributeList) {
  return call('AWSCognitoIdentityProviderService.SignUp', {
    ClientId: process.env.CognitoUserPoolClientWeb,
    Username,
    Password,
    UserAttributes: Object.keys(AttributeList).map((key) => ({ Name: key, Value: AttributeList[key] }))
  })
}
 
export function resendConfirmationCode (Username) {
  return call('AWSCognitoIdentityProviderService.ResendConfirmationCode', {
    ClientId: process.env.CognitoUserPoolClientWeb,
    Username
  })
}
 
export function signupConfirm (Username, ConfirmationCode, ForceAliasCreation) {
  return call('AWSCognitoIdentityProviderService.ConfirmSignUp', {
    ClientId: process.env.CognitoUserPoolClientWeb,
    Username,
    ConfirmationCode,
    ForceAliasCreation
  })
}

login('leonardo.lima@example.com', '!Q@W3e4r')
