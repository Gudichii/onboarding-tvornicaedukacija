/**
 * Slaganje pitanja u sekcije — uvjetna vidljivost i ponavljajući blokovi.
 *
 * Ovo je najzamršeniji dio aplikacije, pa stoji odvojeno od prikaza i pokriven
 * je testovima (src/sekcije.test.mjs). Ulaz su pitanja iz Sheeta i dani
 * odgovori, izlaz je popis sekcija spreman za iscrtavanje.
 */

import { kljuc, razmotaj } from './opcije.js'

export const ZADANI_MAX_PROGRAMA = 2

/**
 * Pitanje s ispunjenim `uvjet_pitanje` vidi se samo ako je na to pitanje dan
 * navedeni odgovor. Skriveno pitanje ne postoji za korisnika: ne prikazuje se,
 * ne broji se u napredak i nikad nije obavezno, bez obzira što piše u stupcu
 * `obavezno`.
 */
export function jeVidljivo(pitanje, odgovori) {
  if (!pitanje.uvjet_pitanje) return true
  const dano = odgovori[kljuc(pitanje.uvjet_pitanje, '')]
  const kaoTekst = Array.isArray(dano) ? dano.join('|') : String(dano ?? '')
  return kaoTekst.trim().toUpperCase() === String(pitanje.uvjet_vrijednost).trim().toUpperCase()
}

/**
 * Programi za koje se blok ponavlja. Dolaze iz `izbor_iz_liste` pitanja — u
 * shemi ga ima točno jedan (q012), ali traži se po tipu, ne po id-u, da
 * preimenovanje u Sheetu ne slomi blokove.
 */
export function odabraniProgrami(pitanja, odgovori, max = ZADANI_MAX_PROGRAMA) {
  const izvor = pitanja.find((p) => p.tip === 'izbor_iz_liste')
  if (!izvor) return []

  const sirovo = odgovori[kljuc(izvor.id, '')]
  const popis = Array.isArray(sirovo) ? sirovo : razmotaj('izbor_iz_liste', sirovo)

  return popis
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, max)
}

/**
 * Sekcije idu redom pojavljivanja u Sheetu, pitanja unutar njih po
 * `redoslijed`. Sortiranje sekcija po nazivu bi palo čim ih bude deset, jer bi
 * "10 · …" došlo prije "2 · …".
 *
 * Pitanja s `blok = program` nisu obična pitanja nego predložak: njihova se
 * sekcija zamjenjuje s jednom sekcijom po odabranom programu, a svaka nosi
 * svoju instancu ("1", "2"). Naslov sekcije nosi stvarni naziv programa, jer
 * "7 · Dubinski po programu" dvaput zaredom ne govori klijentu na kojem je.
 *
 * Tekst samog pitanja se ne dira — gdje piše „ovaj program", tako i ostaje.
 */
export function slozeniSekcije(pitanja, odgovori, max = ZADANI_MAX_PROGRAMA) {
  const vidljiva = pitanja.filter((p) => jeVidljivo(p, odgovori))
  const programi = odabraniProgrami(pitanja, odgovori, max)

  const redom = []
  const po = new Map()
  for (const p of vidljiva) {
    if (!po.has(p.sekcija)) {
      po.set(p.sekcija, [])
      redom.push(p.sekcija)
    }
    po.get(p.sekcija).push(p)
  }

  const sekcije = []
  for (const naziv of redom) {
    const grupa = [...po.get(naziv)].sort((a, b) => a.redoslijed - b.redoslijed)
    const jeBlok = grupa.some((p) => p.blok === 'program')

    if (!jeBlok) {
      sekcije.push({
        naziv,
        kljuc: naziv,
        stavke: grupa.map((pitanje) => ({ pitanje, instanca: '' })),
      })
      continue
    }

    // Blok bez odabranih programa: sekcija ostaje vidljiva, ali prazna i s
    // objašnjenjem. Da je preskočimo, klijent ne bi znao da ga još nešto čeka.
    if (!programi.length) {
      sekcije.push({
        naziv,
        kljuc: naziv,
        stavke: [],
        cekaProgram: true,
      })
      continue
    }

    programi.forEach((program, i) => {
      sekcije.push({
        naziv: `Program: ${program}`,
        kljuc: `${naziv}#${i + 1}`,
        program,
        instanca: String(i + 1),
        stavke: grupa.map((pitanje) => ({ pitanje, instanca: String(i + 1) })),
      })
    })
  }

  return sekcije
}

/** Sve stavke svih sekcija — osnova za napredak i za provjeru obaveznih. */
export function sveStavke(sekcije) {
  return sekcije.flatMap((s) => s.stavke)
}
