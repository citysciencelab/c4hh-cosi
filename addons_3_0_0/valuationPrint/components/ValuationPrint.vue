<script>
import {Fill, Stroke, Style} from "ol/style";
import {getCenter as getCenterOfExtent} from "ol/extent";
import getters from "../store/gettersValuationPrint";
import Feature from "ol/Feature";
import {mapActions, mapGetters, mapMutations} from "vuex";
import mutations from "../store/mutationsValuationPrint";
import {Select} from "ol/interaction";
import {singleClick} from "ol/events/condition";
import ModalItem from "../../../../src_3_0_0/shared/modules/modals/components/ModalItem.vue";
import {unionFeatures} from "../js/unionFeatures";
import {createKnowledgeBase} from "../js/createKnowledgeBase.js";
import {createMapfishDialog} from "../js/createMapfishDialog.js";
import {startPrintProcess} from "../js/startPrintProcess.js";
import axios from "axios";
import isObject from "../../../../src_3_0_0/shared/js/utils/isObject";
import dayjs from "dayjs";
import {upperFirst} from "../../../../src_3_0_0/shared/js/utils/changeCase";
import {collectFeatures} from "../js/collectFeatures";
import rawLayerList from "@masterportal/masterportalapi/src/rawLayerList";
import layerCollection from "../../../../src_3_0_0/core/layers/js/layerCollection";
import layerFactory from "../../../../src_3_0_0/core/layers/js/layerFactory";
import IconButton from "../../../../src_3_0_0/shared/modules/buttons/components/IconButton.vue";
import FlatButton from "../../../../src_3_0_0/shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "ValuationPrint",
    components: {
        ModalItem,
        IconButton,
        FlatButton
    },
    data () {
        return {
            selectedFeatures: [],
            parcelData: null,
            messageList: [],
            printedFeature: [],
            urlList: [],
            addressList: [],
            showDownloadAll: false,
            showModal: false,
            chosenType: "Gutachten",
            errors: {
                address: false,
                documentNumber: false
            },
            specificAddress: "",
            documentNumber: "",
            autofill: false,
            parcelModule: "wanda"
        };
    },
    computed: {
        ...mapGetters("Modules/ValuationPrint", Object.keys(getters)),
        ...mapGetters("Maps", ["projection", "getResolutionByScale"]),
        ...mapGetters(["restServiceById", "layerConfigById"])
    },
    watch: {
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

            createKnowledgeBase(parcel, this.config.services, this.projection.getCode(), message => {
                this.showDownloadAll = false;
                this.addMessage(message, false);
            }, knowledgeBase => {
                const mapfishDialog = createMapfishDialog(
                    parcel,
                    knowledgeBase,
                    this.config.transformer,
                    this.defaultValue,
                    this.projection.getCode(),
                    this.getFilenameOfPDF(this.fileprefix, dayjs().format("YYYY-MM-DD"))
                );

                setTimeout(() => {
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
                        this.addUrl(url, this.$t("additional:modules.valuationPrint.report"));
                        this.startSpecificationProcess();
                    });
                }, 0);
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
        }
    },
    created () {
        this.config = null;
        this.select = null;
        this.printUrl = "";
        this.pdfAppId = "";
        this.imageAppId = "";
        this.defaultValue = "";
        this.fileprefix = "";
        this.printType = ["Gutachten", "Wertbeurteilung"];

        this.setConfig();
        this.setSelectInteraction();
    },

    mounted () {
        if (!this.layerConfigById(this.parcelLayerId)) {
            this.createParcelLayer(this.parcelLayerId);
        }

        this.select.setActive(true);
        this.select.getFeatures().on("change:length", (evt) => {
            this.selectedFeatures = [...evt.target.getArray()];
        });
    },
    unmounted () {
        if (!this.layerConfigById(this.parcelLayerId)) {
            layerCollection.removeLayerById(this.parcelLayerId);
        }
    },

    methods: {
        ...mapMutations("Modules/ValuationPrint", Object.keys(mutations)),
        ...mapActions("Maps", ["addInteraction"]),
        ...mapActions("Alerting", ["addSingleAlert"]),

        /**
         * Creates and adds parcel layer if it is not configured.
         * For performance reasons a max resolution is set to the layer.
         * @param {String} layerId - The id for the parcel layer.
         * @param {Number} scale - The scale for the max resolution of the layer.
         * @returns {void}
         */
        createParcelLayer (layerId, scale = 2500) {
            const layer = layerFactory.createLayer(rawLayerList.getLayerWhere({id: layerId})),
                resoByMaxScale = this.getResolutionByScale(scale, "max");

            layer.getLayer().setMaxResolution(resoByMaxScale + (resoByMaxScale / 100));
            layerCollection.addLayer(layer);
        },

        /**
         * Removes the passed feature from the collection where the select interaction will place the selected features.
         * @param {ol/Feature} feature - The feature to be removed.
         * @returns {void}
         */
        removeFeature (feature) {
            if (feature instanceof Feature) {
                this.select.getFeatures().remove(feature);
            }
        },

        /**
         * Gets the config for the valuation and sets it.
         * In addition, the print url is set from the config.
         * @param {Function} onsuccess - Is called when the config is set.
         * @returns {void}
         */
        setConfig () {
            axios.get("config.valuation.json", {
                headers: {
                    "Content-Type": "application/json"
                }
            })
                .then(response => {
                    this.config = response.data;
                    this.printUrl = this.restServiceById(response.data.settings.printServiceId).url;
                    this.pdfAppId = response.data.settings.pdfAppId;
                    this.imageAppId = response.data.settings.imageAppId;
                    this.pdfSpecificationAppId = response.data.settings.pdfSpecificationAppId;
                    this.defaultValue = response.data.settings.defaultValue;
                    this.fileprefix = response.data.settings.fileprefix;
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
                layers: (layer) => layer.get("id") === this.parcelLayerId,
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

            this.select.on("change:active", this.styleSelectedFeatures);
            this.addInteraction(this.select);
        },
        /**
         * Shows the print modal and saves the feature for print window
         * @param {Boolean} val - true or false to decide if open or close the print window
         * @param {ol/Feature[]} featureList - the selected feature(s) for the print window
         * @returns {void}
         */
        showPrintModal (val, featureList) {
            this.showModal = val;
            this.printedFeature = featureList;

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
            if (!this.formValidation()) {
                return;
            }
            if (!Array.isArray(featureList) || !featureList.length) {
                console.error(`startValuation: ${featureList} has to be a non empty array`);
                return;
            }
            const feature = featureList.length > 1 ? unionFeatures(featureList) : featureList[0],
                extent = feature.getGeometry().getExtent();

            this.messageList = [];
            this.urlList = [];
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
        getAddress (val, featureList) {
            const feature = featureList.length > 1 ? unionFeatures(featureList) : featureList[0],
                config = this.config?.services?.hh_wfs_dog;

            collectFeatures(
                {
                    geometry: feature.getGeometry()
                },
                config,
                this.projection.getCode(),
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
            const imageName = Object.keys(this.config.images[idx])[0],
                mapfishDialog = createMapfishDialog(
                    this.parcelData,
                    {},
                    this.config.images[idx],
                    this.defaultValue,
                    this.projection.getCode(),
                    this.getFilenameOfPDF(imageName, dayjs().format("YYYY-MM-DD"))
                );

            mapfishDialog.attributes.map = mapfishDialog.attributes[imageName + ".map"];
            delete mapfishDialog.attributes[imageName + ".map"];

            setTimeout(()=> {
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
                    this.addMessage(this.$t("additional:modules.valuationPrint.imageSuccess", {imageName: upperFirst(imageName)}), false);
                    this.addUrl(url, upperFirst(imageName));
                    if (this.config.images[idx + 1]) {
                        this.startImageProcess(idx + 1);
                        return;
                    }
                    this.showDownloadAll = true;
                });
            }, 0);
        },

        /**
         * Starts the process for the specification to print.
         * @returns {void}
         */
        startSpecificationProcess () {
            if (this.specificAddress === "" && this.addressList.length === 1) {
                this.specificAddress = this.addressList[0];
            }

            const mapfishDialog = createMapfishDialog(
                    this.parcelData,
                    {},
                    this.config.specification,
                    this.defaultValue,
                    this.projection.getCode(),
                    this.getFilenameOfPDF(this.$t("additional:modules.valuationPrint.specificationReport"), dayjs().format("YYYY-MM-DD"))
                ),
                replacedparcelData = {
                    "angabenZumGrundstueck.geschaeftszeichen": this.documentNumber.trim(),
                    "angabenZumGrundstueck.strasse": this.specificAddress.trim(),
                    "angabenZumGrundstueck.art": this.chosenType.trim()
                };

            Object.entries(replacedparcelData).forEach(([key, value]) => {
                mapfishDialog.attributes[key] = value;
            });

            setTimeout(()=> {
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
                    this.startImageProcess();
                });
            }, 0);
        },
        /**
         * Sets the style of the selected features depending on the activity of the select interaction.
         * If the interaction is active, all existing featurers are styled using the select interaction style.
         * If it is not, the layer style is used.
         * @param {ol/Object.ObjectEvent} evt - OpenLayers Object Event.
         * @param {String} evt.key - The name of the property whose value is changing.
         * @param {ol/interaction/Select} evt.target - The event target. In this case the select interaction.
         * @returns {void}
         */
        styleSelectedFeatures ({key, target}) {
            const features = target.getFeatures();

            if (target.get(key)) {
                features.forEach(feature => {
                    feature.setStyle(target.getStyle());
                });
            }
            else {
                features.forEach(feature => {
                    feature.setStyle(false);
                });
            }
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
                v-if="parcelModule === 'wanda'"
                class="parcel-report"
            >
                <h6 class="selected-parcels">
                    {{ $t('additional:modules.valuationPrint.parcelListTitle') }}
                </h6>
                <div class="parcels">
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
                                            value=""
                                            aria-label="..."
                                        >
                                        <div class="parcel col col-md-5 text-center">
                                            <div class="parcel-label">
                                                {{ $t('additional:modules.valuationPrint.parcel') }}
                                            </div>
                                            <div class="list-item">
                                                {{ feature.get("flstnrzae") }}
                                            </div>
                                        </div>
                                        <div class="parcel col col-md-5 text-center">
                                            <div class="parcel-label">
                                                {{ $t('additional:modules.valuationPrint.district') }}
                                            </div>
                                            <div class="list-item">
                                                {{ feature.get("gemarkung") }}
                                            </div>
                                        </div>
                                        <IconButton
                                            :aria="$t('additional:modules.valuationPrint.removeButton')"
                                            :icon="'bi-trash'"
                                            :interaction="() => removeFeature(feature)"
                                            class="remove btn-sm col col-md-1"
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
                                    :interaction="() => getAddress(true, select.getFeatures().getArray())"
                                    icon="bi-play"
                                />
                            </div>
                        </template>
                    </div>
                </div>
            </div>
            <div
                v-if="parcelModule === 'fis'"
                class="parcel-report"
            >
                <h6 class="generate-report pt-3">
                    {{ $t('additional:modules.valuationPrint.generateReport') }}
                </h6>
                <p class="infotext">
                    {{ $t('additional:modules.valuationPrint.infoGenerateReport') }}
                </p>
                <div class="d-flex justify-content-center pt-3">
                    <FlatButton
                        id="start-fis"
                        aria-label="$t('additional:modules.valuationPrint.startButton')"
                        type="button"
                        :text="$t('additional:modules.valuationPrint.startButton')"
                        :interaction="() => getAddress(true, select.getFeatures().getArray())"
                        icon="bi-play"
                    />
                </div>
                <hr>
            </div>
            <div
                v-if="messageList.length > 0"
                class="accordion accordion-flush mt-3"
            >
                <div class="accordion-item">
                    <h6 class="accordion-header message-list">
                        <button
                            class="accordion-button"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseMessage"
                            aria-expanded="true"
                            aria-controls="collapseMessage"
                        >
                            {{ $t('additional:modules.valuationPrint.messageListTitle') }}
                        </button>
                    </h6>
                    <div
                        id="collapseMessage"
                        class="accordion-collapse collapse show"
                        data-bs-parent="#accordionMessage"
                    >
                        <div class="accordion-body">
                            <div
                                v-for="(messageObj, idx) in messageList"
                                :key="idx + '_' + messageObj.message"
                                :class="messageObj.isError ? 'messageListError' : 'messageListEntry'"
                            >
                                {{ messageObj.message }}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div
                v-if="urlList.length > 0"
                class="mt-3"
            >
                <hr>
                <h6 class="download-header">
                    {{ $t('additional:modules.valuationPrint.urlListTitle') }}
                </h6>
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
                                list="addresslistOptions"
                                :placeholder="!autofill ? $t('additional:modules.valuationPrint.placeholder') : ''"
                                @change="setSpecificAddress"
                            >
                            <datalist id="addresslistOptions">
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
@import "/src_3_0_0/assets/css/mixins.scss";
@import "~variables";

h5 {
    font-family: "MasterPortalFont Bold", "Arial Narrow", Arial, sans-serif;
}
.selected-parcels, .accordion-button, .download-header, .generate-report {
    font-family: "MasterPortalFont Bold";
    font-size: 14px;
}

.def-font {
    font-size: 16px;
    .form-check-label {
        padding-top: 3px;
    }
}

button {
    font-size: 13px;
}

.messageListError {
    color: $danger;
}
.accordion-button {
    font-size: 13px;
}

.parcels {
    padding: 13px;
    .parcel-label {
        font-size: 12px;
    }
    .list-item {
        font-family: "MasterPortalFont Bold";
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
    }
}
.list-inline, .list-unstyled {
    margin-bottom: 0;
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
</style>
