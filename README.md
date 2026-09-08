# Onboarding — Tvornica Edukacija

Web aplikacija kroz koju novi klijent agencije, odmah nakon uplate, predaje sve
informacije potrebne za izradu svog marketinškog sustava.

Tri dijela: uvodna stranica, quiz sa 62 pitanja (uvjetna logika i ponavljajući
blokovi), pa završni ekran s checklistom preostalih zadataka.

Nema registracije ni lozinke. Klijent ulazi preko linka s tokenom: `?t=abc123xyz`.

## Stack

| Sloj | Tehnologija |
| --- | --- |
| Frontend | React + Vite, bez UI biblioteke, obični CSS s brand tokenima |
| Hosting | Vercel, deploy iz ovog repoa |
| Backend | Google Apps Script Web App |
| Baza | Google Sheets |

Nema Node servera, nema baze podataka, nema autentikacije. Apps Script je jedini backend.

## Struktura

```
src/            React aplikacija
  styles/       Brand tokeni
apps-script/    Backend — živi u gitu, deploya se ručno
public/         Statični materijali
```

## Pokretanje

```bash
npm install
npm run dev
```

Backend URL ide u `.env`:

```
VITE_API_URL=https://script.google.com/macros/s/.../exec
```

Kako doći do tog URL-a piše u [`apps-script/README.md`](./apps-script/README.md).

```bash
npm run build          # produkcijski build
npm run test:backend   # testovi Apps Script logike, bez deploya
```

## Vizualni identitet

Izvor istine je skill `tvornica-edukacija-brend`. Paleta, tipografija, sustav ploča
i pravila crteža dolaze odatle i ne improviziraju se u kodu.

Konstante su u [`src/styles/tokens.css`](./src/styles/tokens.css). Ako neko pravilo
treba iznimku, prvo se mijenja skill, pa onda taj file — nikad obrnuto.

Kratko, da se ne mora tražiti: tinta `#14121A` na papiru `#F4EFE6`, rust `#AD753C`
samo za CTA i brand, marker `#E5A11C` samo kao podvlaka. Fraunces za naslove, Jost
za tekst. Treći font se ne uvodi. Bijela pozadina se ne koristi nigdje.

## Pravila koja se ne krše

Ova četiri su razlog zašto sustav preživi Karlovo uređivanje Sheeta:

1. **Stupci se čitaju po nazivu, nikad po indeksu.** Ako naiđeš na `row[4]`, to je bug.
   Stupci se smiju premještati i dodavati bez diranja koda.
2. **Upis u `ODGOVORI` je upsert po ključu `klijent_id + pitanje_id + instanca`.**
   Promjena odgovora prepisuje redak. Drugi redak za isto pitanje bi u tabu `PREGLED`
   spojio stari i novi odgovor u istu ćeliju.
3. **U tab `PITANJA` se nikad ne piše.** Uređuje ga Karlo ručno.
4. **`schema_verzija` se provjerava pri startu.** Ako se ne poklapa s očekivanom,
   aplikacija staje s jasnom porukom umjesto da tiho spremi krive podatke.
   Zahtijeva tab `CONFIG`, kojeg u Sheetu trenutno nema — vidi
   [`apps-script/README.md`](./apps-script/README.md#tab-config).

## Stanje

- [x] Backend — `apps-script/Code.gs`, 76 testova prolazi, uključujući pravih 62 pitanja iz Sheeta
- [ ] Provjera backenda na pravom Sheetu (deploy + `?action=schema`)
- [ ] Skeleton frontenda — učitavanje sheme
- [ ] Renderiranje po tipu pitanja
- [ ] Uvjetna logika i ponavljajući blokovi
- [ ] Autosave i nastavak gdje se stalo
- [ ] Uvodna stranica i završni ekran
- [ ] Vizualni identitet
