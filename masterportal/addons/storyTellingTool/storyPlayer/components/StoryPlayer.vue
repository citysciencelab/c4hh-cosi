<script>
import AlertMessage from "../../../cosi/shared/modules/alerts/components/AlertMessage.vue";
import axios from "axios";
import {boundingExtent} from "ol/extent.js";
import CookieBanner from "../../shared/cookiebanner/components/CookieBanner.vue";
import {extractStoryZip} from "../../storyManager/shared/js/storyZipCreator.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {getAndMergeAllRawLayers} from "@appstore/js/getAndMergeRawLayer.js";
import {getDirectVideo, getEmbedLink} from "../../shared/utils/video.js";
import {getVisibleLayerList} from "../../shared/utils/layerHelper.js";
import LayerGroup from "ol/layer/Group.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Overlay from "ol/Overlay.js";
import StoryPlayerFeature from "./StoryPlayerFeature.vue";
import StoryPlayerToolbar from "./StoryPlayerToolbar.vue";
import tipTapJsonToHtml from "../../storyCreator/shared/modules/tipTapEditor/js/tipTapJsonToHtml";

export default {
    name: "StoryPlayer",
    components: {
        AlertMessage,
        CookieBanner,
        FlatButton,
        IconButton,
        StoryPlayerFeature,
        StoryPlayerToolbar
    },
    data () {
        return {
            currentIndex: -1,
            currentChapterIndex: 0,
            featureAttributes: null,
            interval: null,
            isHovering: null,
            isChangeFrom3D: false,
            isCookieAllowed: document.cookie.split("; ").some(cookie => cookie.startsWith("username=storyvideo")),
            loadedContent: null,
            overlay: null,
            scroller: null,
            showImportWarning3D: [],
            showMode: "",
            showStickyHeader: false,
            toolBodyScrollTop: 0
        };
    },
    computed: {
        ...mapGetters("Modules/ShareView", ["url"]),
        ...mapGetters("Modules/StoryPlayer", [
            "currentStoryName",
            "description",
            "duration",
            "fixedStoryName",
            "fixedStoryPath",
            "icon",
            "id",
            "imageAssetsById",
            "mode",
            "name",
            "originalLayerConfig",
            "type",
            "storyPlayerMenuSide",
            "storyConf",
            "supportedDevices",
            "supportedMapModes"
        ]),
        ...mapGetters([
            "addLayerButton",
            "allLayerConfigs",
            "controlsConfig",
            "layerConfig",
            "layerConfigById",
            "layerConfigsByAttributes",
            "visibleBaselayerConfigs"
        ]),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Menu", [
            "mainMenu",
            "secondaryMenu",
            "expanded"
        ]),
        /**
         * The current selected chapter of the story.
         * @returns {Object} current chapter
         */
        currentChapter () {
            if (!this.storyConf || !Array.isArray(this.storyConf.chapters) || this.currentChapterIndex < 0) {
                return null;
            }
            return this.storyConf.chapters[this.currentChapterIndex];
        },
        /**
         * The URL of the cover image.
         * @returns {String} the URL of the cover image
         */
        coverImagePath () {
            return this.imageAssetsById?.[this.storyConf.imageSrc]?.objectURL || "";
        }
    },
    watch: {
        /**
         * Reloads the story when the currentStoryName changes.
         * This happens when the portal is opened via a shared URL that encodes a specific story.
         * @param {String} newName the new story name
         * @returns {void}
         */
        async currentStoryName (newName) {
            if (newName && newName !== this.fixedStoryName) {
                await this.getFixedStoryList(this.fixedStoryPath, newName);
                this.currentIndex = -1;
                this.currentChapterIndex = 0;
                await this.$nextTick();
                this.scrollerSetup();
            }
        },
        /**
         * Handles step changes.
         * @returns {void}
         */
        currentChapterIndex () {
            this.deactivateSubjectLayer();
            this.loadChapter();
            this.removePointMarker();
            mapCollection.getMap("2D").removeOverlay(this.overlay);
        }
    },
    created () {
        if (typeof this.originalLayerConfig === "undefined") {
            this.setOriginalLayerConfig(JSON.parse(JSON.stringify(this.allLayerConfigs)));
        }
    },
    async mounted () {
        if (!Object.keys(this.storyConf).length) {
            const storyName = this.currentStoryName || this.fixedStoryName;

            await this.getFixedStoryList(this.fixedStoryPath, storyName);
        }
        this.toolBodyScrollTop = 0;

        await this.$nextTick();
        this.scrollerSetup();

        const toolBody = document.getElementById("mp-body-secondaryMenu"),
              coverCard = this.$refs.coverCard;

        if (toolBody) {
            toolBody.addEventListener("scroll", this.handleToolBodyScroll);
            toolBody.scrollTop = this.toolBodyScrollTop;
        }

        if (coverCard) {
            this.coverCardObserver = new IntersectionObserver(([entry]) => {
                this.showStickyHeader = !entry.isIntersecting;
            }, {threshold: 0}
            );
            this.coverCardObserver.observe(coverCard);
        }
        this.deactivateSubjectLayer();
    },
    beforeUnmount () {
        if (this.coverCardObserver) {
            this.coverCardObserver.disconnect();
        }
        // Disconnect previous observer if exists
        if (this._stepObserver) {
            this._stepObserver.disconnect();
        }
        this._detectActiveStep = null;
        // Remove scroll event listener
        const toolBody = document.getElementById("mp-body-secondaryMenu");

        this.$nextTick(() => {
            this.currentIndex = -1;
            this.currentChapterIndex = 0;
            this.toolBodyScrollTop = 0;
        });

        // Remove scroll event listener
        if (toolBody) {
            toolBody.removeEventListener("scroll", this.handleToolBodyScroll);

            toolBody.scrollTop = 0;
        }

        this.deactivateSubjectLayer();

        if (!this.addLayerButton?.active) {
            this.updateLayerConfigs(this.originalLayerConfig);
        }
        else {
            this.allLayerConfigs.forEach(each => {
                if (!this.originalLayerConfig.some(oriLayer => oriLayer.id === each.id)) {
                    this.removeLayerFromLayerConfig(each.id);
                }
            });
        }

        this.deactivateTool();
        this.closePopup();
        this.setToNorth();
    },
    methods: {
        ...mapMutations("Modules/StoryPlayer", [
            "setCurrentStoryName",
            "setImageAssetsById",
            "setSupportedDevices",
            "setSupportedMapModes",
            "setType",
            "setId",
            "setName",
            "setDescription",
            "setIcon",
            "setOriginalLayerConfig",
            "setStoryConf",
            "setMode"
        ]),
        ...mapMutations("Menu", ["setExpandedBySide"]),
        ...mapMutations(["setLayerConfigByParentKey"]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/LayerTree", ["removeLayer"]),
        ...mapActions("Maps", ["changeMapMode", "placingPointMarker", "removePointMarker", "zoomToExtent"]),
        ...mapActions(["addLayerToLayerConfig", "addOrReplaceLayer", "replaceByIdInLayerConfig", "updateLayerConfigs"]),
        ...mapActions("Modules/StoryManager", ["removeLayerFromLayerConfig"]),
        ...mapActions("Menu", ["changeCurrentComponent", "resetMenu"]),

        getDirectVideo,
        getEmbedLink,
        tipTapJsonToHtml,
        handleToolBodyScroll (event) {
            this.toolBodyScrollTop = event.target.scrollTop;
            // When scrolled all the way to the top, deactivate all chapters.
            if (event.target.scrollTop === 0 && this.currentIndex >= 0) {
                document.querySelectorAll("#story-player .stepper").forEach(s => s.classList.remove("active"));
                this.currentIndex = -1;
                this.deactivateTool();
                this.deactivateSubjectLayer();
                this.closePopup();
                this.changeMapMode("2D");
                this.setToNorth();
                return;
            }
            if (this._detectActiveStep) {
                this._detectActiveStep();
            }
        },
        /**
         * Activates a tool
         * @param {String} toolId the id of the tool to activate
         * @returns {void}
         */
        activateTool (toolId) {
            const toolMenuSide = this.storyPlayerMenuSide === "mainMenu" ? "secondaryMenu" : "mainMenu",
                  toolKey = toolId.charAt(0).toUpperCase() + toolId.slice(1),
                  module = this.$store.state.Modules && this.$store.state.Modules[toolKey],
                  name = module && module.name ? module.name : toolKey;

            this.setExpandedBySide({expanded: true, side: toolMenuSide});
            this.changeCurrentComponent({type: toolId, side: toolMenuSide, props: {name}});
        },
        /**
         * Closes the popup overlay and remove the point marker.
         * @returns {void}
         */
        closePopup () {
            this.removePointMarker();
            mapCollection.getMap("2D").removeOverlay(this.overlay);
        },
        /**
         * Deactivates current subject layers from tree and map.
         * @returns {void}
         */
        deactivateSubjectLayer () {
            const layers = mapCollection.getMap("2D")?.getLayers(),
                  baselayerId = this.visibleBaselayerConfigs[0]?.id,
                  visibleLayerList = getVisibleLayerList(layers, baselayerId),
                  groupLayers = this.layerConfigsByAttributes({typ: "GROUP"});

            visibleLayerList.forEach(layer => {
                if (!this.addLayerButton.active) {
                    if (layer instanceof LayerGroup) {
                        const childrenId = layer.getSource().map(childLayer => childLayer.get("id"));

                        groupLayers.forEach(groupLayer => {
                            if (groupLayer?.children.some(childlayer => childrenId.includes(childlayer.id))) {
                                this.addOrReplaceLayer({
                                    layerId: groupLayer.id,
                                    visibility: false
                                });
                            }
                        });
                    }
                    else {
                        this.addOrReplaceLayer({
                            layerId: layer.get("id"),
                            visibility: false
                        });
                    }
                }
                else {
                    const layerConf = this.layerConfigById(layer.get("id"));

                    this.removeLayer(layerConf);
                }
            });

            this.allLayerConfigs.forEach(each => {
                if (!this.originalLayerConfig.some(oriLayer => oriLayer.id === each.id)) {
                    this.replaceByIdInLayerConfig({
                        layerId: each.id,
                        visibility: false,
                        showInLayerTree: false
                    });
                    this.removeLayer(each);
                }
            });
        },
        /**
         * Deactivates a tool on the opposite menu side of where the storyPlayer is located
         * @returns {void}
         */
        deactivateTool () {
            const toolMenuSide = this.storyPlayerMenuSide === "mainMenu" ? "secondaryMenu" : "mainMenu";

            this.setExpandedBySide({expanded: false, side: toolMenuSide});

            this.resetMenu(toolMenuSide);
        },
        /**
         * Sets the fixed story list.
         * @param {String} storyPath - the relative path in portalconfigs to contain fixed stories.
         * @param {String} name - the fixed story file name.
         * @returns {Promise<void>}.
         */
        async getFixedStoryList (storyPath, name) {
            if (typeof storyPath !== "string" || typeof name !== "string") {
                return;
            }

            try {
                const response = await axios.get(`${storyPath}/${name}.zip`, {
                    responseType: "blob"
                });

                try {
                    const {storyJson, imageAssetsById} = await extractStoryZip(response.data);

                    this.setStoryConf(storyJson);
                    this.setImageAssetsById(imageAssetsById);
                    this.setCurrentStoryName(name);
                }
                catch (error) {
                    console.warn(
                        `Zip file at ${storyPath} could not be loaded. Please check that it is a valid zip file.`
                    );
                }
            }
            catch (e) {
                console.warn(
                    `Zip file at ${storyPath} could not be loaded. Please check that it is a valid zip file.`
                );
            }
        },
        /**
         * Enables a layer or group layer on the map
         * @param {StringString[]} id the layer id(s) to enable
         * @returns {void}
         */
        async enableLayer (id) {
            if (typeof id !== "string" && (!Array.isArray(id) || !id.length)) {
                return;
            }

            const layerIds = typeof id === "string" ? [id] : id;

            await Promise.all(
                layerIds.map(async (layerId) => {
                    let layerConf = this.layerConfigById(layerId);

                    if (!layerConf) {
                        const groupLayers = this.layerConfigsByAttributes({typ: "GROUP"});

                        if (groupLayers.length) {
                            groupLayers.forEach(groupLayer => {
                                if (groupLayer?.children.some(layer => layer.id === layerId)) {
                                    this.addOrReplaceLayer({
                                        layerId: groupLayer.id,
                                        visibility: true,
                                        showInLayerTree: true
                                    });
                                }
                            });
                        }
                        else {
                            layerConf = getAndMergeAllRawLayers().find(layer => layer.id === layerId);

                            if (layerConf) {
                                this.addLayerToLayerConfig({layerConfig: layerConf});
                            }
                        }
                    }

                    if (layerConf) {
                        this.addOrReplaceLayer({
                            layerId: layerId,
                            visibility: true,
                            showInLayerTree: true
                        });
                    }
                })
            );
        },
        /**
         * Sets up the tool window and content for the selected chapter.
         * @returns {void}
         */
        async loadChapter () {
            if (!this.currentChapter) {
                return;
            }

            // Updates the tool width
            if (this.currentChapter.stepWidth) {
                this.setInitialWidth(this.currentChapter.stepWidth);
            }

            if (this.currentChapter.is3D && this.controlsConfig?.button3d !== true) {
                this.showImportWarning3D[this.currentChapterIndex] = true;
                return;
            }

            if (this.currentChapter.is3D && this.mode === "2D") {
                this.changeMapMode("3D");
            }

            // Toggles 3D map mode
            if (this.currentChapter.is3D && this.mode === "2D") {
                this.changeMapMode("3D");
            }
            else if (!this.currentChapter.is3D && this.mode === "3D") {
                this.isChangeFrom3D = true;
                this.changeMapMode("2D");
                this.setToNorth();
            }

            // Updates the map center and zoom level for 2D
            if (this.currentChapter.map?.center && this.currentChapter.map.center.length > 0) {
                if (this.currentChapter.is3D) {
                    console.warn("Don't use centerCoordinate for 3D navigation.");
                }
                else {
                    const map = mapCollection.getMap("2D"),
                          mapView = typeof map?.getView === "function" ? map.getView() : undefined,
                          zoomLevel = this.currentChapter.map.zoomLevel;

                    if (mapView) {
                        setTimeout(() => {
                            const adjustedCenter = this.getCenterOfVisibleMap();

                            mapView.animate({
                                center: adjustedCenter,
                                zoom: zoomLevel,
                                duration: this.duration,
                                rotation: 0
                            });

                            this.isChangeFrom3D = false;

                        }, this.isChangeFrom3D ? 1500 : 0);
                    }
                }
            }

            // Updates the map center for 3D
            if (this.currentChapter.navigation3D
                && Object.prototype.hasOwnProperty.call(this.currentChapter.navigation3D, "cameraPosition")
                && this.currentChapter.navigation3D.cameraPosition[0] !== null) {
                const camera = mapCollection.getMap("3D").getCesiumScene().camera,
                      postion = this.currentChapter.navigation3D.cameraPosition;

                camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(postion[0], postion[1], postion[2]),
                    orientation: {
                        heading: this.currentChapter.navigation3D.heading,
                        pitch: this.currentChapter.navigation3D.pitch,
                        roll: this.currentChapter.navigation3D.roll
                    },
                    easingFunction: Cesium.EasingFunction.QUADRATIC_OUT,
                    duration: this.duration / 1000
                });
            }

            // Updates the map layers
            this.currentChapter?.map?.layers.forEach(layer => this.enableLayer(layer));

            if (!this.currentChapter.is3D) {
                this.deactivateTool();
                if (this.currentChapter.map?.tool) {
                    this.activateTool(this.currentChapter.map.tool);
                }
                this.setToNorth();
            }
        },
        /**
         * Determines the center position on the visible part of the map.
         *
         * @param {Array} centerCoordinate - The initial center position of the map.
         * @returns {Array} shiftedCoordinate The adjusted center position so that the set center coordinates
         *  are centered within the visible part of the map.
         */
        getCenterOfVisibleMap () {
            const map = mapCollection.getMap("2D"),
                  mapView = map?.getView(),
                  projection = mapView?.getProjection();

            if (projection && projection.getUnits() === "degrees") {
                return this.currentChapter.map.center;
            }

            const zoomLevel = this.currentChapter.map.zoomLevel,
                  targetResolution = mapView?.getResolutionForZoom(zoomLevel),
                  rightPadding = this.expanded("secondaryMenu")
                      ? document.getElementById("mp-menu-secondaryMenu").offsetWidth
                      : 20,
                  leftPadding = this.expanded("mainMenu")
                      ? document.getElementById("mp-menu-mainMenu").offsetWidth
                      : 20,
                  offsetPixels = (rightPadding - leftPadding) / 2,
                  center = this.currentChapter.map.center;


            const offsetX = offsetPixels * targetResolution;

            return [center[0] + offsetX, center[1]];
        },

        /**
         * Navigates to the previous step
         * @returns {void}
         */
        goToPreviousStep () {
            if (this.currentChapterIndex > 0) {
                this.currentChapterIndex -= 1;
                this.scrollToActiveStep();
                this.removePointMarker();
                mapCollection.getMap("2D").removeOverlay(this.overlay);
            }
        },
        /**
         * Navigates to the next step
         * @returns {void}
         */
        goToNextStep () {
            if (this.currentChapterIndex < this.storyConf.chapters.length - 1) {
                this.currentChapterIndex += 1;
                this.scrollToActiveStep();
                this.removePointMarker();
                mapCollection.getMap("2D").removeOverlay(this.overlay);
            }
        },
        /**
         * Opens the popup window to show the feature atrributes.
         * @param {Object} val the attributes of the feature.
         * @returns {void}
         */
        openFeaturePopup (val) {
            if (!isObject(val)) {
                return;
            }

            this.placingPointMarker(val?.coordinate);
            this.zoomToExtent({extent: boundingExtent([val?.coordinate]), options: {maxZoom: typeof val?.zoomlevel === "number" ? val?.zoomlevel : mapCollection.getMapView("2D").getZoom()}});
            this.featureAttributes = val;
            this.overlay = new Overlay({
                element: this.$refs.storyPlayerFeature,
                positioning: "center-right",
                offset: [-30, -20]
            });

            mapCollection.getMap("2D").addOverlay(this.overlay);
            this.overlay.setPosition(val?.coordinate);
        },
        /**
         * Scrolls the step into view
         * @returns {void}
         */
        scrollToActiveStep () {
            this.$nextTick(() => {
                const stepElements = Array.isArray(this.$refs.stepper) ? this.$refs.stepper : [this.$refs.stepper];

                if (stepElements && stepElements[this.currentChapterIndex]) {
                    stepElements[this.currentChapterIndex].scrollIntoView({behavior: "smooth", block: "center"});
                }
            });
        },
        scrollerSetup () {
            const stepElements = Array.from(document.querySelectorAll("#story-player .stepper"));

            if (stepElements.length === 0) {
                return;
            }

            // Disconnect previous observer if exists
            if (this._stepObserver) {
                this._stepObserver.disconnect();
            }

            // Remove all active classes
            stepElements.forEach(step => {
                if (step && step.classList) {
                    step.classList.remove("active");
                }
            });
            // Use a range of thresholds for smoother detection
            // thresholds control how often the observer fires as visibility changes
            // threshold: 0 — fires as soon as any part of the element is visible.
            // threshold: 1 — fires only when the entire element is visible.
            // threshold: [0, 0.1, 0.2, ..., 1] — fires at every 10% increment of visibility
            const thresholds = Array.from({length: 21}, (_, i) => i * 0.05); // [0, 0.05, ..., 1]

            // Track intersection ratios for each step
            // intersectionRatios tell you how much of each observed element is currently visible,
            // so it can be decided which one is “active”.
            const intersectionRatios = new Array(stepElements.length).fill(0),
                  applyActiveStep = (activeIndex) => {
                      const step = stepElements[activeIndex];

                      if (!step || !step.classList) {
                          return;
                      }

                      stepElements.forEach(s => s.classList.remove("active"));
                      step.classList.add("active");

                      if (this.currentIndex !== activeIndex) {
                          const prevChapterIndex = this.currentChapterIndex;

                          this.currentIndex = activeIndex;
                          this.currentChapterIndex = activeIndex;

                          // If currentChapterIndex didn't change (e.g. chapter 0 which is
                          // also the initial value), the watcher won't fire.
                          // Trigger tools/layers/position manually in that case.
                          if (prevChapterIndex === activeIndex) {
                              this.deactivateSubjectLayer();
                              this.loadChapter();
                              this.removePointMarker();
                              mapCollection.getMap("2D").removeOverlay(this.overlay);
                          }
                          // else: watcher on currentChapterIndex handles it.

                          // Handle iframe aspect ratio and progress
                          const iframeElement = step.querySelector("iframe"),
                                iframeDiv = step.getElementsByClassName("field_video")[0];

                          if (iframeElement && iframeDiv) {
                              const ratioClass = this.getIframeAspectRatio(iframeElement);

                              iframeDiv.classList.add("ratio", ratioClass);
                          }
                      }
                  };

            const scroller = document.getElementById("mp-body-secondaryMenu");

            // Shared detection logic — stored on the instance so handleToolBodyScroll
            // can also call it when the IntersectionObserver doesn't fire (e.g. when
            // all short chapters are fully visible at the same time).
            this._detectActiveStep = () => {
                const scrollerRect = scroller.getBoundingClientRect(),
                      viewportCenter = scrollerRect.top + scrollerRect.height / 2;

                let activeIndex = -1,
                    minDistance = Infinity;

                stepElements.forEach((step, idx) => {
                    const rect = step.getBoundingClientRect();

                    if (rect.bottom < scrollerRect.top || rect.top > scrollerRect.bottom) {
                        return;
                    }

                    const center = rect.top + rect.height / 2;
                    const distance = Math.abs(center - viewportCenter);

                    if (distance < minDistance) {
                        minDistance = distance;
                        activeIndex = idx;
                    }
                });

                const isNearCenter = minDistance <= scrollerRect.height / 2;

                if (activeIndex !== -1 && isNearCenter && activeIndex !== this.currentIndex) {
                    applyActiveStep(activeIndex);
                }
            };

            this._stepObserver = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        const idx = stepElements.indexOf(entry.target);

                        if (idx !== -1) {
                            intersectionRatios[idx] = entry.isIntersecting ? entry.intersectionRatio : 0;
                        }
                    });

                    this._detectActiveStep();
                },
                {
                    root: scroller,
                    threshold: thresholds
                }
            );

            // Observe each step element
            stepElements.forEach(step => this._stepObserver.observe(step));
        },

        /**
         * Scrolls the secondary menu to the top.
         * @returns {void}
         */
        scrollToTop () {
            const secondaryMenu = document.getElementById("mp-body-secondaryMenu");

            if (secondaryMenu) {
                secondaryMenu.scrollTo({top: 0, behavior: "smooth"});
            }
        },

        /**
         * Set the mapView to north.
         * @returns {void}
         */
        setToNorth () {
            mapCollection.getMapView("2D").animate({rotation: 0});
        },

        /**
         * Set the cookie if external video is enabled.
         * @returns {void}
         */
        setCookie () {
            const maxAge = 7 * 24 * 60 * 60;

            document.cookie = "username=storyvideo; max-age=" + maxAge + "; path=/";
            this.isCookieAllowed = true;
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="storyConf !== undefined && storyConf.chapters"
        id="story-player"
    >
        <div
            v-if="showStickyHeader"
            class="sticky-top bg-white border-bottom shadow-sm py-3 px-3 d-flex flex-row align-items-center gap-2"
        >
            <div class="d-flex flex-column gap-1 flex-grow-1">
                <h4 class="sticky-title mb-0">
                    {{ storyConf.title }}
                </h4>
                <span class="number-of-chapters">
                    {{ $t('additional:modules.storyPlayer.numberOfChapters', { current: currentChapterIndex + 1, total: storyConf.chapters.length }) }}
                </span>
            </div>
            <div class="d-flex flex-column justify-content-end align-items-center gap-2">
                <StoryPlayerToolbar />
            </div>
        </div>
        <div
            class="d-flex w-100 flex-column player"
        >
            <div
                ref="coverCard"
                class="card cover-card mb-5 border-0 shadow-sm rounded-3 d-flex flex-column"
                :class="{
                    'has-image justify-content-start': coverImagePath && coverImagePath.length,
                    'justify-content-center': !coverImagePath || !coverImagePath.length
                }"
            >
                <div class="d-flex justify-content-end align-items-center gap-2 mb-2">
                    <StoryPlayerToolbar />
                </div>
                <img
                    v-if="coverImagePath && coverImagePath.length"
                    :src="coverImagePath"
                    class="cover-image rounded-3"
                    :alt="storyConf.coverImageAlt"
                >
                <div class="text-end">
                    <small
                        v-if="storyConf.imageCopyright"
                        class="text-muted me-2 mt-1"
                    >
                        &copy; {{ storyConf.imageCopyright }}
                    </small>
                </div>
                <div class="card-body p-4 p-md-5 d-flex flex-column justify-content-center align-items-start text-start">
                    <h4
                        v-if="storyConf.title"
                        class="story-title fw-black mb-4"
                    >
                        {{ storyConf.title }}
                    </h4>
                    <div
                        class="d-flex align-items-center justify-content-between w-100 mb-2"
                    >
                        <div
                            class="d-flex align-items-center gap-2 author-block"
                        >
                            <i
                                v-if="storyConf.author"
                                class="bi bi-person-circle fs-4 me-1"
                            />
                            <div class="d-flex flex-column justify-content-center">
                                <small
                                    class="author-name"
                                >
                                    {{ storyConf.author }}
                                </small>
                                <small
                                    class="created text-muted"
                                >
                                    {{ storyConf.created }}
                                </small>
                            </div>
                        </div>
                    </div>
                    <p
                        v-if="storyConf.description"
                        class="card-text mt-3"
                    >
                        {{ storyConf.description }}
                    </p>
                </div>
            </div>

            <div
                class="storyTitle"
                tabindex="0"
            >
                <div
                    v-for="(chapter, index) in storyConf.chapters"
                    :key="chapter.title + index"
                >
                    <div
                        v-if="index === currentChapterIndex && index > 0"
                        class="d-flex justify-content-center mb-3 py-2"
                    >
                        <IconButton
                            class="btn-light"
                            :class-array="['chevron']"
                            :aria="$t('additional:modules.storyPlayer.goToPrevStep')"
                            icon="bi bi-chevron-up"
                            :title="$t('additional:modules.storyPlayer.goToPrevStep')"
                            :interaction="() => goToPreviousStep()"
                        />
                    </div>
                    <div
                        class="card mb-4 stepper mx-4 rounded"
                        :class="{
                            firstStep: index === 0,
                            lastStep: index === storyConf.chapters.length - 1,
                            active: index === currentChapterIndex && currentIndex >= 0
                        }"
                    >
                        <div
                            ref="stepper"
                            class="card-body"
                        >
                            <h5
                                v-if="chapter.title"
                                class="card-title px-3 pb-3"
                            >
                                {{ chapter.title }}
                            </h5>
                            <div class="story-player-content card-text px-3">
                                <div
                                    v-for="(item, itemIndex) in chapter.content"
                                    :key="'content-' + itemIndex"
                                >
                                    <div v-if="item.type === 'image'">
                                        <img
                                            :src="imageAssetsById?.[item.id]?.objectURL"
                                            :alt="item.attrs?.alt"
                                            class="rounded w-100 d-block mb-2"
                                        >
                                        <div class="text-end text-muted">
                                            <small v-if="item.attrs?.copyright">© {{ item.attrs.copyright }}</small>
                                        </div>
                                    </div>
                                    <div
                                        v-else-if="item.type === 'doc'"
                                        class="mb-3"
                                        v-html="tipTapJsonToHtml(item)"
                                    />
                                    <hr
                                        v-else-if="item.type === 'divider'"
                                    >
                                    <div
                                        v-else-if="item.type === 'feature'"
                                    >
                                        <FlatButton
                                            :id="'feature' + itemIndex"
                                            class="mb-3"
                                            :icon="'bi-geo-alt-fill'"
                                            :text="item.attrs.title"
                                            :title="item.attrs.title"
                                            :interaction="() => openFeaturePopup(item.attrs)"
                                        />
                                    </div>
                                    <div
                                        v-else-if="item.type === 'video'"
                                    >
                                        <div v-if="getDirectVideo(item?.attrs?.link).length">
                                            <video
                                                width="100%"
                                                height="auto"
                                                controls
                                                :aria-label="item?.attrs?.accessibleText"
                                            >
                                                <source
                                                    :src="item?.attrs?.link"
                                                    :type="getDirectVideo(item?.attrs?.link)[0]?.content"
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
                                                :src="getEmbedLink(item?.attrs?.link)"
                                                :title="item?.attrs?.title"
                                            />
                                            <CookieBanner
                                                v-if="!isCookieAllowed"
                                                :source="getEmbedLink(item?.attrs?.link)"
                                                @setCookie="setCookie"
                                            />
                                        </div>
                                        <div
                                            v-if="isCookieAllowed"
                                            class="mt-1 small"
                                        >
                                            {{ item?.attrs?.title }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <AlertMessage
                        v-if="showImportWarning3D[index]"
                        class="mt-2"
                        :closeable="true"
                        :text="$t('additional:modules.storyManager.importWarning3D')"
                        type="warning"
                        @closed="showImportWarning3D[index] = false"
                    />
                    <div
                        v-if="index === currentChapterIndex && index < storyConf.chapters.length - 1"
                        class="d-flex justify-content-center py-2"
                    >
                        <IconButton
                            class="btn-light"
                            :class-array="['chevron']"
                            :aria="$t('additional:modules.storyPlayer.goToPrevStep')"
                            icon="bi bi-chevron-down"
                            :title="$t('additional:modules.storyPlayer.goToPrevStep')"
                            :interaction="() => goToNextStep()"
                        />
                    </div>
                    <div
                        class="scroll-space"
                    />
                </div>
            </div>
        </div>
        <IconButton
            v-if="showStickyHeader"
            class="position-fixed bottom-0 end-0 mb-5 me-5"
            :aria="$t('additional:modules.storyPlayer.floatingButton.scrollToTop')"
            :class-array="['btn-secondary']"
            :icon-array="['bi-arrow-up fs-3']"
            @click="scrollToTop"
        />
        <div ref="storyPlayerFeature">
            <StoryPlayerFeature
                v-if="featureAttributes"
                :key="featureAttributes?.title"
                :image-assets-by-id="imageAssetsById"
                :feature-attributes="featureAttributes"
                @closePopup="closePopup"
            />
        </div>
    </div>
</template>

<style lang="scss">
#story-player {
    background-color: #F5F5F5;

    .btn-wrapper {
        width: 50px;
    }

    .chevron {
        background-color: $white;
        border: 1px solid $dark_grey;

        &:hover {
            background-color: $light_blue;
        }

        &:active {
            background-color: $dark_blue;
            color: $white;
        }
    }

    .sticky-top {
        z-index: 1050;
    }

    .sticky-title {
        color: $secondary;
        font-family: $font_family_accent;
    }

    .number-of-chapters {
        color: $dark_grey;
    }

    .story-player-content {
        overflow: auto;

        &::v-deep {
            img {
                max-width: 100%;
            }
        }
    }

    .storyTitle::after {
        content: "";
        display: block;
        height: 30vh;
    }

    .cover-card {
        min-height: 85vh;
        width: 100%;
        background-color: $white;
        transition: all 0.3s ease-in-out;

        .story-title {
            font-size: 2.5rem;
            font-family: $font_family_accent;
            line-height: 1.2;
            letter-spacing: -0.02em;
            color: $secondary;
        }

        .card-text {
            font-size: 1.15rem;
            line-height: 1.6;
            color: $dark_grey;
            max-width: 650px;
        }

        &.has-image {
            .story-title {
                font-size: $font_size_huge;
            }

            .cover-image {
                height: 60vh;
                max-height: 60vh;
                width: 100%;
                object-fit: cover;
            }
        }
    }
}

.player {
    width: var(--initialToolWidth);

    @media (max-width: 767px) {
        width: var(--initialToolWidthMobile);
    }

    overflow-x: hidden;
    overflow-y: auto;

    .story-title {
        font-family: $font_family_accent;
    }

    .stepper {
        min-height: auto;
        padding: 2rem;
        opacity: 0.4;
        border: 1px solid #e0e0e0;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        position: relative;
        scroll-margin-top: 50px;
        transition: all 0.3s ease-in-out;

        .story-player-content {
            overflow: auto;

            :deep() {
                .paragraph {
                    padding-bottom: 10px;
                }

                iframe {
                    width: 100%;
                    height: 100%;
                }
            }

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

        &.active {
            background-color: $white;
            opacity: 1;
            box-shadow: 0 8px 11px 2px rgba(0, 0, 0, 0.15);
        }
    }

    .scroll-space {
        height: 5vh;
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
}
</style>
