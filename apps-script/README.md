# Backend — Apps Script Web App

Kod živi u gitu, ali se deploya ručno. Ovaj folder je izvor istine — ako mijenjaš
skriptu u Google editoru, prenesi izmjenu natrag ovamo, inače se sljedeći deploy vrati unatrag.

## Prva instalacija

Skripta je **container-bound** — vezana je na sam Sheet, pa joj ne treba Sheet ID
ni poseban pristup.

1. Otvori Google Sheet s tabovima `PITANJA`, `ODGOVORI`, `KLIJENTI`, `CONFIG`.
2. **Extensions → Apps Script**.
3. Obriši sadržaj `Code.gs` i zalijepi cijeli [`Code.gs`](./Code.gs) iz ovog foldera.
4. Spremi (⌘S).

## Deploy

**Deploy → New deployment → Web app**, s ove tri postavke:

| Polje | Vrijednost |
| --- | --- |
| Description | bilo što, npr. `onboarding v1` |
| Execute as | **Me** (vlasnik skripte) |
| Who has access | **Anyone** |

Bez `Execute as: Me` skripta nema pravo pisati u Sheet. Bez `Anyone` je frontend
uopće ne može pozvati — dobiva HTML stranicu za prijavu umjesto JSON-a.

Prvi put Google traži autorizaciju i pokaže ekran "Google hasn't verified this app".
To je očekivano za vlastitu skriptu: **Advanced → Go to … (unsafe)**.

Kopiraj `/exec` URL koji dobiješ i upiši ga u `.env` frontenda kao `VITE_API_URL`.

> Kod svake izmjene koda radi **Deploy → Manage deployments → uredi → Version: New version**.
> Ako umjesto toga napraviš novi deployment, dobiješ novi URL i moraš mijenjati `.env`.

## Tab CONFIG

Sheet `ONBOARDING-DB` trenutno ima tabove `DASHBOARD`, `PITANJA`, `UPUTE`, `ODGOVORI`,
`KLIJENTI` i `PREGLED`. Taba `CONFIG` nema, iako ga specifikacija spominje.

Skripta radi i bez njega — vraća upozorenje umjesto da padne. Ali dvije stvari tada ne rade
kako su zamišljene: provjera `schema_verzija` pri startu (aplikacija bi trebala stati ako se
verzija ne poklapa, umjesto da tiho sprema krive podatke) i `max_programa_dubinski`, koji
određuje koliko se puta blok pitanja ponavlja. Bez njega se koristi ugrađena vrijednost 2.

Da to proradi, dodaj tab `CONFIG` s dva stupca i ovim recima:

| kljuc | vrijednost |
| --- | --- |
| `schema_verzija` | `1` |
| `max_programa_dubinski` | `2` |
| `bm_id` | tvoj Business Manager ID |
| `ghl_affiliate_link` | GHL affiliate link |
| `min_slika` | koliko fotografija tražiš |
| `min_testimonijala` | koliko testimonijala tražiš |

Nazivi stupaca smiju biti `kljuc`/`vrijednost`, `ključ`/`vrijednost` ili `key`/`value` —
skripta prepoznaje sve tri varijante, a ako ne prepozna nijednu uzima prva dva stupca.

Nakon dodavanja tab osvježi keš: otvori `?action=schema&svjeze=1`.

## Provjera da radi

Otvori u pregledniku:

```
<TVOJ_EXEC_URL>?action=schema
```

Trebaš vidjeti JSON s `schema_verzija`, `config` i poljem `pitanja`. Ako vidiš
`{"greska":"server", ...}`, poruka imenuje što fali — najčešće krivo napisan naziv
taba ili stupca.

Zatim sesiju jednog klijenta, s pravim tokenom iz stupca `token`:

```
<TVOJ_EXEC_URL>?action=session&t=abc123xyz
```

Upis se testira iz konzole preglednika:

```js
await fetch('<TVOJ_EXEC_URL>', {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({
    token: 'abc123xyz',
    odgovori: [{ pitanje_id: 'q001', instanca: '', odgovor: 'test' }],
  }),
}).then((r) => r.json())
```

Pošalji isti zahtjev dvaput s različitim `odgovor` — u tabu `ODGOVORI` mora ostati
**jedan** redak s novom vrijednošću. Ako se pojave dva, upsert ne radi i ne ide se dalje.

## Zašto `Content-Type: text/plain`

Apps Script ne odgovara na CORS preflight. Svaki `application/json` POST iz preglednika
pokreće `OPTIONS` zahtjev koji Apps Script ne zna obraditi, pa poziv padne prije nego
dođe do koda. `text/plain` je jedan od tipova koji preflight ne izaziva, pa zahtjev ide
direktno. Tijelo je i dalje JSON — `doPost` ga parsira iz `e.postData.contents`.

Ovo nije stvar stila. Ako netko promijeni zaglavlje u `application/json`, spremanje
prestane raditi u produkciji, a lokalni `curl` test i dalje prolazi jer curl ne radi preflight.

## Endpointi

| Zahtjev | Vraća |
| --- | --- |
| `GET ?action=schema` | `{ schema_verzija, config, pitanja: [...] }`, samo `aktivno = DA`, keširano 5 min |
| `GET ?action=schema&svjeze=1` | isto, ali zaobilazi keš — koristi nakon uređivanja PITANJA |
| `GET ?action=session&t=TOKEN` | `{ klijent, odgovori }` ili `{ greska: "nepoznat_token" }` |
| `POST` | `{ ok, spremljeno, klijent_azuriran }` |

Tijelo POST-a:

```json
{
  "token": "abc123xyz",
  "odgovori": [{ "pitanje_id": "q042", "instanca": "1", "odgovor": "..." }],
  "status_quiz": "Gotovo"
}
```

`status_quiz` i `faza` su neobavezni. To su jedina dva stupca u `KLIJENTI` koja
skripta smije mijenjati — sve ostalo samo čita.

Web App ne može vratiti HTTP status kod, pa greške dolaze kao `200` s poljem `greska`
u tijelu: `nema_tokena`, `nepoznat_token`, `neispravan_json`, `zauzeto`, `server`.

## Testovi

```bash
npm run test:backend
```

Pokreće [`test.mjs`](./test.mjs), koji mockira Apps Script API nad običnom matricom i
provjerava logiku bez deploya: upsert prepisuje umjesto da dodaje, `instanca` razdvaja
retke istog pitanja, premještanje stupaca u Sheetu ništa ne lomi, `ghl_contact_id` i
`napomena` ne izlaze prema frontendu, a `PITANJA` ostaje netaknut.

Ne zamjenjuje provjeru na pravom Sheetu, ali hvata regresije. Pokreni ga nakon svake
izmjene `Code.gs`, prije deploya.
