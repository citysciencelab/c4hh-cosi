<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AddElementDropdown from "../shared/modules/addElementDropdown/components/AddElementDropdown.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import {sort} from "@shared/js/utils/sort.js";
import store from "@appstore/index.js";
import StoryCreatorAddTextCard from "./StoryCreatorAddTextCard.vue";
import StoryCreatorAddImageCard from "./StoryCreatorAddImageCard.vue";
import {Toast} from "bootstrap";

export default {
    name: "StoryCreatorChapter",
    components: {
        AccordionItem,
        AddElementDropdown,
        FlatButton,
        Multiselect,
        StoryCreatorAddImageCard,
        StoryCreatorAddTextCard
    },
    props: {
        editIndex: {
            type: [Boolean, Number],
            required: false,
            default: false
        }
    },
    data () {
        return {
            addComponentToShow: "",
            coordinate: "",
            zoomlevel: "",
            confirmedCoordinate: "",
            confirmedZoomlevel: "",
            layerList: [],
            toolList: [],
            selectedLayer: [],
            selectedTool: "",
            showAlert: false,
            title: i18next.t("additional:modules.storyCreator.chapter.title")
        };
    },
    computed: {
        ...mapGetters(["configuredModules"]),
        ...mapGetters("Modules/StoryCreator", [
            "currentChapter",
            "story"
        ]),
        /**
         * Returns true if the current map coordinate or zoom level differs from the last confirmed values.
         * @returns {Boolean} True if position or zoom has changed, otherwise false.
         */
        positionChanged () {
            if (!this.confirmedCoordinate || !this.confirmedZoomlevel) {
                return false;
            }
            return (
                this.coordinate !== this.confirmedCoordinate || this.zoomlevel !== this.confirmedZoomlevel
            );
        },
        /**
         * Returns true if the button should be disabled. Disabled if confirmed values exist and nothing has changed.
         * @returns {Boolean} True if the button should be disabled, otherwise false.
         */
        isButtonDisabled () {
            if (!this.confirmedCoordinate || !this.confirmedZoomlevel) {
                return false;
            }
            return this.coordinate === this.confirmedCoordinate && this.zoomlevel === this.confirmedZoomlevel;
        }
    },
    watch: {
        /**
         * Initializes and displays the Bootstrap Toast. The toast will automatically hide after 4 seconds.
         * @param {Boolean} newVal - The new value of showAlert.
         */
        showAlert (newVal) {
            if (newVal) {
                this.$nextTick(() => {
                    const toastEl = this.$refs.toast;

                    if (toastEl) {
                        const toast = new Toast(toastEl);

                        toast.show();
                        setTimeout(() => {
                            this.showAlert = false;
                        }, 4000);
                    }
                });
            }
        }
    },
    created () {
        this.resetCurrentChapter();
    },
    mounted () {
        this.layerList = this.getLayerList(rawLayerList.getLayerList());
        this.toolList = this.getToolList(this.configuredModules);

        const map = mapCollection.getMap("2D");

        if (map) {
            map.on("moveend", this.updatePositionFromMap);
        }
    },
    beforeUnmount () {
        const map = mapCollection.getMap("2D");

        if (map) {
            map.un("moveend", this.updatePositionFromMap);
        }
    },
    methods: {
        ...mapMutations("Modules/StoryCreator", [
            "setCurrentChapter",
            "setCurrentView"
        ]),
        /**
         * Resets the current chapter and goes back to overview page.
         * @returns {void}
         */
        cancelChapter () {
            this.resetCurrentChapter();
            this.setCurrentView("story");
        },
        /**
         * Handles the triggered action and sets the corresponding component.
         * @param {String} type The type of the action (e.g., "image").
         * @returns {void}
         */
        handleAction (type) {
            console.warn("Aktion im StoryCreator ausgelöst. Ausgewähltes Element:", type);
            this.addComponentToShow = type;
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
         * Confirms the current map position and zoom level.
         * @returns {void}
         */
        getMapPosition () {
            this.updatePositionFromMap();

            this.confirmedCoordinate = this.coordinate;
            this.confirmedZoomlevel = this.zoomlevel;
            this.showAlert = true;
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
        },
        /**
         * Resets the current chapter.
         * @returns {void}
         */
        resetCurrentChapter () {
            this.setCurrentChapter(
                {
                    "title": "",
                    "content": [],
                    "map": {
                        "center": null,
                        "zoomLevel": null,
                        "layers": null,
                        "tool": null
                    }
                }
            );
        },
        /**
         * Saves the chapter and goes back to the overview page.
         * @returns {void}
         */
        saveChapter () {
            this.currentChapter.title = this.title;
            this.currentChapter.map.center = this.confirmedCoordinate;
            this.currentChapter.map.zoomLevel = this.confirmedZoomlevel;
            this.currentChapter.map.layers = this.selectedLayer.map(layer => layer.layerId);
            this.currentChapter.map.tool = this.selectedTool.toolId;

            if (typeof this.editIndex === "number") {
                // todos: replace the chapter
            }
            else {
                this.story?.chapters.push(this.currentChapter);
            }

            this.setCurrentView("story");
        },
        /**
         * Updates the current zoom level and coordinate from the map view.
         * @returns {void}
         */
        updatePositionFromMap () {
            const mapView = mapCollection.getMapView("2D");

            if (!mapView) {
                return;
            }

            if (this.showAlert) {
                this.showAlert = false;
            }

            this.zoomlevel = mapView.getZoom();
            this.coordinate = mapView.getCenter().join(", ");
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
            id="edit-chapter-map"
            icon="bi-map"
            :is-open="true"
            :title="$t('additional:modules.storyCreator.chapter.mapTool')"
        >
            <div class="map-position">
                <FlatButton
                    class="float-left"
                    icon="bi bi-play-circle"
                    :text="$t('additional:modules.storyCreator.chapter.mapPosition')"
                    :disabled="isButtonDisabled"
                    @click.native="getMapPosition()"
                />
                <div v-if="confirmedCoordinate !== '' && confirmedZoomlevel !== ''">
                    {{ $t("additional:modules.storyCreator.chapter.currentPosition") }}
                </div>
                <div
                    v-if="confirmedCoordinate !== '' && confirmedZoomlevel !== ''"
                    class="p-2 d-flex flex-row align-center"
                >
                    <div class="p-1 fs-3">
                        <i class="bi bi-geo-alt-fill" />
                    </div>
                    <div class="ps-4 py-1 flex-grow-1">
                        <div class="label">
                            {{ confirmedCoordinate }}
                        </div>
                        <div class="text">
                            {{ $t("additional:modules.storyCreator.chapter.zoomLevel") }} {{ confirmedZoomlevel }}
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-if="positionChanged"
                class="position-hint ps-3"
            >
                <i class="fs-4 bi bi-exclamation-circle pe-2" />
                {{ $t("additional:modules.storyCreator.chapter.positionChangedHint") }}
            </div>
            <div
                v-if="showAlert"
                ref="toast"
                class="toast align-items-center border-0"
                role="alert"
                aria-live="assertive"
                aria-atomic="true"
            >
                <div class="d-flex">
                    <div class="toast-body">
                        <i
                            class="bi bi-check-lg me-2 toast-icon"
                            aria-hidden="true"
                        />
                        {{ $t('additional:modules.storyCreator.chapter.successAlert') }}
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
        <AccordionItem
            id="edit-chapter-content"
            icon="bi-list-ul"
            :is-open="true"
            :title="$t('additional:modules.storyCreator.chapter.addContent')"
        >
            <h5
                class="chapter-title mt-4 mb-3"
                contenteditable="plaintext-only"
                @input="title = $event.target.innerHTML"
            >
                {{ $t('additional:modules.storyCreator.chapter.title') }}
            </h5>
            <AddElementDropdown
                v-if="addComponentToShow === ''"
                :allowed-actions="['text', 'image']"
                @action-triggered="handleAction"
            />
            <StoryCreatorAddTextCard
                v-else-if="addComponentToShow === 'text'"
                class="mt-2"
                @click:close="addComponentToShow = ''"
            />
            <StoryCreatorAddImageCard
                v-else-if="addComponentToShow === 'image'"
                class="mt-2"
                @click:close="addComponentToShow = ''"
            />
        </AccordionItem>
        <div class="d-flex flex-column align-items-center pt-3">
            <FlatButton
                id="save"
                :icon="'bi-save'"
                :aria-label="$t('additional:modules.storyCreator.chapter.save')"
                :text="$t('additional:modules.storyCreator.chapter.save')"
                :interaction="() => saveChapter()"
            />
            <FlatButton
                id="cancel"
                :icon="'bi-x-lg'"
                :aria-label="$t('additional:modules.storyCreator.chapter.cancel')"
                :text="$t('additional:modules.storyCreator.chapter.cancel')"
                :secondary="true"
                :interaction="() => cancelChapter()"
            />
        </div>
    </div>
</template>
<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>
.toast {
    background-color: $secondary;
    color: $white;
    .toast-icon {
        font-size: 1.15rem;
        color: $white;
        line-height: 1;
    }
}
.position-hint {
    color: $secondary;
}
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

.chapter-title {
    font-family: "MasterPortalFont Bold";
    &:hover {
        outline-color: #101010;
        outline-width: 1px;
        outline-style: solid;
    }
}
</style>
