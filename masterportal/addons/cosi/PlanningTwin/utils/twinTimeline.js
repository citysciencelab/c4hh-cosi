/**
 * The planned changes of a planning case as a timeline: entries of all its parts,
 * with their dates, maturity and whether they count at a given date. Pure — no I/O.
 *
 * An entry counts at a date (SPEC §6 "Overlay") if
 *   (wirksam_ab ?? −∞) ≤ stichtag < (wirksam_bis ?? +∞)  and  (reifegrad ?? 0) ≥ threshold.
 */
import {REIFEGRAD_NAMES} from "./twinApi.js";

/** Collections in a fixed order — the colour slot follows the collection, never its rank. */
export const COLLECTION_ORDER = ["kitas", "wohnbau", "gebaeude", "oepnv_halte", "schulen", "soziales", "parken"];

/** Categorical colours (validated: dataviz palette slots 1–4, then 7, 6, 5). */
export const COLLECTION_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#6250d6", "#008300", "#e87ba4", "#eda100"];

/** Fallback names of collections the view does not describe. */
export const COLLECTION_LABELS = {
    kitas: "Kitas", wohnbau: "Wohnungsbau", gebaeude: "Gebäude", oepnv_halte: "ÖPNV-Halte",
    schulen: "Schulen", soziales: "Soziale Einrichtungen", parken: "Parken"
};

/** What an operation means, in words. */
export const OP_LABELS = {insert: "neu", update: "geändert", delete: "entfällt"};

/**
 * The colour of a collection.
 * @param {String} key Collection key.
 * @returns {String} Hex colour.
 */
export function collectionColor (key) {
    const i = COLLECTION_ORDER.indexOf(key);

    return i >= 0 ? COLLECTION_COLORS[i] : "#52514e";
}

/**
 * The date an entry stands for on the timeline, as "JJJJ-MM-TT".
 * @param {String|null} wirksamAb Effective from.
 * @returns {String|null} The date or null (always effective).
 */
function isoDate (wirksamAb) {
    return typeof wirksamAb === "string" && (/^\d{4}-\d{2}-\d{2}/).test(wirksamAb) ? wirksamAb.slice(0, 10) : null;
}

/**
 * The name of the object of an entry.
 * @param {Object} e Raw entry (/api/planfaelle/{slug}/stapel → eintraege[]).
 * @returns {String} The name.
 */
export function entryName (e) {
    const a = e.after ?? {},
        b = e.before ?? {};

    return a.name ?? a.bezeichnung ?? b.name ?? b.bezeichnung ?? e.objekt_id;
}

/**
 * Flattens the batches of all parts into timeline entries. Only batches that are in
 * force (status "gilt"); a part frozen at stand_at only with batches created before it.
 * @param {Object[]} batchesByPart From twinApi.loadBatches: [{part, stapel}].
 * @returns {Object[]} Entries sorted by date: {key, sammlung, objektId, op, name, datum,
 *     bis, reifegrad, schwelle, unterSchwelle, vorhaben, abschnitt, planfall, planfallLabel,
 *     note, we, entfaelltWe}
 */
export function timelineEntries (batchesByPart) {
    const entries = [];

    batchesByPart.forEach(({part, stapel}) => {
        (stapel ?? [])
            .filter(s => s.status === "gilt" && (!part.standAt || s.created_at <= part.standAt))
            .forEach(s => (s.eintraege ?? []).forEach(e => {
                const reifegrad = e.reifegrad ?? 0;

                entries.push({
                    key: `${part.slug}:${e.id}`,
                    sammlung: e.sammlung,
                    objektId: e.objekt_id,
                    op: e.op,
                    name: entryName(e),
                    datum: isoDate(e.wirksam_ab),
                    bis: isoDate(e.wirksam_bis),
                    reifegrad,
                    schwelle: part.schwelle,
                    unterSchwelle: reifegrad < part.schwelle,
                    vorhaben: e.vorhaben ?? null,
                    abschnitt: e.abschnitt ?? null,
                    planfall: part.slug,
                    planfallLabel: part.label,
                    note: s.note ?? null,
                    we: e.after?.we ?? null,
                    entfaelltWe: e.entfaellt?.we ?? null
                });
            }));
    });
    return entries.sort((a, b) => (a.datum ?? "").localeCompare(b.datum ?? "") || a.name.localeCompare(b.name));
}

/**
 * The date a "Stichtag" path segment stands for.
 * @param {String|Number} stichtag "heute", a year (= 31.12.) or "JJJJ-MM-TT".
 * @param {Date} [today=new Date()] Today.
 * @returns {String} "JJJJ-MM-TT".
 */
export function stichtagDate (stichtag, today = new Date()) {
    const s = String(stichtag);

    if ((/^\d{4}$/).test(s)) {
        return `${s}-12-31`;
    }
    if ((/^\d{4}-\d{2}-\d{2}$/).test(s)) {
        return s;
    }
    return today.toISOString().slice(0, 10);
}

/**
 * Whether an entry counts at a date.
 * @param {Object} entry Timeline entry.
 * @param {String} date "JJJJ-MM-TT".
 * @returns {Boolean} True if in force and mature enough.
 */
export function isEffective (entry, date) {
    return !entry.unterSchwelle && (entry.datum === null || entry.datum <= date) && (entry.bis === null || date < entry.bis);
}

/**
 * The years a timeline should show: this year to 15 years ahead, widened to the
 * entries and project phases.
 * @param {Object[]} entries Timeline entries.
 * @param {Object[]} phases Project phases [{ab, bis}].
 * @param {Number} thisYear The current year.
 * @returns {Number[]} [first, last]
 */
export function yearRange (entries, phases, thisYear) {
    let first = thisYear,
        last = thisYear + 15;

    [...entries.flatMap(e => [e.datum, e.bis]), ...phases.flatMap(p => [p.ab, p.bis])]
        .filter(Boolean)
        .forEach(d => {
            const y = Number(d.slice(0, 4));

            first = Math.min(first, y);
            last = Math.max(last, y);
        });
    return [first, last];
}

/**
 * Position of a date on a timeline of whole years.
 * @param {String} date "JJJJ-MM-TT".
 * @param {Number[]} range [first, last] year.
 * @returns {Number} 0–1 from the start of the first to the end of the last year.
 */
export function datePosition (date, range) {
    const [y, m, d] = date.split("-").map(Number),
        t = y + ((m - 1) * 30.44 + (d - 1)) / 365.25;

    return Math.min(1, Math.max(0, (t - range[0]) / (range[1] + 1 - range[0])));
}

/**
 * The rows of a timeline: one per collection that has entries, in the fixed order.
 * @param {Object[]} entries Timeline entries.
 * @returns {Object[]} [{key, label, color, entries}]
 */
export function timelineRows (entries) {
    const keys = [...new Set(entries.map(e => e.sammlung))]
        .sort((a, b) => {
            const ia = COLLECTION_ORDER.indexOf(a),
                ib = COLLECTION_ORDER.indexOf(b);

            return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
        });

    return keys.map(key => ({
        key,
        label: COLLECTION_LABELS[key] ?? key,
        color: collectionColor(key),
        entries: entries.filter(e => e.sammlung === key)
    }));
}

/**
 * An entry in words: "neu ab 01.08.2029 · Planrecht bzw. Planfeststellung · Quartier Demo, BA2".
 * @param {Object} entry Timeline entry.
 * @param {Object} [vorhabenLabels={}] Labels of projects by slug.
 * @returns {String} The sentence.
 */
export function entrySentence (entry, vorhabenLabels = {}) {
    const op = OP_LABELS[entry.op] ?? entry.op,
        when = entry.datum ? `${op} ab ${formatDate(entry.datum)}` : `${op} (ohne Datum)`,
        until = entry.bis ? ` bis ${formatDate(entry.bis)}` : "",
        parts = [when + until, `Reifegrad ${REIFEGRAD_NAMES[entry.reifegrad] ?? entry.reifegrad}`];

    if (entry.vorhaben) {
        parts.push([vorhabenLabels[entry.vorhaben] ?? entry.vorhaben, entry.abschnitt].filter(Boolean).join(", "));
    }
    return parts.join(" · ");
}

/**
 * A date as "TT.MM.JJJJ".
 * @param {String} date "JJJJ-MM-TT".
 * @returns {String} The date.
 */
export function formatDate (date) {
    const [y, m, d] = date.split("-");

    return `${d}.${m}.${y}`;
}

/**
 * The yearly dwelling balance as chart rows.
 * @param {Object} bilanz From twinApi.loadBalance.
 * @param {String} [feld="we"] Field.
 * @returns {Object[]} [{jahr, neu, entfaellt, netto, kumuliert}]
 */
export function balanceRows (bilanz, feld = "we") {
    const byYear = new Map();

    (bilanz?.zeilen ?? []).forEach(z => {
        const w = z.werte?.[feld],
            row = byYear.get(z.jahr) ?? {jahr: z.jahr, neu: 0, entfaellt: 0, netto: 0, kumuliert: 0};

        if (w) {
            row.neu += w.neu ?? 0;
            row.entfaellt += w.entfaellt ?? 0;
            row.netto += w.netto ?? 0;
            row.kumuliert += w.kumuliert ?? 0;
        }
        byYear.set(z.jahr, row);
    });
    return [...byYear.values()].sort((a, b) => a.jahr - b.jahr);
}

/**
 * Lanes for markers that would overlap: greedy, each marker in the first lane whose
 * last marker is at least minGap away.
 * @param {Number[]} xs Marker positions, ascending.
 * @param {Number} minGap Smallest distance in one lane.
 * @returns {Number[]} Lane index per marker.
 */
export function assignLanes (xs, minGap) {
    const lastX = [];

    return xs.map(x => {
        let lane = lastX.findIndex(l => x - l >= minGap);

        if (lane < 0) {
            lane = lastX.length;
        }
        lastX[lane] = x;
        return lane;
    });
}
