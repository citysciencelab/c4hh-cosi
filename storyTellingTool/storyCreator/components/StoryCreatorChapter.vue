<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AddElementDropdown from "../shared/modules/addElementDropdown/components/AddElementDropdown.vue";
import buildTreeStructure from "@appstore/js/buildTreeStructure.js";
import CookieBanner from "../../shared/cookiebanner/components/CookieBanner.vue";
import draggable from "vuedraggable";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {getAndMergeAllRawLayers} from "@appstore/js/getAndMergeRawLayer.js";
import {getDirectVideo, getEmbedLink} from "../../shared/utils/video.js";
import {getVisibleLayerList} from "../../shared/utils/layerHelper.js";
import isObject from "@shared/js/utils/isObject.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import {sort} from "@shared/js/utils/sort.js";
import store from "@appstore/index.js";
import StoryCreatorAddFeatureCard from "./StoryCreatorAddFeatureCard.vue";
import StoryCreatorAddImageCard from "./StoryCreatorAddImageCard.vue";
import StoryCreatorAddTextCard from "./StoryCreatorAddTextCard.vue";
import StoryCreatorAddVideoCard from "./StoryCreatorAddVideoCard.vue";
import tipTapJsonToHtml from "../shared/modules/tipTapEditor/js/tipTapJsonToHtml.js";
import Toast from "../../shared/toasts/components/ToastsElement.vue";

export default {
    name: "StoryCreatorChapter",
    components: {
        AccordionItem,
        AddElementDropdown,
        CookieBanner,
        Draggable: draggable,
        FlatButton,
        Multiselect,
        StoryCreatorAddFeatureCard,
        StoryCreatorAddImageCard,
        StoryCreatorAddTextCard,
        StoryCreatorAddVideoCard,
        Toast
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
        "cancel-chapter",
        "update:chapter-title"
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
            is3DLayerExisted: false,
            isCookieAllowed: document.cookie.split("; ").some(cookie => cookie.startsWith("username=storyvideo")),
            layerList: [],
            navigation3D: undefined,
            toolList: [],
            selectedLayers: [],
            selectedTool: "",
            showToast: false,
            title: this.$t("additional:modules.storyCreator.chapter.title")
        };
    },
    computed: {
        ...mapGetters(["addLayerButton", "allBaselayerConfigs", "allLayerConfigs", "configuredModules", "controlsConfig", "layerConfig", "layerConfigById", "visibleBaselayerConfigs"]),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Modules/StoryManager", ["enableVideo", "originalLayerConfig", "subjectLayerCategory", "toolStoryWhitelist"]),
        /**
         * Returns the allowed actions, if video is allowed, it will be added.
         * @returns {String[]} the allowed actions.
         */
        allowedActions () {
            if (this.enableVideo) {
                return ["text", "divider", "image", "feature", "video"];
            }

            return ["text", "divider", "image", "feature"];
        },
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
        },
        /**
         * Returns the currently visible baselayer with the highest zIndex.
         * @returns {Object|null} The active baselayer configuration or null.
         */
        activeVisibleBaselayer () {
            if (!Array.isArray(this.visibleBaselayerConfigs) || this.visibleBaselayerConfigs.length === 0) {
                return null;
            }

            let activeLayer = this.visibleBaselayerConfigs[0];

            for (const layer of this.visibleBaselayerConfigs) {
                if (layer.zIndex > activeLayer.zIndex) {
                    activeLayer = layer;
                }
            }

            return activeLayer;
        },
        /**
         * Reflects the currently active baselayer and activates a newly selected one.
         * @returns {Object|String} The active baselayer or an empty value.
         */
        selectedBaseLayer: {
            get () {
                return this.activeVisibleBaselayer || "";
            },
            set (layer) {
                if (!layer) {
                    return;
                }

                this.applyLayerVisibility(layer);
            }
        }
    },
    watch: {
        /**
         * Watches for the selected layers.
         * @param {Object[]} layers - The selected layer objects object in array.
         * @returns {void}
         */
        selectedLayers: {
            handler (val, oldVal) {
                if (this.mode === "3D" && Array.isArray(oldVal)) {
                    oldVal.forEach(layer => {
                        const layerConf = this.layerConfigById(layer.layerId);

                        if (layerConf?.is3DLayer) {
                            this.removeLayer(layerConf);
                        }
                    });
                }

                const layers = mapCollection.getMap("2D")?.getLayers();

                this.deactivateSubjectLayer(getVisibleLayerList(layers));

                if (!Array.isArray(val)) {
                    return;
                }

                val.forEach(layer => {
                    if (!layer?.layerId) {
                        return;
                    }

                    this.addOrReplaceLayer({
                        layerId: layer.layerId,
                        visibility: true
                    });
                });

                this.is3DLayerExisted = val.some(layer => this.layerConfigById(layer.layerId)?.is3DLayer);

                this.changeMapMode(this.is3DLayerExisted ? "3D" : "2D");
            },
            deep: true
        },
        /**
         * Emits the current chapter title whenever it changes so parents can update breadcrumb navigation.
         * @param {String} newVal - The new title value.
         * @returns {void}
         */
        title (newVal) {
            this.$emit("update:chapter-title", newVal);
        },
        /**
         * Automatically hides the info toast after 4 seconds.
         * @param {Boolean} newVal - The new value of showToast.
         * @returns {void}
         */
        showToast (newVal) {
            if (newVal) {
                setTimeout(() => {
                    this.showToast = false;
                }, 4000);
            }
        }
    },
    created () {
        if (typeof this.originalLayerConfig === "undefined") {
            this.setOriginalLayerConfig(JSON.parse(JSON.stringify(this.allLayerConfigs)));
        }
    },
    mounted () {
        const layers = mapCollection.getMap("2D")?.getLayers(),
              map = mapCollection.getMap("2D"),
              additionalLayers = this.allLayerConfigs.filter(
                  obj => !this.originalLayerConfig.some(item => item.id === obj.id)
              );

        if (this.mode === "3D") {
            this.changeMapMode("2D");
            this.setToNorth();
        }

        this.deactivateSubjectLayer(getVisibleLayerList(layers));

        this.layerList = this.getLayerList();
        this.toolList = this.getToolList(this.configuredModules);

        this.loadChapterData();

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

        additionalLayers.forEach(layer => {
            const layerConf = this.layerConfigById(layer.id);

            this.removeLayer(layerConf);
        });
    },
    beforeUnmount () {
        const map = mapCollection.getMap("2D");

        if (map) {
            map.un("moveend", this.updatePositionFromMap);
        }

        this.resetLayerConfig(this.selectedLayers);

        if (this.mode === "3D") {
            this.changeMapMode("2D");
            this.setToNorth();
        }
    },
    methods: {
        ...mapActions(["addOrReplaceLayer", "updateLayerConfigs"]),
        ...mapActions("Maps", ["changeMapMode"]),
        ...mapActions("Modules/LayerSelection", ["changeVisibility"]),
        ...mapActions("Modules/LayerTree", ["removeLayer"]),
        ...mapActions("Modules/StoryManager", ["removeLayerFromLayerConfig"]),
        ...mapMutations("Modules/StoryManager", ["setOriginalLayerConfig"]),
        ...mapMutations(["setLayerConfigByParentKey"]),

        getDirectVideo,
        getEmbedLink,
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
         * Deactivates current subject layers from tree and map.
         * @param {ol/layer[]} layers - The current visible layers.
         * @returns {void}
         */
        deactivateSubjectLayer (layers) {
            if (!Array.isArray(layers) || !layers.length) {
                return;
            }

            layers.forEach(layer => {
                const layerConf = this.layerConfigById(layer.get("id"));

                if (layerConf && !layerConf?.baselayer && !this.selectedLayers.some(sl => sl.layerId === layer.get("id"))) {
                    this.addOrReplaceLayer({
                        layerId: layer.get("id"),
                        visibility: false
                    });
                }
            });
        },
        /**
         * Opens a content add/edit component and stores context of the open editor.
         * @param {String} type - The editor type (e.g. "text" or "image").
         * @returns {void}
         */
        openContentEditorForAdd (type) {
            if (type === "divider") {
                this.content.push({
                    type: "divider"
                });
                return;
            }

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
            if (type === "feature") {
                const layerId = this.content[index].attrs?.layerId;

                if (!this.selectedLayers.some(layer => layer.layerId === layerId)) {
                    this.selectedLayers.push(...this.layerList.filter(layer => layer.layerId === layerId));
                }
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

            this.selectedLayers = Array.isArray(chapter.map.layers)
                ? this.layerList.filter(layer => chapter.map.layers.includes(layer.layerId))
                : [];

            if (Array.isArray(chapter.map.layers)) {
                chapter.map.layers.forEach(layerId => {
                    if (this.allBaselayerConfigs.some(layer => layer.id === layerId)) {
                        this.applyLayerVisibility({id: layerId});
                    }
                });
            }

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
            const rawLayers = this.controlsConfig?.button3d !== true ? getAndMergeAllRawLayers().filter(layer => !layer.is3DLayer) : getAndMergeAllRawLayers(),
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
            this.showToast = true;
            this.navigation3D = this.get3DParameter();
        },
        /**
         * Activates the selected layer by updating layer config visibility.
         * @param {Object} layer - The selected layer option.
         * @returns {void}
         */
        applyLayerVisibility (layer) {
            const layerId = layer?.id || layer?.layerId;

            if (!layerId) {
                return;
            }

            this.changeVisibility({
                layerId,
                value: true
            });
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
                const layerConf = this.layerConfigById(layer?.id);

                if (typeof layer?.name !== "undefined" && !layerConf?.baselayer) {
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
            const whitelist = Array.isArray(this.toolStoryWhitelist) ? this.toolStoryWhitelist : [];

            modules.forEach(val => {
                if (whitelist.length > 0 && !whitelist.includes(val?.type)) {
                    return;
                }
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
            this.selectedTool = "";
            this.closeContentEditor();
        },
        /**
         * Collects and returns the current chapter data without emitting.
         * Used by the parent via $refs for breadcrumb-based auto-save.
         * @returns {Object} The chapter data object.
         */
        collectChapterData () {
            const baseLayerId = this.selectedBaseLayer?.id,
                  subjectLayerIds = this.selectedLayers.map(layer => layer.layerId),
                  layers = baseLayerId ? [baseLayerId, ...subjectLayerIds] : subjectLayerIds;

            return {
                title: this.title.trim() !== "" ? this.title : this.$t("additional:modules.storyCreator.chapter.title"),
                map: {
                    center: [...this.confirmedCoordinate],
                    zoomLevel: this.confirmedZoomlevel,
                    layers,
                    tool: this.selectedTool.toolId
                },
                navigation3D: this.is3DLayerExisted ? this.navigation3D : undefined,
                content: this.content,
                is3D: this.is3DLayerExisted
            };
        },
        /**
         * Saves the chapter and returns to the overview page.
         * @returns {void}
         */
        saveChapter () {
            this.$emit("save-chapter", this.collectChapterData());
        },
        /**
         * Gets the 3d parameter for coordination and position.
         * @returns {Object} the parameter object.
         */
        get3DParameter () {
            if (!this.is3DLayerExisted) {
                return undefined;
            }

            const olCesium = mapCollection.getMap("3D"),
                  camera = olCesium?.scene_?.camera,
                  cartographic = Cesium?.Cartographic?.fromCartesian(camera?.position),
                  longitude = Cesium?.Math?.toDegrees(cartographic?.longitude),
                  latitude = Cesium?.Math?.toDegrees(cartographic?.latitude),
                  height = cartographic?.height,
                  heading = camera?.heading,
                  pitch = camera?.pitch,
                  roll = camera?.roll;

            return {
                cameraPosition: [longitude, latitude, height],
                heading: heading,
                pitch: pitch,
                roll: roll
            };
        },
        /**
         * Handles image add/edit by writing it to the content array and closing the open editor.
         * @param {Object} image - The image object containing id, alt, copyright, and objectURL.
         * @returns {void}
         */
        handleFeature (feature) {
            if (Number.isInteger(this.openContentEditor.index) && this.openContentEditor.index < this.content.length) {
                const editIndex = this.openContentEditor.index;

                this.content.splice(editIndex, 1, {
                    type: "feature",
                    attrs: feature
                });
            }
            else {
                this.content.push({
                    type: "feature",
                    attrs: feature
                });
            }

            this.closeContentEditor();
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
         * Handles video add/edit by writing it to the content array and closing the open editor.
         * @param {Object} videoObj - The video object containing link, title and freetext.
         * @returns {void}
         */
        handleVideo (videoObj) {
            if (Number.isInteger(this.openContentEditor.index) && this.openContentEditor.index < this.content.length) {
                const editIndex = this.openContentEditor.index;

                this.content.splice(editIndex, 1, {
                    type: "video",
                    attrs: videoObj
                });
            }
            else {
                this.content.push({
                    type: "video",
                    attrs: videoObj
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
         * Resets the layer config.
         * @returns {void}
         */
        resetLayerConfig () {
            this.selectedLayers.forEach(layer => {
                const layerConf = this.layerConfigById(layer.layerId);

                this.removeLayer(layerConf);

                this.$nextTick(() => {
                    if (!this.originalLayerConfig.some(orilayer => orilayer.id === layer.layerId)) {
                        this.removeLayerFromLayerConfig(layer.layerId);
                    }
                });
            });
            this.selectedLayers = [];

            if (!this.addLayerButton?.active) {
                this.updateLayerConfigs(this.originalLayerConfig);
            }
        },
        /**
         * Set the cookie if external video is enabled.
         * @returns {void}
         */
        setCookie () {
            const maxAge = 7 * 24 * 60 * 60;

            document.cookie = "username=storyvideo; max-age=" + maxAge + "; path=/";
            this.isCookieAllowed = true;
        },
        /**
         * Set the mapView to north.
         * @returns {void}
         */
        setToNorth () {
            mapCollection.getMapView("2D").animate({rotation: 0});
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

            if (this.showToast) {
                this.showToast = false;
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
                    class="mb-4"
                    icon="bi bi-play-circle"
                    :text="$t('additional:modules.storyCreator.chapter.mapPosition')"
                    :disabled="isButtonDisabled"
                    @click.native="getMapPosition()"
                />
                <div v-if="mode !== '3D' && confirmedCoordinate.length && confirmedZoomlevel !== ''">
                    {{ $t("additional:modules.storyCreator.chapter.currentPosition") }}
                </div>
                <div
                    v-if="mode !== '3D' && confirmedCoordinate.length && confirmedZoomlevel !== ''"
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
                <Toast
                    v-if="showToast"
                    type="info"
                    :text="$t('additional:modules.storyCreator.chapter.successAlert')"
                />
            </div>
            <div
                v-if="positionChanged"
                class="position-hint ps-3"
            >
                <i class="fs-4 bi bi-exclamation-circle pe-2" />
                {{ $t("additional:modules.storyCreator.chapter.positionChangedHint") }}
            </div>
            <div class="row no-gutters mb-4 mt-3">
                <label
                    for="base-layer-list"
                    class="form-label small text-muted"
                >
                    {{ $t('additional:modules.storyCreator.chapter.baseLayerList') }}
                </label>
                <Multiselect
                    id="base-layer-list"
                    v-model="selectedBaseLayer"
                    :aria-label="$t('additional:modules.storyCreator.chapter.baseLayerList')"
                    :multiple="false"
                    :options="allBaselayerConfigs"
                    :show-labels="false"
                    :placeholder="$t('additional:modules.storyCreator.chapter.baseLayerListPlaceholder')"
                    label="name"
                    track-by="id"
                    @select="applyLayerVisibility"
                />
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
                    v-model="selectedLayers"
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
            <div class="chapter-title mt-4 mb-3 px-2 py-0 rounded-3">
                <input
                    v-model.trim="title"
                    class="form-control-plaintext w-100 fs-5 outline-none-fallback"
                    :placeholder="$t('additional:modules.storyCreator.chapter.title')"
                    :aria-label="$t('additional:modules.storyCreator.chapter.title')"
                    @blur="title = title || $t('additional:modules.storyCreator.chapter.title')"
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
                                <div class="text-end mt-1">
                                    <small>© {{ element?.attrs?.copyright }}</small>
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
                        <div
                            v-else-if="element.type === 'divider'"
                            class="chapter-content-item__wrapper"
                        >
                            <i
                                v-if="!isContentEditorOpen"
                                class="bi bi-grip-vertical drag-handle"
                                aria-hidden="true"
                            />
                            <div
                                class="p-4 rounded-3 chapter-content-item__preview chapter-content-item--hoverable"
                            >
                                <button
                                    type="button"
                                    class="btn-close position-absolute top-0 end-0 m-2 chapter-content-item__close"
                                    :aria-label="$t('common:button.close')"
                                    @click.stop="removeContentItem(index)"
                                />
                                <hr class="my-0 me-4">
                            </div>
                        </div>
                        <div
                            v-else-if="element.type === 'feature'"
                            class="chapter-content-item__wrapper"
                        >
                            <i
                                v-if="!isContentEditorOpen"
                                class="bi bi-grip-vertical drag-handle"
                                aria-hidden="true"
                            />
                            <StoryCreatorAddFeatureCard
                                v-if="isEditingContentItem(index)"
                                class="mt-2"
                                :chapter-zoom-level="element?.attrs?.zoomlevel"
                                :initial-content="element"
                                :selected-layers="selectedLayers"
                                :create-image-asset="createImageAsset"
                                :image-assets-by-id="imageAssetsById"
                                @addFeature="handleFeature"
                                @click:close="closeContentEditor"
                            />
                            <div
                                v-else
                                class="p-4 rounded-3 chapter-content-item__preview"
                                :class="{'chapter-content-item--locked': isContentItemLocked(index), 'chapter-content-item--clickable': !isContentItemLocked(index)}"
                                role="button"
                                tabindex="0"
                                @click="openContentEditorForEdit(index, 'feature')"
                                @keydown.enter="openContentEditorForEdit(index, 'feature')"
                                @keydown.space.prevent="openContentEditorForEdit(index, 'feature')"
                            >
                                <button
                                    type="button"
                                    class="btn-close position-absolute top-0 end-0 m-2 chapter-content-item__close"
                                    :aria-label="$t('common:button.close')"
                                    @click.stop="removeContentItem(index)"
                                />
                                <FlatButton
                                    :id="'feature' + index"
                                    class="mb-3"
                                    :icon="'bi-geo-alt-fill'"
                                    :text="element.attrs.title"
                                    :title="element.attrs.title"
                                    :interaction="() => {}"
                                />
                            </div>
                        </div>
                        <div
                            v-if="element.type === 'video'"
                            class="chapter-content-item__wrapper"
                        >
                            <i
                                v-if="!isContentEditorOpen"
                                class="bi bi-grip-vertical drag-handle"
                                aria-hidden="true"
                            />
                            <StoryCreatorAddVideoCard
                                v-if="isEditingContentItem(index)"
                                class="mt-2"
                                :initial-content="element"
                                @addVideo="handleVideo"
                                @click:close="closeContentEditor"
                            />
                            <div
                                v-else
                                class="card rounded-3 border-0 p-4 position-relative chapter-content-item__preview"
                                :class="{'chapter-content-item--locked': isContentItemLocked(index), 'chapter-content-item--clickable': !isContentItemLocked(index)}"
                                role="button"
                                tabindex="0"
                                @click="openContentEditorForEdit(index, 'video')"
                                @keydown.enter="openContentEditorForEdit(index, 'video')"
                                @keydown.space.prevent="openContentEditorForEdit(index, 'video')"
                            >
                                <button
                                    type="button"
                                    class="btn-close position-absolute top-0 end-0 m-1 chapter-content-item__close"
                                    :aria-label="$t('common:button.close')"
                                    @click.stop="removeContentItem(index)"
                                />
                                <div v-if="getDirectVideo(element?.attrs?.link).length">
                                    <video
                                        width="100%"
                                        height="auto"
                                        controls
                                        :aria-label="element?.attrs?.accessibleText"
                                    >
                                        <source
                                            :src="element?.attrs?.link"
                                            :type="getDirectVideo(element?.attrs?.link)[0]?.content"
                                        >
                                        <track
                                            kind="captions"
                                            src=""
                                            srclang="de"
                                            label="German"
                                            default
                                        >
                                    </video>
                                </div>
                                <div
                                    v-else
                                    class="video-container"
                                >
                                    <iframe
                                        v-if="isCookieAllowed"
                                        width="100%"
                                        height="100%"
                                        allow="autoplay"
                                        :src="getEmbedLink(element?.attrs?.link)"
                                        :title="element?.attrs?.title"
                                    />
                                    <CookieBanner
                                        v-if="!isCookieAllowed"
                                        :source="getEmbedLink(element?.attrs?.link)"
                                        @setCookie="setCookie"
                                    />
                                </div>
                                <div
                                    v-if="isCookieAllowed"
                                    class="mt-1 small"
                                >
                                    {{ element?.attrs?.title }}
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </Draggable>
            <AddElementDropdown
                v-if="!isContentEditorOpen"
                class="mt-5"
                :allowed-actions="allowedActions"
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
            <StoryCreatorAddFeatureCard
                v-else-if="isAddingContentType('feature')"
                class="mt-2"
                :chapter-zoom-level="confirmedZoomlevel"
                :selected-layers="selectedLayers"
                :create-image-asset="createImageAsset"
                :image-assets-by-id="imageAssetsById"
                @addFeature="handleFeature"
                @click:close="closeContentEditor"
            />
            <StoryCreatorAddVideoCard
                v-else-if="isAddingContentType('video')"
                class="mt-2"
                @addVideo="handleVideo"
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
                class="my-4"
                :icon="'bi-save'"
                :text="$t('additional:modules.storyCreator.chapter.save')"
                :title="$t('additional:modules.storyCreator.chapter.save')"
                :interaction="() => saveChapter()"
            />
            <FlatButton
                id="cancel"
                class="mb-4"
                :icon="'bi-x-lg'"
                :text="editIndex === false ? $t('additional:modules.storyCreator.chapter.cancelNew') : $t('additional:modules.storyCreator.chapter.cancelEdit')"
                :secondary="true"
                :interaction="() => cancelChapter()"
            />
        </div>
    </div>
</template>
<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>
.chapter-hint-area {
    min-height: 2.5rem;
    display: flex;
    align-items: center;
    margin-bottom: 0.5rem;
}

.chapter-success-alert {
    background-color: $secondary;
    color: $white;
    border-radius: 0.25rem;
    width: 100%;
}

.hint-fade-enter-active {
    transition: opacity 0.4s ease;
}

.hint-fade-leave-active {
    transition: opacity 1s ease;
}

.hint-fade-enter-from,
.hint-fade-leave-to {
    opacity: 0;
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

.chapter-content-item--hoverable:hover {
    outline: 1px solid $light_grey;
}
.chapter-content-item__wrapper:has(.chapter-content-item--hoverable) {
    .drag-handle {
        top: 50%;
        transform: translateY(-50%);
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
    background: $secondary;
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
    color: $white;
}

.map-position {
    i.bi-geo-alt-fill {
        color: $secondary;
    }
}

.chapter-title {
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

.video-container {
    position: relative;
    width: 100%;
    max-width: 800px;
    aspect-ratio: 16 / 9;
}

.video-container iframe {
    width: 100%;
    height: 100%;
    border: none;
}
</style>
