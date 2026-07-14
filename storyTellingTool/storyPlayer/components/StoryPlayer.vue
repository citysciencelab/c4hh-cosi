<script>
import axios from "axios";
import {boundingExtent} from "ol/extent.js";
import {extractStoryZip} from "../../storyManager/shared/js/storyZipCreator.js";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {getAndMergeAllRawLayers} from "@appstore/js/getAndMergeRawLayer.js";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Overlay from "ol/Overlay.js";
import StoryPlayerFeature from "./StoryPlayerFeature.vue";
import tipTapJsonToHtml from "../../storyCreator/shared/modules/tipTapEditor/js/tipTapJsonToHtml";

export default {
    name: "StoryPlayer",
    components: {
        FlatButton,
        IconButton,
        StoryPlayerFeature
    },
    data () {
        return {
            currentIndex: -1,
            currentChapterIndex: 0,
            featureAttributes: null,
            interval: null,
            isHovering: null,
            isChangeFrom3D: false,
            linkCopied: false,
            loadedContent: null,
            overlay: null,
            scroller: null,
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
            "allLayerConfigs",
            "layerConfigById",
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
        this.updateLayerConfigs(this.originalLayerConfig);
        this.deactivateTool();
        this.closePopup();
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
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/LayerTree", ["removeLayer"]),
        ...mapMutations("Menu", ["setExpandedBySide"]),
        ...mapActions("Maps", ["changeMapMode", "placingPointMarker", "removePointMarker", "zoomToExtent"]),
        ...mapActions(["addLayerToLayerConfig", "addOrReplaceLayer", "replaceByIdInLayerConfig", "updateLayerConfigs"]),
        ...mapActions("Menu", ["changeCurrentComponent", "resetMenu"]),

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
                  visibleLayerList = typeof layers?.getArray !== "function" ? [] : layers.getArray().filter(layer => {
                      return layer.getVisible() === true && layer.get("name") !== "markerPoint" && layer.get("name") !== "markerPolygon" && layer.get("id") !== this.visibleBaselayerConfigs[0]?.id;
                  });

            visibleLayerList.forEach(layer => {
                this.addOrReplaceLayer({
                    layerId: layer.get("id"),
                    visibility: false
                });
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
         * Enables a layer on the map
         * @param {String} layerId the layer id to enable
         * @returns {void}
         */
        async enableLayer (layerId) {
            let layerConf = this.layerConfigById(layerId);

            if (!layerConf) {
                layerConf = getAndMergeAllRawLayers().find(layer => layer.id === layerId);
                await this.addLayerToLayerConfig({layerConfig: layerConf});
            }

            this.addOrReplaceLayer({
                layerId: layerId,
                visibility: true,
                showInLayerTree: true
            });
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

            // Toggles 3D map mode
            if (this.currentChapter.is3D && this.mode === "2D") {
                this.changeMapMode("3D");
            }
            else if (!this.currentChapter.is3D && this.mode === "3D") {
                this.isChangeFrom3D = true;
                this.changeMapMode("2D");
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
                const position = this.currentChapter.navigation3D.cameraPosition,
                      map3d = mapCollection.getMap("3D"),
                      camera = map3d.getCesiumScene().camera,
                      destination = Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]);

                camera.flyTo({
                    destination: destination,
                    orientation: {
                        heading: this.currentChapter.navigation3D.heading,
                        pitch: this.currentChapter.navigation3D.pitch
                    },
                    easingFunction: Cesium.EasingFunction.QUADRATIC_OUT
                });
            }

            // Updates the map layers
            this.currentChapter?.map?.layers.forEach(layer => this.enableLayer(layer));

            if (!this.currentChapter.is3D) {
                this.deactivateTool();
                if (this.currentChapter.map?.tool) {
                    this.activateTool(this.currentChapter.map.tool);
                }
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
         * Gets the URL of a story.json from the URL parameter 'story'
         * @returns {String} the URL of the story.json
         */
        getConfPathfromUrl () {
            const queryString = window.location.search,
                  urlParams = new URLSearchParams(queryString);

            return urlParams.get("story");
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
                positioning: "bottom-center",
                offset: [0, -20]
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
         * Copies the current shareable URL (including the active story) to the clipboard.
         * @returns {void}
         */
        copyToClipboard () {
            if (window.isSecureContext) {
                navigator.clipboard.writeText(this.url + "#");
                this.linkCopied = true;
                setTimeout(() => {
                    this.linkCopied = false;
                }, 2000);
            }
            else {
                this.addSingleAlert({
                    category: "error",
                    content: this.$t("common:modules.shareView.copyErrorAlert", {url: this.url})
                });
            }
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
            <div class="d-flex justify-content-end bd-highlight mb-3 align-items-center gap-2 flex-shrink-0">
                <span
                    v-if="linkCopied"
                    class="badge rounded-pill bg-success badge-pill"
                >
                    {{ $t('additional:modules.storyPlayer.copyStoryLinkSuccess') }}
                </span>
                <IconButton
                    class="btn-light btn-sm"
                    :class-array="['chevron']"
                    :aria="$t('additional:modules.storyPlayer.copyStoryLink')"
                    icon="bi bi-share fs-5"
                    :title="$t('additional:modules.storyPlayer.copyStoryLink')"
                    :interaction="copyToClipboard"
                />
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
                <img
                    v-if="coverImagePath && coverImagePath.length"
                    :src="coverImagePath"
                    class="card-img-top cover-image"
                    :alt="storyConf.coverImageAlt"
                >
                <div class="text-end">
                    <small
                        v-if="storyConf.imageCopyright"
                        class="text-muted copyright me-2 mt-1"
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
                                    class="created text-muted small"
                                >
                                    {{ storyConf.created }}
                                </small>
                            </div>
                        </div>
                        <div class="d-flex align-items-center gap-2 flex-shrink-0">
                            <span
                                v-if="linkCopied"
                                class="badge rounded-pill bg-success"
                            >
                                {{ $t('additional:modules.storyPlayer.copyStoryLinkSuccess') }}
                            </span>
                            <IconButton
                                class="btn-light btn-sm"
                                :class-array="['chevron']"
                                :aria="$t('additional:modules.storyPlayer.copyStoryLink')"
                                icon="bi bi-share fs-5"
                                :title="$t('additional:modules.storyPlayer.copyStoryLink')"
                                :interaction="copyToClipboard"
                            />
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
                        class="d-flex justify-content-center mb-3 p-2"
                    >
                        <IconButton
                            class="me-5 btn-light"
                            :class-array="['chevron']"
                            :aria="$t('additional:modules.storyCreator.goToPrevStep')"
                            icon="bi bi-chevron-up"
                            :title="$t('additional:modules.storyCreator.goToPrevStep')"
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
                                class="card-title px-4 pt-4 pb-3"
                            >
                                {{ chapter.title }}
                            </h5>
                            <div class="story-player-content card-text">
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
                                        <div class="text-end small text-muted">
                                            <span v-if="item.attrs?.copyright">© {{ item.attrs.copyright }}</span>
                                        </div>
                                    </div>
                                    <div
                                        v-else-if="item.type === 'doc'"
                                        class="mb-3"
                                        v-html="tipTapJsonToHtml(item)"
                                    />
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
                                </div>
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="index === currentChapterIndex && index < storyConf.chapters.length - 1"
                        class="d-flex justify-content-center py-2"
                    >
                        <IconButton
                            class="me-5 btn-light"
                            :class-array="['chevron']"
                            :aria="$t('additional:modules.storyCreator.goToPrevStep')"
                            icon="bi bi-chevron-down"
                            :title="$t('additional:modules.storyCreator.goToPrevStep')"
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
                :feature-attributes="featureAttributes"
                @closePopup="closePopup"
            />
        </div>
    </div>
</template>

<style lang="scss">
#story-player {
    background-color: #F5F5F5;

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
                height: 50vh;
                max-height: 50vh;
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
            padding: 0.625rem 1.25rem;

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
}
</style>
