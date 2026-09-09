import { useEffect, useState } from 'react'
import Znak from './Znak.jsx'
import { dohvatiSchemu, dohvatiSesiju, GreskaApija } from './api.js'

/**
 * Skeleton — korak 3 redoslijeda gradnje.
 *
 * Zadatak ovog ekrana je jedan: dokazati da shema stiže iz Sheeta cijela i
 * ispravno pročitana. Zato ispisuje sirov popis pitanja, bez ijednog polja za
 * unos. Renderiranje po tipu, uvjetna logika i blokovi dolaze u sljedećim
 * koracima, vizualni identitet na kraju.
 */

/** Verzija sheme koju ovaj kod zna čitati. Mora se poklapati s CONFIG. */
const SCHEMA_VERZIJA = '1'

function tokenIzUrla() {
  return new URLSearchParams(window.location.search).get('t') || ''
}

/** Sekcije idu redom pojavljivanja u Sheetu, pitanja unutar njih po redoslijedu.
 *  Sortiranje sekcija po nazivu bi palo čim ih bude deset ("10" prije "2"). */
function grupirajPoSekcijama(pitanja) {
  const redom = []
  const po = new Map()
  for (const p of pitanja) {
    if (!po.has(p.sekcija)) {
      po.set(p.sekcija, [])
      redom.push(p.sekcija)
    }
    po.get(p.sekcija).push(p)
  }
  return redom.map((naziv) => ({
    naziv,
    pitanja: [...po.get(naziv)].sort((a, b) => a.redoslijed - b.redoslijed),
  }))
}

export default function App() {
  const [token] = useState(tokenIzUrla)
  const [stanje, postaviStanje] = useState('ucitavanje')
  const [schema, postaviSchemu] = useState(null)
  const [sesija, postaviSesiju] = useState(null)
  const [greska, postaviGresku] = useState(null)

  useEffect(() => {
    let otkazano = false

    async function ucitaj() {
      try {
        const s = await dohvatiSchemu()
        if (otkazano) return

        // Pravilo 4: neusklađena verzija znači da Sheet i kod više ne govore
        // isti jezik. Bolje stati nego tiho spremiti krive podatke.
        if (s.schema_verzija && s.schema_verzija !== SCHEMA_VERZIJA) {
          throw new GreskaApija(
            'kriva_schema_verzija',
            `Sheet je na verziji ${s.schema_verzija}, aplikacija očekuje ${SCHEMA_VERZIJA}.`,
          )
        }
        postaviSchemu(s)

        if (token) {
          const sesijaKlijenta = await dohvatiSesiju(token)
          if (otkazano) return
          postaviSesiju(sesijaKlijenta)
        }
        postaviStanje('spremno')
      } catch (err) {
        if (otkazano) return
        postaviGresku(err)
        postaviStanje('greska')
      }
    }

    ucitaj()
    return () => {
      otkazano = true
    }
  }, [token])

  return (
    <main style={omotac}>
      <header style={{ marginBottom: 'var(--razmak-6)' }}>
        <Znak visina={40} />
        <h1 style={{ marginTop: 'var(--razmak-4)' }}>Onboarding</h1>
      </header>

      {stanje === 'ucitavanje' && <p style={prigusen}>Učitavam pitanja…</p>}
      {stanje === 'greska' && <Greska greska={greska} />}
      {stanje === 'spremno' && <Pregled schema={schema} sesija={sesija} token={token} />}
    </main>
  )
}

function Greska({ greska }) {
  const naslovi = {
    nema_api_url: 'Backend nije podešen',
    trazi_prijavu: 'Backend traži prijavu',
    mreza: 'Backend nije dostupan',
    nepoznat_token: 'Link nije prepoznat',
    kriva_schema_verzija: 'Sheet i aplikacija nisu usklađeni',
  }
  return (
    <section style={okvir}>
      <h2 style={{ color: 'var(--crvena)' }}>{naslovi[greska.kod] || 'Nešto nije u redu'}</h2>
      <p>{greska.message}</p>
      <p style={{ ...prigusen, marginBottom: 0 }}>Kod greške: {greska.kod}</p>
    </section>
  )
}

function Pregled({ schema, sesija, token }) {
  const sekcije = grupirajPoSekcijama(schema.pitanja)
  const blok = schema.pitanja.filter((p) => p.blok === 'program')
  const uvjetna = schema.pitanja.filter((p) => p.uvjet_pitanje)
  const obavezna = schema.pitanja.filter((p) => p.obavezno)

  return (
    <>
      {(schema.upozorenja || []).map((u) => (
        <p key={u} style={upozorenje}>
          {u}
        </p>
      ))}

      {!token && (
        <section style={okvir}>
          <h2>Treba ti link iz maila</h2>
          <p>
            Ovoj stranici se pristupa preko osobnog linka koji si dobio nakon uplate.
            Ako ga ne možeš pronaći, javi nam se i poslat ćemo ti ga ponovno.
          </p>
          <p style={{ ...prigusen, marginBottom: 0 }}>
            Ispod je popis pitanja — vidljiv je samo dok je aplikacija u izradi.
          </p>
        </section>
      )}

      {sesija && (
        <section style={okvir}>
          <h2 style={{ marginBottom: 'var(--razmak-2)' }}>{sesija.klijent.ime}</h2>
          <p style={{ ...prigusen, marginBottom: 0 }}>
            {sesija.klijent.brand} · {sesija.odgovori.length} spremljenih odgovora · status{' '}
            {sesija.klijent.status_quiz || '—'}
          </p>
        </section>
      )}

      <p style={prigusen}>
        {schema.pitanja.length} pitanja · {obavezna.length} obaveznih · {blok.length} u
        ponavljajućem bloku · {uvjetna.length} uvjetnih · {sekcije.length} sekcija · schema{' '}
        {schema.schema_verzija || 'nije zadana'}
      </p>

      {sekcije.map((s) => (
        <section key={s.naziv} style={{ marginBottom: 'var(--razmak-6)' }}>
          <h2>{s.naziv}</h2>
          {s.pitanja.map((p) => (
            <Redak key={p.id} pitanje={p} />
          ))}
        </section>
      ))}
    </>
  )
}

function Redak({ pitanje }) {
  return (
    <article style={redak}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <code style={oznaka}>{pitanje.id}</code>
        <code style={oznaka}>{pitanje.tip}</code>
        {pitanje.blok === 'program' && <code style={{ ...oznaka, ...blokOznaka }}>blok</code>}
        {pitanje.uvjet_pitanje && (
          <code style={{ ...oznaka, ...uvjetOznaka }}>
            ako {pitanje.uvjet_pitanje} = {pitanje.uvjet_vrijednost}
          </code>
        )}
        {!pitanje.obavezno && <span style={prigusen}>nije obavezno</span>}
      </div>

      <p style={{ margin: '6px 0 0' }}>{pitanje.pitanje}</p>
      {pitanje.pomoc && (
        <p style={{ ...prigusen, margin: '4px 0 0', fontSize: 14 }}>{pitanje.pomoc}</p>
      )}
      {pitanje.opcije && (
        <p style={{ ...prigusen, margin: '4px 0 0', fontSize: 13, wordBreak: 'break-word' }}>
          <code>{pitanje.opcije}</code>
        </p>
      )}
    </article>
  )
}

/* Privremeni inline stilovi — pravi vizualni identitet dolazi u koraku 8. */

const omotac = {
  maxWidth: 'var(--sirina-sadrzaja)',
  margin: '0 auto',
  padding: '48px 20px 96px',
}

const prigusen = { color: 'var(--tekst-prigusen)' }

const okvir = {
  background: 'var(--ploca)',
  border: '1px solid var(--tinta)',
  borderRadius: 'var(--rub)',
  padding: 'var(--razmak-4)',
  marginBottom: 'var(--razmak-5)',
}

const upozorenje = {
  background: 'var(--ploca)',
  borderLeft: '3px solid var(--marker)',
  padding: '10px 14px',
  marginBottom: 'var(--razmak-3)',
  fontSize: 14,
}

const redak = {
  borderTop: '1px solid var(--linija)',
  padding: '12px 0',
}

const oznaka = {
  fontFamily: 'var(--font-tekst)',
  fontWeight: 500,
  fontSize: 12,
  letterSpacing: '0.04em',
  border: '1px solid var(--linija)',
  borderRadius: 'var(--rub)',
  padding: '1px 6px',
  color: 'var(--tekst-prigusen)',
}

const blokOznaka = { borderColor: 'var(--lila)', color: 'var(--tinta)' }
const uvjetOznaka = { borderColor: 'var(--marker)', color: 'var(--tinta)' }
