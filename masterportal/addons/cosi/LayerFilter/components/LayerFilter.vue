<script>
import {mapGetters, mapMutations} from "vuex";
import layerCollection from "@core/layers/js/layerCollection";
import FilterValueEditor from "./FilterValueEditor.vue";
import {
    buildPredicate, filterSpecSentence, getAttrStats, groupOp, newCondition, newGroup, seedCondition, fmtNum
} from "../utils/filterSpec.js";
import {
    applyLayerFilter, canDim, clearLayerFilter, getAllFeatures, isFilterableLayer,
    onFeaturesChanged, setUpdateHandler
} from "../utils/applyLayerFilter.js";

/** Attributes that are bookkeeping, not data. */
const HIDDEN_ATTRS = new Set([
    "geometry", "geom", "the_geom", "features", "hideInClustering", "styleRule", "isOutOfMap", "_layerId",
    // written onto the features by the WebGL renderer and by "Flächen stylen"
    "circleSize", "fillColor", "opacity", "strokeColor", "strokeWidth", "FILLCOLOR", "OPACITY", "STROKECOLOR"
]);
/** How many features are looked at to collect the attribute names. */
const ATTR_SAMPLE = 300;
/** Debounce of the map update while dragging a slider (ms). */
const APPLY_WAIT = 120;

/**
 * LayerFilter — filter ANY visible vector layer by its attributes (port of the
 * c4hh-app filter tool). Independent of the configured core filter: no layer has to
 * be prepared in config.json. Filters stay on the map when the tool is closed.
 */
export default {
    name: "LayerFilter",
    components: {FilterValueEditor},
    data () {
        return {
            layers: [],
            layerId: null,
            spec: null,
            missMode: "dim",
            featuresVersion: 0,
            lastCount: null,
            applyTimer: null
        };
    },
    computed: {
        ...mapGetters("Modules/LayerFilter", ["filters"]),
        ...mapGetters(["visibleSubjectDataLayerConfigs"]),

        layer () {
            // re-evaluated when the list changes; the wrapper itself stays non-reactive
            return this.layerId && this.layers.some(l => l.id === this.layerId) ? layerCollection.getLayerById(this.layerId) : null;
        },
        /** Property bags of all features — the truth the stats and the count work on. */
        propsList () {

            this.featuresVersion;
            return this.layer ? getAllFeatures(this.layer).map(f => f.getProperties()) : [];
        },
        attrLabels () {
            const gfi = this.layer?.get("gfiAttributes");

            return gfi && typeof gfi === "object" ? gfi : {};
        },
        attrOptions () {

            this.featuresVersion;
            if (!this.layer) {
                return [];
            }
            const keys = new Set(),
                  features = getAllFeatures(this.layer).slice(0, ATTR_SAMPLE),
                  ignored = new Set((globalThis.Config?.ignoredKeys ?? []).map(k => String(k).toUpperCase()));

            features.forEach(f => {
                const geomName = f.getGeometryName(),
                      props = f.getProperties();

                Object.keys(props).forEach(k => {
                    const v = props[k];

                    if (k !== geomName && !HIDDEN_ATTRS.has(k) && !ignored.has(k.toUpperCase()) && !k.startsWith("_") && (v === null || typeof v !== "object" || Array.isArray(v))) {
                        keys.add(k);
                    }
                });
            });
            return [...keys]
                .map(k => ({key: k, label: this.labelOf(k)}))
                .sort((a, b) => a.label.localeCompare(b.label, "de"));
        },
        dimPossible () {
            return this.layer ? canDim(this.layer) : true;
        },
        effectiveMissMode () {
            return this.dimPossible ? this.missMode : "hide";
        },
        current () {
            return this.layerId ? this.filters[this.layerId] : null;
        },
        sentence () {
            return this.spec ? filterSpecSentence(this.spec, this.labelOf) : "";
        },
        chips () {
            return Object.entries(this.filters).map(([id, f]) => ({
                id,
                name: f.layerName,
                matched: f.matched,
                total: f.total,
                visible: this.layers.some(l => l.id === id)
            }));
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
                this.unlisten?.();
                this.unlisten = null;
                const stored = id ? this.filters[id] : null;

                this.spec = stored ? JSON.parse(JSON.stringify(stored.spec)) : {items: [newCondition(null)]};
                this.missMode = stored?.missMode ?? "dim";
                this.lastCount = stored ? {matched: stored.matched, total: stored.total} : null;
                if (this.layer) {
                    this.unlisten = onFeaturesChanged(this.layer, () => {
                        this.featuresVersion++;
                    });
                }
                this.featuresVersion++;
            }
        },
        spec: {
            deep: true,
            handler () {
                this.scheduleApply();
            }
        },
        missMode () {
            this.scheduleApply(0);
        }
    },
    created () {
        // filters re-applied after a reload (also while the tool is closed) update their count
        setUpdateHandler((layerId, {matched, total}) => {
            if (this.$store.state.Modules.LayerFilter.filters[layerId]) {
                this.$store.commit("Modules/LayerFilter/setFilterEntry", {layerId, entry: {matched, total}});
            }
        });
    },
    beforeUnmount () {
        this.unlisten?.();
        clearTimeout(this.applyTimer);
    },
    methods: {
        ...mapMutations("Modules/LayerFilter", ["setFilterEntry", "removeFilterEntry"]),
        fmtNum,
        groupOp,

        refreshLayers () {
            this.layers = layerCollection.getLayers()
                .filter(l => l.get("visibility") === true && isFilterableLayer(l))
                .map(l => ({id: l.get("id"), name: l.get("name")}))
                .sort((a, b) => String(a.name).localeCompare(String(b.name), "de"));
            if (this.layerId && !this.layers.some(l => l.id === this.layerId)) {
                this.layerId = null;
            }
            if (!this.layerId && this.layers.length === 1) {
                this.layerId = this.layers[0].id;
            }
        },
        labelOf (attr) {
            const label = this.attrLabels[attr];

            return typeof label === "string" && label ? label : attr;
        },
        statsFor (attr) {
            return getAttrStats(this.propsList, attr);
        },
        scheduleApply (wait = APPLY_WAIT) {
            clearTimeout(this.applyTimer);
            this.applyTimer = setTimeout(() => this.apply(), wait);
        },
        apply () {
            if (!this.layer || !this.spec) {
                return;
            }
            const {matched, total} = applyLayerFilter(this.layer, this.spec, this.effectiveMissMode);

            // a filter that keeps everything (e.g. a freshly picked full range) is no filter
            if (buildPredicate(this.spec) && matched === total) {
                clearLayerFilter(this.layer);
            }
            if (buildPredicate(this.spec) && matched < total) {
                this.setFilterEntry({
                    layerId: this.layerId,
                    entry: {
                        spec: JSON.parse(JSON.stringify(this.spec)),
                        missMode: this.missMode,
                        matched,
                        total,
                        layerName: this.layer.get("name")
                    }
                });
            }
            else {
                this.removeFilterEntry(this.layerId);
            }
            this.lastCount = {matched, total};
        },

        onAttrChange (cond, attr) {
            cond.attr = attr || null;
            Object.assign(cond, attr ? seedCondition(this.statsFor(attr)) : {type: null, lo: undefined, hi: undefined, values: undefined});
        },
        onValue (cond, patch) {
            Object.assign(cond, patch);
        },
        setJoiner (idx, joiner) {
            this.spec.items[idx].joiner = joiner;
        },
        setGroupOp (idx, op) {
            this.spec.items[idx].op = op;
        },
        addCondition () {
            this.spec.items.push(newCondition(this.spec.items.length ? "and" : null));
        },
        addGroup () {
            this.spec.items.push(newGroup(this.spec.items.length ? "and" : null, "or"));
        },
        addGroupCondition (idx) {
            this.spec.items[idx].conditions.push(newCondition(null));
        },
        removeItem (idx) {
            this.spec.items.splice(idx, 1);
            if (this.spec.items[0]) {
                this.spec.items[0].joiner = null;
            }
        },
        removeGroupCondition (idx, ci) {
            const group = this.spec.items[idx];

            group.conditions.splice(ci, 1);
            if (group.conditions.length === 1) {
                // a group of one is a plain condition
                this.spec.items.splice(idx, 1, {...group.conditions[0], kind: "condition", joiner: group.joiner});
            }
        },
        groupTitle (idx) {
            return `Gruppe ${this.spec.items.slice(0, idx + 1).filter(it => it.kind === "group").length}`;
        },
        resetCurrent () {
            if (this.layer) {
                clearLayerFilter(this.layer);
            }
            this.removeFilterEntry(this.layerId);
            this.spec = {items: [newCondition(null)]};
        },
        clearChip (id) {
            const layer = layerCollection.getLayerById(id);

            if (layer) {
                clearLayerFilter(layer);
            }
            this.removeFilterEntry(id);
            if (id === this.layerId) {
                this.spec = {items: [newCondition(null)]};
            }
        },
        selectChip (id) {
            if (this.layers.some(l => l.id === id)) {
                this.layerId = id;
            }
        },
        countText () {
            const c = this.current ? {matched: this.current.matched, total: this.current.total} : this.lastCount;

            if (!c) {
                return "";
            }
            return c.matched === c.total
                ? `Alle ${fmtNum(c.total)} Objekte sichtbar`
                : `${fmtNum(c.matched)} von ${fmtNum(c.total)} Objekten ${c.matched === 1 ? "passt" : "passen"}`;
        }
    }
};

</script>

<template>
    <div
        id="cosi-layer-filter"
        class="lf"
    >
        <div
            v-if="chips.length"
            class="lf-chips d-flex flex-wrap gap-1 mb-3"
            role="group"
            aria-label="Aktive Filter"
        >
            <span
                v-for="c in chips"
                :key="c.id"
                :class="['badge rounded-pill d-inline-flex align-items-center gap-1 lf-chip', c.id === layerId ? 'text-bg-primary' : 'text-bg-light border']"
            >
                <button
                    type="button"
                    class="btn btn-link btn-sm p-0 text-reset text-decoration-none"
                    :title="c.visible ? `Filter von ${c.name} bearbeiten` : `${c.name} ist ausgeblendet — der Filter bleibt erhalten`"
                    @click="selectChip(c.id)"
                >
                    {{ c.name }} · {{ fmtNum(c.matched) }}/{{ fmtNum(c.total) }}<span v-if="!c.visible"> · ausgeblendet</span>
                </button>
                <button
                    type="button"
                    class="btn-close btn-close-sm lf-chip-clear"
                    :aria-label="`Filter von ${c.name} aufheben`"
                    :title="`Filter von ${c.name} aufheben`"
                    @click="clearChip(c.id)"
                />
            </span>
        </div>

        <label
            class="form-label small mb-1"
            for="lf-layer-select"
        >Layer</label>
        <select
            id="lf-layer-select"
            v-model="layerId"
            class="form-select form-select-sm mb-2 lf-layer"
            aria-label="Layer"
        >
            <option :value="null">
                — Layer wählen —
            </option>
            <option
                v-for="l in layers"
                :key="l.id"
                :value="l.id"
            >
                {{ l.name }}{{ filters[l.id] ? " (gefiltert)" : "" }}
            </option>
        </select>
        <p
            v-if="!layers.length"
            class="small text-muted"
        >
            Kein filterbarer Layer sichtbar. Schalte im Themenbaum einen Fachdaten-Layer ein.
        </p>

        <template v-if="layer && spec">
            <p
                v-if="!propsList.length"
                class="small text-muted"
            >
                Die Objekte dieses Layers werden noch geladen …
            </p>
            <template v-else>
                <div class="lf-items">
                    <div
                        v-for="(item, idx) in spec.items"
                        :key="idx"
                        class="lf-item"
                    >
                        <div
                            v-if="idx > 0"
                            class="btn-group btn-group-sm my-2 lf-joiner"
                            role="group"
                            aria-label="Verknüpfung"
                        >
                            <button
                                type="button"
                                :class="['btn', item.joiner !== 'or' ? 'btn-primary' : 'btn-outline-primary']"
                                :aria-pressed="item.joiner !== 'or'"
                                @click="setJoiner(idx, 'and')"
                            >
                                UND
                            </button>
                            <button
                                type="button"
                                :class="['btn', item.joiner === 'or' ? 'btn-primary' : 'btn-outline-primary']"
                                :aria-pressed="item.joiner === 'or'"
                                @click="setJoiner(idx, 'or')"
                            >
                                ODER
                            </button>
                        </div>

                        <div
                            v-if="item.kind === 'condition'"
                            class="border rounded p-2 lf-cond"
                        >
                            <div class="d-flex gap-1 mb-2">
                                <select
                                    class="form-select form-select-sm lf-attr"
                                    aria-label="Attribut"
                                    :value="item.attr ?? ''"
                                    @change="onAttrChange(item, $event.target.value)"
                                >
                                    <option value="">
                                        — Attribut —
                                    </option>
                                    <option
                                        v-for="a in attrOptions"
                                        :key="a.key"
                                        :value="a.key"
                                    >
                                        {{ a.label }}
                                    </option>
                                </select>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary lf-remove"
                                    title="Bedingung entfernen"
                                    aria-label="Bedingung entfernen"
                                    @click="removeItem(idx)"
                                >
                                    <i class="bi-trash" />
                                </button>
                            </div>
                            <FilterValueEditor
                                v-if="item.attr"
                                :cond="item"
                                :stats="statsFor(item.attr)"
                                @update="patch => onValue(item, patch)"
                            />
                        </div>

                        <div
                            v-else
                            class="border border-primary-subtle rounded p-2 lf-group"
                        >
                            <div class="d-flex align-items-center gap-2 mb-2">
                                <strong class="small">{{ groupTitle(idx) }}</strong>
                                <div
                                    class="btn-group btn-group-sm"
                                    role="group"
                                    aria-label="Verknüpfung in der Gruppe"
                                >
                                    <button
                                        type="button"
                                        :class="['btn', groupOp(item) === 'and' ? 'btn-primary' : 'btn-outline-primary']"
                                        title="Alle Bedingungen der Gruppe müssen zutreffen"
                                        @click="setGroupOp(idx, 'and')"
                                    >
                                        UND
                                    </button>
                                    <button
                                        type="button"
                                        :class="['btn', groupOp(item) === 'or' ? 'btn-primary' : 'btn-outline-primary']"
                                        title="Mindestens eine Bedingung der Gruppe muss zutreffen"
                                        @click="setGroupOp(idx, 'or')"
                                    >
                                        ODER
                                    </button>
                                </div>
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-secondary ms-auto"
                                    :title="`${groupTitle(idx)} entfernen`"
                                    :aria-label="`${groupTitle(idx)} entfernen`"
                                    @click="removeItem(idx)"
                                >
                                    <i class="bi-trash" />
                                </button>
                            </div>
                            <template
                                v-for="(c, ci) in item.conditions"
                                :key="ci"
                            >
                                <div
                                    v-if="ci > 0"
                                    class="small text-primary fw-bold my-1"
                                >
                                    {{ groupOp(item) === 'and' ? 'UND' : 'ODER' }}
                                </div>
                                <div class="border rounded p-2 bg-body">
                                    <div class="d-flex gap-1 mb-2">
                                        <select
                                            class="form-select form-select-sm lf-attr"
                                            aria-label="Attribut"
                                            :value="c.attr ?? ''"
                                            @change="onAttrChange(c, $event.target.value)"
                                        >
                                            <option value="">
                                                — Attribut —
                                            </option>
                                            <option
                                                v-for="a in attrOptions"
                                                :key="a.key"
                                                :value="a.key"
                                            >
                                                {{ a.label }}
                                            </option>
                                        </select>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-secondary"
                                            title="Bedingung entfernen"
                                            aria-label="Bedingung entfernen"
                                            @click="removeGroupCondition(idx, ci)"
                                        >
                                            <i class="bi-trash" />
                                        </button>
                                    </div>
                                    <FilterValueEditor
                                        v-if="c.attr"
                                        :cond="c"
                                        :stats="statsFor(c.attr)"
                                        @update="patch => onValue(c, patch)"
                                    />
                                </div>
                            </template>
                            <button
                                type="button"
                                class="btn btn-link btn-sm p-0 mt-1"
                                @click="addGroupCondition(idx)"
                            >
                                + Bedingung in der Gruppe
                            </button>
                        </div>
                    </div>
                </div>

                <div class="d-flex gap-2 my-2">
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary lf-add"
                        @click="addCondition"
                    >
                        + Bedingung
                    </button>
                    <button
                        type="button"
                        class="btn btn-sm btn-outline-primary lf-add-group"
                        title="Mehrere Bedingungen, von denen eine (ODER) oder alle (UND) zutreffen müssen"
                        @click="addGroup"
                    >
                        + Gruppe
                    </button>
                </div>

                <div class="d-flex align-items-center gap-2 mb-2">
                    <span class="small">Nicht passende Objekte</span>
                    <div
                        class="btn-group btn-group-sm lf-miss"
                        role="group"
                        aria-label="Nicht passende Objekte"
                    >
                        <button
                            type="button"
                            :class="['btn', effectiveMissMode === 'dim' ? 'btn-primary' : 'btn-outline-primary']"
                            :disabled="!dimPossible"
                            @click="missMode = 'dim'"
                        >
                            abschwächen
                        </button>
                        <button
                            type="button"
                            :class="['btn', effectiveMissMode === 'hide' ? 'btn-primary' : 'btn-outline-primary']"
                            @click="missMode = 'hide'"
                        >
                            ausblenden
                        </button>
                    </div>
                </div>
                <p
                    v-if="!dimPossible"
                    class="small text-muted"
                >
                    Bei gruppierten (geclusterten) und WebGL-Layern werden nicht passende Objekte ausgeblendet.
                </p>

                <p
                    class="mb-1 lf-count"
                    role="status"
                >
                    <strong>{{ countText() }}</strong>
                </p>
                <p
                    v-if="sentence"
                    class="small text-muted lf-sentence"
                >
                    {{ sentence }}
                </p>
                <button
                    type="button"
                    class="btn btn-sm btn-outline-secondary lf-reset"
                    :disabled="!filters[layerId]"
                    @click="resetCurrent"
                >
                    Filter aufheben
                </button>
            </template>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.lf-chip {
    font-weight: normal;
    font-size: 0.8rem;
}
.btn-close-sm {
    width: 0.5rem;
    height: 0.5rem;
    padding: 0.25rem;
}
</style>
