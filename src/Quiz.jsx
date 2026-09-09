import { useEffect, useMemo, useState } from 'react'
import Znak from './Znak.jsx'

/**
 * Quiz — jedna sekcija po ekranu.
 *
 * Ne jedno pitanje po ekranu (predugo za 62 pitanja) i ne svih 62 na jednoj
 * stranici (klijent vidi zid teksta i odustane).
 *
 * Polja za unos dolaze u sljedećem koraku; zasad se pitanja prikazuju kao
 * kartice, pa se ljuska — navigacija, progress i redoslijed — može provjeriti
 * odvojeno od renderiranja po tipu.
 */
export default function Quiz({ schema, sesija, naUvod }) {
  const sekcije = useMemo(() => grupirajPoSekcijama(schema.pitanja), [schema])
  const [indeks, postaviIndeks] = useState(0)

  const trenutna = sekcije[indeks]
  const prije = sekcije.slice(0, indeks).reduce((z, s) => z + s.pitanja.length, 0)
  const ukupno = schema.pitanja.length
  const postotak = Math.round((prije / ukupno) * 100)

  // Nova sekcija uvijek počinje s vrha — inače korisnik sleti na sredinu popisa.
  // scrollIntoView ovdje ne valja: sidro završi točno ispod sticky trake, pa
  // navigacija sekcija ostane skrivena iza nje. Zato skroz na vrh stranice.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [indeks])

  function idi(noviIndeks) {
    postaviIndeks(Math.min(Math.max(noviIndeks, 0), sekcije.length - 1))
  }

  return (
    <>
      <div style={traka}>
        <div style={trakaSadrzaj}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={naUvod} style={znakGumb} title="Natrag na uvod">
              <Znak visina={22} tamna />
            </button>
            <span style={trakaNaslov}>{trenutna.naziv}</span>
          </div>
          <span style={trakaBrojka}>{postotak}%</span>
        </div>
        <div style={sipka}>
          <div style={{ ...sipkaIspuna, width: `${postotak}%` }} />
        </div>
      </div>

      <main style={omotac}>
        <nav style={navSekcija} aria-label="Sekcije">
          {sekcije.map((s, i) => (
            <button
              key={s.naziv}
              onClick={() => idi(i)}
              style={{
                ...tocka,
                ...(i === indeks ? tockaAktivna : {}),
                ...(i < indeks ? tockaProsla : {}),
              }}
              title={s.naziv}
            >
              {i + 1}
            </button>
          ))}
        </nav>

        <h1 style={{ marginTop: 'var(--razmak-5)' }}>{trenutna.naziv}</h1>
        <p style={sitno}>
          {trenutna.pitanja.length} pitanja u ovoj sekciji · sekcija {indeks + 1} od{' '}
          {sekcije.length}
        </p>

        <div style={{ marginTop: 'var(--razmak-5)' }}>
          {trenutna.pitanja.map((p) => (
            <Pitanje key={p.id} pitanje={p} />
          ))}
        </div>

        <div style={podnozje}>
          <button
            className="cta"
            onClick={() => idi(indeks - 1)}
            disabled={indeks === 0}
            style={sporedniGumb}
          >
            Natrag
          </button>
          {indeks < sekcije.length - 1 ? (
            <button className="cta" onClick={() => idi(indeks + 1)}>
              Sljedeća sekcija
            </button>
          ) : (
            <span style={sitno}>Zadnja sekcija.</span>
          )}
        </div>
      </main>
    </>
  )
}

/** Sekcije idu redom pojavljivanja u Sheetu, pitanja unutar njih po redoslijedu.
 *  Sortiranje sekcija po nazivu bi palo čim ih bude deset ("10" prije "2"). */
export function grupirajPoSekcijama(pitanja) {
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

function Pitanje({ pitanje }) {
  return (
    <article style={kartica}>
      <p style={tekstPitanja}>{pitanje.pitanje}</p>
      {pitanje.pomoc && <p style={pomoc}>{pitanje.pomoc}</p>}

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        <span style={oznaka}>{pitanje.tip}</span>
        {!pitanje.obavezno && <span style={oznaka}>nije obavezno</span>}
        {pitanje.blok === 'program' && (
          <span style={{ ...oznaka, borderColor: 'var(--lila)' }}>po programu</span>
        )}
        {pitanje.uvjet_pitanje && (
          <span style={{ ...oznaka, borderColor: 'var(--marker)' }}>
            samo ako {pitanje.uvjet_pitanje} = {pitanje.uvjet_vrijednost}
          </span>
        )}
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */

const traka = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  background: 'var(--tinta)',
  color: 'var(--papir)',
}

const trakaSadrzaj = {
  maxWidth: 'var(--sirina-sadrzaja)',
  margin: '0 auto',
  padding: '10px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
}

const trakaNaslov = {
  fontFamily: 'var(--font-tekst)',
  fontWeight: 500,
  fontSize: 14,
  letterSpacing: '0.02em',
}

const trakaBrojka = {
  fontFamily: 'var(--font-naslov)',
  fontWeight: 700,
  fontSize: 16,
  color: 'var(--papir)',
}

const znakGumb = {
  background: 'none',
  border: 'none',
  padding: 0,
  cursor: 'pointer',
  display: 'flex',
}

const sipka = { height: 3, background: '#3A3540' }
const sipkaIspuna = { height: '100%', background: 'var(--rust)', transition: 'width 200ms ease' }

const omotac = {
  maxWidth: 'var(--sirina-sadrzaja)',
  margin: '0 auto',
  padding: '28px 20px 110px',
}

const navSekcija = { display: 'flex', gap: 6, flexWrap: 'wrap' }

const tocka = {
  width: 26,
  height: 26,
  borderRadius: 'var(--rub)',
  border: '1px solid var(--linija)',
  background: 'transparent',
  color: 'var(--tekst-najtisi)',
  fontFamily: 'var(--font-tekst)',
  fontSize: 12,
  cursor: 'pointer',
}

const tockaAktivna = { borderColor: 'var(--tinta)', color: 'var(--tinta)', fontWeight: 600 }
const tockaProsla = { borderColor: 'var(--tinta)', color: 'var(--tinta)' }

const kartica = {
  background: 'var(--ploca)',
  border: '1px solid var(--linija)',
  borderLeft: '2px solid var(--tinta)',
  borderRadius: 'var(--rub)',
  padding: 'var(--razmak-4)',
  marginBottom: 'var(--razmak-3)',
}

const tekstPitanja = { margin: 0, fontSize: 17, lineHeight: 1.5 }
const pomoc = { margin: '6px 0 0', fontSize: 14, color: 'var(--tekst-prigusen)' }

const oznaka = {
  fontSize: 11.5,
  letterSpacing: '0.05em',
  border: '1px solid var(--linija)',
  borderRadius: 'var(--rub)',
  padding: '1px 7px',
  color: 'var(--tekst-prigusen)',
}

const sitno = { fontSize: 13.5, color: 'var(--tekst-prigusen)' }

const podnozje = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--razmak-3)',
  marginTop: 'var(--razmak-6)',
  paddingTop: 'var(--razmak-4)',
  borderTop: '1px solid var(--linija)',
}

const sporedniGumb = {
  background: 'transparent',
  color: 'var(--tinta)',
}
