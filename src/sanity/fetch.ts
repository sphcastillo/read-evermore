import 'server-only'
import {catalogClient, catalogRevalidate} from './client'

export async function fetchCatalog<T>(query: string, params: Record<string, unknown> = {}) {
  return catalogClient.fetch<T>(query, params, catalogRevalidate)
}
