import Znak from './Znak.jsx'
import { IlustracijaPriprema } from './Ilustracija.jsx'

/**
 * Završni ekran.
 *
 * Upitnik i prikupljanje materijala su razdvojeni: ovdje završava upitnik, a
 * fotografije, testimoniali i pristupi idu preko Drive foldera klijenta. Zato
 * ovdje nema checkliste sa zadacima — samo potvrda i jedan sljedeći korak.
 */
export default function Zavrsetak({ klijent, odgovoreno, ukupno, naPovratak }) {
  const drive = klijent?.drive_folder_url
  const jeUpotrebljiv = drive && /^https?:\/\//.test(drive) && !drive.includes('/...')

  return (
    <main className="kontejner" style={omotac}>
      <header style={{ marginBottom: 'var(--razmak-6)' }}>
        <Znak visina={38} />
      </header>

      <p style={nadnaslov}>Upitnik je predan</p>

      <h1 style={{ maxWidth: '18ch' }}>
        Gotovo. Ostatak je <span className="marker">na nama</span>
      </h1>

      <p style={uvodna}>
        Odgovorio si na {odgovoreno} od {ukupno} pitanja. Sve je spremljeno i od ovog trenutka
        je kod nas — iz toga slažemo tvoju ponudu, poruke i prodajni tok.
      </p>

      <section style={okvir}>
        <div style={{ flex: '1 1 280px' }}>
          <h2 style={{ marginBottom: 'var(--razmak-3)' }}>Još samo materijali</h2>
          <p style={{ marginBottom: 'var(--razmak-3)' }}>
            Fotografije, testimoniali, logo i postojeći materijali ne idu kroz ovaj upitnik
            nego u tvoj Drive folder. Ubaci ih kad stigneš — što prije to bude, to prije
            krećemo s izradom.
          </p>
          {jeUpotrebljiv ? (
            <a className="cta" href={drive} target="_blank" rel="noopener noreferrer">
              Otvori svoj Drive folder
            </a>
          ) : (
            <p style={{ ...sitno, marginBottom: 0 }}>
              Link na tvoj Drive folder stiže mailom.
            </p>
          )}
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <IlustracijaPriprema />
        </div>
      </section>

      <h2>Što sad</h2>
      <p>
        Javljamo se s prvim nacrtom. Ako se u međuvremenu sjetiš nečega važnog, možeš se
        vratiti na upitnik preko istog linka i dopuniti odgovor — sve se prepisuje, ništa se
        ne duplicira.
      </p>

      <button onClick={naPovratak} style={povratak}>
        Vrati se na odgovore
      </button>
    </main>
  )
}

const omotac = {
  maxWidth: 'var(--sirina-sadrzaja)',
  margin: '0 auto',
  padding: '52px 20px 110px',
}

const nadnaslov = {
  fontSize: 12,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--tekst-najtisi)',
  marginBottom: 'var(--razmak-3)',
}

const uvodna = { fontSize: 18, lineHeight: 1.65, maxWidth: '58ch' }

const okvir = {
  display: 'flex',
  gap: 'var(--razmak-5)',
  alignItems: 'center',
  flexWrap: 'wrap',
  background: 'var(--ploca)',
  border: '1px solid var(--tinta)',
  borderRadius: 'var(--rub)',
  padding: 'var(--razmak-5)',
  margin: 'var(--razmak-6) 0',
}

const sitno = { fontSize: 13.5, color: 'var(--tekst-prigusen)' }

const povratak = {
  background: 'transparent',
  border: 'none',
  padding: 0,
  marginTop: 'var(--razmak-4)',
  color: 'var(--tekst-prigusen)',
  fontFamily: 'var(--font-tekst)',
  fontSize: 14,
  textDecoration: 'underline',
  textUnderlineOffset: 3,
  cursor: 'pointer',
}
