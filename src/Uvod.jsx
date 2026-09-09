import Znak from './Znak.jsx'
import { IlustracijaUvod, IlustracijaPriprema } from './Ilustracija.jsx'

/**
 * Uvodna stranica — prvo što klijent vidi nakon uplate.
 *
 * Mora izgledati kao sustav, ne kao Google forma. Ton je kolegijalan i
 * direktan, procjena vremena iskrena: klijent koji očekuje 30 minuta, a naiđe
 * na 62 pitanja, odustane na dvadesetom.
 *
 * Prvi ekran nosi točno jedan marker i jedan rust, i rust je na CTA-u.
 */
export default function Uvod({ klijent, brojPitanja, naZapocni, nastavak }) {
  return (
    <main className="kontejner" style={omotac}>
      <header style={{ marginBottom: 'var(--razmak-6)' }}>
        <Znak visina={38} />
      </header>

      <p style={nadnaslov}>Onboarding{klijent?.brand ? ` · ${klijent.brand}` : ''}</p>

      <h1 style={{ maxWidth: '17ch' }}>
        Sve što nam treba, na <span className="marker">jednom mjestu</span>
      </h1>

      <p style={uvodna}>
        {klijent?.ime ? `${klijent.ime.split(' ')[0]}, o` : 'O'}vdje nam predaješ sirovinu
        za tvoj marketinški sustav — ponudu, kupca, dokaze. Sve što napišeš ide direktno u
        oglase, stranice i skripte za prodajne razgovore. Bolji ulaz, brži izlaz.
      </p>

      <figure className="ploca" style={{ margin: 'var(--razmak-6) 0' }}>
        <div className="ploca-label">Put tvojih podataka</div>
        <IlustracijaUvod />
        <figcaption>
          Ono što danas stoji razbacano po glavi i mapama, kroz ovaj upitnik postaje sustav
          koji radi bez tebe.
        </figcaption>
      </figure>

      <h2>Prije nego kreneš</h2>

      <dl style={popis}>
        <Stavka naslov="Oko 90 minuta">
          Nemoj to podcijeniti — pitanja su konkretna i traže razmišljanje. Možeš raditi u
          više navrata, napredak se sprema sam.
        </Stavka>

        <Stavka naslov="Za računalom, ne na mobitelu">
          Radi i na mobitelu, ali dio pitanja su tablice s više stupaca. Na malom ekranu ćeš
          se mučiti bez potrebe.
        </Stavka>

        <Stavka naslov="Napredak se sprema automatski">
          Možeš stati kad god želiš i vratiti se preko istog linka iz maila. Ništa se ne gubi
          zatvaranjem kartice.
        </Stavka>

        <Stavka naslov="Slobodno koristi ChatGPT">
          Ako ti je lakše, izdiktiraj natuknice u ChatGPT i zalijepi uređeni odgovor natrag.
          Bitno je samo da sadržaj i stav ostanu tvoji — pišemo tvojim glasom, ne njegovim.
        </Stavka>
      </dl>

      <section style={pripremaOkvir}>
        <div style={{ flex: '1 1 260px' }}>
          <h2 style={{ marginBottom: 'var(--razmak-3)' }}>Imaj pri ruci</h2>
          <ul style={lista}>
            <li>Nazive i cijene svih programa koje nudiš</li>
            <li>Približan broj ljudi u mailing listi i bazi klijenata</li>
            <li>Imena suvlasnika ili partnera, ako ih ima</li>
          </ul>
          <p style={{ ...sitno, marginBottom: 0 }}>
            Polovica zastajkivanja dolazi od toga što podatak nije pri ruci.
          </p>
        </div>
        <div style={{ flex: '0 0 auto' }}>
          <IlustracijaPriprema />
        </div>
      </section>

      <h2>Što slijedi nakon upitnika</h2>
      <p>
        Dobivaš popis kratkih zadataka s videom uz svaki — pristup Facebook oglasima, GoHighLevel
        račun, fotografije i testimoniali u tvoj Drive folder. Tek kad to složimo, kreće izrada.
      </p>

      <div style={cta}>
        <button className="cta" onClick={naZapocni}>
          {nastavak ? 'Nastavi gdje si stao' : 'Započni'}
        </button>
        <span style={sitno}>
          {brojPitanja} pitanja · {nastavak ? 'napredak je spremljen' : 'možeš stati bilo kad'}
        </span>
      </div>
    </main>
  )
}

function Stavka({ naslov, children }) {
  return (
    <div style={stavka}>
      <dt style={stavkaNaslov}>{naslov}</dt>
      <dd style={stavkaTekst}>{children}</dd>
    </div>
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

const uvodna = {
  fontSize: 18,
  lineHeight: 1.65,
  maxWidth: '58ch',
  color: 'var(--tinta)',
}

const popis = { margin: '0 0 var(--razmak-6)' }

const stavka = {
  borderTop: '1px solid var(--linija)',
  padding: 'var(--razmak-3) 0',
}

const stavkaNaslov = {
  fontFamily: 'var(--font-naslov)',
  fontWeight: 700,
  fontSize: 20,
  marginBottom: 2,
}

const stavkaTekst = {
  margin: 0,
  color: 'var(--tekst-prigusen)',
  maxWidth: '62ch',
}

const pripremaOkvir = {
  display: 'flex',
  gap: 'var(--razmak-5)',
  alignItems: 'center',
  flexWrap: 'wrap',
  background: 'var(--ploca)',
  border: '1px solid var(--tinta)',
  borderRadius: 'var(--rub)',
  padding: 'var(--razmak-5)',
  margin: '0 0 var(--razmak-6)',
}

const lista = {
  margin: '0 0 var(--razmak-3)',
  paddingLeft: '1.1em',
  color: 'var(--tinta)',
}

const sitno = { fontSize: 13.5, color: 'var(--tekst-prigusen)' }

const cta = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--razmak-4)',
  flexWrap: 'wrap',
  marginTop: 'var(--razmak-6)',
  paddingTop: 'var(--razmak-5)',
  borderTop: '1px solid var(--linija)',
}
