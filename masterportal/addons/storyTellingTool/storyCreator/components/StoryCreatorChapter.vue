<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AddElementDropdown from "../shared/modules/addElementDropdown/components/AddElementDropdown.vue";
import buildTreeStructure from "@appstore/js/buildTreeStructure.js";
import draggable from "vuedraggable";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {getAndMergeAllRawLayers} from "@appstore/js/getAndMergeRawLayer.js";
import isObject from "@shared/js/utils/isObject.js";
import {mapGetters} from "vuex";
import Multiselect from "vue-multiselect";
import {sort} from "@shared/js/utils/sort.js";
import store from "@appstore/index.js";
import StoryCreatorAddTextCard from "./StoryCreatorAddTextCard.vue";
import StoryCreatorAddImageCard from "./StoryCreatorAddImageCard.vue";
import tipTapJsonToHtml from "../shared/modules/tipTapEditor/js/tipTapJsonToHtml.js";
import {Toast} from "bootstrap";

export default {
    name: "StoryCreatorChapter",
    components: {
        AccordionItem,
        AddElementDropdown,
        Draggable: draggable,
        FlatButton,
        Multiselect,
        StoryCreatorAddImageCard,
        StoryCreatorAddTextCard
    },
    props: {
        /**
         * Callback to create image asset metadata in StoryCreator.
         * @type {Function}
         */
        createImageAsset: {
            type: Function,
            required: true
        },
        editIndex: {
            type: [Boolean, Number],
            required: false,
            default: false
        },
        /**
         * Image assets keyed by id, passed from parent.
         * @type {Object}
         */
        imageAssetsById: {
            type: Object,
            required: true
        },
        /**
         * Existing chapter to edit. If not provided, creates a new blank chapter.
         * @type {Object}
         */
        initialChapter: {
            type: Object,
            required: false,
            default: null
        }
    },
    emits: [
        "save-chapter",
        "cancel-chapter"
    ],
    data () {
        return {
            openContentEditor: {
                type: "",
                index: null
            },
            content: [],
            coordinate: [],
            zoomlevel: "",
            confirmedCoordinate: [],
            confirmedZoomlevel: "",
            layerList: [],
            toolList: [],
            selectedLayer: [],
            selectedTool: "",
            showAlert: false,
            title: this.$t("additional:modules.storyCreator.chapter.title")
        };
    },
    computed: {
        ...mapGetters(["configuredModules", "layerConfig"]),
        ...mapGetters("Modules/StoryManager", ["subjectLayerCategory"]),
        /**
         * Returns true if the current map coordinate or zoom level differs from the last confirmed values.
         * @returns {Boolean} True if position or zoom has changed, otherwise false.
         */
        positionChanged () {
            if (!this.confirmedCoordinate.length || !this.confirmedZoomlevel) {
                return false;
            }
            return (
                !this.areCoordinatesEqual(this.coordinate, this.confirmedCoordinate) || this.zoomlevel !== this.confirmedZoomlevel
            );
        },
        /**
         * Returns true if the button should be disabled. Disabled if confirmed values exist and nothing has changed.
         * @returns {Boolean} True if the button should be disabled, otherwise false.
         */
        isButtonDisabled () {
            if (!this.confirmedCoordinate.length || !this.confirmedZoomlevel) {
                return false;
            }
            return this.areCoordinatesEqual(this.coordinate, this.confirmedCoordinate) && this.zoomlevel === this.confirmedZoomlevel;
        },
        /**
         * Returns true when an add/edit component is currently open.
         * @returns {Boolean} True if a content editor is open, otherwise false.
         */
        isContentEditorOpen () {
            return this.openContentEditor.type !== "";
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
    mounted () {
        this.layerList = this.getLayerList();
        this.toolList = this.getToolList(this.configuredModules);

        this.loadChapterData();

        const map = mapCollection.getMap("2D");

        if (map) {
            map.on("moveend", this.updatePositionFromMap);
        }

        // Feature aus dem dev-Branch, um beim Hinzufügen (nicht Editieren) einen Dummy-Text zu setzen
        if (this.editIndex === false) {
            this.content = [
                {
                    type: "doc",
                    content: [
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: this.$t("additional:modules.storyCreator.chapter.initialText")
                                }
                            ]
                        }
                    ]
                }
            ];
        }
    },
    beforeUnmount () {
        const map = mapCollection.getMap("2D");

        if (map) {
            map.un("moveend", this.updatePositionFromMap);
        }
    },
    methods: {
        tipTapJsonToHtml,
        /**
         * Resets the current chapter and goes back to overview page.
         * @returns {void}
         */
        cancelChapter () {
            this.resetCurrentChapter();
            this.$emit("cancel-chapter");
        },
        /**
         * Opens a content add/edit component and stores context of the open editor.
         * @param {String} type - The editor type (e.g. "text" or "image").
         * @returns {void}
         */
        openContentEditorForAdd (type) {
            this.openContentEditor = {
                type,
                index: this.content.length
            };
        },
        /**
         * Closes the current content editor and unlocks content interactions.
         * @returns {void}
         */
        closeContentEditor () {
            this.openContentEditor = {
                type: "",
                index: null
            };
        },
        /**
         * Opens a content editor to edit an existing item.
         * @param {Number} index - The index of the item to edit.
         * @param {String} type - The editor type (e.g. "text").
         * @returns {void}
         */
        openContentEditorForEdit (index, type) {
            if (this.isContentEditorOpen) {
                return;
            }
            this.openContentEditor = {
                type,
                index
            };
        },
        /**
         * Returns true if the given index is currently edited.
         * @param {Number} index - The index of the content item.
         * @returns {Boolean} True if the item is in edit mode.
         */
        isEditingContentItem (index) {
            return this.isContentEditorOpen
                && this.openContentEditor.index < this.content.length
                && this.openContentEditor.index === index;
        },
        /**
         * Loads initial chapter data into local state.
         * @returns {void}
         */
        loadChapterData () {
            if (!this.initialChapter) {
                return;
            }

            const chapter = this.initialChapter;

            this.title = chapter.title || this.$t("additional:modules.storyCreator.chapter.title");
            this.content = Array.isArray(chapter.content)
                ? JSON.parse(JSON.stringify(chapter.content))
                : [];

            if (!chapter.map) {
                return;
            }

            this.confirmedCoordinate = chapter.map.center ? [...chapter.map.center] : [];
            this.coordinate = chapter.map.center ? [...chapter.map.center] : [];
            this.confirmedZoomlevel = chapter.map.zoomLevel || "";
            this.zoomlevel = chapter.map.zoomLevel || "";

            this.selectedLayer = Array.isArray(chapter.map.layers)
                ? this.layerList.filter(layer => chapter.map.layers.includes(layer.layerId))
                : [];
            this.selectedTool = chapter.map.tool
                ? this.toolList.find(tool => tool.toolId === chapter.map.tool) || ""
                : "";
        },
        /**
         * Returns true if the add editor for the given type is open.
         * @param {String} type - The content type.
         * @returns {Boolean} True if add editor is open for this type.
         */
        isAddingContentType (type) {
            return this.isContentEditorOpen
                && this.openContentEditor.type === type
                && this.openContentEditor.index === this.content.length;
        },
        /**
         * Returns true if the given content item should be non-interactive.
         * @param {Number} index - The index of the content item.
         * @returns {Boolean} True if the item should be locked, otherwise false.
         */
        isContentItemLocked (index) {
            return this.isContentEditorOpen && this.openContentEditor.index !== index;
        },
        /**
         * Returns a list of layer names.
         * @returns {Object[]} A list of objects with following format: {layerId: x, label: y}
         */
        getLayerList () {
            const rawLayers = getAndMergeAllRawLayers(),
                layerConfig = {
                    baselayer: {},
                    subjectlayer: {}
                },
                layersStructured = buildTreeStructure.build(rawLayers, layerConfig, this.subjectLayerCategory, []);

            return this.getParsedLayerList(layersStructured?.elements);
        },

        /**
         * Confirms the current map position and zoom level.
         * @returns {void}
         */
        getMapPosition () {
            this.updatePositionFromMap();

            this.confirmedCoordinate = [...this.coordinate];
            this.confirmedZoomlevel = this.zoomlevel;
            this.showAlert = true;
        },

        /**
         * Returns true when two coordinates contain the same values.
         * @param {Number[]|null} left - The first coordinate.
         * @param {Number[]|null} right - The second coordinate.
         * @returns {Boolean} True if both coordinates match.
         */
        areCoordinatesEqual (left, right) {
            return Array.isArray(left)
                && Array.isArray(right)
                && left.length === right.length
                && left.every((value, index) => value === right[index]);
        },

        /**
         * Returns a list of layer names.
         * @param {Object[]} list - list of layers object
         * @returns {Object[]} A list of objects with following format: {layerId: x, label: y}
         */
        getParsedLayerList (list) {
            if (!Array.isArray(list) || !list.length) {
                return [];
            }

            const layerNames = [];

            this.findAllObjectsByKeyValueDeep(list).forEach(layer => {
                if (typeof layer?.name !== "undefined") {
                    layerNames.push({layerId: layer.id, label: layer.name, level: layer.level, $isDisabled: layer.$isDisabled});
                }
            });

            return layerNames;
        },

        /**
         * Returns a list of layers objects.
         * @param {Object[]|Object} data the data to be checked if it is a layer or folder.
         * @param {Object[]} results the found results in array.
         * @param {Number} index the index of each data.
         * @returns {Object[]} A list of found results in array.
         */
        findAllObjectsByKeyValueDeep (data, results = [], index = 0) {
            if (!Array.isArray(data) && !isObject(data)) {
                return [];
            }

            if (Array.isArray(data)) {
                data.forEach(element => this.findAllObjectsByKeyValueDeep(element, results, index));
            }

            if (data?.type === "folder") {
                data.level = index;
                data.$isDisabled = true;
                results.push(data);
                this.findAllObjectsByKeyValueDeep(data.elements, results, index + 1);
            }
            else if (data?.type === "layer") {
                data.level = index;
                data.$isDisabled = false;
                results.push(data);
            }

            return results;
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
         * Handles content add/edit by writing it to the content array and closing the open editor.
         * @param {Object} content - the content to add or update, e.g., {type: "doc", content: {...}}
         * @returns {void}
         */
        handleContent (content) {
            if (Number.isInteger(this.openContentEditor.index) && this.openContentEditor.index < this.content.length) {
                const editIndex = this.openContentEditor.index,
                    currentItem = this.content[editIndex];

                if (currentItem) {
                    this.content.splice(editIndex, 1, content);
                }
            }
            else {
                this.content.push(content);
            }
            this.closeContentEditor();
        },
        /**
         * Resets the current chapter.
         * @returns {void}
         */
        resetCurrentChapter () {
            this.title = this.$t("additional:modules.storyCreator.chapter.title");
            this.content = [];
            this.coordinate = [];
            this.zoomlevel = "";
            this.confirmedCoordinate = [];
            this.confirmedZoomlevel = "";
            this.selectedLayer = [];
            this.selectedTool = "";
            this.closeContentEditor();
        },
        /**
         * Saves the chapter and returns to the overview page.
         * @returns {void}
         */
        saveChapter () {
            const chapter = {
                title: this.title.trim() !== "" ? this.title : this.$t("additional:modules.storyCreator.chapter.title"),
                map: {
                    center: [...this.confirmedCoordinate],
                    zoomLevel: this.confirmedZoomlevel,
                    layers: this.selectedLayer.map(layer => layer.layerId),
                    tool: this.selectedTool.toolId
                },
                content: this.content
            };

            this.$emit("save-chapter", chapter);
        },
        /**
         * Handles image add/edit by writing it to the content array and closing the open editor.
         * @param {Object} image - The image object containing id, alt, copyright, and objectURL.
         * @returns {void}
         */
        handleImage (image) {
            if (Number.isInteger(this.openContentEditor.index) && this.openContentEditor.index < this.content.length) {
                const editIndex = this.openContentEditor.index;

                this.content.splice(editIndex, 1, {
                    type: "image",
                    id: image.id,
                    attrs: {
                        alt: image.alt,
                        copyright: image.copyright
                    }
                });
            }
            else {
                this.content.push({
                    type: "image",
                    id: image.id,
                    attrs: {
                        alt: image.alt,
                        copyright: image.copyright
                    }
                });
            }
            this.closeContentEditor();
        },
        /**
         * Removes a content item and cleans up related resources.
         * @param {Number} index - The index of the content item to remove.
         * @returns {void}
         */
        removeContentItem (index) {
            const item = this.content[index];

            if (!item) {
                return;
            }

            this.content.splice(index, 1);
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
            this.coordinate = [...mapView.getCenter()];
        }

    }
};
</script>

<template lang="html">
    <div class="chapter">
        <h5>
            {{ $t("additional:modules.storyCreator.chapter.editChapter") }}
        </h5>
        <p>
            {{ $t('additional:modules.storyCreator.chapter.infoText') }}
        </p>
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
                <div v-if="confirmedCoordinate.length && confirmedZoomlevel !== ''">
                    {{ $t("additional:modules.storyCreator.chapter.currentPosition") }}
                </div>
                <div
                    v-if="confirmedCoordinate.length && confirmedZoomlevel !== ''"
                    class="p-2 d-flex flex-row align-center"
                >
                    <div class="p-1 fs-3">
                        <i class="bi bi-geo-alt-fill" />
                    </div>
                    <div class="ps-4 py-1 flex-grow-1">
                        <div class="label">
                            {{ Array.isArray(confirmedCoordinate) ? confirmedCoordinate.join(", ") : "" }}
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
                <label
                    for="layer-list"
                    class="form-label small text-muted"
                >
                    {{ $t('additional:modules.storyCreator.chapter.layerList') }}
                </label>
                <Multiselect
                    id="layer-list"
                    v-model="selectedLayer"
                    :placeholder="$t('additional:modules.storyCreator.chapter.layerListPlaceholder')"
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
                    :option-disabled="'disabled'"
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
                    <template #option="{ option }">
                        <div
                            :style="{
                                paddingLeft: `${option.level * 16}px`,
                                color: option.$isDisabled ? '#3C5F94' : '',
                                fontFamily: option.level === 0 ? 'MasterPortalFont Bold' : 'MasterPortalFont'
                            }"
                        >
                            {{ option.label }}
                        </div>
                    </template>
                </Multiselect>
            </div>
            <div class="row no-gutters mb-4">
                <label
                    for="tool-list"
                    class="form-label small text-muted"
                >
                    {{ $t('additional:modules.storyCreator.chapter.toolList') }}
                </label>
                <Multiselect
                    id="tool-list"
                    v-model="selectedTool"
                    :aria-label="$t('additional:modules.storyCreator.chapter.toolList')"
                    :multiple="false"
                    :options="toolList"
                    :show-labels="false"
                    :placeholder="$t('additional:modules.storyCreator.chapter.toolListPlaceholder')"
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
        <hr>
        <AccordionItem
            id="edit-chapter-content"
            icon="bi-list-ul"
            :is-open="true"
            :title="$t('additional:modules.storyCreator.chapter.addContent')"
        >
            <div class="chapter-title mt-4 mb-3 p-2 h5">
                <input
                    v-model="title"
                    class="w-100 bg-transparent border-0"
                    style="outline: none;"
                    :placeholder="$t('additional:modules.storyCreator.chapter.title')"
                    :aria-label="$t('additional:modules.storyCreator.chapter.title')"
                >
            </div>
            <Draggable
                v-model="content"
                item-key="id"
                class="no-list"
                handle=".drag-handle"
                :disabled="isContentEditorOpen"
            >
                <template #item="{ element, index }">
                    <div
                        class="chapter-content-item mb-2"
                        :class="{ 'chapter-content-item--editing': isEditingContentItem(index) }"
                    >
                        <div
                            v-if="element.type === 'image'"
                            class="chapter-content-item__wrapper"
                            :class="{'chapter-content-item--locked': isContentItemLocked(index)}"
                        >
                            <i
                                v-if="!isContentEditorOpen"
                                class="bi bi-grip-vertical drag-handle"
                                aria-hidden="true"
                            />
                            <StoryCreatorAddImageCard
                                v-if="isEditingContentItem(index)"
                                class="mt-2"
                                :create-image-asset="createImageAsset"
                                :image-assets-by-id="imageAssetsById"
                                :initial-image="{id: element.id, alt: element.attrs.alt, copyright: element.attrs.copyright}"
                                @addImage="handleImage"
                                @click:close="closeContentEditor"
                            />
                            <div
                                v-else
                                class="card rounded-3 border-0 p-4 position-relative chapter-content-item__preview"
                                :class="{'chapter-content-item--locked': isContentItemLocked(index), 'chapter-content-item--clickable': !isContentItemLocked(index)}"
                                role="button"
                                tabindex="0"
                                @click="openContentEditorForEdit(index, 'image')"
                                @keydown.enter="openContentEditorForEdit(index, 'image')"
                                @keydown.space.prevent="openContentEditorForEdit(index, 'image')"
                            >
                                <button
                                    type="button"
                                    class="btn-close position-absolute top-0 end-0 m-1 chapter-content-item__close"
                                    :aria-label="$t('common:button.close')"
                                    @click.stop="removeContentItem(index)"
                                />
                                <img
                                    :src="imageAssetsById[element.id]?.objectURL"
                                    :alt="element.attrs.alt"
                                    class="rounded w-100 d-block"
                                >
                                <div class="text-end mt-1 small">
                                    © {{ element?.attrs?.copyright }}
                                </div>
                            </div>
                        </div>
                        <div
                            v-else-if="element.type === 'doc'"
                            class="chapter-content-item__wrapper"
                        >
                            <i
                                v-if="!isContentEditorOpen"
                                class="bi bi-grip-vertical drag-handle"
                                aria-hidden="true"
                            />
                            <StoryCreatorAddTextCard
                                v-if="isEditingContentItem(index)"
                                class="mt-2"
                                :initial-content="element"
                                @click:close="closeContentEditor"
                                @addContent="handleContent"
                            />
                            <div
                                v-else
                                class="p-4 rounded-3 chapter-content-item__preview"
                                :class="{'chapter-content-item--locked': isContentItemLocked(index), 'chapter-content-item--clickable': !isContentItemLocked(index)}"
                                role="button"
                                tabindex="0"
                                @click="openContentEditorForEdit(index, 'text')"
                                @keydown.enter="openContentEditorForEdit(index, 'text')"
                                @keydown.space.prevent="openContentEditorForEdit(index, 'text')"
                            >
                                <button
                                    type="button"
                                    class="btn-close position-absolute top-0 end-0 m-2 chapter-content-item__close"
                                    :aria-label="$t('common:button.close')"
                                    @click.stop="removeContentItem(index)"
                                />
                                <div v-html="tipTapJsonToHtml(element)" />
                            </div>
                        </div>
                    </div>
                </template>
            </Draggable>
            <AddElementDropdown
                v-if="!isContentEditorOpen"
                class="mt-5"
                :allowed-actions="['text', 'image']"
                @action-triggered="openContentEditorForAdd"
            />
            <StoryCreatorAddTextCard
                v-else-if="isAddingContentType('text')"
                class="mt-2"
                @click:close="closeContentEditor"
                @addContent="handleContent"
            />
            <StoryCreatorAddImageCard
                v-else-if="isAddingContentType('image')"
                class="mt-2"
                :create-image-asset="createImageAsset"
                :image-assets-by-id="imageAssetsById"
                @addImage="handleImage"
                @click:close="closeContentEditor"
            />
        </AccordionItem>
        <div
            v-if="!isContentEditorOpen"
            class="d-flex flex-column align-items-center pt-3"
        >
            <hr class="w-100">
            <FlatButton
                id="save"
                class="mb-4"
                :icon="'bi-save'"
                :text="$t('additional:modules.storyCreator.chapter.save')"
                :title="$t('additional:modules.storyCreator.chapter.save')"
                :interaction="() => saveChapter()"
            />
            <FlatButton
                id="cancel"
                class="mb-4"
                :icon="'bi-x-lg'"
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

.chapter-content-item {
    position: relative;
}

.chapter-content-item__wrapper {
    position: relative;
    padding-left: 2rem;
}

.drag-handle {
    position: absolute;
    top: 1rem;
    left: 0;
    cursor: grab;
    color: #6c757d;
    font-size: 1.5rem;
    opacity: 0;
    transition: opacity 0.15s ease-in-out;
    padding: 0.25rem;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
}

.chapter-content-item__wrapper:hover .drag-handle {
    opacity: 1;
}

.drag-handle:active {
    cursor: grabbing;
    background-color: $primary;
    color: $dark_blue;
}

.chapter-content-item--locked {
    pointer-events: none;
    position: relative;
    filter: blur(1px);
}

.chapter-content-item--locked::after {
    content: "";
    position: absolute;
    inset: 0;
    background: rgba(255, 255, 255, 0.45);
    z-index: 1;
}

.chapter-content-item--clickable {
    cursor: pointer;

    &:hover {
        outline: 1px solid $light_grey;
    }
}

.chapter-content-item__preview {
    img {
        max-height: 40vh;
        object-fit: contain;
    }
}

.chapter-content-item__preview {
    .chapter-content-item__close {
        font-size: 0.75rem;
        width: 1rem;
        height: 1rem;
        opacity: 0;
        transition: opacity 0.15s ease-in-out;
    }
}

.chapter-content-item__preview:hover .chapter-content-item__close,
.chapter-content-item__preview:focus-within .chapter-content-item__close {
    opacity: 0.5;
}
</style>

<style lang="scss">

.chapter-content-item {
    strong, b {
        font-family: $font_family_accent;
    }

    p {
        font-size: $font-size-base;
    }

    p:empty {
        min-height: 1em;
    }

    p:empty::before {
        content: "\00a0";
    }

    h1, h2, h3, h4, h5, h6 {
        font-family: $font_family_accent;
        text-transform: unset;
        border: 0;
        color: $dark_grey;
        line-height: 1.1;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    h1 {
        font-size: 1.4rem;
    }

    h2 {
        font-size: 1.2rem;
    }

    h3 {
        font-size: 1.1rem;
    }
}

.chapter .multiselect__strong {
    font-family: $font_family_accent;
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
    font-family: $font_family_accent;
    color: $dark_grey;
    &:hover {
        outline-color: $light_grey;
        outline-width: 1px;
        outline-style: solid;
    }
    &:focus {
        outline: 1px solid $light_grey;
    }
}
</style>
