/**
 * Testovi parsera stupca `opcije`.
 *
 *   node src/opcije.test.mjs
 *
 * Vrijednosti u testovima su doslovno prepisane iz Sheeta ONBOARDING-DB, pa
 * promjena formata u Sheetu ovdje pada prije nego se primijeti na ekranu.
 */

import {
  parsirajIzbor,
  parsirajIzborIzListe,
  parsirajMatricu,
  razmotaj,
  zamotaj,
  jeOdgovoreno,
  uskladiMatricu,
} from './opcije.js'

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

const jednako = (a, b) => JSON.stringify(a) === JSON.stringify(b)

/* -- jedan_izbor / vise_izbora -- */

test('parsirajIzbor', () => {
  // q028, doslovno iz Sheeta
  const q028 = parsirajIzbor('Uživo|Online live|Snimljeno|Hibridno|Grupno|Individualno')
  provjeri('šest opcija', q028.length === 6)
  provjeri('redoslijed je zadržan', q028[0] === 'Uživo' && q028[5] === 'Individualno')

  // q041 — opcije sa zarezom unutar teksta ne smiju se razlomiti
  const q041 = parsirajIzbor('Da, bez problema|Da, ali mi treba priprema|Radije ne')
  provjeri('zarez unutar opcije ne lomi ništa', jednako(q041, ['Da, bez problema', 'Da, ali mi treba priprema', 'Radije ne']))

  provjeri('višak razmaka se čisti', jednako(parsirajIzbor(' A | B '), ['A', 'B']))
  provjeri('prazne se izbacuju', jednako(parsirajIzbor('A||B'), ['A', 'B']))
  provjeri('prazan ulaz daje prazno', jednako(parsirajIzbor(''), []))
})

/* -- izbor_iz_liste -- */

test('parsirajIzborIzListe', () => {
  const q012 = parsirajIzborIzListe('izvor=q008|max=2') // doslovno iz Sheeta
  provjeri('izvor', q012.izvor === 'q008')
  provjeri('max', q012.max === 2)

  // UPUTE tab dokumentira @qNNN, pravi podaci pišu bez @ — mora raditi oboje
  provjeri('prima i @q008', parsirajIzborIzListe('izvor=@q008|max=2').izvor === 'q008')

  provjeri('bez max nema ograničenja', parsirajIzborIzListe('izvor=q008').max === Infinity)
  provjeri('obrnut redoslijed dijelova', parsirajIzborIzListe('max=3|izvor=q008').izvor === 'q008')
  provjeri('neispravan izvor daje grešku', !!parsirajIzborIzListe('max=2').greska)
  provjeri('greška imenuje problem', /izvor/.test(parsirajIzborIzListe('max=2').greska))
})

/* -- matrica -- */

test('parsirajMatricu — retci iz lista pitanja (q009)', () => {
  const m = parsirajMatricu(
    'redci=q008|stupci=Cijena u EUR:tekst;Kome je namijenjen:tekst;Status:izbor(Aktivan,Pauziran,Tek ideja);Uloga u ponudi:izbor(Ulazna točka,Glavni program,Nastavak nakon glavnog,Samostalan)',
  )
  provjeri('nema greške', !m.greska, m.greska)
  provjeri('retci dolaze iz q008', m.redci.tip === 'izPitanja' && m.redci.pitanje === 'q008')
  provjeri('četiri stupca', m.stupci.length === 4)
  provjeri('naziv s razmacima ostaje cijel', m.stupci[0].naziv === 'Cijena u EUR')
  provjeri('tip tekst', m.stupci[0].tip === 'tekst')
  provjeri('tip izbor prepoznat', m.stupci[2].tip === 'izbor')
  provjeri('opcije izbora', jednako(m.stupci[2].opcije, ['Aktivan', 'Pauziran', 'Tek ideja']))
  provjeri('opcija s razmakom u sebi', m.stupci[3].opcije[0] === 'Ulazna točka')
  provjeri('četiri opcije u zadnjem stupcu', m.stupci[3].opcije.length === 4)
})

test('parsirajMatricu — brojčani stupci (q010)', () => {
  const m = parsirajMatricu(
    'redci=q008|stupci=Koliko ga želim razvijati:broj;Kolika je potražnja:broj;Koliko imam autoriteta:broj',
  )
  provjeri('tri stupca', m.stupci.length === 3)
  provjeri('svi su tipa broj', m.stupci.every((s) => s.tip === 'broj'))
})

test('parsirajMatricu — fiksni retci (q032)', () => {
  const m = parsirajMatricu(
    'redci=Aktivni klijenti;Bivši klijenti i prijave;Mailing lista;Instagram pratitelji;WhatsApp ili Telegram grupa|stupci=Približan broj:broj',
  )
  provjeri('retci su fiksni', m.redci.tip === 'fiksno')
  provjeri('pet redaka', m.redci.vrijednosti.length === 5)
  provjeri('prvi redak', m.redci.vrijednosti[0] === 'Aktivni klijenti')
  provjeri('zadnji redak cijel', m.redci.vrijednosti[4] === 'WhatsApp ili Telegram grupa')
  provjeri('jedan stupac tipa broj', m.stupci.length === 1 && m.stupci[0].tip === 'broj')
})

test('parsirajMatricu — neispravan zapis', () => {
  provjeri('bez stupci=', /stupci/.test(parsirajMatricu('redci=q008').greska || ''))
  provjeri('bez redci=', /redci/.test(parsirajMatricu('stupci=A:tekst').greska || ''))
  provjeri('prima i @q008', parsirajMatricu('redci=@q008|stupci=A:tekst').redci.pitanje === 'q008')
})

/* -- vrijednosti -- */

test('razmotaj i zamotaj', () => {
  provjeri('tekst ostaje tekst', razmotaj('tekst', 'nešto') === 'nešto')
  provjeri('prazan tekst', razmotaj('tekst', '') === '')
  provjeri('null postaje prazno', razmotaj('tekst', null) === '')
  provjeri('vise_izbora se raspakira', jednako(razmotaj('vise_izbora', '["A","B"]'), ['A', 'B']))
  provjeri('prazna lista', jednako(razmotaj('lista', ''), []))
  provjeri('pokvaren JSON ne ruši', jednako(razmotaj('lista', 'nije json'), []))
  provjeri('JSON koji nije array', jednako(razmotaj('lista', '{"a":1}'), []))

  provjeri('zamotaj string', zamotaj('abc') === 'abc')
  provjeri('zamotaj array', zamotaj(['A', 'B']) === '["A","B"]')
  provjeri('zamotaj null', zamotaj(null) === '')

  const krug = razmotaj('vise_izbora', zamotaj(['Uživo', 'Grupno']))
  provjeri('krug tam pa natrag', jednako(krug, ['Uživo', 'Grupno']))
})

test('jeOdgovoreno', () => {
  provjeri('prazan tekst nije odgovor', jeOdgovoreno('tekst', '') === false)
  provjeri('sami razmaci nisu odgovor', jeOdgovoreno('tekst', '   ') === false)
  provjeri('tekst jest', jeOdgovoreno('tekst', 'a') === true)
  provjeri('prazan array nije', jeOdgovoreno('vise_izbora', []) === false)
  provjeri('array s vrijednošću jest', jeOdgovoreno('vise_izbora', ['A']) === true)
  provjeri('array praznih nije', jeOdgovoreno('lista', ['', '  ']) === false)

  const praznaMatrica = [{ redak: 'A', Cijena: '' }, { redak: 'B', Cijena: '' }]
  provjeri('prazna matrica nije odgovor', jeOdgovoreno('matrica', praznaMatrica) === false)
  provjeri(
    'matrica s jednom vrijednošću jest',
    jeOdgovoreno('matrica', [{ redak: 'A', Cijena: '397' }]) === true,
  )
  provjeri(
    'sam naziv retka ne broji se kao odgovor',
    jeOdgovoreno('matrica', [{ redak: 'Oslobođena' }]) === false,
  )
})

/* -- usklađivanje matrice -- */

test('uskladiMatricu', () => {
  const stupci = [{ naziv: 'Cijena' }, { naziv: 'Status' }]
  const postojece = [
    { redak: 'Oslobođena', Cijena: '397', Status: 'Aktivan' },
    { redak: 'Budi žena', Cijena: '1997', Status: 'Aktivan' },
  ]

  const isti = uskladiMatricu(postojece, ['Oslobođena', 'Budi žena'], stupci)
  provjeri('nepromijenjena lista ne dira vrijednosti', jednako(isti, postojece))

  const dodan = uskladiMatricu(postojece, ['Oslobođena', 'Novi', 'Budi žena'], stupci)
  provjeri('tri retka', dodan.length === 3)
  provjeri('novi je prazan', dodan[1].redak === 'Novi' && dodan[1].Cijena === '')
  provjeri('stari zadržavaju vrijednosti', dodan[0].Cijena === '397' && dodan[2].Cijena === '1997')

  const obrisan = uskladiMatricu(postojece, ['Budi žena'], stupci)
  provjeri('obrisani ispada', obrisan.length === 1 && obrisan[0].redak === 'Budi žena')
  provjeri('preostali zadržava vrijednost', obrisan[0].Cijena === '1997')

  // Ovo je scenarij zbog kojeg usklađivanje uopće postoji: da se radi po
  // poziciji, brisanje prvog programa pomaknulo bi sve cijene za jedno mjesto.
  const preimenovan = uskladiMatricu(postojece, ['Budi žena', 'Oslobođena'], stupci)
  provjeri(
    'zamjena redoslijeda ne miješa vrijednosti',
    preimenovan[0].Cijena === '1997' && preimenovan[1].Cijena === '397',
  )

  provjeri('bez postojećih daje prazne retke', jednako(uskladiMatricu(null, ['A'], stupci), [{ redak: 'A', Cijena: '', Status: '' }]))
})

console.log('\n' + '-'.repeat(50))
console.log(`prosao: ${prosao}   pao: ${pao}`)
process.exit(pao === 0 ? 0 : 1)
