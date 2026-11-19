/**
 * Talking to a Planungszwilling (repo c4hh-twin4planning, SPEC §7/§8): its address,
 * the view urls and the read-only JSON api. Everything here is GET — the service
 * allows that from the browser (CORS_ORIGINS). Writing comes later.
 *
 * Planning case and date live in the PATH of a view:
 *   {base}/oaf/p/{planfall}/{stichtag}[@{stand_at}][+entfallen]
 */

/** Ids of the layers in services.json that read a Planungszwilling view. */
export const TWIN_LAYER_PREFIX = "planungszwilling_";

/** Reifegrad names of the spec (a collection may rename them). */
export const REIFEGRAD_NAMES = {
    0: "Idee",
    1: "Potenzial/Untersuchung",
    2: "Verfahren eingeleitet",
    3: "Planrecht bzw. Planfeststellung",
    4: "im Bau",
    5: "in Betrieb"
};

/** Words for a planning case status. */
export const STATUS_LABELS = {entwurf: "Entwurf", abgestimmt: "abgestimmt", beschlossen: "beschlossen"};

const VIEW_PATH = /^(.*?)\/oaf\/p\/([^/]+)\/([^/@+]+)(@[^/+]+)?(\+entfallen)?\/?$/;

/**
 * Splits the url of a view layer.
 * @param {String} url E.g. "https://pz.example/oaf/p/demo-sicht/2029+entfallen".
 * @returns {Object|null} {base, planfall, stichtag, standAt, entfallen}, null if no view url.
 */
export function parseViewUrl (url) {
    const m = typeof url === "string" ? url.match(VIEW_PATH) : null;

    if (!m) {
        return null;
    }
    return {base: m[1], planfall: m[2], stichtag: m[3], standAt: m[4] ? m[4].slice(1) : null, entfallen: Boolean(m[5])};
}

/**
 * The url of a view.
 * @param {String} base Base url of the Planungszwilling, no trailing slash.
 * @param {String} planfall Slug of the planning case.
 * @param {String|Number} stichtag "heute", a year or "JJJJ-MM-TT".
 * @param {Boolean} [entfallen=false] Show removed objects too.
 * @returns {String} The url.
 */
export function buildViewUrl (base, planfall, stichtag, entfallen = false) {
    return `${base}/oaf/p/${encodeURIComponent(planfall)}/${stichtag}${entfallen ? "+entfallen" : ""}`;
}

/**
 * Whether a base url can be reached at all (not the placeholder of an unset
 * PLANUNGSZWILLING_URL).
 * @param {String|null} base The base url.
 * @returns {Boolean} True if usable.
 */
export function isConfiguredBase (base) {
    return typeof base === "string" && (/^https?:\/\//).test(base) && !(/\.invalid(\/|:|$)/).test(base);
}

/**
 * Fetches JSON from the Planungszwilling.
 * @param {String} url The url.
 * @param {Function} [fetchFn=fetch] Fetch (tests).
 * @returns {Promise<*>} The parsed body.
 */
export async function fetchJson (url, fetchFn = fetch) {
    let response;

    try {
        response = await fetchFn(url, {headers: {Accept: "application/json"}});
    }
    catch (e) {
        throw new Error("Der Planungszwilling ist nicht erreichbar.");
    }
    if (!response.ok) {
        let satz = "";

        try {
            const body = await response.json();

            satz = body?.message || body?.statusMessage || body?.fehler || "";
        }
        catch (e) {
            satz = "";
        }
        throw new Error(satz || `Der Planungszwilling antwortet mit ${response.status}.`);
    }
    return response.json();
}

/**
 * Reads what a viewer needs to choose: planning cases and projects with their phases.
 * @param {String} base Base url.
 * @param {Function} [fetchFn=fetch] Fetch (tests).
 * @returns {Promise<{planfaelle: Object[], vorhaben: Object[]}>} Overview.
 */
export async function loadOverview (base, fetchFn = fetch) {
    const [planfaelle, vorhabenList] = await Promise.all([
            fetchJson(`${base}/api/planfaelle`, fetchFn),
            fetchJson(`${base}/api/vorhaben`, fetchFn).catch(() => [])
        ]),
        vorhaben = await Promise.all(vorhabenList.map(v => fetchJson(`${base}/api/vorhaben/${encodeURIComponent(v.slug)}`, fetchFn).catch(() => v)));

    return {planfaelle, vorhaben};
}

/**
 * The parts a planning case is made of, flattened (SPEC §6 "Komposition"): the case
 * itself (threshold 0), its parent chain and its parts, each with its threshold. A part
 * listed twice counts once, with the higher threshold. Cycles are cut.
 * @param {String} slug The planning case.
 * @param {Object[]} planfaelle All readable planning cases (from /api/planfaelle).
 * @returns {Object[]} [{slug, label, schwelle, standAt, eigen}]
 */
export function compositionOf (slug, planfaelle) {
    const bySlug = new Map(planfaelle.map(p => [p.slug, p])),
        result = new Map();

    /**
     * Adds a planning case and what it is made of.
     * @param {String} s Slug.
     * @param {Number} schwelle Threshold that applies to its entries.
     * @param {String|null} standAt Frozen at this system time.
     * @param {Boolean} eigen Whether it is the chosen case itself.
     * @param {Set} path Slugs on the way here (cycle guard).
     * @returns {void}
     */
    function add (s, schwelle, standAt, eigen, path) {
        const p = bySlug.get(s);

        if (path.has(s)) {
            return;
        }
        const known = result.get(s);

        if (!known) {
            result.set(s, {slug: s, label: p?.label ?? s, schwelle, standAt, eigen});
        }
        else {
            known.schwelle = Math.max(known.schwelle, schwelle);
        }
        if (!p) {
            return;
        }
        const next = new Set(path).add(s);

        (p.teile ?? []).forEach(t => add(t.slug, Math.max(schwelle, t.min_reifegrad ?? 0), t.stand_at ?? standAt, false, next));
        if (p.parent) {
            add(p.parent, schwelle, standAt, false, next);
        }
    }
    add(slug, 0, null, true, new Set());
    return [...result.values()];
}

/**
 * Loads the batches of every part of a planning case.
 * @param {String} base Base url.
 * @param {Object[]} parts From compositionOf.
 * @param {Function} [fetchFn=fetch] Fetch (tests).
 * @returns {Promise<Object[]>} [{part, stapel: [...]}]; a part that cannot be read has stapel [] and an error.
 */
export async function loadBatches (base, parts, fetchFn = fetch) {
    return Promise.all(parts.map(async part => {
        try {
            return {part, stapel: await fetchJson(`${base}/api/planfaelle/${encodeURIComponent(part.slug)}/stapel`, fetchFn)};
        }
        catch (e) {
            return {part, stapel: [], error: e.message};
        }
    }));
}

/**
 * The yearly balance of a planning case (dwellings and floor space).
 * @param {String} base Base url.
 * @param {String} slug Planning case.
 * @param {Number} von First year.
 * @param {Number} bis Last year.
 * @param {Function} [fetchFn=fetch] Fetch (tests).
 * @returns {Promise<Object>} {felder, zeilen: [{jahr, werte: {we: {neu, entfaellt, netto, kumuliert}}}]}
 */
export function loadBalance (base, slug, von, bis, fetchFn = fetch) {
    return fetchJson(`${base}/api/planfaelle/${encodeURIComponent(slug)}/bilanz?von=${von}&bis=${bis}`, fetchFn);
}

/**
 * One object of a view, in the map's CRS (to zoom to it).
 * @param {String} viewUrl View url.
 * @param {String} sammlung Collection.
 * @param {String} objektId Object id.
 * @param {String} crs CRS uri for the answer.
 * @param {Function} [fetchFn=fetch] Fetch (tests).
 * @returns {Promise<Object>} GeoJSON feature.
 */
export function loadItem (viewUrl, sammlung, objektId, crs, fetchFn = fetch) {
    return fetchJson(`${viewUrl}/collections/${encodeURIComponent(sammlung)}/items/${encodeURIComponent(objektId)}?f=json&crs=${encodeURIComponent(crs)}`, fetchFn);
}
