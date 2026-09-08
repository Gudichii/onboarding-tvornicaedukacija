import Znak from './Znak.jsx'

/**
 * Privremena stranica. Zamjenjuje je uvodna stranica u koraku 7 redoslijeda
 * gradnje — stoji ovdje samo da deploy ne servira prazno dok backend prolazi
 * provjeru na pravom Sheetu.
 */
export default function App() {
  return (
    <main className="kontejner" style={{ maxWidth: 'var(--sirina-sadrzaja)', margin: '0 auto', padding: '64px 20px' }}>
      <Znak visina={44} />
      <h1 style={{ marginTop: 'var(--razmak-5)' }}>Onboarding sustav</h1>
      <p style={{ color: 'var(--tekst-prigusen)', maxWidth: '52ch' }}>
        Ovdje će klijent nakon uplate predati sve što treba za izradu svog
        marketinškog sustava. Aplikacija je u izradi.
      </p>
      <p style={{ color: 'var(--tekst-najtisi)', fontSize: 13, letterSpacing: '0.06em' }}>
        Pristup ide preko linka iz maila.
      </p>
    </main>
  )
}
