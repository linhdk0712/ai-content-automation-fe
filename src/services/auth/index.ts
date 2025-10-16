import { TokenManager } from './token.manager'

export { TokenManager } from './token.manager'
export type { AuthTokens } from './token.manager'

export const {
    getAccessToken,
    getRefreshToken,
    setTokens,
    clearTokens,
    isTokenExpired,
    refreshAccessToken,
    getValidAccessToken,
    hasValidAuth
} = TokenManager