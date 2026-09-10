<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import beautifyKey from "@shared/js/utils/beautifyKey.js";
import {boundingExtent} from "ol/extent.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {isEmailAddress} from "@shared/js/utils/isEmailAddress.js";
import {isHTML} from "@shared/js/utils/isHTML.js";
import {isImage, isWebLink} from "@shared/js/utils/urlHelper.js";
import isObject from "@shared/js/utils/isObject.js";
import {isPhoneNumber, getPhoneNumberAsWebLink} from "@shared/js/utils/isPhoneNumber.js";
import {mapActions, mapGetters} from "vuex";
import StoryCreatorAddImageCard from "./StoryCreatorAddImageCard.vue";
import {translateKeyWithPlausibilityCheck} from "@shared/js/utils/translateKeyWithPlausibilityCheck.js";

export default {
    name: "StoryCreatorAddFeatureCard",
    components: {
        AccordionItem,
        FlatButton,
        InputText,
        StoryCreatorAddImageCard
    },
    props: {
        createImageAsset: {
            type: Function,
            required: false,
            default: () => ({})
        },
        imageAssetsById: {
            type: Object,
            required: false,
            default: () => ({})
        },
        /**
         * The initial content
         * @type {Object}
         */
        initialContent: {
            type: [Object, null],
            required: false,
            default: null
        },
        /**
         * The selected layer lists
         * @type {Object[]}
         */
        selectedLayers: {
            type: Array,
            required: false,
            default: () => []
        },
        /**
         * The zoom level of current chapter
         * @type {Number}
         */
        chapterZoomLevel: {
            type: [Number, String],
            required: true
        }
    },
    emits: ["addFeature", "click:close"],
    data () {
        return {
            attributes: null,
            content: null,
            currentFeature: null,
            description: "",
            layerName: "",
            title: "",
            zoomlevel: this.chapterZoomLevel,
            image: null,
            isImageValidState: true,
            isImageAccordionOpen: true
        };
    },
    computed: {
        ...mapGetters(["layerConfigById"]),
        ...mapGetters("Maps", ["clickCoordinate"]),
        ...mapGetters("Modules/StoryManager", ["gfiFeatures"])
    },
    watch: {
        /**
         * Watches of the attributes, if it is null, the pointmarker will be removed.
         * @param {Object} val - The attribute object.
         * @returns {void}
         */
        attributes: {
            handler (val) {
                if (!val) {
                    this.removePointMarker();
                }
            },
            deep: true
        },
        /**
         * Watches of click coordinate to collect the feature
         * @returns {void}
         */
        clickCoordinate: {
            handler () {
                this.collectGfiFeatures();
            },
            deep: true
        },
        /**
         * Watches of current feature
         * @param {ol/Feature} val - The current feature.
         * @returns {void}
         */
        currentFeature: {
            handler (val) {
                if (!val) {
                    this.removePointMarker();
                }
            },
            deep: true
        },
        /**
         * Watches of gfi features.
         * @param {ol/Feature[]} val - The gfi features.
         * @returns {void}
         */
        gfiFeatures: {
            handler (val) {
                this.removePointMarker();
                this.currentFeature = val?.[0];

                if (this.currentFeature) {
                    this.placingPointMarker(this.clickCoordinate);
                }

                this.coordinate = this.clickCoordinate;
                this.layerName = this.layerConfigById(this.currentFeature?.getLayerId())?.name || "";
                this.attributes = this.currentFeature?.getProperties();
                this.title = this.getDefaultTitle();
            },
            deep: true
        },
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

                const content = JSON.parse(JSON.stringify(val))?.attrs;

                this.attributes = content?.attributes;
                this.coordinate = content?.coordinate;
                this.description = content?.description;
                this.featureId = content?.featureId;
                this.layerId = content?.layerId;
                this.layerName = this.layerConfigById(content?.layerId)?.name;
                this.title = content?.title;
                this.zoomlevel = content?.zoomlevel;
                this.image = content?.image || null;

                this.placingPointMarker(content?.coordinate);
                this.zoomToExtent({extent: boundingExtent([this.coordinate]), options: {maxZoom: typeof this.zoomlevel === "number" ? content?.zoomlevel : mapCollection.getMapView("2D").getZoom()}});
            },
            deep: true,
            immediate: true
        },
        /**
         * Watches of the selected subject layers.
         * @param {Object[]} val - The selected layers.
         * @returns {void}
         */
        selectedLayers: {
            handler (val) {
                if (!val.length || !val.some(layer => layer.layerId === this.currentFeature?.getLayerId())) {
                    this.currentFeature = null;
                    this.attributes = null;
                }
            },
            deep: true,
            immediate: true
        },
        /**
         * Watches of the title length and cut it.
         * @param {String} val - The title.
         * @returns {void}
         */
        title (val) {
            if (val && val.length > 200) {
                this.$nextTick(() => {
                    this.title = val.substring(0, 200);
                });
            }
        },
        /**
         * Watches of the description length and cut it.
         * @param {String} val - The description.
         * @returns {void}
         */
        description (val) {
            if (val && val.length > 500) {
                this.$nextTick(() => {
                    this.description = val.substring(0, 500);
                });
            }
        }
    },
    beforeUnmount () {
        this.removePointMarker();
    },
    methods: {
        ...mapActions("Maps", ["placingPointMarker", "removePointMarker", "zoomToExtent"]),
        ...mapActions("Modules/StoryManager", ["collectGfiFeatures"]),
        beautifyKey,
        isWebLink,
        isImage,
        isPhoneNumber,
        getPhoneNumberAsWebLink,
        isEmailAddress,
        isHTML,
        translateKeyWithPlausibilityCheck,

        /**
         * Gets the default title with feature id.
         * @returns {String} the default title.
         */
        getDefaultTitle () {
            return this.currentFeature?.getId();
        },

        /**
         * Gets the title if it is empty
         * @param {String} val title
         * @returns {String} the non-empty title.
         */
        getTitle (val) {
            return val || this.getDefaultTitle() || JSON.parse(JSON.stringify(this.initialContent))?.attrs.title;
        },

        /**
         * Checks if it has pipe
         * @param {String} value string to check.
         * @returns {Boolean} whether the given value includes a pipe.
         */
        hasPipe: function (value) {
            return typeof value === "string" && value.includes("|");
        },

        /**
         * Updates the image validation state.
         * @param {Boolean} valid - Whether the image is valid.
         * @returns {void}
         */
        handleImageValidity (valid) {
            this.isImageValidState = valid;
        },

        /**
         * Updates the image accordion state.
         * @param {Boolean} isCollapsed - Whether the accordion is collapsed.
         * @returns {void}
         */
        handleImageAccordionState (isCollapsed) {
            this.isImageAccordionOpen = !isCollapsed;
        },

        /**
         * Deletes one element from attribute object.
         * @param {String} key key of the element.
         * @returns {void}
         */
        removeAttribute (key) {
            if (!isObject(this.attributes) || !Object.prototype.hasOwnProperty.call(this.attributes, key)) {
                return;
            }

            delete this.attributes[key];
        },

        /**
         * Saves the feature attributes
         * @returns {void}
         */
        saveFeature () {
            const featureObj = {
                title: this.title,
                description: this.description,
                layerId: this.currentFeature?.getLayerId() || this.layerId,
                featureId: this.getDefaultTitle(),
                coordinate: this.coordinate,
                attributes: this.attributes,
                zoomlevel: this.zoomlevel,
                image: this.image
            };

            this.$emit("addFeature", featureObj);
        }
    }
};

</script>

<template lang="html">
    <div
        class="card border-0 rounded-3 bg-light p-4"
    >
        <div class="d-flex align-items-center justify-content-between mb-3">
            <h5 class="mb-3">
                {{ $t("additional:modules.storyCreator.addElementDropdown.items.feature") }}
            </h5>
            <button
                type="button"
                class="btn-close ms-2"
                aria-label="Close"
                @click="$emit('click:close')"
            />
        </div>
        <div
            v-if="attributes"
            class="d-flex align-items-center justify-content-center text-secondary small mt-0 mb-3"
        >
            <i class="bi bi-info-circle me-2" />
            <span>
                {{ $t('additional:modules.storyCreator.addElementDropdown.feature.info') }}
            </span>
        </div>
        <div v-if="attributes">
            <div class="bg-white rounded-3 p-4">
                <div class="row no-gutters mb-3">
                    <div class="small">
                        Layer
                    </div>
                    <div>
                        {{ layerName }}
                    </div>
                </div>
                <InputText
                    id="storyTitle"
                    v-model.trim="title"
                    :label="$t('additional:modules.storyCreator.addElementDropdown.feature.title')"
                    :placeholder="$t('additional:modules.storyCreator.addElementDropdown.feature.title')"
                    class="mb-4"
                    @blur="title = getTitle(title)"
                />
                <InputText
                    id="storyDescription"
                    v-model.trim="description"
                    :label="$t('additional:modules.storyCreator.addElementDropdown.feature.description')"
                    :placeholder="$t('additional:modules.storyCreator.addElementDropdown.feature.description')"
                    html-type="textarea"
                    class="mb-4"
                />
                <AccordionItem
                    id="add-image"
                    icon="bi-image"
                    :is-open="false"
                    :title="$t('additional:modules.storyCreator.addElementDropdown.feature.addImage')"
                    @update-accordion-state="handleImageAccordionState"
                >
                    <StoryCreatorAddImageCard
                        :closeable="false"
                        :create-image-asset="createImageAsset"
                        :embedded="true"
                        :image-assets-by-id="imageAssetsById"
                        :initial-image="image"
                        @update:image="image = $event"
                        @update:image-valid="handleImageValidity"
                    />
                </AccordionItem>
                <div
                    v-if="!isImageAccordionOpen && image && !isImageValidState"
                    class="text-danger small mb-2"
                >
                    <i class="bi bi-exclamation-circle me-1" />
                    {{ $t('additional:modules.storyCreator.labels.imageRequiredFields') }}
                </div>
                <hr>
                <AccordionItem
                    id="edit-attributes"
                    icon="bi-sliders2"
                    :is-open="true"
                    :title="$t('additional:modules.storyCreator.addElementDropdown.feature.editAttribute')"
                >
                    <div class="row no-gutters mb-3">
                        <div
                            class="table-wrapper"
                        >
                            <table class="table">
                                <tbody v-if="attributes">
                                    <tr
                                        v-for="(value, key) in attributes"
                                        :key="key"
                                        class="attribute-row"
                                    >
                                        <td
                                            class="font-bold firstCol"
                                        >
                                            <span>
                                                {{ beautifyKey(translateKeyWithPlausibilityCheck(key, v => $t(v))) }}
                                            </span>
                                            <button
                                                type="button"
                                                class="btn-close ms-2"
                                                :aria-label="$t('additional:modules.storyCreator.addElementDropdown.feature.remove')"
                                                @click="removeAttribute(key)"
                                            />
                                        </td>
                                        <td v-if="isWebLink(value) && !isImage(value)">
                                            <a
                                                :href="value"
                                                target="_blank"
                                            >Link</a>
                                        </td>
                                        <td v-else-if="isWebLink(value) && isImage(value)">
                                            <a
                                                :href="value"
                                                target="_blank"
                                            >
                                                <img
                                                    class="gfi-theme-images-image"
                                                    :alt="$t('common:modules.getFeatureInfo.themes.default.imgAlt')"
                                                    :src="value"
                                                >
                                            </a>
                                        </td>
                                        <td v-else-if="isHTML(value)">
                                            <div v-html="value" />
                                        </td>
                                        <td v-else-if="isPhoneNumber(value)">
                                            <a :href="getPhoneNumberAsWebLink(value)">{{ value }}</a>
                                        </td>
                                        <td v-else-if="isEmailAddress(value)">
                                            <a :href="`mailto:${value}`">{{ value }}</a>
                                        </td>
                                        <td
                                            v-else-if="Array.isArray(value)"
                                            v-html="value.join('<br>')"
                                        />
                                        <td v-else-if="hasPipe(value)">
                                            <p
                                                v-for="(splitValue, splitKey) in value.split('|')"
                                                :key="splitKey"
                                            >
                                                {{ splitValue }}
                                            </p>
                                        </td>
                                        <td
                                            v-else-if="typeof value === 'string' && value.includes('<br>')"
                                            v-html="value"
                                        />
                                        <td v-else>
                                            {{ value }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </AccordionItem>
            </div>
            <div class="d-flex justify-content-center gap-2 mt-4">
                <FlatButton
                    id="save"
                    class="mb-4"
                    :icon="'bi-save'"
                    :text="$t('additional:modules.storyCreator.addElementDropdown.feature.save')"
                    :title="$t('additional:modules.storyCreator.addElementDropdown.feature.save')"
                    :disabled="!isImageValidState"
                    :interaction="() => saveFeature()"
                />
                <FlatButton
                    id="cancel"
                    class="mb-4"
                    :icon="'bi-x-lg'"
                    :text="$t('additional:modules.storyCreator.addElementDropdown.feature.cancel')"
                    :title="$t('additional:modules.storyCreator.addElementDropdown.feature.cancel')"
                    :secondary="true"
                    :interaction="() => attributes = null"
                />
            </div>
        </div>
        <div
            v-if="!attributes || !selectedLayers.length"
            class="bg-white rounded-3 p-4 d-flex align-items-center text-center"
        >
            <div class="d-flex flex-column align-items-center text-center w-100">
                <i
                    class="bi bi-geo-alt-fill fs-1 mb-3"
                />
                <template v-if="selectedLayers.length && !attributes">
                    <strong class="mb-2">{{ $t("additional:modules.storyCreator.chapter.noFeatureLinked") }}</strong>
                    <p
                        class="text-muted mb-0 px-2 px-md-5"
                    >
                        {{ $t("additional:modules.storyCreator.chapter.addFeatureDescription") }}
                    </p>
                    <div class="dot-flashing my-3" />
                </template>
                <p
                    v-else-if="!selectedLayers.length"
                    class="text-muted mb-0"
                >
                    {{ $t("additional:modules.storyCreator.chapter.noSubjectLayerHint") }}
                </p>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .small {
        font-size: $font-size-sm;
    }
    .table {
        tr {
            position: relative;
            button {
                position: absolute;
                top: 10px;
                right: 0px;
                width: 20px;
                cursor: pointer;
                display: none;
                font-size: 10px;
            }
            &:hover {
                button {
                    display: block;
                }
            }
            td:last-child {
                padding-right: 10px;
            }
        }
    }
    .attribute-row:hover > td {
        background-color: $light_blue;
    }
    .dot-flashing {
        position: relative;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite linear alternate;
        animation-delay: 0.5s;
    }

    .dot-flashing::before,
    .dot-flashing::after {
        content: "";
        display: inline-block;
        position: absolute;
        top: 0;
    }

    .dot-flashing::before {
        left: -12px;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 0s;
    }

    .dot-flashing::after {
        left: 12px;
        width: 6px;
        height: 6px;
        border-radius: 5px;
        background-color: $dark_grey;
        color: $dark_grey;
        animation: dot-flashing 1s infinite alternate;
        animation-delay: 1s;
    }

    @keyframes dot-flashing {
        0% {
            background-color: $dark_grey;
        }
        50%,
        100% {
            background-color: $light_grey;
        }
    }
</style>
