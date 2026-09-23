import assert from 'node:assert/strict'
import {test} from 'node:test'
import {canonicalJennaTitle, searchJennaBooks} from '../scripts/lib/jenna-matching'

test('normalizes known marketing suffixes without merging distinct titles', () => {
  for (const title of ['Dear Edward', 'Dear Edward: A Read with Jenna Pick', 'Dear Edward (A Read with Jenna Book Club Pick)']) {
    assert.equal(canonicalJennaTitle(title), 'dear edward')
  }
  assert.notEqual(canonicalJennaTitle('The Family'), canonicalJennaTitle('The Family Upstairs'))
})

test('tries broader search when ISBN or strict query misses, without accepting low-confidence results', async () => {
  const queries: string[] = []
  const fetcher = (async (url: string) => {
    queries.push(new URL(url).searchParams.get('q')!)
    return Response.json({items: queries.length === 1 ? [] : queries.length === 2
      ? [{id: 'wrong', volumeInfo: {title: 'Different book'}}]
      : [{id: 'right', volumeInfo: {title: 'All Adults Here', authors: ['Emma Straub']}}]})
  }) as typeof fetch
  const result = await searchJennaBooks({selectionNumber: 15, title: 'All Adults Here', authors: ['Emma Straub'], isbn: '1234567890'}, (book) => book.id === 'right' ? 100 : 0, {fetcher})
  assert.equal(queries.length, 3)
  assert.ok(result.some((book) => book.id === 'right'))
  assert.equal(queries[2], 'All Adults Here Emma Straub')
})
