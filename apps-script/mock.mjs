/**
 * Mock Apps Script okruženja.
 *
 * `Code.gs` se izvršava u Googleovom runtimeu i koristi globalne objekte koji
 * lokalno ne postoje. Ovdje su ti objekti presvučeni preko obične 2D matrice,
 * pa se isti, nepromijenjeni `Code.gs` može pokrenuti u Nodeu — u testovima
 * (`test.mjs`) i u lokalnom serveru (`lokalni-server.mjs`).
 *
 * Poanta je da se testira pravi kod, ne njegova kopija.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import vm from 'node:vm'

const ovdje = dirname(fileURLToPath(import.meta.url))

export function napraviSheet(naziv, redci) {
  // grid se drži kao svojstvo objekta, ne u closureu, da ga test može
  // zamijeniti (tabovi.PITANJA.grid = ...) i da to zaista utječe na čitanje.
  const sheet = {
    naziv,
    grid: redci.map((r) => r.slice()),

    _poravnaj() {
      const w = this.grid.reduce((m, r) => Math.max(m, r.length), 0)
      this.grid.forEach((r) => {
        while (r.length < w) r.push('')
      })
    },

    getDataRange() {
      sheet._poravnaj()
      return { getValues: () => sheet.grid.map((r) => r.slice()) }
    },

    getRange(red, stupac) {
      return {
        setValues(vrijednosti) {
          for (let i = 0; i < vrijednosti.length; i++) {
            const ciljni = red - 1 + i
            while (sheet.grid.length <= ciljni) sheet.grid.push([])
            for (let j = 0; j < vrijednosti[i].length; j++) {
              sheet.grid[ciljni][stupac - 1 + j] = vrijednosti[i][j]
            }
          }
          sheet._poravnaj()
        },
        setValue(v) {
          const ciljni = red - 1
          while (sheet.grid.length <= ciljni) sheet.grid.push([])
          sheet.grid[ciljni][stupac - 1] = v
          sheet._poravnaj()
        },
        setNumberFormat() {
          return this
        },
      }
    },
  }
  return sheet
}

export function napraviOkruzenje(tabovi) {
  const kes = new Map()
  return {
    SpreadsheetApp: {
      getActive: () => ({ getSheetByName: (n) => tabovi[n] || null }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (kes.has(k) ? kes.get(k) : null),
        put: (k, v) => kes.set(k, v),
      }),
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (s) => ({
        _tekst: s,
        setMimeType() {
          return this
        },
      }),
    },
    Utilities: {
      formatDate: (d) => {
        const p = (n) => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
      },
    },
    Session: { getScriptTimeZone: () => 'Europe/Zagreb' },
  }
}

export function ucitajBackend(tabovi) {
  const kod = readFileSync(join(ovdje, 'Code.gs'), 'utf8')
  const kontekst = vm.createContext(napraviOkruzenje(tabovi))
  vm.runInContext(kod, kontekst)
  return kontekst
}

export const tijelo = (odgovor) => JSON.parse(odgovor._tekst)

/* ------------------------------------------------------------------ *
 * Podaci za lokalni rad — prava pitanja iz ONBOARDING-DB
 * ------------------------------------------------------------------ */

export const TESTNI_TOKEN = 'tok-primjer'

export function tabovizFixture() {
  const pitanja = JSON.parse(readFileSync(join(ovdje, 'fixture-pitanja.json'), 'utf8'))

  const zaglavljeKlijenti = [
    'klijent_id', 'ime', 'brand', 'email', 'token', 'drive_folder_url',
    'ghl_contact_id', 'datum_starta', 'faza', 'status_quiz', 'napomena',
  ]

  return {
    PITANJA: napraviSheet('PITANJA', pitanja),
    ODGOVORI: napraviSheet('ODGOVORI', [
      ['timestamp', 'klijent_id', 'pitanje_id', 'instanca', 'odgovor'],
    ]),
    KLIJENTI: napraviSheet('KLIJENTI', [
      zaglavljeKlijenti,
      [
        'k000', 'PRIMJER — obriši', 'Primjer brend', 'primjer@brand.hr', TESTNI_TOKEN,
        'https://drive.google.com/drive/folders/primjer', 'ghl_tajni_id', '2026-09-08',
        '1 - Quiz i pristupi', 'U tijeku', 'interna biljeska',
      ],
    ]),
    CONFIG: napraviSheet('CONFIG', [
      ['kljuc', 'vrijednost'],
      ['schema_verzija', '1'],
      ['max_programa_dubinski', '2'],
    ]),
  }
}
