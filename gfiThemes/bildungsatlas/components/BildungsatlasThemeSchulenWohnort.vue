<script>
import {mapGetters} from "vuex";
import thousandsSeparator from "../../../../src/utils/thousandsSeparator.js";
import mouseOverCotentLivingLocation from "../utils/mouseOverContent.js";
import {optimizeValueRootedInComplexType} from "../../../utils/complexType.js";

export default {
    name: "BildungsatlasThemeSchulenWohnort",
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
            schoolLevels: {"de.hh.up:einzug_einzugsgebiete_primarstufe": "Primarstufe", "de.hh.up:einzug_einzugsgebiete_sekundarstufe": "Sekundarstufe I"},
            schoolNumbers: {"de.hh.up:einzug_einzugsgebiete_primarstufe": "anzahl_sus_primarstufe", "de.hh.up:einzug_einzugsgebiete_sekundarstufe": "anzahl_sus_sekundarstufe"},
            schoolLevelTitle: "",
            layerNameCorrelation: {"de.hh.up:einzug_einzugsgebiete_primarstufe": "internal Layer for primary schule am wohnort", "de.hh.up:einzug_einzugsgebiete_sekundarstufe": "internal Layer for middle schule am wohnort"},
            numberOfStudentsInDistrictFormated: 0,
            statgeb_id: 0,
            stadtteil_name: "",
            featureIds: [],
            infoText: ""
        };
    },
    computed: {
        ...mapGetters({
            isMobile: "mobile"
        }),

        // The id of current layer
        getGfiTheme () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getTheme) {
                return this.feature.getTheme();
            }

            return "";
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
        }
    },
    watch: {
        // when the gfi window is switched, the gfi is refreshed
        properties (oldVal) {
            if (oldVal) {
                this.reset(oldVal);
                this.refreshGfi();
            }
        },

        featureIds (val) {
            if (val && val.length) {
                if (this.layerSchools) {
                    this.layerSchools.setIsSelected(true);
                }
                this.showFeaturesByIds(this.layerSchools, val);
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
         * refreshes the gfi
         * @returns {void}
         */
        refreshGfi () {
            let themeType = "";

            this.statgeb_id = this.properties?.statgeb_id ? this.properties.statgeb_id : "";
            this.stadtteil_name = this.properties?.stadtteil_name ? this.properties.stadtteil_name : "";

            if (this.featureType !== "") {
                this.schoolLevelTitle = this.schoolLevels[this.featureType];
                themeType = this.featureType === "de.hh.up:einzug_einzugsgebiete_primarstufe" ? "primary" : "secondary";
            }

            if (this.statgeb_id !== "") {
                this.api.getValueStatistischeGebiete(this.schoolNumbers[this.featureType], this.statgeb_id, value => {
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

            Backbone.Events.listenTo(Radio.channel("VectorLayer"), {
                "featuresLoaded": this.getActiveSchoolLayer
            });

            this.infoText = this.parseTranslationInHtml(this.translate("additional:addons.gfiThemes.bildungsatlas.schulenWohnort.info." + themeType));
        },

        /**
         * shows the features of the area layer, hides school layers
         * @param {?Object} feature - the feature to be reset
         * @returns {void}
         */
        reset (feature) {
            const layerStatisticAreas = this.getLayerStatisticAreas(feature),
                layerSchools = this.getLayerSchools();

            this.showAllFeatures(layerStatisticAreas);

            if (layerSchools) {
                this.showAllFeatures(layerSchools);
                layerSchools.setIsSelected(false);
            }
            Backbone.Events.stopListening(Radio.channel("VectorLayer"), "featuresLoaded");
        },

        /**
         * returns the areas layer
         * @param {?Object} feature - the feature to be reset if there exists
         * @returns {Object|Boolean}  - the areas layer or false if there is no such layer
         */
        getLayerStatisticAreas (feature) {
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

            if (!layers || !layers.length || layers.length === 0) {
                return false;
            }

            return layers[0];
        },

        /**
         * Requests the Modellist for layer with layerNameCorrelation. If necessary this function starts its creation.
         * @fires Core.ModelList#RadioRequestModelListGetModelByAttributes
         * @returns {?ol/layer/Layer}  - the layer of schools or false if there aren't any
         */
        getLayerSchools () {
            const modelAttributes = {"name": this.layerNameCorrelation[this.featureType]},
                /**
                 * conf as {Object} - a simple object {id, ...} with config parameters (see config.json -> Themenconfig)
                 * conf is the config of the module based on config.json Themenconfig found by name (see defaults.layerNameCorrelation) choosen by themeType
                 */
                conf = Radio.request("Parser", "getItemByAttributes", modelAttributes);
            let layer = Radio.request("ModelList", "getModelByAttributes", modelAttributes);

            if (!layer && conf && conf?.id) {
                Radio.trigger("ModelList", "addModelsByAttributes", {id: conf.id});
                layer = Radio.request("ModelList", "getModelByAttributes", {id: conf.id});
                layer.setIsSelected(true);
            }

            return layer;
        },

        /**
         * Hide all features in all given layers except all features with given id and adding mouseover attributes to the visible features
         * @param {ol/layer/Layer} layer the Layer filtered by gfiTheme
         * @param {String[]} featureIds Array of feature Id to keep
         * @returns {void}
         */
        showFeaturesByIds (layer, featureIds) {
            const schoolLevelTitle = this.schoolLevelTitle;

            let schools;

            if (featureIds.length && layer && layer.get("isSelected")) {
                layer.showFeaturesByIds(featureIds);

                schools = layer.get("layer").getSource().getFeatures();

                this.addHtmlMouseHoverCode(schools, schoolLevelTitle);
            }
        },

        /**
         * creates an array of featureIds to select by the model
         * @param {ol/Feature[]} schools an array of features to check
         * @param {String} statGeb_Nr the urban area number based on the customers content (equals StatGeb_Nr)
         * @returns {void}
         */
        getFeatureIds (schools, statGeb_Nr) {
            const featureIds = [],
                schoolAssoc = {};

            if (!Array.isArray(schools)) {
                return featureIds;
            }

            if (statGeb_Nr !== "") {
                schools.forEach(school => {
                    const id = school.get("schul_id").split("-").shift();

                    if (!Object.prototype.hasOwnProperty.call(schoolAssoc, id)) {
                        schoolAssoc[id] = [];
                    }
                    schoolAssoc[id].push(school);
                });
                this.api.getEinzugsgebieteValue(this.featureType, "statgeb_id", statGeb_Nr, value => {
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
         * Show all features in all given layers
         * @param {ol/layer/Layer} layer Layer to show
         * @returns {void}
         */
        showAllFeatures (layer) {
            if (layer && layer.get("isSelected")) {
                layer.showAllFeatures();
            }
        },

        /**
         * activates selected features of the school layer and adds html data for mouse hovering
         * @returns {void}
         */
        getActiveSchoolLayer: function () {
            const statGeb_Nr = this.statgeb_id,
                layerSchools = this.getLayerSchools(),
                schools = layerSchools ? layerSchools.get("layer").getSource().getFeatures() : [];

            this.layerSchools = layerSchools;
            this.featureIds = this.getFeatureIds(schools, statGeb_Nr);
        },

        /**
         * returns the html as hover information
         * @param   {Object} school an object type Feature with the school information
         * @param   {function(String):*} school.get a function to request information from the feature
         * @param   {String} schoolLevelTitle the school level as defined in defaults.schoolLevels and selected with themeType
         * @returns {Object} - the data for the mouseoverTemplate used by the view to fill its html placeholders
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
                data.percentageOfStudentsFromDistrict = data.percentageOfStudentsFromDistrict = optimizeValueRootedInComplexType(school.get("anteil_sus_schule_stageb_an_anzahl_sus_stageb"), 0);
                data.numberOfStudentsFromDistrict = school.get("anzahl_sus_schule_stageb");
            }

            return data;
        },

        /**
         * adds html mouse hover code to all school features where the StatGeb_Nr valids StatGeb_Nr
         * @pre features may or may not have mouse hover html code already attatched
         * @post all features with a StatGeb_Nr validated by StatGeb_Nr have attatched mouse hover html code
         * @param {ol/Feature[]} schools schools an array of features to check
         * @param {String} schoolLevelTitle schoolLevelTitle the school level as defined in defaults.schoolLevelTitle
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
                            {{ translate("additional:addons.gfiThemes.bildungsatlas.schulenWohnort.statgeb") }}: {{ statgeb_id }}<br>({{ stadtteil_name }})
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr colspan="2">
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
