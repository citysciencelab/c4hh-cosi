<script>
import {convertColor} from "@shared/js/utils/convertColor.js";
import ConvertFeature from "../../shared/utils/featureConverter.js";
import Draw from "ol/interaction/Draw.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import Feature from "ol/Feature.js";
import Point from "ol/geom/Point.js";
import {Fill, Text, Stroke, Style} from "ol/style.js";
import {getLayerSource} from "../../shared/utils/layerHelper.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapActions} from "vuex";
import StoryCreatorAddWriteCardText from "./StoryCreatorAddWriteCardText.vue";
import StoryCreatorAddWriteCardStroke from "./StoryCreatorAddWriteCardStroke.vue";
export default {
    name: "StoryCreatorAddWriteCard",
    components: {
        FlatButton,
        IconButton,
        InputText,
        StoryCreatorAddWriteCardText,
        StoryCreatorAddWriteCardStroke
    },
    props: {
        initialContent: {
            type: [Object, null],
            required: false,
            default: null
        }
    },
    emits: ["addMapText", "click:close"],
    data () {
        return {
            activeAnnotation: "text",
            annotations: [],
            drawInteraction: null,
            previewFeature: null,
            source: null,
            strokeLayout: {
                type: "arrow",
                color: "rgb(0, 0, 0)",
                width: 3
            },
            text: "",
            textLayout: {
                textColor: "rgb(255, 255, 255)",
                fontSize: 24,
                fontStyle: "regular",
                backgroundColor: "rgb(0, 0, 0)",
                backgroundOpacity: 50
            }
        };
    },
    watch: {
        activeAnnotation (annotation) {
            if (annotation !== "text" && this.previewFeature) {
                this.source.removeFeature(this.previewFeature);
                this.previewFeature = null;
            }
        },
        text () {
            if (this.previewFeature && this.activeAnnotation === "text") {
                this.previewFeature.setStyle(this.createTextStyle());
            }
        },
        textLayout: {
            deep: true,
            handler () {
                if (this.previewFeature) {
                    this.previewFeature.setStyle(this.createTextStyle());
                }
            }
        },
        initialContent: {
            handler (val) {
                if (!val) {
                    return;
                }

                this.annotations = ConvertFeature.geoJsonToOpenlayers(val.attrs) || [];
                this.annotations.forEach(feature => {
                    feature.set("storyCreatorType", "write");
                });
            },
            deep: true,
            immediate: true
        }
    },
    mounted () {
        this.source = getLayerSource();

        this.removeWrittenFeatures(this.source);
        this.source.addFeatures(this.annotations);

        this.registerListener({type: "pointermove", listener: this.handleMapPointerMove.bind(this), keyForBoundFunctions: "story-creator-write-pointermove"});
        this.registerListener({type: "click", listener: this.handleMapClick.bind(this), keyForBoundFunctions: "story-creator-write-click"});
    },
    beforeUnmount () {
        this.unregisterListener({type: "pointermove", listener: this.handleMapPointerMove.bind(this), keyForBoundFunctions: "story-creator-write-pointermove"});
        this.unregisterListener({type: "click", listener: this.handleMapClick.bind(this), keyForBoundFunctions: "story-creator-write-click"});

        this.stopDrawing();
    },
    methods: {
        ...mapActions("Maps", [
            "addInteraction",
            "removeInteraction",
            "registerListener",
            "unregisterListener"
        ]),

        /**
         * Creates the style for a text annotation.
         * @returns {ol/Style} The text annotation style.
         */
        createTextStyle () {
            const fontStyle = this.textLayout.fontStyle === "regular" ? "" : `${this.textLayout.fontStyle} `;

            return new Style({
                text: new Text({
                    text: this.text,
                    font: `${fontStyle}${this.textLayout.fontSize}px sans-serif`,
                    fill: new Fill({
                        color: this.textLayout.textColor
                    }),
                    backgroundFill: new Fill({
                        color: this.getBackgroundColor()
                    }),
                    padding: [8, 8, 8, 8]
                })
            });
        },
        /**
         * Creates the style for a line or arrow annotation.
         * @param {ol/Feature} feature - The feature used to calculate the arrow head.
         * @returns {ol/Style|ol/Style[]} The annotation style.
         */
        createStrokeStyle (feature) {
            const style = new Style({
                stroke: new Stroke({
                    color: this.strokeLayout.color,
                    width: this.strokeLayout.width
                })
            });

            if (
                this.strokeLayout.type !== "arrow" ||
                !feature
            ) {
                return style;
            }

            const geometry = feature.getGeometry();
            const coordinates = geometry?.getCoordinates();

            if (!coordinates || coordinates.length < 2) {
                return style;
            }

            return [
                style,
                ConvertFeature.getArrowStyle(coordinates, this.strokeLayout.color, this.strokeLayout.width)
            ];
        },
        /**
         * Discards all Write annotations and resets the annotation state.
         * @returns {void}
         */
        discardAnnotations () {
            this.stopDrawing();

            this.removeWrittenFeatures(this.source);
            this.annotations = [];
            this.previewFeature = null;
            this.activeAnnotation = null;
        },
        /**
         * Creates the background color including the configured opacity.
         * @returns {String|Array} The background color.
         */
        getBackgroundColor () {
            return [
                ...convertColor(this.textLayout.backgroundColor, "rgb"),
                this.textLayout.backgroundOpacity / 100
            ];
        },

        /**
         * Handles selecting the arrow annotation tool.
         * @returns {void}
         */
        handleArrowButtonClick () {
            if (this.activeAnnotation === "arrow") {
                this.selectAnnotation("arrow");
                return;
            }

            this.selectAnnotation("arrow");
            this.startArrowDrawing();
        },
        /**
         * Handles clicking the close button.
         * @returns {void}
         */
        handleCloseButtonClick () {
            this.stopDrawing();
            this.$emit("click:close");
        },
        /**
         * Handles placing a text annotation on the map.
         * @param {Object} event - The map click event.
         * @returns {void}
         */
        handleMapClick (event) {
            if (this.activeAnnotation !== "text" || !this.text) {
                return;
            }

            if (!this.previewFeature) {
                return;
            }

            const annotation = new Feature({
                geometry: new Point(event.coordinate)
            });

            annotation.set("storyCreatorType", "write");
            annotation.setStyle(this.createTextStyle());
            this.source.removeFeature(this.previewFeature);
            this.source.addFeature(annotation);
            this.annotations.push(annotation);
            this.previewFeature = null;
        },
        /**
         * Updates the text annotation preview while moving over the map.
         * @param {Object} event - The map pointer move event.
         * @returns {void}
         */
        handleMapPointerMove (event) {
            if (this.activeAnnotation !== "text" || !this.text) {
                return;
            }

            if (!this.previewFeature) {
                this.previewFeature = new Feature({
                    geometry: new Point(event.coordinate)
                });

                this.previewFeature.setStyle(this.createTextStyle());
                this.source.addFeature(this.previewFeature);
            }
            else {
                this.previewFeature.setGeometry(
                    new Point(event.coordinate)
                );
            }
        },

        /**
         * Removes all written features from the specified source.
         * @params source - The source from which to remove written features.
         * @returns {void}
         */
        removeWrittenFeatures (source) {
            const existingWriteFeatures = source.getFeatures().filter(
                feature => feature.get("storyCreatorType") === "write"
            );

            source.removeFeatures(existingWriteFeatures);
        },

        /**
         * Saves all annotations and closes the annotation editing state.
         * @returns {void}
         */
        saveAnnotations () {
            if (this.previewFeature) {
                this.source.removeFeature(this.previewFeature);
                this.previewFeature = null;
            }

            const jsonFeatures = ConvertFeature.openlayersToGeoJson(this.annotations);

            this.$emit("addMapText", jsonFeatures);

            this.stopDrawing();
            this.activeAnnotation = null;
        },
        /**
         * Selects or deselects an annotation type.
         * @param {String} type - The annotation type.
         * @returns {void}
         */
        selectAnnotation (type) {
            if (this.activeAnnotation === type) {
                this.activeAnnotation = null;
                this.stopDrawing();
                return;
            }

            this.stopDrawing();
            this.activeAnnotation = type;
        },
        /**
         * Updates the current stroke layout.
         * @param {Object} layout - The stroke layout configuration.
         * @returns {void}
         */
        setStrokeLayout (layout) {
            this.strokeLayout = layout;
        },
        /**
         * Updates the current text layout.
         * @param {Object} layout - The text layout configuration.
         * @returns {void}
         */
        setTextLayout (layout) {
            this.textLayout = layout;
        },
        /**
         * Starts drawing an arrow on the map.
         * @returns {void}
         */
        startArrowDrawing () {
            if (this.drawInteraction) {
                this.removeInteraction(this.drawInteraction);
                this.drawInteraction = null;
            }

            this.drawInteraction = new Draw({
                source: this.source,
                type: "LineString",
                maxPoints: 2,
                style: feature => this.createStrokeStyle(feature)
            });

            this.addInteraction(this.drawInteraction);

            this.drawInteraction.on("drawend", event => {
                event.feature.set("storyCreatorType", "write");
                event.feature.setStyle(
                    this.createStrokeStyle(event.feature)
                );

                this.annotations.push(event.feature);
            });
        },
        /**
         * Stops the active drawing interaction.
         * @returns {void}
         */
        stopDrawing () {
            if (this.drawInteraction) {
                this.removeInteraction(this.drawInteraction);
                this.drawInteraction = null;
            }
        }
    }
};
</script>
<template lang="html">
    <div class="card border-0 rounded-3 bg-light">
        <div class="card-body p-4 position-relative">
            <button
                type="button"
                class="btn-close position-absolute top-0 end-0 m-2"
                aria-label="Close"
                @click="handleCloseButtonClick"
            />
            <h5 class="mb-3">
                {{ $t("additional:modules.storyCreator.headlines.addMapAnnotations") }}
            </h5>
            <div class="bg-white p-3 rounded-3 mb-5 p-3">
                <div
                    id="annotation-types"
                    class="d-flex gap-5"
                >
                    <IconButton
                        :class-array="['btn-primary', activeAnnotation === 'text' ? 'active' : '']"
                        :aria="$t('additional:modules.storyCreator.buttons.text')"
                        icon="bi bi-type"
                        :interaction="() => selectAnnotation('text')"
                        :label="$t('additional:modules.storyCreator.buttons.text')"
                    />
                    <IconButton
                        :class-array="['btn-primary', activeAnnotation === 'arrow' ? 'active' : '']"
                        :aria="$t('additional:modules.storyCreator.buttons.arrow')"
                        icon="bi bi-arrow-up-right"
                        :interaction="handleArrowButtonClick"
                        :label="$t('additional:modules.storyCreator.labels.lineType')"
                    />
                </div>
                <hr>
                <div
                    v-if="activeAnnotation === 'text'"
                    class="mt-3"
                >
                    <h5>{{ $t("additional:modules.storyCreator.headlines.text") }}</h5>
                    <InputText
                        id="annotation-text"
                        v-model="text"
                        :label="$t('additional:modules.storyCreator.labels.annotationText')"
                        :placeholder="$t('additional:modules.storyCreator.labels.annotationText')"
                        class="mb-4"
                    />
                    <div
                        id="text-settings"
                        class="d-flex justify-content-start gap-1"
                    >
                        <StoryCreatorAddWriteCardText
                            :current-layout="textLayout"
                            :set-current-layout="setTextLayout"
                        />
                    </div>
                </div>
                <div
                    v-if="activeAnnotation === 'arrow'"
                    class="mt-3"
                >
                    <h6>{{ $t('additional:modules.storyCreator.headlines.line') }}</h6>
                    <StoryCreatorAddWriteCardStroke
                        :current-layout="strokeLayout"
                        :set-current-layout="setStrokeLayout"
                    />
                </div>
            </div>
        </div>
        <div
            class="d-flex justify-content-center gap-2"
        >
            <FlatButton
                class="mt-2"
                icon="bi bi-save"
                :text="$t('additional:modules.storyCreator.buttons.saveAnnotations')"
                :interaction="saveAnnotations"
            />
            <FlatButton
                class="mt-2"
                icon="bi bi-x-circle"
                :secondary="true"
                :text="$t('additional:modules.storyCreator.buttons.discardAnnotations')"
                :interaction="discardAnnotations"
            />
        </div>
    </div>
</template>
<style lang="scss" scoped>
:deep(#annotation-types .btn.active) {
    background-color: $dark_blue;
}
:deep(.btn-wrapper) {
    width: auto;
}
</style>
