import assert from 'node:assert/strict'
import {test} from 'node:test'
import {parseJennaPicks} from '../scripts/lib/jenna-source'

function product(title: string, href = '', extra = '') {
  return `<div data-testid="article-product-unit"><h2 data-testid="product-title"><a href="${href}">${title}</a></h2>${extra}<div>${title}$27.00AmazonNow 10% off</div></div>`
}

test('corrects the known TODAY author typo for All Adults Here only', () => {
  const picks = parseJennaPicks(`<h2>May 2020</h2>${product('"All Adults Here" by Emma Staub')}`)
  assert.deepEqual(picks[0].authors, ['Emma Straub'])
})

test('ignores commerce wrappers, deduplicates products, and preserves multiple picks per month', () => {
  const html = `<h2>March2024</h2>${product('“First” by A Writer')}${product('“Second” by B Writer')}${product('“First” by A Writer')}<h2>March 2019</h2>${product('“The Last Romantics: a Novel,” by Tara Conklin')}`
  const picks = parseJennaPicks(html)
  assert.equal(picks.length, 3)
  assert.equal(picks[0].title, 'The Last Romantics')
  assert.deepEqual(picks[0].authors, ['Tara Conklin'])
  assert.equal(picks.filter((pick) => pick.selectionDate === 'March 2024').length, 2)
  assert.deepEqual(picks.map((pick) => pick.selectionNumber), [1, 2, 3])
})

test('recovers ISBNs from title-only product headings and affiliate destinations', () => {
  const destination = encodeURIComponent('https://bookshop.org/books/the-many-daughters-of-afong-moy-9781432897604/9781982158217')
  const picks = parseJennaPicks(`<h2>August 2022</h2>${product('“The Many Daughters of Afong Moy”', `https://ncls1.com/irk?d=${destination}`)}`)
  assert.equal(picks[0].isbn, '9781982158217')
  assert.deepEqual(picks[0].authors, [])
})

test('reads author from image alt or explicit title-author retailer slug', () => {
  const picks = parseJennaPicks(`<h2>December 2022</h2>${product('The Secret History', 'https://bookshop.org/p/books/the-secret-history-donna-tartt/7827917')}<h2>November 2022</h2>${product('“The Cloisters”', '', '<img alt="&amp;quot;The Cloisters&amp;quot; by Katy Hays">')}`)
  assert.deepEqual(picks[0].authors, ['Katy Hays'])
  assert.deepEqual(picks[1].authors, ['donna tartt'])
})
