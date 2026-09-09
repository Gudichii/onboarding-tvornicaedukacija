import { useEffect, useState } from 'react'
import Znak from './Znak.jsx'
import Uvod from './Uvod.jsx'
import Quiz from './Quiz.jsx'
import { dohvatiSchemu, dohvatiSesiju, GreskaApija } from './api.js'

/** Verzija sheme koju ovaj kod zna čitati. Mora se poklapati s CONFIG. */
const SCHEMA_VERZIJA = '1'

function tokenIzUrla() {
  return new URLSearchParams(window.location.search).get('t') || ''
}

export default function App() {
  const [token] = useState(tokenIzUrla)
  const [stanje, postaviStanje] = useState('ucitavanje')
  const [ekran, postaviEkran] = useState('uvod')
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

  if (stanje === 'ucitavanje') {
    return (
      <main style={sredina}>
        <Znak visina={36} />
        <p style={{ color: 'var(--tekst-prigusen)', marginTop: 'var(--razmak-4)' }}>Učitavam…</p>
      </main>
    )
  }

  if (stanje === 'greska') return <Greska greska={greska} />

  if (ekran === 'uvod') {
    return (
      <Uvod
        klijent={sesija?.klijent}
        brojPitanja={schema.pitanja.length}
        nastavak={(sesija?.odgovori.length || 0) > 0}
        naZapocni={() => postaviEkran('quiz')}
      />
    )
  }

  return <Quiz schema={schema} sesija={sesija} naUvod={() => postaviEkran('uvod')} />
}

function Greska({ greska }) {
  const naslovi = {
    nema_api_url: 'Backend nije podešen',
    trazi_prijavu: 'Backend traži prijavu',
    mreza: 'Backend nije dostupan',
    nepoznat_token: 'Link nije prepoznat',
    nema_tokena: 'Treba ti link iz maila',
    kriva_schema_verzija: 'Sheet i aplikacija nisu usklađeni',
  }
  const jeKorisnicka = greska.kod === 'nepoznat_token' || greska.kod === 'nema_tokena'

  return (
    <main style={sredina}>
      <Znak visina={36} />
      <div style={okvirGreske}>
        <h1 style={{ fontSize: 26, color: jeKorisnicka ? 'var(--tinta)' : 'var(--crvena)' }}>
          {naslovi[greska.kod] || 'Nešto nije u redu'}
        </h1>
        {jeKorisnicka ? (
          <p style={{ marginBottom: 0 }}>
            Ovoj stranici se pristupa preko osobnog linka koji si dobio u mailu nakon uplate.
            Ako ga ne možeš pronaći, javi nam se i poslat ćemo ti ga ponovno.
          </p>
        ) : (
          <>
            <p>{greska.message}</p>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--tekst-najtisi)' }}>
              Kod greške: {greska.kod}
            </p>
          </>
        )}
      </div>
    </main>
  )
}

const sredina = {
  maxWidth: 'var(--sirina-sadrzaja)',
  margin: '0 auto',
  padding: '80px 20px',
}

const okvirGreske = {
  background: 'var(--ploca)',
  border: '1px solid var(--tinta)',
  borderRadius: 'var(--rub)',
  padding: 'var(--razmak-5)',
  marginTop: 'var(--razmak-5)',
  maxWidth: '58ch',
}
