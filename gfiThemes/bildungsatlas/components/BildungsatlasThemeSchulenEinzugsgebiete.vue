<script>
import {mapGetters} from "vuex";
import {optimizeValueRootedInComplexType} from "../../../utils/complexType.js";

export default {
    name: "BildungsatlasThemeSchulenEinzugsgebiete",
    props: {
        /**
         * checks if the given tab name is currently active
         * @param {String} tab the tab name
         * @returns {Boolean}  true if the given tab name is active
         */
        isActiveTab: {
            type: Function,
            required: true
        },

        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate: {
            type: Function,
            required: true
        },

        /**
         * Parsing the text with Html Tags into Html Format
         * @param {String} str the text
         * @returns {String} html format text
         */
        parseTranslationInHtml: {
            type: Function,
            required: true
        },

        feature: {
            type: Object,
            required: true
        },

        /**
         * the featureType of current layer
         */
        featureType: {
            type: String,
            required: true
        },

        /**
         * the properties as a key value object
         */
        properties: {
            type: Object,
            required: true
        },
        /**
         * the BildungsatlasApi to access data via wfs with
         */
        api: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            name: "",
            address: "",
            countStudents: "",
            countStudentsPrimary: "",
            countStudentsSecondary: "",
            layernameAreas: "Einzugsgebiete",
            layerStatistischeGebiete: {},
            areaInfo: [],
            infoText: ""
        };
    },
    computed: {
        ...mapGetters({
            isMobile: "mobile"
        }),

        // The Theme of current layer
        getGfiTheme () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getTheme) {
                return this.feature.getTheme();
            }

            return {};
        },

        // The id of current layer
        getGfiId () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getId) {
                return this.feature.getId();
            }

            return "";
        },

        // The title/name of current layer
        getName () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getTitle) {
                return this.feature.getTitle();
            }

            return "";
        },

        hintText () {
            if (this.isMobile) {
                return this.translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.hintMobile");
            }

            return this.translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.hintText");
        }
    },
    watch: {
        /**
         * When feature is changed, the event will be triggered
         * @param {Object} newVal - the new feature
         * @param {Object} oldVal - the old feature
         * @returns {Void} -
         */
        feature: function (newVal, oldVal) {
            if (oldVal) {
                this.reset(oldVal);
                this.refreshGfi();
            }
        },

        areaInfo: function (newVal) {
            if (newVal) {
                this.filterAreasById(this.layerStatistischeGebiete);
            }
        }
    },

    mounted () {
        this.refreshGfi();
    },
    beforeDestroy: function () {
        this.reset(null);
    },
    methods: {

        /**
         * Sets this GFI
         * @listens Layer#RadioTriggerLayerFeaturesLoaded
         * @returns {void}
         */
        refreshGfi: function () {
            if (!this.properties || typeof this.properties !== "object") {
                return;
            }

            this.getGfiContent(this.properties);
            this.layerStatistischeGebiete = this.getStatisticAreasLayer();

            const layerEinzugsgebiete = this.getEinzugsgebieteLayer();

            Backbone.Events.listenTo(Radio.channel("VectorLayer"), {
                "featuresLoaded": this.onFeaturesLoadedEvent
            });

            if (layerEinzugsgebiete) {
                this.filterFeature(layerEinzugsgebiete, [this.getGfiId]);
            }
            else {
                console.warn("Missing data for school filter");
            }

            if (this.layerStatistischeGebiete) {
                this.filterAreasById(this.layerStatistischeGebiete);
            }
            else {
                console.warn("Missing data for area filter");
            }

            this.infoText = this.parseTranslationInHtml(this.translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.info"));
        },

        /**
         * Filters the areas by schoolId
         * @param   {ol/layer/Layer} layer Layer with statistical areas
         * @returns {Void} -
         */
        filterAreasById: function (layer) {
            const areas = layer.get("layer").getSource().getFeatures(),
                featureIds = [];

            areas.forEach(area => {
                this.areaInfo.forEach(val => {
                    if (area.get("statgeb_id") === val.statgeb_id) {
                        // remember ids of areas with influence of school
                        featureIds.push(area.getId());
                        area.set("einzugsgebiete", optimizeValueRootedInComplexType(val.anteil_sus_schule_stageb_an_anzahl_sus_schule));
                        area.set("einzugsGebieteStatistik", this.getMouseoverText(optimizeValueRootedInComplexType(val.anteil_sus_schule_stageb_an_anzahl_sus_schule), val.anzahl_sus_schule_stageb));
                    }
                });
            });

            layer.setIsSelected(true);
            this.filterFeature([layer], featureIds);
        },

        /**
         * Fired only once when layer of statistical areas is loaded initially to filter areas
         * @param   {String} layerId  layerId that was loaded
         * @returns {Void} -
         */
        onFeaturesLoadedEvent: function (layerId) {
            const conf = this.getStatisticAreasConfig(),
                layerStatistischeGebiete = this.getStatisticAreasLayer(),
                countStudents = this.countStudents;

            if (layerId === conf.id) {
                if (layerStatistischeGebiete && countStudents !== "") {
                    this.filterAreasById(layerStatistischeGebiete, countStudents);
                }
                else {
                    console.warn("Missing data for area filter");
                }
            }
        },

        /**
         * returns  the text as hover ionformation
         * @param   {Number} propertion the propertion of students in this area from current school
         * @param   {String} count the count of students in this area from current school
         * @returns {String} Mouseover text
         */
        getMouseoverText: function (propertion, count) {
            return "Anteil " + propertion.toFixed(2) + "% (Anzahl: " + count + ")";
        },

        /**
         * parses the gfiContent and sets all variables
         * @param {Object} properties gfi properties
         * @returns {void}
         */
        getGfiContent: function (properties) {
            const schulId = properties.schul_id ? properties.schul_id.split("-").shift() : "",
                featureTypes = ["de.hh.up:einzug_einzugsgebiete_primarstufe", "de.hh.up:einzug_einzugsgebiete_sekundarstufe"];

            this.name = properties.schulname ? properties.schulname : "";
            this.address = properties.adresse_strasse_hausnr && properties.adresse_ort ? properties.adresse_strasse_hausnr + ", " + properties.adresse_ort : "";
            this.countStudents = this.getTotalNumber(properties.anzahl_schueler_gesamt ? properties.anzahl_schueler_gesamt : null);

            if (schulId === "") {
                return;
            }

            this.parseEinzugsGebieteLayer(this.featureType, featureTypes, schulId);
        },

        /**
         * Get the total number of students
         * @param {String} val the attribute text from properties
         * @returns {string} total number
         */
        getTotalNumber: function (val) {
            if (typeof val === "string") {
                return val.split(" ").shift();
            }
            return val;
        },

        /**
         * parses the data from einzugsGebiete Layer
         * @param {String} currentFeatureType current Feature Type
         * @param {String[]} featureTypes the two feature types
         * @param {String} schulId the school Id
         * @returns {void}
         */
        parseEinzugsGebieteLayer: function (currentFeatureType, featureTypes, schulId) {
            featureTypes.forEach(featureType => {
                this.api.getEinzugsgebieteValue(featureType, "schule_id", schulId, value => {
                    if (Array.isArray(value) && value.length) {
                        value.forEach(data => {
                            if (featureType === "de.hh.up:einzug_einzugsgebiete_primarstufe") {
                                this.countStudentsPrimary = data.get("anzahl_sus_schule") ? data.get("anzahl_sus_schule") : 0;
                            }
                            else {
                                this.countStudentsSecondary = data.get("anzahl_sus_schule") ? data.get("anzahl_sus_schule") : 0;
                            }

                            const areaInfo = {
                                "statgeb_id": data.get("statgeb_id") ? data.get("statgeb_id") : "",
                                "anzahl_sus_schule_stageb": data.get("anzahl_sus_schule_stageb") ? data.get("anzahl_sus_schule_stageb") : "",
                                "anteil_sus_schule_stageb_an_anzahl_sus_schule": data.get("anteil_sus_schule_stageb_an_anzahl_sus_schule") ? data.get("anteil_sus_schule_stageb_an_anzahl_sus_schule") : ""
                            };

                            this.areaInfo.push(areaInfo);
                        });
                    }
                    else if (featureType === "de.hh.up:einzug_einzugsgebiete_primarstufe") {
                        this.countStudentsPrimary = 0;
                    }
                    else {
                        this.countStudentsSecondary = 0;
                    }
                }, error => {
                    console.error(error);
                });
            });
        },

        /**
         * requests the Modellist for all layer of einzugsgebiete
         * @param {Object} feature - the feature to be reset
         * @fires Core.ModelList#RadioRequestModelListGetModelsByAttributes
         * @returns {(ol/layer/Layer[]|Boolean)} layers
         */
        getEinzugsgebieteLayer: function (feature) {
            let layers = [],
                gfiTheme = this.getGfiTheme,
                gfiName = this.getName;

            if (feature && typeof feature === "object") {
                if (feature?.getTheme) {
                    gfiTheme = feature.getTheme();
                }
                if (feature?.getTitle) {
                    gfiName = feature.getTitle();
                }
            }

            layers = Radio.request("ModelList", "getModelsByAttributes", {"gfiTheme": gfiTheme, "name": gfiName});

            if (!layers || layers.length === 0) {
                console.warn("No layer configuration with gfiTheme: schulenEinzugsgebiete");

                return false;
            }

            return layers;
        },

        /**
         * Requests the Modellist for layer with layernameAreas. If necessary this function starts its creation.
         * @fires Core.ModelList#RadioRequestModelListGetModelByAttributes
         * @returns {(ol/layer/Layer[]|Boolean)} layers
         */
        getStatisticAreasLayer: function () {
            let layer = Radio.request("ModelList", "getModelByAttributes", {"name": this.layernameAreas});

            if (!layer) {
                const conf = this.getStatisticAreasConfig();

                if (!conf) {
                    console.warn("Cannot create layer without config.");

                    return false;
                }
                layer = this.addStatisticAreasLayer(conf);
            }

            return layer;
        },

        /**
         * Requests the Parser for first layer with statistic areas by name
         * @fires Core.ConfigLoader#RadioRequestParserGetItemByAttributes
         * @returns {(Item|Boolean)} conf
         */
        getStatisticAreasConfig: function () {
            const conf = Radio.request("Parser", "getItemByAttributes", {"name": this.layernameAreas});

            if (!conf) {
                console.warn("No layer configuration with name: " + this.layernameAreas);

                return false;
            }

            return conf;
        },

        /**
         * Creates new layer by given configuration
         * @param {Object} conf layer configuration
         * @fires Core.ModelList#RadioRequestModelListGetModelByAttributes
         * @fires Core.ModelList#RadioTriggerModelListAddModelsByAttributes
         * @returns {ol/layer/Layer} Layer
         */
        addStatisticAreasLayer: function (conf) {
            Radio.trigger("ModelList", "addModelsByAttributes", {id: conf.id});
            const layer = Radio.request("ModelList", "getModelByAttributes", {id: conf.id});

            layer.setIsSelected(true);

            return layer;
        },

        /**
         * Hide all features in all given layers except all features with given id
         * @param   {Layer[]} layers  Layers filtered by gfiTheme
         * @param   {String[]} featureIds Array of feature Id to keep
         * @returns {Void} -
         */
        filterFeature: function (layers, featureIds) {
            layers.forEach(function (layer) {
                if (layer.get("isSelected")) {
                    layer.showFeaturesByIds(featureIds);
                }
            });
        },

        /**
         * Show all features in all given layers
         * @param   {Layer[]} layers Layers to show
         * @returns {Void} -
         */
        unfilterFeature: function (layers) {
            layers.forEach(function (layer) {
                if (layer.get("isSelected")) {
                    layer.showAllFeatures();
                }
            });
        },

        /**
         * hide this GFI and resets all layer data
         * @param {Object} feature - the feature to be reset
         * @returns {Void} -
         */
        reset: function (feature) {
            const layerEinzugsgebiete = this.getEinzugsgebieteLayer(feature),
                layerStatistischeGebiete = this.getStatisticAreasLayer();

            if (layerEinzugsgebiete) {
                this.unfilterFeature(layerEinzugsgebiete);
            }

            if (layerStatistischeGebiete) {
                this.unfilterFeature([layerStatistischeGebiete]);
                layerStatistischeGebiete.setIsSelected(false);
            }

            Backbone.Events.stopListening(Radio.channel("VectorLayer"), "featuresLoaded");
        }
    }
};
</script>

<template>
    <div class="gfi-bildungsatlas-current-content">
        <div v-if="isActiveTab('data')">
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th colspan="2">
                            {{ name }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr colspan="2">
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.address") }}</td>
                        <td>{{ address }}</td>
                    </tr>
                    <tr colspan="2">
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.totalCount") }}</td>
                        <td>{{ countStudents }}</td>
                    </tr>
                    <tr colspan="2">
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.primaryCount") }}</td>
                        <td>{{ countStudentsPrimary }}</td>
                    </tr>
                    <tr colspan="2">
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.secondaryCount") }}</td>
                        <td>{{ countStudentsSecondary }}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="2">
                            <i>{{ hintText }}</i>
                        </td>
                    </tr>
                </tfoot>
            </table>
        </div>
        <div
            v-if="isActiveTab('info')"
            class="gfi-info"
            v-html="infoText"
        />
    </div>
</template>

<style lang="scss" scoped>
.gfi-bildungsatlas-current-content {
    padding-bottom: 0 !important;

    table {
        table-layout: fixed;
        margin-bottom: 0;

        tbody {
            tr {
                td {
                    &:last-child {
                        text-align: right;
                    }
                }
            }
        }

        tfoot > tr > td {
            border-style: none;
        }
    }
}
</style>
