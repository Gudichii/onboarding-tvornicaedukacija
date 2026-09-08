# Deploy — novi GitHub repo + Vercel

Kratki vodič: iz ovog koda napraviti novi repo `Gudichii/onboarding-tvornicaedukacija`
(svježa povijest, bez starih commitova) i spojiti ga na Vercel.

## 1. Napravi prazan repo na GitHubu

<https://github.com/new>

- **Repository name:** `onboarding-tvornicaedukacija`
- **Owner:** `Gudichii`
- **Visibility:** Private (ili Public — kako želiš)
- **Ne** označavaj "Add a README", "Add .gitignore" ni licencu — repo mora ostati prazan,
  inače prvi push traži merge.

## 2. Gurni kod kao svježi početak

U root folderu projekta (lokalno, gdje imaš svoj GitHub login):

```bash
# 1. novi orphan branch = jedan čisti commit, bez stare povijesti
git checkout --orphan fresh-start
git add -A
git commit -m "Initial commit"

# 2. preimenuj u main i spoji na novi repo
git branch -M main
git remote add new-origin https://github.com/Gudichii/onboarding-tvornicaedukacija.git
git push -u new-origin main
```

Stari repo (`Gudichii/altroMedia`) ostaje netaknut — i dalje je spojen kao `origin`.

## 3. Spoji na Vercel

<https://vercel.com/new>

1. **Import Git Repository** → odaberi `Gudichii/onboarding-tvornicaedukacija`.
   Ako se repo ne pojavi na popisu: *Adjust GitHub App Permissions* → daj Vercelu
   pristup tom repou (privatni repozitoriji nisu vidljivi dok se ne odobre).
2. Vercel automatski prepozna Next.js. Ništa ne mijenjaj:
   - Framework Preset: **Next.js**
   - Build Command: `next build`
   - Output Directory: `.next`
   - Install Command: `npm install`
3. **Environment Variables:** projekt ih trenutno uopće ne koristi (nema nijednog
   `process.env` poziva). Kontakt forma šalje mail preko `emailjs-com`, a service ID,
   template ID i public key su upisani direktno u `src/Navigation/Contact.js`. To su
   client-side EmailJS ključevi pa nisu tajna u klasičnom smislu, ali ako repo ideš
   javno objaviti — prebaci ih u `NEXT_PUBLIC_*` env varijable i dodaj ih ovdje
   prije deploya.
4. **Deploy.**

Nakon toga svaki push na `main` radi produkcijski deploy, a svaki drugi branch / pull request
dobiva svoj preview URL.

## 4. Domena (opcionalno)

Vercel projekt → **Settings → Domains → Add** → upiši domenu i postavi DNS zapise
koje Vercel ispiše kod svog registrara.

## Napomene o buildu

- Build je provjeren lokalno (`npm run build`) i prolazi.
- Vercel builda na Linuxu, koji je **case-sensitive** za imena datoteka. Pazi da se
  importi slika poklapaju s pravim imenom datoteke do znaka — takav nesklad ne puca
  na Windowsu/macOS-u, ali ruši build na Vercelu.
