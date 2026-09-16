<script>
import ConvertFeature from "../../../simulationTool/js/convertFeatures.js";
import DrawLayout from "@shared/modules/draw/components/DrawLayout.vue";
import DrawTypes from "@shared/modules/draw/components/DrawTypes.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {getLayerSource} from "../../shared/utils/layerHelper.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import modifyInteraction from "@masterportal/masterportalapi/src/maps/interactions/modifyInteraction.js";

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
            features: []
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
        this.source = getLayerSource();
        this.source.clear();
        this.source.addFeatures(this.features);
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
         * Adds a feature to the current editable input of the planning scenario.
         * @param {Object} evt - Draw event emitted by draw interaction.
         * @return {void}
         */
        addChapterFeature (evt) {
            this.features.push(evt.feature);
        },

        /**
         * Emitts the addDrawing event with the drawn features and hides the drawn-story-creator layer.
         * @returns {void}
         */
        addDrawing () {
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
            this.source.clear();
            this.features = [];
            this.featureTitle = [];
            this.removeInteraction(this.currentModifyInteraction);
            this.currentModifyInteraction = null;
            this.setSelectedDrawType("");
            this.setSelectedDrawTypeMain("");
        },

        /**
         * Removes the feature at the specified index from the source and updates the featureTitle array accordingly.
         * @param {number} index - The index of the feature to remove.
         * @returns {void}
         */
        removeFeature (index) {
            this.source.removeFeature(this.source.getFeatures()[index]);
            this.featureTitle.splice(index, 1);
            this.features.splice(index, 1);
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
                    id="draw-types"
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
                        class="mb-5"
                    >
                        <DrawLayout
                            v-if="selectedDrawType !== '' && selectedDrawTypeMain !== ''"
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
                                <table class="table">
                                    <tbody>
                                        <tr
                                            v-for="(feature, key) in features"
                                            :key="key"
                                        >
                                            <td
                                                class="font-bold firstCol"
                                            >
                                                <button
                                                    class="border-0 bg-transparent large pt-1"
                                                    type="button"
                                                    :aria-label="feature?.getGeometry()?.getType()"
                                                >
                                                    <i :class="getFeatureIcon(feature)" />
                                                </button>
                                            </td>
                                            <td>
                                                <input
                                                    :id="'feature' + key"
                                                    v-model.trim="featureTitle[key]"
                                                    class="form-control-plaintext w-100 fs-5 outline-none-fallback"
                                                    :placeholder="'feature' + (key + 1)"
                                                    :aria-label="'feature' + (key + 1)"
                                                    @blur="feature.set('title', featureTitle[key])"
                                                >
                                            </td>
                                            <td
                                                class="font-bold"
                                            >
                                                <button
                                                    type="button"
                                                    class="border-0 bg-transparent large pt-1"
                                                    :aria-label="$t('additional:modules.storyCreator.addElementDropdown.feature.remove')"
                                                    @click="removeFeature(key)"
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
</style>
