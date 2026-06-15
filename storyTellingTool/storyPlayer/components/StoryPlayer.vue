<script>
import axios from "axios";
import {extractStoryZip} from "../../storyManager/shared/js/storyZipCreator.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import tipTapJsonToHtml from "../../storyCreator/shared/modules/tipTapEditor/js/tipTapJsonToHtml";

export default {
    name: "StoryPlayer",
    props: {
        imageAssetsById: {
            type: Object,
            default: null
        },
        isMobileDevice: {
            type: Boolean,
            default: false
        },
        screenOrientationType: {
            type: String,
            default: screen.orientation?.type
        },
        storyConfProp: {
            type: Object,
            default: null
        }
    },
    data () {
        return {
            currentIndex: -1,
            currentChapterIndex: 0,
            fixedImageAssetsById: null,
            loadedContent: null,
            isHovering: null,
            isChangeFrom3D: false,
            showMode: "",
            interval: null,
            toolBodyScrollTop: 0,
            scroller: null,
            showStickyHeader: false
        };
    },
    computed: {
        ...mapGetters("Modules/StoryPlayer", [
            "autoplay",
            "description",
            "fixedStoryName",
            "fixedStoryPath",
            "icon",
            "id",
            "mode",
            "name",
            "storyConfJson",
            "type",
            "storyPlayerMenuSide",
            "supportedDevices",
            "supportedMapModes"
        ]),
        ...mapGetters("Modules/StoryPlayer", {
            storyConfStore: "storyConf"
        }),
        ...mapGetters([
            "layerConfigsByAttributes",
            "allLayerConfigs",
            "layerConfigById"
        ]),
        ...mapGetters("Maps", ["mode"]),
        ...mapGetters("Menu", [
            "mainMenu",
            "secondaryMenu",
            "expanded"
        ]),
        /**
         * The path to the story configuration json.
         * @returns {String} the path to the story configuration json
         */
        storyConfPath () {
            return this.storyConfJson ? this.storyConfJson : this.getConfPathfromUrl();
        },
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
         * The story configuration object, either from the prop or the store.
         * @returns {Object} the story configuration
         */
        storyConf () {
            return this.storyConfProp || this.storyConfStore || {};
        },
        /**
         * The image assets object.
         * @returns {Object} the image assets object
         */
        finalImageAssetsById () {
            return this.imageAssetsById || this.fixedImageAssetsById;
        },
        /**
         * The URL of the cover image.
         * @returns {String} the URL of the cover image
         */
        coverImagePath () {
            return this.finalImageAssetsById?.[this.storyConf.imageSrc]?.objectURL || "";
        },
        isMobilePortrait () {
            return this.isMobileDevice && this.screenOrientationType.startsWith("portrait");
        }
    },
    watch: {
        /**
         * Handles step changes.
         * @returns {void}
         */
        currentChapterIndex () {
            this.loadChapter();
        }
    },
    created () {
        const breakpoint = "(max-width: 768px)",
            mediaQuery = window.matchMedia(breakpoint),
            isMobile = mediaQuery.matches,
            orientationCheck = this.screenOrientationType?.startsWith("landscape");

        if (isMobile && orientationCheck) {
            this.applyMobileLandscapeLayout();
        }
    },
    async mounted () {
        if (!Object.keys(this.storyConf).length) {
            await this.getFixedStoryList(this.fixedStoryPath, this.fixedStoryName);
        }

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
    },
    activated () {
        const toolBody = document.getElementById("mp-body-secondaryMenu");

        this.$nextTick(() => {
            if (toolBody && this.toolBodyScrollTop > 0) {
                toolBody.scrollTop = this.toolBodyScrollTop;
            }
            if (toolBody) {
                toolBody.addEventListener("scroll", this.handleToolBodyScroll);
            }
        });
    },
    deactivated () {
        // Handle KeepAlive visibility. Triggered if component is deactivated
        const heading = document.getElementById("mp-menu-navigation-secondaryMenu"),
            toolBody = document.getElementById("mp-body-secondaryMenu");

        heading?.style?.removeProperty("display");
        toolBody.setAttribute("style", this.originalToolBodyStyle || "");

        // Remove scroll event listener
        if (toolBody) {
            toolBody.removeEventListener("scroll", this.handleToolBodyScroll);

            toolBody.scrollTop = 0;
        }

        // remove the close button if GFI is opened
        document.getElementById("mp-menu-header-close-button-secondaryMenu")?.setAttribute("style", "display: none;");
        document.getElementById("mp-menu-navigation-reset-button-secondaryMenu")?.setAttribute("style", "display: none;");
    },
    beforeUnmount () {
        // Hides all story layers
        const layerList = typeof this.layerConfigsByAttributes === "function"
            ? this.layerConfigsByAttributes({showInLayerTree: true})
            : [];

        for (const layer of layerList) {
            if (!layer || !layer.id || !layer.attributes) {
                continue;
            }

            const isStepLayer = (
                (this.currentStep && this.currentStep.layers) ||
                []
            ).includes(layer.id) || (this.currentStep && this.currentStep.layers && this.currentStep.layers.some(l => {
                return Array.isArray(l) ? l.includes(layer.id) : false;
            }));

            if (isStepLayer && layer.attributes.isVisibleInMap) {
                this.disableLayer(layer);
            }
        }
        if (this.coverCardObserver) {
            this.coverCardObserver.disconnect();
        }
    },
    methods: {
        ...mapMutations("Modules/StoryPlayer", [
            "setSupportedDevices",
            "setSupportedMapModes",
            "setType",
            "setId",
            "setName",
            "setDescription",
            "setIcon",
            "setStoryConf",
            "setStoryConfJson",
            "setAutoplay",
            "setMode"
        ]),
        ...mapMutations("Menu", ["setExpandedBySide"]),
        ...mapActions("Maps", ["changeMapMode"]),
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Menu", ["changeCurrentComponent", "resetMenu"]),

        tipTapJsonToHtml,
        handleToolBodyScroll (event) {
            this.toolBodyScrollTop = event.target.scrollTop;
        },
        /**
         * Activates a tool
         * @param {String} toolId the id of the tool to activate
         * @returns {void}
         */
        activateTool (toolId) {
            if (this.isMobilePortrait) {
                return;
            }

            const toolMenuSide = this.storyPlayerMenuSide === "mainMenu" ? "secondaryMenu" : "mainMenu",
                toolKey = toolId.charAt(0).toUpperCase() + toolId.slice(1),
                module = this.$store.state.Modules && this.$store.state.Modules[toolKey],
                name = module && module.name ? module.name : toolKey;

            this.setExpandedBySide({expanded: true, side: toolMenuSide});
            this.changeCurrentComponent({type: toolId, side: toolMenuSide, props: {name}});
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
                    this.fixedImageAssetsById = imageAssetsById;
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
         * Toggles a layer on the map
         * @param {Object} layer the layer to enable
         * @param {Boolean} enabled enables the layer if `true`, disables the layer if `false`
         * @returns {void}
         */
        toggleLayer (layer, enabled) {
            this.replaceByIdInLayerConfig({
                layerConfigs: [{
                    id: layer.id,
                    layer: {
                        visibility: enabled,
                        showInLayerTree: true
                    }
                }]
            });
        },
        /**
         * Enables a layer on the map
         * @param {Object} layer the layer to enable
         * @returns {void}
         */
        enableLayer (layer) {
            this.toggleLayer(layer, true);
        },
        /**
         * Disables a layer on the map
         * @param {Object} layer the layer to disable
         * @returns {void}
         */
        disableLayer (layer) {
            this.toggleLayer(layer, false);
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
                        zoomLevel = this.isMobilePortrait ? this.currentChapter.map.zoomLevel - 1 : this.currentChapter.map.zoomLevel;

                    if (mapView) {
                        setTimeout(() => {
                            const adjustedCenter = this.getCenterOfVisibleMap();

                            mapView.animate({
                                center: adjustedCenter,
                                zoom: zoomLevel,
                                duration: 1000,
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

            const layerList = Array.isArray(this.allLayerConfigs) ? this.allLayerConfigs : [];

            // Updates the map layers
            for (const layer of layerList) {
                const isStepLayer = (this.currentChapter.map.layers || []).includes(
                    layer.id
                ) || this.currentChapter.map.layers.some(l => {
                    return Array.isArray(l) ? l.includes(layer.id) : false;
                });

                if (isStepLayer) {
                    this.enableLayer(layer);
                }
                else if (!isStepLayer) {
                    this.disableLayer(layer);
                }
            }

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

            const zoomLevel = this.isMobilePortrait ? this.currentChapter.map.zoomLevel - 1 : this.currentChapter.map.zoomLevel,
                targetResolution = mapView?.getResolutionForZoom(zoomLevel),
                rightPadding = this.expanded("secondaryMenu")
                    ? document.getElementById("mp-menu-secondaryMenu").offsetWidth
                    : 20,
                leftPadding = this.expanded("mainMenu")
                    ? document.getElementById("mp-menu-mainMenu").offsetWidth
                    : 20,
                offsetPixels = (rightPadding - leftPadding) / 2,
                center = this.currentChapter.map.center;

            if (this.isMobilePortrait) {
                const mapHeight = map.getTargetElement().getBoundingClientRect().top,
                    verticalOffsetPixels = (mapHeight / 2) + 50,
                    offsetY = verticalOffsetPixels * targetResolution;

                return [center[0], center[1] - offsetY];
            }

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
            }
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
            const stepRefs = Array.isArray(this.$refs.stepper) ? this.$refs.stepper : [this.$refs.stepper],
                stepElements = stepRefs.filter(step => step && step.classList);

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
                minVisibleRatio = 0.15,
                switchDelta = 0.12,
                applyActiveStep = (activeIndex) => {
                    const step = stepElements[activeIndex];

                    if (!step || !step.classList) {
                        return;
                    }

                    stepElements.forEach(s => s.classList.remove("active"));
                    step.classList.add("active");

                    if (this.currentIndex !== activeIndex) {
                        this.currentIndex = activeIndex;
                        this.currentChapterIndex = activeIndex;

                        // Handle iframe aspect ratio and progress
                        const iframeElement = step.querySelector("iframe"),
                            iframeDiv = step.getElementsByClassName("field_video")[0];

                        if (iframeElement && iframeDiv) {
                            const ratioClass = this.getIframeAspectRatio(iframeElement);

                            iframeDiv.classList.add("ratio", ratioClass);
                        }
                    }
                };

            if (this.currentChapterIndex >= 0 && this.currentChapterIndex < stepElements.length) {
                applyActiveStep(this.currentChapterIndex);
            }

            this._stepObserver = new IntersectionObserver(
                (entries) => {
                    // Update intersection ratios for all steps
                    entries.forEach(entry => {
                        const idx = stepElements.indexOf(entry.target);

                        if (idx !== -1) {
                            intersectionRatios[idx] = entry.isIntersecting ? entry.intersectionRatio : 0;
                        }
                    });

                    // Find the step with the highest intersection ratio
                    let maxRatio = 0,
                        activeIndex = -1;

                    // find which step is most visible in the viewport and mark it as the "active" step.
                    intersectionRatios.forEach((ratio, idx) => {
                        if (ratio > maxRatio) {
                            maxRatio = ratio;
                            activeIndex = idx;
                        }
                    });

                    if (activeIndex === -1 || maxRatio < minVisibleRatio) {
                        return;
                    }

                    const currentRatio = this.currentIndex >= 0
                            ? intersectionRatios[this.currentIndex]
                            : 0,
                        shouldSwitch = this.currentIndex === -1
                            || activeIndex === this.currentIndex
                            || maxRatio >= currentRatio + switchDelta;

                    if (shouldSwitch) {
                        applyActiveStep(activeIndex);
                    }
                },
                {
                    root: null,
                    threshold: thresholds
                }
            );

            // Observe each step element
            stepElements.forEach(step => this._stepObserver.observe(step));
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
            class="sticky-top bg-white border-bottom shadow-sm py-3 px-3 d-flex flex-column gap-1"
        >
            <h4 class="sticky-title mb-0 flex-grow-1">
                {{ storyConf.title }}
            </h4>
            <span class="number-of-chapters">
                Kapitel {{ currentChapterIndex + 1 }} von {{ storyConf.chapters.length }}
            </span>
        </div>
        <div
            class="d-flex w-100 player"
        >
            <div
                ref="coverCard"
                class="card cover-card"
            >
                <img
                    v-if="coverImagePath && coverImagePath.length"
                    :src="coverImagePath"
                    class="card-img-top"
                    :alt="storyConf.coverImageAlt"
                >
                <div class="text-end">
                    <small
                        v-if="storyConf.coverImageCopyright"
                        class="text-muted copyright me-2 mt-1"
                    >
                        &copy; {{ storyConf.coverImageCopyright }}
                    </small>
                </div>
                <div class="card-body p-4">
                    <h4
                        v-if="storyConf.title"
                        class="story-title"
                    >
                        {{ storyConf.title }}
                    </h4>
                    <div
                        class="d-flex align-items-center gap-2 mb-2 author-block"
                    >
                        <i class="bi bi-person-circle fs-4 me-1" />
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
                    ref="stepper"
                    :key="chapter.title"
                    class="stepper"
                    :class="{firstStep: index === 0, lastStep: index === storyConf.chapters.length - 1}"
                >
                    <div
                        v-if="index === currentChapterIndex && currentChapterIndex > 0"
                        class="chevron-navigation chevron-up"
                    >
                        <button
                            class="btn btn-chevron"
                            :aria-label="`Zum vorherigen Schritt (${currentChapterIndex})`"
                            @click="goToPreviousStep"
                        >
                            <i class="bi bi-arrow-up" />
                        </button>
                    </div>
                    <h2 v-if="chapter.title">
                        {{ chapter.title }}
                    </h2>

                    <div
                        class="story-player-content"
                    >
                        <div
                            v-for="(item, itemIndex) in chapter.content"
                            :key="'content-' + itemIndex"
                        >
                            <div v-if="item.type === 'image'">
                                <img
                                    :src="finalImageAssetsById?.[item.id]?.objectURL"
                                    :alt="item.attrs?.alt"
                                    class="rounded w-100 d-block mb-2"
                                >
                                <div class="text-end small text-muted">
                                    <span v-if="item.attrs?.copyright">© {{ item.attrs.copyright }}</span>
                                </div>
                            </div>
                            <div
                                v-else-if="item.type === 'doc'"
                                v-html="tipTapJsonToHtml(item)"
                            />
                        </div>
                    </div>
                    <div
                        v-if="index === currentChapterIndex && currentChapterIndex < storyConf.chapters.length - 1"
                        class="chevron-navigation chevron-down"
                    >
                        <button
                            class="btn btn-chevron"
                            :aria-label="`Zum nächsten Schritt (${currentChapterIndex + 2})`"
                            @click="goToNextStep"
                        >
                            <i class="bi bi-arrow-down" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
#story-player {
    background-color: #F5F5F5;

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

        img {
            max-width: 100%;
        }
    }

    .cover-card {
        min-height: 82vh;
        height: 82vh;
        max-height: 82vh;
        width: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        box-sizing: border-box;
        overflow: hidden;

        .card-img-top {
            flex: 1 1 0;
            min-height: 150px;
            max-height: 60vh;
            width: 100%;
            object-fit: cover;
            transition: max-height 0.3s;
        }
        .card-body {
            flex: 0 0 auto;
            overflow-y: auto;
            min-height: 0;
        }
    }
}

.player {
    --h1Size: 1.875rem;
    --h2Size: 1.5rem;
    --pSize: 1rem;

    width: var(--initialToolWidth);
    @media (max-width: 767px) {
        width: var(--initialToolWidthMobile);
    }

    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-x: hidden;
    overflow-y: auto;

    .story-title {
        font-family: $font_family_accent;
    }

    .stepper {
        min-height: 500px;
        margin: 20px 10px;
        background-color: rgb(240, 240, 240);
        opacity: 0.4;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
        overflow: hidden;
        position: relative;
        scroll-margin-top: 50px;
        transition: all 0.3s ease-in-out;

        .chevron-navigation {
            display: flex;
            justify-content: center;
            padding: 8px 0;

            .btn-chevron {
                background-color: #fff;
                border: 1px solid #000;
                border-radius: 50%;
                color: #000;
                cursor: pointer;
                padding: 0;
                width: 35px;
                height: 35px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;

                .bi {
                    font-size: 20px;
                    line-height: 1;
                }

                &:hover {
                    background-color: #f5f5f5;
                    transform: scale(1.08);
                }

                &:active {
                    transform: scale(0.95);
                }
            }
        }

        .chevron-up {
            border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .chevron-down {
            border-top: 1px solid rgba(0, 0, 0, 0.1);
        }
        >figure {
            >img {
                width: 100%;
                object-fit: cover;
            }

            figcaption {
                text-align: right;
                padding: 0 10px 0 0;
                font-size: 0.75rem;
            }
        }

        h2 {
            padding: 16px 20px 10px;
            color: var(--DipasColorsFont, #212529);
            font-size: var(--h2Size);
            text-transform: none;
            font-weight: bold;
            hyphens: auto;
        }

        &.lastStep{
            margin-bottom: 60vh;
        }

        .story-player-content {
            overflow: auto;
            padding: 0.625rem 1.25rem;

            :deep() {
                .paragraph {
                    padding-bottom: 10px;
                }

                h3 {
                    font-size: 1.25rem;
                    line-height: 1.5rem;
                    color: var(--DipasColorsFont, #212529);
                    border-bottom: none;
                    margin: 0;
                }

                p {
                    font-size: var(--pSize);
                    margin-right: 0;
                    line-height: 1.5rem;
                }

                figure {
                    img {
                        object-fit: contain;
                        object-position: top;
                        width: 100%;
                        height: auto;
                        max-height: 50vh;
                    }

                    figcaption {
                        text-align: right;
                        font-size: 0.75rem;
                    }
                }

                .paragraph_image_position_image_left {
                    display: flow-root;
                    .field_image {
                        figure {
                            float: left;
                            padding: 0.313rem 0.625rem 0 0;
                            width: 45%;
                            height: 100%;

                            img {
                                max-width: 100%;
                                max-height: 100%;
                                height: auto;
                                width: auto;
                            }

                            figcaption {
                                font-size: 0.75rem;
                                text-align: right;
                                line-height: 1rem;
                            }
                        }
                    }
                }

                .paragraph_image_position_image_right {
                    display: flow-root;
                    .field_image {
                        figure {
                            float: right;
                            padding: 0.313rem 0 0 0.625rem;
                            width: 45%;
                            height: 100%;

                            img {
                                max-width: 100%;
                                max-height: 100%;
                                height: auto;
                                width: auto;
                            }

                            figcaption {
                                font-size: 0.75rem;
                                text-align: right;
                                line-height: 1rem;
                            }
                        }
                    }
                }

                iframe {
                    width: 100%;
                    height: 100%;
                }
            }
        }

        &.active {
            background-color: #ffffff;
            opacity: 1;
            box-shadow: 0 8px 11px 2px rgba(0, 0, 0, 0.15);
        }
    }
}
</style>
