<script>
import {mapGetters, mapActions} from "vuex";
import layerCollection from "@core/layers/js/layerCollection.js";
import thousandsSeparator from "@shared/js/utils/thousandsSeparator";
import mouseOverCotentLivingLocation from "../utils/mouseOverContent.js";
import {optimizeValueRootedInComplexType} from "../utils/complexType.js";

export default {
    name: "BildungsatlasThemeSchulenWohnort",
    props: {
        /**
         * Checks if the given tab name is currently active.
         * @param {String} tab The tab name.
         * @returns {Boolean} True if the given tab name is active.
         */
        isActiveTab: {
            type: Function,
            required: true
        },

        /**
         * Translates the given key, checks if the key exists and throws a console warning if not.
         * @param {String} key The key to translate.
         * @param {Object} [options=null] Options for interpolation, formatting, and plurals.
         * @returns {String} The translation or the key itself on error.
         */
        translate: {
            type: Function,
            required: true
        },

        /**
         * Parses the text containing HTML tags into an HTML format.
         * @param {String} str The text to parse.
         * @returns {String} The formatted HTML text.
         */
        parseTranslationInHtml: {
            type: Function,
            required: true
        },

        /**
         * The currently selected feature.
         */
        feature: {
            type: Object,
            required: true
        },

        /**
         * The featureType of the current layer.
         */
        featureType: {
            type: String,
            required: true
        },

        /**
         * The properties of the feature as a key-value object.
         */
        properties: {
            type: Object,
            required: true
        },

        /**
         * The Bildungsatlas API object to access WFS data.
         */
        api: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            schoolLevels: {
                "de.hh.up:einzug_einzugsgebiete_primarstufe": "Primarstufe",
                "de.hh.up:einzug_einzugsgebiete_sekundarstufe": "Sekundarstufe I"
            },
            schoolNumbers: {
                "de.hh.up:einzug_einzugsgebiete_primarstufe": "anzahl_sus_primarstufe",
                "de.hh.up:einzug_einzugsgebiete_sekundarstufe": "anzahl_sus_sekundarstufe"
            },
            layerNameCorrelation: {
                "de.hh.up:einzug_einzugsgebiete_primarstufe": "internal Layer for primary schule am wohnort",
                "de.hh.up:einzug_einzugsgebiete_sekundarstufe": "internal Layer for middle schule am wohnort"
            },
            schoolLevelTitle: "",
            numberOfStudentsInDistrictFormated: 0,
            statgebId: "",
            stadtteilName: "",
            featureIds: [],
            infoText: "",
            layerSchools: null
        };
    },
    computed: {
        ...mapGetters([
            "isMobile",
            "allLayerConfigs"
        ]),

        /**
         * Retrieves the theme of the current layer.
         * @returns {Object|String} The GFI theme object or an empty string.
         */
        getGfiTheme () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getTheme) {
                return this.feature.getTheme();
            }
            return "";
        },

        /**
         * Retrieves the ID of the current layer.
         * @returns {String} The GFI ID.
         */
        getGfiId () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getId) {
                return this.feature.getId();
            }
            return "";
        },

        /**
         * Retrieves the title or name of the current layer.
         * @returns {String} The name of the layer.
         */
        getName () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getTitle) {
                return this.feature.getTitle();
            }
            return "";
        }
    },
    watch: {
        /**
         * Watches for property changes to refresh the GFI content cleanly.
         * @param {Object} newVal The new properties object.
         * @param {Object} oldVal The previous properties object.
         * @returns {void}
         */
        properties (newVal, oldVal) {
            if (oldVal) {
                this.reset(oldVal);
            }
            if (newVal) {
                this.refreshGfi();
            }
        },

        /**
         * Watches the featureIds array and updates layer visibility when populated.
         * @param {String[]} val Array of feature IDs.
         * @returns {void}
         */
        featureIds (val) {
            if (val && val.length) {
                if (this.layerSchools) {
                    if (typeof this.layerSchools.set === "function") {
                        this.layerSchools.set("isSelected", true);
                    }
                    else if (typeof this.layerSchools.setVisible === "function") {
                        this.layerSchools.setVisible(true);
                    }
                }
                this.showFeaturesByIds(this.layerSchools, val);
            }
        }
    },
    mounted () {
        this.refreshGfi();
    },
    beforeUnmount: function () {
        this.reset(null);
    },
    methods: {
        ...mapActions("Maps", ["addLayerById"]),

        /**
         * Refreshes the GFI content based on the current feature type and properties.
         * @returns {void}
         */
        refreshGfi () {
            let themeType = "";

            this.statgebId = this.properties?.statgeb_id ? this.properties.statgeb_id : "";
            this.stadtteilName = this.properties?.stadtteil_name ? this.properties.stadtteil_name : "";

            if (this.featureType !== "") {
                this.schoolLevelTitle = this.schoolLevels[this.featureType];
                themeType = this.featureType === "de.hh.up:einzug_einzugsgebiete_primarstufe" ? "primary" : "secondary";
            }

            if (this.statgebId !== "") {
                this.api.getValueStatistischeGebiete(this.schoolNumbers[this.featureType], this.statgebId, value => {
                    this.numberOfStudentsInDistrictFormated = value !== undefined ? thousandsSeparator(value) : 0;
                }, error => {
                    console.error(error);
                });
            }

            const layerStatisticAreas = this.getLayerStatisticAreas();

            if (this.getGfiId !== "") {
                this.showFeaturesByIds(layerStatisticAreas, [this.getGfiId]);
            }

            this.getActiveSchoolLayer();

            if (this.layerSchools) {
                const olLayer = typeof this.layerSchools.getSource === "function" ? this.layerSchools : this.layerSchools.get("layer"),
                      source = olLayer?.getSource();

                if (source) {
                    source.on("featuresloadend", this.getActiveSchoolLayer);
                }
            }

            this.infoText = this.parseTranslationInHtml(this.translate("additional:addons.gfiThemes.bildungsatlas.schulenWohnort.info." + themeType));
        },

        /**
         * Shows the features of the area layer and hides school layers, resetting the state.
         * @param {Object} [feature] The feature to be reset.
         * @returns {void}
         */
        reset (feature) {
            const layerStatisticAreas = this.getLayerStatisticAreas(feature),
                  layerSchools = this.layerSchools;

            this.showAllFeatures(layerStatisticAreas);

            if (layerSchools) {
                this.showAllFeatures(layerSchools);

                if (typeof layerSchools.set === "function") {
                    layerSchools.set("isSelected", false);
                }
                else if (typeof layerSchools.setVisible === "function") {
                    layerSchools.setVisible(false);
                }

                const olLayer = typeof layerSchools.getSource === "function" ? layerSchools : layerSchools.get("layer"),
                      source = olLayer?.getSource();

                if (source) {
                    source.un("featuresloadend", this.getActiveSchoolLayer);
                }
            }
        },

        /**
         * Returns the statistical areas layer from the layer collection.
         * @param {ol/Feature} feature The feature to check for theme/title overrides.
         * @returns {ol/layer/Layer|Boolean} The areas layer or false if not found.
         */
        getLayerStatisticAreas (feature) {
            let gfiTheme = this.getGfiTheme,
                gfiName = this.getName;

            if (feature && typeof feature === "object") {
                if (feature?.getTheme) {
                    gfiTheme = feature.getTheme();
                }
                if (feature?.getTitle) {
                    gfiName = feature.getTitle();
                }
            }

            const targetThemeName = typeof gfiTheme === "object" ? gfiTheme.name : gfiTheme,
                  allLayers = layerCollection.getLayers(),
                  matchingLayers = allLayers.filter(layer => {
                      const lTheme = layer.get("gfiTheme"),
                            lThemeName = typeof lTheme === "object" ? lTheme.name : lTheme;

                      return lThemeName === targetThemeName && layer.get("name") === gfiName;
                  });

            if (!matchingLayers || matchingLayers.length === 0) {
                return false;
            }

            return matchingLayers[0];
        },

        /**
         * Requests the configuration from Vuex and creates the school layer if needed.
         * @returns {ol/layer/Layer|Boolean} The layer of schools or false if not found.
         */
        getLayerSchools () {
            const layerName = this.layerNameCorrelation[this.featureType],
                  configs = this.allLayerConfigs || [],
                  conf = configs.find(c => c.name === layerName),
                  allLayers = layerCollection.getLayers();

            let layer = allLayers.find(l => l.get("name") === layerName);

            if (!layer && conf && conf.id) {
                this.addLayerById(conf.id);
                layer = layerCollection.getLayerById(conf.id);

                if (layer && typeof layer.set === "function") {
                    layer.set("isSelected", true);
                }
                else if (layer && typeof layer.setVisible === "function") {
                    layer.setVisible(true);
                }
            }

            return layer;
        },

        /**
         * Hides all features in the given layer except the specified IDs and attaches mouseover code.
         * @param {ol/layer/Layer} layer The layer to be filtered.
         * @param {String[]} featureIds Array of feature IDs to keep visible.
         * @returns {void}
         */
        showFeaturesByIds (layer, featureIds) {
            const schoolLevelTitle = this.schoolLevelTitle;
            let schools;

            if (featureIds.length && layer) {
                const isSelected = typeof layer.get === "function" ? layer.get("isSelected") : layer.getVisible();

                if (isSelected && typeof layer.showFeaturesByIds === "function") {
                    layer.showFeaturesByIds(featureIds);

                    const olLayer = typeof layer.getSource === "function" ? layer : layer.get("layer");

                    if (olLayer && olLayer.getSource()) {
                        schools = olLayer.getSource().getFeatures();
                        this.addHtmlMouseHoverCode(schools, schoolLevelTitle);
                    }
                }
            }
        },

        /**
         * Creates an array of feature IDs to be selected by the model based on the area number.
         * @param {ol/Feature[]} schools An array of school features to check.
         * @param {String} statGebNr The urban area number based on the feature properties.
         * @returns {String[]} Array of valid feature IDs.
         */
        getFeatureIds (schools, statGebNr) {
            const featureIds = [],
                  schoolAssoc = {};

            if (!Array.isArray(schools)) {
                return featureIds;
            }

            if (statGebNr !== "") {
                schools.forEach(school => {
                    const id = school.get("schul_id").split("-").shift();

                    if (!Object.prototype.hasOwnProperty.call(schoolAssoc, id)) {
                        schoolAssoc[id] = [];
                    }
                    schoolAssoc[id].push(school);
                });

                this.api.getEinzugsgebieteValue(this.featureType, "statgeb_id", statGebNr, value => {
                    if (Array.isArray(value) && value.length) {
                        value.forEach(data => {
                            const id = data.get("schule_id"),
                                  schoolList = Object.prototype.hasOwnProperty.call(schoolAssoc, id) ? schoolAssoc[id] : false;

                            if (Array.isArray(schoolList)) {
                                schoolList.forEach(school => {
                                    school.set("anzahl_sus_schule_stageb", data.get("anzahl_sus_schule_stageb") ? data.get("anzahl_sus_schule_stageb") : "");
                                    school.set("anzahl_sus_stageb", data.get("anzahl_sus_stageb") ? data.get("anzahl_sus_stageb") : "");
                                    school.set("anteil_sus_schule_stageb_an_anzahl_sus_stageb", data.get("anteil_sus_schule_stageb_an_anzahl_sus_stageb") ? data.get("anteil_sus_schule_stageb_an_anzahl_sus_stageb") : "");
                                    school.set("anzahl_sus_schule", data.get("anzahl_sus_schule") ? data.get("anzahl_sus_schule") : "");
                                    school.set("schueleranzahl_all", this.getTotalNumber(school.get("anzahl_schueler_gesamt") ? school.get("anzahl_schueler_gesamt") : null));

                                    featureIds.push(school.getId());
                                });
                            }
                        });
                    }
                }, error => {
                    console.error(error);
                });
            }

            return featureIds;
        },

        /**
         * Extracts the total number of students from a potentially mixed string.
         * @param {String} val The attribute text from properties.
         * @returns {String} The extracted total number.
         */
        getTotalNumber: function (val) {
            if (typeof val === "string") {
                return val.split(" ").shift();
            }
            return val;
        },

        /**
         * Shows all features in the given layer (removes any active filters).
         * @param {ol/layer/Layer} layer The layer to be fully displayed.
         * @returns {void}
         */
        showAllFeatures (layer) {
            if (layer) {
                const isSelected = typeof layer.get === "function" ? layer.get("isSelected") : layer.getVisible();

                if (isSelected && typeof layer.showAllFeatures === "function") {
                    layer.showAllFeatures();
                }
            }
        },

        /**
         * Activates selected features of the school layer and triggers the generation of HTML data for hover tooltips.
         * @returns {void}
         */
        getActiveSchoolLayer: function () {
            const statGebNr = this.statgebId,
                  layerSchools = this.getLayerSchools();

            let schools = [];

            if (layerSchools) {
                const olLayer = typeof layerSchools.getSource === "function" ? layerSchools : layerSchools.get("layer");

                if (olLayer && olLayer.getSource()) {
                    schools = olLayer.getSource().getFeatures();
                }
            }

            this.layerSchools = layerSchools;
            this.featureIds = this.getFeatureIds(schools, statGebNr);
        },

        /**
         * Prepares the data object required by the mouse hover template.
         * @param {Object} school The OpenLayers Feature representing the school.
         * @param {String} schoolLevelTitle The configured title for the school level.
         * @returns {Object} The data object mapped to template placeholders.
         */
        getDataForMouseHoverTemplate (school, schoolLevelTitle) {
            const data = {
                schoolLevelTitle: schoolLevelTitle,
                schoolName: "",
                address: {
                    street: "",
                    city: ""
                },
                numberOfStudents: "",
                numberOfStudentsPrimary: "",
                percentageOfStudentsFromDistrict: 0,
                numberOfStudentsFromDistrict: 0
            };

            if (school && typeof school.get === "function") {
                data.schoolName = school.get("schulname");
                data.address.street = school.get("adresse_strasse_hausnr");
                data.address.city = school.get("adresse_ort");
                data.numberOfStudents = school.get("schueleranzahl_all");
                data.numberOfStudentsStep = school.get("anzahl_sus_schule");
                data.percentageOfStudentsFromDistrict = optimizeValueRootedInComplexType(school.get("anteil_sus_schule_stageb_an_anzahl_sus_stageb"), 0);
                data.numberOfStudentsFromDistrict = school.get("anzahl_sus_schule_stageb");
            }

            return data;
        },

        /**
         * Attaches HTML mouse hover code to all provided school features.
         * @param {ol/Feature[]} schools Array of school features to process.
         * @param {String} schoolLevelTitle The configured title for the school level.
         * @returns {void}
         */
        addHtmlMouseHoverCode: function (schools, schoolLevelTitle) {
            let attr;

            schools.forEach(school => {
                attr = this.getDataForMouseHoverTemplate(school, schoolLevelTitle);
                school.set("schulenWohnort", mouseOverCotentLivingLocation(attr));
            });
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
                            {{ translate("additional:addons.gfiThemes.bildungsatlas.schulenWohnort.statgeb") }}: {{ statgebId }}<br>({{ stadtteilName }})
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><b> {{ translate("additional:addons.gfiThemes.bildungsatlas.schulenWohnort.countInArea") }} {{ schoolLevelTitle }}: </b></td>
                        <td>{{ numberOfStudentsInDistrictFormated }}</td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td
                            v-if="isMobile"
                            colspan="2"
                        >
                            <i>{{ translate("additional:addons.gfiThemes.bildungsatlas.schulenWohnort.hintMobile") }}</i>
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
    table {
        margin-bottom: 0;
    }
}
</style>

<style lang="scss">
.schulWohnort {
    table {
        max-width: 420px;

        tbody {
            tr {
                td {
                    font-weight: bold;
                    &:last-child {
                        text-align: right;
                    }
                }
            }
        }
    }
}
</style>
