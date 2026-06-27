<script>
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import dayjs from "dayjs";
import {debounce} from "chart.js/helpers";
import DistrictFinderFilterCard from "./DistrictFinderFilterCard.vue";
import DistrictFinderFilterExport from "./DistrictFinderFilterExport.vue";
import DistrictFinderFilterImport from "./DistrictFinderFilterImport.vue";
import DistrictFinderFilterOperator from "./DistrictFinderFilterOperator.vue";
import {Fill, Style} from "ol/style.js";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import isObject from "@shared/js/utils/isObject";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {uniqueId} from "@shared/js/utils/uniqueId";
import {getMappingJsonJS} from "../../utils/getMappingJson";
import {VSnackbar} from "vuetify/components/VSnackbar";

export default {
    name: "DistrictFinderFilter",
    components: {
        AlertMessage,
        DistrictFinderFilterCard,
        DistrictFinderFilterExport,
        DistrictFinderFilterImport,
        DistrictFinderFilterOperator,
        FlatButton,
        IconButton,
        VSnackbar
    },
    data () {
        return {
            activeCardId: "",
            copyValue: false,
            isFieldValidated: true,
            loader: null,
            numberOfLimitedAreas: 20,
            olFeatures: [],
            resultList: false,
            showExportDialog: false,
            showMoreAreas: false,
            latestYear: false,
            showHintToChangeLatestYear: false,
            combinedDistricts: []
        };
    },
    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Modules/DistrictFinder", ["cardList", "choroplethDebounceDelay", "conditionDate", "conditionTitle", "filteredLayer", "mapColors", "topLevelSelection", "selectedLevelId", "selectedDistricts", "subLevelSelection"]),
        ...mapGetters("Modules/DistrictSelector", ["districtLevels"]),

        selectedDistrictLevel () {
            return this.districtLevels.find(level => level.layerId === this.selectedLevelId) || {};
        },
        /**
         * Gets the districts of all cards.
         * @returns {String[]} The districts.
         */
        allDistricts () {
            return this.cardList.map(card => card.districts);
        },

        /**
         * Gets the operators of all cards.
         * @returns {String[]} The operators.
         */
        allOperators () {
            return this.cardList.map(card => card.operator);
        },

        /**
         * Gets the selected districts as they appear in the data (after processing combination defined in mapping).
         * @returns {String[]} The selected statistic districts.
         */
        selectedStatisticDistricts () {
            return this.selectedDistricts.map(
                district => this.selectedDistrictLevel?.districtNamesMap?.[district] || district
            );
        }
    },
    watch: {
        /**
         * If no conditions exist, resultList is set to false.
         * @param {Object[]} val - the card list.
         * @returns {void}
         */
        cardList (val) {
            if (Array.isArray(val) && !val.length) {
                this.resultList = false;
                this.resetFilteredLayer();
            }
        },
        /**
         * If the selected districts changes the result list should update.
         * @returns {void}
         */
        selectedDistricts () {
            if (Array.isArray(this.resultList)) {
                this.updateResultList(this.allDistricts, this.allOperators);
            }
        },
        /**
         * Sets the selected districts level id according to the selected level id
         * @param {String} val - the selected level id.
         * @returns {void}
         */
        selectedLevelId (val) {
            this.setSelectedDistrictLevelId(val);
        }
    },

    async created () {
        this.setMapping(await getMappingJsonJS.getMappingJson());
        this.setFilteredLayer(await this.addNewLayerIfNotExists({layerName: "filteredLayer"}));
    },
    mounted () {
        if (!this.cardList.length) {
            this.addCard();
        }

        if (this.conditionTitle === "") {
            this.setConditionTitle(this.$t("additional:modules.tools.cosi.districtFinder.conditions"));
        }
    },
    unmounted () {
        this.resetFilteredLayer();
    },
    methods: {
        ...mapActions("Modules/DistrictSelector", ["setDistrictsByName"]),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapActions("Maps", ["addNewLayerIfNotExists"]),
        ...mapMutations("Modules/DistrictFinder", ["setCardList", "setConditionDate", "setConditionTitle", "setFilteredLayer", "setMapping"]),
        ...mapMutations("Modules/DistrictSelector", ["setSelectedDistrictLevel", "setSelectedDistrictLevelId"]),

        /**
         * Adds a new card to the list of cards.
         * @returns {void}
         */
        addCard () {
            const conditionCards = this.cardList.length ? this.cardList : [];

            conditionCards.push(
                {
                    districts: [],
                    id: uniqueId("card-"),
                    operator: "or",
                    rule: "=",
                    ruleTolerance: 0,
                    year: false
                });

            this.setCardList(conditionCards);
        },

        /**
         * Copies all found areas to the clipboard.
         * @param {String} names - all names of the found areas.
         * @returns {void}
         */
        copyToClipboard (names) {
            navigator.clipboard.writeText(names);
            this.copyValue = true;
        },

        /**
         * Deletes a card from the list of cards by the given id.
         * @param {String} cardId - The id of the card to delete.
         * @returns {void}
         */
        deleteCard (cardId) {
            const indexOfCard = this.cardList.findIndex(card => card.id === cardId);

            if (indexOfCard || indexOfCard === 0) {
                this.cardList.splice(indexOfCard, 1);
                this.updateResultList(this.allDistricts, this.allOperators);
            }
        },

        /**
         * Exports the conditions as JSON.
         * @param {String} name - The file name.
         * @param {Boolean} withAreas - A flag to controls whether the districts should be exported.
         * @returns {void}
         */
        exportConditions (name, withAreas) {
            const date = dayjs(new Date()).format("YYYY-MM-DD"),
                data = this.getExportedData(name, date, withAreas, this.cardList),
                filename = name + "-" + date + ".json",
                jsonStr = JSON.stringify(data),
                element = document.createElement("a");

            element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(jsonStr));
            element.setAttribute("download", filename);

            element.style.display = "none";
            document.body.appendChild(element);

            element.click();

            document.body.removeChild(element);
        },


        /**
         * Gets all area results separated by commas.
         * @returns {String} The results.
         */
        getCommaSeparatedAreaNames () {
            if (this.resultList.length > this.numberOfLimitedAreas && !this.showMoreAreas) {
                const limitedAreas = this.resultList.slice(0, this.numberOfLimitedAreas);

                return limitedAreas.join(", ");
            }
            return this.resultList.join(", ");
        },

        /**
         * Gets the exported data
         * @param {String} name - The name of the conditions.
         * @param {String} date - The creation date of the conditions.
         * @param {Boolean} withAreas - A flag to controls whether the districts should be exported.
         * @param {Object[]} conditionList - A list of the conditions.
         * @returns {Object} the exported data
         */
        getExportedData (name, date, withAreas, conditionList) {
            const data = {
                meta: {
                    name,
                    date
                },
                districtSelector: {
                    selectedLevelId: this.selectedLevelId
                },
                data: conditionList
            };

            if (withAreas) {
                Object.assign(data.districtSelector, {
                    selectedTopLevels: this.topLevelSelection,
                    selectedSubLevels: this.subLevelSelection
                });
            }

            return data;
        },

        /**
         * Gets the list of final results after applying the logical operators on the array of results.
         * @param {String[[]]} arrayOfArrays - An array of string arrays.
         * @param {String[]} operators - An array of logical operators.
         * @returns {String[]} A flat array containing the final result list.
         */
        getResultList (arrayOfArrays, operators) {
            if (
                !Array.isArray(arrayOfArrays) ||
                arrayOfArrays.length === 0 ||
                !Array.isArray(operators)
            ) {
                return [];
            }

            const remainingArrays = [...arrayOfArrays],
                remainingOperators = [...operators];

            remainingOperators.splice(0, 1);

            while (remainingOperators.includes("and")) {
                const indexOfAnd = remainingOperators.indexOf("and");

                remainingArrays[indexOfAnd] = remainingArrays[indexOfAnd]?.filter(e => remainingArrays[indexOfAnd + 1].includes(e)) || [];
                remainingArrays.splice(indexOfAnd + 1, 1);
                remainingOperators.splice(indexOfAnd, 1);
            }

            return [...new Set(remainingArrays.flat())];
        },

        /**
         * Sets the date of the conditions.
         * @param {String} date - The date of the conditions.
         * @returns {void}
         */
        importConditionDate (date) {
            if (typeof date !== "string") {
                return;
            }

            this.setConditionDate(dayjs(date).format("DD.MM.YYYY"));
        },

        /**
         * Sets the title of the conditions.
         * @param {String} title - The title of the conditions.
         * @returns {void}
         */
        importConditionTitle (title) {
            this.setConditionTitle(title);
        },

        /**
         * Resets the cardList
         * @returns {void}
         */
        resetCardList () {
            this.setCardList([]);
        },

        /**
         * Resets the cardList to original status.
         * @returns {void}
         */
        async resetToOrigin () {
            this.resetFilteredLayer();
            this.resetCardList();
            await this.$nextTick();
            this.addCard();
            this.resultList = false;
            this.setConditionTitle(this.$t("additional:modules.tools.cosi.districtFinder.conditions"));
            this.setConditionDate("");
            this.setLatestYear(false);
        },

        /**
         * Resets the filtered layer.
         * @returns {void}
         */
        resetFilteredLayer () {
            if (typeof this.filteredLayer?.getSource() !== "undefined") {
                this.filteredLayer.getSource().clear();
            }
        },

        /**
         * Resolve the given districts by the passed mapping object.
         * @param {String[]} districts - The districts to mapped.
         * @param {Object} districtsMapping - The mapping object.
         * @returns {String[]} The mapped districts.
         */
        resolveByMapping (districts, districtsMapping) {
            if (!isObject(districtsMapping)) {
                return districts;
            }

            const mappedDistricts = [];

            districts?.forEach(district => {
                if (Object.hasOwnProperty.call(districtsMapping, district)) {
                    mappedDistricts.push(...districtsMapping[district]);
                }
                else {
                    mappedDistricts.push(district);
                }
            });

            return mappedDistricts;
        },

        /**
         * Reverses the district names mapping object. Keys become values and values become keys.
         * @param {Object} districtNamesMap - Mapping object to reverse.
         * @returns {Object} The reversed mapping object.
         */
        reverseDistrictNamesMap (districtNamesMap) {
            const obj = {};

            Object.entries(districtNamesMap).forEach(([key, value]) => {
                if (Object.prototype.hasOwnProperty.call(obj, value)) {
                    obj[value].push(key);
                }
                else {
                    obj[value] = [key];
                }
            });

            return obj;
        },

        /**
         * Sets the values for the card.
         * @param {String} cardId - The id of the card.
         * @param {String[]} names - The Names of the district names.
         * @param {Number} year - The year of the card.
         * @param {String} category - The category of the card.
         * @param {Number} referenceValue - The referenceValue of the card.
         * @param {Number} tolerance - The tolerance of the card.
         * @param {String} rule - The rule of the card.
         * @returns {void}
         */
        setCardAttributes (cardId, names, year, category, referenceValue, tolerance, rule) {
            const foundCard = this.cardList.find(card => card.id === cardId);

            if (foundCard) {
                foundCard.districts = names;
                foundCard.year = year;
                foundCard.statisticCategory = category;
                foundCard.referenceValue = referenceValue;
                foundCard.ruleTolerance = tolerance;
                foundCard.rule = rule;
                this.updateResultList(this.allDistricts, this.allOperators);
            }
        },

        /**
         * Sets the value of an operator on a card.
         * @param {String} cardId - The id of the card.
         * @param {String} operatorValue - The value ("or" or "and") to set.
         * @returns {void}
         */
        setCardOperator (cardId, operatorValue) {
            const foundCard = this.cardList.find(card => card.id === cardId);

            if (foundCard) {
                foundCard.operator = operatorValue;

                if (foundCard.statisticCategory) {
                    this.updateResultList(this.allDistricts, this.allOperators);
                }
            }
        },

        /**
         * First the list of cards/conditons is reset and then a new list of cards/conditons is set.
         * @param {Object[]} cardList - The list of cards/conditions.
         * @returns {void}
         */
        setConditionCards (cardList) {
            this.resetCardList();
            this.$nextTick(() => {
                this.setCardList(cardList);
                this.updateResultList(this.allDistricts, this.allOperators);
            });
        },
        /**
         * Sets if a newer dataset should be used or not.
         * @param {Boolean} latest - True if a newer dataset should be used.
         * @returns {void}
         */
        setLatestYear (latest) {
            this.latestYear = latest;
        },

        /**
         * Sets the currently found districts as selected districts.
         * @returns {void}
         */
        async setDistricts () {
            const districtNamesToSet = this.selectedDistrictLevel?.districtNamesMap
                ? this.resolveByMapping(this.resultList, this.reverseDistrictNamesMap(this.selectedDistrictLevel.districtNamesMap))
                : this.resultList;

            this.setSelectedDistrictLevelId(this.selectedLevelId);
            this.setSelectedDistrictLevel(this.selectedDistrictLevel);

            this.changeCurrentComponent({type: "districtSelector", side: "secondaryMenu", props: {name: "additional:modules.cosi.districtSelector.title"}});
            await this.$nextTick();
            this.setDistrictsByName({districtNames: districtNamesToSet});
        },

        /**
         * Prepares the openlayers feature for choropleth map
         * @param {Object[]} features OAF features with geometries.
         * @param {String} key The property to be used as feature id (e.g. "stat_gebiet").
         * @returns {void}
         */
        prepareOLFeatures (features, key) {
            if (typeof this.filteredLayer?.getSource() === "undefined") {
                return;
            }

            const newFeatures = getOAFFeature.readAllOAFToGeoJSON(features);

            newFeatures.forEach(feature => {
                const id = feature.get(key);

                feature.setId(id);
                if (this.selectedStatisticDistricts.includes(id)) {
                    feature.setStyle(new Style({fill: new Fill({color:
                        this.resultList?.includes?.(id)
                            ? this.mapColors.conditionTrue : this.mapColors.conditionFalse
                    })}));
                }
                else {
                    feature.setStyle(new Style({fill: new Fill({color: [0, 0, 0, 0]})}));
                }
            });

            this.olFeatures.forEach(f => f.setId("invalid"));
            this.filteredLayer.getSource().addFeatures(newFeatures);
            this.filteredLayer.getSource().removeFeatures(this.olFeatures);
            this.olFeatures = newFeatures;
        },

        /**
         * Sets the style of filtered features and the rest features.
         * @returns {void}
         */
        setFeatureStyle () {
            this.olFeatures.forEach(feature => {
                if (this.selectedStatisticDistricts.includes(feature?.getId())) {
                    feature?.getStyle()?.getFill()?.setColor(
                        this.resultList?.includes?.(feature?.getId()) ?
                            this.mapColors.conditionTrue :
                            this.mapColors.conditionFalse
                    );
                }
                else {
                    feature?.getStyle()?.getFill()?.setColor([0, 0, 0, 0]);
                }
            });
            this.filteredLayer?.changed();
        },

        /**
         * Sets the value of isFieldValidated.
         * @param {Boolean} val - true or false.
         * @returns {void}
         */
        setFieldValidated (val) {
            this.isFieldValidated = val;
        },
        /**
         * Sets if the hint for the latest year is shown or not.
         * @param {Boolean} val - The flag which decides wether the hint should be shown or not.
         * @returns {void}
         */
        showLatestYear (val) {
            this.showHintToChangeLatestYear = val;
        },

        /**
         * Sets the active card id by toggle the clicked card.
         * @param {String} id - the clicked card id.
         * @returns {void}
         */
        toggleCardActive (id) {
            this.activeCardId = id;
        },

        /**
         * Update the mapped district names that are contained in the result list.
         *  @returns {void}
         */
        updateMappedDistrictNames () {
            const mappedDistrictNames = Object.values(this.selectedDistrictLevel?.districtNamesMap).filter(e => this.resultList?.includes(e));

            this.combinedDistricts = [];

            mappedDistrictNames.forEach(district => {
                if (district.indexOf("/") >= 0 && !this.combinedDistricts.includes(district)) {
                    this.combinedDistricts.push(district);
                }
            });
        },

        /**
         * Update the result list.
         * @param {String[]} districts - The districts of all cards.
         * @param {String[]} operators - The operators of all cards.
         * @returns {void}
         */
        updateResultList (districts, operators) {
            const selectedDistrictsArray = [];

            if (Array.isArray(this.selectedDistricts)) {
                this.selectedDistricts.forEach(district => {
                    selectedDistrictsArray.push(this.selectedDistrictLevel?.districtNamesMap?.[district] || district);
                });
            }

            this.resultList = this.getResultList(districts, operators)
                .filter(e => selectedDistrictsArray.includes(e));

            if (Array.isArray(this.resultList) && this.selectedDistrictLevel.districtNamesMap) {
                this.updateMappedDistrictNames();
            }

            debounce(this.setFeatureStyle, this.choroplethDebounceDelay)();
        }
    }
};
</script>

<template lang="html">
    <div id="district-finder-filter">
        <h5 class="pt-4">
            {{ $t("additional:modules.tools.cosi.districtFinder.newScreening") }}
        </h5>
        <DistrictFinderFilterImport
            @setLatestYear="setLatestYear"
            @setCardList="setConditionCards"
            @setConditionDate="importConditionDate"
            @setConditionTitle="importConditionTitle"
        />
        <hr>
        <div class="d-flex align-items-center my-3">
            <h4 class="filter-title me-auto">
                {{ conditionTitle }}
                <br>
                <span
                    v-if="conditionDate !== ''"
                    class="text-black-50 fs-6"
                >
                    {{ $t("additional:modules.tools.cosi.districtFinder.created") }} {{ conditionDate }}
                </span>
            </h4>
            <IconButton
                id="reset-button"
                aria="zurücksetzen"
                :class-array="['btn-primary', 'me-3']"
                icon="bi bi-x-circle"
                :interaction="() => resetToOrigin()"
                :disabled="resultList === false"
            />
            <div class="dropdown">
                <IconButton
                    id="export-button"
                    aria="exportieren"
                    class="dropdwon-toggle"
                    :class-array="['btn-primary']"
                    icon="bi bi-download"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                    :disabled="resultList === false || !isFieldValidated"
                />
                <DistrictFinderFilterExport
                    v-show="resultList !== false"
                    @exportConditions="exportConditions"
                />
            </div>
        </div>
        <transition-group
            v-if="cardList.length"
            name="slide-fade"
        >
            <div
                v-for="(card, index) in cardList"
                :key="card.id"
                class="list-item"
            >
                <DistrictFinderFilterOperator
                    v-if="index !== 0"
                    :id="card.id"
                    :operator="card.operator"
                    @change="setCardOperator"
                />
                <!--Will be commented out until it is possible to select and activate the cards again.-->
                <!--<div
                    class="card-section"
                    :class="activeCardId === card.id? 'active' : ''"
                    role="button"
                    tabindex="0"
                    @focusout="toggleCardActive('')"
                    @click="toggleCardActive(card.id)"
                    @keydown="toggleCardActive(card.id)"
                >-->
                <DistrictFinderFilterCard
                    :condition="card"
                    :card-number="index + 1"
                    :active="activeCardId === card.id"
                    :change-to-latest-year="latestYear"
                    class="mx-4"
                    @delete="deleteCard"
                    @scanCompleted="setCardAttributes"
                    @validateField="setFieldValidated"
                    @showHint="showLatestYear"
                    @prepareFeatures="prepareOLFeatures"
                />
                <!--</div>-->
            </div>
        </transition-group>
        <div class="container pt-4">
            <div class="row justify-content-center">
                <button
                    class="add-button col col-10 btn btn-light p-3 rounded-4 align-items-center "
                    type="button"
                    @click="addCard"
                >
                    <i
                        class="bi bi-plus-circle fs-5 me-3"
                    />
                    {{ $t("additional:modules.tools.cosi.districtFinder.button.addCondition") }}
                </button>
            </div>
            <div
                v-if="resultList"
                class="pt-5 found-areas mx-4"
            >
                <h5 class="result-headline">
                    {{ resultList.length }} {{ resultList.length === 1 ? $t("additional:modules.tools.cosi.districtFinder.foundArea") : $t("additional:modules.tools.cosi.districtFinder.foundAreas") }}
                </h5>
                <template v-if="resultList.length > 0">
                    <AlertMessage
                        v-if="combinedDistricts.length"
                        closeable
                        class="py-3"
                        :text="$t('additional:modules.tools.cosi.districtFinder.infoCombinedDistrict') + combinedDistricts.join(', ') + '.'"
                        type="info"
                    />
                    <div class="copy-box mb-4 p-2 container rounded">
                        <div class="row">
                            <div class="col col-11 ps-5 pe-0 py-2">
                                {{ getCommaSeparatedAreaNames() }}
                                <button
                                    v-if="resultList.length > numberOfLimitedAreas"
                                    class="btn btn-link lh-1 fs-6 ps-0"
                                    @click="showMoreAreas = !showMoreAreas"
                                >
                                    {{ showMoreAreas ? $t("additional:modules.tools.cosi.districtFinder.button.showLess") : $t("additional:modules.tools.cosi.districtFinder.button.showMore") }}
                                </button>
                            </div>
                            <div class="col col-1 text-end ps-0">
                                <button
                                    class="copy-button btn btn-link lh-1 fs-5 p-0"
                                    @click="copyToClipboard (resultList.join(', '))"
                                >
                                    <i
                                        class="copy-icon"
                                        :class="copyValue ? 'bi bi-check2-all' : 'bi bi-back'"
                                    />
                                </button>
                            </div>
                            <v-snackbar
                                v-model="copyValue"
                                :timeout="5000"
                            >
                                {{ $t("additional:modules.tools.cosi.districtFinder.copyClipboard") }}
                            </v-snackbar>
                            <v-snackbar
                                v-model="showHintToChangeLatestYear"
                                :timeout="5000"
                            >
                                {{ $t("additional:modules.tools.cosi.districtFinder.changeToLatestYear") }}
                            </v-snackbar>
                        </div>
                    </div>
                </template>
            </div>
            <div class="row justify-content-center pt-3">
                <FlatButton
                    id="confirmButton"
                    icon="bi bi-check"
                    :aria-label="$t('additional:modules.tools.cosi.districtFinder.button.confirm')"
                    :text="$t('additional:modules.tools.cosi.districtFinder.button.confirm')"
                    :disabled="resultList === false || resultList.length === 0"
                    :interaction="() => setDistricts()"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>

    #district-finder-filter {
        .copy-box {
            background-color: $secondary_table_style;
            .copy-icon {
                font-size: 16px;
            }
        }

        #export-dialog {
            min-width: 250px;
        }

        .list-item {
            .card-section {
                .card {
                    border: 2px solid rgba(255, 255, 255, 0);
                }
                &:hover {
                    .card {
                        background-color: rgba(220, 226, 243, 0.5);
                    }
                }
                &.active {
                    .card {
                        border: 2px solid #00437a;
                    }
                }
            }
        }

        .slide-fade-enter-active, .slide-fade-leave-active {
            transition: all 1s;
        }
        .slide-fade-enter, .slide-fade-leave-to /* .list-leave-active below version 2.1.8 */ {
            opacity: 0;
            transform: translateX(80px);
        }
        .info {
            .info-icon i {
                color: $dark_grey;
                font-size: 16px;
            }
            .info-text {
                color: $dark_grey;
                font-size: 10px;
        }
    }
    .add-button {
        border: 2px dashed $secondary;
        color: $secondary;
        &:hover {
            background-color: $light_blue;
            border: 2px dashed $secondary;
            color: $secondary;
        }
    }
}
</style>

<style lang="scss">

     .v-snack__wrapper {
        min-width: auto;
     }

</style>
