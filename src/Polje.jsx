import { useEffect, useRef } from 'react'
import {
  kljuc,
  parsirajIzbor,
  parsirajIzborIzListe,
  parsirajMatricu,
  razmotaj,
  uskladiMatricu,
} from './opcije.js'

/**
 * Renderiranje pitanja po tipu.
 *
 * Svaki tip zna dvije stvari: kako se prikazuje i u kojem obliku sprema
 * odgovor. Oblik spremanja je ugovor sa Sheetom i ne mijenja se zbog izgleda —
 * `vise_izbora`, `lista`, `izbor_iz_liste` i `matrica` idu kao JSON polje,
 * ostalo kao običan tekst.
 *
 * Komponenta ne sprema ništa sama; javlja promjenu prema gore, a Quiz odlučuje
 * kad se šalje na backend.
 */
export default function Polje({ pitanje, vrijednost, naPromjenu, sviOdgovori, greska }) {
  const zajednicko = { pitanje, vrijednost, naPromjenu, greska }

  switch (pitanje.tip) {
    case 'dugi_tekst':
      return <DugiTekst {...zajednicko} />
    case 'broj':
      return <Jednoredak {...zajednicko} htmlTip="number" />
    case 'email':
      return <Jednoredak {...zajednicko} htmlTip="email" placeholder="ime@domena.hr" />
    case 'telefon':
      return <Jednoredak {...zajednicko} htmlTip="tel" placeholder="+385" />
    case 'url':
      return <Jednoredak {...zajednicko} htmlTip="url" placeholder="https://" />
    case 'datum':
      return <Jednoredak {...zajednicko} htmlTip="date" />
    case 'da_ne':
      return <DaNe {...zajednicko} />
    case 'skala_1_10':
      return <Skala {...zajednicko} />
    case 'jedan_izbor':
      return <Izbor {...zajednicko} viseStruki={false} />
    case 'vise_izbora':
      return <Izbor {...zajednicko} viseStruki />
    case 'lista':
      return <Lista {...zajednicko} />
    case 'izbor_iz_liste':
      return <IzborIzListe {...zajednicko} sviOdgovori={sviOdgovori} />
    case 'matrica':
      return <Matrica {...zajednicko} sviOdgovori={sviOdgovori} />
    case 'tekst':
      return <Jednoredak {...zajednicko} htmlTip="text" />
    default:
      // Nepoznat tip se ne preskače tiho — inače bi pitanje nestalo s ekrana,
      // a Karlo bi mislio da ga je zaboravio dodati.
      return (
        <p style={porukaGreske}>
          Nepoznat tip pitanja: <code>{pitanje.tip}</code>. Provjeri stupac <code>tip</code> u
          tabu PITANJA.
        </p>
      )
  }
}

/* ------------------------------------------------------------------ *
 * Jednostavni tipovi
 * ------------------------------------------------------------------ */

function Jednoredak({ vrijednost, naPromjenu, htmlTip, placeholder, greska }) {
  return (
    <input
      type={htmlTip}
      value={vrijednost || ''}
      placeholder={placeholder}
      onChange={(e) => naPromjenu(e.target.value)}
      style={{ ...polje, ...(greska ? poljeGreska : {}) }}
    />
  )
}

function DugiTekst({ vrijednost, naPromjenu, greska }) {
  const ref = useRef(null)

  // Textarea raste s tekstom: klijent piše po pet rečenica, a fiksna visina
  // znači da vidi tri retka i ne može pregledati što je napisao.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 96)}px`
  }, [vrijednost])

  return (
    <textarea
      ref={ref}
      value={vrijednost || ''}
      onChange={(e) => naPromjenu(e.target.value)}
      rows={3}
      style={{ ...polje, ...(greska ? poljeGreska : {}), resize: 'none', lineHeight: 1.6 }}
    />
  )
}

function DaNe({ vrijednost, naPromjenu }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {['DA', 'NE'].map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => naPromjenu(vrijednost === v ? '' : v)}
          style={{ ...kartica, ...(vrijednost === v ? karticaOdabrana : {}), minWidth: 96 }}
        >
          {v === 'DA' ? 'Da' : 'Ne'}
        </button>
      ))}
    </div>
  )
}

function Skala({ vrijednost, naPromjenu }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {Array.from({ length: 10 }, (_, i) => String(i + 1)).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => naPromjenu(vrijednost === v ? '' : v)}
          style={{
            ...kartica,
            ...(vrijednost === v ? karticaOdabrana : {}),
            width: 42,
            padding: '9px 0',
            textAlign: 'center',
          }}
        >
          {v}
        </button>
      ))}
    </div>
  )
}

function Izbor({ pitanje, vrijednost, naPromjenu, viseStruki }) {
  const opcije = parsirajIzbor(pitanje.opcije)
  const odabrano = viseStruki ? vrijednost || [] : [vrijednost].filter(Boolean)

  function prebaci(o) {
    if (!viseStruki) return naPromjenu(vrijednost === o ? '' : o)
    const ima = odabrano.includes(o)
    naPromjenu(ima ? odabrano.filter((x) => x !== o) : [...odabrano, o])
  }

  if (!opcije.length) {
    return <p style={porukaGreske}>Pitanje nema ponuđene opcije. Provjeri stupac <code>opcije</code>.</p>
  }

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {opcije.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => prebaci(o)}
          style={{ ...kartica, ...(odabrano.includes(o) ? karticaOdabrana : {}) }}
        >
          {o}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Lista
 * ------------------------------------------------------------------ */

function Lista({ vrijednost, naPromjenu }) {
  const redci = vrijednost?.length ? vrijednost : ['']

  const promijeni = (i, v) => naPromjenu(redci.map((r, j) => (j === i ? v : r)))
  const dodaj = () => naPromjenu([...redci, ''])
  const makni = (i) => {
    const preostali = redci.filter((_, j) => j !== i)
    naPromjenu(preostali.length ? preostali : [''])
  }

  return (
    <div>
      {redci.map((r, i) => (
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <span style={brojRetka}>{i + 1}</span>
          <input
            value={r}
            onChange={(e) => promijeni(i, e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                dodaj()
              }
            }}
            style={{ ...polje, flex: 1 }}
          />
          <button
            type="button"
            onClick={() => makni(i)}
            style={makniGumb}
            title="Makni redak"
            aria-label={`Makni redak ${i + 1}`}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" onClick={dodaj} style={dodajGumb}>
        + Dodaj redak
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Izbor iz liste
 * ------------------------------------------------------------------ */

/** Odgovor na `lista` pitanje pretvoren u čist popis nepraznih redaka. */
function stavkeIzvora(sviOdgovori, idPitanja) {
  const sirovo = sviOdgovori?.[kljuc(idPitanja, '')]
  const raspakirano = Array.isArray(sirovo) ? sirovo : razmotaj('lista', sirovo)
  return raspakirano.map((s) => String(s).trim()).filter(Boolean)
}

function IzborIzListe({ pitanje, vrijednost, naPromjenu, sviOdgovori }) {
  const def = parsirajIzborIzListe(pitanje.opcije)
  if (def.greska) return <p style={porukaGreske}>{def.greska}</p>

  const stavke = stavkeIzvora(sviOdgovori, def.izvor)
  const odabrano = vrijednost || []
  const dosegnutMax = odabrano.length >= def.max

  if (!stavke.length) {
    return (
      <p style={napomena}>
        Prvo popuni pitanje iznad — ovdje biraš iz onoga što si tamo nabrojao.
      </p>
    )
  }

  function prebaci(s) {
    if (odabrano.includes(s)) return naPromjenu(odabrano.filter((x) => x !== s))
    if (dosegnutMax) return
    naPromjenu([...odabrano, s])
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {stavke.map((s) => {
          const jeOdabran = odabrano.includes(s)
          const zakljucan = dosegnutMax && !jeOdabran
          return (
            <button
              key={s}
              type="button"
              onClick={() => prebaci(s)}
              disabled={zakljucan}
              title={zakljucan ? `Možeš odabrati najviše ${def.max}` : undefined}
              style={{
                ...kartica,
                ...(jeOdabran ? karticaOdabrana : {}),
                ...(zakljucan ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
              }}
            >
              {s}
            </button>
          )
        })}
      </div>
      {Number.isFinite(def.max) && (
        <p style={{ ...napomena, marginTop: 8 }}>
          {dosegnutMax
            ? `Odabrao si ${def.max} od ${def.max}. Da promijeniš, prvo odznači jedan.`
            : `Odaberi najviše ${def.max}.`}
        </p>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Matrica
 * ------------------------------------------------------------------ */

function Matrica({ pitanje, vrijednost, naPromjenu, sviOdgovori }) {
  const def = parsirajMatricu(pitanje.opcije)
  if (def.greska) return <p style={porukaGreske}>{def.greska}</p>

  const nazivi =
    def.redci.tip === 'fiksno'
      ? def.redci.vrijednosti
      : stavkeIzvora(sviOdgovori, def.redci.pitanje)

  if (!nazivi.length) {
    return (
      <p style={napomena}>
        Prvo popuni pitanje iznad — retci ove tablice dolaze iz onoga što si tamo nabrojao.
      </p>
    )
  }

  // Usklađivanje se radi pri prikazu, ne pri spremanju: lista se mogla
  // promijeniti dok je klijent bio na drugoj sekciji.
  const redci = uskladiMatricu(vrijednost, nazivi, def.stupci)

  function promijeni(nazivRetka, nazivStupca, v) {
    naPromjenu(
      redci.map((r) => (r.redak === nazivRetka ? { ...r, [nazivStupca]: v } : r)),
    )
  }

  return (
    <div style={{ overflowX: 'auto', margin: '0 -2px', padding: '0 2px' }}>
      <table style={tablica}>
        <thead>
          <tr>
            <th style={{ ...celijaZaglavlje, minWidth: 150 }} />
            {def.stupci.map((s) => (
              <th key={s.naziv} style={celijaZaglavlje}>
                {s.naziv}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {redci.map((r) => (
            <tr key={r.redak}>
              <th scope="row" style={celijaRetka}>
                {r.redak}
              </th>
              {def.stupci.map((s) => (
                <td key={s.naziv} style={celija}>
                  {s.tip === 'izbor' ? (
                    <select
                      value={r[s.naziv] || ''}
                      onChange={(e) => promijeni(r.redak, s.naziv, e.target.value)}
                      style={{ ...polje, padding: '7px 8px' }}
                    >
                      <option value="">—</option>
                      {s.opcije.map((o) => (
                        <option key={o} value={o}>
                          {o}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={s.tip === 'broj' ? 'number' : 'text'}
                      value={r[s.naziv] || ''}
                      onChange={(e) => promijeni(r.redak, s.naziv, e.target.value)}
                      style={{ ...polje, padding: '7px 8px', minWidth: s.tip === 'broj' ? 90 : 130 }}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * Stilovi
 * ------------------------------------------------------------------ */

const polje = {
  width: '100%',
  fontFamily: 'var(--font-tekst)',
  fontSize: 15.5,
  color: 'var(--tinta)',
  background: 'var(--papir)',
  // Duga svojstva umjesto skraćenice `border`: nadjačavanja niže mijenjaju samo
  // boju i debljinu, a React upozorava kad se to miješa sa skraćenicom.
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'var(--tinta)',
  borderRadius: 'var(--rub)',
  padding: '10px 12px',
  outlineOffset: 2,
  outlineColor: 'var(--rust)',
}

const poljeGreska = { borderColor: 'var(--crvena)', borderWidth: 2 }

const kartica = {
  fontFamily: 'var(--font-tekst)',
  fontSize: 15,
  color: 'var(--tinta)',
  background: 'var(--papir)',
  borderStyle: 'solid',
  borderWidth: 1,
  borderColor: 'var(--linija)',
  borderRadius: 'var(--rub)',
  padding: '9px 15px',
  cursor: 'pointer',
  textAlign: 'left',
}

const karticaOdabrana = {
  borderColor: 'var(--tinta)',
  borderWidth: 2,
  padding: '8px 14px',
  fontWeight: 500,
}

const brojRetka = {
  width: 22,
  flex: '0 0 auto',
  fontSize: 13,
  color: 'var(--tekst-najtisi)',
  lineHeight: '40px',
  textAlign: 'right',
}

const makniGumb = {
  flex: '0 0 auto',
  width: 38,
  background: 'transparent',
  border: '1px solid var(--linija)',
  borderRadius: 'var(--rub)',
  color: 'var(--tekst-prigusen)',
  fontSize: 18,
  lineHeight: 1,
  cursor: 'pointer',
}

const dodajGumb = {
  background: 'transparent',
  border: '1px dashed var(--tekst-najtisi)',
  borderRadius: 'var(--rub)',
  color: 'var(--tekst-prigusen)',
  fontFamily: 'var(--font-tekst)',
  fontSize: 14,
  padding: '7px 14px',
  cursor: 'pointer',
  marginLeft: 30,
}

const tablica = { borderCollapse: 'collapse', width: '100%' }

const celijaZaglavlje = {
  fontFamily: 'var(--font-tekst)',
  fontWeight: 500,
  fontSize: 12.5,
  letterSpacing: '0.04em',
  textAlign: 'left',
  color: 'var(--tekst-prigusen)',
  padding: '0 6px 8px',
  whiteSpace: 'nowrap',
}

const celijaRetka = {
  fontFamily: 'var(--font-tekst)',
  fontWeight: 400,
  fontSize: 14.5,
  textAlign: 'left',
  padding: '5px 10px 5px 0',
  verticalAlign: 'middle',
}

const celija = { padding: '4px 6px' }

const porukaGreske = {
  margin: 0,
  fontSize: 14,
  color: 'var(--crvena)',
}

const napomena = {
  margin: 0,
  fontSize: 13.5,
  color: 'var(--tekst-prigusen)',
}
