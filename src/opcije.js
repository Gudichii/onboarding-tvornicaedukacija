/**
 * Parsiranje stupca `opcije` iz taba PITANJA.
 *
 * Ovo je ugovor između Sheeta i aplikacije. Karlo ga piše rukom, pa parser mora
 * biti popustljiv oko razmaka i oblika, a strog oko značenja: nepoznat oblik
 * vraća grešku koju se vidi na ekranu, umjesto da polje tiho nestane.
 *
 * Formati:
 *   jedan_izbor, vise_izbora   Opcija A|Opcija B|Opcija C
 *   izbor_iz_liste             izvor=q008|max=2
 *   matrica                    redci=q008|stupci=Naziv:tip;Naziv:izbor(A,B,C)
 *
 * `redci` je ili referenca na `lista` pitanje ili fiksni popis odvojen
 * točkazarezom. Tab UPUTE referencu dokumentira kao @q008, a pravi podaci u
 * q009, q010 i q012 pišu je bez @ — parser prima oboje, jer bi inače ovisilo
 * o tome koji je od ta dva Karlo zadnje čitao.
 */

const REFERENCA = /^@?(q\d+)$/i

function dijeloviPoCrti(tekst) {
  return String(tekst || '')
    .split('|')
    .map((d) => d.trim())
    .filter(Boolean)
}

/** "izvor=q008" -> ['izvor', 'q008'] */
function parKljucVrijednost(dio) {
  const i = dio.indexOf('=')
  if (i === -1) return null
  return [dio.slice(0, i).trim().toLowerCase(), dio.slice(i + 1).trim()]
}

export function parsirajIzbor(opcije) {
  return dijeloviPoCrti(opcije)
}

export function parsirajIzborIzListe(opcije) {
  const mapa = {}
  for (const dio of dijeloviPoCrti(opcije)) {
    const par = parKljucVrijednost(dio)
    if (par) mapa[par[0]] = par[1]
  }

  const izvor = (mapa.izvor || '').match(REFERENCA)
  if (!izvor) {
    return { greska: `Nedostaje ili je neispravan "izvor=" u: ${opcije}` }
  }

  const max = Number(mapa.max)
  return {
    izvor: izvor[1].toLowerCase(),
    max: Number.isFinite(max) && max > 0 ? max : Infinity,
  }
}

/** "Status:izbor(Aktivan,Pauziran)" -> { naziv, tip, opcije } */
function parsirajStupac(zapis) {
  const granica = zapis.lastIndexOf(':')
  if (granica === -1) {
    return { naziv: zapis.trim(), tip: 'tekst', opcije: [] }
  }

  const naziv = zapis.slice(0, granica).trim()
  const tipZapis = zapis.slice(granica + 1).trim()

  const izbor = tipZapis.match(/^izbor\s*\((.*)\)$/i)
  if (izbor) {
    return {
      naziv,
      tip: 'izbor',
      opcije: izbor[1]
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    }
  }

  const tip = tipZapis.toLowerCase() === 'broj' ? 'broj' : 'tekst'
  return { naziv, tip, opcije: [] }
}

export function parsirajMatricu(opcije) {
  const mapa = {}
  for (const dio of dijeloviPoCrti(opcije)) {
    const par = parKljucVrijednost(dio)
    if (par) mapa[par[0]] = par[1]
  }

  if (!mapa.stupci) return { greska: `Nedostaje "stupci=" u: ${opcije}` }
  if (!mapa.redci) return { greska: `Nedostaje "redci=" u: ${opcije}` }

  const stupci = mapa.stupci
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parsirajStupac)

  if (!stupci.length) return { greska: `Nijedan stupac nije prepoznat u: ${opcije}` }

  const referenca = mapa.redci.match(REFERENCA)
  const redci = referenca
    ? { tip: 'izPitanja', pitanje: referenca[1].toLowerCase() }
    : {
        tip: 'fiksno',
        vrijednosti: mapa.redci
          .split(';')
          .map((r) => r.trim())
          .filter(Boolean),
      }

  if (redci.tip === 'fiksno' && !redci.vrijednosti.length) {
    return { greska: `Nijedan redak nije prepoznat u: ${opcije}` }
  }

  return { redci, stupci }
}

/* ------------------------------------------------------------------ *
 * Vrijednosti odgovora
 * ------------------------------------------------------------------ */

/** Odgovori stižu kao string; JSON tipovi se raspakiraju, ostali ostaju tekst. */
export function razmotaj(tip, spremljeno) {
  const jeJson = ['vise_izbora', 'lista', 'izbor_iz_liste', 'matrica'].includes(tip)
  if (!jeJson) return spremljeno == null ? '' : String(spremljeno)

  if (!spremljeno) return []
  try {
    const v = JSON.parse(spremljeno)
    return Array.isArray(v) ? v : []
  } catch {
    // Ručno upisan odgovor u Sheetu koji nije JSON — bolje prazno nego pad.
    return []
  }
}

/** Suprotan smjer: ono što ide u ODGOVORI. */
export function zamotaj(vrijednost) {
  if (vrijednost == null) return ''
  if (typeof vrijednost === 'string') return vrijednost
  return JSON.stringify(vrijednost)
}

/** Je li na pitanje odgovoreno — koristi se za obavezna polja i za progress. */
export function jeOdgovoreno(tip, vrijednost) {
  if (tip === 'matrica') {
    return (
      Array.isArray(vrijednost) &&
      vrijednost.some((red) =>
        Object.entries(red).some(([k, v]) => k !== 'redak' && String(v || '').trim()),
      )
    )
  }
  if (Array.isArray(vrijednost)) return vrijednost.some((v) => String(v || '').trim())
  return String(vrijednost || '').trim().length > 0
}

/**
 * Retci matrice se usklađuju sa `lista` pitanjem koje ih napaja: postojeće
 * vrijednosti ostaju, novi redak dolazi prazan, obrisani tiho ispada.
 *
 * Bez ovoga bi promjena popisa programa pomaknula sve vrijednosti za jedno
 * mjesto i klijent bi tek na kraju primijetio da cijene stoje uz krive programe.
 */
export function uskladiMatricu(postojece, nazivi, stupci) {
  const po = new Map((postojece || []).map((r) => [r.redak, r]))
  return nazivi.map((naziv) => {
    const stari = po.get(naziv) || {}
    const red = { redak: naziv }
    for (const s of stupci) red[s.naziv] = stari[s.naziv] ?? ''
    return red
  })
}
