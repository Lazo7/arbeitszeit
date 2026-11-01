// Regressionstest der Arbeitszeit-App (seit v3.0)
// Lädt index.html in einer simulierten Browserumgebung (jsdom) mit dem Referenzdatensatz tests/referenz.json
// und vergleicht Saldo, TAZ, Tageswerte, Monatsköpfe, Wochensummen, Verlaufszeilen und CSV mit tests/erwartet.json.
//
//   node tests/regression.mjs                  prüfen (Exit-Code 1 bei Abweichung)
//   node tests/regression.mjs --update v3      Erwartung für die v3-Teile neu schreiben (nach gewollter Änderung)
//   node tests/regression.mjs --update kern    Erwartung für den Kern neu schreiben (nur bewusst!)
//   node tests/regression.mjs --html pfad      andere index.html prüfen (z. B. eine ältere Version)
//
// Der Kern (Saldo, TAZ, Monatsköpfe, Wochensummen, Verlauf, CSV) wurde mit Version 2.7 erzeugt.
// Jede neue Version muss dort identische Werte liefern.
import { JSDOM } from "jsdom";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.TZ = "Europe/Berlin";
const DIR = path.dirname(fileURLToPath(import.meta.url));
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const HTML_PATH = arg("--html") || path.join(DIR, "..", "index.html");
const UPDATE = arg("--update");
const HTML = fs.readFileSync(HTML_PATH, "utf8");
const REF = fs.readFileSync(path.join(DIR, "referenz.json"), "utf8");
const EXP_PATH = path.join(DIR, "erwartet.json");
const EXP = fs.existsSync(EXP_PATH) ? JSON.parse(fs.readFileSync(EXP_PATH, "utf8")) : {};

/* ---------- Umgebung ---------- */
function boot(now, store) {
  const fixed = new Date(now).getTime();
  const dom = new JSDOM(HTML, {
    url: "https://lazo7.github.io/arbeitszeit/", runScripts: "dangerously", pretendToBeVisual: true,
    beforeParse(w) {
      const D = w.Date;
      class FixedDate extends D { constructor(...a) { if (a.length) super(...a); else super(fixed); } static now() { return fixed; } }
      w.Date = FixedDate;
      w.localStorage.clear();
      for (const k in store) w.localStorage.setItem(k, store[k]);
      w.HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
      w.HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
      w.confirm = () => true; w.alert = () => {}; w.scrollTo = () => {};
      w.__AZB_TEST__ = true;
    },
  });
  return dom;
}
const txt = el => (el ? el.textContent.replace(/\s+/g, " ").trim() : null);
const all = (doc, sel) => [...doc.querySelectorAll(sel)].map(txt);
function fire(w, el, type) { el.dispatchEvent(new w.Event(type, { bubbles: true })); }
function goTab(w, tab) { w.document.querySelector('.tabbar button[data-tab="' + tab + '"]').click(); }
function setDate(w, ds) { const p = w.document.getElementById("pickDate"); p.value = ds; fire(w, p, "change"); }
function setCheck(w, id, on) { const el = w.document.getElementById(id); if (el.checked !== on) { el.checked = on; fire(w, el, "change"); } }
const dates = JSON.parse(REF).months;
const refDates = Object.values(dates).flatMap(m => Object.keys(m)).sort();
const extraDates = ["2026-09-25", "2026-09-26", "2026-10-03", "2026-11-21", "2026-12-25", "2026-12-31", "2027-01-01", "2027-01-02"];
const probe = [...new Set([...refDates, ...extraDates])].sort();

/* ---------- Kern: muss in jeder Version identisch sein ---------- */
function kern(now) {
  const dom = boot(now, { "azb.local": REF }), w = dom.window, d = w.document;
  const out = { gespeichertIdentisch: w.localStorage.getItem("azb.local") === REF, tage: {}, verlauf: {}, csv: null };
  goTab(w, "heute");
  for (const ds of probe) {
    setDate(w, ds);
    out.tage[ds] = {
      saldo: txt(d.getElementById("kSaldo")), tazMoeglich: txt(d.getElementById("kTaz")), gleitzeit: txt(d.getElementById("kRest")),
      tazZaehler: txt(d.getElementById("tazCount")), tazJahr: txt(d.getElementById("kTazYear")), tazHinweis: d.getElementById("tazFull").hidden ? "" : txt(d.getElementById("tazFull")),
      ist: txt(d.getElementById("sIst")), soll: txt(d.getElementById("sSoll")), pausen: txt(d.getElementById("sPause")), diff: txt(d.getElementById("sDiff")),
    };
  }
  goTab(w, "verlauf");
  setCheck(w, "showPlan", true); setCheck(w, "showWeek", true);
  out.verlauf.monatskoepfe = all(d, "#months .mhead");
  out.verlauf.wochen = all(d, "#months .whead");
  out.verlauf.zeilen = all(d, "#months .drow");
  goTab(w, "set");
  d.getElementById("csvBtn").click();
  out.csv = d.getElementById("csvOut").value;
  dom.window.close();
  return out;
}

/* ---------- v3.0: Jahresabschluss, Urlaub, Kappung, Import, Schema ---------- */
function v3(now) {
  const res = {};
  {
    const dom = boot(now, { "azb.local": REF }), w = dom.window, d = w.document, T = w.__azbTest;
    if (!T) { dom.window.close(); return null; }
    res.schema = w.localStorage.getItem("azb.schema");
    res.sicherheitskopie = !!w.localStorage.getItem("azb.pre-v3.0");
    res.urlaub = { 2026: T.urlaubJahr("2026"), 2027: T.urlaubJahr("2027") };
    res.tagUrlaub = {};
    goTab(w, "heute");
    for (const ds of ["2026-10-12", "2026-12-21", "2027-01-04", "2027-01-08"]) { setDate(w, ds); res.tagUrlaub[ds] = txt(d.getElementById("heroSub")); }
    goTab(w, "jahr");
    res.jahr = {};
    for (const y of ["2026", "2027"]) { T.setJahr(y); res.jahr[y] = all(d, "#v-jahr .card"); }
    const bak = JSON.parse(T.backupText());
    res.sicherung = { schema: bak.schema, app: bak.app, felder: Object.keys(bak).sort() };
    dom.window.close();
  }
  { // Urlaub vor dem Stichtag: Rest 2026 reicht nur teilweise für den Januar-Urlaub
    const ref = JSON.parse(REF); ref.cfg.urlVorher = 10;
    const dom = boot(now, { "azb.local": JSON.stringify(ref) }), T = dom.window.__azbTest;
    res.urlaubMitVorher = { 2026: T.urlaubJahr("2026"), 2027: T.urlaubJahr("2027") };
    dom.window.close();
  }
  { // Grenzen des Gleitzeitkontos: keine Kappung, nur Hinweise (Vorwarnung +32 h / Grenze +40 h, −12 h / −20 h)
    res.grenzen = {};
    for (const [name, start] of [["plusVorwarnung", 3307], ["plusUeber", 4300], ["minusVorwarnung", 307], ["minusUnter", -1000]]) {
      const ref = JSON.parse(REF); ref.cfg.startSaldo = start;
      const dom = boot(now, { "azb.local": JSON.stringify(ref) }), w = dom.window, d = w.document, T = w.__azbTest;
      goTab(w, "heute"); setDate(w, "2026-11-20");
      const h = d.getElementById("kontoHint");
      res.grenzen[name] = { saldo: txt(d.getElementById("kSaldo")), hinweis: h.hidden ? "" : txt(h), deutlich: h.classList.contains("neg"),
        saldo0101: (setDate(w, "2027-01-01"), txt(d.getElementById("kSaldo"))), saldo1231: (setDate(w, "2026-12-31"), txt(d.getElementById("kSaldo"))) };
      goTab(w, "jahr"); T.setJahr("2026"); res.grenzen[name].jahr = all(d, "#v-jahr .card")[0];
      dom.window.close();
    }
  }
  { // Bankfeiertage an: 24.12./31.12. sind keine Urlaubstage, der Urlaub bleibt zusammenhängend
    const ref = JSON.parse(REF); ref.cfg.frei2412 = true;
    const dom = boot(now, { "azb.local": JSON.stringify(ref) }), T = dom.window.__azbTest;
    res.urlaubBankfeiertage = { 2026: T.urlaubJahr("2026"), 2027: T.urlaubJahr("2027") };
    dom.window.close();
  }
  { // Quartalsgrenzen als Hinweis
    const ref = JSON.parse(REF); ref.cfg.qGrenzen = [60, null, null, 300];
    const dom = boot(now, { "azb.local": JSON.stringify(ref) }), w = dom.window, d = w.document;
    goTab(w, "heute");
    res.quartalHinweis = d.getElementById("kontoHint").hidden ? "" : txt(d.getElementById("kontoHint"));
    dom.window.close();
  }
  { // Import-Vorschau
    const dom = boot(now, { "azb.local": REF }), T = dom.window.__azbTest;
    const b = JSON.parse(REF);
    b.months["2026-11"]["2026-11-20"] = { b: [["07:00", "15:00"]], n: "geändert" };   // geändert
    delete b.months["2026-11"]["2026-11-19"];                                         // nur auf dem Gerät
    b.months["2026-11"]["2026-11-23"] = { art: "Urlaub" };                             // neu
    b.cfg.wege = 12;
    const bak = JSON.stringify({ app: "arbeitszeitbloecke", v: 3, schema: 3, exported: "2026-11-20T10:00:00.000Z", cfg: b.cfg, months: b.months });
    res.importVorschau = T.importVorschau(bak);
    res.importZuNeu = T.importVorschau(JSON.stringify({ app: "arbeitszeitbloecke", schema: 99, cfg: {}, months: {} }));
    res.importAlt = T.importVorschau(JSON.stringify({ app: "arbeitszeitbloecke", v: 2, exported: "2026-10-01T10:00:00.000Z", cfg: b.cfg, months: b.months }));
    dom.window.close();
  }
  return res;
}

/* ---------- feste Prüfregeln (unabhängig von der gespeicherten Erwartung) ---------- */
function regeln(now, x) {
  const f = [];
  const ok = (c, m) => { if (!c) f.push(now + ": " + m); };
  ok(x.schema === "3", "azb.schema ist nicht 3");
  ok(x.sicherheitskopie, "Sicherheitskopie azb.pre-v3.0 fehlt");
  ok(x.sicherung.schema === 3, "Sicherung ohne schema 3");
  const u = x.urlaub, uv = x.urlaubMitVorher, ub = x.urlaubBankfeiertage;
  // Rest 2026 reicht: 5 Januartage → 5 Resttage übertragen, Anspruch 2027 = 30 + 5, die 5 Tage zählen 2027 als genommen/geplant
  ok(u["2026"].uebertragOut === 5 && u["2027"].uebertragIn === 5 && u["2027"].anspruch === 35, "Übertrag 2026→2027 muss 5 sein, Anspruch 2027 = 35");
  ok(u["2027"].genommen + u["2027"].geplant === 5 && u["2027"].rest === 30, "Januartage zählen 2027 als genommen, Rest 2027 bleibt 30");
  ok(u["2026"].genommen + u["2026"].geplant === 18 && u["2026"].rest === 7, "2026: 18 Tage in 2026, 5 übertragen, Rest 7");
  // Rest 2026 = 2: nur 2 Tage übertragen, Anspruch 2027 = 32, 5 Tage genommen → Rest 27
  ok(uv["2026"].uebertragOut === 2 && uv["2026"].rest === 0 && uv["2027"].anspruch === 32 && uv["2027"].rest === 27, "Rest 2026 = 2 → Übertrag 2, Anspruch 2027 = 32, Rest 27");
  // Bankfeiertage: 24.12. und 31.12. zählen nicht, Urlaub bleibt zusammenhängend
  ok(ub["2026"].genommen + ub["2026"].geplant === 16 && ub["2026"].uebertragOut === 5, "Bankfeiertage: 16 Urlaubstage in 2026, Übertrag 5");
  const g = x.grenzen;
  ok(!g.plusVorwarnung.deutlich && g.plusVorwarnung.hinweis.includes("bis zur Grenze von +40:00"), "Vorwarnung ab +32 h fehlt");
  ok(g.plusUeber.deutlich && g.plusUeber.hinweis.includes("über der Grenze von +40:00"), "Hinweis über +40 h fehlt");
  ok(!g.minusVorwarnung.deutlich && g.minusVorwarnung.hinweis.includes("−20:00"), "Vorwarnung ab −12 h fehlt");
  ok(g.minusUnter.deutlich && g.minusUnter.hinweis.includes("unter der Grenze von −20:00"), "Hinweis unter −20 h fehlt");
  ok(g.plusUeber.saldo0101 === g.plusUeber.saldo1231, "keine Kappung: Saldo am 01.01. = Saldo am 31.12.");
  ok(x.importVorschau.neu.length === 1 && x.importVorschau.geaendert.length === 1 && x.importVorschau.nurGeraet.length === 1, "Import-Vorschau zählt falsch");
  ok(x.importZuNeu.ok === false, "Sicherung mit neuerem Schema darf nicht geladen werden");
  ok(x.importAlt.ok === true, "Sicherung ohne Schema (v2.x) muss ladbar sein");
  return f;
}

/* ---------- Ablauf ---------- */
const SZENARIEN = ["2026-11-20T15:30:00", "2027-01-15T12:00:00"];
const ist = { kern: {}, v3: {} };
for (const now of SZENARIEN) { ist.kern[now] = kern(now); const x = v3(now); if (x) ist.v3[now] = x; }

if (UPDATE) {
  const next = { ...EXP, erzeugt: { ...(EXP.erzeugt || {}), [UPDATE]: new Date().toISOString() + " aus " + path.basename(HTML_PATH) } };
  if (UPDATE === "kern") next.kern = ist.kern;
  else if (UPDATE === "v3") next.v3 = ist.v3;
  else { console.error("--update kern | v3"); process.exit(2); }
  fs.writeFileSync(EXP_PATH, JSON.stringify(next, null, 1) + "\n");
  console.log("Erwartung „" + UPDATE + "“ geschrieben.");
  process.exit(0);
}

let fehler = 0;
function cmp(a, b, pfad) {
  if (typeof a === "object" && a && typeof b === "object" && b) {
    for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) cmp(a[k], b[k], pfad + "." + k);
    return;
  }
  if (a === b) return;
  fehler++; if (fehler > 25) return;
  if (typeof a === "string" && typeof b === "string" && (a.includes("\n") || b.includes("\n"))) {   // CSV: erste abweichende Zeile zeigen
    const la = a.split("\n"), lb = b.split("\n"), i = la.findIndex((x, j) => x !== lb[j]);
    console.log("✗ " + pfad + " (Zeile " + (i + 1) + ")\n    erwartet: " + JSON.stringify(lb[i]) + "\n    ist:      " + JSON.stringify(la[i]));
  } else console.log("✗ " + pfad + "\n    erwartet: " + JSON.stringify(b) + "\n    ist:      " + JSON.stringify(a));
}
for (const now of SZENARIEN) {
  if (!ist.kern[now].gespeichertIdentisch) { fehler++; console.log("✗ " + now + ": gespeicherte Daten nach dem Start nicht byte-identisch"); }
}
cmp(ist.kern, EXP.kern || {}, "kern");
for (const now in ist.v3) for (const m of regeln(now, ist.v3[now])) { fehler++; console.log("✗ Regel " + m); }
if (Object.keys(ist.v3).length) cmp(ist.v3, EXP.v3 || {}, "v3");
const n = Object.values(ist.kern).reduce((a, k) => a + Object.keys(k.tage).length, 0);
if (fehler) { console.log("\n" + fehler + " Abweichung(en)."); process.exit(1); }
console.log("✓ Regressionstest bestanden: " + SZENARIEN.length + " Szenarien, " + n + " Tagesprüfungen, Monatsköpfe, Wochensummen, Verlauf, CSV" + (Object.keys(ist.v3).length ? ", v3-Teile" : "") + ".");
