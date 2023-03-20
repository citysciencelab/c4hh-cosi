<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import mutations from "../store/mutationsOktagonKartenportal";
import ToolTemplate from "../../../src/modules/tools/ToolTemplate.vue";
import {getComponent} from "../../../src/utils/getComponent";
import {extractEventCoordinates} from "../../../src/utils/extractEventCoordinates";
import findWhereJs from "../../../src/utils/findWhereJs";

export default {
    name: "OktagonKartenportal",
    components: {
        ToolTemplate
    },
    computed: {
        ...mapGetters("Tools/OktagonKartenportal", [
            "active",
            "deactivateGFI",
            "icon",
            "layerIds",
            "name",
            "submitURL",
            "resizableWindow",
            "renderToWindow",
            "submitObject",
            "zoomLevel"])
    },
    mounted () {
        this.registerListener({type: "click", listener: this.onMapClick});
        this.$nextTick(() => {
            this.initURLParameter();
        });
    },
    created () {
        this.$on("close", this.close);
    },
    methods: {
        ...mapMutations("Tools/OktagonKartenportal", Object.keys(mutations)),
        ...mapActions("Maps", ["setCenter", "setZoomLevel", "registerListener"]),
        ...mapActions("MapMarker", ["placingPointMarker"]),
        ...mapActions("Tools/OktagonKartenportal", ["requestALKISWMS", "initURLParameter", "addCoordinatesToSubmitObject", "parseXML"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
        * Hides the sidebar.
        * @returns {void}
        */
        close () {
            this.setActive(false);

            const model = getComponent(this.$store.state.Tools.OktagonKartenportal);

            if (model) {
                model.set("isActive", false);
            }
        },
        /**
        * OnMapClick Shows the sidebar with it parameters
        * @param {Event} evt the click event
        * @fires Sidebar#RadioTriggerSidebarToggle
        * @returns {void}
        */
        async onMapClick (evt) {
            const coord = extractEventCoordinates(evt.coordinate);

            this.setCenter(coord);
            this.setZoomLevel(this.zoomLevel);
            this.setActive(true);
            this.placingPointMarker(coord);
            this.addCoordinatesToSubmitObject(coord);
            for (const layerId of this.layerIds) {
                const layerModel = Radio.request("ModelList", "getModelByAttributes", {id: layerId}),
                    resolution = findWhereJs(mapCollection.getMapView("2D").get("options"), {resolution: mapCollection.getMapView("2D").getConstrainedResolution(mapCollection.getMapView("2D").getResolution())}).resolution,
                    projection = mapCollection.getMapView("2D").getProjection(),
                    url = layerModel.get("layerSource").getFeatureInfoUrl(coord, resolution, projection, {INFO_FORMAT: "text/xml", STYLES: ""});

                await this.requestALKISWMS(url);
            }
            this.setFocusToFirstControl();
        },
        /**
        * Opens the submit url in the same window
        * @returns {void}
        */
        async onSubmit () {
            window.open(await this.submitURL, "_self");
        },
        /**
        * Sets the focus to the close.
        * @returns {void}
        */
        setFocusToFirstControl () {
            this.$nextTick(() => {
                if (this.$refs.oktagonSubmitButton) {
                    this.$refs.oktagonSubmitButton.focus();
                }
            });
        }
    }
};
</script>

<template lang="html">
    <ToolTemplate
        :title="$t(name)"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template #toolBody>
            <div
                v-if="active"
                id="oktagonKartenportal"
            >
                <table
                    v-if="Object.keys(submitObject).length > 0"
                    class="table table-condensed table-hover"
                >
                    <tbody>
                        <tr
                            v-for="(value, key) in submitObject"
                            :key="key"
                        >
                            <td>
                                {{ key }}
                            </td>
                            <td>
                                {{ value }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="form-group form-group-sm row">
                <div class="col-md-6">
                    <button
                        id="oktagonCloseButton"
                        type="button"
                        class="btn btn-secondary col-md-12"
                        @click="close"
                    >
                        {{ $t("additional:modules.tools.oktagon.cancel") }}
                    </button>
                </div>
                <div class="col-md-6">
                    <button
                        id="oktagonSubmitButton"
                        ref="oktagonSubmitButton"
                        type="button"
                        class="btn btn-primary col-md-12"
                        @click="onSubmit"
                    >
                        {{ $t("additional:modules.tools.oktagon.send") }}
                    </button>
                </div>
            </div>
        </template>
    </ToolTemplate>
</template>
