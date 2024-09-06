<script>
import FlatButton from "../../../src/shared/modules/buttons/components/FlatButton.vue";
import IconButton from "../../../src/shared/modules/buttons/components/IconButton.vue";
import {mapGetters, mapActions} from "vuex";
import getOAFFeature from "../../../src/shared/js/api/oaf/getOAFFeature";
import Point from "ol/geom/Point";
import MultiPolygon from "ol/geom/MultiPolygon.js";
import layerCollection from "../../../src/core/layers/js/layerCollection";
import layerFactory from "../../../src/core/layers/js/layerFactory";
import {Fill, Stroke, Style} from "ol/style.js";
import {intersect, getUnbuiltArea, calcArea, buffer} from "../js/spatialOperations";

export default {
    name: "WaterRiskCheck",
    components: {
        FlatButton,
        IconButton
    },
    data () {
        return {
            formStarted: false,
            formFinished: false,
            questions: [],
            currentQuestionIdx: 0,
            downloadLink: "",
            infoBoxOpen: false,
            isCreatingPDF: false,
            calculatedPercentage: 0,
            parcel: {},
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
                    values: undefined
                },
                groundWaterMin: {
                    url: "https://api.hamburg.de/datasets/v1/grundwasserflurabstand_min_2008",
                    collection: "u12_f_gw_flurabstand_min",
                    geometryName: "geom",
                    propertyToUse: "klasse_in_m_unter_gok",
                    geoJsonFeatures: [],
                    values: undefined
                },
                hwrm_mittel: {
                    url: "https://api.hamburg.de/datasets/v1/hwrm_2_zyklus",
                    collection: "rwme_dehh_2hwrm_2019",
                    geometryName: "geom",
                    propertyToUse: "wassertiefe",
                    geoJsonFeatures: [],
                    values: undefined
                },
                hwrm_selten: {
                    url: "https://api.hamburg.de/datasets/v1/hwrm_2_zyklus",
                    collection: "rwlo_dehh_2hwrm_2019",
                    geometryName: "geom",
                    propertyToUse: "wassertiefe",
                    geoJsonFeatures: [],
                    values: undefined
                },
                uesg: {
                    url: "https://api.hamburg.de/datasets/v1/uesg",
                    collection: "ueberschwemmungsgebiete",
                    geometryName: "geom",
                    geoJsonFeatures: []
                }
            }
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
            "alkisBaseUrl"
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
         * @returns {void}
         */
        pageNamesFromQuestions () {
            const names = this.alwaysShow[0];

            this.pdfPages.forEach((name) => {
                names[Object.keys(name)[0]] = false;
            });

            return names;
        },

        /**
         * Gets all builindgs of the type 'gebaeude'.
         * @returns {Object[]} The buildings.
         */
        buildingsToUse () {
            return this.buildings.filter(building => building?.properties?.gebnutzbez === "Gebaeude");
        }
    },
    watch: {
        /**
         * Listen to the mutation "modules/WaterRiskCheck/setAddress".
         * @returns {void}
         */
        address () {
            if (this.formStarted && this.address !== "") {
                this.resetAll(false);
            }
            this.walkTroughToFetchAndAdd();
        },

        currentQuestionIdx (val) {
            this.updateCalculatedPercentage(val);
            if (this.infoBoxOpen) {
                this.$refs.information.click();
            }
        }
    },
    created () {
        this.createLayer();
    },
    mounted () {
        this.questions = [...this.configuredQuestions];
        this.sideMenuWidth = document.getElementById("mp-menu-secondaryMenu").style.width;
        document.getElementById("mp-menu-secondaryMenu").style.width = "37vw";
    },
    unmounted () {
        this.resetAll();
        document.getElementById("mp-menu-secondaryMenu").style.width = this.sideMenuWidth;
    },
    methods: {
        ...mapActions("Modules/WaterRiskCheck", [
            "setAddress"
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

            const addressPoint = new Point(this.addressCoordinates),
                addressPointWGS8 = addressPoint.clone().transform("EPSG:25832", "EPSG:4326"),
                parcelGeometry = new MultiPolygon([]);

            this.layer.getLayerSource().clear();
            this.parcel = await this.fetchFeatures(addressPointWGS8, "Flurstueck", this.alkisBaseUrl, "geometrie", true);
            this.buildingsByAddress = buffer(await this.fetchFeatures(addressPointWGS8, "GebaeudeBauwerk", this.alkisBaseUrl, "geometrie", true));
            parcelGeometry.setCoordinates(this.parcel[0].geometry.coordinates);
            this.buildings = buffer(await this.fetchFeatures(parcelGeometry, "GebaeudeBauwerk", this.alkisBaseUrl, "geometrie"));

            this.addDataByParcel(this.data, this.parcel[0], parcelGeometry);
        },

        /**
         * Adds the passed spatial data for the parcel.
         * @param {Object} data - The spatial data to add.
         * @param {GeoJSON} parcelFeature - The feature of the parcel.
         * @param {ol/Geometry} parcelGeometry - The geometry of the parcel.
         * @returns {void}
         */
        async addDataByParcel (data, parcelFeature, parcelGeometry) {
            const unbuiltArea = getUnbuiltArea(parcelFeature, this.buildingsToUse);

            for (const key of Object.keys(data)) {
                this.fetchFeatures(parcelGeometry, data[key].collection, data[key].url, data[key].geometryName)
                    .then(geoJsonList => {
                        data[key].geoJsonFeatures = intersect(geoJsonList, unbuiltArea);
                        if (data[key].propertyToUse) {
                            data[key].values = calcArea(data[key].geoJsonFeatures, unbuiltArea, data[key].propertyToUse);
                        }
                    });
            }
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
                    geoJson = await getOAFFeature.getOAFFeatureGet(url, collection, 100, filter, "http://www.opengis.net/def/crs/OGC/1.3/CRS84", "http://www.opengis.net/def/crs/OGC/1.3/CRS84");

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
         * Finishes the form.
         * @returns {void}
         */
        finishForm () {
            this.updateCalculatedPercentage("finish");
            this.preparePDFPageNames();
            this.isCreatingPDF = true;
            setTimeout(() => {
                this.isCreatingPDF = false;
                this.formStarted = false;
                this.formFinished = true;
            }, 2000);
        },
        /**
         * Toggles the infoBoxOpen flag.
         * @returns {void}
         */
        toggleInfoBox () {
            this.infoBoxOpen = !this.infoBoxOpen;
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
                this.layer.getLayerSource().clear();
                this.parcel = {};
                this.buildings = [];
                this.setAddress("", undefined);
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
         * @returns {void}
         */
        preparePDFPageNames () {
            const pages = [];

            this.pdfPages.forEach((page) => {
                Object.keys(page).forEach(val => {
                    // TODO: Compare with data
                    if (this.pageNamesFromQuestions[val] === page[val].question) {
                        pages[val] = true;
                    }
                    else {
                        pages[val] = false;
                    }
                });
            });
            // this.createJson(pages);
        }
        /**
        * @TODO
        * @param {Array} pages
        * @returns {void}
        */
        /* createJson (pages) {
            console.log(pages);
        }*/
    }
};
</script>

<template lang="html">
    <div
        id="tool-waterRiskCheck"
        class="water-risk-check"
    >
        <div v-if="!formStarted && !formFinished">
            <p>
                {{ $t('additional:modules.waterRiskCheck.generelExplenationText') }}
            </p>
            <br>
            <p
                v-if="!address"
                class="address-hint d-flex justify-content-center align-items-center my-3 text-md-center"
            >
                {{ $t("additional:modules.waterRiskCheck.addressInput") }}
            </p>
            <div
                v-else
                class="container mt-3"
            >
                <div class="row justify-content-center">
                    <div class="col-1 p-0">
                        <i class="geo-icon bi-geo-alt-fill text-secondary float-center me-1" />
                    </div>
                    <div class="address-container col-auto d-flex flex-column justify-content-center align-items-start m-0">
                        <p class="current-address font-bold mb-2">
                            {{ address }}
                        </p>
                        <div class="d-flex justify-content-center">
                            <p>{{ $t("additional:modules.waterRiskCheck.districtLabel") }}</p>
                            <p class="font-bold">
                                {{ districtName }}
                            </p>
                        </div>
                        <div class="d-flex justify-content-center">
                            <p>{{ $t("additional:modules.waterRiskCheck.parcelLabel") }}</p>
                            <p class="font-bold">
                                {{ parcelNumber }}
                            </p>
                        </div>
                        <div class="d-flex justify-content-center">
                            <p>{{ $t("additional:modules.waterRiskCheck.buildingCountLabel") }}</p>
                            <p class="font-bold">
                                {{ countOfBuildings }}
                            </p>
                        </div>
                    </div>
                </div>
                <hr class="my-5">
                <div class="row">
                    <div class="col-1 d-flex align-items-center">
                        <i class="bi-info-circle" />
                    </div>
                    <div class="col-11 d-flex align-items-center">
                        <p class="fs-5">
                            {{ $t("additional:modules.waterRiskCheck.informationTextIconLabel") }}
                        </p>
                    </div>
                </div>
                <div class="row mb-3 mt-2">
                    <p class="col offset-md-1">
                        {{ $t("additional:modules.waterRiskCheck.informationText") }}
                    </p>
                </div>
                <div class="row">
                    <div class="col d-flex justify-content-center mt-3">
                        <FlatButton
                            id="start-form"
                            :aria-label="$t('additional:modules.waterRiskCheck.formStartButton')"
                            type="button"
                            :text="$t('additional:modules.waterRiskCheck.formStartButton')"
                            :interaction="startForm"
                            icon="bi-play-circle"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div v-else-if="formStarted && !formFinished && questions.length">
            <div class="container basic-infos">
                <div class="info-header row">
                    <div class="col-md-auto">
                        <p>
                            {{ $t('additional:modules.waterRiskCheck.addressLabel') }}
                        </p>
                        <p class="basic-infos-address">
                            {{ address }}
                        </p>
                    </div>
                    <div class="col-md-1 p-0">
                        <IconButton
                            id="reset-button"
                            :aria="$t('additional:modules.waterRiskCheck.reset')"
                            :interaction="() => resetAll()"
                            class="remove btn-light col col-md-1 p-0 fs-5"
                            icon="bi bi-pencil-fill"
                        />
                    </div>
                    <div
                        class="col pe-0"
                    >
                        <img
                            class="header-logo float-end"
                            :src="'./assets/logo.png'"
                            :alt="$t('additional:modules.waterRiskCheck.toolIconAltText')"
                        >
                    </div>
                    <p class="row mt-2 mx-0 pe-0">
                        {{ $t('additional:modules.waterRiskCheck.formInformationText') }}
                    </p>
                </div>
            </div>
            <div class="form-container container">
                <div class="progress-section px-4 my-4 row">
                    <div class="d-flex justify-content-center">
                        {{ $t('additional:modules.waterRiskCheck.themeProgressLabel', {currentIdx: currentQuestionIdx + 1, maxLength: questions.length}) }}
                    </div>
                    <div class="progress p-0">
                        <div
                            class="progress-bar bg-secondary"
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
                            <p class="font-bold mb-2">
                                {{ questions[currentQuestionIdx].title }}
                            </p>
                            <span class="mb-2">
                                {{ questions[currentQuestionIdx].question }}
                            </span>
                            <button
                                id="information"
                                ref="information"
                                type="button"
                                class="btn btn-sm btn-secondary rounded-pill lh-1 me-2 mb-2"
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
                                id="collapseInfo"
                                class="collapse"
                            >
                                <div class="card card-body p-4 border border-primary rounded">
                                    <div class="container p-0">
                                        <div class="row">
                                            <div class="col-6">
                                                <h6 class="text-secondary">
                                                    {{ questions[currentQuestionIdx].title }}
                                                </h6>
                                                <p
                                                    v-html="questions[currentQuestionIdx].info.text"
                                                />
                                            </div>
                                            <div class="col-6 d-flex justify-content-end align-items-start">
                                                <img
                                                    class="information-image"
                                                    :src="questions[currentQuestionIdx].info.image"
                                                    :alt="questions[currentQuestionIdx].info.alt"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
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
                        :aria-label="$t('additional:modules.waterRiskCheck.finishButton')"
                        type="button"
                        :text="$t('additional:modules.waterRiskCheck.finishButton')"
                        :interaction="finishForm"
                        :disabled="typeof questions[currentQuestionIdx].selectedAnswer === 'undefined' || isCreatingPDF"
                        :spinner-trigger="isCreatingPDF"
                        icon="bi-arrow-right-circle-fill"
                    />
                </div>
            </div>
        </div>
        <div v-else>
            <div class="container">
                <div class="d-flex flex-column mb-4">
                    <p>
                        {{ $t('additional:modules.waterRiskCheck.addressLabel') }}
                    </p>
                    <p class="font-bold">
                        {{ address }}
                    </p>
                </div>
                <div>
                    <h5>{{ $t('additional:modules.waterRiskCheck.downloadPageTitle') }}</h5>
                    <p>{{ $t('additional:modules.waterRiskCheck.downloadInformationText') }}</p>
                    <div
                        ref="downloadSection"
                        class="mt-3"
                    >
                        <div class="container">
                            <div class="row">
                                <div
                                    class="d-flex justify-content-center pt-2 pb-1 mb-1"
                                >
                                    <FlatButton
                                        id="download-report"
                                        aria-label="$t('additional:modules.waterRiskCheck.download')"
                                        type="button"
                                        :text="$t('additional:modules.waterRiskCheck.download')"
                                        icon="bi-download"
                                        class="mb-1"
                                        :interaction="() => {}"
                                    />
                                </div>
                                <div
                                    class="d-flex justify-content-center pt-1 pb-3"
                                >
                                    <FlatButton
                                        id="reset"
                                        aria-label="$t('additional:modules.waterRiskCheck.resetButton')"
                                        type="button"
                                        :text="$t('additional:modules.waterRiskCheck.resetButton')"
                                        icon="bi bi-arrow-clockwise"
                                        :interaction="() => resetAll()"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div v-if="!formStarted || formFinished">
            <div class="row">
                <div class="d-flex justify-content-center pt-2">
                    <img
                        class="logo-image img-fluid"
                        :src="'./assets/logo.png'"
                        :alt="$t('additional:modules.waterRiskCheck.toolIconAltText')"
                    >
                </div>
            </div>
        </div>
    </div>
</template>


<style lang="scss" scoped>
    @import "~mixins";

    #collapseHiddenButton {
        display: none;
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
        border-radius: 10px;
        height: 100%;
    }
    .information-image {
        width: 100%;
        z-index: 10;
    }
    .information-image:hover {
        transform: scale(3.5) translateX(-24%);
        width: 75%;
    }
    .selected-answer-icon {
        left: 15px;
        top: 9px;
    }
    .answer:hover, .marked-answers{
        background-color: $primary;
        font-family: $font_family_accent;
    }
    .logo-image {
        width: 135px;
    }
    .geo-icon {
        font-size: 40px;
    }
    .address-container p {
        margin-right: 5px;
    }
    .current-address {
        font-size: 16px;
    }
    .address-hint, .basic-infos-address, .text-secondary {
        font-family: $font_family_accent;
    }
    .header-logo {
        width: 80px;
    }
</style>
