/**
 * Komunikacija s Apps Script backendom.
 *
 * Web App ne može vratiti HTTP status kod, pa greške stižu kao 200 s poljem
 * `greska` u tijelu. Zato se ovdje svaki odgovor provjerava na to polje i
 * pretvara u GreskaApija — pozivatelj hvata jednu vrstu iznimke, bez obzira
 * je li pukla mreža ili je backend rekao "nepoznat_token".
 */

const API = import.meta.env.VITE_API_URL

export class GreskaApija extends Error {
  constructor(kod, poruka) {
    super(poruka || kod)
    this.name = 'GreskaApija'
    this.kod = kod
  }
}

function provjeriPodesenost() {
  if (!API) {
    throw new GreskaApija(
      'nema_api_url',
      'VITE_API_URL nije postavljen. Upiši /exec adresu Web Appa u .env datoteku.',
    )
  }
}

async function procitaj(odgovor) {
  const tekst = await odgovor.text()

  let podaci
  try {
    podaci = JSON.parse(tekst)
  } catch {
    // Apps Script vraća HTML stranicu za prijavu kad deployment nije
    // postavljen na "Anyone" — tada ovdje stigne <!DOCTYPE html>, ne JSON.
    if (tekst.trim().startsWith('<')) {
      throw new GreskaApija(
        'trazi_prijavu',
        'Backend je vratio Google stranicu za prijavu umjesto podataka. ' +
          'U Apps Scriptu postavi Who has access na Anyone i deployaj ponovno.',
      )
    }
    throw new GreskaApija('neocekivan_odgovor', 'Backend nije vratio JSON.')
  }

  if (podaci && podaci.greska) {
    throw new GreskaApija(podaci.greska, podaci.poruka)
  }
  return podaci
}

async function get(parametri) {
  provjeriPodesenost()
  const url = `${API}?${new URLSearchParams(parametri)}`
  let odgovor
  try {
    odgovor = await fetch(url)
  } catch (err) {
    throw new GreskaApija('mreza', 'Backend nije dostupan. ' + err.message)
  }
  return procitaj(odgovor)
}

export function dohvatiSchemu({ svjeze = false } = {}) {
  return get(svjeze ? { action: 'schema', svjeze: '1' } : { action: 'schema' })
}

export function dohvatiSesiju(token) {
  return get({ action: 'session', t: token })
}

/**
 * Batch upis. `dodatno` prima status_quiz i faza — jedina dva stupca u
 * KLIJENTI koja backend smije mijenjati.
 *
 * Content-Type je namjerno text/plain: application/json bi natjerao preglednik
 * na CORS preflight, na koji Apps Script ne odgovara, pa bi spremanje padalo
 * prije nego uopće dođe do servera. Tijelo je i dalje JSON.
 */
export async function spremiOdgovore(token, odgovori, dodatno = {}) {
  provjeriPodesenost()

  let odgovor
  try {
    odgovor = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ token, odgovori, ...dodatno }),
    })
  } catch (err) {
    throw new GreskaApija('mreza', 'Spremanje nije prošlo. ' + err.message)
  }
  return procitaj(odgovor)
}
