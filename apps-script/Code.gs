/**
 * Onboarding Tvornica Edukacija — backend
 *
 * Apps Script Web App vezan na Google Sheet (container-bound).
 * Instalacija i deploy: vidi apps-script/README.md
 *
 * Tri pravila koja ovaj kod postuje doslovno:
 *   1. Stupci se citaju po nazivu iz prvog reda, nikad po indeksu.
 *   2. Upis u ODGOVORI je upsert po kljucu klijent_id + pitanje_id + instanca.
 *   3. U tab PITANJA se nikad ne pise.
 */

var TAB = {
  PITANJA: 'PITANJA',
  ODGOVORI: 'ODGOVORI',
  KLIJENTI: 'KLIJENTI',
  CONFIG: 'CONFIG'
};

/** Polja klijenta koja smiju izaci prema frontendu. Allowlist, ne denylist —
 *  tako novi interni stupac u KLIJENTI ne procuri sam od sebe. */
var KLIJENT_JAVNA_POLJA = ['klijent_id', 'ime', 'brand', 'drive_folder_url', 'faza', 'status_quiz'];

/** Jedini stupci u KLIJENTI koje aplikacija smije mijenjati. */
var KLIJENT_UPISIVI = ['status_quiz', 'faza'];

/** Koliko se puta blok pitanja ponavlja kad CONFIG ne kaze drugacije. */
var ZADANI_MAX_PROGRAMA = 2;

var CACHE_KLJUC_SCHEMA = 'schema_v1';
var CACHE_SEKUNDI = 300;
var LOCK_MS = 30000;

/* ------------------------------------------------------------------ *
 * Ulazne tocke
 * ------------------------------------------------------------------ */

function doGet(e) {
  var p = (e && e.parameter) || {};
  try {
    if (p.action === 'schema') return json_(schema_(p.svjeze === '1'));
    if (p.action === 'session') return json_(sesija_(p.t));
    return json_({ greska: 'nepoznata_akcija', poruka: 'Podrzano: ?action=schema, ?action=session&t=TOKEN' });
  } catch (err) {
    return json_(greskaServera_(err));
  }
}

/**
 * Frontend salje Content-Type: text/plain kako preglednik ne bi radio CORS
 * preflight — Apps Script na OPTIONS ne odgovara. Tijelo je svejedno JSON,
 * pa ga ovdje parsiramo rucno.
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    if (!lock.tryLock(LOCK_MS)) {
      return json_({ greska: 'zauzeto', poruka: 'Drugo spremanje je u tijeku, pokusaj ponovno.' });
    }
    var tijelo;
    try {
      tijelo = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    } catch (errParse) {
      return json_({ greska: 'neispravan_json', poruka: String(errParse.message || errParse) });
    }
    return json_(spremi_(tijelo));
  } catch (err) {
    return json_(greskaServera_(err));
  } finally {
    try { lock.releaseLock(); } catch (errLock) {}
  }
}

/* ------------------------------------------------------------------ *
 * action=schema
 * ------------------------------------------------------------------ */

function schema_(preskociKes) {
  var kes = CacheService.getScriptCache();
  if (!preskociKes) {
    var spremljeno = kes.get(CACHE_KLJUC_SCHEMA);
    if (spremljeno) return JSON.parse(spremljeno);
  }

  var config = citajConfig_();
  var t = ucitajTablicu_(TAB.PITANJA);
  provjeriStupce_(TAB.PITANJA, t.stupci, [
    'id', 'blok', 'faza', 'sekcija', 'redoslijed', 'pitanje', 'pomoc', 'tip',
    'opcije', 'obavezno', 'uvjet_pitanje', 'uvjet_vrijednost', 'aktivno'
  ]);

  var pitanja = [];
  for (var i = 0; i < t.redci.length; i++) {
    var r = t.redci[i];
    if (tekst_(r, t.stupci, 'aktivno').toUpperCase() !== 'DA') continue;
    if (!tekst_(r, t.stupci, 'id')) continue;
    pitanja.push({
      id: tekst_(r, t.stupci, 'id'),
      blok: tekst_(r, t.stupci, 'blok'),
      faza: tekst_(r, t.stupci, 'faza'),
      sekcija: tekst_(r, t.stupci, 'sekcija'),
      redoslijed: broj_(tekst_(r, t.stupci, 'redoslijed')),
      pitanje: tekst_(r, t.stupci, 'pitanje'),
      pomoc: tekst_(r, t.stupci, 'pomoc'),
      tip: tekst_(r, t.stupci, 'tip'),
      opcije: tekst_(r, t.stupci, 'opcije'),
      obavezno: tekst_(r, t.stupci, 'obavezno').toUpperCase() === 'DA',
      uvjet_pitanje: tekst_(r, t.stupci, 'uvjet_pitanje'),
      uvjet_vrijednost: tekst_(r, t.stupci, 'uvjet_vrijednost')
    });
  }

  var rezultat = {
    schema_verzija: String(config.schema_verzija || ''),
    config: config,
    pitanja: pitanja,
    upozorenja: upozorenjaSheeta_(config)
  };

  // CacheService puca preko 100 KB po kljucu. Ako schema naraste, radimo bez kesa.
  try {
    kes.put(CACHE_KLJUC_SCHEMA, JSON.stringify(rezultat), CACHE_SEKUNDI);
  } catch (errKes) {}

  return rezultat;
}

/**
 * CONFIG je kljuc-vrijednost. Tab je neobavezan: ako ga nema, vracamo prazno
 * i upozorenje, umjesto da cijeli ?action=schema padne. Nazivi stupaca nisu
 * fiksirani u shemi, pa prepoznajemo uobicajene varijante, a ako ih nema
 * padamo na prva dva stupca.
 */
function citajConfig_() {
  var t = ucitajTablicu_(TAB.CONFIG, true);
  if (!t.postoji) return {};

  var iKljuc = prviPostojeci_(t.stupci, ['kljuc', 'ključ', 'key', 'naziv']);
  var iVrijednost = prviPostojeci_(t.stupci, ['vrijednost', 'value', 'val']);
  if (iKljuc === null) iKljuc = 0;
  if (iVrijednost === null) iVrijednost = 1;

  var config = {};
  for (var i = 0; i < t.redci.length; i++) {
    var kljuc = String(t.redci[i][iKljuc] || '').trim();
    if (!kljuc) continue;
    config[kljuc] = uString_(t.redci[i][iVrijednost]);
  }
  return config;
}

/* ------------------------------------------------------------------ *
 * action=session
 * ------------------------------------------------------------------ */

function sesija_(token) {
  token = String(token || '').trim();
  if (!token) return { greska: 'nema_tokena', poruka: 'Nedostaje parametar t.' };

  var nadjen = nadjiKlijenta_(token);
  if (!nadjen) return { greska: 'nepoznat_token', poruka: 'Token ne postoji.' };

  var klijentId = tekst_(nadjen.redak, nadjen.tablica.stupci, 'klijent_id');

  var klijent = {};
  for (var i = 0; i < KLIJENT_JAVNA_POLJA.length; i++) {
    var polje = KLIJENT_JAVNA_POLJA[i];
    if (nadjen.tablica.stupci.hasOwnProperty(polje)) {
      klijent[polje] = tekst_(nadjen.redak, nadjen.tablica.stupci, polje);
    }
  }

  return { klijent: klijent, odgovori: citajOdgovore_(klijentId) };
}

function nadjiKlijenta_(token) {
  var t = ucitajTablicu_(TAB.KLIJENTI);
  provjeriStupce_(TAB.KLIJENTI, t.stupci, ['klijent_id', 'token']);
  for (var i = 0; i < t.redci.length; i++) {
    if (tekst_(t.redci[i], t.stupci, 'token') === token) {
      return { tablica: t, redak: t.redci[i], indeks: i };
    }
  }
  return null;
}

function citajOdgovore_(klijentId) {
  var t = ucitajTablicu_(TAB.ODGOVORI);
  provjeriStupce_(TAB.ODGOVORI, t.stupci, ['klijent_id', 'pitanje_id', 'instanca', 'odgovor']);
  var out = [];
  for (var i = 0; i < t.redci.length; i++) {
    var r = t.redci[i];
    if (tekst_(r, t.stupci, 'klijent_id') !== klijentId) continue;
    out.push({
      pitanje_id: tekst_(r, t.stupci, 'pitanje_id'),
      instanca: tekst_(r, t.stupci, 'instanca'),
      odgovor: tekst_(r, t.stupci, 'odgovor')
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * POST — batch upsert
 * ------------------------------------------------------------------ */

function spremi_(tijelo) {
  var token = String(tijelo.token || '').trim();
  if (!token) return { greska: 'nema_tokena', poruka: 'Nedostaje token.' };

  var nadjen = nadjiKlijenta_(token);
  if (!nadjen) return { greska: 'nepoznat_token', poruka: 'Token ne postoji.' };

  var klijentId = tekst_(nadjen.redak, nadjen.tablica.stupci, 'klijent_id');
  var stavke = tijelo.odgovori || [];
  var upisano = upsertOdgovore_(klijentId, stavke);
  var status = azurirajKlijenta_(nadjen, tijelo);

  return { ok: true, spremljeno: upisano, klijent_azuriran: status };
}

function upsertOdgovore_(klijentId, stavke) {
  if (!stavke.length) return 0;

  var sheet = SpreadsheetApp.getActive().getSheetByName(TAB.ODGOVORI);
  if (!sheet) throw new Error('Nedostaje tab: ' + TAB.ODGOVORI);

  var vrijednosti = sheet.getDataRange().getValues();
  if (!vrijednosti.length) throw new Error('Tab ' + TAB.ODGOVORI + ' nema red sa zaglavljem.');

  var stupci = mapaStupaca_(vrijednosti[0]);
  provjeriStupce_(TAB.ODGOVORI, stupci, ['timestamp', 'klijent_id', 'pitanje_id', 'instanca', 'odgovor']);
  var sirina = vrijednosti[0].length;

  // Indeks postojecih redaka po kljucu klijent_id + pitanje_id + instanca.
  var indeks = {};
  for (var i = 1; i < vrijednosti.length; i++) {
    var r = vrijednosti[i];
    var id = uString_(r[stupci.klijent_id]);
    if (!id) continue;
    indeks[kljucOdgovora_(id, uString_(r[stupci.pitanje_id]), uString_(r[stupci.instanca]))] = i;
  }

  var sada = new Date().toISOString();
  var brojac = 0;

  for (var j = 0; j < stavke.length; j++) {
    var s = stavke[j];
    var pitanjeId = String(s.pitanje_id || '').trim();
    if (!pitanjeId) continue;

    var instanca = String(s.instanca == null ? '' : s.instanca).trim();
    var odgovor = serijaliziraj_(s.odgovor);
    var kljuc = kljucOdgovora_(klijentId, pitanjeId, instanca);

    if (indeks.hasOwnProperty(kljuc)) {
      var red = vrijednosti[indeks[kljuc]];
      red[stupci.timestamp] = sada;
      red[stupci.odgovor] = odgovor;
    } else {
      var novi = novRedak_(sirina);
      novi[stupci.timestamp] = sada;
      novi[stupci.klijent_id] = klijentId;
      novi[stupci.pitanje_id] = pitanjeId;
      novi[stupci.instanca] = instanca;
      novi[stupci.odgovor] = odgovor;
      vrijednosti.push(novi);
      indeks[kljuc] = vrijednosti.length - 1;
    }
    brojac++;
  }

  // Odgovori se cuvaju kao tekst. Bez toga Sheets pretvori "2026-09-08" u
  // datum i "007" u broj, pa se procitana vrijednost ne poklapa sa spremljenom.
  sheet.getRange(2, stupci.odgovor + 1, Math.max(vrijednosti.length - 1, 1), 1).setNumberFormat('@');
  sheet.getRange(1, 1, vrijednosti.length, sirina).setValues(vrijednosti);

  return brojac;
}

/** Upisuje samo status_quiz i faza, i to samo ako su poslani. */
function azurirajKlijenta_(nadjen, tijelo) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(TAB.KLIJENTI);
  var promijenjeno = [];

  for (var i = 0; i < KLIJENT_UPISIVI.length; i++) {
    var polje = KLIJENT_UPISIVI[i];
    if (!tijelo.hasOwnProperty(polje)) continue;
    if (!nadjen.tablica.stupci.hasOwnProperty(polje)) continue;
    var redUSheetu = nadjen.indeks + 2; // +1 zaglavlje, +1 jer su redci 1-indeksirani
    sheet.getRange(redUSheetu, nadjen.tablica.stupci[polje] + 1).setValue(uString_(tijelo[polje]));
    promijenjeno.push(polje);
  }
  return promijenjeno;
}

/* ------------------------------------------------------------------ *
 * Pomocne funkcije
 * ------------------------------------------------------------------ */

function ucitajTablicu_(nazivTaba, neobavezan) {
  var sheet = SpreadsheetApp.getActive().getSheetByName(nazivTaba);
  if (!sheet) {
    if (neobavezan) return { sheet: null, stupci: {}, redci: [], postoji: false };
    throw new Error('Nedostaje tab: ' + nazivTaba);
  }
  var vrijednosti = sheet.getDataRange().getValues();
  if (!vrijednosti.length) return { sheet: sheet, stupci: {}, redci: [], postoji: true };
  return {
    sheet: sheet,
    stupci: mapaStupaca_(vrijednosti[0]),
    redci: vrijednosti.slice(1),
    postoji: true
  };
}

/**
 * Sto u Sheetu fali da bi aplikacija radila po specifikaciji. Vraca se uz
 * schemu da se vidi odmah kod provjere u pregledniku, umjesto da se otkrije
 * tek kad frontend stane bez objasnjenja.
 */
function upozorenjaSheeta_(config) {
  var poruke = [];
  if (!SpreadsheetApp.getActive().getSheetByName(TAB.CONFIG)) {
    poruke.push('Nema taba CONFIG. Provjera schema_verzija i broj ponavljanja bloka rade s ugradenim vrijednostima.');
  } else if (!config.schema_verzija) {
    poruke.push('CONFIG nema redak schema_verzija.');
  }
  if (!config.max_programa_dubinski) {
    poruke.push('CONFIG nema redak max_programa_dubinski, koristi se ' + ZADANI_MAX_PROGRAMA + '.');
  }
  return poruke;
}

function mapaStupaca_(zaglavlje) {
  var stupci = {};
  for (var i = 0; i < zaglavlje.length; i++) {
    var naziv = String(zaglavlje[i] || '').trim();
    if (naziv) stupci[naziv] = i;
  }
  return stupci;
}

function provjeriStupce_(nazivTaba, stupci, obavezni) {
  var nedostaju = [];
  for (var i = 0; i < obavezni.length; i++) {
    if (!stupci.hasOwnProperty(obavezni[i])) nedostaju.push(obavezni[i]);
  }
  if (nedostaju.length) {
    throw new Error('Tab ' + nazivTaba + ' nema stupce: ' + nedostaju.join(', '));
  }
}

function prviPostojeci_(stupci, kandidati) {
  for (var i = 0; i < kandidati.length; i++) {
    if (stupci.hasOwnProperty(kandidati[i])) return stupci[kandidati[i]];
  }
  return null;
}

function tekst_(redak, stupci, naziv) {
  if (!stupci.hasOwnProperty(naziv)) return '';
  return uString_(redak[stupci[naziv]]);
}

/** Sheets vraca datume kao Date objekte. Bez ovoga bi "2026-09-08" izasao
 *  kao "Tue Sep 08 2026 00:00:00 GMT+0200 (...)". */
function uString_(v) {
  if (v == null) return '';
  // toString umjesto instanceof: instanceof pada kad Date dolazi iz drugog
  // realma (npr. iz test harnessa), a ovo radi u oba slucaja.
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(v).trim();
}

function broj_(v) {
  var n = Number(v);
  return isNaN(n) ? 0 : n;
}

function serijaliziraj_(v) {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return JSON.stringify(v);
}

function kljucOdgovora_(klijentId, pitanjeId, instanca) {
  return klijentId + '\t' + pitanjeId + '\t' + instanca;
}

function novRedak_(sirina) {
  var r = [];
  for (var i = 0; i < sirina; i++) r.push('');
  return r;
}

function json_(objekt) {
  return ContentService
    .createTextOutput(JSON.stringify(objekt))
    .setMimeType(ContentService.MimeType.JSON);
}

/** Web App ne moze vratiti HTTP status, pa se greska prenosi u tijelu odgovora. */
function greskaServera_(err) {
  return { greska: 'server', poruka: String((err && err.message) || err) };
}
