<script>
import {mapGetters, mapActions} from "vuex";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory";
import {optimizeValueRootedInComplexType} from "../utils/complexType.js";
import {Style, Fill, Stroke} from "ol/style";

export default {
    name: "BildungsatlasThemeSchulenEinzugsgebiete",
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
         * @param {Object} [options=null] Options for interpolation, formatting and plurals.
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
            name: "",
            address: "",
            countStudents: "",
            countStudentsPrimary: "",
            countStudentsSecondary: "",
            layernameAreas: "Statistische Gebiete",
            layerStatistischeGebiete: null,
            areaInfo: [],
            infoText: "",
            schoolLayer: null
        };
    },
    computed: {
        ...mapGetters([
            "isMobile",
            "allLayerConfigs"
        ]),

        /**
         * Retrieves the theme of the current layer.
         * @returns {Object} The GFI theme object.
         */
        getGfiTheme () {
            if (this.feature && typeof this.feature === "object" && this.feature?.getTheme) {
                return this.feature.getTheme();
            }
            return {};
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
        },

        /**
         * Generates the localized hint text based on device type.
         * @returns {String} The translated hint text.
         */
        hintText () {
            if (this.isMobile) {
                return this.translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.hintMobile");
            }
            return this.translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.hintText");
        }
    },
    watch: {
        /**
         * When feature is changed, the event will be triggered.
         * Resets the previous feature and refreshes the GFI when the feature changes.
         * @param {ol/Feature} _newVal - the new feature
         * @param {ol/Feature} oldVal - the old feature
         * @returns {Void} -
         */
        feature: function (_newVal, oldVal) {
            if (oldVal) {
                this.reset(oldVal);
                this.refreshGfi();
            }
        },

        /**
         * Watches the areaInfo property deeply.
         * Filters the statistical areas by ID if new valid area information is provided.
         * @param {Array} newVal The newly updated area information array.
         */
        areaInfo: {
            handler: function (newVal) {
                if (newVal && newVal.length > 0 && this.layerStatistischeGebiete) {
                    this.filterAreasById(this.layerStatistischeGebiete);
                }
            },
            deep: true
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
         * Refreshes the GFI content, fetches the statistical areas layer, and applies visibility filters.
         * @returns {Promise<void>}
         */
        refreshGfi: async function () {
            this.areaInfo = [];

            if (!this.properties || typeof this.properties !== "object") {
                return;
            }

            this.getGfiContent(this.properties);
            this.layerStatistischeGebiete = await this.getStatisticAreasLayer();

            const catchmentAreaLayers = this.getCatchmentAreaLayers(),
                  schoolLayerId = this.feature && typeof this.feature.getLayerId === "function" ? this.feature.getLayerId() : null;

            if (this.layerStatistischeGebiete) {
                const olLayer = typeof this.layerStatistischeGebiete.getSource === "function" ? this.layerStatistischeGebiete : this.layerStatistischeGebiete.layer || (typeof this.layerStatistischeGebiete.get === "function" ? this.layerStatistischeGebiete.get("layer") : null),
                      source = olLayer?.getSource();

                if (source) {
                    source.on("featuresloadend", this.onFeaturesLoadedEvent);
                }
                this.filterAreasById(this.layerStatistischeGebiete);
            }

            if (catchmentAreaLayers && catchmentAreaLayers.length > 0) {
                this.filterFeature(catchmentAreaLayers, [this.getGfiId]);
            }

            if (schoolLayerId) {
                const allLayers = layerCollection.getLayers();

                this.schoolLayer = allLayers.find(l => l.get("id") === schoolLayerId);

                if (this.schoolLayer) {
                    this.filterFeature([this.schoolLayer], [this.getGfiId]);
                }
            }

            this.infoText = this.parseTranslationInHtml(this.translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.info"));
        },

        /**
         * Filters and dynamically styles the statistical areas based on the selected school data.
         * Uses MP3 properties with a robust OpenLayers style fallback.
         * @param {ol/layer/Layer} layer - The layer containing the statistical areas.
         * @returns {void}
         */
        filterAreasById: function (layer) {
            const olLayer = typeof layer.getSource === "function" ? layer : layer.layer || (typeof layer.get === "function" ? layer.get("layer") : null);

            if (!olLayer || !olLayer.getSource()) {
                return;
            }

            const areas = olLayer.getSource().getFeatures(),
                  featureIds = [],
                  emptyStyle = new Style({});

            if (areas.length === 0) {
                return;
            }

            areas.forEach(area => {
                let isMatched = false,
                    validAnteil = 0,
                    validAnzahl = 0;

                if (!area.get("original_statgebiet")) {
                    area.set("original_statgebiet", area.get("statgebiet"));
                }

                this.areaInfo.forEach(val => {
                    const polyId = String(area.get("original_statgebiet") || area.get("statgeb_id")),
                          dataId = String(val.statgeb_id),
                          anzahlRaw = val.anzahl_sus_schule_stageb;

                    let anteilRaw;

                    if (polyId === dataId) {
                        anteilRaw = optimizeValueRootedInComplexType(val.anteil_sus_schule_stageb_an_anzahl_sus_schule);
                        isMatched = true;

                        if (typeof anteilRaw === "string") {
                            anteilRaw = anteilRaw.replace(",", ".");
                        }

                        const anteilNum = parseFloat(anteilRaw),
                              anzahlNum = parseInt(anzahlRaw, 10);

                        validAnteil = isNaN(anteilNum) ? 0 : anteilNum;
                        validAnzahl = isNaN(anzahlNum) ? 0 : anzahlNum;
                    }
                });

                if (isMatched) {
                    featureIds.push(area.getId());

                    const tooltipText = `Anteil ${parseFloat(validAnteil).toFixed(2)}% (Anzahl: ${validAnzahl})`;

                    area.set("einzugsgebiete", validAnteil);
                    area.set("statgebiet", tooltipText);
                }
            });

            if (typeof layer.set === "function") {
                layer.set("isSelected", true);
                layer.set("visibility", true);
                layer.set("gfiAttributes", "ignore");

                this.$store.dispatch("replaceByIdInLayerConfig", {
                    layerConfig: {
                        id: layer.get("id"),
                        visibility: true,
                        legend: true,
                        name: "Einzugsgebiete",
                        styleId: "einzugsgebiete_flaechen"
                    }
                });
            }

            if (typeof olLayer.setVisible === "function") {
                olLayer.setVisible(true);
            }

            this.filterFeature([layer], featureIds);

            areas.forEach(area => {
                if (featureIds.includes(area.getId())) {
                    const validAnteil = area.get("einzugsgebiete");
                    let fillColor = [240, 240, 240, 0.9];

                    if (validAnteil > 0 && validAnteil < 5.0) {
                        fillColor = [198, 219, 239, 0.9];
                    }
                    else if (validAnteil >= 5.0 && validAnteil < 10.0) {
                        fillColor = [158, 202, 225, 0.9];
                    }
                    else if (validAnteil >= 10.0 && validAnteil < 15.0) {
                        fillColor = [107, 174, 214, 0.9];
                    }
                    else if (validAnteil >= 15.0 && validAnteil < 30.0) {
                        fillColor = [49, 130, 189, 0.9];
                    }
                    else if (validAnteil >= 30.0) {
                        fillColor = [8, 81, 156, 0.9];
                    }

                    area.setStyle(new Style({
                        fill: new Fill({color: fillColor}),
                        stroke: new Stroke({color: [255, 255, 255, 1], width: 2})
                    }));
                }
                else {
                    area.setStyle(emptyStyle);
                }
            });

            if (olLayer.getSource() && typeof olLayer.getSource().changed === "function") {
                olLayer.getSource().changed();
            }
        },

        /**
         * Resets the map, unfilters related layers, and cleans up applied area styles.
         * @param {Object} feature - The currently selected feature to reset.
         * @returns {void}
         */
        reset: function (feature) {
            const catchmentAreaLayers = this.getCatchmentAreaLayers(feature),
                  layerStatistischeGebiete = this.layerStatistischeGebiete;

            this.areaInfo = [];

            if (catchmentAreaLayers && catchmentAreaLayers.length > 0) {
                this.unfilterFeature(catchmentAreaLayers);
            }
            if (this.schoolLayer) {
                this.unfilterFeature([this.schoolLayer]);
                this.schoolLayer = null;
            }

            if (layerStatistischeGebiete) {
                const olLayer = typeof layerStatistischeGebiete.getSource === "function" ? layerStatistischeGebiete : layerStatistischeGebiete.layer || (typeof layerStatistischeGebiete.get === "function" ? layerStatistischeGebiete.get("layer") : null),
                      source = olLayer?.getSource();

                if (olLayer && olLayer.getSource()) {
                    olLayer.getSource().getFeatures().forEach(area => {
                        area.setStyle(null);

                        if (area.get("original_statgebiet")) {
                            area.set("statgebiet", area.get("original_statgebiet"));
                        }
                    });
                }

                if (typeof layerStatistischeGebiete.set === "function") {
                    layerStatistischeGebiete.set("isSelected", false);
                    layerStatistischeGebiete.set("visibility", false);
                    layerStatistischeGebiete.set("styleId", "blue-polygon-transparent");

                    this.$store.dispatch("replaceByIdInLayerConfig", {
                        layerConfig: {
                            id: layerStatistischeGebiete.get("id"),
                            visibility: false
                        }
                    });
                    this.$store.dispatch("replaceByIdInLayerConfig", {
                        layerConfig: {
                            id: layerStatistischeGebiete.get("id"),
                            visibility: false,
                            legend: false,
                            name: "Statistische Gebiete",
                            styleId: "blue-polygon-transparent"
                        }
                    });
                }

                if (olLayer && typeof olLayer.setVisible === "function") {
                    olLayer.setVisible(false);
                }

                if (source) {
                    source.un("featuresloadend", this.onFeaturesLoadedEvent);
                }
            }
        },

        /**
         * Triggered when OpenLayers features are fully loaded. Applies filters after a short delay.
         * @returns {void}
         */
        onFeaturesLoadedEvent: function () {
            setTimeout(() => {
                if (this.layerStatistischeGebiete && this.countStudents !== "") {
                    this.filterAreasById(this.layerStatistischeGebiete);
                }
            }, 200);
        },

        /**
         * Parses the GFI properties, sets component variables, and triggers catchment area parsing.
         * @param {Object} properties - The GFI properties.
         * @returns {void}
         */
        getGfiContent: function (properties) {
            if (!properties) {
                return;
            }

            const schulId = properties.schul_id ? properties.schul_id.split("-").shift() : "",
                  featureTypes = ["de.hh.up:einzug_einzugsgebiete_primarstufe", "de.hh.up:einzug_einzugsgebiete_sekundarstufe"];

            this.name = properties.schulname ? properties.schulname : "";
            this.address = properties.adresse_strasse_hausnr && properties.adresse_ort ? properties.adresse_strasse_hausnr + ", " + properties.adresse_ort : "";
            this.countStudents = this.getTotalNumber(properties.anzahl_schueler_gesamt ? properties.anzahl_schueler_gesamt : null);

            if (schulId === "") {
                return;
            }

            this.parseCatchmentAreaLayer(this.featureType, featureTypes, schulId);
        },

        /**
         * Gets the total number of students from a potentially mixed string.
         * @param {String|Number} val - The attribute value containing the total number.
         * @returns {String|Number} The extracted total number.
         */
        getTotalNumber: function (val) {
            if (typeof val === "string") {
                return val.split(" ").shift();
            }
            return val;
        },

        /**
         * Parses the data from catchment area layers via WFS API.
         * @param {String} currentFeatureType - The current feature type.
         * @param {String[]} featureTypes - An array of the two required feature types.
         * @param {String} schulId - The specific school ID.
         * @returns {void}
         */
        parseCatchmentAreaLayer: function (currentFeatureType, featureTypes, schulId) {
            featureTypes.forEach(featureType => {
                this.api.getEinzugsgebieteValue(featureType, "schule_id", schulId, value => {
                    if (Array.isArray(value) && value.length) {
                        value.forEach(data => {
                            const areaInfo = {
                                "statgeb_id": data.get("statgeb_id") ? data.get("statgeb_id") : "",
                                "anzahl_sus_schule_stageb": data.get("anzahl_sus_schule_stageb") ? data.get("anzahl_sus_schule_stageb") : "",
                                "anteil_sus_schule_stageb_an_anzahl_sus_schule": data.get("anteil_sus_schule_stageb_an_anzahl_sus_schule") ? data.get("anteil_sus_schule_stageb_an_anzahl_sus_schule") : ""
                            };

                            if (featureType === "de.hh.up:einzug_einzugsgebiete_primarstufe") {
                                this.countStudentsPrimary = data.get("anzahl_sus_schule") ? data.get("anzahl_sus_schule") : 0;
                            }
                            else {
                                this.countStudentsSecondary = data.get("anzahl_sus_schule") ? data.get("anzahl_sus_schule") : 0;
                            }

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
         * Requests the layerCollection for all layers of catchment areas corresponding to the feature.
         * @param {ol/Feature} feature - The feature to be checked.
         * @returns {ol/layer/Layer[]} An array of matching layers.
         */
        getCatchmentAreaLayers: function (feature) {
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

            return matchingLayers;
        },

        /**
         * Requests the layerCollection for the layer with layernameAreas. If necessary, starts its creation.
         * @returns {Promise<ol/layer/Layer|Boolean>} The statistical areas layer or false on error.
         */
        getStatisticAreasLayer: async function () {
            const conf = await this.getStatisticAreasConfig();

            if (!conf || !conf.id) {
                console.warn(`Configuration for layer '${this.layernameAreas}' not found!`);
                return false;
            }
            let layer;

            if (typeof layerCollection.getLayerById(conf.id) !== "undefined") {
                layer = layerCollection.getLayerById(conf.id);
            }

            if (!layer) {
                try {
                    layer = await layerFactory.createLayer({
                        typ: "VECTORBASE",
                        type: "layer",
                        id: conf.id,
                        name: conf.id,
                        visibility: true,
                        alwaysOnTop: true,
                        showLayerInTree: true,
                        styleId: "einzugsgebiete_flaechen"
                    });

                    layerCollection.addLayer(layer);
                }
                catch (error) {
                    console.warn("Error creating the layer:", error);
                    return false;
                }
            }
            else if (typeof layer.set === "function") {
                layer.set("styleId", "einzugsgebiete_flaechen");
            }

            if (layer) {
                if (typeof layer.set === "function") {
                    layer.set("isSelected", true);
                    layer.set("visibility", true);
                }
            }

            return layer;
        },

        /**
         * Requests the Vuex Store for the first layer configuration for the statistic areas by name.
         * @returns {Promise<Object|Boolean>} The layer configuration or false if not found.
         */
        getStatisticAreasConfig: async function () {
            const configs = this.allLayerConfigs || [],
                  conf = configs.find(c => c.name === this.layernameAreas);

            if (!conf) {
                console.warn("No layer configuration with name: " + this.layernameAreas);
                return false;
            }

            return conf;
        },

        /**
         * Hide all features in all given layers except the features with the given IDs.
         * @param {ol/layer/Layer[]} layers - The layers to be filtered.
         * @param {String[]} featureIds - An array of feature IDs to keep visible.
         * @returns {void}
         */
        filterFeature: function (layers, featureIds) {
            layers.forEach(function (layer) {
                const isSelected = typeof layer.get === "function" ? layer.get("isSelected") : layer.getVisible();

                if (isSelected && typeof layer.showFeaturesByIds === "function") {
                    layer.showFeaturesByIds(featureIds);
                }
            });
        },

        /**
         * Shows all features in all given layers (removes previous filters).
         * @param {ol/layer/Layer[]} layers - The layers to make fully visible.
         * @returns {void}
         */
        unfilterFeature: function (layers) {
            layers.forEach(function (layer) {
                const isSelected = typeof layer.get === "function" ? layer.get("isSelected") : layer.getVisible();

                if (isSelected && typeof layer.showAllFeatures === "function") {
                    layer.showAllFeatures();
                }
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
                            {{ name }}
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.address") }}</td>
                        <td>{{ address }}</td>
                    </tr>
                    <tr>
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.totalCount") }}</td>
                        <td>{{ countStudents }}</td>
                    </tr>
                    <tr>
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.SchulenEinzugsGebiete.primaryCount") }}</td>
                        <td>{{ countStudentsPrimary }}</td>
                    </tr>
                    <tr>
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
