export const USER_CODE_STORAGE_KEY = 'ppl-tracker-user'

export function isValidUserCode(code: unknown): code is string {
  return typeof code === 'string' && /^[a-zA-Z0-9_-]{3,50}$/.test(code)
}
