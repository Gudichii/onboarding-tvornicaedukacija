# Deploy na Vercel

Repo je javan i kod je gore na `main` (jedan clean initial commit, bez stare povijesti).
Ostaje samo spajanje na Vercel.

## 1. Import na Vercel

Direktan link: <https://vercel.com/new/import?s=https://github.com/Gudichii/onboarding-tvornicaedukacija>

Ili ručno preko <https://vercel.com/new> → **Import Git Repository** →
`Gudichii/onboarding-tvornicaedukacija`.

Vercel automatski prepozna Next.js. Ništa ne treba mijenjati:

| Postavka | Vrijednost |
| --- | --- |
| Framework Preset | Next.js |
| Build Command | `next build` |
| Output Directory | `.next` |
| Install Command | `npm install` |

Zatim **Deploy**.

## 2. Environment varijable

Nisu potrebne — projekt nema nijedan `process.env` poziv.

Kontakt forma šalje mail preko `emailjs-com`, a service ID, template ID i public key
su upisani direktno u `src/Navigation/Contact.js`. To su client-side EmailJS ključevi
koji ionako završe u JS bundleu svake deployane stranice, pa ih objava repoa ne
izlaže ništa više nego sam deploy. Ako ipak želiš da ne stoje u kodu, prebaci ih u
`NEXT_PUBLIC_*` varijable i dodaj ih u Vercel prije deploya.

## 3. Domena (opcionalno)

Vercel projekt → **Settings → Domains → Add** → upiši domenu i postavi DNS zapise
koje Vercel ispiše kod svog registrara.

## Kako radi nakon spajanja

- Push na `main` → produkcijski deploy.
- Svaki drugi branch ili pull request → vlastiti preview URL.

## Napomene o buildu

- Build je provjeren (`npm run build`) i prolazi — svih 11 ruta se generira.
- Vercel builda na Linuxu, koji je **case-sensitive** za imena datoteka. Importi slika
  moraju se poklapati s pravim imenom datoteke do znaka. Takav nesklad ne puca na
  Windowsu ni macOS-u, ali ruši build na Vercelu — jedan takav je već bio u kodu
  (`KarloImia.png` vs `KarloiMia.png`) i ispravljen je prije prvog commita.
