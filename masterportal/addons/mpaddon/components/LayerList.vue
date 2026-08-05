<script>
import {mapActions, mapGetters, mapState} from "vuex";
import {keyOfCollection} from "../js/collectionKey.js";

export default {
    name: "LayerList",
    data () {
        return {
            busyLayerId: null,
            // MP-11: per-group collapsed state, keyed by group id. A key is only
            // present once the user has explicitly toggled that group; absent keys
            // fall back to the default in isGroupCollapsed (intern bucket collapsed).
            collapsedGroups: {}
        };
    },
    computed: {
        ...mapState("Modules/Mpaddon", ["availableLayers", "layersLoading", "layersError", "addedLayers", "composeFor"]),
        ...mapGetters("Modules/Mpaddon", ["isLayerVisible", "isLayerLoading"]),
        // Collections grouped by their dataset group (Hamburg-style), preserving
        // the catalogue order.
        groupedLayers () {
            const groups = new Map();

            this.availableLayers.forEach((c) => {
                if (!groups.has(c.group)) {
                    groups.set(c.group, {group: c.group, groupTitle: c.groupTitle, internal: c.internal, items: []});
                }
                groups.get(c.group).items.push(c);
            });
            return [...groups.values()];
        }
    },
    mounted () {
        if (this.availableLayers.length === 0) {
            this.fetchCollections();
        }
    },
    methods: {
        ...mapActions("Modules/Mpaddon", ["fetchCollections", "addLayer", "hideLayer", "startCompose", "cancelCompose"]),
        // MP-7: group the feature count's thousands for the muted badge, in the
        // active UI language (e.g. 1.205 / 1,205). i18next is a webpack-provided
        // global in Masterportal (cf. TableComponent.vue).
        formatCount (n) {
            return new Intl.NumberFormat(i18next.language).format(n);
        },
        // MP-11: is this dataset group currently collapsed? Default (no explicit
        // toggle yet): the internal ("intern") bucket starts collapsed, every
        // other group starts expanded.
        //
        // The lookup MUST be a plain property read: Vue 3's reactive proxy tracks
        // a `get` even for an absent key (so a later insert re-renders), but it
        // does NOT trap `hasOwnProperty`. Guarding with hasOwnProperty therefore
        // registered no dependency for a not-yet-toggled group, and the first
        // click on it changed the state without re-rendering — collapsing only
        // appeared to work once something else (the refresh button reloading
        // availableLayers) forced a re-render.
        isGroupCollapsed (grp) {
            const explicit = this.collapsedGroups[grp.group];

            return explicit === undefined ? Boolean(grp.internal) : explicit;
        },
        // MP-11: collapse/expand a group, remembering the choice in component state.
        toggleGroup (grp) {
            this.collapsedGroups[grp.group] = !this.isGroupCollapsed(grp);
        },
        // MP-13: compose mode is per (group, id) — the id alone is shared by every
        // group's primary comment collection.
        isComposing (collection) {
            return keyOfCollection(this.composeFor) === keyOfCollection(collection);
        },
        // Toggles "add comment" mode for an added comment collection.
        onCompose (collection) {
            if (this.isComposing(collection)) {
                this.cancelCompose();
            }
            else {
                this.startCompose({collection});
            }
        },
        async onToggle (collection) {
            this.busyLayerId = keyOfCollection(collection);
            try {
                if (this.isLayerVisible(collection)) {
                    // Currently visible on the map: hide it (visibility off).
                    this.hideLayer({collection});
                }
                else {
                    // Not added yet OR added-but-hidden: addLayer adds it or
                    // re-shows the existing (hidden) layer.
                    await this.addLayer({collection});
                }
            }
            catch (e) {
                console.error("[mpaddon] toggle failed", e);
            }
            finally {
                this.busyLayerId = null;
            }
        },
        isBusy (collection) {
            return this.busyLayerId === keyOfCollection(collection);
        },
        rowKey (collection) {
            return keyOfCollection(collection);
        }
    }
};
</script>

<template>
    <div>
        <div class="d-flex align-items-center justify-content-between mb-2">
            <h6 class="mb-0">
                {{ $t("additional:modules.mpaddon.layers") }}
            </h6>
            <button
                class="btn btn-link btn-sm p-0"
                :disabled="layersLoading"
                @click="fetchCollections()"
            >
                <i class="bi-arrow-clockwise" />
            </button>
        </div>
        <p
            v-if="layersError"
            class="small text-danger"
        >
            {{ layersError }}
        </p>
        <!-- A refresh keeps the (dimmed) list mounted rather than swapping it for
             the "Lade…" line: tearing the whole tree down and rebuilding it made
             the refresh flash and dropped the scroll position. -->
        <p
            v-if="layersLoading && availableLayers.length === 0"
            class="small text-muted"
        >
            {{ $t("additional:modules.mpaddon.loading") }}
        </p>
        <p
            v-else-if="availableLayers.length === 0"
            class="small text-muted"
        >
            {{ $t("additional:modules.mpaddon.noLayers") }}
        </p>
        <div
            v-else
            :class="{'mp-list-busy': layersLoading}"
        >
            <div
                v-for="grp in groupedLayers"
                :key="grp.group"
                class="mb-2"
            >
                <button
                    type="button"
                    class="mp-group-toggle text-uppercase text-muted fw-semibold mt-2 mb-1 mp-group-title"
                    :aria-expanded="!isGroupCollapsed(grp)"
                    @click="toggleGroup(grp)"
                >
                    <i
                        class="mp-group-chevron me-1"
                        :class="isGroupCollapsed(grp) ? 'bi-chevron-right' : 'bi-chevron-down'"
                    />
                    <span>{{ grp.groupTitle }}</span>
                    <span
                        v-if="grp.internal"
                        class="badge bg-secondary ms-1"
                    >intern</span>
                </button>
                <ul
                    v-show="!isGroupCollapsed(grp)"
                    class="list-unstyled mb-0"
                >
                    <li
                        v-for="collection in grp.items"
                        :key="rowKey(collection)"
                        class="d-flex align-items-center justify-content-between py-1 border-bottom"
                    >
                        <div class="me-2">
                            <div class="small fw-semibold">
                                <i
                                    v-if="collection.kind === 'comments'"
                                    class="bi-chat-dots me-1 text-primary"
                                    :title="$t('additional:modules.mpaddon.commentsBadge')"
                                />{{ collection.title }}
                                <span
                                    v-if="collection.featureCount != null"
                                    class="badge rounded-pill ms-1 mp-count-badge"
                                    :class="collection.featureCount === 0 ? 'bg-warning text-dark' : 'bg-light text-muted'"
                                    :title="$t('additional:modules.mpaddon.featureCountTitle')"
                                >{{ formatCount(collection.featureCount) }}</span>
                                <span
                                    v-if="isLayerLoading(collection)"
                                    class="spinner-border spinner-border-sm text-secondary ms-1 mp-load-spinner"
                                    role="status"
                                    :title="$t('additional:modules.mpaddon.loadingFeatures')"
                                ><span class="visually-hidden">{{ $t("additional:modules.mpaddon.loadingFeatures") }}</span></span>
                            </div>
                            <div
                                v-if="collection.description"
                                class="text-muted small"
                            >
                                {{ collection.description }}
                            </div>
                        </div>
                        <div class="d-flex gap-1">
                            <button
                                v-if="collection.kind === 'comments' && collection.canComment && isLayerVisible(collection)"
                                class="btn btn-sm"
                                :class="isComposing(collection) ? 'btn-primary' : 'btn-outline-primary'"
                                :title="$t('additional:modules.mpaddon.composeButton')"
                                @click="onCompose(collection)"
                            >
                                <i class="bi-plus-circle" />
                            </button>
                            <button
                                class="btn btn-sm"
                                :class="isLayerVisible(collection) ? 'btn-outline-secondary' : 'btn-outline-primary'"
                                :disabled="isBusy(collection)"
                                @click="onToggle(collection)"
                            >
                                <span v-if="isBusy(collection)">…</span>
                                <span v-else-if="isLayerVisible(collection)">{{ $t("additional:modules.mpaddon.hide") }}</span>
                                <span v-else>{{ $t("additional:modules.mpaddon.add") }}</span>
                            </button>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<style scoped>
.mp-list-busy {
    opacity: 0.5;
    pointer-events: none;
}
.mp-group-title {
    font-size: 0.72rem;
    letter-spacing: 0.04em;
}
.mp-group-toggle {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0;
    border: 0;
    background: none;
    text-align: left;
    cursor: pointer;
}
.mp-group-chevron {
    font-size: 0.65rem;
    flex: 0 0 auto;
}
.mp-count-badge {
    font-size: 0.65rem;
    font-weight: 600;
    vertical-align: middle;
}
.mp-load-spinner {
    width: 0.75rem;
    height: 0.75rem;
    border-width: 0.12em;
    vertical-align: middle;
}
</style>
