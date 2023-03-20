<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersSchoolRoutePlanning";
import mutations from "../store/mutationsSchoolRoutePlanning";
import actions from "../store/actionsSchoolRoutePlanning";

import ToolTemplate from "../../../src/modules/tools/ToolTemplate.vue";
import SchoolRoutePlanningAddress from "./SchoolRoutePlanningAddress.vue";
import RouteInformation from "./SchoolRoutePlanningRouteInformation.vue";
import Schools from "./SchoolRoutePlanningSchools.vue";
import ToggleCheckbox from "../../../src/share-components/toggleCheckbox/components/ToggleCheckbox.vue";

import {getComponent} from "../../../src/utils/getComponent";
import {addRouteFeatures, routeStyle} from "../utils/routeLayer";
import axios from "axios";

export default {
    name: "SchoolRoutePlanning",
    components: {
        ToolTemplate,
        SchoolRoutePlanningAddress,
        RouteInformation,
        Schools,
        ToggleCheckbox
    },
    data () {
        return {
            layer: null
        };
    },
    computed: {
        ...mapGetters("Tools/SchoolRoutePlanning", Object.keys(getters)),

        /**
         * Checks if a route is calculated.
         * @returns {Boolean} Route is calculated.
         */
        routeIsCalculated () {
            return Object.keys(this.routeElements).length <= 0;
        },

        /**
         * Checks if a school or address has been input.
         * @returns {Boolean} Input exist.
         */
        inputExists () {
            return !(this.selectedSchoolNumber !== "" || this.inputAddress !== "");
        },
        /**
         * Returns if the print file is ready for download or not
         * @returns {Boolean} File ready
         */
        showPrintFileReady () {
            return this.$store.state.Tools.Print.printFileReady;
        },
        /**
         * Returns the files download url for the link
         * @returns {string} url
         */
        fileDownloadUrl () {
            return this.$store.state.Tools.Print.fileDownloadUrl;
        },
        /**
         * Returns the file name for the download
         * @returns {String} File name
         */
        filename () {
            return this.$store.state.Tools.Print.filename;
        },
        /**
         * Returns if the print was started for the progress bar
         * @returns {Boolean} print started
         */
        printStarted () {
            return this.$store.state.Tools.Print.printStarted;
        },
        /**
         * Returns the progress bar width
         * @returns {string} progress bar width
         */
        progressWidth () {
            return this.$store.state.Tools.Print.progressWidth;
        },
        /**
         * Returns progress in percent
         * @returns {string} like "30 %"
         */
        progress () {
            return this.progressWidth.split(":")[1].trimStart();
        }
    },
    watch: {
        /**
         * set focus, if the tool is activated (active === true).
         * @param {Boolean} value Value deciding whether the tool gets activated or deactivated.
         * @returns {void}
         */
        active (value) {
            if (value) {
                this.setFocusToFirstControl();
            }
        },
        /**
         * Shows the route in the map.
         * @param {ol/MultiLineString|null} value The geometry of the route.
         * @returns {void}
         */
        routeGeometry (value) {
            if (value !== null) {
                this.setGeometryByFeatureId({
                    id: "route",
                    source: this.layer.getSource(),
                    geometry: value
                });
            }
        }
    },
    created () {
        this.$on("close", this.close);

        this.addSchools();
        this.initializeLayer();
    },
    mounted () {
        this.setGazetteerUrl();
    },
    methods: {
        ...mapMutations("Tools/SchoolRoutePlanning", Object.keys(mutations)),
        ...mapActions("Tools/SchoolRoutePlanning", Object.keys(actions)),

        /**
         * Sets the focus to the first control
         * @returns {void}
         */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs.input) {
                    this.$refs.input.focus();
                }
            });
        },
        /**
         * Downloads the pdf for print
         * @param {Event} event the click event
         * @returns {void}
         */
        downloadFile (event) {
            event.preventDefault();
            const a = document.createElement("A");

            a.href = this.$store.state.Tools.Print.fileDownloadUrl;
            a.download = this.$store.state.Tools.Print.fileDownloadUrl.substr(this.$store.state.Tools.Print.fileDownloadUrl.lastIndexOf("/") + 1);
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        },
        /**
         * Closes this tool window by setting active to false.
         * Save in there current school number as initialSelectedSchoolNumber for reopen this tool.
         * @returns {void}
         */
        close () {
            this.setInitialSelectedSchoolNumber(this.selectedSchoolNumber);
            this.setSelectedSchoolNumber("");
            this.setActive(false);

            // The value "isActive" of the Backbone model is also set to false to change the CSS class in the menu (menu/desktop/tool/view.toggleIsActiveClass)
            const model = getComponent(this.id);

            if (model) {
                model.set("isActive", false);
            }
        },

        /**
         * Listens for the WFS to be loaded with the schools.
         * @returns {void}
         */
        addSchools () {
            Backbone.Events.listenTo(Radio.channel("VectorLayer"), {
                "featuresLoaded": (layerId, features) => {
                    if (layerId === this.layerId) {
                        this.setSchools(features);
                    }
                }
            });
        },

        /**
         * Initialize a layer with features and styles.
         * @returns {void}
         */
        async initializeLayer () {
            if (this.layer === null) {
                this.layer = await Radio.request("Map", "createLayerIfNotExists", this.layerName);
            }

            addRouteFeatures(this.layer.getSource());
            this.layer.setStyle(routeStyle);
        },

        /**
         * Resets the route layer and the user interface.
         * @returns {void}
         */
        resetLayerUserInterface () {
            this.layer.getSource().getFeatures().forEach(feature => feature.unset("geometry"));
            this.resetStateElements();
            this.$store.commit("Tools/Print/setPrintFileReady", false);
        },

        /**
         * Toggles the visibility of the toggle layers.
         * @param {Boolean} visible The visibility to be set.
         * @returns {void}
         */
        toggleLayer (visible) {
            this.toggleLayers.forEach(layer => {
                Radio.trigger("ModelList", "setModelAttributesById", layer, {
                    isSelected: visible,
                    isVisibleInMap: visible
                });
            });
        },
        /**
         * starts the print route.
         * @returns {void}
         */
        startPrintRoute () {
            this.printRoute(async (url, payload) => {
                return axios.post(url, payload);
            });
        }
    }
};
</script>

<template>
    <ToolTemplate
        :title="$t(name)"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
        :initial-width="initialWidth"
        :initial-width-mobile="initialWidthMobile"
    >
        <template #toolBody>
            <div
                v-if="active"
                class="content-school-route-planning"
            >
                <SchoolRoutePlanningAddress
                    v-if="layer !== null"
                    :layer="layer"
                />
                <Schools
                    v-if="layer !== null"
                    :layer="layer"
                />
                <div class="d-flex justify-content-between mb-3">
                    <label
                        class="form-label"
                        for="tool-schoolRoutePlanning-raster-checkbox"
                    >
                        {{ $t("additional:modules.tools.schoolRoutePlanning.transportNetwork") }}
                    </label>
                    <ToggleCheckbox
                        id="tool-schoolRoutePlanning-raster-checkbox"
                        ref="rasterCheckBox"
                        class="routing-checkbox-toggle-checkbox"
                        :text-on="$t('common:snippets.checkbox.on')"
                        :text-off="$t('common:snippets.checkbox.off')"
                        @change="toggleLayer"
                    />
                </div>
                <div class="mb-3">
                    <button
                        type="button"
                        class="btn btn-primary mr-3 tool-schoolRoutePlanning-button"
                        :disabled="routeIsCalculated"
                        @click="startPrintRoute"
                    >
                        {{ $t("additional:modules.tools.schoolRoutePlanning.printRouteName") }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-secondary tool-schoolRoutePlanning-button"
                        :disabled="inputExists"
                        @click="resetLayerUserInterface"
                    >
                        {{ $t("additional:modules.tools.schoolRoutePlanning.deleteRoute") }}
                    </button>
                </div>
                <div
                    v-if="printStarted"
                    class="progress mb-3"
                >
                    <div
                        class="progress-bar"
                        role="progressbar"
                        :style="progressWidth"
                        :aria-valuenow="progress.replace('%', '')"
                        aria-valuemin="0"
                        aria-valuemax="100"
                    >
                        {{ progress }}
                    </div>
                </div>
                <button
                    v-else-if="showPrintFileReady"
                    class="btn btn-secondary mb-3"
                    @click="downloadFile"
                >
                    {{ $t("common:modules.tools.print.downloadFile") }}
                </button>
            </div>
            <RouteInformation />
        </template>
    </ToolTemplate>
</template>

<style lang="scss" scoped>
    @import "~variables";

    .tool-schoolRoutePlanning-button {
        font-size: $font-size-base;
    }
</style>
