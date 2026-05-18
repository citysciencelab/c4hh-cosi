<script>
import AccordionItem from "../../../src/shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import IconButton from "../../../src/shared/modules/buttons/components/IconButton.vue";
import {mapActions, mapGetters, mapMutations} from "vuex";
import getOAFFeature from "../../../src/shared/js/api/oaf/getOAFFeature.js";
import Point from "ol/geom/Point.js";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import layerCollection from "../../../src/core/layers/js/layerCollection.js";
import layerFactory from "../../../src/core/layers/js/layerFactory.js";
import {Fill, Stroke, Style} from "ol/style.js";
import getWCSFeatures from "../js/getWCSFeatures.js";
import spatialOperations from "../js/spatialOperations.js";
import isObject from "../../../src/shared/js/utils/isObject.js";
import bbox from "@turf/bbox";
import {GeoJSON} from "ol/format.js";
import axios from "axios";
import dayjs from "dayjs";
import {startPrintProcess} from "../../shared/js/mapfishUtils/startPrintProcess.js";
import MapfishDialog from "../../shared/js/mapfishUtils/mapfishDialog.js";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import WaterRiskCheckSearchBar from "../searchBar/components/WaterRiskCheckSearchBar.vue";

export default {
    name: "WaterRiskCheck",
    components: {
        AccordionItem,
        FlatButton,
        IconButton,
        ModalItem,
        WaterRiskCheckSearchBar
    },
    data () {
        return {
            showSpinner: false,
            formStarted: false,
            formFinished: false,
            questions: [],
            currentQuestionIdx: 0,
            downloadLink: "",
            infoBoxOpen: false,
            instructionBoxOpen: false,
            isCreatingPDF: false,
            calculatedPercentage: 0,
            parcel: [],
            buildings: [],
            buildingsByAddress: [],
            styleBuilding: {
                stroke: {
                    width: 3,
                    color: "rgba(228, 26, 28)"
                },
                fill: {
                    color: "rgba(255, 255, 255, 0)"
                }
            },
            styleParcel: {
                stroke: {
                    width: 4,
                    color: "rgba(55, 126, 184, 1)"
                },
                fill: {
                    color: "rgba(255, 255, 255, 0)"
                }
            },
            sideMenuWidth: undefined,
            data: {
                infiltration: {
                    url: "https://api.hamburg.de/datasets/v1/versickerung",
                    collection: "versickerungspotential",
                    geometryName: "geom",
                    propertyToUse: "versickerungswahrscheinlichkeit",
                    geoJsonFeatures: [],
                    geoJsonParcelFeatures: [],
                    values: undefined
                },
                groundWaterMin: {
                    url: "https://api.hamburg.de/datasets/v1/grundwasserflurabstand",
                    collection: "grundwasserflurabstand_min",
                    geometryName: "geom",
                    propertyToUse: "klasse_in_m_unter_gok",
                    geoJsonFeatures: [],
                    geoJsonParcelFeatures: [],
                    values: undefined
                },
                hwrm_mittel: {
                    url: "https://api.hamburg.de/datasets/v1/hwrm_2_zyklus",
                    collection: "rwme_dehh_2hwrm_2019",
                    geometryName: "geom",
                    propertyToUse: "wassertiefe",
                    geoJsonFeatures: [],
                    geoJsonParcelFeatures: [],
                    values: undefined
                },
                hwrm_selten: {
                    url: "https://api.hamburg.de/datasets/v1/hwrm_2_zyklus",
                    collection: "rwlo_dehh_2hwrm_2019",
                    geometryName: "geom",
                    propertyToUse: "wassertiefe",
                    geoJsonFeatures: [],
                    geoJsonParcelFeatures: [],
                    values: undefined
                },
                hwrm_extrem_kw: {
                    url: "https://api.hamburg.de/datasets/v1/hwrm_2_zyklus",
                    collection: "cwlo_dehh_2hwrm_2019",
                    geometryName: "geom",
                    propertyToUse: "wassertiefe",
                    geoJsonFeatures: [],
                    geoJsonParcelFeatures: [],
                    values: undefined
                },
                hwrm_middle_kw: {
                    url: "https://api.hamburg.de/datasets/v1/hwrm_2_zyklus",
                    collection: "cwme_dehh_2hwrm_2019",
                    geometryName: "geom",
                    propertyToUse: "wassertiefe",
                    geoJsonFeatures: [],
                    geoJsonParcelFeatures: [],
                    values: undefined
                },
                uesg: {
                    url: "https://api.hamburg.de/datasets/v1/uesg",
                    collection: "ueberschwemmungsgebiete",
                    geometryName: "geom",
                    geoJsonFeatures: [],
                    geoJsonParcelFeatures: []
                },
                sri07_wassertiefe: {
                    type: "WCS",
                    baseURL: "https://geodienste.hamburg.de/wcs_starkregengefahrenkarte",
                    coverageId: "sri07_wassertiefe",
                    epsg: "EPSG:4326",
                    value: undefined
                },
                sri12_wassertiefe: {
                    type: "WCS",
                    baseURL: "https://geodienste.hamburg.de/wcs_starkregengefahrenkarte",
                    coverageId: "sri12_wassertiefe",
                    epsg: "EPSG:4326",
                    value: undefined
                }
            },
            config: null,
            select: null,
            printUrl: "",
            pdfAppId: "",
            defaultValue: "",
            fileprefix: "",
            middleFloodDepth: "",
            seldomFloodDepth: "",
            middleFloodDepthKW: "",
            extremFloodDepthKW: "",
            mapfishData: {},
            startBtnLabel: this.$t("additional:modules.waterRiskCheck.formStartButton"),
            finishBtnLabel: this.$t("additional:modules.waterRiskCheck.finishButton")
        };
    },
    computed: {
        ...mapGetters("Modules/WaterRiskCheck", [
            "address",
            "addressCoordinates",
            "configuredQuestions",
            "pdfPages",
            "answersLogic",
            "alwaysShow",
            "alkisBaseUrl",
            "reportPath",
            "feedbackUrl"
        ]),
        ...mapGetters(["restServiceById", "isMobile"]),
        ...mapGetters("Modules/WaterRiskCheckSearchBar", [
            "searchResults"
        ]),
        ...mapGetters("Menu", [
            "menuBySide"
        ]),

        /**
         * Gets the number of the parcel if the parcel is defined.
         * @returns {String} The number.
         */
        parcelNumber () {
            return this.parcel[0]?.properties?.flstnrzae || "";
        },

        /**
         * Gets the name of the district if the parcel is defined.
         * @returns {String} The name.
         */
        districtName () {
            return this.parcel[0]?.properties?.gemarkung || "";
        },

        /**
         * Gets the count of the buildings if there are buildings.
         * @returns {Number|String} The count or an empty String.
         */
        countOfBuildings () {
            if (this.buildings.length > 0) {
                return this.buildings.filter(building => building?.properties?.gebnutzbez === "Gebaeude").length;
            }
            return "";
        },
        /**
         * Gets the names of all pages.
         * @returns {Object[]} Array of key-value-objects representing the pages
         */
        pageNamesFromQuestions () {
            const names = [...this.alwaysShow];

            this.pdfPages.forEach((name) => {
                names[Object.keys(name)[0]] = false;
            });

            return names;
        },
        /**
         * Computes whether minimal ground water is within 4m under ground on the whole parcel.
         * @returns {Boolean} True, if there is ground water within 4m according to the data, false if not.
         */
        groundWaterWithin4m () {
            if (!this.parcel[0]) {
                return false;
            }
            const groupedParcelFeatures =
                spatialOperations.calcArea(this.data.groundWaterMin.geoJsonParcelFeatures ?? [], this.parcel[0], "klasse_in_m_unter_gok");

            return groupedParcelFeatures?.["0,0 bis 1,0_area"] > 0
                || groupedParcelFeatures?.["1,0 bis 2,0_area"] > 0
                || groupedParcelFeatures?.["2,0 bis 3,0_area"] > 0
                || groupedParcelFeatures?.["3,0 bis 4,0_area"] > 0;
        },
        /**
         * Gets the minimum distance to groundwater over the entire parcel.
         * @returns {String} The minimal distance or distance range as a string.
         */
        minimalGroundWaterDistance () {
            if (!this.parcel[0]) {
                return "";
            }
            return this.data.groundWaterMin.geoJsonParcelFeatures
                .map(f => f?.properties?.[this.data.groundWaterMin.propertyToUse])
                .sort((a, b) => a?.localeCompare(b, undefined, {numeric: true}))[0];
        },
        /**
         * Gets a table containing the infiltration classes and their values on the parcel.
         * @returns {String[][]} An array with [classname, value] entries.
         */
        infiltrationTableParcel () {
            const groupedParcelFeatures = this.parcel[0]
                ? spatialOperations.calcArea(this.data.infiltration.geoJsonParcelFeatures ?? [], this.parcel[0], "versickerungswahrscheinlichkeit")
                : undefined;

            return [
                ["möglich", groupedParcelFeatures?.möglich_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"],
                ["wahrscheinlich", groupedParcelFeatures?.wahrscheinlich_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"],
                ["eingeschränkt", groupedParcelFeatures?.eingeschränkt_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"],
                ["unwahrscheinlich", groupedParcelFeatures?.unwahrscheinlich_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"]
            ];
        },
        /**
         * Gets a table containing the infiltration classes and their values on the unbuilt area.
         * @returns {String[][]} An array with [classname, value] entries.
         */
        infiltrationTableUnbuilt () {
            return [
                ["möglich", this.data.infiltration.values?.möglich_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"],
                ["wahrscheinlich", this.data.infiltration.values?.wahrscheinlich_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"],
                ["eingeschränkt", this.data.infiltration.values?.eingeschränkt_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"],
                ["unwahrscheinlich", this.data.infiltration.values?.unwahrscheinlich_percent?.toLocaleString("de-DE", {style: "percent"}) ?? "-"]
            ];
        },
        /**
        * Gets the infiltration values to be included in the report depending on the users' answer.
        * @returns {Object} An object containing the values to use.
         */
        infiltrationValueToUse () {
            return this.pageNamesFromQuestions?.A4_Bestand ?
                Object.fromEntries(this.infiltrationTableUnbuilt) :
                Object.fromEntries(this.infiltrationTableParcel);
        },
        /**
         * Computes whether infiltration is at least likely on the parcel
         * @returns {Boolean} True if there is an area on the parcel with the infiltration category möglich or wahrscheinlich, false if not.
         */
        infiltrationLikelyParcel () {
            return this.data.infiltration.values?.möglich_area > 0
                || this.data.infiltration.values?.wahrscheinlich_area > 0;
        },
        /**
         * Computes whether infiltration is at least likely on the unbuilt area
         * @returns {Boolean} True if there is an area on the unbuilt area with the infiltration category möglich or wahrscheinlich, false if not.
         */
        infiltrationLikelyUnbuilt () {
            const groupedParcelFeatures = this.parcel[0]
                ? spatialOperations.calcArea(this.data.infiltration.geoJsonParcelFeatures ?? [], this.parcel[0], "versickerungswahrscheinlichkeit")
                : undefined;

            return groupedParcelFeatures?.möglich_area > 0
                || groupedParcelFeatures?.wahrscheinlich_area > 0;
        },
        /**
         * Computes whether the parcel is in an ÜSG area
         * @returns {Boolean} True if there are ÜSG features on the parcel, false if not.
         */
        isParcelInUesg () {
            return this.data.uesg.geoJsonParcelFeatures.length > 0;
        },
        /**
         * Computes whether there is flooding around the building in case of SRI 7 rain.
         * @returns {Boolean} True if the water depth is greater than zero, false if not.
         */
        floodingInSri07 () {
            return this.data.sri07_wassertiefe.value?.properties?.value > 0;
        },
        /**
         * Computes whether there is flooding around the building in case of SRI 12 rain.
         * @returns {Boolean} True if the water depth is greater than zero, false if not.
         */
        floodingInSri12 () {
            return this.data.sri12_wassertiefe.value?.properties?.value > 0;
        },
        /**
         * Gets the water depth around the building in case of flooding due to SRI 7 rain.
         * @returns {String} Water depth formatted as string with cm or "-".
         */
        floodingDepthInSri07 () {
            return this.data.sri07_wassertiefe.value?.properties?.value
                ?.toLocaleString("de-DE", {style: "unit", unit: "centimeter"}) ?? "0 cm";
        },
        /**
         * Gets the water depth around the building in case of flooding due to SRI 12 rain.
         * @returns {String} Water depth formatted as string with cm or "-".
         */
        floodingDepthInSri12 () {
            return this.data.sri12_wassertiefe.value?.properties?.value
                ?.toLocaleString("de-DE", {style: "unit", unit: "centimeter"}) ?? "0 cm";
        },
        /**
         * Gets the pages that depend on the data.
         * @returns {Object} An object with page names as keys and true or false as values.
         */
        pageNamesFromData () {
            return {
                "K2": Boolean(this.isParcelInUesg || this.seldomFloodDepth || this.middleFloodDepth),
                "K5_yellow": this.gridCode > 20,
                "K5_blue": this.gridCode < 20,
                "A2": Boolean(this.isParcelInUesg || this.seldomFloodDepth || this.middleFloodDepth || this.middleFloodDepthKW || this.extremFloodDepthKW),
                "K3": this.groundWaterWithin4m,
                "A3_ja": this.groundWaterWithin4m,
                "A3_wn": this.groundWaterWithin4m,
                "A4_Neubau": this.infiltrationLikelyParcel,
                "A4_Bestand": this.infiltrationLikelyUnbuilt,
                "A1_SRI12_ja": this.floodingInSri12 && !this.floodingInSri07,
                "A1_SRI12_nein": this.floodingInSri12 && !this.floodingInSri07,
                "A1_SRI7_ja": this.floodingInSri07,
                "A1_SRI7_nein": this.floodingInSri07
            };
        },

        /**
         * Gets all builindgs of the type 'gebaeude'.
         * @returns {Object[]} The buildings.
         */
        buildingsToUse () {
            return this.buildings.filter(building => building?.properties?.gebnutzbez === "Gebaeude");
        },

        /**
         * Returns the Boolean value if the start button is to display.
         * @returns {Boolean} true to show the start button.
         */
        enabledStart () {
            return Boolean(this.address);
        }
    },
    watch: {
        /**
         * Listen to changes in "modules/WaterRiskCheck/address".
         * @returns {void}
         */
        address: {
            immediate: true,
            handler () {
                this.createLayer();
                if ((this.formStarted && this.address !== "") || this.formFinished) {
                    this.resetAll(false);
                }
                this.walkTroughToFetchAndAdd();
            }
        },
        /**
         * Setting the finished button label according to cearted process.
         * @param {Boolean} val - true if the pdf is in creating process.
         * @returns {void}
         */
        isCreatingPDF (val) {
            if (val) {
                this.finishBtnLabel = this.$t("additional:modules.waterRiskCheck.waitingLabel");
            }
            else {
                this.finishBtnLabel = this.$t("additional:modules.waterRiskCheck.finishButton");
            }
        },
        /**
         * Setting the stared button label according to the visibility of spinner.
         * @param {Boolean} val - true if the spinner is showing.
         * @returns {void}
         */
        showSpinner (val) {
            if (val) {
                this.startBtnLabel = this.$t("additional:modules.waterRiskCheck.waitingLabel");
            }
            else {
                this.startBtnLabel = this.$t("additional:modules.waterRiskCheck.formStartButton");
            }
        },

        currentQuestionIdx (val) {
            this.updateCalculatedPercentage(val);
            if (this.infoBoxOpen) {
                this.$refs.information.click();
            }
        },

        data: {
            handler (val) {
                this.middleFloodDepth = this.getDeepFloodDepth(val, "hwrm_mittel");
                this.seldomFloodDepth = this.getDeepFloodDepth(val, "hwrm_selten");
                this.gridCode = parseInt(this.getDeepFloodDepth(val, "hwrm_extrem_kw", "gridcode"), 10);
                this.extremFloodDepthKW = this.getDeepFloodDepth(val, "hwrm_extrem_kw");
                this.middleFloodDepthKW = this.getDeepFloodDepth(val, "hwrm_middle_kw");
            },
            deep: true
        },

        mapfishData (val) {
            this.finishForm(val);
        }
    },
    created () {
        if (this.isMobile) {
            this.setExpandedBySide({expanded: true, side: "secondaryMenu"});
        }
        if (!this.isMobile && window.innerWidth < 992) {
            this.menuBySide("mainMenu").expanded = false;
            this.menuBySide("secondaryMenu").width = "50%";
        }
    },
    mounted () {
        this.questions = [...this.configuredQuestions];
        this.sideMenuWidth = document.getElementById("mp-menu-secondaryMenu").style.width;
        document.getElementById("mp-body-secondaryMenu")?.classList?.add("overflow-scroll");
        if (!this.isMobile && window.innerWidth < 992) {
            this.menuBySide("secondaryMenu").width = "50%";
        }
        if (this.isMobile) {
            this.setNavigationHistoryBySide({side: "secondaryMenu", newHistory: [{type: "root", props: []}]});
        }
        this.setConfig();
    },
    unmounted () {
        this.resetAll(false);
        document.getElementById("mp-menu-secondaryMenu").style.width = this.sideMenuWidth;
        document.getElementById("mp-body-secondaryMenu")?.classList?.remove("overflow-scroll");
    },
    methods: {
        ...mapActions("Modules/WaterRiskCheck", [
            "updateAddress"
        ]),
        ...mapActions("Menu", [
            "closeMenu"
        ]),
        ...mapMutations("Menu", [
            "setExpandedBySide",
            "setNavigationHistoryBySide"
        ]),

        /**
         * Creates a layer for the display of parcels and buildings on the map.
         * @returns {void}
         */
        createLayer () {
            if (typeof layerCollection.getLayerById("water-risk") !== "undefined") {
                this.layer = layerCollection.getLayerById("water-risk");
                return;
            }
            this.layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: "water-risk",
                name: "water-risk",
                alwaysOnTop: true
            });
            this.setLayerStyle(this.layer, this.styleBuilding, this.styleParcel);
            layerCollection.addLayer(this.layer);
        },

        /**
         * Sets the layer style for building and parcel features.
         * @param {Object} layer - The layer.
         * @param {Object} styleBuilding - Contains the style rules for the buildings.
         * @param {Object} styleParcel - Contains the style rules for the parcel.
         * @returns {void}
         */
        setLayerStyle (layer, styleBuilding, styleParcel) {
            const building = new Style({
                    stroke: new Stroke(styleBuilding.stroke),
                    fill: new Fill(styleBuilding.fill)
                }),
                parcel = new Style({
                    stroke: new Stroke(styleParcel.stroke),
                    fill: new Fill(styleParcel.fill)
                });

            layer.setStyle((feature) => {
                if (feature.get("idflurst")) {
                    return parcel;
                }
                if (feature.get("gebnutzbez") === "Gebaeude") {
                    return building;
                }
                return null;
            });
        },

        /**
         * Gets the config for the valuation and sets it.
         * In addition, the print url is set from the config.
         * @param {Function} onsuccess - Is called when the config is set.
         * @returns {void}
         */
        setConfig () {
            axios.get(this.reportPath, {
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(response => {
                    this.config = response.data;
                    this.printUrl = this.restServiceById(response.data.settings.printServiceId).url;
                    this.pdfAppId = response.data.settings?.pdfAppId;
                    this.defaultValue = response.data.settings.defaultValue;
                    this.fileprefix = this.$t(response.data.settings.fileprefix);
                })
                .catch(() => {
                    console.warn("Could not load the config file config.valuation.json");
                });
        },

        /**
         * Creates a point geometry from the address and
         * fetches the parcel and the building for this address.
         * All buildings that intersect the parcel are also fetched.
         * Adds the parcel and all buildings to the layer.
         * @returns {void}
         */
        async walkTroughToFetchAndAdd () {
            if (this.addressCoordinates === undefined) {
                return;
            }

            this.showSpinner = true;
            const addressPoint = new Point(this.addressCoordinates),
                addressPointWGS8 = addressPoint.clone().transform("EPSG:25832", "EPSG:4326"),
                parcelGeometry = new MultiPolygon([]);

            this.layer.getLayerSource().clear();
            this.parcel = await this.fetchFeatures(addressPointWGS8, "Flurstueck", this.alkisBaseUrl, "geometrie", true);
            this.buildingsByAddress = spatialOperations.buffer(await this.fetchFeatures(addressPointWGS8, "GebaeudeBauwerk", this.alkisBaseUrl, "geometrie", true));
            parcelGeometry.setCoordinates([spatialOperations.buffer(this.parcel, -1)[0].geometry.coordinates]);
            this.buildings = spatialOperations.buffer(await this.fetchFeatures(parcelGeometry, "GebaeudeBauwerk", this.alkisBaseUrl, "geometrie"), 2);

            await this.addDataByParcel(this.data, this.parcel[0], parcelGeometry);
            this.showSpinner = false;
        },

        /**
         * Returns the legends for Mapfish
         * @param {Object} legends - The legends from the config
         * @return {Object} - The legends for Mapfish
         */
        getLegends (legends) {
            const legendsObj = {};

            if (!isObject(legends)) {
                console.error("Wrong config for legends");
                return {};
            }
            if (Object.keys(legends).length > 0) {
                Object.keys(legends).forEach(tags => {
                    if (Array.isArray(Object.keys(legends[tags]))) {
                        Object.keys(legends[tags]).forEach(legend => {
                            legendsObj[tags + "_" + legend] = legends[tags][legend].content;
                        });
                    }
                });
            }

            return legendsObj;
        },

        /**
         * Returns the map configuration for Mapfish
         * @param {Object} parcel - the Parcel Object
         * @param {Object} specification - The specification object from the config
         * @return {Object} - The map configurations
         */
        async getMapConf (parcel, specification) {
            const mapConf = {};

            if (!isObject(parcel) || Object.keys(parcel).length === 0 || !isObject(specification) || !Object.prototype.hasOwnProperty.call(specification, "cards")) {
                console.error("Wrong configuration or parcel data!");
                return {};
            }

            try {
                const
                    cards = specification.cards,
                    cardKeys = Object.keys(cards),
                    mapProjection = "EPSG:25832",
                    feature = new GeoJSON().readFeature(parcel, {
                        dataProjection: "EPSG:4326",
                        featureProjection: mapProjection
                    }),
                    extent = feature.getGeometry().getExtent();

                if (cardKeys.length > 0) {
                    for (const card of cardKeys) {
                        const mapfishDialogInstance = new MapfishDialog(
                            null,
                            {tmpAttr1: {tmpAttr2: cards[card]}},
                            "",
                            mapProjection,
                            "A4 Hochformat",
                            this.getFilenameOfPDF(this.fileprefix, dayjs().format("YYYY-MM-DD")),
                            false
                        );

                        if (cards[card].type === "mapProportion") {
                            const mfDialog = await mapfishDialogInstance.create({extent, feature});

                            mapConf[card] = mfDialog.attributes["tmpAttr1.tmpAttr2"];
                        }
                        else if (cards[card].type === "mapWalker") {
                            const mfDialog = await mapfishDialogInstance.create(bbox(parcel));

                            mapConf[card] = mfDialog.attributes["tmpAttr1.tmpAttr2"];
                        }
                        else if (cards[card].type === "mapFixed") {
                            const mfDialog = await mapfishDialogInstance.create(bbox(parcel));

                            mapConf[card] = mfDialog.attributes["tmpAttr1.tmpAttr2"];
                        }
                    }
                }
            }
            catch (error) {
                console.warn(error);
            }

            return mapConf;
        },

        /**
         * Returns the filename of the pdf with timestamp.
         * @param {String} [fileprefix=""] The prefix to use for the filename.
         * @param {String} [timestamp=""] A timestamp to use for better ui.
         * @returns {String} The current filname.
         */
        getFilenameOfPDF (fileprefix = "", timestamp = "") {
            return timestamp + " " + fileprefix;
        },

        /**
         * Adds the passed spatial data for the parcel.
         * @param {Object} data - The spatial data to add.
         * @param {GeoJSON} parcelFeature - The feature of the parcel.
         * @param {ol/Geometry} parcelGeometry - The geometry of the parcel.
         * @returns {void}
         */
        async addDataByParcel (data, parcelFeature, parcelGeometry) {
            const unbuiltArea = spatialOperations.getUnbuiltArea(parcelFeature, this.buildingsToUse),
                localData = {...data};

            for (const key of Object.keys(localData)) {
                if (localData[key].type === "WCS") {
                    const point = await this.getHeavyRainPointForPolygons(localData[key].baseURL, localData[key].coverageId, bbox(spatialOperations.buffer([parcelFeature])[0]), localData[key].epsg, this.buildingsToUse).catch(error => console.error(error));

                    localData[key].value = point;
                }
                else {
                    const geoJsonList = await this.fetchFeatures(parcelGeometry, localData[key].collection, localData[key].url, localData[key].geometryName);

                    localData[key].geoJsonParcelFeatures = spatialOperations.intersect(geoJsonList, parcelFeature);
                    localData[key].geoJsonFeatures = spatialOperations.intersect(geoJsonList, unbuiltArea);
                    if (localData[key].propertyToUse) {
                        localData[key].values = spatialOperations.calcArea(localData[key].geoJsonFeatures, unbuiltArea, localData[key].propertyToUse);
                    }
                }
            }
            this.data = localData;
        },

        /**
         * Fetches the features of the passed collection.
         * @param {ol/geom/Geometry} geometry - The geometry to filter.
         * @param {String} collection - The feature collection id.
         * @param {Stirng} url - The base api url.
         * @param {String} geom - The name of the geometry property.
         * @param {Boolean} [flag=false] - Controls whether the features should be added to the layer.
         * @returns {GeoJSON[]} The response.
         */
        async fetchFeatures (geometry, collection, url, geom, flag = false) {
            try {
                const filter = getOAFFeature.getOAFGeometryFilter(geometry, geom, "intersects"),
                    geoJson = await getOAFFeature.getOAFFeatureGet(url, collection, {
                        limit: 100,
                        filter,
                        filterCrs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84",
                        crs: "http://www.opengis.net/def/crs/OGC/1.3/CRS84"
                    });

                if (flag) {
                    const features = getOAFFeature.readAllOAFToGeoJSON(geoJson, {dataProjection: "EPSG:4326", featureProjection: "EPSG:25832"});

                    this.layer.getLayerSource().addFeatures(features);
                }
                return geoJson;
            }
            catch (error) {
                console.warn("An error has occurred when requesting the features", error);
                return [];
            }
        },

        /**
         * Gets the point with the highest score for heavy rain for given polygons.
         * @param {String} baseUrl The base url to request the wcs points.
         * @param {String} coverageId The coverage id to request.
         * @param {Number[]} boundingBox The bounding box.
         * @param {String} epsg The EPSG code.
         * @param {Object[]} polygons The polygons.
         * @returns {Object|null} the point with the highest found result.
         */
        async getHeavyRainPointForPolygons (baseUrl, coverageId, boundingBox, epsg, polygons) {
            return new Promise((resolve, reject) => {
                getWCSFeatures.getWCSPoints(baseUrl, coverageId, boundingBox, epsg).then(points => {
                    resolve(spatialOperations.findPointInPolygonsByHighestValue(points, polygons));
                }).catch(error => reject(error));
            });
        },

        /**
         * Starts the form.
         * @returns {void}
         */
        startForm () {
            this.formStarted = true;
        },
        /**
         * Sets the selected answer to the question.
         * @param {Number} questionId The question index.
         * @param {String} selectedAnswer The selected answer.
         */
        selectAnswer (questionId, selectedAnswer) {
            this.questions[questionId].selectedAnswer = selectedAnswer;
        },
        /**
         * Goes back one page in the form.
         * @returns {void}
         */
        previousPage () {
            if (this.currentQuestionIdx <= 0) {
                return;
            }
            this.currentQuestionIdx -= 1;
        },
        /**
         * Goes forward one page in the form.
         * @returns {void}
         */
        nextPage () {
            if (this.currentQuestionIdx >= this.questions.length - 1) {
                return;
            }
            this.currentQuestionIdx += 1;
        },
        /**
         * Creates the mapfish dialog and sets mapfishData
         * @return {void}
         */
        async createMapfishDialog () {
            const mapConf = await this.getMapConf(this.parcel[0], this.config?.specification),
                legends = this.getLegends(this.config?.legends),
                pdfPageNames = this.preparePDFPageNames(this.pdfPages),
                attributes = this.getAttributes(mapConf, legends, pdfPageNames);

            this.mapfishData = {
                "layout": "A4 Hochformat",
                attributes,
                "outputFilename": "Ausdruck",
                "uniqueIdList": [],
                "visibleLayerIds": ["19969"],
                "outputFormat": "pdf"
            };
        },
        /**
         * Finishes the form.
         * @param {Object} mapfishDialog - The mapfish dialog
         * @returns {void}
         */
        finishForm (mapfishDialog) {
            this.updateCalculatedPercentage("finish");
            this.isCreatingPDF = true;
            setTimeout(() => {
                this.startPrint(this.printUrl, "pdf",
                    this.pdfAppId,
                    mapfishDialog,
                    (url, payload) => {
                        return axios.post(url, payload);
                    },
                    error => {
                        console.error(error);
                    },
                    url => {
                        this.downloadLink = url;
                        this.isCreatingPDF = false;
                        this.formStarted = false;
                        this.formFinished = true;
                    });
            }, 2000);
        },
        /**
         * Returns the attributes needed for Mapfish dialog
         * @param {Object} mapConf - The map configuration
         * @param {Object} legends - The legends
         * @param {Object} pdfPageNames - The names of the pages to be printed
         * @return {Object} Attributes - The attribute for Mapfish dialog
         */
        getAttributes (mapConf, legends, pdfPageNames) {
            if (!isObject(mapConf) || !isObject(legends) || !isObject(pdfPageNames)) {
                return {};
            }

            const attributes = {
                "adresse": this.address,
                "datum": dayjs().format("DD.MM.YYYY"),
                "K1.legend": legends.starkregengefahrenkarte_karte,
                "K1.außergewoehnliches.uebersichtskarte": mapConf.starkregengefahrenkarte_aussergewoehnlich,
                "K1.aussergewoehnliches.gebaeude": "Um das bzw. die Gebäude",
                "K1.aussergewoehnliches.wassertiefe": this.floodingDepthInSri07,
                "K1.extremes.gebaeude": "Um das bzw. die Gebäude",
                "K1.extremes.wassertiefe": this.floodingDepthInSri12,
                "K1.extremes.uebersichtskarte": mapConf.starkregengefahrenkarte_extrem,
                "K2.uesg": this.isParcelInUesg,
                "K2.mittleres.gebaeude": "Gebäude (1)",
                "K2.mittleres.wassertiefe": this.middleFloodDepth || "0 m",
                "K2.mittleres.uebersichtskarte": mapConf.hochwasser_binnenhw_mittleres_ereignis,
                "K2.seltenes.gebaeude": "Gebäude (1)",
                "K2.seltenes.wassertiefe": this.seldomFloodDepth || "0 m",
                "K2.seltenes.uebersichtskarte": mapConf.hochwasser_binnenhw_seltenes_ereignis,
                "K2.legend": legends.hochwasser_binnenhw,
                "K5.extremes.wassertiefe": this.extremFloodDepthKW || "0 m",
                "K5.mittleres.wassertiefe": this.middleFloodDepthKW || "0 m",
                "K5.extremes.uebersichtskarte": mapConf.hwrm_extrem_kw,
                "K5.mittleres.uebersichtskarte": mapConf.hwrm_middle_kw,
                "K3.uebersichtskarte": mapConf.grundwasser_flurabstand_min,
                "K3.minimaler_flurabstand": this.minimalGroundWaterDistance,
                "K3.legend": legends.grundwasser_flurabstand_min,
                "K4.uebersichtskarte": mapConf.versickerungspotential,
                "K4.legend": legends.versickerungspotential_karte,
                "K4.tabelle.werteart": this.pageNamesFromQuestions?.A4_Bestand ?
                    "Anteil auf der unbebauten Fläche des Flurstücks" :
                    "Anteil auf der Gesamtfläche des Flurstücks",
                "K4.tabelle.möglich": this.infiltrationValueToUse.möglich,
                "K4.tabelle.wahrscheinlich": this.infiltrationValueToUse.wahrscheinlich,
                "K4.tabelle.eingeschränkt": this.infiltrationValueToUse.eingeschränkt,
                "K4.tabelle.unwahrscheinlich": this.infiltrationValueToUse.unwahrscheinlich
            };

            Object.assign(attributes, pdfPageNames);

            return attributes;
        },
        /**
         * Toggles the infoBoxOpen flag.
         * @returns {void}
         */
        toggleInfoBox () {
            this.infoBoxOpen = !this.infoBoxOpen;
        },
        /**
         * Toggles the instruction flag.
         * @returns {void}
         */
        toggleInstruction () {
            this.instructionBoxOpen = !this.instructionBoxOpen;
        },
        /**
         * Calculates the percentage of the progress bar.
         * Use finish as parameter to create a last finishing step.
         * @param {Number|String} pageIndex The page index or 'finish' if last page.
         * @returns {void}
         */
        updateCalculatedPercentage (pageIndex) {
            if (pageIndex === "finish") {
                this.calculatedPercentage = 100;
                return;
            }
            this.calculatedPercentage = Number(pageIndex / (this.questions.length - 1) * 100).toFixed(2);
        },
        /**
         * Resets the address and selected answers.
         * @param {Boolean} address True if the address is also to be reset. Default is true.
         * @returns {void}
         */
        resetAll (address = true) {
            this.formStarted = false;
            this.formFinished = false;
            this.currentQuestionIdx = 0;
            this.questions.forEach(val => {
                delete val.selectedAnswer;
            });
            if (address) {
                this.layer?.getLayerSource()?.clear();
                this.parcel = {};
                this.buildings = [];
                this.updateAddress({name: "", type: "Address"});
            }
        },
        /**
         * Evaluates the answers.
         * @param {Number} questionId The question index.
         * @param {String} selectedAnswer The selected answer.
         * @returns {void}
         */
        evaluatingAnswers (questionId, answer) {
            this.answersLogic.forEach((question, idx) => {
                if (idx === questionId) {
                    Object.values(question).forEach((allAnswers) => {
                        if (Object.keys(allAnswers).some(key => key === answer)) {
                            this.setNameFromSelectedAnswer(allAnswers, answer);
                        }
                    });
                }
            });
        },
        /**
         * Sets the name of the PDF page depending on the selected answer.
         * @param {Object} answersFromQuestion The question index.
         * @param {String} selectedAnswer The selected answer.
         * @returns {void}
         */
        setNameFromSelectedAnswer (answersFromQuestion, selectedAnswer) {
            const givenAnswers = Object.keys(this.pageNamesFromQuestions);

            if (givenAnswers.length !== 0) {
                givenAnswers.forEach((key) => {
                    Object.values(answersFromQuestion).forEach((val, idx) => {
                        if (key === val[idx] || val.includes(key)) {
                            this.pageNamesFromQuestions[key] = false;
                        }
                    });
                });
            }
            answersFromQuestion[selectedAnswer].forEach((page) => {
                if (page !== undefined) {
                    this.pageNamesFromQuestions[page] = true;
                }
            });
        },
        /**
         * Prepare pdf pages depending on the questions and data evaluated.
         * @param {Object} pdfPages - pdf pages from the config
         * @returns {Object[]} Returns a list of page name objects
         */
        preparePDFPageNames (pdfPages) {
            const pageNames = {};

            pdfPages?.forEach((page) => {
                Object.keys(page).forEach(val => {
                    pageNames[val] = this.pageNamesFromQuestions[val] === page[val].question
                        && (this.pageNamesFromData[val] || !page[val].data);
                });
            });

            if (Array.isArray(this.alwaysShow) && this.alwaysShow.length > 0) {
                this.alwaysShow.forEach(page => {
                    Object.keys(page).forEach(key => {
                        pageNames[key] = true;
                    });
                });
            }

            return pageNames;
        },

        /**
         * Starts the print process. Creates a print job then asks for the status.
         * @param {String} url - MapFish Print url.
         * @param {String} format - The output format (e.g. pdf or png).
         * @param {String} appId - The identifier of the print configurations.
         * @param {Object} mapfishDialog - The POST body.
         * @param {Function} onstart - Function that creates the print job.
         * @param {Function} onerror - Is called when the status is "cancelled" or "error".
         * @param {Function} onfinish - Is called when the status is "finished".
         * @returns {void}
         */
        startPrint (url, format, appId, mapfishDialog, onstart, onerror, onfinish) {
            startPrintProcess(url, format, appId, mapfishDialog, onstart, undefined, onerror, onfinish);
        },

        /**
         * Gets the deepest flood depth according to the flood type
         * @param {Object} data - the required and generated data for buildings.
         * @param {String} type - The flood type.
         * @param {String} [propertyToUse] - The property to use for the flood depth.
         * @returns {String} the deepest depth.
         */
        getDeepFloodDepth (data, type, propertyToUse = false) {
            if (!isObject(data) || typeof type !== "string" || !Object.prototype.hasOwnProperty.call(data, type)) {
                return "";
            }

            if (!Array.isArray(data[type].geoJsonParcelFeatures) || !data[type].geoJsonParcelFeatures.length) {
                return "";
            }

            const features = spatialOperations.intersect(data[type].geoJsonParcelFeatures, this.buildingsToUse[0]),
                property = propertyToUse || data[type].propertyToUse,
                floodDepth = [];
            let deepestFloodDepth = "";

            if (Array.isArray(features)) {
                features.forEach(feature => {
                    if (feature?.properties[property] && !floodDepth.includes(feature?.properties[property])) {
                        floodDepth.push(feature?.properties[property]);
                    }
                });
            }

            if (floodDepth.length) {
                deepestFloodDepth = floodDepth.sort((a, b) => a.toString().localeCompare(b.toString(), undefined, {numeric: true})).slice(-1)[0];
            }

            return deepestFloodDepth;
        },

        /**
         * Opens the url in window.
         * @returns {void}
         */
        openWindow (val) {
            window.open(val, "_blank");
        }
    }

};
</script>

<template lang="html">
    <div
        id="tool-waterRiskCheck"
        class="water-risk-check position-relative"
    >
        <div v-if="!formStarted && !formFinished">
            <div class="d-flex align-items-center justify-content-between justify-content-md-start mb-2 mb-md-3">
                <h6
                    class="slogan mb-0"
                    v-html="$t('additional:modules.waterRiskCheck.slogan')"
                />
                <img
                    class="mobile-extra-logo d-md-none ms-2"
                    :src="'https://geodienste.hamburg.de/lgv-config/img/hh-logo.png'"
                    alt="Hamburg Logo"
                >
            </div>
            <p
                class="info-text d-none d-md-block lh-base"
                v-html="$t('additional:modules.waterRiskCheck.generelExplenationText')"
            />
            <div class="row align-items-center justify-content-md-center my-2 my-md-4">
                <div class="col-12 col-md-auto text-center mb-3 mb-md-0 px-md-3">
                    <img
                        class="header-logo img-fluid w-15 w-md-100"
                        :src="'./assets/Logo-Wegweiser-Ueberflutungsvorsorge.png'"
                        :alt="$t('additional:modules.waterRiskCheck.toolIconAltText')"
                    >
                </div>
                <div class="col-12 col-md-auto text-center mb-3 mb-md-0 px-md-3">
                    <ul class="start-list d-inline-block text-start mb-0 lh-lg ps-0">
                        <li><i class="check-icon bi bi-check-lg me-2" /> {{ $t('additional:modules.waterRiskCheck.duration') }}</li>
                        <li><i class="check-icon bi bi-check-lg me-2" /> {{ $t('additional:modules.waterRiskCheck.address') }}</li>
                        <li><i class="check-icon bi bi-check-lg me-2" /> {{ $t('additional:modules.waterRiskCheck.information') }}</li>
                    </ul>
                </div>
            </div>
            <AccordionItem
                id="instructions-accordion"
                class="d-none d-md-block"
                :title="$t('additional:modules.waterRiskCheck.instructions')"
                icon="bi bi-info-circle"
            >
                <p
                    class="info-text lh-base"
                    v-html="$t('additional:modules.waterRiskCheck.instructionsText')"
                />
            </AccordionItem>
            <FlatButton
                id="instructions-button"
                class="d-md-none mb-3 btn-sm"
                icon="bi-play-circle"
                type="button"
                :aria-label="$t('additional:modules.waterRiskCheck.infoButton')"
                :text="$t('additional:modules.waterRiskCheck.infoButton')"
                :interaction="() => toggleInstruction()"
            />
            <ModalItem
                :show-modal="instructionBoxOpen"
                modal-inner-wrapper-style="background-color: #f6f9ff"
                @modalHid="toggleInstruction"
            >
                <div class="mobile card card-body">
                    <div class="container p-0">
                        <div class="row">
                            <div class="col-12">
                                <h5 class="question-headline pt-4 pb-2">
                                    {{ $t("additional:modules.waterRiskCheck.instructions") }}
                                </h5>
                                <p
                                    class="info-text d-md-block lh-base pb-4"
                                    v-html="$t('additional:modules.waterRiskCheck.generelExplenationText')"
                                />
                                <p
                                    class="info-text lh-base"
                                    v-html="$t('additional:modules.waterRiskCheck.instructionsText')"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </ModalItem>
            <div class="decorative-box d-flex flex-column w-100 px-4 mt-3 pb-3">
                <span class="ms-3 mt-4">
                    {{ $t("additional:modules.waterRiskCheck.enterAddress") }}
                </span>
                <WaterRiskCheckSearchBar :disabled="showSpinner" />
            </div>
            <div
                v-if="enabledStart"
                class="container mt-3"
            >
                <div class="info-card-white mx-auto p-4 mt-4">
                    <div class="card-content d-flex align-items-center justify-content-center gap-3">
                        <div class="icon-wrapper bg-white">
                            <i class="geo-icon bi-geo-alt-fill" />
                        </div>
                        <div class="text-wrapper">
                            <p class="current-address mb-1">
                                {{ address }}
                            </p>
                            <p class="building-count mb-0">
                                {{ countOfBuildings + " " + $t("additional:modules.waterRiskCheck.buildings") }}
                            </p>
                        </div>
                    </div>
                    <div class="divider my-3 d-none d-md-block" />
                    <button
                        type="button"
                        class="btn btn-link d-none d-md-block mx-auto mt-3 text-center"
                        :aria-label="$t('additional:modules.waterRiskCheck.discardAddress')"
                        :disabled="showSpinner"
                        @click="resetAll"
                    >
                        {{ $t("additional:modules.waterRiskCheck.discardAddress") }}
                    </button>
                </div>
                <div class="d-flex flex-column align-items-center w-100 mt-4">
                    <FlatButton
                        id="start-form"
                        class="w-100 mb-2"
                        icon="bi-play-circle"
                        type="button"
                        :aria-label="startBtnLabel"
                        :disabled="showSpinner"
                        :text="startBtnLabel"
                        :interaction="startForm"
                        :spinner-trigger="showSpinner"
                    />
                    <FlatButton
                        id="discard-adress"
                        class="w-100 d-md-none"
                        icon="bi bi-arrow-counterclockwise"
                        type="button"
                        :secondary="true"
                        :aria-label="$t('additional:modules.waterRiskCheck.discardAddress')"
                        :disabled="showSpinner"
                        :text="$t('additional:modules.waterRiskCheck.discardAddress')"
                        :interaction="() => resetAll()"
                    />
                </div>
                <div class="mb-3 mt-2 d-none d-md-block">
                    <p>
                        {{ $t('additional:modules.waterRiskCheck.informationTextIconLabel') }}
                    </p>
                    <p
                        class="hint-text col"
                        v-html="$t('additional:modules.waterRiskCheck.informationText')"
                    />
                </div>
                <AccordionItem
                    id="hint-information"
                    class="d-md-none mt-4"
                    :title="$t('additional:modules.waterRiskCheck.informationTextIconLabel')"
                    icon="bi bi-info-circle"
                >
                    <p
                        class="info-text lh-base"
                        v-html="$t('additional:modules.waterRiskCheck.informationText')"
                    />
                </AccordionItem>
            </div>
        </div>
        <div v-else-if="formStarted && !formFinished && questions.length">
            <div class="container basic-infos">
                <div class="info-header row align-items-center g-2">
                    <div class="col col-md-auto d-flex flex-column justify-content-center">
                        <p class="mb-0 small text-muted d-md-block lh-1">
                            {{ $t('additional:modules.waterRiskCheck.addressLabel') }}
                        </p>
                        <div class="d-flex align-items-center flex-nowrap mt-n1">
                            <p class="basic-infos-address mb-0 text-truncate me-2">
                                {{ address }}
                            </p>
                            <IconButton
                                id="reset-button"
                                :aria="$t('additional:modules.waterRiskCheck.reset')"
                                :interaction="() => resetAll()"
                                :class-array="['remove', 'btn-light', 'fs-6']"
                                icon="bi bi-pencil-fill"
                            />
                        </div>
                    </div>
                    <div class="col-auto ms-auto text-end">
                        <img
                            class="header-logo"
                            :src="'./assets/Logo-Wegweiser-Ueberflutungsvorsorge.png'"
                            :alt="$t('additional:modules.waterRiskCheck.toolIconAltText')"
                        >
                    </div>
                </div>
            </div>
            <div class="form-container container">
                <div class="progress-section px-4 my-4 row">
                    <div class="d-flex justify-content-center">
                        {{ $t('additional:modules.waterRiskCheck.themeProgressLabel', {currentIdx: currentQuestionIdx + 1, maxLength: questions.length}) }}
                    </div>
                    <div class="progress p-0">
                        <div
                            class="progress-bar"
                            role="progressbar"
                            :style="`width: ${calculatedPercentage}%`"
                            :aria-valuenow="calculatedPercentage"
                            aria-valuemin="0"
                            aria-valuemax="100"
                        />
                    </div>
                </div>
                <div class="question-section row mt-4 mb-5">
                    <div class="container d-flex flex-column">
                        <div class="d-flex flex-column align-items-start justify-content-center">
                            <h5 class="question-headline pt-3">
                                {{ questions[currentQuestionIdx].title }}
                            </h5>
                            <span class="mb-2">
                                {{ questions[currentQuestionIdx].question }}
                            </span>
                            <button
                                id="information"
                                ref="information"
                                type="button"
                                class="btn btn-sm btn-secondary rounded-pill lh-1 me-2 mb-2 mt-2"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseInfo"
                                aria-expanded="false"
                                aria-controls="collapseInfo"
                                @click="toggleInfoBox"
                            >
                                <i
                                    class="bi fs-6 pe-2"
                                    :class="[infoBoxOpen ? 'bi-x-circle' : 'bi-info-circle']"
                                />
                                {{ infoBoxOpen ? $t('additional:modules.waterRiskCheck.closeInfoButton') : $t('additional:modules.waterRiskCheck.infoButton') }}
                            </button>
                            <div
                                v-if="!isMobile"
                                id="collapseInfo"
                                class="collapse"
                            >
                                <div class="collapse-border card card-body p-4 border rounded">
                                    <div class="container p-0">
                                        <div class="row">
                                            <div class="col-12">
                                                <h6 class="question-headline col-6">
                                                    {{ questions[currentQuestionIdx].title }}
                                                </h6>
                                                <img
                                                    class="information-image float-end img-fluid px-2 pb-2"
                                                    :src="questions[currentQuestionIdx].info.image"
                                                    :alt="questions[currentQuestionIdx].info.alt"
                                                >
                                                <p
                                                    v-html="questions[currentQuestionIdx].info.text"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <ModalItem
                                v-else
                                :show-modal="infoBoxOpen"
                                modal-inner-wrapper-style="background-color: #f6f9ff"
                                @modalHid="toggleInfoBox"
                            >
                                <div class="mobile card card-body">
                                    <div class="container p-0">
                                        <div class="row">
                                            <div class="col-12">
                                                <h5 class="question-headline pt-4 pb-2">
                                                    {{ questions[currentQuestionIdx].title }}
                                                </h5>
                                                <p
                                                    v-html="questions[currentQuestionIdx].info.text"
                                                />
                                                <img
                                                    class="information-image img-fluid"
                                                    :src="questions[currentQuestionIdx].info.image"
                                                    :alt="questions[currentQuestionIdx].info.alt"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ModalItem>
                        </div>
                        <div class="answer-container d-flex flex-column align-items-center">
                            <div
                                v-for="answer in questions[currentQuestionIdx].answers"
                                :key="answer"
                                tabindex="0"
                                role="button"
                                class="answer d-flex justify-content-center mt-3 py-2 border position-relative"
                                :class="[
                                    questions[currentQuestionIdx].selectedAnswer === answer ? 'marked-answers' : '',
                                    isCreatingPDF ? 'disabled-answer': ''
                                ]"
                                @click="selectAnswer(currentQuestionIdx, answer), evaluatingAnswers(currentQuestionIdx, answer)"
                                @keypress.enter="selectAnswer(currentQuestionIdx, answer), evaluatingAnswers(currentQuestionIdx, answer)"
                            >
                                <i
                                    v-if="questions[currentQuestionIdx].selectedAnswer === answer"
                                    class="selected-answer-icon position-absolute bi bi-check-circle-fill fs-6 pe-2 text-secondary"
                                />
                                <div>
                                    {{ answer }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr class="mb-4">
                <div class="d-flex flex-row justify-content-between">
                    <FlatButton
                        id="page-back"
                        :aria-label="$t('additional:modules.waterRiskCheck.backPage')"
                        type="button"
                        :text="$t('additional:modules.waterRiskCheck.backPage')"
                        :interaction="previousPage"
                        :disabled="currentQuestionIdx <= 0 || isCreatingPDF"
                        icon="bi-arrow-left-circle-fill"
                    />
                    <FlatButton
                        v-if="currentQuestionIdx < questions.length -1"
                        id="page-forward"
                        :aria-label="$t('additional:modules.waterRiskCheck.forwardPage')"
                        type="button"
                        :text="$t('additional:modules.waterRiskCheck.forwardPage')"
                        :interaction="nextPage"
                        :disabled="typeof questions[currentQuestionIdx].selectedAnswer === 'undefined'"
                        icon="bi-arrow-right-circle-fill"
                    />
                    <FlatButton
                        v-else
                        id="page-forward"
                        :aria-label="finishBtnLabel"
                        type="button"
                        :text="finishBtnLabel"
                        :interaction="createMapfishDialog"
                        :disabled="typeof questions[currentQuestionIdx].selectedAnswer === 'undefined' || isCreatingPDF"
                        :spinner-trigger="isCreatingPDF"
                        icon="bi-arrow-right-circle-fill"
                    />
                </div>
            </div>
        </div>
        <div v-else>
            <div class="container basic-infos">
                <div class="info-header row align-items-center g-2 mb-3">
                    <div class="col col-md-auto d-flex flex-column justify-content-center">
                        <p class="mb-0 small text-muted d-md-block lh-1">
                            {{ $t('additional:modules.waterRiskCheck.addressLabel') }}
                        </p>
                        <div class="d-flex align-items-center flex-nowrap mt-n1">
                            <p class="basic-infos-address mb-0 text-truncate me-2">
                                {{ address }}
                            </p>
                        </div>
                    </div>
                    <div class="col-auto ms-auto text-end">
                        <img
                            class="header-logo"
                            :src="'./assets/Logo-Wegweiser-Ueberflutungsvorsorge.png'"
                            :alt="$t('additional:modules.waterRiskCheck.toolIconAltText')"
                        >
                    </div>
                </div>
            </div>
            <div class="container mt-4">
                <div class="row align-items-center mb-3">
                    <h5 class="col col-md">
                        {{ $t('additional:modules.waterRiskCheck.downloadPageTitle') }}
                    </h5>
                </div>
                <div
                    ref="downloadSection"
                    class="mt-3"
                >
                    <div class="container">
                        <div class="row flex-column gap-2">
                            <div class="decorative-box d-flex flex-column p-3">
                                <p class="download-text mb-2">
                                    {{ $t('additional:modules.waterRiskCheck.downloadInformationText') }}
                                </p>
                                <FlatButton
                                    id="download-report"
                                    :aria-label="$t('additional:modules.waterRiskCheck.download')"
                                    type="button"
                                    :text="$t('additional:modules.waterRiskCheck.download')"
                                    icon="bi-download"
                                    :interaction="() => openWindow(downloadLink)"
                                />
                            </div>
                            <div class="decorative-box d-flex flex-column p-3">
                                <p class="download-text mb-2">
                                    {{ $t('additional:modules.waterRiskCheck.downloadInformationTextRestart') }}
                                </p>
                                <FlatButton
                                    id="reset"
                                    :aria-label="$t('additional:modules.waterRiskCheck.resetButton')"
                                    type="button"
                                    :text="$t('additional:modules.waterRiskCheck.resetButton')"
                                    icon="bi bi-arrow-clockwise"
                                    :interaction="() => resetAll()"
                                />
                            </div>
                            <div class="decorative-box d-flex flex-column p-3">
                                <p class="download-text mb-2">
                                    {{ $t('additional:modules.waterRiskCheck.sendFeedback') }}
                                </p>
                                <FlatButton
                                    id="feedback"
                                    :aria-label="$t('additional:modules.waterRiskCheck.feedback')"
                                    type="button"
                                    :text="$t('additional:modules.waterRiskCheck.feedback')"
                                    icon="bi bi-chat-right-text"
                                    :interaction="() => openWindow(feedbackUrl)"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="!formStarted || formFinished">
            <div class="row">
                <div class="d-flex justify-content-center pt-4">
                    <p class="hint-text text-center">
                        {{ $t('additional:modules.waterRiskCheck.logoText') }}
                    </p>
                </div>
                <div class="d-flex justify-content-center">
                    <img
                        class="hamburg-logo img-fluid"
                        :src="'./assets/BUKEA_deu_RGB.png'"
                        :alt="$t('additional:modules.waterRiskCheck.hamburgIconAltText')"
                    >
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
@media (max-width: 767px) {
    .d-flex {
        gap: 0.5rem;
    }
    #page-back ::v-deep(.btn),
    #page-forward ::v-deep(.btn) {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        font-size: 0.8rem;
    }
}
#page-back,
#page-forward {
    flex: 1 1 0;
    min-width: 0;
}
#page-back ::v-deep(.btn),
#page-forward ::v-deep(.btn) {
    width: 100%;
    max-width: 100%;
}

#page-back ::v-deep(.btn-texts),
#page-forward ::v-deep(.btn-texts) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

#collapseHiddenButton {
    display: none;
}
#tool-waterRiskCheck {
    height: 100vh;
}
.mobile-extra-logo {
    height: 30px;
    width: auto;
    object-fit: contain;
}
.slogan {
    color: $secondary;
    font-size: $font_size_big;
    font-family: $font_family_accent;
    flex: 1;
    hyphens: auto;
    word-break: break-word;
    line-height: 1.2;
    text-align: left;

    @media (max-width: 767px) {
        font-size: $font_size_sm;
        letter-spacing: -0.02em;
    }
}
.start-list {
    list-style: none;
    color: $secondary;
    font-size: $font_size_base;
    font-family: $font_family_accent;
    @media (max-width: 767px) {
        font-size: $font_size_sm;
        line-height: 1.4;
    }
}
.check-icon {
    color: $secondary;
    font-weight: bold;
    flex-shrink: 0;
    margin-top: 4px;
    width: 1.5rem;
    margin-top: 5px;
    @media (max-width: 767px) {
        font-size: 0.85rem;
        margin-top: 3px;
    }
}
.decorative-box {
    background-color: $primary;
    height: auto;
    width: 100%;
    min-height: 100px;
    border-radius: $badge-border-radius;
}
.info-card-white {
    width: 100%;
    max-width: 400px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(0, 0, 0, 0.06);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}
.card-content {
    text-align: left;
}
.discard-address {
    color: $link-color;
    font-size: $font_size_sm;
    text-decoration: underline;
    cursor: pointer;
}
.icon-wrapper {
    background: rgba($secondary, 0.1);
    border-radius: 12px;
    padding: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.current-address {
    font-family: $font_family_accent;
    font-size: $font_size_base;
    color: $dark_blue;
    @media (max-width: 767px) {
        .current-address {
            font-size: 0.51rem; ;
            line-height: 1.2;
            word-break: break-word;
        }
    }
}
.building-count {
    font-size: 0.95rem;
    color: rgba($dark_blue, 0.7);
}
.basic-infos {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    background-color: #fff;
    .info-header {
        min-height: 60px;
    }
    .basic-infos-address {
        font-family: $font_family_accent;
        font-size: $font_size_base;
        color: $dark_grey;
        line-height: 1.2;
        @media (max-width: 767px) {
            font-size: 0.9rem;
            max-width: 100%;
        }
        .header-logo {
            height: 40px;
            width: auto;
            object-fit: contain;

            @media (min-width: 767px) {
                height: 60px;
            }
        }
    }
}
.question-headline {
    color: $secondary;
    font-family: $font_family_accent;
}
.answer {
    width: 50%;
    cursor: pointer;
    border-radius: 20px;
    border: 1px solid var(--form-check-input-border);
}
.disabled-answer {
    pointer-events: none;
    opacity: 50%;
}
.pdf-icon {
    font-size: 50px;
}
.progress {
    background-color: $light_grey;
    color: white;
    text-align: center;
    border-radius: 10px;
    height: 12px;
    font-size: 12px;
}
.progress-bar {
    background: $secondary;
    border-radius: 10px;
    height: 100%;
}
.information-image {
    width: 50%;
    z-index: 20;
}
@media (min-width: 768px) {
    .information-image:hover {
        transform: scale(1.5) translateX(-11%) translateY(+5%);
        width: 75%;
    }
}
@media (max-width: 767px) {
    .information-image {
        width: 100%;
    }
}
.info-text, .download-text {
    font-size: $font-size-base;
}
.download-text {
    color: $dark_blue;
}
.hint-text {
    font-size: $font_size_sm;
}
.selected-answer-icon {
    left: 15px;
    top: 9px;
}
.selected-answer-icon::before {
    color: $secondary;
}
.answer:hover, .marked-answers{
    background-color: $primary;
    font-family: $font_family_accent;
}
.logo-image {
    width: 200px;
    image-rendering: crisp-edges;
}
.geo-icon {
    color: $secondary;
    font-size: 40px;
    line-height: 1;
    background-color: transparent;
}
.address-hint, .basic-infos-address, .text-secondary {
    font-family: $font_family_accent;
    font-size: $font_size_big;
}
.divider {
    height: 1px;
    background: rgba(0, 0, 0, 0.08);
    width: 100%;
}
.discard-address-btn {
    background: none;
    border: none;
    color: $secondary;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
}
.header-logo {
    width: auto;
    max-width: 100px;
    min-width: 50px;
    height: auto;
    max-height: 80px;
    image-rendering: crisp-edges;

    @media (max-width: 767px) {
        max-width: 70px;
        max-width: 50px;
        margin-top: 0.5rem;
    }
}
.info-icon {
    font-size: 18px;
}
.transparentBG {
    background-color: #ffffffc2;
    z-index: 1;
}
.large-spinner {
    width: 4rem;
    height: 4rem;
}
.hamburg-logo {
    width: 200px;
}
.building-count {
    color: $dark_blue;
    line-height: 1.2;
}
.collapse-border {
    border-color: $secondary;
}

</style>
<style lang="scss">
.modal-rounded-dialog {
    button.btn {
        position: absolute;
        right: 5px;
    }
}
#modal-1-container {
    #modal-1-overlay {
        @media (max-width: 767px) {
            bottom: -30%;
        }
    }
}
</style>
