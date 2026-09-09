import { useEffect, useMemo, useState } from 'react'
import Znak from './Znak.jsx'
import Polje, { kljuc } from './Polje.jsx'
import { razmotaj, zamotaj, jeOdgovoreno } from './opcije.js'
import { useSpremanje } from './spremanje.js'

/**
 * Quiz — jedna sekcija po ekranu.
 *
 * Ne jedno pitanje po ekranu (62 ekrana je predugo) i ne svih 62 odjednom
 * (zid teksta na kojem se odustaje).
 *
 * Ponavljajući blokovi po programu još nisu ovdje: pitanja s blok = program
 * zasad se prikazuju jednom, bez instanci. To je sljedeći korak.
 */
export default function Quiz({ schema, sesija, token, naUvod }) {
  const [odgovori, postaviOdgovore] = useState(() => pocetniOdgovori(schema, sesija))
  const [indeks, postaviIndeks] = useState(0)
  const [nedostaju, postaviNedostaju] = useState([])
  const spremanje = useSpremanje(token)

  // Uvjetna pitanja: skriveno pitanje ne postoji za korisnika — ne prikazuje se,
  // ne broji se u progress i nikad nije obavezno, bez obzira što piše u Sheetu.
  const vidljiva = useMemo(
    () => schema.pitanja.filter((p) => jeVidljivo(p, odgovori)),
    [schema, odgovori],
  )

  const sekcije = useMemo(() => grupirajPoSekcijama(vidljiva), [vidljiva])
  const sigurniIndeks = Math.min(indeks, Math.max(sekcije.length - 1, 0))
  const trenutna = sekcije[sigurniIndeks]

  const odgovoreno = vidljiva.filter((p) => jeOdgovoreno(p.tip, odgovori[kljuc(p.id, '')])).length
  const postotak = vidljiva.length ? Math.round((odgovoreno / vidljiva.length) * 100) : 0

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [sigurniIndeks])

  function promijeni(pitanje, nova) {
    postaviOdgovore((prije) => ({ ...prije, [kljuc(pitanje.id, '')]: nova }))
    postaviNedostaju((prije) => prije.filter((id) => id !== pitanje.id))
    if (token) spremanje.zabiljezi(pitanje.id, '', zamotaj(nova))
  }

  async function idi(noviIndeks) {
    const cilj = Math.min(Math.max(noviIndeks, 0), sekcije.length - 1)

    // Natrag se ide uvijek; naprijed tek kad su obavezna popunjena. Nikad se
    // ne briše ono što je klijent već napisao — samo se označi što fali.
    if (cilj > sigurniIndeks) {
      const prazna = trenutna.pitanja
        .filter((p) => p.obavezno && !jeOdgovoreno(p.tip, odgovori[kljuc(p.id, '')]))
        .map((p) => p.id)

      if (prazna.length) {
        postaviNedostaju(prazna)
        document
          .getElementById(`pitanje-${prazna[0]}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }
    }

    postaviNedostaju([])
    if (token) await spremanje.isprazni()
    postaviIndeks(cilj)
  }

  if (!trenutna) return null

  return (
    <>
      <div style={traka}>
        <div style={trakaSadrzaj}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button onClick={naUvod} style={znakGumb} title="Natrag na uvod">
              <Znak visina={22} tamna />
            </button>
            <span style={trakaNaslov}>{trenutna.naziv}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: '0 0 auto' }}>
            <Indikator stanje={spremanje.stanje} token={token} />
            <span style={trakaBrojka}>{postotak}%</span>
          </div>
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
              style={{ ...tocka, ...(i === sigurniIndeks ? tockaAktivna : {}) }}
              title={s.naziv}
            >
              {i + 1}
            </button>
          ))}
        </nav>

        {!token && (
          <p style={upozorenje}>
            Otvoreno bez osobnog linka, pa se odgovori ne spremaju. Za pravi unos otvori
            stranicu preko linka iz maila.
          </p>
        )}

        <h1 style={{ marginTop: 'var(--razmak-5)' }}>{trenutna.naziv}</h1>
        <p style={sitno}>
          Sekcija {sigurniIndeks + 1} od {sekcije.length} · {trenutna.pitanja.length} pitanja
        </p>

        <div style={{ marginTop: 'var(--razmak-5)' }}>
          {trenutna.pitanja.map((p) => (
            <PitanjeBlok
              key={p.id}
              pitanje={p}
              vrijednost={odgovori[kljuc(p.id, '')]}
              sviOdgovori={odgovori}
              fali={nedostaju.includes(p.id)}
              naPromjenu={(v) => promijeni(p, v)}
            />
          ))}
        </div>

        {nedostaju.length > 0 && (
          <p style={porukaFali}>
            {nedostaju.length === 1
              ? 'Jedno obavezno pitanje je ostalo prazno.'
              : `${nedostaju.length} obaveznih pitanja je ostalo prazno.`}{' '}
            Označena su crvenom.
          </p>
        )}

        <div style={podnozje}>
          <button
            className="cta"
            onClick={() => idi(sigurniIndeks - 1)}
            disabled={sigurniIndeks === 0}
            style={sporedniGumb}
          >
            Natrag
          </button>
          {sigurniIndeks < sekcije.length - 1 ? (
            <button className="cta" onClick={() => idi(sigurniIndeks + 1)}>
              Sljedeća sekcija
            </button>
          ) : (
            <span style={sitno}>Ovo je zadnja sekcija.</span>
          )}
        </div>
      </main>
    </>
  )
}

function PitanjeBlok({ pitanje, vrijednost, sviOdgovori, fali, naPromjenu }) {
  return (
    <article
      id={`pitanje-${pitanje.id}`}
      style={{ ...kartica, ...(fali ? karticaFali : {}) }}
    >
      <label style={{ display: 'block' }}>
        <span style={tekstPitanja}>{pitanje.pitanje}</span>
        {!pitanje.obavezno && <span style={oznakaNeobavezno}>nije obavezno</span>}
        {pitanje.pomoc && <span style={pomoc}>{pitanje.pomoc}</span>}
      </label>

      <div style={{ marginTop: 'var(--razmak-3)' }}>
        <Polje
          pitanje={pitanje}
          vrijednost={vrijednost}
          sviOdgovori={sviOdgovori}
          greska={fali}
          naPromjenu={naPromjenu}
        />
      </div>

      {fali && <p style={porukaFaliMalo}>Ovo pitanje je obavezno.</p>}
    </article>
  )
}

function Indikator({ stanje, token }) {
  if (!token) return null
  const tekst = {
    sprema: 'Spremam…',
    spremljeno: 'Spremljeno',
    greska: 'Spremanje ne prolazi — pokušavam ponovno',
  }[stanje]
  if (!tekst) return null
  return (
    <span style={{ ...indikator, color: stanje === 'greska' ? '#F0A9A0' : 'var(--tekst-najtisi)' }}>
      {tekst}
    </span>
  )
}

/* ------------------------------------------------------------------ *
 * Logika
 * ------------------------------------------------------------------ */

/** Spremljeni odgovori se raspakiraju po tipu pitanja, ne po obliku vrijednosti. */
function pocetniOdgovori(schema, sesija) {
  const tipovi = new Map(schema.pitanja.map((p) => [p.id, p.tip]))
  const stanje = {}
  for (const o of sesija?.odgovori || []) {
    const tip = tipovi.get(o.pitanje_id)
    if (!tip) continue // odgovor na pitanje koje više nije aktivno
    stanje[kljuc(o.pitanje_id, o.instanca)] = razmotaj(tip, o.odgovor)
  }
  return stanje
}

function jeVidljivo(pitanje, odgovori) {
  if (!pitanje.uvjet_pitanje) return true
  const dano = odgovori[kljuc(pitanje.uvjet_pitanje, '')]
  const kaoTekst = Array.isArray(dano) ? dano.join('|') : String(dano ?? '')
  return kaoTekst.trim().toUpperCase() === String(pitanje.uvjet_vrijednost).trim().toUpperCase()
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

/* ------------------------------------------------------------------ *
 * Stilovi
 * ------------------------------------------------------------------ */

const traka = { position: 'sticky', top: 0, zIndex: 10, background: 'var(--tinta)', color: 'var(--papir)' }

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
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

const trakaBrojka = { fontFamily: 'var(--font-naslov)', fontWeight: 700, fontSize: 16 }
const indikator = { fontSize: 12.5, letterSpacing: '0.02em', whiteSpace: 'nowrap' }
const znakGumb = { background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex' }
const sipka = { height: 3, background: '#3A3540' }
const sipkaIspuna = { height: '100%', background: 'var(--rust)', transition: 'width 220ms ease' }

const omotac = { maxWidth: 'var(--sirina-sadrzaja)', margin: '0 auto', padding: '28px 20px 120px' }
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

const kartica = {
  background: 'var(--ploca)',
  // Duga svojstva: karticaFali mijenja samo boje rubova, a miješanje sa
  // skraćenicom `border` React prijavljuje kao izvor grešaka u stilu.
  borderStyle: 'solid',
  borderWidth: '1px 1px 1px 2px',
  borderColor: 'var(--linija)',
  borderLeftColor: 'var(--tinta)',
  borderRadius: 'var(--rub)',
  padding: 'var(--razmak-4)',
  marginBottom: 'var(--razmak-4)',
}

const karticaFali = { borderColor: 'var(--crvena)', borderLeftColor: 'var(--crvena)' }

const tekstPitanja = { display: 'block', fontSize: 17, lineHeight: 1.45 }
const oznakaNeobavezno = {
  display: 'inline-block',
  marginTop: 5,
  fontSize: 11.5,
  letterSpacing: '0.06em',
  color: 'var(--tekst-najtisi)',
}
const pomoc = { display: 'block', marginTop: 5, fontSize: 14, color: 'var(--tekst-prigusen)' }

const sitno = { fontSize: 13.5, color: 'var(--tekst-prigusen)' }

const upozorenje = {
  background: 'var(--ploca)',
  borderLeft: '3px solid var(--marker)',
  padding: '10px 14px',
  margin: 'var(--razmak-4) 0 0',
  fontSize: 14,
}

const porukaFali = { color: 'var(--crvena)', fontSize: 14.5, marginTop: 'var(--razmak-4)' }
const porukaFaliMalo = { color: 'var(--crvena)', fontSize: 13.5, margin: '10px 0 0' }

const podnozje = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--razmak-3)',
  marginTop: 'var(--razmak-5)',
  paddingTop: 'var(--razmak-4)',
  borderTop: '1px solid var(--linija)',
}

const sporedniGumb = { background: 'transparent', color: 'var(--tinta)' }
