export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '3h0o1unw'
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
export const apiVersion = '2026-02-01'

export function assertServerToken(name: 'SANITY_API_READ_TOKEN' | 'SANITY_API_WRITE_TOKEN') {
  const token = process.env[name]
  if (!token) {
    throw new Error(`${name} is not configured. Reader and catalog requests stay on the server.`)
  }
  return token
}
