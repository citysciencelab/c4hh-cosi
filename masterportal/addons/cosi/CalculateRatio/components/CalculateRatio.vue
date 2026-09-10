<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import ButtonGroup from "../../components/ButtonGroup.vue";
import CalculateRatioSelection from "./CalculateRatioSelection.vue";
import ChartItem from "../../shared/modules/charts/components/ChartItem.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersCalculateRatio";
import getVectorlayerMapping from "../../FeaturesList/utils/getVectorlayerMapping";
import mutations from "../store/mutationsCalculateRatio";
import ResultManagement from "../../shared/modules/resultManagement/components/ResultManagement.vue";
import utils from "../../utils";
import DataTable from "./DataTable.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import {exportAsGeoJson} from "../utils/exportResults.js";
import getMappingJson from "../../utils/getMappingJson";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {generateColorScale} from "../../utils/colorScale.js";
import {getCenter} from "ol/extent";
import {getLayerSource} from "../../utils/layer/getLayerSource";
import layerCollection from "@core/layers/js/layerCollection";
import VectorLayer from "ol/layer/Vector.js";
// import {getModelByAttributes} from "../../utils/radioBridge.js";

export default {
    name: "CalculateRatio",
    components: {
        AccordionItem,
        AlertMessage,
        ButtonGroup,
        CalculateRatioSelection,
        ChartItem,
        DataTable,
        DropdownAutocomplete,
        FlatButton,
        ResultManagement,
        ToolInfo
    },
    data () {
        return {
            // All available features
            featuresStatistics: [],
            // List with names of selected Layers
            layerIdList: [],
            // List of all available "facilites" (theme layers)
            facilityList: [],
            // Sorted an grouped list of availabke features
            featuresList: [],
            // Holds all statistical data from selectedFeatures (DistrictSelector)
            selectedStatFeatures: [],
            featuresListNew: [],
            // All available years in data
            availableYears: [],
            // Year the user selected manually
            selectedYear: "",
            // Properties of facility type (like Schülerzahl in schools) for Field A
            facilityPropertyList_A: [],
            // Properties of facility type (like Schülerzahl in schools) for Field B
            facilityPropertyList_B: [],
            // Var that controls if user calculates with statistical data (feature) oder facility for Field A
            ASwitch: true,
            // Var that controls if user calculates with statistical data (feature) oder facility for Field B
            BSwitch: true,
            // Selected value for Field A (it's an object because it can carry more information like values or properties, depending on the data set)
            selectedFieldA: [],
            // Selected value for Field B (it's an object because it can carry more information like values or properties, depending on the data set)
            selectedFieldB: [],
            // Selected property for Field A (facility only)
            paramFieldA: {name: "", id: ""},
            // Selected property for Field B (facility only)
            paramFieldB: {name: "", id: ""},
            // "Faktor F" has been entered by the user for Field A
            fActive_A: false,
            // "Faktor F" has been entered by the user for Field B
            fActive_B: false,
            // "Faktor F" for Field A
            faktorf_A: 1,
            // "Faktor F" for Field B
            faktorf_B: 1,
            // Modifier "berechnen pro" for Field A
            perCalc_A: 1,
            // Modifier "berechnen pro" for Field B
            perCalc_B: 1,
            // Helper Array to use selected values beyond function scope
            featureVals: [],
            // Object that helps calculating the data in prepareCoverage function
            calcHelper: {},
            // Clone of the results array for helping updating the displayed table live
            resultsClone: [],
            // Selected column to render in CCM
            columnSelector: {name: "Verhältnis", key: "relation"},
            facilitiesMapping: [],
            visibleLayerListForDropdown: [],
            visibleVectorLayers: [],
            selectedDistricts: [],
            tableOrChart: "table",
            chartData: []
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        // ...mapGetters("Maps", ["getVisibleLayerList"]),
        ...mapGetters("Modules/CalculateRatio", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", ["mapping", "selectedDistrictLevel", "selectedFeatures", "label", "keyOfAttrName", "keyOfAttrNameStats", "loadend"]),
        ...mapGetters("Modules/FeaturesList",
                      {
                          // facilitiesMapping: "mapping",
                          // groupActiveLayer: "groupActiveLayer",
                          isFeatureActive: "isFeatureActive"
                      }),
        ...mapGetters("Modules/ColorCodeMap", ["visualizationState"]),
        ...mapGetters(["layerConfig", "visibleSubjectDataLayerConfigs"]),

        availableColumns () {
            const options = [
                {name: "Verhältnis", key: "relation"},
                {name: "Bedarfsdeckung (%)", key: "coverage"}
            ];

            if (this.fActive_A || this.fActive_B) {
                const capacity = {
                          name: "Kapazität",
                          key: "capacity"
                      },
                      need = {
                          name: "Bedarf",
                          key: "need"
                      };

                options.push(capacity, need);
            }

            return options;
        },

        /**
         * Colour ramp for the result set currently drawn on the map. Built from the same
         * dataset and colour scheme the ColorCodeMap renders with, so the bar and the
         * districts cannot drift apart. The map itself carries no legend for ratio data.
         * @returns {Object|null} the css gradient plus its end labels, null if nothing is drawn.
         */
        mapLegend () {
            if (!this.dataToColorCodeMap || this.colorCodeMapDataset.length === 0) {
                return null;
            }

            const {legend} = generateColorScale(
                    this.colorCodeMapDataset.map(entry => entry.data),
                    this.$store.getters["Modules/ColorCodeMap/colorScheme"]
                ),
                values = legend?.values.filter(value => typeof value === "number") || [];

            // a single district, or several with the same value, has no ramp to show
            if (values.length < 2) {
                return null;
            }

            return {
                gradient: `linear-gradient(90deg, ${legend.colors.join(", ")})`,
                low: values[0].toLocaleString("de-DE"),
                high: values[values.length - 1].toLocaleString("de-DE")
            };
        },

        /**
         * Prepares data for the cards displaying the data sets.
         * @returns {Object[]} Array of data set objects for the cards.
         */
        dataSetsForCards () {
            return this.dataSets.map((set, index) => ({
                icon: "bi-sliders",
                data: [
                    {
                        label: (set.inputs.ASwitch ? this.$t("additional:modules.tools.cosi.calculateRatio.subjectData") : this.$t("additional:modules.tools.cosi.calculateRatio.statData"))
                            + (set.inputs.facilityPropertyList_A.length ? ` | ${this.$t("additional:modules.tools.cosi.calculateRatio.parameter")}` : "")
                            + (set.inputs.faktorf_A && set.inputs.faktorf_A !== 1 ? ` | ${this.$t("additional:modules.tools.cosi.calculateRatio.factor")}` : "")
                            + (set.inputs.perCalc_A && set.inputs.perCalc_A !== 1 ? ` | ${this.$t("additional:modules.tools.cosi.calculateRatio.calcPer")}` : ""),
                        value: set.inputs.selectedFieldA
                            + (set.inputs.facilityPropertyList_A.length ? ` | ${set.inputs.facilityPropertyList_A.join()}` : "")
                            + (set.inputs.faktorf_A && set.inputs.faktorf_A !== 1 ? ` | ${set.inputs.faktorf_A}` : "")
                            + (set.inputs.perCalc_A && set.inputs.perCalc_A !== 1 ? ` | ${set.inputs.perCalc_A}` : "")
                    },
                    {
                        label: (set.inputs.BSwitch ? this.$t("additional:modules.tools.cosi.calculateRatio.subjectData") : this.$t("additional:modules.tools.cosi.calculateRatio.statData"))
                            + (set.inputs.facilityPropertyList_B.length ? ` | ${this.$t("additional:modules.tools.cosi.calculateRatio.parameter")}` : "")
                            + (set.inputs.faktorf_B && set.inputs.faktorf_B !== 1 ? ` | ${this.$t("additional:modules.tools.cosi.calculateRatio.factor")}` : "")
                            + (set.inputs.perCalc_B && set.inputs.perCalc_B !== 1 ? ` | ${this.$t("additional:modules.tools.cosi.calculateRatio.calcPer")}` : ""),
                        value: set.inputs.selectedFieldB
                            + (set.inputs.facilityPropertyList_B.length ? ` | ${set.inputs.facilityPropertyList_B.join()}` : "")
                            + (set.inputs.faktorf_B && set.inputs.faktorf_B !== 1 ? ` | ${set.inputs.faktorf_B}` : "")
                            + (set.inputs.perCalc_B && set.inputs.perCalc_B !== 1 ? ` | ${set.inputs.perCalc_B}` : "")
                    },
                    {
                        label: this.$t("additional:modules.tools.cosi.calculateRatio.year"),
                        value: set.inputs.selectedYear
                    }
                ],
                status: index === this.activeSet ? "active" : ""
            }));
        },

        /**
         * Gets the buttons for the result view options (table or chart).
         * @returns {Object[]} Array describing the two buttons for the view choices.
         */
        tableOrChartButtons () {
            return [
                {icon: "bi-table", name: this.$t("additional:modules.tools.cosi.calculateRatio.table"), value: "table"},
                {icon: "bi-bar-chart", name: this.$t("additional:modules.tools.cosi.calculateRatio.chart"), value: "chart"}
            ];

        }
    },
    watch: {
        /**
         * Detects changes in visible Layers.
         *
         * @returns {void}
         */
        visibleSubjectDataLayerConfigs: {
            handler () {
                this.visibleVectorLayers = this.getVisibleVectorLayers();
                this.$nextTick(() => {
                    this.updateFeaturesList();
                });

            },
            deep: true
        },
        /* loadend (newValue) {
            const selectedDistricts = this.selectedDistrictLevel.districts.filter(district => district.isSelected === true);

            this.selectedStatFeatures = selectedDistricts.map(district => district.statFeatures).flat();
            if (newValue && this.selectedFeatures.length > 0) {
                this.updateFeaturesList();
            }
        },*/
        results (newResults) {
            if (newResults.length > 0) {
                this.resultsClone = [...newResults];
            }
        },
        resultsClone (newClone) {
            newClone.forEach((result, index) => {
                if (result.scope === "Gesamt" || result.scope === "Durchschnitt") {
                    newClone.splice(index, 1);
                }
            });
        },
        visualizationState (newState) {
            if (!newState) {
                // "Tools/..." is the pre-v3 module path; committing it was a silent no-op,
                // so switching the visualization off in the map left this tool believing
                // it was still on and the button could not switch it back on.
                this.setDataToColorCodeMap(false);
            }
        },
        facilitiesMapping () {
            this.updateFacilities();
        },
        /**
         * Picks up categories the user derived in the Dashboard while this tool was open.
         * @returns {void}
         */
        mapping: {
            handler () {
                this.updateFeaturesList();
            },
            deep: true
        },
        filters () {
            this.prepareCoverage();
        },
        async activeSet (newValue) {
            if (!this.dataSets[newValue]) {
                return;
            }

            for (const key in this.dataSets[newValue].inputs) {
                this[key] = JSON.parse(JSON.stringify(this.dataSets[newValue].inputs[key]));
            }

            await this.$nextTick();
            this.selectedFieldA = Array.isArray(this.selectedFieldA) ? this.selectedFieldA.flat() : this.selectedFieldA;
            this.selectedFieldB = Array.isArray(this.selectedFieldB) ? this.selectedFieldB.flat() : this.selectedFieldB;

            this.setResults(this.dataSets[newValue].results);
            this.setResultHeaders(this.dataSets[newValue].resultHeaders);
            this.updateColorCodeMap();
        },
        dataSets (newValue) {
            if (newValue.length === 0) {
                this.setResults([]);
            }
        },

        /**
         * Updates the ColorCodeMap if visualized.
         * @returns {void}
         */
        columnSelector () {
            if (this.dataToColorCodeMap) {
                this.updateColorCodeMap();
            }
        },

        /**
         * Updates the ColorCodeMap if visualized.
         * @returns {void}
         */
        selectedYear () {
            if (this.dataToColorCodeMap) {
                this.updateColorCodeMap();
            }
        }
    },
    created () {
        this.visibleVectorLayers = this.getVisibleVectorLayers();
        this.selectedDistricts = this.getSelectedDistricts(this.selectedDistrictLevel);
    },
    async mounted () {
        this.applyTranslationKey(this.name);

        // this.getVisibleLayerList();

        if (typeof this.selectedDistrictLevel !== "undefined") {
            await this.updateFeaturesList();

            // Statistical data is the more common denominator, so field B starts out on it
            // when there is any. This is an initial default only — from the first calculation
            // on, the switches are owned by the selection cards (see setCoverageParams).
            if (this.featuresList.length !== 0) {
                this.BSwitch = false;
            }
        }

        if (this.facilityList.length === 0) {
            this.ASwitch = false;
            this.BSwitch = false;
        }
    },
    methods: {
        ...mapMutations("Modules/CalculateRatio", Object.keys(mutations)),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),

        getVisibleLayerList () {
            this.layerIdList = this.getVisibleVectorLayers().map(layer => layer.getLayer().get("name"));

            this.layerIdList.forEach(name => {
                this.visibleLayerListForDropdown.push(name);
            });

            this.updateFacilities();
        },

        getSelectedDistricts (selectedDistrictLevel) {
            return selectedDistrictLevel?.districts?.filter(district => district.isSelected === true) || [];
        },

        /**
         * Returns all visible vector layers from the layer collection that are of supported types.
         * Supported types include "WFS", "OAF", and "GeoJSON".
         * @returns {Array} An array of visible vector layer objects.
         */
        getVisibleVectorLayers () {
            const supportedLayerTypes = ["WFS", "OAF", "GeoJSON", "VECTORBASE"];

            return layerCollection.getLayers().filter(layer => {
                return layer.getLayer() instanceof VectorLayer && layer?.attributes.visibility === true && layer?.attributes?.isNeverVisibleInTree !== true && supportedLayerTypes.includes(layer.get("typ"));
            });
        },
        /**
         * @description Updates theme layer selection and sorting/ grouping it for display in multiselect.
         * @todo triggers too often!!! refactor
         * @returns {void}
         */
        updateFacilities () {
            this.facilitiesMapping = getVectorlayerMapping(this.layerConfig.subjectlayer);
            this.facilityList = this.facilitiesMapping.reduce((list, group) => {
                const lengthCheck = group.layer.filter(layer => this.layerIdList.includes(layer.id));

                if (lengthCheck.length > 0) {
                    return [
                        ...list,
                        {
                            group: group.group,
                            layer: lengthCheck
                        }
                    ];
                }

                return list;
            }, []);

            if (this.facilityList.length !== 0) {
                this.ASwitch = true;
            }
        },
        /**
         * @description Updates featuresList and sorting/ grouping it for display in multiselect.
         * @returns {void}
         */
        async updateFeaturesList () {
            // Prefer the DistrictSelector's live mapping over the static assets/mapping.json:
            // it carries the same categories plus the ones the user derived in the Dashboard
            // ("Berechnungen"), which are written to the districts' statFeatures and are therefore
            // resolvable by getFeatureData().
            const mappingJson = Array.isArray(this.mapping) && this.mapping.length > 0
                ? this.mapping
                : await getMappingJson();

            this.featuresList = [];
            this.featuresListNew = [];

            if (Array.isArray(mappingJson) && mappingJson.length > 0) {
                mappingJson.forEach(attr => {
                    // Absolute values are the meaningful denominator for a supply ratio. Runtime
                    // categories (isTemp) are offered regardless of valueType, because the user
                    // defined them deliberately and knows their unit.
                    if (attr[this.keyOfAttrNameStats] && (attr.valueType === "absolute" || attr.isTemp === true)) {
                        const findGrp = this.featuresList.find(el => el.title === attr.group);

                        if (findGrp) {
                            this.featuresList.push({value: attr.value, title: attr.value});
                        }
                        else {
                            this.featuresList.push({type: "subheader", title: attr.group});
                            this.featuresList.push({value: attr.value, title: attr.value});
                        }

                        this.featuresListNew.push(attr.value);
                    }
                });
            }
        },

        /**
         * @description Gets Data for the selected theme layer (facility)
         * @param {String} letter String that determines for which field the data should be loaded (A or B for FieldA or FieldB).
         * @returns {void}
         */
        getFacilityData (letter) {
            if (this[letter + "Switch"]) {
                this["facilityPropertyList_" + letter] = [{
                    name: "Anzahl",
                    id: "count"
                }];
                this["selectedField" + letter].numericalValues.forEach(value => {
                    const data = {
                        name: value.name,
                        id: value.id
                    };

                    this["facilityPropertyList_" + letter].push(data);
                });

                this["paramField" + letter] = this["facilityPropertyList_" + letter][0];
            }
        },
        /**
         * @description Clears all values from Field A and Field B
         * @returns {void}
         */
        clearAllValues () {
            this.selectedFieldA = {id: ""};
            this.selectedFieldB = {id: ""};
            this.paramFieldA = {name: "", id: ""};
            this.paramFieldB = {name: "", id: ""};
            this.fActive_A = false;
            this.fActive_B = false;
            this.faktorf_A = 1;
            this.faktorf_B = 1;
            this.setResults([]);
            this.setDataSets([]);
            this.setDataToColorCodeMap(false);
            this.tableOrChart = "table";
        },

        setCoverageParams (obj) {

            // // true wann cardOne = Fachdaten
            this.ASwitch = obj.ASwitch;
            // // true wann cardTwo = Fachdaten
            this.BSwitch = obj.BSwitch;
            // // Value von cardOne
            this.selectedFieldA = obj.selectedFieldA;
            // // Value von cardTwo
            this.selectedFieldB = obj.selectedFieldB;

            this.paramFieldA = obj.paramFieldA;
            this.paramFieldB = obj.paramFieldB;
            // // immer true ?
            this.fActive_A = obj.fActive_A;
            // // immer true ?
            this.fActive_B = obj.fActive_B;
            // // faktor cardOne
            this.faktorf_A = obj.faktorf_A;
            // // faktor cardTwo
            this.faktorf_B = obj.faktorf_B;
            // // divisor cardOne
            this.perCalc_A = obj.perCalc_A;
            // // divisor cardTwo
            this.perCalc_B = obj.perCalc_B;
            // // property list cardOne
            this.facilityPropertyList_A = obj.facilityPropertyList_A;
            // // property list cardTwo
            this.facilityPropertyList_B = obj.facilityPropertyList_B;
            this.selectedYear = obj.year;
            this.prepareCoverage();

        },
        /**
         * @description Fires when user hits calulcate button. Prepares data sets for calculation. Triggers coverageFunction twice.
         * @returns {void}
         */
        prepareCoverage () {
            this.setResults([]);
            const
                allData = [],
                calculationSet = {
                    inputs: {},
                    resultHeaders: {},
                    results: {}
                },
                // Which field reads a facility layer and which one statistical data is decided
                // once, up front: evaluating a field can refresh the tool's state, and reading
                // the flags per field would let field A's evaluation change field B's branch.
                isFacility = {A: this.ASwitch, B: this.BSwitch},
                dataArray_A = this.coverageFunction("A", isFacility.A),
                dataArray_B = this.coverageFunction("B", isFacility.B);
            let
                resultHeader_A = this.selectedFieldA,
                resultHeader_B = this.selectedFieldB;

            if (Array.isArray(this.selectedFieldA)) {
                resultHeader_A = this.selectedFieldA.length > 1 ?
                    this.$t("additional:modules.tools.cosi.calculateRatio.addedSelection") :
                    this.selectedFieldA[0];
            }
            if (Array.isArray(this.selectedFieldB)) {
                resultHeader_B = this.selectedFieldB.length > 1 ?
                    this.$t("additional:modules.tools.cosi.calculateRatio.addedSelection") :
                    this.selectedFieldB[0];
            }

            dataArray_A.forEach((obj_A) => {
                const obj_B = dataArray_B.find(obj => obj.name === obj_A.name),
                      combined = {...obj_A, ...obj_B};

                allData.push(combined);
            });

            this.setResults(utils.calculateRatio(allData, this.selectedYear));
            this.setResultHeaders({
                typeA: resultHeader_A + (this.facilityPropertyList_A.length ? ` ‒ ${this.facilityPropertyList_A.join()}` : ""),
                typeB: resultHeader_B + (this.facilityPropertyList_B.length ? ` ‒ ${this.facilityPropertyList_B.join()}` : ""),
                fActive: this.fActive_A || this.fActive_B,
                faktorF: `${this.faktorf_B} / ${this.faktorf_A}`
            });

            calculationSet.results = this.results;
            calculationSet.resultHeaders = this.resultHeaders;
            calculationSet.inputs = {
                selectedYear: JSON.parse(JSON.stringify(this.selectedYear)),
                selectedFieldA: JSON.parse(JSON.stringify(this.selectedFieldA)),
                selectedFieldB: JSON.parse(JSON.stringify(this.selectedFieldB)),
                paramFieldA: JSON.parse(JSON.stringify(this.paramFieldA)),
                paramFieldB: JSON.parse(JSON.stringify(this.paramFieldB)),
                fActive_A: JSON.parse(JSON.stringify(this.fActive_A)),
                fActive_B: JSON.parse(JSON.stringify(this.fActive_B)),
                faktorf_A: JSON.parse(JSON.stringify(this.faktorf_A)),
                faktorf_B: JSON.parse(JSON.stringify(this.faktorf_B)),
                ASwitch: isFacility.A,
                BSwitch: isFacility.B,
                perCalc_A: JSON.parse(JSON.stringify(this.perCalc_A)),
                perCalc_B: JSON.parse(JSON.stringify(this.perCalc_B)),
                facilityPropertyList_A: JSON.parse(JSON.stringify(this.facilityPropertyList_A)),
                facilityPropertyList_B: JSON.parse(JSON.stringify(this.facilityPropertyList_B))
            };

            this.dataSets.push(calculationSet);
            this.setActiveSet(this.dataSets.length - 1);
        },
        /**
         * @description Fires when user hits calulcate button. Prepares data sets for calculation.
         * @param {String} letter "A" or "B" for selectedFieldA or selectedFieldB.
         * @param {Boolean} isFacility True if the field reads a facility layer, false for statistical data.
         * @returns {Array} dataArray -> Array containing all collected data for all selected districts.
         */
        coverageFunction (letter, isFacility) {
            const dataArray = [];

            this.selectedFeatures.forEach(district => {
                const name = district.getProperties()[this.keyOfAttrName],
                      geometry = district.getGeometry();

                this.calcHelper = {};
                this.calcHelper.name = name;
                this.calcHelper["faktorf_" + letter] = this["faktorf_" + letter];
                this.calcHelper["perCalc_" + letter] = this["perCalc_" + letter];

                if (isFacility) {
                    const findLayer = this.getVisibleVectorLayers().find(layer => layer.getLayer().get("name") === this["selectedField" + letter]),
                          layerFeatures = getLayerSource(findLayer.getLayer()).getFeatures(),
                          paramField = this["paramField" + letter],
                          // the selection only carries the display name, the feature property is the id from the layer config
                          paramKey = findLayer?.attributes?.numericalValues?.find(value => value.name === paramField?.name)?.id || paramField?.name?.toLowerCase();

                    this.calcHelper["type_" + letter] = "facility";
                    this.featureVals = [];
                    layerFeatures.forEach(feature => {

                        if (this.isFeatureActive(feature, findLayer.layer)) {
                            const layerGeometry = getCenter(feature.getGeometry().getExtent());

                            if (geometry.intersectsCoordinate(layerGeometry)) {
                                if (this["paramField" + letter]?.name !== "Anzahl") {
                                    if (
                                        typeof feature.getProperties()[this["paramField" + letter]] !== "number" ||
                                        typeof feature.getProperties()[this["paramField" + letter]] !== "string"
                                    ) {
                                        const
                                            value = feature.getProperties()[paramKey],
                                            valueTransformed = typeof value === "string" ? parseFloat(value.replace(/[^0-9.]/g, "")) : value;

                                        this.featureVals.push(valueTransformed);
                                    }
                                    else {
                                        this.featureVals.push("");
                                    }
                                }
                                else {
                                    this.featureVals.push(0);
                                }
                            }
                        }
                    });


                    const checkForLackingData = utils.compensateLackingData(this.featureVals);

                    if (checkForLackingData === "error") {
                        this.addSingleAlert({
                            category: "Warnung",
                            content: "<strong>" + name + ":</strong> " + this.$t("additional:modules.tools.cosi.calculateRatio.noData"),
                            displayClass: "warning"
                        });
                        return;
                    }
                    this.calcHelper["param" + letter + "_count"] = this.featureVals.length;
                    this.calcHelper["param" + letter + "_val"] = checkForLackingData.data.reduce((total, val) => total + parseFloat(val), 0);
                    this.calcHelper["incompleteDatasets_" + letter] = checkForLackingData.incompleteDatasets;
                    this.calcHelper["datasets_" + letter] = checkForLackingData.totalDatasets;
                    if (this["paramField" + letter].name === "Anzahl") {
                        this.calcHelper["param" + letter + "_calc"] = this.calcHelper["param" + letter + "_count"];
                    }
                    else {
                        this.calcHelper["param" + letter + "_calc"] = this.calcHelper["param" + letter + "_val"];
                    }
                }
                else {
                    this.featureVals = [];
                    this.calcHelper["type_" + letter] = "feature";

                    const featureData = this.getFeatureData(name, this["selectedField" + letter]),
                          yearValues = {};

                    featureData.forEach(year => {
                        yearValues[year.jahr] = year.wert;
                    });

                    this.featureVals = yearValues;
                    this.calcHelper["param" + letter + "_val"] = this.featureVals[this.selectedYear];
                    this.calcHelper["param" + letter + "_calc"] = this.calcHelper["param" + letter + "_val"];
                    this.calcHelper["incompleteDatasets_" + letter] = 0;
                }

                dataArray.push(this.calcHelper);
            });

            return dataArray;
        },
        /**
         * @description Gets Data for the selected statistical data (features)
         * @param {String} districtName name of the district.
         * @param {String} featureName name of the statistical data set (feature).
         * @returns {void}
         */
        getFeatureData (districtName, featureName) {
            const featureDataList = [],
                  selectedDistricts = this.selectedDistrictLevel.districts.filter(district => district.isSelected === true);

            this.selectedStatFeatures = selectedDistricts.map(district => district.statFeatures).flat();

            this.selectedStatFeatures.forEach(feature => {
                if (utils.unifyString(feature.getProperties()[this.keyOfAttrNameStats]) === utils.unifyString(districtName) && utils.unifyString(feature.get("kategorie")) === utils.unifyString(featureName)) {
                    Object.entries(feature.getProperties()).forEach(([key, val]) => {
                        if (key.includes(this.yearSelector)) {
                            const obj = {
                                jahr: key.substring(key.indexOf("_") + 1),
                                wert: parseFloat(val)
                            };

                            featureDataList.push(obj);
                        }
                    });
                }
            });
            return featureDataList;
        },
        /**
         * @description Recalculate the data set dynamically when one parameter changes.
         * @returns {void}
         */
        recalcData () {
            const dataArray = [];

            this.setResults([]);
            this.resultsClone.forEach(result => {
                dataArray.push(result.data);
            });

            this.setResults(utils.calculateRatio(dataArray, this.selectedYear));
            this.dataSets[this.activeSet].results = this.results;
        },
        /**
         * @description Transforming results data for excel export
         * @param {Integer} index Index of the set to be prepared for download in the dataSets Array.
         * @returns {Void} Function returns nothing.
         */
        resultData (index) {
            const json = [];

            this.dataSets[index].results.forEach(result => {
                const resultObj = {};

                resultObj.Gebiet = result.scope;
                resultObj[this.dataSets[index].inputs.selectedFieldA.id] = result.paramA_val;
                resultObj[this.dataSets[index].inputs.selectedFieldB.id] = result.paramB_val;
                resultObj[this.dataSets[index].inputs.selectedFieldA.id + " / " + this.dataSets[index].inputs.selectedFieldB.id] = result.relation.toLocaleString("de-DE");
                resultObj.Kapazitaet = result.capacity;
                resultObj.Bedarf = result.need;
                resultObj.Bedarfsdeckung = result.coverage.toLocaleString("de-DE") + "%";
                json.push(resultObj);
            });

            return json;
        },
        exportAsXlsx (index) {
            utils.exportXlsx([], this.resultData(index), this.selectedYear + "_versorgungsanalyse", {exclude: this.excludedPropsForExport});
        },
        /**
         * @description Push data that is to be visualized on the map to ColorCodeMap Component.
         * @returns {void}
         */
        loadToColorCodeMap () {
            if (!this.dataToColorCodeMap) {
                this.setDataToColorCodeMap(true);
                this.updateColorCodeMap();
            }
            else {
                this.setDataToColorCodeMap(false);
                this.$store.commit("Modules/ColorCodeMap/setVisualizationState", false);
                this.$store.dispatch("Modules/ColorCodeMap/renderVisualization");
            }
        },

        /**
         * @description Picks the result column that is drawn on the map. The dropdown carries
         * the display name only, so the column object is resolved from it here.
         * @param {String} name display name of the column
         * @returns {void}
         */
        selectColumn (name) {
            this.columnSelector = this.availableColumns.find(column => column.name === name) || this.columnSelector;
        },

        /**
         * @description Hands the active result set to the ColorCodeMap and redraws it.
         * Both live in the ColorCodeMap's store, so this works whether or not that tool's
         * menu entry is open — the same route the Dashboard takes for its row visualization.
         * @returns {void}
         */
        updateColorCodeMap () {
            this.setColorCodeMapDataset(this.getDataForColorCodeMap());

            if (this.dataToColorCodeMap) {
                this.$store.dispatch("Modules/ColorCodeMap/renderDataFromCalculateRatio");
            }
        },

        /**
         * Gets the data for ColorCodeMap.
         * @returns {Object[]} The prepared data for the ColorCodeMap.
         */
        getDataForColorCodeMap () {
            const prepareData = [];

            this.dataSets[this.activeSet].results.forEach(result => {
                // the aggregate rows match no district, and a district whose denominator is
                // zero has no finite value to place on a colour scale — one Infinity would
                // flatten the scale for every other district, so it stays uncoloured
                if (result.scope === "Gesamt" || result.scope === "Durchschnitt"
                    || !Number.isFinite(result[this.columnSelector.key])) {
                    return;
                }

                prepareData.push({
                    name: result.scope,
                    data: Math.round(1000 * result[this.columnSelector.key]) / 1000
                });
            });

            return prepareData;
        },

        /**
         * @description Deletes a set from the Tool Window.
         * @param {Integer} index Index of the set to be deleted in the dataSets Array.
         * @returns {Void} Function returns nothing.
         */
        removeSet (index) {
            if (this.activeSet === this.dataSets.length - 1) {
                this.setActiveSet(this.activeSet - 1);
            }

            this.dataSets.splice(index, 1);

            if (this.dataSets.length === 0) {
                this.tableOrChart = "table";
            }
        },
        /**
         * @description Downloads xls and geojson of each dataset.
         * @returns {Void} Function returns nothing.
         */
        downloadAll () {
            this.dataSets.forEach((set, i) => {
                this.exportAsXlsx(i);
                this.exportAsGeoJson(i);
            });
        },
        /**
         * Prepares the data for the chart.
         * @returns {Object[]} The prepared chart data.
         */
        preparesChartData () {
            const chartData = [],
                  inputA = this.dataSets[this.activeSet].inputs.selectedFieldA,
                  inputB = this.dataSets[this.activeSet].inputs.selectedFieldB,
                  parameterA = this.dataSets[this.activeSet].inputs.facilityPropertyList_A.length ? " (" + this.dataSets[this.activeSet].inputs.facilityPropertyList_A[0] + ")" : "",
                  parameterB = this.dataSets[this.activeSet].inputs.facilityPropertyList_B.length ? " (" + this.dataSets[this.activeSet].inputs.facilityPropertyList_B[0] + ")" : "";


            this.availableColumns.forEach((type, idx) => {
                chartData.push(
                    {
                        name: type.name,
                        title: [
                            this.$t("additional:modules.tools.cosi.calculateRatio.title") + ": " + type.name + " - ",
                            inputA + parameterA + " und " + inputB + parameterB + " für " + this.selectedYear
                        ]
                    }
                );

                this.dataSets[this.activeSet].results.forEach(result => {
                    if (type.key in result) {
                        if (!chartData[idx].data) {
                            chartData[idx].data = [{}];
                        }

                        chartData[idx].data[0] = {
                            ...chartData[idx].data[0],
                            [result.scope]: result[type.key]
                        };
                    }
                });
            });
            return chartData;
        },

        // the export function from utils
        exportAsGeoJson
    }
};
</script>

<template lang="html">
    <div
        id="calculateratio"
    >
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
            :summary="$t('additional:modules.tools.cosi.calculateRatio.description')"
        />
        <AccordionItem
            :id="'calculateRatioDataSelection'"
            title="Auswahl der Daten"
            :is-open="true"
            :icon="'bi-plus-circle'"
        >
            <AlertMessage
                v-if="visibleVectorLayers.length === 0 && selectedDistricts.length === 0"
                :text="$t('additional:modules.tools.cosi.calculateRatio.warningNoData')"
                type="noData"
            />
            <CalculateRatioSelection
                v-else
                :layer-list="visibleVectorLayers"
                :district-name-list="selectedDistricts.length ? featuresList : []"
                @set-params="setCoverageParams"
            />
        </AccordionItem>
        <ResultManagement
            v-if="dataSets.length > 0"
            :title="$t('additional:modules.tools.cosi.calculateRatio.calculatedAnalyses')"
            icon="bi-sliders"
            card-layout-style="grid"
            :data-sets="dataSetsForCards"
            @downloadAll="downloadAll"
            @remove-all-data="clearAllValues"
            @remove-set="removeSet"
            @update-active-set="setActiveSet"
        >
            <template #top>
                <ButtonGroup
                    :buttons="tableOrChartButtons"
                    :group="tableOrChart"
                    @show-view="value => tableOrChart = value"
                />
            </template>
            <template #card>
                <ul class="dropdown-menu">
                    <li>
                        <h6 class="dropdown-header fs-g">
                            <i class="bi bi-table me-1" />
                            {{ $t("additional:modules.tools.cosi.calculateRatio.downloadOptions") }}
                        </h6>
                    </li>
                    <li class="ps-4">
                        <button
                            class="dropdown-item"
                            @click.stop="exportAsXlsx(activeSet)"
                        >
                            XLS
                        </button>
                    </li>
                </ul>
            </template>
            <template #after-card="{index}">
                <div
                    v-if="activeSet === index"
                    class="d-flex flex-row align-items-center gap-3 mb-2"
                >
                    <DropdownAutocomplete
                        class="flex-grow-1"
                        :items="availableColumns.map(column => column.name)"
                        :model-value="columnSelector.name"
                        :label="$t('additional:modules.tools.cosi.calculateRatio.calculationType')"
                        @update:model-value="selectColumn"
                    />
                    <FlatButton
                        class="flex-shrink-0 mb-3"
                        :icon="dataToColorCodeMap ? 'bi bi-map-fill' : 'bi bi-map'"
                        :secondary="!dataToColorCodeMap"
                        :text="$t('additional:modules.tools.cosi.calculateRatio.visualizeMap')"
                        :title="$t('additional:modules.tools.cosi.calculateRatio.visualizeMap')"
                        @click="loadToColorCodeMap()"
                    />
                </div>
                <div
                    v-if="activeSet === index && mapLegend"
                    class="ratio-legend d-flex align-items-center mb-3"
                >
                    <span>{{ mapLegend.low }}</span>
                    <span
                        class="ratio-legend__bar flex-grow-1 mx-2"
                        :style="{background: mapLegend.gradient}"
                    />
                    <span>{{ mapLegend.high }}</span>
                    <span class="ms-3 text-muted">{{ columnSelector.name }}</span>
                </div>
                <DataTable
                    v-if="tableOrChart === 'table' && activeSet === index"
                    class="mb-3"
                    :dataset="dataSets[index].results"
                    :type-a="dataSets[index].resultHeaders.typeA"
                    :type-b="dataSets[index].resultHeaders.typeB"
                    :f-active="dataSets[index].resultHeaders.fActive"
                    :faktor-f="dataSets[index].resultHeaders.faktorF"
                    :class="{ active: activeSet === index }"
                />
                <ChartItem
                    v-if="tableOrChart === 'chart' && activeSet === index"
                    :selection-label="$t('additional:modules.tools.cosi.calculateRatio.calculationType')"
                    :show-legend="true"
                    class="mb-3"
                    :data="preparesChartData()"
                />
            </template>
        </ResultManagement>
    </div>
</template>

<style lang="scss" scoped>
    .ratio-legend {
        font-size: 12px;

        .ratio-legend__bar {
            height: 12px;
            border: 1px solid #ccc;
            border-radius: 2px;
        }
    }
</style>
