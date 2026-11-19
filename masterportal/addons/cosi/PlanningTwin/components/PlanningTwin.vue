<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import GeoJSON from "ol/format/GeoJSON.js";
import layerCollection from "@core/layers/js/layerCollection";
import {
    REIFEGRAD_NAMES, STATUS_LABELS, buildViewUrl, compositionOf, isConfiguredBase,
    loadBalance, loadBatches, loadItem, loadOverview, parseViewUrl
} from "../utils/twinApi.js";
import {
    COLLECTION_LABELS, OP_LABELS, assignLanes, balanceRows, datePosition, entrySentence, formatDate,
    isEffective, stichtagDate, timelineEntries, timelineRows, yearRange
} from "../utils/twinTimeline.js";
import {PF_STATES, isTwinLayer, stateGraphic, styleTwinLayer, switchLayerView, viewLayerName} from "../utils/twinLayers.js";

/** Geometry kind of the known collections (for symbols before anything is loaded). */
const GEOM_KINDS = {kitas: "point", schulen: "point", oepnv_halte: "point", soziales: "point", wohnbau: "area", gebaeude: "area", parken: "area"};
/** Debounce of the map update while dragging the date slider (ms). */
const VIEW_WAIT = 300;
/** Timeline geometry (SVG user units). */
const TL = {label: 78, right: 12, row: 26, axis: 22, phase: 18, lane: 15, gap: 14};
/** Balance chart geometry. */
const BC = {height: 160, left: 44, right: 12, top: 12, bottom: 24};

/**
 * Planungszwilling (beta) — browse the planning cases of a Planungszwilling: which
 * cases exist, what they change when (timeline), the map at a date (the
 * planungszwilling_* layers switch their view) and the dwelling balance per year.
 * Read-only; proposing changes comes with the login.
 */
export default {
    name: "PlanningTwin",
    data () {
        return {
            loading: false,
            error: null,
            planfaelle: [],
            vorhaben: [],
            entries: [],
            partErrors: [],
            bilanz: null,
            selectedKey: null,
            itemNote: null,
            thisYear: new Date().getFullYear(),
            chartWidth: 320,
            TL,
            BC
        };
    },
    computed: {
        ...mapGetters(["allLayerConfigs"]),
        ...mapGetters("Modules/PlanningTwin", ["planfall", "stichtag", "entfallen"]),

        twinLayerConfs () {
            return this.allLayerConfigs.filter(isTwinLayer);
        },
        initialView () {
            return this.twinLayerConfs.map(c => parseViewUrl(c.url)).find(Boolean) ?? null;
        },
        base () {
            return this.initialView?.base ?? null;
        },
        configured () {
            return isConfiguredBase(this.base);
        },
        current () {
            return this.planfaelle.find(p => p.slug === this.planfall) ?? null;
        },
        parts () {
            return this.planfall ? compositionOf(this.planfall, this.planfaelle) : [];
        },
        groups () {
            const staende = this.planfaelle.filter(p => p.art === "planungsstand").sort((a, b) => String(a.thema).localeCompare(String(b.thema), "de")),
                  varianten = this.planfaelle.filter(p => p.art !== "planungsstand").sort((a, b) => a.label.localeCompare(b.label, "de"));

            return [{label: "Planungsstände je Thema", items: staende}, {label: "Varianten", items: varianten}].filter(g => g.items.length);
        },
        vorhabenLabels () {
            return Object.fromEntries(this.vorhaben.map(v => [v.slug, v.label]));
        },
        phases () {
            const used = new Set(this.entries.map(e => e.vorhaben).filter(Boolean));

            return this.vorhaben
                .filter(v => used.has(v.slug))
                .flatMap(v => (v.abschnitte ?? []).filter(a => a.ab).map(a => ({
                    key: `${v.slug}:${a.key}`,
                    label: used.size > 1 ? `${v.label.slice(0, 8)} ${a.key}` : a.key,
                    title: `${v.label}, ${a.label}`,
                    ab: a.ab,
                    bis: a.bis ?? a.ab
                })));
        },
        range () {
            return yearRange(this.entries, this.phases, this.thisYear);
        },
        years () {
            const out = [];

            for (let y = this.range[0]; y <= this.range[1]; y++) {
                out.push(y);
            }
            return out;
        },
        sliderYears () {
            return this.years.filter(y => y >= this.thisYear);
        },
        sliderIndex () {
            return this.stichtag === "heute" ? 0 : Math.max(0, this.sliderYears.indexOf(Number(this.stichtag)) + 1);
        },
        dateIso () {
            return stichtagDate(this.stichtag);
        },
        stichtagText () {
            return this.stichtag === "heute" ? "heute" : formatDate(this.dateIso);
        },
        rows () {
            return timelineRows(this.entries);
        },
        effective () {
            return this.entries.filter(e => isEffective(e, this.dateIso));
        },
        /**
         * Rows with their markers; markers closer than a symbol share no lane.
         * @returns {Object[]} [{key, label, color, y, marks: [{e, x, y}]}]
         */
        rowLayout () {
            let top = TL.axis + this.phases.length * TL.phase;

            return this.rows.map(row => {
                const xs = row.entries.map(e => this.xOf(e.datum ?? this.dateIso)),
                      lanes = assignLanes(xs, TL.gap),
                      laneCount = Math.max(1, ...lanes.map(l => l + 1)),
                      height = Math.max(TL.row, laneCount * TL.lane + 12),
                      y = top + TL.row / 2,
                      out = {...row, y, marks: row.entries.map((e, i) => ({e, x: xs[i], y: y + lanes[i] * TL.lane}))};

                top += height;
                return out;
            });
        },
        timelineHeight () {
            const last = this.rowLayout[this.rowLayout.length - 1];

            return last ? Math.max(...last.marks.map(m => m.y), last.y) + TL.row / 2 + 4 : TL.axis + this.phases.length * TL.phase + 8;
        },
        stichtagX () {
            return this.xOf(this.dateIso);
        },
        balance () {
            return balanceRows(this.bilanz, "we").filter(r => r.jahr >= this.range[0] && r.jahr <= this.range[1]);
        },
        balanceHasData () {
            return this.balance.some(r => r.neu || r.entfaellt);
        },
        balanceScale () {
            const values = this.balance.flatMap(r => [r.neu, -r.entfaellt, r.kumuliert, 0]),
                  max = Math.max(...values, 1),
                  min = Math.min(...values, 0),
                  y0 = BC.top,
                  y1 = BC.height - BC.bottom;

            return {min, max, y: v => y1 - (v - min) / (max - min) * (y1 - y0)};
        },
        balanceStep () {
            return (this.chartWidth - BC.left - BC.right) / Math.max(1, this.balance.length);
        },
        balanceTicks () {
            const {min, max} = this.balanceScale,
                  step = niceStep((max - min) / 4),
                  out = [];

            for (let k = Math.ceil(min / step); k * step <= max; k++) {
                // k * step with k = 0 may be -0
                out.push(k * step + 0);
            }
            return out;
        },
        cumulativePath () {
            return this.balance.map((r, i) => `${i ? "L" : "M"}${(BC.left + (i + 0.5) * this.balanceStep).toFixed(1)} ${this.balanceScale.y(r.kumuliert).toFixed(1)}`).join(" ");
        },
        selected () {
            return this.entries.find(e => e.key === this.selectedKey) ?? null;
        },
        legendStates () {
            return PF_STATES;
        },
        hasThreshold () {
            return this.parts.some(p => p.schwelle > 0);
        }
    },
    watch: {
        // layers switched on in the layer tree get the planning style too
        twinLayerConfs: {
            handler () {
                this.$nextTick(() => this.styleCreatedLayers());
            },
            deep: true
        }
    },
    created () {
        // OL layers that already carry the planning style (not reactive on purpose)
        this.styled = new WeakSet();
    },
    mounted () {
        if (!this.configured) {
            return;
        }
        if (!this.planfall && this.initialView) {
            this.setPlanfall(this.initialView.planfall);
            this.setStichtag(this.initialView.stichtag);
            this.setEntfallen(this.initialView.entfallen);
        }
        this.styleCreatedLayers();
        this.loadAll();
        this.measure();
        if (typeof ResizeObserver !== "undefined" && this.$refs.root) {
            this.resizeObserver = new ResizeObserver(() => this.measure());
            this.resizeObserver.observe(this.$refs.root);
        }
    },
    beforeUnmount () {
        clearTimeout(this.viewTimer);
        this.resizeObserver?.disconnect();
    },
    methods: {
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapMutations("Modules/PlanningTwin", ["setPlanfall", "setStichtag", "setEntfallen"]),
        formatDate,
        entrySentence,

        measure () {
            const w = this.$refs.root?.clientWidth;

            if (w > 0) {
                this.chartWidth = Math.max(240, Math.round(w));
            }
        },

        async loadAll () {
            this.loading = true;
            this.error = null;
            try {
                const {planfaelle, vorhaben} = await loadOverview(this.base);

                this.planfaelle = planfaelle;
                this.vorhaben = vorhaben;
                if (!planfaelle.some(p => p.slug === this.planfall)) {
                    this.setPlanfall(planfaelle.find(p => p.art === "variante")?.slug ?? planfaelle[0]?.slug ?? null);
                }
                await this.loadPlanfall();
            }
            catch (e) {
                this.error = e.message;
            }
            finally {
                this.loading = false;
            }
        },

        async loadPlanfall () {
            if (!this.planfall) {
                this.entries = [];
                this.bilanz = null;
                return;
            }
            const slug = this.planfall,
                  [batches, bilanz] = await Promise.all([
                      loadBatches(this.base, this.parts),
                      loadBalance(this.base, slug, this.thisYear, this.thisYear + 15).catch(() => null)
                  ]);

            if (slug !== this.planfall) {
                return;
            }
            this.entries = timelineEntries(batches);
            this.partErrors = batches.filter(b => b.error).map(b => `${b.part.label}: ${b.error}`);
            this.bilanz = bilanz;
            // the balance over the whole range of the timeline
            if (this.range[0] < this.thisYear || this.range[1] > this.thisYear + 15) {
                this.bilanz = await loadBalance(this.base, slug, this.range[0], this.range[1]).catch(() => bilanz);
            }
        },

        async choosePlanfall (slug) {
            this.setPlanfall(slug);
            this.selectedKey = null;
            this.itemNote = null;
            this.applyView();
            this.loading = true;
            try {
                await this.loadPlanfall();
            }
            catch (e) {
                this.error = e.message;
            }
            finally {
                this.loading = false;
            }
        },

        onSlider (index) {
            this.setStichtag(Number(index) === 0 ? "heute" : String(this.sliderYears[Number(index) - 1]));
            clearTimeout(this.viewTimer);
            this.viewTimer = setTimeout(() => this.applyView(), VIEW_WAIT);
        },

        chooseYear (year) {
            this.setStichtag(String(year));
            this.applyView();
        },

        toggleEntfallen (value) {
            this.setEntfallen(value);
            this.applyView();
        },

        viewUrl (stichtag = this.stichtag, entfallen = this.entfallen) {
            return buildViewUrl(this.base, this.planfall, stichtag, entfallen);
        },

        /**
         * Points every twin layer at the chosen view: config (url, name) and, for
         * created layers, their source.
         * @returns {void}
         */
        applyView () {
            if (!this.planfall || !this.configured) {
                return;
            }
            const url = this.viewUrl(),
                  label = this.current?.label ?? this.planfall;

            this.replaceByIdInLayerConfig({
                layerConfigs: this.twinLayerConfs.map(c => ({
                    id: c.id,
                    layer: {id: c.id, url, name: viewLayerName(COLLECTION_LABELS[c.collection] ?? c.collection, label, this.stichtagText)}
                }))
            });
            this.twinLayerConfs.forEach(c => {
                const layer = layerCollection.getLayerById(c.id);

                if (layer) {
                    switchLayerView(layer, url);
                    this.styleLayer(layer);
                }
            });
        },

        styleLayer (layer) {
            styleTwinLayer(layer, GEOM_KINDS[layer.get("collection")] ?? "point", l => {
                this.$store.dispatch("Modules/Legend/toggleLayerInLegend", {layer: l, visibility: l.get("visibility") === true});
            });
        },

        styleCreatedLayers () {
            this.twinLayerConfs.forEach(c => {
                const layer = layerCollection.getLayerById(c.id),
                      ol = layer?.getLayer?.();

                if (ol && !this.styled.has(ol)) {
                    this.styled.add(ol);
                    this.styleLayer(layer);
                }
            });
        },

        isVisible (conf) {
            return conf.visibility === true;
        },

        toggleLayer (conf) {
            this.replaceByIdInLayerConfig({layerConfigs: [{id: conf.id, layer: {id: conf.id, visibility: !this.isVisible(conf), showInLayerTree: true}}]});
        },

        xOf (date) {
            return TL.label + datePosition(date, this.range) * (this.chartWidth - TL.label - TL.right);
        },

        yearX (year) {
            return this.xOf(`${year}-01-01`);
        },

        showYearLabel (year) {
            const perYear = (this.chartWidth - TL.label - TL.right) / Math.max(1, this.years.length),
                  every = [1, 2, 5, 10].find(n => n * perYear >= 30) ?? 10;

            return (year - this.range[0]) % every === 0;
        },

        markerPath (op, x, y) {
            const r = 6;

            if (op === "insert") {
                return `M${x} ${y - r} L${x + r} ${y + r * 0.8} L${x - r} ${y + r * 0.8} Z`;
            }
            if (op === "delete") {
                return `M${x - r} ${y - r} L${x + r} ${y + r} M${x + r} ${y - r} L${x - r} ${y + r}`;
            }
            return `M${x - r} ${y} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
        },

        entryTitle (e) {
            return `${COLLECTION_LABELS[e.sammlung] ?? e.sammlung}: ${e.name} — ${entrySentence(e, this.vorhabenLabels)}${e.unterSchwelle ? " (unter der Schwelle, zählt nicht)" : ""}`;
        },

        reifegradName (n) {
            return REIFEGRAD_NAMES[n] ?? String(n);
        },

        statusLabel (s) {
            return STATUS_LABELS[s] ?? s;
        },

        collectionLabel (key, fallback) {
            return COLLECTION_LABELS[key] ?? fallback ?? key;
        },

        opLabel (op) {
            return OP_LABELS[op] ?? op;
        },

        legendGraphic (state) {
            return stateGraphic("kitas", state, "point");
        },

        /**
         * Selects an entry: the map jumps to its date and zooms to the object.
         * @param {Object} e Timeline entry.
         * @returns {Promise<void>} Done.
         */
        async selectEntry (e) {
            this.selectedKey = e.key;
            this.itemNote = null;
            if (e.unterSchwelle) {
                this.itemNote = "Dieser Eintrag liegt unter der Reifegrad-Schwelle des Planfalls und erscheint deshalb nicht auf der Karte.";
                return;
            }
            const year = e.datum ? Number(e.datum.slice(0, 4)) : null;

            if (year && year > this.thisYear) {
                this.setStichtag(String(year));
            }
            if (e.op === "delete") {
                this.setEntfallen(true);
            }
            this.applyView();
            const conf = this.twinLayerConfs.find(c => c.collection === e.sammlung);

            if (conf && !this.isVisible(conf)) {
                this.toggleLayer(conf);
            }
            try {
                const map = window.mapCollection?.getMap("2D"),
                      crs = conf?.crs || "http://www.opengis.net/def/crs/EPSG/0/25832",
                      item = await loadItem(this.viewUrl(), e.sammlung, e.objektId, crs),
                      geom = new GeoJSON().readGeometry(item.geometry);

                map?.getView().fit(geom.getExtent(), {maxZoom: 6, padding: [60, 60, 60, 60], duration: 400});
            }
            catch (err) {
                this.itemNote = `Das Objekt ließ sich nicht laden: ${err.message}`;
            }
        },

        openInTwin () {
            return `${this.base}/ui/planfaelle/${encodeURIComponent(this.planfall)}?stichtag=${this.stichtag}`;
        }
    }
};

/**
 * A round step for axis ticks (1, 2, 5 × 10^n).
 * @param {Number} raw Wanted step.
 * @returns {Number} The step.
 */
function niceStep (raw) {
    const p = Math.pow(10, Math.floor(Math.log10(Math.max(raw, 1e-9)))),
          f = raw / p;

    if (f <= 1) {
        return p;
    }
    if (f <= 2) {
        return 2 * p;
    }
    return f <= 5 ? 5 * p : 10 * p;
}
</script>

<template lang="html">
    <div
        id="cosi-planning-twin"
        ref="root"
    >
        <p
            v-if="!configured"
            class="alert alert-warning small"
        >
            Kein Planungszwilling eingerichtet. Beim Deploy <code>PLANUNGSZWILLING_URL</code> setzen
            (siehe <code>deploy/Readme.md</code>); der Planungszwilling muss diese Adresse in
            <code>CORS_ORIGINS</code> erlauben.
        </p>
        <template v-else>
            <p class="small text-muted mb-2">
                Planungsstände und Varianten aus dem Planungszwilling. Die Karte zeigt die Layer
                im Ordner „Planungszwilling" für den gewählten Planfall und Stichtag.
            </p>
            <p
                v-if="error"
                class="alert alert-danger small"
                role="alert"
            >
                {{ error }}
                <button
                    type="button"
                    class="btn btn-link btn-sm p-0 ms-1 align-baseline"
                    @click="loadAll"
                >
                    Erneut versuchen
                </button>
            </p>

            <!-- planning case -->
            <section class="mb-3">
                <label
                    for="pt-planfall"
                    class="form-label fw-bold mb-1"
                >Planfall</label>
                <select
                    id="pt-planfall"
                    class="form-select form-select-sm"
                    :value="planfall"
                    :disabled="loading && !planfaelle.length"
                    @change="choosePlanfall($event.target.value)"
                >
                    <optgroup
                        v-for="g in groups"
                        :key="g.label"
                        :label="g.label"
                    >
                        <option
                            v-for="p in g.items"
                            :key="p.slug"
                            :value="p.slug"
                        >
                            {{ p.label }}
                        </option>
                    </optgroup>
                </select>
                <div
                    v-if="current"
                    class="pt-case small mt-2"
                >
                    <div>
                        <span class="badge text-bg-light border me-1">{{ current.art === "planungsstand" ? "Planungsstand" : "Variante" }}</span>
                        <span class="badge text-bg-light border me-1">{{ statusLabel(current.status) }}</span>
                        <span
                            v-if="current.thema"
                            class="text-muted"
                        >Thema {{ current.thema }}</span>
                    </div>
                    <p
                        v-if="current.beschreibung"
                        class="mb-1 mt-1"
                    >
                        {{ current.beschreibung }}
                    </p>
                    <ul
                        v-if="parts.length > 1"
                        class="pt-parts mb-1"
                    >
                        <li
                            v-for="p in parts.filter(x => !x.eigen)"
                            :key="p.slug"
                        >
                            {{ p.label }}<span
                                v-if="p.schwelle > 0"
                                class="text-muted"
                            > · erst ab Reifegrad „{{ reifegradName(p.schwelle) }}"</span>
                        </li>
                    </ul>
                    <a
                        :href="openInTwin()"
                        target="_blank"
                        rel="noopener"
                    >Im Planungszwilling öffnen <i class="bi bi-box-arrow-up-right" /></a>
                </div>
            </section>

            <!-- date + layers -->
            <section class="mb-3">
                <label
                    for="pt-stichtag"
                    class="form-label fw-bold mb-1"
                >Stichtag: {{ stichtagText }}</label>
                <input
                    id="pt-stichtag"
                    type="range"
                    class="form-range"
                    min="0"
                    :max="sliderYears.length"
                    step="1"
                    :value="sliderIndex"
                    :aria-valuetext="stichtagText"
                    @input="onSlider($event.target.value)"
                >
                <div class="d-flex justify-content-between small text-muted pt-slider-ends">
                    <span>heute</span><span>{{ sliderYears[sliderYears.length - 1] }}</span>
                </div>
                <div class="form-check form-switch small mt-1">
                    <input
                        id="pt-entfallen"
                        class="form-check-input"
                        type="checkbox"
                        :checked="entfallen"
                        @change="toggleEntfallen($event.target.checked)"
                    >
                    <label
                        class="form-check-label"
                        for="pt-entfallen"
                    >Entfallene zeigen (Abriss, Schließung)</label>
                </div>
                <div class="pt-layers mt-2">
                    <div
                        v-for="c in twinLayerConfs"
                        :key="c.id"
                        class="form-check small"
                    >
                        <input
                            :id="'pt-layer-' + c.id"
                            class="form-check-input pt-layer-toggle"
                            type="checkbox"
                            :checked="isVisible(c)"
                            @change="toggleLayer(c)"
                        >
                        <label
                            class="form-check-label"
                            :for="'pt-layer-' + c.id"
                        >{{ collectionLabel(c.collection, c.name) }}</label>
                    </div>
                </div>
                <div
                    class="pt-state-legend small mt-1"
                    aria-label="Darstellung auf der Karte"
                >
                    <span
                        v-for="s in legendStates"
                        :key="s.key"
                        class="me-2"
                    ><img
                        :src="legendGraphic(s.key)"
                        alt=""
                        width="16"
                        height="16"
                    > {{ s.label }}</span>
                </div>
            </section>

            <!-- timeline -->
            <section class="mb-3">
                <h4 class="pt-heading">
                    Zeitleiste
                    <span class="small text-muted fw-normal">{{ effective.length }} von {{ entries.length }} Änderungen gelten am Stichtag</span>
                </h4>
                <p
                    v-for="msg in partErrors"
                    :key="msg"
                    class="small text-danger mb-1"
                >
                    {{ msg }}
                </p>
                <p
                    v-if="!entries.length && !loading"
                    class="small text-muted"
                >
                    Dieser Planfall enthält noch keine Änderungen.
                </p>
                <svg
                    v-else-if="entries.length"
                    class="pt-timeline"
                    :viewBox="`0 0 ${chartWidth} ${timelineHeight}`"
                    role="img"
                    :aria-label="`Zeitleiste ${range[0]} bis ${range[1]}, ${entries.length} Änderungen`"
                >
                    <!-- years -->
                    <g class="pt-axis">
                        <g
                            v-for="y in years"
                            :key="y"
                            class="pt-year"
                            role="button"
                            tabindex="-1"
                            @click="chooseYear(y)"
                            @keydown.enter="chooseYear(y)"
                        >
                            <title>Stichtag 31.12.{{ y }}</title>
                            <rect
                                :x="yearX(y)"
                                y="0"
                                :width="yearX(y + 1) - yearX(y)"
                                :height="timelineHeight"
                                fill="transparent"
                            />
                            <line
                                :x1="yearX(y)"
                                :x2="yearX(y)"
                                :y1="TL.axis - 4"
                                :y2="timelineHeight"
                                class="pt-grid"
                            />
                            <text
                                v-if="showYearLabel(y)"
                                :x="yearX(y) + 2"
                                y="12"
                                class="pt-tick"
                            >{{ y }}</text>
                        </g>
                    </g>
                    <!-- project phases -->
                    <g
                        v-for="(ph, i) in phases"
                        :key="ph.key"
                    >
                        <title>{{ ph.title }}: {{ formatDate(ph.ab) }} – {{ formatDate(ph.bis) }}</title>
                        <text
                            :x="TL.label - 6"
                            :y="TL.axis + i * TL.phase + 12"
                            class="pt-row-label"
                            text-anchor="end"
                        >{{ ph.label }}</text>
                        <rect
                            :x="xOf(ph.ab)"
                            :y="TL.axis + i * TL.phase + 4"
                            :width="Math.max(4, xOf(ph.bis) - xOf(ph.ab))"
                            height="10"
                            rx="4"
                            class="pt-phase"
                        />
                    </g>
                    <!-- collections -->
                    <g
                        v-for="row in rowLayout"
                        :key="row.key"
                    >
                        <text
                            :x="TL.label - 6"
                            :y="row.y + 4"
                            class="pt-row-label"
                            text-anchor="end"
                        >{{ row.label }}</text>
                        <line
                            :x1="TL.label"
                            :x2="chartWidth - TL.right"
                            :y1="row.y"
                            :y2="row.y"
                            class="pt-row-line"
                        />
                        <g
                            v-for="m in row.marks"
                            :key="m.e.key"
                            class="pt-marker"
                            :class="{selected: m.e.key === selectedKey, muted: m.e.unterSchwelle}"
                            tabindex="0"
                            role="button"
                            :aria-label="entryTitle(m.e)"
                            @click="selectEntry(m.e)"
                            @keydown.enter="selectEntry(m.e)"
                        >
                            <title>{{ entryTitle(m.e) }}</title>
                            <circle
                                :cx="m.x"
                                :cy="m.y"
                                r="7"
                                fill="transparent"
                            />
                            <line
                                v-if="m.e.bis"
                                :x1="m.x"
                                :x2="xOf(m.e.bis)"
                                :y1="m.y"
                                :y2="m.y"
                                :stroke="row.color"
                                stroke-width="2"
                            />
                            <path
                                :d="markerPath(m.e.op, m.x, m.y)"
                                :fill="m.e.op === 'delete' || m.e.unterSchwelle ? 'none' : row.color"
                                :stroke="m.e.op === 'delete' ? '#d03b3b' : row.color"
                                :stroke-width="m.e.op === 'delete' ? 2.5 : 2"
                                class="pt-mark"
                            />
                        </g>
                    </g>
                    <!-- date -->
                    <line
                        :x1="stichtagX"
                        :x2="stichtagX"
                        :y1="TL.axis - 6"
                        :y2="timelineHeight"
                        class="pt-now"
                    />
                </svg>
                <p class="small text-muted mb-1 pt-key">
                    ▲ neu · ● geändert · <span class="text-danger">✕</span> entfällt · hohl = unter der Reifegrad-Schwelle ·
                    Balken = Bauabschnitte. Klick auf ein Jahr setzt den Stichtag, Klick auf eine Änderung zeigt sie auf der Karte.
                </p>
                <div
                    v-if="selected"
                    class="pt-selected small border rounded p-2"
                >
                    <strong>{{ selected.name }}</strong>&nbsp;
                    <span class="text-muted">({{ collectionLabel(selected.sammlung) }})</span>
                    <div>{{ entrySentence(selected, vorhabenLabels) }}</div>
                    <div
                        v-if="selected.note"
                        class="text-muted"
                    >
                        „{{ selected.note }}" · aus {{ selected.planfallLabel }}
                    </div>
                    <div
                        v-if="itemNote"
                        class="text-danger"
                    >
                        {{ itemNote }}
                    </div>
                </div>
                <details
                    v-if="entries.length"
                    class="small mt-2"
                >
                    <summary>Alle Änderungen als Liste</summary>
                    <table class="table table-sm pt-table mt-1">
                        <thead>
                            <tr>
                                <th>ab</th><th>Thema</th><th>Objekt</th><th>Art</th><th>Reifegrad</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="e in entries"
                                :key="e.key"
                                :class="{'text-muted': e.unterSchwelle}"
                                @click="selectEntry(e)"
                            >
                                <td>{{ e.datum ? formatDate(e.datum) : "–" }}</td>
                                <td>{{ collectionLabel(e.sammlung) }}</td>
                                <td>{{ e.name }}</td>
                                <td>{{ opLabel(e.op) }}</td>
                                <td>{{ reifegradName(e.reifegrad) }}{{ e.unterSchwelle ? " (unter Schwelle)" : "" }}</td>
                            </tr>
                        </tbody>
                    </table>
                </details>
            </section>

            <!-- balance -->
            <section
                v-if="balanceHasData"
                class="mb-2"
            >
                <h4 class="pt-heading">
                    Bilanz Wohneinheiten
                </h4>
                <div class="pt-chart-legend small">
                    <span><i class="pt-swatch pt-new" /> neu</span>
                    <span><i class="pt-swatch pt-gone" /> entfällt</span>
                    <span><i class="pt-swatch pt-line" /> Saldo seit heute</span>
                </div>
                <svg
                    class="pt-balance"
                    :viewBox="`0 0 ${chartWidth} ${BC.height}`"
                    role="img"
                    aria-label="Wohneinheiten je Jahr: neu, entfallend und Saldo"
                >
                    <g
                        v-for="t in balanceTicks"
                        :key="t"
                    >
                        <line
                            :x1="BC.left"
                            :x2="chartWidth - BC.right"
                            :y1="balanceScale.y(t)"
                            :y2="balanceScale.y(t)"
                            :class="t === 0 ? 'pt-zero' : 'pt-grid'"
                        />
                        <text
                            :x="BC.left - 4"
                            :y="balanceScale.y(t) + 3"
                            class="pt-tick"
                            text-anchor="end"
                        >{{ t.toLocaleString("de-DE") }}</text>
                    </g>
                    <g
                        v-for="(r, i) in balance"
                        :key="r.jahr"
                        class="pt-bar"
                    >
                        <title>{{ r.jahr }}: {{ r.neu }} neu, {{ r.entfaellt }} entfallen, Saldo {{ r.kumuliert }}</title>
                        <rect
                            :x="BC.left + i * balanceStep"
                            :y="BC.top"
                            :width="balanceStep"
                            :height="BC.height - BC.top - BC.bottom"
                            fill="transparent"
                        />
                        <rect
                            v-if="r.neu"
                            :x="BC.left + i * balanceStep + balanceStep * 0.2"
                            :y="balanceScale.y(r.neu)"
                            :width="balanceStep * 0.6"
                            :height="balanceScale.y(0) - balanceScale.y(r.neu) - 1"
                            class="pt-new"
                        />
                        <rect
                            v-if="r.entfaellt"
                            :x="BC.left + i * balanceStep + balanceStep * 0.2"
                            :y="balanceScale.y(0) + 1"
                            :width="balanceStep * 0.6"
                            :height="balanceScale.y(-r.entfaellt) - balanceScale.y(0) - 1"
                            class="pt-gone"
                        />
                        <text
                            v-if="i % (balance.length > 12 ? 2 : 1) === 0"
                            :x="BC.left + (i + 0.5) * balanceStep"
                            :y="BC.height - 8"
                            class="pt-tick"
                            text-anchor="middle"
                        >{{ r.jahr }}</text>
                    </g>
                    <path
                        :d="cumulativePath"
                        class="pt-cumulative"
                    />
                    <circle
                        v-for="(r, i) in balance"
                        :key="'c' + r.jahr"
                        :cx="BC.left + (i + 0.5) * balanceStep"
                        :cy="balanceScale.y(r.kumuliert)"
                        r="2.5"
                        class="pt-cumulative-dot"
                    />
                </svg>
                <p class="small text-muted mb-1">
                    Je Jahr bis 31.12., aus allen Teilen des Planfalls.
                    <span v-if="hasThreshold">Teile mit Schwelle zählen erst ab dem genannten Reifegrad.</span>
                </p>
                <details class="small">
                    <summary>Als Tabelle</summary>
                    <table class="table table-sm pt-table mt-1">
                        <thead>
                            <tr>
                                <th>Jahr</th><th>neu</th><th>entfällt</th><th>Saldo</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="r in balance.filter(x => x.neu || x.entfaellt)"
                                :key="r.jahr"
                            >
                                <td>{{ r.jahr }}</td><td>{{ r.neu }}</td><td>{{ r.entfaellt }}</td><td>{{ r.kumuliert }}</td>
                            </tr>
                        </tbody>
                    </table>
                </details>
            </section>
            <p
                v-if="loading"
                class="small text-muted"
            >
                Lädt …
            </p>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.pt-heading {
    font-size: 1rem;
    font-weight: bold;
    margin-bottom: 0.25rem;
}
.pt-parts {
    padding-left: 1.1rem;
}
.pt-slider-ends {
    margin-top: -0.4rem;
}
.pt-state-legend img {
    vertical-align: -3px;
}
.pt-timeline,
.pt-balance {
    width: 100%;
    height: auto;
    font-family: sans-serif;
}
.pt-tick {
    font-size: 10px;
    fill: #52514e;
}
.pt-row-label {
    font-size: 10.5px;
    fill: #0b0b0b;
}
.pt-grid {
    stroke: #e6e5e1;
    stroke-width: 1;
}
.pt-zero {
    stroke: #8a8986;
    stroke-width: 1;
}
.pt-row-line {
    stroke: #d6d5d0;
    stroke-width: 1;
}
.pt-phase {
    fill: #c3c2b7;
}
.pt-now {
    stroke: #0b0b0b;
    stroke-width: 2;
    stroke-dasharray: 4 3;
    pointer-events: none;
}
.pt-year {
    cursor: pointer;
    &:hover rect {
        fill: rgba(42, 120, 214, 0.06);
    }
}
.pt-marker {
    cursor: pointer;
    outline: none;
    .pt-mark {
        stroke-linejoin: round;
    }
    &.muted .pt-mark {
        opacity: 0.55;
    }
    &:hover .pt-mark,
    &:focus .pt-mark,
    &.selected .pt-mark {
        stroke: #0b0b0b;
        stroke-width: 2.5;
    }
}
.pt-new {
    fill: #2a78d6;
    background: #2a78d6;
}
.pt-gone {
    fill: #e34948;
    background: #e34948;
}
.pt-cumulative {
    fill: none;
    stroke: #52514e;
    stroke-width: 2;
    pointer-events: none;
}
.pt-cumulative-dot {
    fill: #52514e;
    stroke: #fcfcfb;
    stroke-width: 1;
    pointer-events: none;
}
.pt-chart-legend {
    display: flex;
    gap: 0.9rem;
}
.pt-swatch {
    display: inline-block;
    width: 0.8rem;
    height: 0.8rem;
    border-radius: 2px;
    vertical-align: -1px;
    &.pt-line {
        height: 2px;
        vertical-align: 3px;
        background: #52514e;
    }
}
.pt-table {
    tr {
        cursor: pointer;
    }
}
</style>
