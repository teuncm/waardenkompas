"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { jsPDF } from "jspdf";

const BASE_VALUES = [
  "Aandacht", "Aanpassen", "Acceptatie", "Afwisseling", "Altruïsme", "Ambitieus",
  "Assertiviteit", "Attent", "Authenticiteit", "Autonomie", "Avontuurlijkheid", "Balans",
  "Behulpzaamheid", "Bekwaamheid", "Bemoedigend", "Bescheidenheid", "Beschermen",
  "Betrokkenheid", "Betrouwbaarheid", "Bewustzijn", "Bijdragen", "Comfort", "Compassie",
  "Compromis", "Creativiteit", "Dankbaarheid", "Discipline", "Dienstbaarheid", "Diepgang",
  "Doelgerichtheid", "Duurzaamheid", "Eenvoud", "Eerlijkheid", "Empathie", "Enthousiasme",
  "Erkenning", "Excelleren", "Familie", "Flexibiliteit", "Gastvrijheid", "Geduld",
  "Gelijkwaardigheid", "Georganiseerd", "Gezag", "Gezelligheid", "Gezondheid", "Groei",
  "Hoffelijkheid", "Hoop", "Hulpvaardigheid", "Humor", "IJverig", "Innovatief", "Integriteit",
  "Intimiteit", "Inzet", "Inzicht", "Kennis", "Kracht", "Kunst", "Kwaliteit", "Leiderschap",
  "Liefde", "Loyaliteit", "Macht", "Milieubewust", "Mindful", "Moed", "Nauwkeurigheid",
  "Nederigheid", "Nieuwsgierigheid", "Nut", "Ontspanning", "Ontwikkeling", "Openheid",
  "Oprechtheid", "Optimisme", "Originaliteit", "Passie", "Plezier", "Plichtsgetrouw",
  "Praktisch", "Professionaliteit", "Rationaliteit", "Rechtvaardigheid", "Respect", "Roem",
  "Romantiek", "Rust", "Samenwerking", "Schoonheid", "Seksualiteit", "Sociaal", "Solidariteit",
  "Spanning", "Spiritualiteit", "Stabiliteit", "Structuur", "Tactvol", "Tevredenheid",
  "Toewijding", "Traditie", "Trouw", "Uitdaging", "Veiligheid", "Verantwoordelijkheid",
  "Verbeelding", "Verbinding", "Verdraagzaamheid", "Vergeving", "Vertrouwen", "Verwondering",
  "Vriendschap", "Vrijgevigheid", "Vrijheid", "Waardering", "Warmte", "Wederkerig", "Welvaart",
  "Wijsheid", "Zelfbeheersing", "Zelfkennis", "Zelfwaardering", "Zinvolheid", "Zorgzaamheid"
] as const;

type Stage = "intro" | "sort" | "top" | "action";
type Bucket = "very" | "important" | "less";
type Assignments = Record<string, Bucket>;

const BUCKETS: { key: Bucket; label: string; short: string; keyHint: string }[] = [
  { key: "very", label: "Zeer belangrijk", short: "Zeer", keyHint: "1" },
  { key: "important", label: "Belangrijk", short: "Belangrijk", keyHint: "2" },
  { key: "less", label: "Niet zo belangrijk", short: "Minder", keyHint: "3" },
];

const STORAGE_KEY = "waardenkompas-v1";

function shuffleValues(items: readonly string[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }
  return shuffled;
}

function downloadCompassPdf(top10: string[], ratings: Record<string, number>, actions: Record<string, string>) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const left = 18;
  const contentWidth = 174;
  let y = 20;

  const addPageHeading = () => {
    pdf.setTextColor(18, 49, 74);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(20);
    pdf.text("Mijn Waardenkompas", left, y);
    y += 8;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(103, 116, 124);
    pdf.text(`Gemaakt op ${new Intl.DateTimeFormat("nl-NL", { dateStyle: "long" }).format(new Date())}`, left, y);
    y += 10;
  };

  addPageHeading();
  top10.forEach((value, index) => {
    const action = actions[value]?.trim() || "Nog geen concrete actie ingevuld.";
    const actionLines = pdf.splitTextToSize(action, 142);
    const blockHeight = Math.max(20, 12 + actionLines.length * 4.5);
    if (y + blockHeight > 280) {
      pdf.addPage();
      y = 20;
      addPageHeading();
    }

    pdf.setFillColor(index === 0 ? 232 : 244, index === 0 ? 116 : 236, index === 0 ? 97 : 223);
    pdf.circle(left + 4, y + 3, 4, "F");
    pdf.setTextColor(index === 0 ? 255 : 18, index === 0 ? 255 : 49, index === 0 ? 255 : 74);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text(String(index + 1), left + 4, y + 4.1, { align: "center" });

    pdf.setTextColor(18, 49, 74);
    pdf.setFontSize(13);
    pdf.text(value, left + 12, y + 4);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(103, 116, 124);
    pdf.text(`Ruimte in mijn leven: ${ratings[value] ? `${ratings[value]}/5` : "niet ingevuld"}`, left + 12, y + 9);
    pdf.setTextColor(18, 49, 74);
    pdf.text(actionLines, left + 12, y + 14);
    y += blockHeight;
    pdf.setDrawColor(220, 213, 202);
    pdf.line(left, y - 3, left + contentWidth, y - 3);
  });

  pdf.setFontSize(8);
  pdf.setTextColor(120, 120, 120);
  pdf.text("Gebaseerd op de Waarden Sorteertaak van ACT in Actie (2015)", left, 291);
  pdf.save("mijn-waardenkompas.pdf");
}

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const [stage, setStage] = useState<Stage>("intro");
  const [assignments, setAssignments] = useState<Assignments>({});
  const [assignedOrder, setAssignedOrder] = useState<string[]>([]);
  const [customValues, setCustomValues] = useState<string[]>([]);
  const [valueOrder, setValueOrder] = useState<string[]>([]);
  const [top10, setTop10] = useState<string[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [actions, setActions] = useState<Record<string, string>>({});
  const [customInput, setCustomInput] = useState("");
  const [showReset, setShowReset] = useState(false);

  const values = useMemo(() => {
    const allValues = [...BASE_VALUES, ...customValues];
    const ordered = valueOrder.filter((value) => allValues.includes(value));
    const missing = allValues.filter((value) => !ordered.includes(value));
    return [...ordered, ...missing];
  }, [customValues, valueOrder]);
  const unsorted = values.filter((value) => !assignments[value]);
  const current = unsorted[0];
  const sortedCount = values.length - unsorted.length;
  const progress = values.length ? Math.round((sortedCount / values.length) * 100) : 0;

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          const savedCustomValues = data.customValues ?? [];
          setStage(data.stage ?? "intro");
          setAssignments(data.assignments ?? {});
          setAssignedOrder(data.assignedOrder ?? []);
          setCustomValues(savedCustomValues);
          setValueOrder(data.valueOrder?.length ? data.valueOrder : shuffleValues([...BASE_VALUES, ...savedCustomValues]));
          setTop10(data.top10 ?? []);
          setRatings(data.ratings ?? {});
          setActions(data.actions ?? {});
        } else setValueOrder(shuffleValues(BASE_VALUES));
      } catch { /* Een beschadigde lokale opslag start gewoon opnieuw. */ }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      stage, assignments, assignedOrder, customValues, valueOrder, top10, ratings, actions,
    }));
  }, [hydrated, stage, assignments, assignedOrder, customValues, valueOrder, top10, ratings, actions]);

  useEffect(() => {
    if (stage !== "sort" || !current) return;
    const onKey = (event: KeyboardEvent) => {
      const bucket = event.key === "1" ? "very" : event.key === "2" ? "important" : event.key === "3" ? "less" : null;
      if (bucket && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        assign(current, bucket);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  function assign(value: string, bucket: Bucket) {
    setAssignments((previous) => ({ ...previous, [value]: bucket }));
    setAssignedOrder((previous) => [...previous.filter((item) => item !== value), value]);
  }

  function undo() {
    const last = assignedOrder.at(-1);
    if (!last) return;
    setAssignments((previous) => {
      const next = { ...previous };
      delete next[last];
      return next;
    });
    setAssignedOrder((previous) => previous.slice(0, -1));
  }

  function reconsider(value: string) {
    setAssignments((previous) => {
      const next = { ...previous };
      delete next[value];
      return next;
    });
    setAssignedOrder((previous) => previous.filter((item) => item !== value));
    setTop10((previous) => previous.filter((item) => item !== value));
  }

  function addCustom(event: FormEvent) {
    event.preventDefault();
    const clean = customInput.trim();
    if (!clean || values.some((value) => value.toLowerCase() === clean.toLowerCase())) return;
    setCustomValues((previous) => [...previous, clean]);
    setValueOrder((previous) => [...previous, clean]);
    setCustomInput("");
  }

  function toggleTop(value: string) {
    setTop10((previous) => previous.includes(value)
      ? previous.filter((item) => item !== value)
      : previous.length < 10 ? [...previous, value] : previous);
  }

  function moveTop(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= top10.length) return;
    setTop10((previous) => {
      const next = [...previous];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
    setStage("intro"); setAssignments({}); setAssignedOrder([]); setCustomValues([]);
    setValueOrder(shuffleValues(BASE_VALUES));
    setTop10([]); setRatings({}); setActions({}); setShowReset(false);
  }

  const candidates = values.filter((value) => assignments[value] === "very");
  const backupCandidates = values.filter((value) => assignments[value] === "important");
  const finalCandidates = values.filter((value) => assignments[value] === "less");
  const availableCandidates = candidates.length >= 10 ? candidates : [...candidates, ...backupCandidates, ...finalCandidates];

  if (!hydrated) return <div className="loading-screen">Mijn Waardenkompas wordt klaargezet…</div>;

  return (
    <main>
      <Header stage={stage} onHome={() => setStage("intro")} />
      {stage === "intro" && <Intro onStart={() => setStage(top10.length === 10 ? "action" : unsorted.length === 0 ? "top" : "sort")} hasProgress={sortedCount > 0} />}
      {stage === "sort" && (
        <SortStage
          values={values} assignments={assignments} current={current} sortedCount={sortedCount}
          progress={progress} assignedOrder={assignedOrder} onAssign={assign} onUndo={undo}
          onReconsider={reconsider} onNext={() => setStage("top")} customInput={customInput}
          setCustomInput={setCustomInput} onAddCustom={addCustom}
        />
      )}
      {stage === "top" && (
        <TopStage
          candidates={availableCandidates} primaryCount={candidates.length} top10={top10}
          onToggle={toggleTop} onMove={moveTop} onBack={() => setStage("sort")}
          onNext={() => setStage("action")}
        />
      )}
      {stage === "action" && (
        <ActionStage
          top10={top10} ratings={ratings} actions={actions} setRatings={setRatings}
          setActions={setActions} onBack={() => setStage("top")} onReset={() => setShowReset(true)}
        />
      )}
      {showReset && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setShowReset(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="reset-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="modal-icon" aria-hidden="true">↺</span>
            <h2 id="reset-title">Opnieuw beginnen?</h2>
            <p>Je sortering, top 10 en actieplan worden van dit apparaat verwijderd.</p>
            <div className="modal-actions"><button className="quiet-button" onClick={() => setShowReset(false)}>Annuleren</button><button className="danger-button" onClick={resetAll}>Alles wissen</button></div>
          </div>
        </div>
      )}
      <Footer />
    </main>
  );
}

function Header({ stage, onHome }: { stage: Stage; onHome: () => void }) {
  const steps = ["sort", "top", "action"] as const;
  const labels = ["Sorteren", "Top 10", "Actieplan"];
  const active = steps.indexOf(stage as "sort" | "top" | "action");
  return (
    <header className="site-header">
      <button className="brand brand-button" onClick={onHome} aria-label="Mijn Waardenkompas, naar start">
        <span className="brand-mark" aria-hidden="true">✦</span><span>Mijn Waardenkompas</span>
      </button>
      {stage === "intro" ? <span className="header-note">Persoonlijke oefening</span> : (
        <nav className="stage-nav" aria-label="Voortgang">
          {labels.map((label, index) => <span key={label} className={index === active ? "active" : index < active ? "done" : ""}><b>{index < active ? "✓" : index + 1}</b>{label}</span>)}
        </nav>
      )}
    </header>
  );
}

function Intro({ onStart, hasProgress }: { onStart: () => void; hasProgress: boolean }) {
  return <>
    <section className="hero" id="top">
      <div className="eyebrow"><span /> Waarden sorteertaak</div>
      <h1>Ontdek wat voor jou<br /><em>echt belangrijk</em> is.</h1>
      <p className="hero-copy">Waarden geven richting aan de keuzes die je maakt. Sorteer 125 waarden en maak van jouw top 10 een concreet kompas.</p>
      <div className="hero-actions">
        <button className="primary-button" type="button" onClick={onStart}>{hasProgress ? "Ga verder" : "Begin met sorteren"} <span>→</span></button>
        <a className="text-link" href="#uitleg">Bekijk hoe het werkt <span>↓</span></a>
      </div>
      <p className="privacy-note"><span aria-hidden="true">✓</span> Je antwoorden blijven op dit apparaat</p>
    </section>
    <section className="steps-section" id="uitleg">
      <div className="steps-grid">
        <article><span className="step-number">01</span><div className="step-icon coral">◇</div><h3>Sorteer intuïtief</h3><p>Geef per waarde aan hoe belangrijk die voor jou is. Je eerste gevoel is vaak genoeg.</p></article>
        <article><span className="step-number">02</span><div className="step-icon gold">☆</div><h3>Kies jouw top 10</h3><p>Selecteer uit ‘zeer belangrijk’ de tien waarden die je het meeste richting geven.</p></article>
        <article><span className="step-number">03</span><div className="step-icon blue">↗</div><h3>Maak het concreet</h3><p>Onderzoek wat al aanwezig is en kies een kleine actie voor de waarde die aandacht vraagt.</p></article>
      </div>
    </section>
  </>;
}

type SortProps = {
  values: string[]; assignments: Assignments; current?: string; sortedCount: number; progress: number;
  assignedOrder: string[]; onAssign: (value: string, bucket: Bucket) => void; onUndo: () => void;
  onReconsider: (value: string) => void; onNext: () => void; customInput: string;
  setCustomInput: (value: string) => void; onAddCustom: (event: FormEvent) => void;
};

function SortStage(props: SortProps) {
  const [showReview, setShowReview] = useState(false);
  return <section className="workspace-section">
    <div className="workspace-heading">
      <div><span className="kicker">Stap 1 van 3</span><h1>Sorteer op gevoel.</h1><p>Wat betekent deze waarde voor jou? Kies zonder er te lang over na te denken.</p></div>
      <div className="progress-block"><strong>{props.sortedCount}<small> / {props.values.length}</small></strong><span>waarden gesorteerd</span><div className="progress-track"><i style={{ width: `${props.progress}%` }} /></div></div>
    </div>

    {props.current ? <div className="sorting-card-wrap">
      <div className="value-card"><span>Waarde</span><strong>{props.current}</strong><small>{props.sortedCount + 1} van {props.values.length}</small></div>
      <div className="bucket-buttons" aria-label={`Hoe belangrijk is ${props.current}?`}>
        {BUCKETS.map((bucket) => <button key={bucket.key} className={`bucket-button ${bucket.key}`} onClick={() => props.onAssign(props.current!, bucket.key)}><kbd>{bucket.keyHint}</kbd><span>{bucket.label}</span><b>→</b></button>)}
      </div>
      <button className="undo-button" disabled={!props.assignedOrder.length} onClick={props.onUndo}>↶ Vorige keuze ongedaan maken</button>
      <p className="keyboard-hint">Tip: gebruik de toetsen <kbd>1</kbd>, <kbd>2</kbd> en <kbd>3</kbd> om sneller te sorteren.</p>
    </div> : <div className="completion-card"><span className="completion-mark">✓</span><span className="kicker">Sortering compleet</span><h2>Mooi. Je hebt alle {props.values.length} waarden bekeken.</h2><p>Nu gaan we van jouw stapel ‘zeer belangrijk’ een persoonlijke top 10 maken.</p><button className="primary-button" onClick={props.onNext}>Kies mijn top 10 <span>→</span></button></div>}

    <div className="sort-tools">
      <form onSubmit={props.onAddCustom}><label htmlFor="custom-value">Mis je een waarde?</label><div><input id="custom-value" value={props.customInput} onChange={(e) => props.setCustomInput(e.target.value)} placeholder="Voeg je eigen waarde toe" /><button type="submit">+ Toevoegen</button></div></form>
      <button className="review-toggle" onClick={() => setShowReview(!showReview)}>{showReview ? "Verberg" : "Bekijk"} mijn sortering <span>{showReview ? "↑" : "↓"}</span></button>
    </div>
    {showReview && <div className="review-grid">{BUCKETS.map((bucket) => { const items = props.values.filter((v) => props.assignments[v] === bucket.key); return <article key={bucket.key}><header><span className={`dot ${bucket.key}`} /><h3>{bucket.label}</h3><b>{items.length}</b></header><div className="chips">{items.length ? items.map((value) => <button key={value} onClick={() => props.onReconsider(value)} title="Opnieuw beoordelen">{value}<span>×</span></button>) : <p>Nog geen waarden</p>}</div></article>; })}</div>}
  </section>;
}

function TopStage({ candidates, primaryCount, top10, onToggle, onMove, onBack, onNext }: { candidates: string[]; primaryCount: number; top10: string[]; onToggle: (value: string) => void; onMove: (index: number, direction: -1 | 1) => void; onBack: () => void; onNext: () => void }) {
  return <section className="workspace-section top-workspace">
    <div className="workspace-heading"><div><span className="kicker">Stap 2 van 3</span><h1>Kies jouw top 10.</h1><p>Selecteer de tien waarden die je leven het meeste richting geven. Rangschik ze daarna van 1 tot 10.</p></div><div className="selection-count"><strong>{top10.length}</strong><span>van 10 gekozen</span></div></div>
    {primaryCount < 10 && <div className="notice"><span>i</span><p>Je koos {primaryCount} waarden als ‘zeer belangrijk’. Daarom laten we ook je overige gesorteerde waarden zien, zodat je tot tien kunt komen.</p></div>}
    <div className="top-layout">
      <div className="candidate-panel"><div className="panel-title"><h2>Kies je waarden</h2><span>{candidates.length} opties</span></div><div className="candidate-grid">{candidates.map((value) => { const selected = top10.includes(value); return <button key={value} className={selected ? "selected" : ""} onClick={() => onToggle(value)} aria-pressed={selected}><span>{selected ? "✓" : "+"}</span>{value}</button>; })}</div></div>
      <div className="ranking-panel"><div className="panel-title"><h2>Jouw volgorde</h2><span>belangrijkste bovenaan</span></div><ol>{Array.from({ length: 10 }).map((_, index) => { const value = top10[index]; return <li key={value ?? `empty-${index}`} className={value ? "filled" : "empty"}><span className="rank">{index + 1}</span>{value ? <><strong>{value}</strong><div><button disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={`${value} omhoog`}>↑</button><button disabled={index === top10.length - 1} onClick={() => onMove(index, 1)} aria-label={`${value} omlaag`}>↓</button><button onClick={() => onToggle(value)} aria-label={`${value} verwijderen`}>×</button></div></> : <em>Nog te kiezen</em>}</li>; })}</ol></div>
    </div>
    <div className="workspace-actions"><button className="quiet-button" onClick={onBack}>← Terug naar sorteren</button><button className="primary-button" disabled={top10.length !== 10} onClick={onNext}>Maak mijn actieplan <span>→</span></button></div>
  </section>;
}

function ActionStage({ top10, ratings, actions, setRatings, setActions, onBack, onReset }: { top10: string[]; ratings: Record<string, number>; actions: Record<string, string>; setRatings: (updater: (previous: Record<string, number>) => Record<string, number>) => void; setActions: (updater: (previous: Record<string, string>) => Record<string, string>) => void; onBack: () => void; onReset: () => void }) {
  return <section className="workspace-section action-workspace">
    <div className="workspace-heading"><div><span className="kicker">Stap 3 van 3</span><h1>Van waarde naar actie.</h1><p>Hoe aanwezig is elke waarde nu in je leven? Kies vervolgens één kleine, haalbare stap.</p></div><span className="compass-badge">✦<small>jouw kompas</small></span></div>
    <div className="action-list">{top10.map((value, index) => <article key={value} className={index === 0 ? "focus-value" : ""}>
      <header><span className="rank">{index + 1}</span><div><h2>{value}</h2>{index === 0 && <span className="focus-label">Start hier</span>}</div></header>
      <div className="rating-block"><label>Hoeveel ruimte krijgt deze waarde nu?</label><div className="rating-scale" role="group" aria-label={`Ruimte voor ${value}`}>
        {[1,2,3,4,5].map((rating) => <button key={rating} className={(ratings[value] ?? 0) >= rating ? "active" : ""} onClick={() => setRatings((previous) => ({ ...previous, [value]: rating }))} aria-label={`${rating} van 5`}>{rating}</button>)}
      </div><div className="scale-labels"><span>weinig</span><span>veel</span></div></div>
      <div className="action-input"><label htmlFor={`action-${index}`}>Mijn kleine volgende stap</label><textarea id={`action-${index}`} value={actions[value] ?? ""} onChange={(event) => setActions((previous) => ({ ...previous, [value]: event.target.value }))} placeholder={index === 0 ? `Wat kun je deze week doen om meer ruimte te maken voor ${value.toLowerCase()}?` : "Een kleine, concrete actie…"} rows={2} /></div>
    </article>)}</div>
    <div className="finish-card"><div><span className="kicker">Je kompas is klaar</span><h2>Bewaar je richting. Begin klein.</h2><p>Kies bij voorkeur eerst de actie bij waarde nummer 1. Een kleine stap die je echt doet, telt meer dan een groot plan.</p></div><button className="primary-button" onClick={() => downloadCompassPdf(top10, ratings, actions)}>Download mijn kompas als pdf <span>↓</span></button></div>
    <div className="workspace-actions"><button className="quiet-button" onClick={onBack}>← Top 10 aanpassen</button><button className="reset-link" onClick={onReset}>Opnieuw beginnen</button></div>
  </section>;
}

function Footer() {
  return <footer>
    <span>
      Bron: Waarden Sorteertaak van ACT in Actie (2015) ·{" "}
      <a href="./waardensorteertaak-act-in-actie.pdf" download>Download het oorspronkelijke document (pdf)</a>
    </span>
    <span>Jouw antwoorden worden alleen lokaal bewaard.</span>
  </footer>;
}
