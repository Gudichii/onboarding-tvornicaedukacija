/**
 * Lokalni backend za razvoj.
 *
 *   npm run dev:api
 *
 * Pokreće pravi `Code.gs` nad kopijom pravih pitanja iz Sheeta, ali u memoriji.
 * Frontend ga koristi umjesto Apps Scripta dok se radi na sučelju: nema deploya,
 * nema Google prijave, a odgovori se ne pišu u pravi Sheet.
 *
 * Podaci žive samo dok server radi — restart vraća prazan tab ODGOVORI, što je
 * korisno za ponovno testiranje istog scenarija.
 *
 * Prije puštanja u produkciju frontend se uvijek provjeri i protiv pravog
 * `/exec` URL-a. Ovaj server ne može uhvatiti probleme koji postoje samo kod
 * Googlea: CORS, prava pristupa, kvote i sporost.
 */

import { createServer } from 'node:http'
import { ucitajBackend, tabovizFixture, TESTNI_TOKEN } from './mock.mjs'

const PORT = Number(process.env.PORT || 8787)

const tabovi = tabovizFixture()
const api = ucitajBackend(tabovi)

function posalji(res, status, tijeloOdgovora) {
  res.writeHead(status, {
    'Content-Type': 'application/json;charset=utf-8',
    // Apps Script vraća isto — bez ovoga frontend s druge adrese ne prolazi.
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
  })
  res.end(tijeloOdgovora)
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)
  const parametri = Object.fromEntries(url.searchParams)

  if (req.method === 'GET') {
    const odgovor = api.doGet({ parameter: parametri })
    posalji(res, 200, odgovor._tekst)
    return
  }

  if (req.method === 'POST') {
    let tijeloZahtjeva = ''
    req.on('data', (dio) => {
      tijeloZahtjeva += dio
    })
    req.on('end', () => {
      const odgovor = api.doPost({ postData: { contents: tijeloZahtjeva } })
      posalji(res, 200, odgovor._tekst)
    })
    return
  }

  posalji(res, 405, JSON.stringify({ greska: 'metoda', poruka: 'Podržano: GET, POST.' }))
})

server.listen(PORT, () => {
  console.log(`Lokalni backend radi na http://localhost:${PORT}`)
  console.log('')
  console.log('U .env stavi:')
  console.log(`  VITE_API_URL=http://localhost:${PORT}`)
  console.log('')
  console.log('Testni klijent:')
  console.log(`  http://localhost:5173/?t=${TESTNI_TOKEN}`)
})
