import 'cross-fetch/polyfill';
// @ts-expect-error
import synthetics from 'Synthetics'
// @ts-expect-error
import log from 'SyntheticsLogger'
import { CognitoService } from './cognitoService'

const loginTest = async function (user: string, password: string): Promise<void> {
  const cognito = CognitoService.instance(
    process.env.CLIENT_ID ?? '23si15egh9q0bne4uvsg06nv4',
    process.env.USER_POOL_ID ?? 'us-east-1_haGqWPxAx'
  )
  log.error('loginTest')
  await synthetics.executeStep('Check login', async () => await cognito.login(user, password))
}

const logoutTest = async function (user: string): Promise<void> {
  const cognito = CognitoService.instance(process.env.CLIENT_ID ?? '', process.env.USER_POOL_ID ?? '')
  await synthetics.executeStep('logout', async () => await cognito.logout(user))
}

const loginUiTest = async function (): Promise<void> {
  const user = process.env.USERNAME ?? 'leonardo.lima@example.com'
  const password = process.env.PASSWORD ?? '!Q@W3e4r'

  // Get synthetics configuration
  const syntheticsConfig = synthetics.getConfiguration()

  // Set configuration values
  syntheticsConfig.setConfig({
    screenshotOnStepStart: false,
    screenshotOnStepSuccess: false,
    screenshotOnStepFailure: false,
    includeRequestHeaders: true,
    includeResponseHeaders: true,
    continueOnHttpStepFailure: true,
    includeRequestBody: true,
    includeResponseBody: true,
    logRequestBody: true,
    logRequest: true
  })

  await loginTest(user, password)
  await logoutTest(user)
}

export const handler = async (): Promise<void> => {
  return await loginUiTest()
}
