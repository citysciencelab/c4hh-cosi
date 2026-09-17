<script>
import ConvertFeature from "../../../simulationTool/js/convertFeatures.js";
import DrawLayout from "@shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {getLayerSource} from "../../shared/utils/layerHelper.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";
import {Stroke, Style} from "ol/style.js";

export default {
    name: "StoryCreatorAddDrawCard",
    components: {
        DrawLayout,
        DrawTypes,
        FlatButton,
        IconButton
    },
    props: {
        closeable: {
            type: Boolean,
            required: false,
            default: true
        },
        /**
         * The initial content
         * @type {Object}
         */
        initialContent: {
            type: [Object, null],
            required: false,
            default: null
        }
    },
    emits: ["addDrawing", "click:close"],
    data () {
        return {
            currentModifyInteraction: null,
            source: null,
            featureTitle: [],
            features: [],
            activeFeature: null,
            activeFeatureOriginalStyle: null,
            activeFeatureSelectionStyle: new Style({
                stroke: new Stroke({
                    color: "#ff0000",
                    width: 7
                })
            }),
            mapClickHandler: null
        };
    },
    computed: {
        ...mapGetters("Modules/StoryManager", [
            "currentLayout",
            "drawTypeLabels",
            "drawTypesMain",
            "selectedDrawType",
            "selectedDrawTypeMain",
            "selectedInteraction"
        ])
    },
    watch: {
        /**
         * Watches of the initial content and assign the attributes.
         * @param {Object} val - The initial content.
         * @returns {void}
         */
        initialContent: {
            handler (val) {
                if (!val) {
                    return;
                }

                this.features = ConvertFeature.geoJsonToOpenlayers(val.attrs) || [];
                this.featureTitle = this.features.map(feature => feature.get("title") || "");
            },
            deep: true,
            immediate: true
        }
    },
    mounted () {
        const map = mapCollection.getMap("2D");

        this.source = getLayerSource();
        this.source.clear();
        this.source.addFeatures(this.features);

        if (map) {
            this.mapClickHandler = this.handleMapFeatureClick;
            map.on("singleclick", this.mapClickHandler);
        }
    },
    beforeUnmount () {
        const map = mapCollection.getMap("2D");

        if (map && this.mapClickHandler) {
            map.un("singleclick", this.mapClickHandler);
        }

        this.mapClickHandler = null;

        this.removeInteraction(this.currentModifyInteraction);
        this.currentModifyInteraction = null;

        if (this.activeFeature !== null) {
            this.activeFeature.setStyle(this.activeFeatureOriginalStyle);
        }
    },
    methods: {
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapMutations("Modules/StoryManager", [
            "setCurrentLayout",
            "setDrawTypeLabels",
            "setSelectedDrawType",
            "setSelectedDrawTypeMain",
            "setSelectedInteraction"
        ]),

        /**
         * Activates a feature and applies the selection style.
         * @param {ol/Feature} feature - The feature to activate.
         * @returns {void}
         */
        activateFeature (feature) {
            if (!feature) {
                return;
            }

            if (this.activeFeature === feature) {
                return;
            }

            if (this.activeFeature !== null) {
                this.activeFeature.setStyle(this.activeFeatureOriginalStyle);
            }
            let styles = [];

            this.activeFeature = feature;
            this.activeFeatureOriginalStyle = feature.getStyle();

            if (this.activeFeatureOriginalStyle) {
                if (Array.isArray(this.activeFeatureOriginalStyle)) {
                    styles = this.activeFeatureOriginalStyle;
                }
                else {
                    styles = [this.activeFeatureOriginalStyle];
                }
            }

            feature.setStyle([
                this.activeFeatureSelectionStyle,
                ...styles
            ]);
        },

        /**
         * Adds a feature to the current editable input of the planning scenario.
         * @param {Object} evt - Draw event emitted by draw interaction.
         * @return {void}
         */
        addChapterFeature (evt) {
            const feature = evt?.feature;

            if (!feature) {
                return;
            }
            this.features.push(evt.feature);
            this.activateFeature(feature);
        },

        /**
         * Emitts the addDrawing event with the drawn features and hides the drawn-story-creator layer.
         * @returns {void}
         */
        addDrawing () {
            if (this.activeFeature !== null) {
                this.activeFeature.setStyle(this.activeFeatureOriginalStyle);
                this.activeFeature = null;
                this.activeFeatureOriginalStyle = null;
            }

            const jsonFeatures = ConvertFeature.openlayersToGeoJson(this.features);

            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
            this.setSelectedDrawType("");
            this.setSelectedDrawTypeMain("");
            this.$emit("addDrawing", jsonFeatures);
        },

        /**
         * Edits the geometry of current source features.
         * @returns {void}
         */
        editSource () {
            if (this.currentModifyInteraction === null) {
                this.setSelectedDrawType("");
                this.setSelectedDrawTypeMain("");
                this.setSelectedInteraction("");
                this.removeInteraction(this.selectedInteraction);
                this.currentModifyInteraction = modifyInteraction.createModifyInteraction(this.source);
                this.addInteraction(this.currentModifyInteraction);
            }
            else {
                this.removeInteraction(this.currentModifyInteraction);
                this.currentModifyInteraction = null;
            }
        },

        /*
         * Gets the feature icon according to the geometry type of the feature.
         * @param {ol/feature} feature - The feature object.
         * @returns {String} The icon class name.
         */
        getFeatureIcon (feature) {
            const geometryType = feature?.getGeometry()?.getType();

            switch (geometryType) {
                case "Polygon":
                    return "bi bi-octagon";
                case "LineString":
                    return "bi bi-slash-lg";
                case "Circle":
                    return "bi bi-circle";
                default:
                    return "bi bi-octagon";
            }
        },

        /**
         * Handles clicking the close button.
         * @returns {void}
         */
        handleCloseButtonClick () {
            this.handleDiscardButtonClick();
            this.$emit("click:close");
        },

        /**
         * Handles clicking the discard button.
         * @returns {void}
         */
        handleDiscardButtonClick () {
            if (this.activeFeature !== null) {
                this.activeFeature.setStyle(this.activeFeatureOriginalStyle);
            }
            this.source.clear();
            this.features = [];
            this.featureTitle = [];
            this.activeFeature = null;
            this.activeFeatureOriginalStyle = null;
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
            this.setSelectedDrawType("");
            this.setSelectedDrawTypeMain("");
        },
        /**
         * Activates the feature clicked on the map.
         * @param {Object} evt - The map click event.
         * @returns {void}
         */
        handleMapFeatureClick (evt) {
            const map = evt?.map;
            let clickedFeature = null;

            if (!map) {
                return;
            }

            map.forEachFeatureAtPixel(evt.pixel, feature => {
                if (this.features.includes(feature)) {
                    clickedFeature = feature;
                    return true;
                }
                return false;
            });

            if (!clickedFeature) {
                return;
            }

            this.activateFeature(clickedFeature);
        },

        /**
         * Removes the feature at the specified index from the source and updates the featureTitle array accordingly.
         * @param {number} index - The index of the feature to remove.
         * @returns {void}
         */
        removeFeature (index) {
            const feature = this.features[index];

            if (!feature) {
                return;
            }

            this.source.removeFeature(this.source.getFeatures()[index]);
            this.featureTitle.splice(index, 1);
            this.features.splice(index, 1);

            if (this.activeFeature === feature) {
                feature.setStyle(this.activeFeatureOriginalStyle);
                this.activeFeature = null;
                this.activeFeatureOriginalStyle = null;
            }
        },
        /**
         * Toggles the active state of a feature.
         * @param {ol/Feature} feature - The feature to toggle.
         * @returns {void}
         */
        toggleFeatureActive (feature) {
            if (this.activeFeature === feature) {
                this.activeFeature.setStyle(this.activeFeatureOriginalStyle);
                this.activeFeature = null;
                this.activeFeatureOriginalStyle = null;
                return;
            }

            this.activateFeature(feature);
        }
    }
};
</script>
<template lang="html">
    <div class="card border-0 rounded-3 bg-light">
        <div class="card-body p-4 position-relative">
            <button
                v-if="closeable"
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="handleCloseButtonClick"
            />
            <h5 class="card-title mb-3">
                {{ $t("additional:modules.storyCreator.headlines.addDrawings") }}
            </h5>
            <div
                id="draw-types"
                class="mb-5"
            >
                <div
                    id="story-draw-types"
                    class="mb-2"
                >
                    <div
                        class="row"
                    >
                        <div
                            v-if="source !== null"
                            class="d-flex flex-row col col-8"
                        >
                            <DrawTypes
                                :current-layout="currentLayout"
                                :draw-types="drawTypesMain"
                                :draw-type-labels="drawTypeLabels"
                                :selected-draw-type="selectedDrawType"
                                :selected-draw-type-main="selectedDrawTypeMain"
                                :selected-interaction="selectedInteraction"
                                :set-selected-draw-type="setSelectedDrawType"
                                :set-selected-draw-type-main="setSelectedDrawTypeMain"
                                :set-selected-interaction="setSelectedInteraction"
                                :source="source"
                                @drawend="addChapterFeature"
                            />
                        </div>
                        <div
                            v-if="source?.getFeatures().length"
                            class="col col-4 text-end"
                        >
                            <div class="row d-flex">
                                <IconButton
                                    :class-array="[
                                        'btn-primary',
                                        currentModifyInteraction !== null ? 'active': '',
                                    ]"
                                    :aria="$t('additional:modules.storyCreator.buttons.edit')"
                                    icon="bi bi-tools"
                                    :interaction="editSource"
                                    :label="$t('additional:modules.storyCreator.buttons.edit')"
                                />
                            </div>
                        </div>
                    </div>
                    <div
                        id="draw-layouts"
                        class="mb-5 ps-4 pt-3"
                    >
                        <DrawLayout
                            v-if="selectedDrawType !== '' && selectedDrawTypeMain !== ''"
                            :stroke-range="[1,5]"
                            :current-layout="currentLayout"
                            :selected-draw-type="selectedDrawType"
                            :set-current-layout="setCurrentLayout"
                        />
                    </div>
                    <div
                        v-if="features.length"
                        class="row"
                    >
                        <div class="row no-gutters mb-3">
                            <h5 class="card-title mb-3">
                                {{ $t("additional:modules.storyCreator.headlines.drawnObjects") }}
                            </h5>
                            <div class="table-wrapper">
                                <table class="table table-hover">
                                    <tbody>
                                        <tr
                                            v-for="(feature, key) in features"
                                            :key="feature.getId()"
                                            :class="{'feature-active': activeFeature === feature}"
                                            class="cursor-pointer"
                                            @click="toggleFeatureActive(feature)"
                                        >
                                            <td class="font-bold firstCol">
                                                <button
                                                    class="border-0 bg-transparent large pt-1"
                                                    type="button"
                                                    :aria-label="feature?.getGeometry()?.getType()"
                                                    @click.stop="toggleFeatureActive(feature)"
                                                >
                                                    <i :class="getFeatureIcon(feature)" />
                                                </button>
                                            </td>
                                            <td>
                                                <input
                                                    :id="'feature' + key"
                                                    v-model.trim="featureTitle[key]"
                                                    class="form-control-plaintext w-100 fs-5 outline-none-fallback feature-title"
                                                    :placeholder="'feature' + (key + 1)"
                                                    :aria-label="'feature' + (key + 1)"
                                                    @blur="feature.set('title', featureTitle[key])"
                                                    @click.stop
                                                >
                                            </td>

                                            <td class="font-bold">
                                                <button
                                                    type="button"
                                                    class="border-0 bg-transparent large pt-1"
                                                    :aria-label="$t('additional:modules.storyCreator.addElementDropdown.feature.remove')"
                                                    @click.stop="removeFeature(key)"
                                                >
                                                    <i class="bi bi-trash" />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                class="d-flex justify-content-center gap-2"
            >
                <FlatButton
                    class="mt-2"
                    icon="bi bi-save"
                    :text="$t('additional:modules.storyCreator.buttons.saveDraw')"
                    :interaction="addDrawing"
                />
                <FlatButton
                    class="mt-2"
                    icon="bi bi-x-circle"
                    :secondary="true"
                    :text="$t('additional:modules.storyCreator.buttons.discardDraw')"
                    :interaction="handleDiscardButtonClick"
                />
            </div>
        </div>
    </div>
</template>
<style lang="scss" scoped>
button {
    &.large {
        font-size: 1.5rem;
    }
}
.card-title {
    font-family: $font_family_default;
}
.table-hover {
    border-radius: 0.375rem;
    overflow: hidden;
    --bs-table-hover-bg: #{$light_blue};
    --bs-table-hover-color: inherit;

    > tbody {
        > tr {
            cursor: pointer;

        &:hover .feature-title {
            border-bottom: 1px solid $dark_blue;
        }
            &.feature-active {
                --bs-table-bg: #{$secondary};
                --bs-table-color: #{$white};
                --bs-table-hover-bg: #{$secondary};
                --bs-table-hover-color: #{$white};
                > td,
                button,
                i {
                    color: $white;
                }
                > td {
                    vertical-align: middle;
                }
                .feature-title {
                    color: $white;

                    &::placeholder {
                        color: $white;
                        opacity: 1;
                    }
                }
                &:hover .feature-title {
                    border-bottom-color: $white;
                }
            }
        }
    }
}
#story-draw-types :deep(.active) {
    background-color: $dark_blue;
    border-color: $dark_blue;
    color: $white;
}
</style>
