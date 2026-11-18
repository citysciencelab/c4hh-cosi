<script>
import {fmtNum, valueKey} from "../utils/filterSpec.js";

/** From this many values on, the list gets a search field. */
const SEARCH_FROM = 12;

/**
 * Value part of one filter condition: a range (two fields + two sliders) for a
 * numeric attribute, a checkbox list for a categorical one. Port of c4hh-app
 * FilterValueEditor.vue. Emits `update` with a patch of the condition.
 */
export default {
    name: "FilterValueEditor",
    props: {
        cond: {type: Object, required: true},
        stats: {type: Object, required: true}
    },
    emits: ["update"],
    data () {
        return {
            search: "",
            pendingLo: null,
            pendingHi: null
        };
    },
    computed: {
        shownLo () {
            return this.pendingLo ?? (Number.isFinite(this.cond.lo) ? this.cond.lo : this.stats.min);
        },
        shownHi () {
            return this.pendingHi ?? (Number.isFinite(this.cond.hi) ? this.cond.hi : this.stats.max);
        },
        selectedKeys () {
            return this.cond.values ? new Set(this.cond.values.map(valueKey)) : null;
        },
        selectedCount () {
            if (!this.selectedKeys) {
                return this.stats.values.length;
            }
            return this.stats.values.filter(v => this.selectedKeys.has(valueKey(v))).length;
        },
        showSearch () {
            return this.stats.type === "categorical" && this.stats.values.length > SEARCH_FROM;
        },
        shownValues () {
            const q = this.search.trim().toLowerCase();

            return q ? this.stats.values.filter(v => String(v).toLowerCase().includes(q)) : this.stats.values;
        }
    },
    methods: {
        fmtNum,
        /**
         * Clamps a typed bound into the attribute's range.
         * @param {String|Number} raw Input value.
         * @param {Number} fallback Value if the input is empty or not a number.
         * @returns {Number} The bound.
         */
        clamp (raw, fallback) {
            const n = Number(String(raw).replace(",", "."));

            if (raw === "" || !Number.isFinite(n)) {
                return fallback;
            }
            return Math.min(this.stats.max, Math.max(this.stats.min, n));
        },
        commitFields (lo, hi) {
            let newLo = lo === undefined ? this.shownLo : this.clamp(lo, this.stats.min),
                newHi = hi === undefined ? this.shownHi : this.clamp(hi, this.stats.max);

            if (newLo > newHi) {
                [newLo, newHi] = [newHi, newLo];
            }
            this.pendingLo = null;
            this.pendingHi = null;
            this.$emit("update", {lo: newLo, hi: newHi});
        },
        onSlider (lo, hi) {
            if (lo !== undefined) {
                this.pendingLo = Math.min(Number(lo), this.shownHi);
            }
            if (hi !== undefined) {
                this.pendingHi = Math.max(Number(hi), this.shownLo);
            }
            // live while dragging; the parent debounces the map update
            this.$emit("update", {lo: this.shownLo, hi: this.shownHi});
        },
        endSlider () {
            this.pendingLo = null;
            this.pendingHi = null;
        },
        isChecked (v) {
            return !this.selectedKeys || this.selectedKeys.has(valueKey(v));
        },
        toggle (v, checked) {
            // from "alle" (no list) a first uncheck means: every value except this one
            const current = this.cond.values ? [...this.cond.values] : [...this.stats.values],
                  key = valueKey(v),
                  next = checked
                      ? [...current.filter(x => valueKey(x) !== key), v]
                      : current.filter(x => valueKey(x) !== key);

            // all values ticked again = "alle" (restricts nothing)
            this.$emit("update", {values: next.length === this.stats.values.length && !this.stats.truncated ? undefined : next});
        },
        selectAll () {
            this.$emit("update", {values: undefined});
        },
        selectNone () {
            this.$emit("update", {values: []});
        }
    }
};
</script>

<template>
    <div
        v-if="stats.type === 'numeric'"
        class="lf-num"
    >
        <div class="d-flex align-items-end gap-2">
            <label class="form-label small mb-0 flex-fill">
                Von
                <input
                    class="form-control form-control-sm lf-lo"
                    type="number"
                    :min="stats.min"
                    :max="stats.max"
                    :step="stats.step"
                    :value="shownLo"
                    @change="commitFields($event.target.value, undefined)"
                    @keydown.enter.prevent="commitFields($event.target.value, undefined)"
                >
            </label>
            <span class="pb-1">–</span>
            <label class="form-label small mb-0 flex-fill">
                Bis
                <input
                    class="form-control form-control-sm lf-hi"
                    type="number"
                    :min="stats.min"
                    :max="stats.max"
                    :step="stats.step"
                    :value="shownHi"
                    @change="commitFields(undefined, $event.target.value)"
                    @keydown.enter.prevent="commitFields(undefined, $event.target.value)"
                >
            </label>
        </div>
        <input
            class="form-range lf-range"
            type="range"
            aria-label="Untere Grenze"
            :min="stats.min"
            :max="stats.max"
            :step="stats.step"
            :value="shownLo"
            @input="onSlider($event.target.value, undefined)"
            @change="endSlider"
        >
        <input
            class="form-range lf-range"
            type="range"
            aria-label="Obere Grenze"
            :min="stats.min"
            :max="stats.max"
            :step="stats.step"
            :value="shownHi"
            @input="onSlider(undefined, $event.target.value)"
            @change="endSlider"
        >
        <div class="d-flex justify-content-between small text-muted">
            <span>Min: {{ fmtNum(stats.min) }}</span>
            <span>Max: {{ fmtNum(stats.max) }}</span>
        </div>
        <p
            v-if="stats.texts"
            class="small text-muted mb-0"
        >
            {{ stats.texts }} {{ stats.texts === 1 ? "Wert ist" : "Werte sind" }} keine Zahl und {{ stats.texts === 1 ? "fällt" : "fallen" }} durch jeden Bereich.
        </p>
    </div>
    <div
        v-else-if="stats.type === 'categorical'"
        class="lf-cat"
    >
        <input
            v-if="showSearch"
            v-model="search"
            class="form-control form-control-sm mb-1 lf-search"
            type="search"
            :placeholder="`${stats.values.length} Werte durchsuchen …`"
            aria-label="Werte durchsuchen"
        >
        <div class="d-flex align-items-center gap-2 mb-1">
            <button
                type="button"
                class="btn btn-link btn-sm p-0 lf-all"
                title="Alle Werte wählen — die Bedingung schränkt dann nichts ein"
                @click="selectAll"
            >
                alle
            </button>
            <button
                type="button"
                class="btn btn-link btn-sm p-0 lf-none"
                title="Auswahl leeren — es bleibt nichts übrig, bis wieder Werte gewählt sind"
                @click="selectNone"
            >
                keine
            </button>
            <span
                class="small text-muted ms-auto"
                role="status"
            >{{ selectedCount }}/{{ stats.values.length }} gewählt</span>
        </div>
        <div class="lf-cat-list">
            <div
                v-for="v in shownValues"
                :key="String(v)"
                class="form-check"
            >
                <label class="form-check-label small">
                    <input
                        class="form-check-input"
                        type="checkbox"
                        :checked="isChecked(v)"
                        @change="toggle(v, $event.target.checked)"
                    >
                    {{ v }}
                </label>
            </div>
            <p
                v-if="!shownValues.length"
                class="small text-muted mb-0"
            >
                Kein Wert passt zu „{{ search.trim() }}“.
            </p>
        </div>
        <p
            v-if="stats.truncated"
            class="small text-warning mb-0"
        >
            Mehr als {{ stats.values.length }} verschiedene Werte — nur die ersten werden angeboten.
        </p>
    </div>
    <p
        v-else
        class="small text-muted mb-0"
    >
        Dieses Attribut hat in den geladenen Objekten keine Werte.
    </p>
</template>

<style lang="scss" scoped>
.lf-cat-list {
    max-height: 14rem;
    overflow-y: auto;
    padding-left: 0.25rem;
}
.lf-range {
    display: block;
}
</style>
