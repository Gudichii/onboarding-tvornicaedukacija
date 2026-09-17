import { useEffect, useMemo, useState } from 'react'
import Znak from './Znak.jsx'
import Polje from './Polje.jsx'
import Zavrsetak from './Zavrsetak.jsx'
import { kljuc, razmotaj, zamotaj, jeOdgovoreno } from './opcije.js'
import { slozeniSekcije, sveStavke, ZADANI_MAX_PROGRAMA } from './sekcije.js'
import { useSpremanje } from './spremanje.js'

/**
 * Quiz — jedna sekcija po ekranu.
 *
 * Ne jedno pitanje po ekranu (62 ekrana je predugo) i ne svih 62 odjednom
 * (zid teksta na kojem se odustaje).
 *
 * Slaganje sekcija, uvjetna vidljivost i ponavljajući blokovi žive u
 * sekcije.js i pokriveni su testovima; ovdje je samo prikaz i navigacija.
 */
export default function Quiz({ schema, sesija, token, naUvod }) {
  const [odgovori, postaviOdgovore] = useState(() => pocetniOdgovori(schema, sesija))
  const [indeks, postaviIndeks] = useState(0)
  const [nedostaju, postaviNedostaju] = useState([])
  const [zavrseno, postaviZavrseno] = useState(false)
  const spremanje = useSpremanje(token)

  const maxPrograma = Number(schema.config?.max_programa_dubinski) || ZADANI_MAX_PROGRAMA
  const sekcije = useMemo(
    () => slozeniSekcije(schema.pitanja, odgovori, maxPrograma),
    [schema.pitanja, odgovori, maxPrograma],
  )

  const sigurniIndeks = Math.min(indeks, Math.max(sekcije.length - 1, 0))
  const trenutna = sekcije[sigurniIndeks]

  const sve = sveStavke(sekcije)
  const odgovoreno = sve.filter((s) =>
    jeOdgovoreno(s.pitanje.tip, odgovori[kljuc(s.pitanje.id, s.instanca)]),
  ).length
  const postotak = sve.length ? Math.round((odgovoreno / sve.length) * 100) : 0

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [sigurniIndeks, zavrseno])

  function promijeni(stavka, nova) {
    const k = kljuc(stavka.pitanje.id, stavka.instanca)
    postaviOdgovore((prije) => ({ ...prije, [k]: nova }))
    postaviNedostaju((prije) => prije.filter((x) => x !== k))
    if (token) spremanje.zabiljezi(stavka.pitanje.id, stavka.instanca, zamotaj(nova))
  }

  /** Obavezna, a prazna pitanja jedne sekcije. */
  const praznaObavezna = (sekcija) =>
    sekcija.stavke
      .filter(
        (s) =>
          s.pitanje.obavezno && !jeOdgovoreno(s.pitanje.tip, odgovori[kljuc(s.pitanje.id, s.instanca)]),
      )
      .map((s) => kljuc(s.pitanje.id, s.instanca))

  function oznaciFalise(prazna) {
    postaviNedostaju(prazna)
    document.getElementById(`pitanje-${prazna[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  /**
   * Slobodna navigacija. Klik na broj sekcije vodi na nju bez provjere —
   * klijent smije preskakati i vraćati se kako mu odgovara. Obavezna polja
   * zaustavljaju samo gumb „Sljedeća sekcija" i završetak upitnika.
   */
  async function idi(noviIndeks) {
    const cilj = Math.min(Math.max(noviIndeks, 0), sekcije.length - 1)
    postaviNedostaju([])
    if (token) await spremanje.isprazni()
    postaviIndeks(cilj)
  }

  async function naprijed() {
    const prazna = praznaObavezna(trenutna)
    if (prazna.length) return oznaciFalise(prazna)
    await idi(sigurniIndeks + 1)
  }

  /**
   * Završetak provjerava cijeli upitnik, ne samo zadnju sekciju — inače bi
   * klijent koji je preskakao sekcije mogao predati upitnik s rupama.
   */
  async function zavrsi() {
    const prvaSRupom = sekcije.findIndex((s) => praznaObavezna(s).length > 0)
    if (prvaSRupom !== -1) {
      const prazna = praznaObavezna(sekcije[prvaSRupom])
      postaviIndeks(prvaSRupom)
      // Pričekaj da se sekcija iscrta prije nego skrolamo na pitanje u njoj.
      setTimeout(() => oznaciFalise(prazna), 0)
      return
    }

    postaviNedostaju([])
    if (token) {
      await spremanje.isprazni()
      await spremanje.zavrsi()
    }
    postaviZavrseno(true)
  }

  if (!trenutna) return null

  if (zavrseno) {
    return (
      <Zavrsetak
        klijent={sesija?.klijent}
        odgovoreno={odgovoreno}
        ukupno={sve.length}
        naPovratak={() => postaviZavrseno(false)}
      />
    )
  }

  const zadnja = sigurniIndeks === sekcije.length - 1

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
              key={s.kljuc}
              onClick={() => idi(i)}
              style={{
                ...tocka,
                ...(i === sigurniIndeks ? tockaAktivna : {}),
                ...(s.instanca ? tockaProgram : {}),
              }}
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
          Sekcija {sigurniIndeks + 1} od {sekcije.length}
          {trenutna.instanca && ` · ${trenutna.instanca}. od ${brojPrograma(sekcije)} programa`}
          {trenutna.stavke.length > 0 && ` · ${trenutna.stavke.length} pitanja`}
        </p>

        {trenutna.cekaProgram && (
          <p style={upozorenje}>
            Ova se pitanja ponavljaju za svaki program koji odabereš kao prioritetan. Vrati
            se na sekciju „Programi i mapa ponude" i odaberi ih, pa će se pojaviti ovdje.
          </p>
        )}

        <div style={{ marginTop: 'var(--razmak-5)' }}>
          {trenutna.stavke.map((s) => {
            const k = kljuc(s.pitanje.id, s.instanca)
            return (
              <PitanjeBlok
                key={k}
                kljucStavke={k}
                pitanje={s.pitanje}
                vrijednost={odgovori[k]}
                sviOdgovori={odgovori}
                fali={nedostaju.includes(k)}
                naPromjenu={(v) => promijeni(s, v)}
              />
            )
          })}
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
          {zadnja ? (
            <button className="cta" onClick={zavrsi}>
              Završi upitnik
            </button>
          ) : (
            <button className="cta" onClick={naprijed}>
              Sljedeća sekcija
            </button>
          )}
        </div>
      </main>
    </>
  )
}

const brojPrograma = (sekcije) => sekcije.filter((s) => s.instanca).length

function PitanjeBlok({ kljucStavke, pitanje, vrijednost, sviOdgovori, fali, naPromjenu }) {
  return (
    <article id={`pitanje-${kljucStavke}`} style={{ ...kartica, ...(fali ? karticaFali : {}) }}>
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
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'var(--linija)',
  background: 'transparent',
  color: 'var(--tekst-najtisi)',
  fontFamily: 'var(--font-tekst)',
  fontSize: 12,
  cursor: 'pointer',
}

const tockaAktivna = { borderColor: 'var(--tinta)', color: 'var(--tinta)', fontWeight: 600 }
// Lila = ono što dolazi iz odabira programa, po značenjima iz palete.
const tockaProgram = { borderColor: 'var(--lila)' }

const kartica = {
  background: 'var(--ploca)',
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
