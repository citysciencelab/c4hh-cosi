<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import DipasPlayer from "./DipasPlayer.vue";
import fetchDataFromUrl from "../../utils/getStoryFromUrl";
import getters from "../../store/gettersDataNarrator";
import mutations from "../../store/mutationsDataNarrator";

export default {
    name: "StoryPlayer",
    components: {
        DipasPlayer
    },
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
            currentStepIndex: 0,
            loadedContent: null,
            isHovering: null,
            isChangeFrom3D: false,
            showMode: "",
            steps: [],
            activeTools: [],
            interval: null
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
    },
    beforeUnmount () {
        // Hides all story layers
        const layerList = typeof this.layerConfigsByAttributes === "function"
            ? this.layerConfigsByAttributes({showInLayerTree: true})
            : [];

        for (const layer of layerList) {
            const isStepLayer = (
                (this.currentStep && this.currentStep.layers) ||
                []
            ).includes(layer.attributes.id);

            if (isStepLayer && layer.attributes.isVisibleInMap) {
                this.disableLayer(layer);
            }
        }
    },
    methods: {
        ...mapMutations("Modules/DataNarrator", Object.keys(mutations)),
        ...mapMutations("Menu", ["setExpandedBySide"]),
        ...mapActions("Maps", ["changeMapMode"]),
        ...mapActions(["replaceByIdInLayerConfig"]),
        ...mapActions("Menu", ["changeCurrentComponent", "resetMenu"]),
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
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="storyConf !== undefined && storyConf.steps && currentStep"
        id="tool-dataNarrator-player"
    >
        <DipasPlayer
            v-if="showMode === 'dipas'"
            :story-conf-path="storyConfPath"
            :steps="steps"
            :steps-objects="stepsCopy"
            :is-mobile-device="isMobileDevice"
            :screen-orientation-type="screenOrientationType"
            @change="currentStepIndex = $event"
        />

        <p
            v-else
            class="tool-dataNarrator-content"
        >
            {{ $t("additional:modules.dataNarrator.noPlayerAvailable") }}
        </p>
    </div>
</template>

<style lang="scss">
#tool-dataNarrator-player {
    .tool-dataNarrator-content {
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
}
</style>
