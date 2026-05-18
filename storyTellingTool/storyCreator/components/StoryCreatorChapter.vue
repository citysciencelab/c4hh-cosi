<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AddElementDropdown from "../shared/modules/addElementDropdown/components/AddElementDropdown.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import {sort} from "@shared/js/utils/sort.js";
import store from "@appstore/index.js";

export default {
    name: "StoryCreatorChapter",
    components: {
        AccordionItem,
        AddElementDropdown,
        FlatButton,
        Multiselect
    },
    data () {
        return {
            coordinate: "",
            zoomlevel: "",
            layerList: [],
            toolList: [],
            selectedLayer: [],
            selectedTool: ""
        };
    },
    computed: {
        ...mapGetters(["configuredModules"])
    },
    mounted () {
        this.layerList = this.getLayerList(rawLayerList.getLayerList());
        this.toolList = this.getToolList(this.configuredModules);
    },
    methods: {
        ...mapMutations("Modules/StoryCreator", [
            "setCurrentView"
        ]),
        handleAction (type) {
            console.warn("Aktion im StoryCreator ausgelöst. Ausgewähltes Element:", type);
        },
        /**
         * Gets the current position and zoom level of map and set it into parameter.
         * @returns {void}
         */
        getMapPosition () {
            this.zoomlevel = mapCollection.getMapView("2D").getZoom();
            this.coordinate = mapCollection.getMapView("2D").getCenter().join(", ");
        },

        /**
         * Returns a list of layer names.
         * @param {Object[]} layerList - list of layer objects
         * @returns {Object[]} A list of objects with following format: {layerId: x, label: y}
         */
        getLayerList (layerList) {
            let layerNames = [];

            if (!Array.isArray(layerList)) {
                return [];
            }

            layerList.forEach(layer => {
                if (typeof layer?.name !== "undefined" && layer?.typ === "WMS") {
                    layerNames.push({layerId: layer.id, label: layer.name});
                }
            });

            layerNames = sort("", layerNames, "label");
            return layerNames;
        },

        /**
         * Gets all the tools from Masterportal filtered by the configured list of tools.
         * @param {Object[]} modules - list of strings where each string represent tool key
         * @returns {Object[]} the tool list with the key and the title as label
         */
        getToolList (modules) {
            if (!Array.isArray(modules)) {
                return [];
            }
            let toolList = [];

            modules.forEach(val => {
                const capModuleName = val?.type.charAt(0).toUpperCase() + val?.type.slice(1),
                    key = typeof store.getters["Modules/" + capModuleName + "/name"] !== "undefined" ? store.getters["Modules/" + capModuleName + "/name"] : capModuleName;

                toolList.push({toolId: val?.type, label: i18next.t(key)});
            });

            toolList = sort("", toolList, "label");
            return toolList;
        }
    }
};
</script>

<template lang="html">
    <div class="chapter">
        <h5>
            {{ $t("additional:modules.storyCreator.chapter.editChapter") }}
        </h5>
        <AccordionItem
            id="edit-chapter"
            icon="bi-map"
            :title="$t('additional:modules.storyCreator.chapter.mapTool')"
        >
            <div class="map-position">
                <FlatButton
                    class="float-left"
                    icon="bi bi-play-circle"
                    :text="$t('additional:modules.storyCreator.chapter.mapPosition')"
                    @click.native="getMapPosition()"
                />
                <div v-if="coordinate !== '' && zoomlevel !== ''">
                    {{ $t("additional:modules.storyCreator.chapter.currentPosition") }}
                </div>
                <div
                    v-if="coordinate !== '' && zoomlevel !== ''"
                    class="p-2 d-flex flex-row align-center"
                >
                    <div class="p-1 fs-3">
                        <i class="bi bi-geo-alt-fill" />
                    </div>
                    <div class="ps-4 py-1 flex-grow-1">
                        <div class="label">
                            {{ coordinate }}
                        </div>
                        <div class="text">
                            {{ $t("additional:modules.storyCreator.chapter.zoomLevel") }} {{ zoomlevel }}
                        </div>
                    </div>
                </div>
            </div>
            <div class="row no-gutters mb-4 mt-4">
                <Multiselect
                    id="layer-list"
                    v-model="selectedLayer"
                    :placeholder="$t('additional:modules.storyCreator.chapter.layerList')"
                    :aria-label="$t('additional:modules.storyCreator.chapter.layerList')"
                    label="label"
                    track-by="label"
                    :show-labels="false"
                    :close-on-select="false"
                    :limit="3"
                    :limit-text="count => count + ' ' + $t('common:modules.statisticDashboard.label.more')"
                    :options="layerList"
                    :searchable="true"
                    :multiple="true"
                    :open="true"
                >
                    <template #tag="{ option, remove }">
                        <button
                            class="multiselect__tag"
                            :class="option"
                            @click="remove(option)"
                            @keypress="remove(option)"
                        >
                            {{ option.label }}
                            <i class="bi bi-x" />
                        </button>
                    </template>
                </Multiselect>
            </div>
            <div class="row no-gutters mb-4">
                <Multiselect
                    v-model="selectedTool"
                    :multiple="false"
                    :options="toolList"
                    :show-labels="false"
                    :placeholder="$t('additional:modules.storyCreator.chapter.toolList')"
                    label="label"
                    track-by="label"
                >
                    <template #singleLabel="{ option }">
                        <button
                            class="multiselect__tag pe-1"
                            :class="option"
                            @mousedown.stop.prevent="selectedTool=''"
                            @keydown.enter.prevent="selectedTool=''"
                        >
                            {{ option.label }}
                            <i class="bi bi-x" />
                        </button>
                    </template>
                </Multiselect>
            </div>
        </AccordionItem>
        <AddElementDropdown
            :allowed-actions="['text', 'image']"
            @action-triggered="handleAction"
        />
        <div class="d-flex flex-column align-items-center pt-3">
            <FlatButton
                id="save"
                :icon="'bi-save'"
                :aria-label="$t('additional:modules.storyCreator.chapter.save')"
                :text="$t('additional:modules.storyCreator.chapter.save')"
            />
            <FlatButton
                id="cancel"
                :icon="'bi-x-lg'"
                :aria-label="$t('additional:modules.storyCreator.chapter.cancel')"
                :text="$t('additional:modules.storyCreator.chapter.cancel')"
                :interaction="() => setCurrentView('story')"
            />
        </div>
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>
</style>

<style lang="scss">
.chapter .multiselect__strong {
    font-family: "MasterPortalFont Bold";
}

.chapter .multiselect__placeholder {
    color: #8f8f8f;
}

.chapter .multiselect__tag {
    background: $light_blue;
    padding: 4px 20px 4px 10px;
    border-radius: 50px;
    border: none;
}

.chapter .difference-modal .multiselect__tag {
    padding: 4px 26px 4px 10px;
    border-radius: 10px;
}
.chapter .multiselect__tag:hover {
    background: $dark_blue;
    color: $white;
}
.chapter .multiselect .multiselect__tag i::before {
    vertical-align: middle;
}
.chapter .multiselect .multiselect__tag i::after {
    color: $dark_blue;
}
.chapter .multiselect__clear {
    position: absolute;
    font-size: 12px;
    top: 12px;
    left: 9px;
}

.chapter .multiselect__option--selected.multiselect__option--highlight,
.chapter .multiselect__option--selected.multiselect__option--highlight:after,
.chapter .multiselect__option:after,
.chapter .multiselect__option--selected,
.chapter .multiselect__option--selected:after,
.chapter .multiselect__tag {
  color: $black;
  font-weight: normal;
}

.chapter .multiselect__option--highlight,
.chapter .multiselect__option--highlight:after {
    background: $secondary;
}

.map-position {
    i.bi-geo-alt-fill {
        color: $secondary;
    }
}
</style>
