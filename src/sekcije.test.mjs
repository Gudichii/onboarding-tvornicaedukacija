/**
 * Testovi slaganja sekcija — uvjetna vidljivost i ponavljajući blokovi.
 *
 *   node src/sekcije.test.mjs
 *
 * Radi nad pravim pitanjima iz ONBOARDING-DB (apps-script/fixture-pitanja.json),
 * pa provjere odgovaraju stvarnim brojkama iz Sheeta, ne izmišljenima.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { slozeniSekcije, sveStavke, odabraniProgrami, jeVidljivo } from './sekcije.js'
import { kljuc } from './opcije.js'

const ovdje = dirname(fileURLToPath(import.meta.url))

let pao = 0
let prosao = 0

function provjeri(naziv, uvjet, detalj) {
  if (uvjet) {
    prosao++
    console.log('  ok   ' + naziv)
  } else {
    pao++
    console.log('  PAO  ' + naziv + (detalj ? '\n       ' + detalj : ''))
  }
}

function test(naziv, fn) {
  console.log('\n' + naziv)
  fn()
}

/* -- prava pitanja iz Sheeta -- */

const ZAGLAVLJE = [
  'id', 'blok', 'faza', 'sekcija', 'redoslijed', 'pitanje', 'pomoc', 'tip',
  'opcije', 'obavezno', 'uvjet_pitanje', 'uvjet_vrijednost', 'aktivno',
]

const PITANJA = JSON.parse(
  readFileSync(join(ovdje, '..', 'apps-script', 'fixture-pitanja.json'), 'utf8'),
)
  .slice(1)
  .map((red) => {
    const o = Object.fromEntries(ZAGLAVLJE.map((n, i) => [n, red[i]]))
    return { ...o, redoslijed: Number(o.redoslijed), obavezno: o.obavezno === 'DA' }
  })

const DVA_PROGRAMA = { [kljuc('q012', '')]: ['Oslobođena', 'Budi žena novog doba'] }
const JEDAN_PROGRAM = { [kljuc('q012', '')]: ['Oslobođena'] }

/* ------------------------------------------------------------------ */

test('odabraniProgrami', () => {
  provjeri('bez odgovora nema programa', odabraniProgrami(PITANJA, {}).length === 0)
  provjeri('dva odabrana', odabraniProgrami(PITANJA, DVA_PROGRAMA).length === 2)
  provjeri('redoslijed je zadržan', odabraniProgrami(PITANJA, DVA_PROGRAMA)[0] === 'Oslobođena')
  provjeri(
    'max reže višak',
    odabraniProgrami(PITANJA, { [kljuc('q012', '')]: ['A', 'B', 'C'] }, 2).length === 2,
  )
  provjeri(
    'prazni unosi se izbacuju',
    odabraniProgrami(PITANJA, { [kljuc('q012', '')]: ['A', '', '  '] }).length === 1,
  )
  provjeri(
    'prima i JSON string iz Sheeta',
    odabraniProgrami(PITANJA, { [kljuc('q012', '')]: '["A","B"]' }).length === 2,
  )
})

test('uvjetna pitanja (q054–q059 vise o q007)', () => {
  const q054 = PITANJA.find((p) => p.id === 'q054')
  provjeri('bez odgovora je skriveno', jeVidljivo(q054, {}) === false)
  provjeri('na NE je skriveno', jeVidljivo(q054, { [kljuc('q007', '')]: 'NE' }) === false)
  provjeri('na DA je vidljivo', jeVidljivo(q054, { [kljuc('q007', '')]: 'DA' }) === true)
  provjeri('mala slova prolaze', jeVidljivo(q054, { [kljuc('q007', '')]: 'da' }) === true)
  provjeri('bezuvjetno je uvijek vidljivo', jeVidljivo(PITANJA.find((p) => p.id === 'q001'), {}) === true)
})

test('prihvaćanje: jedini vlasnik ne vidi sekciju osobne vizije', () => {
  const sNe = slozeniSekcije(PITANJA, { ...DVA_PROGRAMA, [kljuc('q007', '')]: 'NE' })
  const sDa = slozeniSekcije(PITANJA, { ...DVA_PROGRAMA, [kljuc('q007', '')]: 'DA' })

  const imaViziju = (s) => s.some((x) => x.naziv.includes('Osobna vizija'))
  provjeri('na NE sekcije nema', imaViziju(sNe) === false)
  provjeri('na DA sekcija je tu', imaViziju(sDa) === true)
  provjeri('razlika je točno 6 pitanja', sveStavke(sDa).length - sveStavke(sNe).length === 6)
})

test('prihvaćanje: jedan program -> 12 blok pitanja, dva -> 24', () => {
  const jedan = slozeniSekcije(PITANJA, JEDAN_PROGRAM)
  const dva = slozeniSekcije(PITANJA, DVA_PROGRAMA)

  const blokStavke = (s) => sveStavke(s).filter((x) => x.pitanje.blok === 'program')
  provjeri('jedan program -> 12', blokStavke(jedan).length === 12, 'dobio: ' + blokStavke(jedan).length)
  provjeri('dva programa -> 24', blokStavke(dva).length === 24, 'dobio: ' + blokStavke(dva).length)
  provjeri('razlika je točno 12', blokStavke(dva).length - blokStavke(jedan).length === 12)
})

test('blok sekcije nose naziv programa i instancu', () => {
  const s = slozeniSekcije(PITANJA, DVA_PROGRAMA)
  const blokovi = s.filter((x) => x.instanca)

  provjeri('dvije blok sekcije', blokovi.length === 2)
  provjeri('prva nosi naziv programa', blokovi[0].naziv === 'Program: Oslobođena')
  provjeri('druga nosi drugi naziv', blokovi[1].naziv === 'Program: Budi žena novog doba')
  provjeri('instance su 1 i 2', blokovi[0].instanca === '1' && blokovi[1].instanca === '2')
  provjeri('generički naslov se ne pojavljuje', !s.some((x) => x.naziv.includes('Dubinski po programu')))

  provjeri('sve stavke prve sekcije nose instancu 1', blokovi[0].stavke.every((x) => x.instanca === '1'))
  provjeri('sve stavke druge nose instancu 2', blokovi[1].stavke.every((x) => x.instanca === '2'))
  provjeri('obje sadrže istih 12 pitanja', blokovi[0].stavke.length === 12 && blokovi[1].stavke.length === 12)

  // Tekst pitanja se ne dira — gdje piše „ovaj program", tako ostaje.
  const prvo1 = blokovi[0].stavke[0].pitanje
  const prvo2 = blokovi[1].stavke[0].pitanje
  provjeri('tekst pitanja je isti u obje instance', prvo1.pitanje === prvo2.pitanje)
  provjeri('ključevi odgovora se razlikuju', kljuc(prvo1.id, '1') !== kljuc(prvo2.id, '2'))
})

test('blok bez odabranih programa', () => {
  const s = slozeniSekcije(PITANJA, {})
  const blok = s.find((x) => x.cekaProgram)
  provjeri('sekcija ostaje vidljiva', !!blok)
  provjeri('ali je prazna', blok.stavke.length === 0)
  provjeri('nijedno blok pitanje se ne broji', sveStavke(s).every((x) => x.pitanje.blok !== 'program'))
})

test('redoslijed sekcija', () => {
  const s = slozeniSekcije(PITANJA, { ...DVA_PROGRAMA, [kljuc('q007', '')]: 'DA' })
  const nazivi = s.map((x) => x.naziv)

  provjeri('prva je sekcija 0', nazivi[0] === '0 · Osnovni podaci')
  provjeri('zadnja je sekcija 9', nazivi[nazivi.length - 1] === '9 · Dokazi i materijali')
  provjeri('ukupno 11 sekcija (10 + jedan program viška)', s.length === 11, 'dobio: ' + s.length)

  // Programi moraju stajati na mjestu sekcije 7, između 6 i 8
  const i6 = nazivi.findIndex((n) => n.startsWith('6 ·'))
  const i8 = nazivi.findIndex((n) => n.startsWith('8 ·'))
  const iP = nazivi.findIndex((n) => n.startsWith('Program:'))
  provjeri('programi su između sekcije 6 i 8', i6 < iP && iP < i8, nazivi.join(' | '))
  provjeri('dva programa su jedan za drugim', nazivi[iP + 1].startsWith('Program:'))
})

test('sekcije imaju stabilan ključ', () => {
  const s = slozeniSekcije(PITANJA, DVA_PROGRAMA)
  const kljucevi = s.map((x) => x.kljuc)
  provjeri('svi ključevi su jedinstveni', new Set(kljucevi).size === kljucevi.length)

  // Preimenovanje programa ne smije srušiti React listu — ključ ostaje isti
  const drugi = slozeniSekcije(PITANJA, { [kljuc('q012', '')]: ['Drugo ime', 'I drugo'] })
  provjeri('ključ ne ovisi o nazivu programa', drugi.map((x) => x.kljuc).join() === kljucevi.join())
})

test('pitanja unutar sekcije idu po redoslijedu', () => {
  const s = slozeniSekcije(PITANJA, DVA_PROGRAMA)
  for (const sekcija of s) {
    const r = sekcija.stavke.map((x) => x.pitanje.redoslijed)
    const sortirano = [...r].sort((a, b) => a - b)
    if (r.join() !== sortirano.join()) {
      provjeri(`sekcija "${sekcija.naziv}" je posložena`, false, r.join(','))
      return
    }
  }
  provjeri('sve sekcije su posložene po redoslijedu', true)
})

test('ukupan broj stavki', () => {
  const bezProgramaBezVizije = slozeniSekcije(PITANJA, {})
  // 62 ukupno - 12 blok - 6 uvjetnih = 44
  provjeri('prazan upitnik ima 44 vidljiva pitanja', sveStavke(bezProgramaBezVizije).length === 44,
    'dobio: ' + sveStavke(bezProgramaBezVizije).length)

  const sve = slozeniSekcije(PITANJA, { ...DVA_PROGRAMA, [kljuc('q007', '')]: 'DA' })
  // 44 + 6 vizija + 24 blok = 74
  provjeri('s dva programa i suvlasnikom ima 74', sveStavke(sve).length === 74,
    'dobio: ' + sveStavke(sve).length)
})

console.log('\n' + '-'.repeat(50))
console.log(`prosao: ${prosao}   pao: ${pao}`)
process.exit(pao === 0 ? 0 : 1)
