/**
 * Testovi za Code.gs — pokrecu se lokalno, bez deploya.
 *
 *   node apps-script/test.mjs
 *
 * Apps Script API (SpreadsheetApp, CacheService, LockService, ...) je ovdje
 * mockan nad obicnom 2D matricom, pa se logika citanja i upserta moze provjeriti
 * prije nego kod uopce ode u Google. Ne zamjenjuje provjeru na pravom Sheetu,
 * ali hvata regresije u pravilima koja se ne smiju slomiti.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import vm from 'node:vm';

const ovdje = dirname(fileURLToPath(import.meta.url));

/* ---------------------------------------------------------------- *
 * Mock Apps Script okruzenja
 * ---------------------------------------------------------------- */

function napraviSheet(naziv, redci) {
  // grid se drzi kao svojstvo objekta, ne u closureu, da ga test moze
  // zamijeniti (tabovi.PITANJA.grid = ...) i da to zaista utjece na citanje.
  const sheet = {
    naziv,
    grid: redci.map((r) => r.slice()),

    _poravnaj() {
      const w = this.grid.reduce((m, r) => Math.max(m, r.length), 0);
      this.grid.forEach((r) => { while (r.length < w) r.push(''); });
    },

    getDataRange() {
      sheet._poravnaj();
      return { getValues: () => sheet.grid.map((r) => r.slice()) };
    },

    getRange(red, stupac) {
      return {
        setValues(vrijednosti) {
          for (let i = 0; i < vrijednosti.length; i++) {
            const ciljni = red - 1 + i;
            while (sheet.grid.length <= ciljni) sheet.grid.push([]);
            for (let j = 0; j < vrijednosti[i].length; j++) {
              sheet.grid[ciljni][stupac - 1 + j] = vrijednosti[i][j];
            }
          }
          sheet._poravnaj();
        },
        setValue(v) {
          const ciljni = red - 1;
          while (sheet.grid.length <= ciljni) sheet.grid.push([]);
          sheet.grid[ciljni][stupac - 1] = v;
          sheet._poravnaj();
        },
        setNumberFormat() { return this; }
      };
    }
  };
  return sheet;
}

function napraviOkruzenje(tabovi) {
  const kes = new Map();
  return {
    SpreadsheetApp: {
      getActive: () => ({ getSheetByName: (n) => tabovi[n] || null })
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k) => (kes.has(k) ? kes.get(k) : null),
        put: (k, v) => kes.set(k, v)
      })
    },
    LockService: {
      getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} })
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (s) => ({ _tekst: s, setMimeType() { return this; } })
    },
    Utilities: {
      formatDate: (d) => {
        const p = (n) => String(n).padStart(2, '0');
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      }
    },
    Session: { getScriptTimeZone: () => 'Europe/Zagreb' }
  };
}

function ucitajBackend(tabovi) {
  const kod = readFileSync(join(ovdje, 'Code.gs'), 'utf8');
  const kontekst = vm.createContext(napraviOkruzenje(tabovi));
  vm.runInContext(kod, kontekst);
  return kontekst;
}

const tijelo = (odgovor) => JSON.parse(odgovor._tekst);

/* ---------------------------------------------------------------- *
 * Testni podaci
 * ---------------------------------------------------------------- */

const ZAGLAVLJE_PITANJA = [
  'id', 'blok', 'faza', 'sekcija', 'redoslijed', 'pitanje', 'pomoc', 'tip',
  'opcije', 'obavezno', 'uvjet_pitanje', 'uvjet_vrijednost', 'aktivno'
];

function pitanje(id, izmjene = {}) {
  const osnova = {
    id, blok: '', faza: '1', sekcija: '1 · Osnovno', redoslijed: 1,
    pitanje: 'Tekst ' + id, pomoc: '', tip: 'tekst', opcije: '',
    obavezno: 'DA', uvjet_pitanje: '', uvjet_vrijednost: '', aktivno: 'DA'
  };
  const spojeno = { ...osnova, ...izmjene };
  return ZAGLAVLJE_PITANJA.map((s) => spojeno[s]);
}

function svjeziTabovi(opcije = {}) {
  const zaglavljeKlijenti = opcije.zaglavljeKlijenti || [
    'klijent_id', 'ime', 'brand', 'email', 'token', 'drive_folder_url',
    'ghl_contact_id', 'datum_starta', 'faza', 'status_quiz', 'napomena'
  ];
  const redKlijenta = {
    klijent_id: 'k001', ime: 'Ana Anic', brand: 'Oslobodena', email: 'ana@primjer.hr',
    token: 'abc123xyz', drive_folder_url: 'https://drive.example/k001',
    ghl_contact_id: 'ghl_tajni_id', datum_starta: '2026-09-01', faza: '1',
    status_quiz: 'U tijeku', napomena: 'interna biljeska, ne smije van'
  };

  return {
    PITANJA: napraviSheet('PITANJA', [
      ZAGLAVLJE_PITANJA,
      pitanje('q001'),
      pitanje('q002', { tip: 'lista', obavezno: 'NE' }),
      pitanje('q003', { aktivno: 'NE' }),
      pitanje('q004', { blok: 'program', sekcija: '7 · Dubinski po programu' })
    ]),
    ODGOVORI: napraviSheet('ODGOVORI', [
      ['timestamp', 'klijent_id', 'pitanje_id', 'instanca', 'odgovor'],
      ...(opcije.odgovori || [])
    ]),
    KLIJENTI: napraviSheet('KLIJENTI', [
      zaglavljeKlijenti,
      zaglavljeKlijenti.map((s) => redKlijenta[s])
    ]),
    CONFIG: napraviSheet('CONFIG', [
      ['kljuc', 'vrijednost'],
      ['schema_verzija', '1'],
      ['max_programa_dubinski', '2'],
      ['min_slika', '10']
    ])
  };
}

/* ---------------------------------------------------------------- *
 * Testovi
 * ---------------------------------------------------------------- */

let pao = 0;
let prosao = 0;

function provjeri(naziv, uvjet, detalj) {
  if (uvjet) {
    prosao++;
    console.log('  ok   ' + naziv);
  } else {
    pao++;
    console.log('  PAO  ' + naziv + (detalj ? '\n       ' + detalj : ''));
  }
}

function test(naziv, fn) {
  console.log('\n' + naziv);
  fn();
}

/* -- schema -- */

test('action=schema', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  const rez = tijelo(api.doGet({ parameter: { action: 'schema' } }));

  provjeri('vraca schema_verzija iz CONFIG-a', rez.schema_verzija === '1', 'dobio: ' + rez.schema_verzija);
  provjeri('CONFIG dolazi kao mapa', rez.config.max_programa_dubinski === '2');
  provjeri('preskace aktivno = NE', rez.pitanja.every((p) => p.id !== 'q003'));
  provjeri('vraca preostala pitanja', rez.pitanja.length === 3, 'dobio: ' + rez.pitanja.length);
  provjeri('obavezno je boolean', rez.pitanja[0].obavezno === true);
  provjeri('prepoznaje blok pitanja', rez.pitanja.some((p) => p.blok === 'program'));
  provjeri('u PITANJA se nije pisalo', tabovi.PITANJA.grid.length === 5);
});

test('schema se kesira, ali svjeze=1 zaobilazi kes', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  api.doGet({ parameter: { action: 'schema' } });

  tabovi.PITANJA.grid.push(pitanje('q009'));
  const izKesa = tijelo(api.doGet({ parameter: { action: 'schema' } }));
  provjeri('drugi poziv dolazi iz kesa', izKesa.pitanja.length === 3);

  const svjeze = tijelo(api.doGet({ parameter: { action: 'schema', svjeze: '1' } }));
  provjeri('svjeze=1 cita ponovno iz sheeta', svjeze.pitanja.length === 4);
});

/* -- neovisnost o redoslijedu stupaca -- */

test('citanje po nazivu stupca, ne po indeksu', () => {
  const tabovi = svjeziTabovi();
  // Karlo premjesta stupce: obrnuti redoslijed cijelog taba PITANJA.
  tabovi.PITANJA.grid = tabovi.PITANJA.grid.map((r) => r.slice().reverse());

  const api = ucitajBackend(tabovi);
  const rez = tijelo(api.doGet({ parameter: { action: 'schema' } }));
  provjeri('premjesteni stupci ne lome nista', rez.pitanja.length === 3);
  provjeri('vrijednosti su i dalje na pravim poljima', rez.pitanja[0].id === 'q001' && rez.pitanja[0].tip === 'tekst');
});

test('nedostajuci stupac daje jasnu gresku, ne tihi krivi podatak', () => {
  const tabovi = svjeziTabovi();
  tabovi.PITANJA.grid[0][7] = 'vrsta'; // 'tip' preimenovan
  const api = ucitajBackend(tabovi);
  const rez = tijelo(api.doGet({ parameter: { action: 'schema' } }));
  provjeri('vraca gresku', rez.greska === 'server');
  provjeri('poruka imenuje stupac', /tip/.test(rez.poruka || ''), 'poruka: ' + rez.poruka);
});

/* -- session -- */

test('action=session', () => {
  const api = ucitajBackend(svjeziTabovi());
  const rez = tijelo(api.doGet({ parameter: { action: 'session', t: 'abc123xyz' } }));

  provjeri('nalazi klijenta po tokenu', rez.klijent.ime === 'Ana Anic');
  provjeri('salje drive_folder_url', rez.klijent.drive_folder_url === 'https://drive.example/k001');
  provjeri('NE salje ghl_contact_id', !('ghl_contact_id' in rez.klijent));
  provjeri('NE salje napomenu', !('napomena' in rez.klijent));
  provjeri('NE salje email', !('email' in rez.klijent));
  provjeri('NE vraca token natrag', !('token' in rez.klijent));
});

test('nepoznat token', () => {
  const api = ucitajBackend(svjeziTabovi());
  const rez = tijelo(api.doGet({ parameter: { action: 'session', t: 'nepostoji' } }));
  provjeri('vraca oblik greske, ne prazan objekt', rez.greska === 'nepoznat_token');
  provjeri('ne curi nista o klijentima', !('klijent' in rez));
});

test('bez tokena', () => {
  const api = ucitajBackend(svjeziTabovi());
  const rez = tijelo(api.doGet({ parameter: { action: 'session' } }));
  provjeri('vraca nema_tokena', rez.greska === 'nema_tokena');
});

/* -- upsert -- */

function posalji(api, tijeloZahtjeva) {
  return tijelo(api.doPost({ postData: { contents: JSON.stringify(tijeloZahtjeva) } }));
}

const brojRedaka = (tabovi) => tabovi.ODGOVORI.grid.length - 1;
const nadjiRed = (tabovi, pitanjeId, instanca = '') =>
  tabovi.ODGOVORI.grid.slice(1).find((r) => r[2] === pitanjeId && r[3] === instanca);

test('POST dodaje novi odgovor', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  const rez = posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q001', instanca: '', odgovor: 'prvi' }] });

  provjeri('vraca ok', rez.ok === true && rez.spremljeno === 1);
  provjeri('redak je u ODGOVORI', brojRedaka(tabovi) === 1);
  provjeri('klijent_id je popunjen iz tokena', nadjiRed(tabovi, 'q001')[1] === 'k001');
  provjeri('odgovor je spremljen', nadjiRed(tabovi, 'q001')[4] === 'prvi');
  provjeri('timestamp je popunjen', String(nadjiRed(tabovi, 'q001')[0]).length > 0);
});

test('drugi POST s istim kljucem PREPISUJE, ne dodaje', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q001', instanca: '', odgovor: 'prvi' }] });
  posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q001', instanca: '', odgovor: 'ispravljeni' }] });

  provjeri('i dalje jedan redak', brojRedaka(tabovi) === 1, 'redaka: ' + brojRedaka(tabovi));
  provjeri('vrijednost je nova', nadjiRed(tabovi, 'q001')[4] === 'ispravljeni');
});

test('instanca razlikuje retke istog pitanja', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  posalji(api, {
    token: 'abc123xyz',
    odgovori: [
      { pitanje_id: 'q004', instanca: '1', odgovor: 'program jedan' },
      { pitanje_id: 'q004', instanca: '2', odgovor: 'program dva' }
    ]
  });
  provjeri('dva odvojena retka', brojRedaka(tabovi) === 2);
  provjeri('instanca 1 ispravna', nadjiRed(tabovi, 'q004', '1')[4] === 'program jedan');
  provjeri('instanca 2 ispravna', nadjiRed(tabovi, 'q004', '2')[4] === 'program dva');

  posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q004', instanca: '2', odgovor: 'ispravak' }] });
  provjeri('izmjena instance 2 ne dira instancu 1', nadjiRed(tabovi, 'q004', '1')[4] === 'program jedan');
  provjeri('i dalje dva retka', brojRedaka(tabovi) === 2);
});

test('batch od vise odgovora u jednom zahtjevu', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  const rez = posalji(api, {
    token: 'abc123xyz',
    odgovori: [
      { pitanje_id: 'q001', odgovor: 'a' },
      { pitanje_id: 'q002', odgovor: ['x', 'y'] },
      { pitanje_id: 'task_fb', odgovor: 'DA' }
    ]
  });
  provjeri('sva tri spremljena', rez.spremljeno === 3);
  provjeri('tri retka', brojRedaka(tabovi) === 3);
  provjeri('array je serijaliziran kao JSON', nadjiRed(tabovi, 'q002')[4] === '["x","y"]');
  provjeri('task_ prefiks prolazi kao obicno pitanje', nadjiRed(tabovi, 'task_fb')[4] === 'DA');
});

test('nedostajuca instanca se tretira isto kao prazna', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q001', odgovor: 'bez instance' }] });
  posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q001', instanca: '', odgovor: 'prazna instanca' }] });
  provjeri('nije nastao duplikat', brojRedaka(tabovi) === 1, 'redaka: ' + brojRedaka(tabovi));
});

test('upsert ne dira retke drugog klijenta', () => {
  const tabovi = svjeziTabovi({
    odgovori: [['2026-01-01', 'k999', 'q001', '', 'tudji odgovor']]
  });
  const api = ucitajBackend(tabovi);
  posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q001', odgovor: 'moj odgovor' }] });

  provjeri('tudji redak je netaknut', tabovi.ODGOVORI.grid[1][4] === 'tudji odgovor');
  provjeri('dodan je novi redak', brojRedaka(tabovi) === 2);
});

test('POST s nepoznatim tokenom ne pise nista', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  const rez = posalji(api, { token: 'kriv', odgovori: [{ pitanje_id: 'q001', odgovor: 'x' }] });
  provjeri('vraca gresku', rez.greska === 'nepoznat_token');
  provjeri('ODGOVORI je ostao prazan', brojRedaka(tabovi) === 0);
});

test('neispravan JSON ne rusi endpoint', () => {
  const api = ucitajBackend(svjeziTabovi());
  const rez = tijelo(api.doPost({ postData: { contents: '{ ovo nije json' } }));
  provjeri('vraca neispravan_json', rez.greska === 'neispravan_json');
});

/* -- odgovori procitani natrag -- */

test('spremljeno se cita natrag identicno', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  posalji(api, {
    token: 'abc123xyz',
    odgovori: [
      { pitanje_id: 'q001', odgovor: 'obican tekst' },
      { pitanje_id: 'q002', odgovor: '["Oslobodena","Budi zena"]' },
      { pitanje_id: 'q005', odgovor: '2026-09-08' }
    ]
  });
  const sesija = tijelo(api.doGet({ parameter: { action: 'session', t: 'abc123xyz' } }));
  const mapa = Object.fromEntries(sesija.odgovori.map((o) => [o.pitanje_id, o.odgovor]));

  provjeri('tekst', mapa.q001 === 'obican tekst');
  provjeri('JSON array ostaje string', mapa.q002 === '["Oslobodena","Budi zena"]');
  provjeri('datum ne postaje Date objekt', mapa.q005 === '2026-09-08', 'dobio: ' + mapa.q005);
});

test('Date iz sheeta izlazi kao YYYY-MM-DD', () => {
  const tabovi = svjeziTabovi({
    odgovori: [['2026-01-01', 'k001', 'q005', '', new Date(2026, 8, 8)]]
  });
  const api = ucitajBackend(tabovi);
  const sesija = tijelo(api.doGet({ parameter: { action: 'session', t: 'abc123xyz' } }));
  provjeri('formatiran kao datum', sesija.odgovori[0].odgovor === '2026-09-08', 'dobio: ' + sesija.odgovori[0].odgovor);
});

/* -- KLIJENTI -- */

test('status_quiz i faza se upisuju, ostalo ne', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  const rez = posalji(api, {
    token: 'abc123xyz',
    odgovori: [],
    status_quiz: 'Gotovo',
    faza: '2',
    napomena: 'pokusaj upisa u zabranjeni stupac',
    email: 'napadac@primjer.hr'
  });

  const red = tabovi.KLIJENTI.grid[1];
  const stupci = Object.fromEntries(tabovi.KLIJENTI.grid[0].map((n, i) => [n, i]));

  provjeri('status_quiz je upisan', red[stupci.status_quiz] === 'Gotovo');
  provjeri('faza je upisana', red[stupci.faza] === '2');
  provjeri('napomena je netaknuta', red[stupci.napomena] === 'interna biljeska, ne smije van');
  provjeri('email je netaknut', red[stupci.email] === 'ana@primjer.hr');
  provjeri('odgovor kaze sto je promijenjeno', JSON.stringify(rez.klijent_azuriran) === '["status_quiz","faza"]');
});

test('bez status_quiz u tijelu, KLIJENTI se ne dira', () => {
  const tabovi = svjeziTabovi();
  const api = ucitajBackend(tabovi);
  posalji(api, { token: 'abc123xyz', odgovori: [{ pitanje_id: 'q001', odgovor: 'x' }] });
  const stupci = Object.fromEntries(tabovi.KLIJENTI.grid[0].map((n, i) => [n, i]));
  provjeri('status ostaje U tijeku', tabovi.KLIJENTI.grid[1][stupci.status_quiz] === 'U tijeku');
});

/* -- razno -- */

test('nepoznata akcija', () => {
  const api = ucitajBackend(svjeziTabovi());
  const rez = tijelo(api.doGet({ parameter: { action: 'nesto' } }));
  provjeri('vraca nepoznata_akcija', rez.greska === 'nepoznata_akcija');
});

/* -- CONFIG je neobavezan -- */

test('bez taba CONFIG schema i dalje radi', () => {
  const tabovi = svjeziTabovi();
  delete tabovi.CONFIG;
  const api = ucitajBackend(tabovi);
  const rez = tijelo(api.doGet({ parameter: { action: 'schema' } }));

  provjeri('ne pada', rez.greska === undefined, 'greska: ' + rez.greska);
  provjeri('pitanja su tu', rez.pitanja.length === 3);
  provjeri('schema_verzija je prazna', rez.schema_verzija === '');
  provjeri('upozorenje imenuje CONFIG', (rez.upozorenja || []).some((u) => /CONFIG/.test(u)));
});

test('CONFIG bez schema_verzija daje upozorenje', () => {
  const tabovi = svjeziTabovi();
  tabovi.CONFIG.grid = [['kljuc', 'vrijednost'], ['min_slika', '10']];
  const api = ucitajBackend(tabovi);
  const rez = tijelo(api.doGet({ parameter: { action: 'schema' } }));
  provjeri('upozorava na schema_verzija', (rez.upozorenja || []).some((u) => /schema_verzija/.test(u)));
  provjeri('upozorava na max_programa_dubinski', (rez.upozorenja || []).some((u) => /max_programa_dubinski/.test(u)));
});

test('potpun CONFIG ne daje upozorenja', () => {
  const api = ucitajBackend(svjeziTabovi());
  const rez = tijelo(api.doGet({ parameter: { action: 'schema' } }));
  provjeri('nema upozorenja', (rez.upozorenja || []).length === 0, JSON.stringify(rez.upozorenja));
});

/* -- pravi podaci iz ONBOARDING-DB -- */

test('pravih 62 pitanja iz Sheeta prolazi kroz schemu', () => {
  const redci = JSON.parse(readFileSync(join(ovdje, 'fixture-pitanja.json'), 'utf8'));
  const tabovi = svjeziTabovi();
  tabovi.PITANJA = napraviSheet('PITANJA', redci);

  const api = ucitajBackend(tabovi);
  const rez = tijelo(api.doGet({ parameter: { action: 'schema' } }));

  provjeri('nazivi stupaca se poklapaju sa Sheetom', rez.greska === undefined, 'greska: ' + rez.poruka);
  provjeri('62 aktivna pitanja', rez.pitanja.length === 62, 'dobio: ' + rez.pitanja.length);
  provjeri('52 obavezna', rez.pitanja.filter((p) => p.obavezno).length === 52);
  provjeri('12 blok pitanja', rez.pitanja.filter((p) => p.blok === 'program').length === 12);
  provjeri('6 uvjetnih', rez.pitanja.filter((p) => p.uvjet_pitanje).length === 6);
  provjeri('10 sekcija', new Set(rez.pitanja.map((p) => p.sekcija)).size === 10);
  provjeri('redoslijed je broj', typeof rez.pitanja[0].redoslijed === 'number');

  // Sekcija 8 visi o q007 — klijent koji je jedini vlasnik je ne vidi.
  const vizija = rez.pitanja.filter((p) => p.sekcija.indexOf('Osobna vizija') !== -1);
  provjeri('cijela sekcija 8 je uvjetovana s q007', vizija.length === 6 && vizija.every((p) => p.uvjet_pitanje === 'q007' && p.uvjet_vrijednost === 'DA'));

  // Tipovi koje frontend mora znati iscrtati.
  const tipovi = new Set(rez.pitanja.map((p) => p.tip));
  const poznati = ['tekst', 'dugi_tekst', 'broj', 'email', 'telefon', 'url', 'datum',
    'da_ne', 'skala_1_10', 'jedan_izbor', 'vise_izbora', 'lista', 'izbor_iz_liste', 'matrica'];
  const nepoznati = [...tipovi].filter((t) => !poznati.includes(t));
  provjeri('nema tipa izvan ugovora', nepoznati.length === 0, 'nepoznato: ' + nepoznati.join(', '));

  // opcije: UPUTE tab pise @qNNN, a pravi podaci nemaju @. Parser mora primiti oboje.
  const izvori = rez.pitanja.filter((p) => p.tip === 'izbor_iz_liste' || p.tip === 'matrica').map((p) => p.opcije);
  provjeri('opcije stizu kao sirovi string', izvori.every((o) => typeof o === 'string' && o.length > 0));
  provjeri('referenca na lista pitanje je bez @', izvori.some((o) => /(?:izvor|redci)=q\d{3}/.test(o)));
});

test('upsert radi s pravim id-evima blok pitanja', () => {
  const redci = JSON.parse(readFileSync(join(ovdje, 'fixture-pitanja.json'), 'utf8'));
  const tabovi = svjeziTabovi();
  tabovi.PITANJA = napraviSheet('PITANJA', redci);
  const api = ucitajBackend(tabovi);

  posalji(api, {
    token: 'abc123xyz',
    odgovori: [
      { pitanje_id: 'q008', odgovor: ['Oslobodena', 'Budi zena novog doba'] },
      { pitanje_id: 'q042', instanca: '1', odgovor: 'kupac prvog programa' },
      { pitanje_id: 'q042', instanca: '2', odgovor: 'kupac drugog programa' }
    ]
  });

  provjeri('tri retka', brojRedaka(tabovi) === 3);
  provjeri('lista je JSON', nadjiRed(tabovi, 'q008')[4] === '["Oslobodena","Budi zena novog doba"]');
  provjeri('blok instance su odvojene', nadjiRed(tabovi, 'q042', '1')[4] !== nadjiRed(tabovi, 'q042', '2')[4]);
});

console.log('\n' + '-'.repeat(50));
console.log(`prosao: ${prosao}   pao: ${pao}`);
process.exit(pao === 0 ? 0 : 1);
