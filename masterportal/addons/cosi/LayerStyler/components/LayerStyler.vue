<script>
import {mapGetters, mapMutations} from "vuex";
import layerCollection from "@core/layers/js/layerCollection";
import {fmtNum, getAttrStats} from "../../LayerFilter/utils/filterSpec.js";
import {getAllFeatures, isFilterableLayer, onFeaturesChanged} from "../../LayerFilter/utils/applyLayerFilter.js";
import {applyLayerStyle, clearLayerStyle, legendGraphic, setLegendRefresher, setStyleUpdateHandler} from "../utils/applyLayerStyle.js";
import {COLOR_RAMPS, METHOD_LABELS, RAMP_LABELS, STANDARD_PALETTE, expandRamp} from "../utils/classify.js";
import {layerGeomKind, newStyleSpec} from "../utils/styleSpec.js";

/** Attributes that are bookkeeping, not data (as in the LayerFilter). */
const HIDDEN_ATTRS = new Set([
    "geometry", "geom", "the_geom", "features", "hideInClustering", "styleRule", "isOutOfMap", "_layerId",
    "circleSize", "fillColor", "opacity", "strokeColor", "strokeWidth", "FILLCOLOR", "OPACITY", "STROKECOLOR"
]);
/** How many features decide which attributes exist and which are numbers. */
const ATTR_SAMPLE = 2000;
/** Debounce of the map update while dragging a slider (ms). */
const APPLY_WAIT = 120;
/** Layers whose technical name is not meant for people. */
const DISPLAY_NAMES = {importDrawLayer: "Gezeichnete Flächen"};

/**
 * The name shown for a layer.
 * @param {Object} layer The layer wrapper.
 * @returns {String} The name.
 */
function displayName (layer) {
    return DISPLAY_NAMES[layer.get("id")] ?? layer.get("name") ?? layer.get("id");
}

/**
 * LayerStyler — colour ANY visible vector layer (port of the c4hh-app style tool):
 * one colour, classes of a numeric attribute or categories, with own colours and a
 * legend. Styles stay on the map when the tool is closed; a LayerFilter on the same
 * layer works on top of them.
 */
export default {
    name: "LayerStyler",
    data () {
        return {
            layers: [],
            layerId: null,
            spec: null,
            resolved: null,
            geomKind: "area",
            featuresVersion: 0,
            applyTimer: null,
            methodLabels: METHOD_LABELS,
            rampKeys: Object.keys(COLOR_RAMPS),
            rampLabels: RAMP_LABELS
        };
    },
    computed: {
        ...mapGetters("Modules/LayerStyler", ["styles"]),
        ...mapGetters(["visibleSubjectDataLayerConfigs"]),

        layer () {
            return this.layerId && this.layers.some(l => l.id === this.layerId) ? layerCollection.getLayerById(this.layerId) : null;
        },
        attrLabels () {
            const gfi = this.layer?.get("gfiAttributes");

            return gfi && typeof gfi === "object" ? gfi : {};
        },
        /** {key, label, type} of the sampled attributes. */
        attrOptions () {

            this.featuresVersion;
            if (!this.layer) {
                return [];
            }
            const features = getAllFeatures(this.layer).slice(0, ATTR_SAMPLE),
                  propsList = features.map(f => f.getProperties()),
                  ignored = new Set((globalThis.Config?.ignoredKeys ?? []).map(k => String(k).toUpperCase())),
                  keys = new Set();

            features.forEach((f, i) => {
                const geomName = f.getGeometryName();

                Object.entries(propsList[i]).forEach(([k, v]) => {
                    if (k !== geomName && !HIDDEN_ATTRS.has(k) && !ignored.has(k.toUpperCase()) && !k.startsWith("_") && (v === null || typeof v !== "object" || Array.isArray(v))) {
                        keys.add(k);
                    }
                });
            });
            return [...keys]
                .map(k => {
                    const stats = getAttrStats(propsList, k);

                    return {key: k, label: this.labelOf(k), type: stats.type, distinct: stats.values?.length ?? 0};
                })
                .filter(a => a.type !== "empty")
                .sort((a, b) => a.label.localeCompare(b.label, "de"));
        },
        numericAttrs () {
            return this.attrOptions.filter(a => a.type === "numeric");
        },
        isPoint () {
            return this.geomKind === "point" || this.geomKind === "mixed";
        },
        isLine () {
            return this.geomKind === "line" || this.geomKind === "mixed";
        },
        isArea () {
            return this.geomKind === "area" || this.geomKind === "mixed";
        },
        hasOutline () {
            return this.isArea || this.isPoint;
        },
        legendRows () {
            if (!this.resolved || !this.spec) {
                return [];
            }
            return this.resolved.legend.map(l => ({...l, graphic: legendGraphic(this.spec, this.geomKind, l.color)}));
        },
        chips () {
            return Object.entries(this.styles).map(([id, s]) => ({
                id,
                name: s.layerName,
                visible: this.layers.some(l => l.id === id)
            }));
        },
        current () {
            return this.layerId ? this.styles[this.layerId] : null;
        },
        opacityPct () {
            return Math.round((this.spec?.fillOpacity ?? 0) * 100);
        }
    },
    watch: {
        visibleSubjectDataLayerConfigs: {
            immediate: true,
            async handler () {
                await this.$nextTick();
                this.refreshLayers();
            }
        },
        layerId: {
            immediate: true,
            handler (id) {
                if (id) {
                    this.setLastLayerId(id);
                }
                this.unlisten?.();
                this.unlisten = null;
                this.resolved = null;
                if (!this.layer) {
                    this.spec = null;
                    return;
                }
                const stored = this.styles[id];

                this.geomKind = layerGeomKind(getAllFeatures(this.layer));
                this.spec = stored ? JSON.parse(JSON.stringify(stored.spec)) : newStyleSpec(this.geomKind);
                this.dirty = Boolean(stored);
                this.unlisten = onFeaturesChanged(this.layer, () => {
                    this.featuresVersion++;
                    this.geomKind = layerGeomKind(getAllFeatures(this.layer));
                });
                if (stored) {
                    this.scheduleApply(0);
                }
            }
        },
        spec: {
            deep: true,
            handler (spec, old) {
                // the first spec of a layer is no change of the user
                if (spec && old && spec === old) {
                    this.dirty = true;
                    this.scheduleApply();
                }
            }
        }
    },
    created () {
        setLegendRefresher(layer => {
            this.$store.dispatch("Modules/Legend/toggleLayerInLegend", {layer, visibility: layer.get("visibility") === true});
        });
        // styles re-resolved after a reload (also while the tool is closed)
        setStyleUpdateHandler((layerId, resolved) => {
            if (layerId === this.layerId) {
                this.resolved = resolved;
            }
        });
    },
    beforeUnmount () {
        this.unlisten?.();
        clearTimeout(this.applyTimer);
    },
    methods: {
        ...mapMutations("Modules/LayerStyler", ["setStyleEntry", "removeStyleEntry", "setLastLayerId"]),
        fmtNum,

        refreshLayers () {
            this.layers = layerCollection.getLayers()
                .filter(l => l.get("visibility") === true && isFilterableLayer(l))
                .map(l => ({id: l.get("id"), name: displayName(l)}))
                .sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));
            if (this.layerId && !this.layers.some(l => l.id === this.layerId)) {
                this.layerId = null;
            }
            if (!this.layerId) {
                // back in the tool: the layer of last time, else the only one
                const last = this.$store.state.Modules.LayerStyler.lastLayerId;

                if (this.layers.some(l => l.id === last)) {
                    this.layerId = last;
                }
                else if (this.layers.length === 1) {
                    this.layerId = this.layers[0].id;
                }
            }
        },
        labelOf (attr) {
            const label = this.attrLabels[attr];

            return typeof label === "string" && label ? label : attr;
        },
        rampGradient (key, reversed = false) {
            return `linear-gradient(to right, ${expandRamp(key, 7, reversed).join(", ")})`;
        },
        setMode (mode) {
            this.spec.mode = mode;
            if (mode === "classes" && !this.spec.classification.attr) {
                this.spec.classification.attr = this.defaultNumericAttr();
            }
            if (mode === "categories" && !this.spec.categories.attr) {
                this.spec.categories.attr = this.defaultCategoryAttr();
            }
        },
        /**
         * The attribute a first "Zahlenwert" colours by: one named like the layer
         * ("Wärmebedarf abs." → "Wärmebedarf"), else the first number.
         * @returns {String|null} The attribute.
         */
        defaultNumericAttr () {
            const words = String(displayName(this.layer)).toLowerCase().split(/[^\p{L}\d]+/u).filter(w => w.length >= 4),
                  named = this.numericAttrs.find(a => words.some(w => a.label.toLowerCase().includes(w) || a.key.toLowerCase().includes(w)));

            return (named ?? this.numericAttrs[0])?.key ?? null;
        },
        /**
         * The attribute a first "Kategorie" colours by: a text attribute with a
         * handful of values (3–24, then 2), never one that names every object.
         * @returns {String|null} The attribute.
         */
        defaultCategoryAttr () {
            const cats = this.attrOptions.filter(a => a.type === "categorical");

            /**
             * The attribute with the fewest values inside a range.
             * @param {Number} lo Fewest values.
             * @param {Number} hi Most values.
             * @returns {Object|undefined} The attribute option.
             */
            function pick (lo, hi) {
                return cats.filter(a => a.distinct >= lo && a.distinct <= hi).sort((a, b) => a.distinct - b.distinct)[0];
            }

            return (pick(3, 24) ?? pick(2, 2) ?? cats[0] ?? this.attrOptions[0])?.key ?? null;
        },
        setCategoryAttr (attr) {
            this.spec.categories.attr = attr || null;
            this.spec.categories.colorMap = {};
        },
        setValueColor (row, color) {
            if (row.value === undefined) {
                return;
            }
            this.spec.categories.colorMap = {...this.spec.categories.colorMap, [row.value]: color};
        },
        resetValueColors () {
            this.spec.categories.colorMap = {};
        },
        setOpacity (pct) {
            this.spec.fillOpacity = Math.min(1, Math.max(0, Number(pct) / 100));
        },
        setNumber (obj, key, raw, min, max) {
            const n = Number(String(raw).replace(",", "."));

            if (Number.isFinite(n)) {
                obj[key] = Math.min(max, Math.max(min, n));
            }
        },
        scheduleApply (wait = APPLY_WAIT) {
            clearTimeout(this.applyTimer);
            this.applyTimer = setTimeout(() => this.apply(), wait);
        },
        apply () {
            if (!this.layer || !this.spec || !this.dirty) {
                return;
            }
            this.resolved = applyLayerStyle(this.layer, this.spec);
            this.setStyleEntry({
                layerId: this.layerId,
                entry: {spec: JSON.parse(JSON.stringify(this.spec)), layerName: displayName(this.layer)}
            });
        },
        resetCurrent () {
            clearTimeout(this.applyTimer);
            if (this.layer) {
                clearLayerStyle(this.layer);
            }
            this.removeStyleEntry(this.layerId);
            this.resolved = null;
            this.dirty = false;
            this.spec = newStyleSpec(this.geomKind);
        },
        clearChip (id) {
            const layer = layerCollection.getLayerById(id);

            if (layer) {
                clearLayerStyle(layer);
            }
            this.removeStyleEntry(id);
            if (id === this.layerId) {
                this.resolved = null;
                this.dirty = false;
                this.spec = newStyleSpec(this.geomKind);
            }
        },
        selectChip (id) {
            if (this.layers.some(l => l.id === id)) {
                this.layerId = id;
            }
        }
    },
    standardPalette: STANDARD_PALETTE
};
</script>

<template>
    <div
        id="cosi-layer-styler"
        class="ls"
    >
        <div
            v-if="chips.length"
            class="d-flex flex-wrap gap-1 mb-2"
        >
            <span
                v-for="c in chips"
                :key="c.id"
                class="badge rounded-pill ls-chip"
                :class="c.id === layerId ? 'text-bg-primary' : 'text-bg-light border'"
            >
                <button
                    type="button"
                    class="btn btn-link btn-sm p-0 text-reset text-decoration-none"
                    :disabled="!c.visible"
                    :title="c.visible ? `Darstellung von ${c.name} bearbeiten` : `${c.name} ist ausgeblendet — die Darstellung bleibt erhalten`"
                    @click="selectChip(c.id)"
                >
                    {{ c.name }}<span v-if="!c.visible"> · ausgeblendet</span>
                </button>
                <button
                    type="button"
                    class="btn-close btn-close-sm ms-1 ls-chip-clear"
                    :aria-label="`Darstellung von ${c.name} zurücksetzen`"
                    :title="`Darstellung von ${c.name} zurücksetzen`"
                    @click="clearChip(c.id)"
                />
            </span>
        </div>

        <label
            class="form-label fw-semibold mb-1"
            for="ls-layer-select"
        >Layer</label>
        <select
            id="ls-layer-select"
            v-model="layerId"
            class="form-select form-select-sm mb-2"
        >
            <option :value="null">
                — Layer wählen —
            </option>
            <option
                v-for="l in layers"
                :key="l.id"
                :value="l.id"
            >
                {{ l.name }}{{ styles[l.id] ? " (eigene Darstellung)" : "" }}
            </option>
        </select>
        <p
            v-if="!layers.length"
            class="small text-muted"
        >
            Kein sichtbarer Vektorlayer. Schalte im Themenbaum einen Layer ein (WFS, OAF, GeoJSON, gezeichnete Objekte).
        </p>

        <template v-if="layer && spec">
            <div class="mb-2">
                <span class="form-label fw-semibold d-block mb-1">Farbe nach</span>
                <div
                    class="btn-group btn-group-sm w-100 ls-mode"
                    role="group"
                    aria-label="Farbe nach"
                >
                    <button
                        type="button"
                        class="btn"
                        :class="spec.mode === 'single' ? 'btn-primary' : 'btn-outline-primary'"
                        @click="setMode('single')"
                    >
                        Eine Farbe
                    </button>
                    <button
                        type="button"
                        class="btn"
                        :class="spec.mode === 'classes' ? 'btn-primary' : 'btn-outline-primary'"
                        :disabled="!numericAttrs.length"
                        :title="numericAttrs.length ? 'Klassen eines Zahlenwerts' : 'Dieser Layer hat kein Zahlenattribut'"
                        @click="setMode('classes')"
                    >
                        Zahlenwert
                    </button>
                    <button
                        type="button"
                        class="btn"
                        :class="spec.mode === 'categories' ? 'btn-primary' : 'btn-outline-primary'"
                        :disabled="!attrOptions.length"
                        @click="setMode('categories')"
                    >
                        Kategorie
                    </button>
                </div>
            </div>

            <!-- one colour -->
            <div
                v-if="spec.mode === 'single'"
                class="d-flex align-items-center gap-2 mb-2"
            >
                <input
                    id="ls-color"
                    v-model="spec.color"
                    type="color"
                    class="form-control form-control-color form-control-sm ls-color"
                    aria-label="Farbe"
                >
                <div class="d-flex flex-wrap gap-1">
                    <button
                        v-for="c in $options.standardPalette.slice(0, 12)"
                        :key="c"
                        type="button"
                        class="ls-swatch"
                        :class="{active: spec.color === c}"
                        :style="{background: c}"
                        :title="c"
                        :aria-label="`Farbe ${c}`"
                        @click="spec.color = c"
                    />
                </div>
            </div>

            <!-- classes of a number -->
            <div
                v-else-if="spec.mode === 'classes'"
                class="mb-2"
            >
                <label
                    class="form-label small mb-0"
                    for="ls-cls-attr"
                >Attribut</label>
                <select
                    id="ls-cls-attr"
                    v-model="spec.classification.attr"
                    class="form-select form-select-sm mb-1 ls-cls-attr"
                >
                    <option
                        v-for="a in numericAttrs"
                        :key="a.key"
                        :value="a.key"
                    >
                        {{ a.label }}
                    </option>
                </select>
                <div class="d-flex gap-2 mb-1">
                    <div class="flex-fill">
                        <label
                            class="form-label small mb-0"
                            for="ls-method"
                        >Einteilung</label>
                        <select
                            id="ls-method"
                            v-model="spec.classification.method"
                            class="form-select form-select-sm ls-method"
                        >
                            <option
                                v-for="(label, m) in methodLabels"
                                :key="m"
                                :value="m"
                            >
                                {{ label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label
                            class="form-label small mb-0"
                            for="ls-n"
                        >Klassen</label>
                        <select
                            id="ls-n"
                            v-model.number="spec.classification.nClasses"
                            class="form-select form-select-sm ls-n"
                        >
                            <option
                                v-for="n in 8"
                                :key="n"
                                :value="n + 1"
                            >
                                {{ n + 1 }}
                            </option>
                        </select>
                    </div>
                </div>
                <span class="form-label small d-block mb-0">Farbskala</span>
                <div
                    class="ls-ramps mb-1"
                    role="radiogroup"
                    aria-label="Farbskala"
                >
                    <button
                        v-for="r in rampKeys"
                        :key="r"
                        type="button"
                        role="radio"
                        class="ls-ramp"
                        :class="{active: spec.classification.ramp === r}"
                        :aria-checked="spec.classification.ramp === r"
                        :title="rampLabels[r]"
                        :aria-label="rampLabels[r]"
                        :style="{background: rampGradient(r, spec.classification.reversed)}"
                        @click="spec.classification.ramp = r"
                    />
                </div>
                <div class="form-check form-check-inline small">
                    <input
                        id="ls-reverse"
                        v-model="spec.classification.reversed"
                        class="form-check-input ls-reverse"
                        type="checkbox"
                    >
                    <label
                        class="form-check-label"
                        for="ls-reverse"
                    >Farbskala umkehren</label>
                </div>
            </div>

            <!-- categories -->
            <div
                v-else
                class="mb-2"
            >
                <label
                    class="form-label small mb-0"
                    for="ls-cat-attr"
                >Attribut</label>
                <select
                    id="ls-cat-attr"
                    :value="spec.categories.attr"
                    class="form-select form-select-sm mb-1 ls-cat-attr"
                    @change="setCategoryAttr($event.target.value)"
                >
                    <option
                        v-for="a in attrOptions"
                        :key="a.key"
                        :value="a.key"
                    >
                        {{ a.label }}
                    </option>
                </select>
                <p class="small text-muted mb-1">
                    Ein Klick auf ein Farbfeld der Legende gibt dem Wert eine eigene Farbe.
                    <button
                        v-if="Object.keys(spec.categories.colorMap).length"
                        type="button"
                        class="btn btn-link btn-sm p-0 align-baseline ls-reset-colors"
                        @click="resetValueColors"
                    >
                        Eigene Farben verwerfen
                    </button>
                </p>
            </div>

            <!-- legend -->
            <div
                v-if="legendRows.length"
                class="ls-legend mb-2"
            >
                <div
                    v-for="row in legendRows"
                    :key="row.label"
                    class="ls-legend-row"
                >
                    <label
                        v-if="spec.mode === 'categories' && row.value !== undefined"
                        class="ls-legend-key ls-legend-pick"
                        :title="`Farbe für ${row.label} wählen`"
                    >
                        <img
                            :src="row.graphic"
                            alt=""
                        >
                        <input
                            type="color"
                            class="visually-hidden ls-value-color"
                            :value="row.color"
                            :aria-label="`Farbe für ${row.label}`"
                            @change="setValueColor(row, $event.target.value)"
                        >
                    </label>
                    <span
                        v-else
                        class="ls-legend-key"
                    >
                        <img
                            :src="row.graphic"
                            alt=""
                        >
                    </span>
                    <span class="ls-legend-label">{{ row.label }}</span>
                    <span class="ls-legend-count text-muted">{{ fmtNum(row.count) }}</span>
                </div>
                <p
                    v-if="resolved?.multi"
                    class="small text-muted mb-0 mt-1"
                >
                    Objekte mit mehreren Werten („A|B“) nehmen die Farbe ihres ersten Werts.
                </p>
            </div>
            <p
                v-else-if="!resolved"
                class="small text-muted"
            >
                Die Karte zeigt noch die ursprüngliche Darstellung — eine Wahl oben färbt den Layer neu.
            </p>

            <details
                class="ls-look mb-2"
                open
            >
                <summary class="fw-semibold">
                    Aussehen
                </summary>
                <label
                    class="form-label small mb-0 mt-1"
                    for="ls-opacity"
                >{{ isLine && !isArea && !isPoint ? "Deckkraft" : "Deckkraft der Füllung" }}: {{ opacityPct }} %</label>
                <input
                    id="ls-opacity"
                    class="form-range ls-opacity"
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    :value="opacityPct"
                    @input="setOpacity($event.target.value)"
                >

                <template v-if="hasOutline">
                    <span class="form-label small d-block mb-0">{{ isPoint && !isArea ? "Rand" : "Umrandung" }}</span>
                    <div class="d-flex align-items-center gap-2 mb-1">
                        <select
                            v-model="spec.stroke.mode"
                            class="form-select form-select-sm ls-stroke-mode"
                            aria-label="Art der Umrandung"
                        >
                            <option value="same">
                                wie die Füllung
                            </option>
                            <option value="color">
                                eigene Farbe
                            </option>
                            <option value="none">
                                keine
                            </option>
                        </select>
                        <input
                            v-if="spec.stroke.mode === 'color'"
                            v-model="spec.stroke.color"
                            type="color"
                            class="form-control form-control-color form-control-sm ls-stroke-color"
                            aria-label="Farbe der Umrandung"
                        >
                        <input
                            v-if="spec.stroke.mode !== 'none'"
                            class="form-control form-control-sm ls-stroke-width"
                            type="number"
                            min="0.5"
                            max="10"
                            step="0.5"
                            :value="spec.stroke.width"
                            aria-label="Breite der Umrandung in Pixeln"
                            title="Breite in Pixeln"
                            @change="setNumber(spec.stroke, 'width', $event.target.value, 0.5, 10)"
                        >
                    </div>
                </template>

                <template v-if="isLine">
                    <label
                        class="form-label small mb-0"
                        for="ls-line-width"
                    >Linienbreite: {{ spec.lineWidth }} px</label>
                    <input
                        id="ls-line-width"
                        v-model.number="spec.lineWidth"
                        class="form-range ls-line-width"
                        type="range"
                        min="0.5"
                        max="12"
                        step="0.5"
                    >
                </template>

                <template v-if="isPoint">
                    <label
                        class="form-label small mb-0"
                        for="ls-size-attr"
                    >Punktgröße</label>
                    <select
                        id="ls-size-attr"
                        v-model="spec.point.sizeAttr"
                        class="form-select form-select-sm mb-1 ls-size-attr"
                    >
                        <option :value="null">
                            fest
                        </option>
                        <option
                            v-for="a in numericAttrs"
                            :key="a.key"
                            :value="a.key"
                        >
                            nach {{ a.label }}
                        </option>
                    </select>
                    <template v-if="!spec.point.sizeAttr">
                        <label
                            class="form-label small mb-0"
                            for="ls-radius"
                        >Radius: {{ spec.point.radius }} px</label>
                        <input
                            id="ls-radius"
                            v-model.number="spec.point.radius"
                            class="form-range ls-radius"
                            type="range"
                            min="2"
                            max="20"
                            step="1"
                        >
                    </template>
                    <div
                        v-else
                        class="d-flex align-items-end gap-2"
                    >
                        <label class="form-label small mb-0 flex-fill">
                            kleinster Radius
                            <input
                                class="form-control form-control-sm ls-size-min"
                                type="number"
                                min="1"
                                max="40"
                                :value="spec.point.min"
                                @change="setNumber(spec.point, 'min', $event.target.value, 1, spec.point.max)"
                            >
                        </label>
                        <label class="form-label small mb-0 flex-fill">
                            größter Radius
                            <input
                                class="form-control form-control-sm ls-size-max"
                                type="number"
                                min="1"
                                max="40"
                                :value="spec.point.max"
                                @change="setNumber(spec.point, 'max', $event.target.value, spec.point.min, 40)"
                            >
                        </label>
                    </div>
                    <p
                        v-if="spec.point.sizeAttr && resolved?.sizeDomain"
                        class="small text-muted mb-0"
                    >
                        {{ fmtNum(resolved.sizeDomain[0]) }} → {{ spec.point.min }} px, {{ fmtNum(resolved.sizeDomain[1]) }} → {{ spec.point.max }} px (Fläche wächst mit dem Wert)
                    </p>
                </template>
            </details>

            <button
                type="button"
                class="btn btn-outline-secondary btn-sm ls-reset"
                :disabled="!current"
                @click="resetCurrent"
            >
                Ursprüngliche Darstellung
            </button>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.ls-swatch {
    width: 1.25rem;
    height: 1.25rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.2rem;
    padding: 0;
    &.active {
        outline: 2px solid #0d6efd;
        outline-offset: 1px;
    }
}
.ls-ramps {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.25rem;
}
.ls-ramp {
    height: 1.1rem;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 0.2rem;
    padding: 0;
    &.active {
        outline: 2px solid #0d6efd;
        outline-offset: 1px;
    }
}
.ls-legend {
    max-height: 18rem;
    overflow-y: auto;
}
.ls-legend-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    padding: 0.1rem 0;
}
.ls-legend-key {
    display: inline-flex;
    flex: 0 0 auto;
    img {
        width: 20px;
        height: 20px;
    }
}
.ls-legend-pick {
    cursor: pointer;
    border-radius: 0.2rem;
    &:hover,
    &:focus-within {
        outline: 2px solid #0d6efd;
    }
}
.ls-legend-label {
    flex: 1 1 auto;
    overflow-wrap: anywhere;
}
.ls-legend-count {
    flex: 0 0 auto;
    font-variant-numeric: tabular-nums;
}
.ls-stroke-width {
    width: 4.5rem;
}
</style>
