/**
 * Filter model of the LayerFilter tool — a JavaScript port of c4hh-app
 * (app/utils/filter.ts and filterSpecSentence in app/utils/mapStateSummary.ts).
 *
 * A filter spec is plain data, so it can live in the store and be saved later:
 *   {items: [Condition | Group]}
 *   Condition = {kind: "condition", joiner: "and"|"or"|null, attr, type: "range"|"in"|null, lo, hi, values}
 *   Group     = {kind: "group", joiner, op: "and"|"or", conditions: Condition[]}
 *
 * Top-level items are split into OR-chains at every `joiner === "or"`, AND within a
 * chain (the usual precedence). A group combines its own members with `op`.
 *
 * `in` conditions: values undefined = "alle" (restricts nothing), [] = "keine"
 * (matches nothing), [a, b] = exactly those.
 *
 * Difference to c4hh-app: WFS/OAF attributes often arrive as STRINGS ("12", "3,5"),
 * so numbers are recognised in strings as well (`toNumber`).
 */

/** One unique-value cap for every attribute (see c4hh-app DATA-41). */
export const UNIQUE_CAP = 500;

/** Share of filled values that must be numbers for a column to count as numeric. */
const NUMERIC_SHARE = 0.9;

const NUMERIC_RE = /^\s*[-+]?(\d+([.,]\d+)?|[.,]\d+)([eE][-+]?\d+)?\s*$/;

/**
 * A value as a finite number, or NaN. Numbers in strings count ("3,5" → 3.5).
 * @param {*} v The raw attribute value.
 * @returns {Number} The number or NaN.
 */
export function toNumber (v) {
    if (typeof v === "number") {
        return Number.isFinite(v) ? v : NaN;
    }
    if (typeof v === "string" && NUMERIC_RE.test(v)) {
        return Number(v.replace(",", "."));
    }
    return NaN;
}

/**
 * Whether a value is empty (no value at all).
 * @param {*} v The raw value.
 * @returns {Boolean} True if empty.
 */
export function isEmptyValue (v) {
    return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}

/**
 * The single values of a value: an array's elements, the parts of a pipe-separated
 * string ("Grundschule|Stadtteilschule" — how the Hamburg services write multi-values),
 * else the value itself.
 * @param {*} v The raw value.
 * @returns {Array} The single values (empty ones dropped).
 */
export function valueList (v) {
    if (Array.isArray(v)) {
        return v.filter(x => !isEmptyValue(x) && typeof x !== "object");
    }
    if (typeof v === "string" && v.includes("|")) {
        return v.split("|").map(x => x.trim()).filter(Boolean);
    }
    return isEmptyValue(v) || typeof v === "object" ? [] : [v];
}

const statsMemo = new WeakMap();

/**
 * Statistics of one attribute over a list of property bags: numeric (min/max/step),
 * categorical (sorted unique values, capped) or empty. Memoised per list identity —
 * callers must replace the list instead of mutating it.
 * @param {Object[]} propsList List of property bags.
 * @param {String} attr The attribute.
 * @returns {Object} {type: "numeric", min, max, step, texts} | {type: "categorical", values, truncated} | {type: "empty"}
 */
export function getAttrStats (propsList, attr) {
    let byAttr = statsMemo.get(propsList);

    if (!byAttr) {
        byAttr = new Map();
        statsMemo.set(propsList, byAttr);
    }
    if (!byAttr.has(attr)) {
        byAttr.set(attr, computeAttrStats(propsList, attr));
    }
    return byAttr.get(attr);
}

/**
 * Computes the attribute statistics (see getAttrStats).
 * @param {Object[]} propsList List of property bags.
 * @param {String} attr The attribute.
 * @returns {Object} The statistics.
 */
function computeAttrStats (propsList, attr) {
    let filled = 0,
        numeric = 0,
        allInt = true,
        min = Infinity,
        max = -Infinity;

    for (const p of propsList) {
        const v = p[attr];

        if (isEmptyValue(v)) {
            continue;
        }
        filled++;
        const n = toNumber(v);

        if (!Number.isNaN(n)) {
            numeric++;
            if (!Number.isInteger(n)) {
                allInt = false;
            }
            if (n < min) {
                min = n;
            }
            if (n > max) {
                max = n;
            }
        }
    }
    if (!filled) {
        return {type: "empty"};
    }
    if (numeric / filled >= NUMERIC_SHARE) {
        const range = max - min;
        let step = 1;

        if (range > 0) {
            const mag = Math.pow(10, Math.floor(Math.log10(range)) - 2);

            step = mag < 1 ? mag : Math.max(1, Math.round(mag));
        }
        // whole-number columns get whole-number steps
        if (allInt && step < 1) {
            step = 1;
        }
        return {type: "numeric", min, max, step, texts: filled - numeric};
    }

    const uniques = new Set();
    let truncated = false;

    /**
     * Adds a value to the unique set, up to the cap.
     * @param {*} val The value.
     * @returns {void}
     */
    function take (val) {
        if (uniques.size < UNIQUE_CAP) {
            uniques.add(val);
        }
        else if (!uniques.has(val)) {
            truncated = true;
        }
    }

    for (const p of propsList) {
        valueList(p[attr]).forEach(take);
    }
    return {
        type: "categorical",
        values: [...uniques].sort((a, b) => String(a).localeCompare(String(b), "de", {numeric: true})),
        truncated
    };
}

/**
 * Whether a condition restricts anything.
 * @param {Object} c The condition.
 * @returns {Boolean} True if usable.
 */
export function isConditionUsable (c) {
    if (!c?.attr) {
        return false;
    }
    if (c.type === "range") {
        return Number.isFinite(c.lo) || Number.isFinite(c.hi);
    }
    if (c.type === "in") {
        return Array.isArray(c.values);
    }
    return false;
}

/**
 * Whether a condition is an `in` condition left at "alle".
 * @param {Object} c The condition.
 * @returns {Boolean} True if neutral.
 */
function isNeutralIn (c) {
    return Boolean(c?.attr) && c.type === "in" && c.values === undefined;
}

/**
 * The operator inside a group (absent = OR).
 * @param {Object} g The group.
 * @returns {String} "and" or "or".
 */
export function groupOp (g) {
    return g.op === "and" ? "and" : "or";
}

/**
 * Whether an item (condition or group) restricts anything.
 * @param {Object} it The item.
 * @returns {Boolean} True if usable.
 */
export function isItemUsable (it) {
    if (it.kind === "group") {
        return it.conditions.some(isConditionUsable);
    }
    return isConditionUsable(it);
}

/**
 * Whether an item deliberately restricts nothing ("alle Werte").
 * @param {Object} it The item.
 * @returns {Boolean} True if neutral.
 */
export function isNeutralItem (it) {
    return it.kind === "group" ? it.conditions.some(isNeutralIn) : isNeutralIn(it);
}

/**
 * The top level as it binds: usable items split into OR-chains, AND within a chain.
 * @param {Object[]} items The top-level items.
 * @returns {Object[][]} The chains.
 */
export function topLevelGroups (items) {
    const usable = items.filter(isItemUsable);

    if (!usable.length) {
        return [];
    }
    const chains = [[]];

    usable.forEach((it, i) => {
        if (i > 0 && it.joiner === "or") {
            chains.push([it]);
        }
        else {
            chains[chains.length - 1].push(it);
        }
    });
    return chains;
}

/**
 * Normalises a category value for set lookups: numbers in strings compare as numbers.
 * @param {*} v The value.
 * @returns {String} The lookup key.
 */
export function valueKey (v) {
    const n = toNumber(v);

    return Number.isNaN(n) ? String(v) : "#" + n;
}

/**
 * Predicate for one condition. `get(attr)` reads one attribute of the feature.
 * @param {Object} c The condition.
 * @returns {Function} (get) => Boolean
 */
function predicateForCondition (c) {
    const attr = c.attr;

    if (c.type === "range") {
        const lo = Number.isFinite(c.lo) ? c.lo : -Infinity,
            hi = Number.isFinite(c.hi) ? c.hi : Infinity;

        return get => {
            const n = toNumber(get(attr));

            return !Number.isNaN(n) && n >= lo && n <= hi;
        };
    }
    if (c.type === "in") {
        if (!c.values) {
            return () => true;
        }
        const set = new Set(c.values.map(valueKey));

        return get => valueList(get(attr)).some(x => set.has(valueKey(x)));
    }
    return () => true;
}

/**
 * Predicate for one item.
 * @param {Object} it The item.
 * @returns {Function} (get) => Boolean
 */
function predicateForItem (it) {
    if (it.kind === "group") {
        const op = groupOp(it);

        // an OR-group with a member on "alle" accepts everything
        if (op === "or" && it.conditions.some(isNeutralIn)) {
            return () => true;
        }
        const preds = it.conditions.filter(isConditionUsable).map(predicateForCondition);

        if (!preds.length) {
            return () => true;
        }
        return op === "and" ? get => preds.every(fn => fn(get)) : get => preds.some(fn => fn(get));
    }
    return predicateForCondition(it);
}

/**
 * Builds the predicate of a spec, or null if the spec restricts nothing.
 * The predicate takes a getter `get(attr)` — pass `feature.get.bind(feature)` or
 * `attr => props[attr]` — so no property bag has to be copied per feature.
 * @param {Object} spec The filter spec.
 * @returns {Function|null} (get) => Boolean
 */
export function buildPredicate (spec) {
    if (!spec) {
        return null;
    }
    const chains = topLevelGroups(spec.items);

    if (!chains.length) {
        return null;
    }
    const chainPreds = chains.map(chain => {
        const preds = chain.map(predicateForItem);

        return get => preds.every(fn => fn(get));
    });

    return get => chainPreds.some(fn => fn(get));
}

/**
 * Every attribute a spec reads.
 * @param {Object} spec The filter spec.
 * @returns {String[]} The attributes.
 */
export function filterSpecAttrs (spec) {
    const attrs = new Set();

    (spec?.items ?? []).filter(isItemUsable).forEach(it => {
        (it.kind === "group" ? it.conditions : [it]).forEach(c => c.attr && attrs.add(c.attr));
    });
    return [...attrs];
}

/**
 * A new empty condition.
 * @param {String|null} joiner "and", "or" or null for the first item.
 * @returns {Object} The condition.
 */
export function newCondition (joiner) {
    return {kind: "condition", joiner, attr: null, type: null};
}

/**
 * A new group with two empty conditions.
 * @param {String|null} joiner "and", "or" or null.
 * @param {String} [op="or"] Operator inside the group.
 * @returns {Object} The group.
 */
export function newGroup (joiner, op = "or") {
    return {
        kind: "group",
        joiner,
        op,
        conditions: [newCondition(null), newCondition(null)]
    };
}

/**
 * Initial condition values for an attribute: a numeric column gets its full range,
 * a categorical one "alle".
 * @param {Object} stats The attribute statistics.
 * @returns {Object} {type, lo, hi, values}
 */
export function seedCondition (stats) {
    if (stats.type === "numeric") {
        return {type: "range", lo: stats.min, hi: stats.max, values: undefined};
    }
    if (stats.type === "categorical") {
        return {type: "in", lo: undefined, hi: undefined, values: undefined};
    }
    return {type: null, lo: undefined, hi: undefined, values: undefined};
}

const VALUES_SHOWN = 3;

/**
 * Formats a number the German way.
 * @param {Number} n The number.
 * @returns {String} Formatted.
 */
export function fmtNum (n) {
    // no grouping below 10 000, so years stay years ("2019", not "2.019")
    return Number(n).toLocaleString("de-DE", {maximumFractionDigits: 2, useGrouping: Math.abs(n) >= 10000});
}

/**
 * A condition in words.
 * @param {Object} c The condition.
 * @param {Function} [label] Display name of an attribute.
 * @returns {String} The text.
 */
function conditionText (c, label = a => a) {
    if (!c.attr) {
        return "(kein Attribut)";
    }
    const name = label(c.attr);

    if (c.type === "range") {
        const lo = Number.isFinite(c.lo),
            hi = Number.isFinite(c.hi);

        if (!lo && !hi) {
            return `${name}: (kein Bereich)`;
        }
        if (!lo) {
            return `${name} bis ${fmtNum(c.hi)}`;
        }
        if (!hi) {
            return `${name} ab ${fmtNum(c.lo)}`;
        }
        return `${name} von ${fmtNum(c.lo)} bis ${fmtNum(c.hi)}`;
    }
    if (c.type === "in") {
        if (c.values === undefined) {
            return `${name}: alle Werte`;
        }
        if (!c.values.length) {
            return `${name}: keine Werte`;
        }
        const shown = c.values.slice(0, VALUES_SHOWN).map(String),
            rest = c.values.length - shown.length;

        return `${name} = ${shown.join(", ")}${rest > 0 ? ` (+${rest})` : ""}`;
    }
    return `${name}: (unvollständig)`;
}

/**
 * An item in words, without its joiner.
 * @param {Object} it The item.
 * @param {Function} [label] Display name of an attribute.
 * @returns {String} The text.
 */
function itemBody (it, label) {
    if (it.kind !== "group") {
        return conditionText(it, label);
    }
    const sep = groupOp(it) === "and" ? " UND " : " ODER ";

    return `(${it.conditions.map(c => conditionText(c, label)).join(sep)})`;
}

/**
 * A note for a count: nothing for 0, the singular for 1, else the plural.
 * @param {Number} n The count.
 * @param {String} one Text for one.
 * @param {String} many Text for more.
 * @returns {String} The note.
 */
function countNote (n, one, many) {
    if (n === 0) {
        return "";
    }
    return n === 1 ? one : many;
}

/**
 * The whole spec as one sentence, bracketed the way the predicate binds, and with a
 * note about the items it ignores (c4hh-app UI-80).
 * @param {Object} spec The filter spec.
 * @param {Function} [label] Display name of an attribute.
 * @returns {String} The sentence ("" if nothing at all).
 */
export function filterSpecSentence (spec, label) {
    const items = spec?.items ?? [],
        chains = topLevelGroups(items),
        ignored = items.filter(it => !isItemUsable(it)),
        neutral = ignored.filter(isNeutralItem).length,
        open = ignored.length - neutral,
        notes = [
            countNote(neutral, "eine Bedingung auf „alle Werte“ schränkt nicht ein", `${neutral} Bedingungen auf „alle Werte“ schränken nicht ein`),
            countNote(open, "eine unvollständige Bedingung zählt nicht", `${open} unvollständige Bedingungen zählen nicht`)
        ].filter(Boolean).join("; ");

    if (!chains.length) {
        return notes;
    }
    const sentence = chains
        .map(chain => {
            const txt = chain.map(it => itemBody(it, label)).join(" UND ");

            return chains.length > 1 && chain.length > 1 ? `(${txt})` : txt;
        })
        .join(" ODER ");

    return notes ? `${sentence} — ${notes}` : sentence;
}
