import { useCallback, useEffect, useRef, useState } from 'react'
import { spremiOdgovore } from './api.js'

/**
 * Autosave.
 *
 * Unos se nikad ne blokira dok spremanje traje. Promjene idu u red, red se
 * prazni 800 ms nakon prestanka tipkanja, i obavezno prije prelaska na sljedeću
 * sekciju. Ako slanje padne, stavke ostaju u redu i idu s idućim pokušajem —
 * ne gube se.
 *
 * Red je Map po ključu pitanje+instanca, pa deset izmjena istog polja završi
 * kao jedan zapis, a ne deset zahtjeva.
 */

const ODGODA_MS = 800
const RAZMAK_PONOVNOG_MS = 4000

export function useSpremanje(token) {
  const [stanje, postaviStanje] = useState('mirno') // mirno | sprema | spremljeno | greska
  const red = useRef(new Map())
  const odgoda = useRef(null)
  const uTijeku = useRef(false)
  const ziv = useRef(true)

  useEffect(() => {
    ziv.current = true
    return () => {
      ziv.current = false
      clearTimeout(odgoda.current)
    }
  }, [])

  const posalji = useCallback(async () => {
    if (uTijeku.current || !red.current.size || !token) return

    // Stavke se vade iz reda prije slanja, ali se vraćaju ako slanje padne —
    // inače bi promjena nastala tijekom neuspjelog slanja pregazila povratak.
    const poslano = [...red.current.values()]
    red.current.clear()
    uTijeku.current = true
    postaviStanje('sprema')

    try {
      await spremiOdgovore(token, poslano)
      if (!ziv.current) return
      postaviStanje(red.current.size ? 'sprema' : 'spremljeno')
    } catch {
      for (const stavka of poslano) {
        const k = `${stavka.pitanje_id}:${stavka.instanca}`
        if (!red.current.has(k)) red.current.set(k, stavka)
      }
      if (!ziv.current) return
      postaviStanje('greska')
      odgoda.current = setTimeout(posalji, RAZMAK_PONOVNOG_MS)
    } finally {
      uTijeku.current = false
      if (ziv.current && red.current.size && !odgoda.current) {
        odgoda.current = setTimeout(posalji, ODGODA_MS)
      }
    }
  }, [token])

  const zabiljezi = useCallback(
    (pitanjeId, instanca, odgovor) => {
      red.current.set(`${pitanjeId}:${instanca || ''}`, {
        pitanje_id: pitanjeId,
        instanca: instanca || '',
        odgovor,
      })
      clearTimeout(odgoda.current)
      odgoda.current = setTimeout(posalji, ODGODA_MS)
    },
    [posalji],
  )

  /** Prazni red odmah — poziva se prije prelaska na sljedeću sekciju. */
  const isprazni = useCallback(() => {
    clearTimeout(odgoda.current)
    odgoda.current = null
    return posalji()
  }, [posalji])

  // Zatvaranje kartice s nespremljenim odgovorima traži potvrdu. Preglednik
  // pokazuje vlastiti tekst; ovo samo kaže da pitanje treba postaviti.
  useEffect(() => {
    function upozori(e) {
      if (!red.current.size) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', upozori)
    return () => window.removeEventListener('beforeunload', upozori)
  }, [])

  return { stanje, zabiljezi, isprazni, imaNespremljenih: () => red.current.size > 0 }
}
