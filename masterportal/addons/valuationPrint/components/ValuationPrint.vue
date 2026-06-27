<script>
import axios from "axios";
import dayjs from "dayjs";
import Feature from "ol/Feature.js";
import {Fill, Stroke, Style} from "ol/style.js";
import {getCenter as getCenterOfExtent} from "ol/extent.js";
import {Select} from "ol/interaction.js";
import {singleClick} from "ol/events/condition.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import layerCollection from "@core/layers/js/layerCollection.js";
import layerFactory from "@core/layers/js/layerFactory.js";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList.js";
import {uniqueId} from "@shared/js/utils/uniqueId.js";
import {upperFirst} from "@shared/js/utils/changeCase.js";
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject.js";
import ModalItem from "@shared/modules/modals/components/ModalItem.vue";
import WfsSearch from "@modules/wfsSearch/components/WfsSearch.vue";
import {collectFeaturesByCoordinates as collectFeatures} from "../../shared/js/mapfishUtils/collectFeatures.js";
import {createKnowledgeBase} from "../../shared/js/mapfishUtils/createKnowledgeBase.js";
import MapfishDialog from "../../shared/js/mapfishUtils/mapfishDialog.js";
import {startPrintProcess} from "../../shared/js/mapfishUtils/startPrintProcess.js";
import {unionFeatures} from "../js/unionFeatures.js";
import getters from "../store/gettersValuationPrint.js";
import mutations from "../store/mutationsValuationPrint.js";

export default {
    name: "ValuationPrint",
    components: {
        AccordionItem,
        ModalItem,
        IconButton,
        FlatButton,
        WfsSearch
    },
    data () {
        return {
            isPdfAppIdConfigured: false,
            pdfAppId: "",
            isPdfSpecificationAppIdConfigured: false,
            pdfSpecificationAppId: "",
            isInProcessOfCreatingReport: false,
            numberOfServicesConfigured: 0,
            numberOfImagesConfigured: 0,
            numberOfProgressSteps: 0,
            progressCounter: 0,
            parcelData: null,
            addressList: [],
            showModal: false,
            chosenType: "Gutachten",
            errors: {
                address: false,
                documentNumber: false
            },
            specificAddress: "",
            documentNumber: "",
            autofill: false,
            optionListName: "",
            isAllSelected: false,
            isfirstFeaturesLoaded: false,
            resetParcelSearch: false
        };
    },
    computed: {
        ...mapGetters("Modules/ValuationPrint", Object.keys(getters)),
        ...mapGetters("Maps", ["projection", "getResolutionByScale"]),
        ...mapGetters(["restServiceById", "layerConfigById"]),
        ...mapGetters("Modules/WfsSearch", {
            parcelSearchFeature: "results"
        }),
        percentage () {
            return Math.round(this.progressCounter / this.numberOfProgressSteps * 100);
        }
    },
    watch: {
        /**
         * If the parcel search is configured, this watcher is required to handle the result of the search.
         * @params {ol/Feature[]} features - The result of the parcel search.
         * @returns {void}
         */
        parcelSearchFeature: {
            deep: true,
            handler (features) {
                if (features?.length) {
                    this.handleParcelSearch(features[0]);
                }
            }
        },
        /**
         * Starts process for the valuation.
         * @param {Object} parcel - The parcel data.
         * @param {Number[]} parcel.center - The parcel center.
         * @param {ol/extent} parcel.extent - The extent of the parcel.
         * @param {ol/Feature} parcel.feature - The ol feature of the parcel.
         * @param {ol/geom/Polygon} parcel.geometry - The geometry of the parcel.
         * @returns {void}
         */
        parcelData (parcel) {
            if (!isObject(this.config?.services)) {
                console.error("No config found for services");
                return;
            }
            else if (!isObject(this.config?.transformer)) {
                console.error("No config found for transformer");
                return;
            }

            this.progressCounter = 0;
            createKnowledgeBase(parcel, this.config.services, {
                mapProjection: this.projection.getCode(),
                oafCRSURI: this.oafCRSURI
            }, message => {
                this.setShowDownloadAll(false);
                this.addMessage(message, false);
                this.isInProcessOfCreatingReport = true;
                if (this.progressCounter < this.numberOfServicesConfigured) {
                    this.progressCounter++;
                }
            }, knowledgeBase => {
                const mapfishDialogInstance = new MapfishDialog(
                    knowledgeBase,
                    this.config.transformer,
                    this.defaultValue,
                    this.projection.getCode(),
                    this.templateName,
                    this.getFilenameOfPDF(this.fileprefix, dayjs().format("YYYY-MM-DD")),
                    this.sendLegends
                );

                mapfishDialogInstance.create(parcel).then(mapfishDialog => {
                    if (!this.isPdfAppIdConfigured) {
                        this.startSpecificationProcess();
                        return;
                    }
                    startPrintProcess(this.printUrl, "pdf", this.pdfAppId, mapfishDialog, (url, payload) => {
                        this.addMessage(this.$t("additional:modules.valuationPrint.pdfInTheMaking"));
                        return axios.post(url, payload);
                    },
                    () => {
                        this.addMessage(this.$t("additional:modules.valuationPrint.pleaseWait"));
                    },
                    error => {
                        this.addMessage(this.$t("additional:modules.valuationPrint.pdfError"), true);
                        console.error(error);
                        this.startSpecificationProcess();
                    },
                    url => {
                        this.addMessage(this.$t("additional:modules.valuationPrint.pdfSuccess"));
                        this.addUrl(url, this.fileprefix);
                        this.progressCounter++;
                        if (this.numberOfImagesConfigured === 0) {
                            this.scrollToDownloadSection();
                        }
                        this.startSpecificationProcess();
                    });
                });
            }, errorMsg => {
                this.addMessage(errorMsg, true);
            }, error => {
                console.error(error);
            });
        },
        /**
         * In case of an input the error flag for the document number is set to false.
         * @param {Boolean} newValue The new input value.
         * @returns {void}
         */
        documentNumber (newValue) {
            if (newValue.length) {
                this.errors.documentNumber = false;
            }
        },
        /**
         * If the input text is not empty, sets the autofill flag true and vice versa.
         * @param {String} val The value of specificAddress
         * @returns {void}
         */
        specificAddress (val) {
            if (val !== "") {
                this.autofill = true;
            }
            else {
                this.autofill = false;
            }
        },
        /**
         * Updates the printed features dynamically according to the selected features
         * @param {ol/Feature[]} features - The selected features
         * @param {ol/Feature[]} oldFeatures - The old selected features
         * @returns {void}
         */
        selectedFeatures: {
            handler  (features, oldFeatures) {
                if (features.length) {
                    if (this.isfirstFeaturesLoaded) {
                        this.setPrintedFeature(this.printedFeature.filter(pf => features.find(sf => sf.get("flstnrzae") === pf.get("flstnrzae"))));
                        this.isfirstFeaturesLoaded = false;
                    }
                    else if (oldFeatures.length > features.length) {
                        this.setPrintedFeature(this.printedFeature.filter(pf => features.find(sf => sf.get("flstnrzae") === pf.get("flstnrzae"))));
                    }
                    else {
                        this.setPrintedFeature([].concat(this.printedFeature, features[features.length - 1]));
                    }

                    if (this.printedFeature.length !== features.length) {
                        this.isAllSelected = false;
                    }
                    else {
                        this.isAllSelected = true;
                    }
                }
                else {
                    this.setPrintedFeature([]);
                    this.resetParcelSearch = true;
                }
            },
            deep: true
        },
        /**
         * If the input checkbox is checked, all options will be checked
         * @param {Boolean} val true if input is checked
         * @returns {void}
         */
        isAllSelected (val) {
            if (val) {
                this.setPrintedFeature(this.selectedFeatures);
            }
            else if (this.printedFeature.length === this.selectedFeatures.length) {
                this.setPrintedFeature([]);
            }
        }
    },
    created () {
        this.config = null;
        this.select = null;
        this.printUrl = "";
        this.imageAppId = "";
        this.defaultValue = "";
        this.fileprefix = "";
        this.printType = ["Gutachten", "Wertbeurteilung"];

        if (!layerCollection.getLayerById(this.parcelLayerId)) {
            this.createParcelLayer(this.parcelLayerId, this.parcelLayerZoomLevel);
        }

        if (this.showParcelSearch) {
            this.setMultiSelectParcels(false);
        }

        this.setConfig();
        this.setSelectInteraction();
    },

    mounted () {
        if (this.selectedFeatures.length) {
            this.isfirstFeaturesLoaded = true;
        }
        this.select.setActive(true);
        this.select.getFeatures().on("change:length", (evt) => {
            this.setSelectedFeatures([...evt.target.getArray()]);
            if (this.showParcelSearch) {
                this.setPrintedFeature(this.selectedFeatures);
            }
        });
        if (this.printedFeature.length && this.selectedFeatures.length === this.printedFeature.length) {
            this.isAllSelected = true;
        }
    },
    unmounted () {
        layerCollection.removeLayerById(this.parcelLayerId);
        this.removeInteraction(this.select);
    },

    methods: {
        ...mapMutations("Modules/ValuationPrint", Object.keys(mutations)),
        ...mapActions("Maps", ["addInteraction", "removeInteraction"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Creates and adds parcel layer if it is not configured.
         * For performance reasons a (configurable) min zoom is set to the layer.
         * @param {String} layerId - The id for the parcel layer.
         * @param {Number} minZoomLevel - minimum zoom level at which the layer is shown
         * @returns {void}
         */
        createParcelLayer (layerId, minZoomLevel = 7) {
            const layer = layerFactory.createLayer(rawLayerList.getLayerWhere({id: layerId}));

            layer.getLayer().setMinZoom(minZoomLevel);
            layerCollection.addLayer(layer);
        },

        /**
         * Removes the passed feature from the collection where the select interaction will place the selected features.
         * @param {ol/Feature} feature - The feature to be removed.
         * @returns {void}
         */
        removeFeature (feature) {
            if (feature instanceof Feature) {
                const i = this.selectedFeatures.findIndex(f => f.get("flstnrzae") === feature.get("flstnrzae"));

                this.select.getFeatures().removeAt(i);
                this.setSelectedFeatures(this.select.getFeatures().getArray());
            }
        },

        /**
         * Handles the result of the parcel search and add the related feature to the collection of the select interaction.
         * The layer that is used in the parcel search is different from this one.
         * The refresh is necessary because the feature searched for may not yet be loaded.
         * @param {ol/Feature} feature - The feature from the parcel search.
         * @returns {void}
         */
        handleParcelSearch (feature) {
            const landmark = feature.get("gemarkungsname"),
                parcelNumber = feature.get("flurstuecksnummer"),
                layerSource = layerCollection.getLayerById(this.parcelLayerId).getLayerSource();

            layerSource.refresh();
            layerSource.once("featuresloadend", () => {
                const parcelFeature = this.getParcelByAttributes(layerSource.getFeatures(), landmark, parcelNumber);

                this.clearAndAddFeature(parcelFeature, true);
            });
        },

        /**
         * Finds a parcel by the given landmark and parcel number.
         * @param {ol/Feature[]} features - The list of features to search in.
         * @param {String} landmark - The landmark searched for.
         * @param {String} parcelNumber - The parcel number searched for.
         * @returns {ol/Feature|undefined} The found feature.
         */
        getParcelByAttributes (features, landmark, parcelNumber) {
            return features.find(feature => {
                return feature.get("gemarkung") === landmark && feature.get("flstnrzae") === parcelNumber;
            });
        },

        /**
         * Removes all features from the collection and adds the given one.
         * @param {ol/Feature} feature - The feature to add.
         * @param {Boolean} onSearch - true if it is from wfs search
         * @returns {void}
         */
        clearAndAddFeature (feature, onSearch = false) {
            this.select.getFeatures().clear();
            this.select.getFeatures().push(feature);
            this.resetParcelSearch = !onSearch;
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
                    this.isPdfAppIdConfigured = typeof response.data.settings?.pdfAppId === "string";
                    this.pdfAppId = response.data.settings?.pdfAppId;
                    this.isPdfSpecificationAppIdConfigured = typeof response.data.settings?.pdfSpecificationAppId === "string";
                    this.pdfSpecificationAppId = response.data.settings?.pdfSpecificationAppId;
                    this.numberOfImagesConfigured = response.data?.images?.length || 0;
                    this.numberOfServicesConfigured = Object.keys(response.data.services).length;
                    this.imageAppId = response.data.settings.imageAppId;
                    this.defaultValue = response.data.settings.defaultValue;
                    this.fileprefix = this.$t(response.data.settings.fileprefix);
                    this.numberOfProgressSteps = this.numberOfServicesConfigured
                        + (this.isPdfAppIdConfigured ? 1 : 0)
                        + (this.isPdfSpecificationAppIdConfigured ? 1 : 0)
                        + this.numberOfImagesConfigured;
                })
                .catch(() => {
                    const message = "Could not load the config file config.valuation.json";

                    this.addMessage(message, true);
                    this.addSingleAlert({
                        category: "error",
                        content: message,
                        displayClass: "error"
                    });
                });
        },

        /**
         * Sets the select interaction (non-reactive state), adds it a "change:active" listener and adds it to the map.
         * @returns {void}
         */
        setSelectInteraction () {
            this.select = new Select({
                layers: (layer) => {
                    if (layer.get("id") === this.parcelLayerId) {
                        layer.setZIndex(9999999);
                    }
                    return layer.get("id") === this.parcelLayerId;
                },
                style: new Style({
                    fill: new Fill({
                        color: "rgba(255,255,255,0)"
                    }),
                    stroke: new Stroke({
                        color: "#de2d26",
                        width: 5
                    })
                }),
                addCondition: singleClick,
                removeCondition: singleClick
            });

            this.addFeaturesToSelectInteraction(this.select);

            this.select.on("select", event => {
                if (this.multiSelectParcels === false) {
                    if (this.select.getFeatures().getLength() > 1) {
                        this.clearAndAddFeature(event.selected[0]);
                    }
                }
            });
            this.addInteraction(this.select);
        },
        /**
         * Adds features, loaded from the store to the select interaction.
         * @param {Object} select - the select interaction
         * @returns {void}
         */
        addFeaturesToSelectInteraction (select) {
            if (this.selectedFeatures.length > 0) {
                const layerSource = layerCollection.getLayerById(this.parcelLayerId).getLayerSource();

                layerSource.once("featuresloadend", () => {
                    this.selectedFeatures.forEach(selected => {
                        const feat = layerSource.getFeatureById(selected.getId());

                        if (feat !== null) {
                            select.getFeatures().push(feat);
                        }
                        else {
                            layerSource.addFeature(selected);
                            select.getFeatures().push(selected);
                        }
                    });
                });
            }
        },
        /**
         * Shows the print modal and saves the feature for print window
         * @param {Boolean} val - true or false to decide if open or close the print window
         * @returns {void}
         */
        showPrintModal (val) {
            this.showModal = val;

            if (this.showModal && Array.isArray(this.addressList)) {
                if (this.addressList.length === 1) {
                    this.specificAddress = this.addressList[0];
                    this.$refs.addressInput.value = this.specificAddress;
                    return;
                }
                this.specificAddress = "";
                this.$refs.addressInput.value = "";
            }
            if (!this.showModal) {
                this.errors.address = false;
                this.errors.documentNumber = false;
            }
        },
        /**
         * Gets the required attributes from the feature(s) and sets it.
         * @param {ol/Feature[]} featureList - An array of features.
         * @returns {void}
         */
        setParcelData (featureList) {
            if (this.isModalRequired) {
                if (!this.formValidation()) {
                    return;
                }
            }
            if (!Array.isArray(featureList) || !featureList.length) {
                console.error(`startValuation: ${featureList} has to be a non empty array`);
                return;
            }
            const feature = featureList.length > 1 ? unionFeatures(featureList) : featureList[0],
                extent = feature.getGeometry().getExtent();

            this.setMessageList([]);
            this.setUrlList([]);
            this.parcelData = {
                center: getCenterOfExtent(extent),
                extent,
                feature,
                featureList,
                geometry: feature.getGeometry()
            };

            this.showPrintModal(false, []);
        },
        /**
         * Gets the address(es) from server according to the config
         * @param {Boolean} val - true or false to decide if open or close the print window
         * @param {ol/Feature[]} featureList - the selected feature(s) for the print window
         * @returns {void}
         */
        async getAddress (val, featureList) {
            const feature = featureList.length > 1 ? unionFeatures(featureList) : featureList[0],
                config = this.config?.services?.hh_wfs_dog;

            if (!this.isModalRequired) {
                this.setPrintedFeature(featureList);
                this.setParcelData(this.printedFeature);
                return;
            }
            await collectFeatures(
                {
                    geometry: feature.getGeometry()
                },
                config,
                {mapProjection: this.projection.getCode(), oafCRSURI: this.oafCRSURI},
                rawLayerList.getLayerWhere({id: config?.layerId}),
                features => {
                    const addr = [];

                    features.forEach(feat => {
                        if (typeof feat?.get !== "function") {
                            return;
                        }
                        let address = feat.get("strassenname");

                        if (typeof feat.get("hausnummer") !== "undefined") {
                            address += " " + feat.get("hausnummer");
                        }

                        if (typeof feat.get("hausnummernzusatz") !== "undefined") {
                            address += feat.get("hausnummernzusatz");
                        }
                        addr.push(address);
                    });

                    this.addressList = addr.sort((a, b) => {
                        if (a < b) {
                            return -1;
                        }
                        else if (a > b) {
                            return 1;
                        }
                        return 0;
                    });

                    this.optionListName = uniqueId("addresslistOptions");

                    this.showPrintModal(val, featureList);
                },
                error => console.warn(error)
            );
        },

        /**
         * Starts the process for the images to print.
         * @param {Number} [idx=0] - The index.
         * @returns {void}
         */
        startImageProcess (idx = 0) {
            if (this.numberOfImagesConfigured === 0) {
                this.progressCounter = this.numberOfProgressSteps;
                setTimeout(() => {
                    this.isInProcessOfCreatingReport = false;
                }, 2000);
                this.setShowDownloadAll(true);
                return;
            }
            const imageName = Object.keys(this.config.images[idx])[0],
                mapfishDialogInstance = new MapfishDialog(
                    {},
                    this.config.images[idx],
                    this.defaultValue,
                    this.projection.getCode(),
                    this.templateName,
                    this.getFilenameOfPDF(imageName, dayjs().format("YYYY-MM-DD"))
                );

            mapfishDialogInstance.create(this.parcelData).then(mapfishDialog => {
                mapfishDialog.attributes.map = mapfishDialog.attributes[imageName + ".map"];
                delete mapfishDialog.attributes[imageName + ".map"];

                startPrintProcess(this.printUrl, "png", this.imageAppId, mapfishDialog, (url, payload) => {
                    this.addMessage(this.$t("additional:modules.valuationPrint.imageInTheMaking", {imageName: upperFirst(imageName)}), false);
                    return axios.post(url, payload);
                },
                () => {
                    this.addMessage(this.$t("additional:modules.valuationPrint.pleaseWait"), false);
                },
                (error) => {
                    this.addMessage(this.$t("additional:modules.valuationPrint.imageError", {imageName: upperFirst(imageName)}), true);
                    console.error(error);
                    if (this.config.images[idx + 1]) {
                        this.startImageProcess(idx + 1);
                    }
                },
                (url) => {
                    this.progressCounter++;
                    this.addMessage(this.$t("additional:modules.valuationPrint.imageSuccess", {imageName: upperFirst(imageName)}), false);
                    this.addUrl(url, upperFirst(imageName));
                    if (this.config.images[idx + 1]) {
                        this.startImageProcess(idx + 1);
                        return;
                    }
                    this.progressCounter = this.numberOfProgressSteps;
                    setTimeout(() => {
                        this.isInProcessOfCreatingReport = false;
                    }, 2000);
                    this.setShowDownloadAll(true);
                    this.scrollToDownloadSection();
                });
            });
        },

        /**
         * Starts the process for the specification to print.
         * @returns {void}
         */
        async startSpecificationProcess () {
            if (!this.isPdfSpecificationAppIdConfigured) {
                this.startImageProcess();
                return;
            }
            if (this.specificAddress === "" && this.addressList.length === 1) {
                this.specificAddress = this.addressList[0];
            }
            const mapfishDialogInstance = new MapfishDialog(
                {},
                this.config.specification,
                this.defaultValue,
                this.projection.getCode(),
                this.templateName,
                this.getFilenameOfPDF(this.$t("additional:modules.valuationPrint.specificationReport"), dayjs().format("YYYY-MM-DD"))
            );

            mapfishDialogInstance.create(this.parcelData).then(mapfishDialog => {
                const replacedparcelData = {
                    "angabenZumGrundstueck.geschaeftszeichen": this.documentNumber.trim(),
                    "angabenZumGrundstueck.strasse": this.specificAddress.trim(),
                    "angabenZumGrundstueck.art": this.chosenType.trim()
                };

                Object.entries(replacedparcelData).forEach(([key, value]) => {
                    mapfishDialog.attributes[key] = value;
                });

                startPrintProcess(this.printUrl, "pdf", this.pdfSpecificationAppId, mapfishDialog, (url, payload) => {
                    this.addMessage(this.$t("additional:modules.valuationPrint.pdfInTheMaking"));
                    return axios.post(url, payload);
                },
                () => {
                    this.addMessage(this.$t("additional:modules.valuationPrint.pleaseWait"));
                },
                error => {
                    this.addMessage(this.$t("additional:modules.valuationPrint.pdfError"), true);
                    console.error(error);
                    this.startImageProcess();
                },
                (url) => {
                    this.addMessage(this.$t("additional:modules.valuationPrint.pdfSuccess"));
                    this.addUrl(url, this.$t("additional:modules.valuationPrint.modalTitle"));
                    this.progressCounter++;
                    this.startImageProcess();
                });
            });
        },

        /**
         * Adds a new message to the GUI log.
         * @param {String} message The message to add.
         * @param {Boolean} [isError=false] A flag to indicate if this is an error.
         * @returns {void}
         */
        addMessage (message, isError = false) {
            this.messageList.unshift({message, isError});
        },

        /**
         * Adds another url to the url list for downloding pdf and images.
         * @param {String} url - The url.
         * @param {String} name - The name to display.
         * @returns {void}
         */
        addUrl (url, name) {
            this.urlList.push({
                link: url,
                name: name ? name : url
            });
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
         * Opens all the Urls in window for downloading
         * @param {Object[]} urlList The list of url objects in Array
         * @returns {void}
         */
        openUrls (urlList) {
            if (!Array.isArray(urlList) || !urlList.length) {
                return;
            }
            urlList.forEach(url => {
                if (url?.link) {
                    window.open(url.link);
                }
            });
        },
        /**
         * Sets the specific address
         * @param {Event} evt input event
         * @returns {void}
         */
        setSpecificAddress (evt) {
            if (typeof evt?.target?.value !== "string") {
                return;
            }
            this.errors.address = false;
            this.specificAddress = evt.target.value;
        },
        /**
         * Validates the form and sets the error flags in the errors object.
         * @returns {Boolean} true if form is valid, false if not.
         */
        formValidation () {
            let isValid = true;

            if (!this.documentNumber || this.documentNumber.trim() === "") {
                this.errors.documentNumber = true;
                isValid = false;
                this.documentNumber = "";
            }
            if (!this.specificAddress || this.specificAddress.trim() === "") {
                this.errors.address = true;
                isValid = false;
                if (isObject(this.$refs.addressInput) && Object.prototype.hasOwnProperty.call(this.$refs.addressInput, "value")) {
                    this.$refs.addressInput.value = "";
                }
            }
            return isValid;
        },

        /**
         * Edit the printed features
         * @param {Event} evt input checkbox event
         * @param {ol/Feature} feature - the current features
         * @returns {void}
         */
        editPrintedFeature (evt, feature) {
            if (evt?.target?.checked) {
                this.setPrintedFeature([].concat(this.printedFeature, feature));
                if (this.printedFeature.length === this.selectedFeatures.length) {
                    this.isAllSelected = true;
                }
            }
            else {
                this.setPrintedFeature(this.printedFeature.filter(fea => fea.get("flstnrzae") !== feature.get("flstnrzae")));
                this.isAllSelected = false;
            }
        },

        /**
         * Scrolls to download section after a certain amount of time.
         * @returns {void}
         */
        scrollToDownloadSection () {
            setTimeout(() => {
                if (this.$refs.downloadSection) {
                    this.$refs.downloadSection.scrollIntoView({behavior: "smooth"});
                }
            }, 500);
        }
    }
};
</script>

<template lang="html">
    <div
        id="tool-ValuationPrint"
        class="valuation-print"
    >
        <div>
            <div
                v-if="!showParcelSearch"
                class="parcel-report"
            >
                <h6 class="selected-parcels">
                    {{ $t('additional:modules.valuationPrint.parcelListTitle') }}
                </h6>
                <div class="parcels">
                    <div
                        v-if="selectedFeatures.length && multiSelectParcels"
                        class="all-select"
                    >
                        <label for="select-all">
                            <input
                                id="select-all"
                                v-model="isAllSelected"
                                class="form-check-input col col-md-1 align-self-center"
                                type="checkbox"
                                name="select-all"
                            >
                            <span v-if="!isAllSelected">
                                {{ $t('additional:modules.valuationPrint.selectAll') }}
                            </span>
                            <span v-else>
                                {{ $t('additional:modules.valuationPrint.deselectAll') }}
                            </span>
                        </label>
                    </div>
                    <div class="parcels-text">
                        <div
                            v-for="feature in selectedFeatures"
                            :key="feature.get('flstnrzae')"
                        >
                            <ul class="list-group">
                                <li class="list-group-item container">
                                    <div
                                        class="row justify-content-start"
                                    >
                                        <input
                                            class="form-check-input col col-md-1 align-self-center"
                                            type="checkbox"
                                            :checked="printedFeature.filter(fea => fea.get('flstnrzae') === feature.get('flstnrzae')).length"
                                            value=""
                                            aria-label="$t('additional:modules.valuationPrint.select')"
                                            @change="editPrintedFeature($event, feature)"
                                        >
                                        <div class="parcel col col-md-5 text-center">
                                            <div class="parcel-label">
                                                {{ $t('additional:modules.valuationPrint.parcel') }}
                                            </div>
                                            <div class="font-bold">
                                                {{ feature.get("flstnrzae") }}
                                            </div>
                                        </div>
                                        <div class="parcel col col-md-5 text-center">
                                            <div class="parcel-label">
                                                {{ $t('additional:modules.valuationPrint.district') }}
                                            </div>
                                            <div class="font-bold">
                                                {{ feature.get("gemarkung") }}
                                            </div>
                                        </div>
                                        <IconButton
                                            :aria="$t('additional:modules.valuationPrint.removeButton')"
                                            :icon="'bi-trash'"
                                            :interaction="() => removeFeature(feature)"
                                            :class-array="['remove', 'btn-sm', 'col', 'col-md-1']"
                                        />
                                    </div>
                                </li>
                            </ul>
                            <hr v-if="selectedFeatures.length > 1">
                        </div>
                        <template v-if="selectedFeatures.length > 0">
                            <div class="d-flex justify-content-center pt-3">
                                <FlatButton
                                    id="start-valuation-print"
                                    aria-label="$t('additional:modules.valuationPrint.startButton')"
                                    type="button"
                                    :text="$t('additional:modules.valuationPrint.startButton')"
                                    :interaction="() => getAddress(true, printedFeature)"
                                    icon="bi-play"
                                    :disabled="!printedFeature.length"
                                />
                            </div>
                        </template>
                    </div>
                </div>
            </div>
            <div
                v-else
            >
                <WfsSearch
                    :show-reset-button="false"
                    :reset-parcel-search="resetParcelSearch"
                    :zoom-level-prop="parcelLayerZoomLevel + 1"
                />
                <hr>
                <h5 class="pt-3">
                    {{ $t('additional:modules.valuationPrint.generateReport') }}
                </h5>
                <p>
                    {{ $t('additional:modules.valuationPrint.infoGenerateReport') }}
                </p>
                <br>
                <p v-if="selectedFeatures.length === 1">
                    <span>
                        {{ $t('additional:modules.valuationPrint.district') }}
                    </span>
                    &NonBreakingSpace;
                    <span class="font-bold">
                        {{ selectedFeatures[0].get("gemarkung") }}
                    </span><br>
                    <span>
                        {{ $t('additional:modules.valuationPrint.parcel') }}
                    </span>
                    &NonBreakingSpace;
                    <span class="font-bold">
                        {{ selectedFeatures[0].get("flstnrzae") }}
                    </span>
                </p>
                <div
                    v-if="!isInProcessOfCreatingReport"
                    class="d-flex justify-content-center pt-3"
                >
                    <FlatButton
                        id="start-fis"
                        aria-label="$t('additional:modules.valuationPrint.startButton')"
                        type="button"
                        :text="$t('additional:modules.valuationPrint.startButton')"
                        :interaction="() => getAddress(true, printedFeature)"
                        icon="bi-play"
                        :disabled="!selectedFeatures.length"
                    />
                </div>
            </div>
            <div
                v-if="isInProcessOfCreatingReport && !showStatusLog"
                class="pt-3"
            >
                <div v-if="messageList.length > 0">
                    {{ messageList[0].message }}
                </div>
                <div class="progress">
                    <div
                        class="progress-bar bg-secondary"
                        role="progressbar"
                        :style="`width: ${percentage}%`"
                        :aria-valuenow="percentage"
                        aria-valuemin="0"
                        aria-valuemax="100"
                    >
                        <span class="progress-percentage">{{ percentage > 2 ? `${percentage} %` : '' }}</span>
                    </div>
                </div>
            </div>
            <AccordionItem
                v-else-if="messageList.length > 0 && showStatusLog"
                id="valuation-print-messages"
                font-size="font-size-base"
                heading-level="h6"
                :is-open="true"
                :title="$t('additional:modules.valuationPrint.messageListTitle')"
                :use-indentation="true"
            >
                <div
                    v-for="(messageObj, idx) in messageList"
                    :key="idx + '_' + messageObj.message"
                    :class="messageObj.isError ? 'messageListError' : 'messageListEntry'"
                >
                    {{ messageObj.message }}
                </div>
            </AccordionItem>
            <hr v-if="selectedFeatures.length > 0">
            <div
                v-if="showParcelSearch && urlList.length === 1"
                ref="downloadSection"
                class="mt-3"
            >
                <h5>
                    {{ $t('additional:modules.valuationPrint.urlTitleForOneReport') }}
                </h5>
                <div class="container">
                    <div class="row">
                        <i class="bi bi-filetype-pdf pdf-icon col col-md-12 text-center" />
                        <a
                            :href="urlList[0].link"
                            class="col col-md-12  text-center lh-1"
                            target="_blank"
                        >{{ urlList[0].name }}</a>
                        <div
                            class="d-flex justify-content-center pt-2 pb-3"
                        >
                            <FlatButton
                                id="download-report"
                                aria-label="$t('additional:modules.valuationPrint.download')"
                                type="button"
                                :text="$t('additional:modules.valuationPrint.download')"
                                :icon="'bi-download'"
                                :interaction="() => openUrls(urlList)"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-else-if="urlList.length > 0"
                ref="downloadSection"
                class="mt-3"
            >
                <h5>
                    {{ $t('additional:modules.valuationPrint.urlListTitle') }}
                </h5>
                <div class="card-body">
                    <ul class="list-unstyled">
                        <li
                            v-for="(url, idx) in urlList"
                            :key="idx + '_' + url.name"
                            class="urlListEntry"
                        >
                            <a
                                :href="url.link"
                                target="_blank"
                            >{{ url.name }}</a>
                        </li>
                        <div class="d-flex justify-content-center pt-3">
                            <FlatButton
                                v-if="showDownloadAll"
                                id="download-all"
                                aria-label="$t('additional:modules.valuationPrint.downloadAll')"
                                type="button"
                                :text="$t('additional:modules.valuationPrint.downloadAll')"
                                :icon="'bi-download'"
                                :interaction="() => openUrls(urlList)"
                            />
                        </div>
                    </ul>
                </div>
            </div>
            <ModalItem
                :icon="icon"
                :show-modal="showModal"
                modal-inner-wrapper-style="min-width: 400px;"
                modal-content-container-style="padding: 0.5rem"
                @modal-hid="showPrintModal(false, [])"
            >
                <template #header>
                    <h5 class="px-2 mt-2">
                        {{ $t('additional:modules.valuationPrint.modalTitle') }}
                    </h5>
                </template>
                <template #default>
                    <div class="border-bottom border-top def-font">
                        <div class="my-3">
                            <label
                                for="number"
                                class="form-label"
                            >{{ $t('additional:modules.valuationPrint.number') }}</label>
                            <input
                                id="number"
                                v-model="documentNumber"
                                :aria-label="$t('additional:modules.valuationPrint.number')"
                                type="text"
                                placeholder="xx.xxxx - xxx"
                                :class="`form-control ${errors.documentNumber ? 'is-invalid' : ''}`"
                            >
                            <div
                                v-if="errors.documentNumber"
                                class="invalid-feedback"
                            >
                                {{ $t('additional:modules.valuationPrint.formError.missingDocumentName') }}
                            </div>
                        </div>
                        <div class="mb-3">
                            <label
                                for="address-list"
                                class="form-label"
                            >{{ $t('additional:modules.valuationPrint.address') }}</label>
                            <input
                                id="address-list"
                                ref="addressInput"
                                :class="`form-control ${errors.address ? 'is-invalid' : ''}`"
                                :list="optionListName"
                                :placeholder="!autofill ? $t('additional:modules.valuationPrint.placeholder') : ''"
                                @change="setSpecificAddress"
                            >
                            <datalist :id="optionListName">
                                <option
                                    v-for="address in addressList"
                                    :key="address"
                                    :value="address"
                                >
                                    {{ address }}
                                </option>
                            </datalist>
                            <div
                                v-if="errors.address"
                                class="invalid-feedback"
                            >
                                {{ $t('additional:modules.valuationPrint.formError.missingAddress') }}
                            </div>
                        </div>
                        <div class="mb-3">
                            <div class="form-check">
                                <label
                                    v-for="type in printType"
                                    :key="type"
                                >
                                    {{ type }}
                                    <input
                                        :id="type"
                                        v-model="chosenType"
                                        class="form-check-input"
                                        type="radio"
                                        name="printType"
                                        :value="type"
                                    >
                                </label>
                            </div>
                        </div>
                    </div>
                </template>
                <template #footer>
                    <div class="p-2">
                        <button
                            type="button"
                            class="btn btn-primary confirm-print"
                            tabindex="0"
                            @click.prevent="setParcelData(printedFeature)"
                            @keydown.prevent="setParcelData(printedFeature)"
                        >
                            {{ $t('additional:modules.valuationPrint.startButton') }}
                        </button>
                        <button
                            type="button"
                            class="btn btn-primary"
                            tabindex="0"
                            @click="showPrintModal(false, [])"
                            @keydown="showPrintModal(false, [])"
                        >
                            {{ $t('additional:modules.valuationPrint.cancel') }}
                        </button>
                    </div>
                </template>
            </ModalItem>
        </div>
    </div>
</template>

<style lang="scss" scoped>
:deep(.accordion-button) {
    font-family: "MasterPortalFont Bold";
}

.selected-parcels {
    font-family: "MasterPortalFont Bold";
    font-size: 14px;
}

.font-bold {
    font-family: "MasterPortalFont Bold";
}

.def-font {
    font-size: 16px;

    .form-check-label {
        padding-top: 3px;
    }
}

p {
    font-size: 1rem;
    color: #222;
}

.messageListError {
    color: $danger;
}

.accordion-button {
    font-size: 13px;
}

.parcels {
    padding: 13px 0;

    .all-select {
        margin-bottom: 10px;
        padding: 0 4px;

        label {
            cursor: pointer;

            input {
                margin-right: 10px;
                appearance: checkbox;
                cursor: pointer;
            }
        }
    }

    .parcel-label {
        font-size: 12px;
    }

    ul {
        list-style-type: none;
    }
}

.list-group {
    .list-group-item {
        border: none;
    }

    .form-check-input {
        appearance: checkbox;
        cursor: pointer;
    }
}

.list-inline, .list-unstyled {
    margin-bottom: 0;
}

.pdf-icon {
    font-size: 50px;
}

.form-check {
    label {
        display: block;
        cursor: pointer;
        position: relative;
        margin-top: 5px;

        input {
            position: absolute;
            left: 0;
            top: -3px;
        }
    }
}

.progress {
    background-color: $light_grey;
    color: white;
    text-align: center;
    border-radius: 10px;
    height: 16px;
    font-size: 12px;
}

.progress-bar {
    border-radius: 10px;
}

.progress-percentage {
    white-space: nowrap;
}
</style>
