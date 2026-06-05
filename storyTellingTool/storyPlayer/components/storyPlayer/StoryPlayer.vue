<script>
import axios from "axios";
import {mapActions, mapGetters, mapMutations} from "vuex";
import fetchDataFromUrl from "../../utils/getStoryFromUrl";
import getters from "../../store/gettersDataNarrator";
import mutations from "../../store/mutationsDataNarrator";

export default {
    name: "StoryPlayer",
    props: {
        isMobileDevice: {
            type: Boolean,
            default: false
        },
        screenOrientationType: {
            type: String,
            default: screen.orientation?.type
        }
    },
    data () {
        return {
            currentIndex: -1,
            currentStepIndex: 0,
            loadedContent: null,
            isHovering: null,
            isChangeFrom3D: false,
            showMode: "",
            steps: [],
            activeTools: [],
            interval: null,
            toolBodyScrollTop: 0,
            scroller: null,
            showStickyHeader: false
        };
    },
    computed: {
        ...mapGetters("Modules/DataNarrator", Object.keys(getters)),
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
         * The current selected step of the story.
         * @returns {number} current step index
         */
        currentStep () {
            const stepindex = this.autoplay && this.steps.length > 0
                ? this.steps[this.currentStepIndex]
                : this.storyConf.steps[this.currentStepIndex];

            return this.currentStepIndex !== null
                ? this.storyConf && stepindex
                : null;
        },
        /**
         * Creates a shallow copy of the provided steps array.
         * This is done to avoid mutating the original steps array when adding depth information.
         * @returns {Array} A new array containing the copied steps.
         */
        stepsCopy () {
            return JSON.parse(JSON.stringify(this.storyConf.steps));
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
        currentStepIndex () {
            this.loadStep();
        }
    },
    created () {
        this.steps.forEach((step) => {
            this.loadStoryContents(step.htmlFile).then(data => {
                step.loadedContent = data?.replace(/<a(?![^>]*\btarget=)([^>]*)>/gi, "<a$1 target=\"_blank\">");
            }).catch(err => {
                console.error(err);
            });
        });

        const breakpoint = "(max-width: 768px)",
            mediaQuery = window.matchMedia(breakpoint),
            isMobile = mediaQuery.matches,
            orientationCheck = this.screenOrientationType?.startsWith("landscape");

        if (isMobile && orientationCheck) {
            this.applyMobileLandscapeLayout();
        }
    },
    async mounted () {
        if (this.storyConfPath && this.storyConfPath !== "") {
            await fetchDataFromUrl(this.storyConfPath).then(loadedStoryConf => {
                this.setStoryConf(loadedStoryConf);

                let count = 0;

                this.stepsCopy.forEach(() => {
                    this.assignDepth(this.stepsCopy, 0, count);
                    count += 1;
                });

                this.showMode = this.storyConf?.displayType ? this.storyConf.displayType : "dipas";
                this.createStepArray(this.stepsCopy);
                this.loadStep();
            });
        }

        this.scrollerSetup();

        const toolBody = document.getElementById("mp-body-secondaryMenu"),
            coverCard = this.$el.querySelector(".cover-card");

        if (toolBody) {
            toolBody.addEventListener("scroll", this.handleToolBodyScroll);
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
        ...mapMutations("Modules/DataNarrator", Object.keys(mutations)),
        ...mapMutations("Menu", ["setExpandedBySide"]),
        ...mapActions("Maps", ["changeMapMode"]),
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Menu", ["changeCurrentComponent", "resetMenu"]),
        /**
         * Updates the step html content
         * @param {Object} htmlFile name of the html file to load
         * @returns {void}
         */
        async loadStoryContents (htmlFile) {
            if (this.storyConf.htmlFolder && htmlFile) {
                const storybasepath = this.storyConfPath.endsWith("/") ? this.storyConfPath : this.storyConfPath + "/",
                    response = await axios.get(storybasepath + this.storyConf.htmlFolder + "/" + htmlFile),
                    data = await response.data;

                return data;
            }
            else if (htmlFile) {
                return axios.get("./assets/steps/" + htmlFile)
                    .then(response => {
                        if (!response || !response.data) {
                            throw new Error(`No data received for file: ${htmlFile}`);
                        }
                        return response.data;
                    });
            }

            return null;
        },
        handleToolBodyScroll (event) {
            this.toolBodyScrollTop = event.target.scrollTop;
        },
        /**
         * Activates a tool
         * @param {Object} toolId the id of the tool to activate
         * @returns {void}
         */
        activateTool (toolId) {
            if (this.isMobilePortrait) {
                return;
            }

            const toolMenuSide = this.dataNarratorMenuSide === "mainMenu" ? "secondaryMenu" : "mainMenu",
                toolKey = toolId.charAt(0).toUpperCase() + toolId.slice(1),
                module = this.$store.state.Modules && this.$store.state.Modules[toolKey],
                name = module && module.name ? module.name : toolKey;

            this.setExpandedBySide({expanded: true, side: toolMenuSide});
            this.changeCurrentComponent({type: toolId, side: toolMenuSide, props: {name}});
        },
        /**
         * Deactivates a tool on the opposite menu side of where the dataNarrator is located
         * @returns {void}
         */
        deactivateTool () {
            const toolMenuSide = this.dataNarratorMenuSide === "mainMenu" ? "secondaryMenu" : "mainMenu";

            this.setExpandedBySide({expanded: false, side: toolMenuSide});

            this.resetMenu(toolMenuSide);
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
         * Sets up the tool window and content for the selected step.
         * @returns {void}
         */
        async loadStep () {
            if (!this.currentStep) {
                return;
            }

            // Updates the tool width
            if (this.currentStep.stepWidth) {
                this.setInitialWidth(this.currentStep.stepWidth);
            }

            // Toggles 3D map mode
            if (this.currentStep.is3D && this.mode === "2D") {
                this.changeMapMode("3D");
            }
            else if (!this.currentStep.is3D && this.mode === "3D") {
                this.isChangeFrom3D = true;
                this.changeMapMode("2D");
            }

            // Updates the map center and zoom level for 2D
            if (this.currentStep.centerCoordinate && this.currentStep.centerCoordinate.length > 0) {
                if (this.currentStep.is3D) {
                    console.warn("Don't use centerCoordinate for 3D navigation.");
                }
                else {
                    const map = mapCollection.getMap("2D"),
                        mapView = typeof map?.getView === "function" ? map.getView() : undefined,
                        zoomLevel = this.isMobilePortrait ? this.currentStep.zoomLevel - 1 : this.currentStep.zoomLevel;

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
            if (this.currentStep.navigation3D
                && Object.prototype.hasOwnProperty.call(this.currentStep.navigation3D, "cameraPosition")
                && this.currentStep.navigation3D.cameraPosition[0] !== null) {
                const position = this.currentStep.navigation3D.cameraPosition,
                    map3d = mapCollection.getMap("3D"),
                    camera = map3d.getCesiumScene().camera,
                    destination = Cesium.Cartesian3.fromDegrees(position[0], position[1], position[2]);

                camera.flyTo({
                    destination: destination,
                    orientation: {
                        heading: this.currentStep.navigation3D.heading,
                        pitch: this.currentStep.navigation3D.pitch
                    },
                    easingFunction: Cesium.EasingFunction.QUADRATIC_OUT
                });
            }

            const layerList = Array.isArray(this.allLayerConfigs) ? this.allLayerConfigs : [];

            // Updates the map layers
            for (const layer of layerList) {
                const isStepLayer = (this.currentStep.layers || []).includes(
                    layer.id
                ) || this.currentStep.layers.some(l => {
                    return Array.isArray(l) ? l.includes(layer.id) : false;
                });

                if (isStepLayer) {
                    this.enableLayer(layer);
                }
                else if (!isStepLayer) {
                    this.disableLayer(layer);
                }
            }

            if (!this.currentStep.is3D) {
                // Activates or deactivates tools
                const interactionAddons = this.currentStep.interactionAddons || [];

                this.activeTools = interactionAddons;

                this.deactivateTool();

                // Activate all tools of the current step
                interactionAddons.forEach(this.activateTool);
            }
        },
        /*
         * Fills the steps array transforming the nested structure of the steps into a flat structure
         * @returns {void}
         */
        createStepArray (steps) {
            steps.forEach(s => {
                const step = JSON.parse(JSON.stringify(s));

                delete step.steps;
                this.steps.push(step);

                if (s.steps) {
                    this.createStepArray(s.steps);
                }
            });
        },
        /*
         * Adds the depth level of a story step to a copy of the storyConf
         * @returns {void}
         */
        assignDepth (arr, depth = 0, index = 0) {

            if (index < arr.length) {
                arr[index].depth = depth;
                if (arr[index].steps && arr[index].steps.length) {
                    this.assignDepth(arr[index].steps, depth + 1, 0);
                }
                this.assignDepth(arr, depth, index + 1);
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
                return this.currentStep.centerCoordinate;
            }

            const zoomLevel = this.isMobilePortrait ? this.currentStep.zoomLevel - 1 : this.currentStep.zoomLevel,
                targetResolution = mapView?.getResolutionForZoom(zoomLevel),
                rightPadding = this.expanded("secondaryMenu")
                    ? document.getElementById("mp-menu-secondaryMenu").offsetWidth
                    : 20,
                leftPadding = this.expanded("mainMenu")
                    ? document.getElementById("mp-menu-mainMenu").offsetWidth
                    : 20,
                offsetPixels = (rightPadding - leftPadding) / 2,
                center = this.currentStep.centerCoordinate;

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
        scrollerSetup () {
            const stepElements = Array.isArray(this.$refs.stepper) ? this.$refs.stepper : [this.$refs.stepper];

            if (!stepElements || stepElements.length === 0) {
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
            const intersectionRatios = new Array(stepElements.length).fill(0);

            this._stepObserver = new IntersectionObserver(
                (entries) => {
                    // Update intersection ratios for all steps
                    entries.forEach(entry => {
                        const idx = stepElements.indexOf(entry.target);

                        intersectionRatios[idx] = entry.isIntersecting ? entry.intersectionRatio : 0;
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

                    // Remove all active classes first
                    stepElements.forEach(step => step.classList.remove("active"));

                    // Set only the most visible step as active if any
                    if (activeIndex !== -1 && maxRatio > 0) {
                        const step = stepElements[activeIndex];

                        if (step && step.classList) {
                            step.classList.add("active");
                        }

                        if (this.currentIndex !== activeIndex) {
                            this.currentIndex = activeIndex;
                            this.currentStepIndex = activeIndex;

                            // Handle iframe aspect ratio and progress
                            const iframeElement = step.querySelector("iframe"),
                                iframeDiv = step.getElementsByClassName("field_video")[0];

                            if (iframeElement && iframeDiv) {
                                const ratioClass = this.getIframeAspectRatio(iframeElement);

                                iframeDiv.classList.add("ratio", ratioClass);
                            }
                        }
                    }
                    else {
                        this.currentIndex = -1;
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
        v-if="storyConf !== undefined && storyConf.steps && currentStep"
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
                Kapitel {{ currentStepIndex + 1 }} von {{ steps.length }}
            </span>
        </div>
        <div
            class="d-flex w-100 player"
        >
            <div
                class="card cover-card"
            >
                <img
                    v-if="storyConf.coverImagePath && storyConf.coverImagePath.length"
                    :src="storyConf.coverImagePath"
                    class="card-img-top"
                    :alt="storyConf.coverImageAlt"
                >
                <div class="text-end">
                    <small
                        v-if="storyConf.coverImageCopyright"
                        class="text-muted photo-credit me-2 mt-1"
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
                                LGV - Landesbetrieb Geoinformation und Vermessung
                            </small>
                            <small
                                class="created text-muted small"
                            >
                                Erstellt am: 11.03.2026
                            </small>
                        </div>
                    </div>
                    <p
                        v-if="storyConf.coverImageCaption"
                        class="card-text mt-3"
                    >
                        Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet. Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.
                    </p>
                </div>
            </div>
            <div
                class="storyTitle"
                tabindex="0"
            >
                <div
                    v-for="(step, index) in steps"
                    ref="stepper"
                    :key="step.title"
                    class="stepper"
                    :class="{firstStep: index === 0, lastStep: index === steps.length - 1}"
                >
                    <h2 v-if="step.title">
                        {{ step.title }}
                    </h2>

                    <figure
                        v-if="step.titleImage"
                        :alt="step.titleImageAlt"
                    >
                        <img
                            v-if="step.titleImage && step.titleImage.length"
                            :alt="step.titleImageAlt"
                            :src="step.titleImage"
                        >

                        <figcaption v-if="step.titleImageCaption">
                            <span> {{ step.titleImageCaption }}</span>
                        </figcaption>

                        <figcaption v-if="step.titleImageCopyright">
                            <span> ©  {{ step.titleImageCopyright }}</span>
                        </figcaption>
                    </figure>
                    <div
                        class="story-player-content"
                    >
                        <div
                            v-html="step.loadedContent"
                        />
                    </div>
                </div>
            </div>
            <div />
        </div>
    </div>
</template>

<style lang="scss">
#story-player {
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
        margin: 10px 0;
        background-color: rgb(195, 195, 195) !important;
        box-shadow: 0 4px 8px 0 rgb(0 0 0 / 50%);
        opacity: 0.3;
        position: relative;
        scroll-margin-top: 50px;

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
                    color: var(--DipasColorsFont, #212529);
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
                    width: 100% !important;
                    height: 100% !important;
                }
            }
        }

        &.active {
            background-color: white !important;
            opacity: 1;
        }
    }
}
</style>
