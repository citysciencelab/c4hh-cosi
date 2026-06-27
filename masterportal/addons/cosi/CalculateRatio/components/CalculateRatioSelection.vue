<script>
import CalculateRatioSelectionCard from "./CalculateRatioSelectionCard.vue";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import getAvailableYears from "../../utils/getAvailableYears";
import {mapGetters} from "vuex";

export default {
    name: "CalculateRatioSelection",
    components: {
        CalculateRatioSelectionCard,
        DropdownAutocomplete,
        FlatButton
    },
    props: {
        /**
         * List of district names
         */
        districtNameList: {
            type: Array,
            required: false,
            default: () => []
        },
        /**
         * List of visible vector layers
         */
        layerList: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    emits: ["set-params"],
    data () {
        return {
            cardOneDivisor: "1",
            cardOneFactor: "1",
            cardOneSelectedItemList: [],
            cardOneSelectedNumericalValueList: [],
            cardOneType: "statisticalData",
            cardTwoDivisor: "1",
            cardTwoFactor: "1",
            cardTwoSelectedItemList: [],
            cardTwoSelectedNumericalValueList: [],
            cardTwoType: "subjectData",
            selectedYear: null,
            yearItemList: []
        };
    },
    computed: {
        ...mapGetters("Modules/DistrictSelector", ["selectedStatFeatures"]),

        /**
         * List of items for card one based on its type.
         * @returns {Array} Array of layer names or district names.
         */
        cardOneItemList () {
            return this.cardOneType === "subjectData" ? this.layerNameList : this.districtNameList;
        },

        /**
         * List of numerical values for card one based on selected layer attributes.
         * @returns {Array} Array of numerical value names.
         */
        cardOneNumericalValueList () {
            const layerr = this.layerList.find(layer => this.cardOneSelectedItemList.includes(layer.getLayer().get("name"))),
                values = layerr?.attributes.numericalValues.map(value => value.name) || [];

            return [...values, "Anzahl"];
        },
        /**
         * List of items for card two based on its type.
         * @returns {Array} Array of layer names or district names.
         */
        cardTwoItemList () {
            return this.cardTwoType === "subjectData" ? this.layerNameList : this.districtNameList;
        },

        /**
         * List of numerical values for card two based on selected layer attributes.
         * @returns {Array} Array of numerical value names.
         */
        cardTwoNumericalValueList () {
            const layerr = this.layerList.find(layer => this.cardTwoSelectedItemList.includes(layer.getLayer().get("name"))),
                values = layerr?.attributes.numericalValues.map(value => value.name) || [];

            return [...values, "Anzahl"];
        },

        /**
         * Checks whether the calculation button should be disabled.
         * @returns {Boolean} True if the button should be disabled.
         */
        calculationDisabled () {
            return this.cardOneSelectedItemList.length === 0 || this.cardTwoSelectedItemList.length === 0 || !this.selectedYear;
        },

        /**
         * List of names of all visible vector layers
         * @returns {Array} Array of layer names
         */
        layerNameList () {
            return this.layerList.map(layer => layer.getLayer().get("name"));
        },

        /**
         * Checks if statistical data is selected in any of the cards.
         * @returns {Boolean} True if statistical data is selected in either card.
         */
        statisticalDataInCardTypes () {
            return this.cardOneType === "statisticalData" || this.cardTwoType === "statisticalData";
        }
    },
    created () {
        if (this.selectedStatFeatures[0]) {
            this.yearItemList = getAvailableYears([this.selectedStatFeatures[0]]);
        }
    },

    methods: {
        /*
        * Swaps the parameters of the two selection cards.
        * @returns {void}
        */
        changeCards () {
            const tempType = this.cardOneType,
                tempFactor = this.cardOneFactor,
                tempDivisor = this.cardOneDivisor,
                tempItemListSelected = this.cardOneSelectedItemList,
                tempNumericalValuesSelected = this.cardOneSelectedNumericalValueList;

            this.cardOneType = this.cardTwoType;
            this.cardTwoType = tempType;
            this.cardOneFactor = this.cardTwoFactor;
            this.cardTwoFactor = tempFactor;
            this.cardOneDivisor = this.cardTwoDivisor;
            this.cardTwoDivisor = tempDivisor;
            this.cardOneSelectedItemList = this.cardTwoSelectedItemList;
            this.cardTwoSelectedItemList = tempItemListSelected;
            this.cardOneSelectedNumericalValueList = this.cardTwoSelectedNumericalValueList;
            this.cardTwoSelectedNumericalValueList = tempNumericalValuesSelected;
        },

        /**
         * Emits the selected parameters for ratio calculation.
         * @returns {void}
         */
        emitParams () {
            const obj = {};

            obj.ASwitch = this.cardOneType === "subjectData";
            obj.BSwitch = this.cardTwoType === "subjectData";
            obj.selectedFieldA = this.cardOneSelectedItemList[0];
            obj.selectedFieldB = this.cardTwoSelectedItemList[0];
            obj.fActive_A = true;
            obj.fActive_B = true;
            obj.faktorf_A = parseFloat(this.cardOneFactor);
            obj.faktorf_B = parseFloat(this.cardTwoFactor);
            obj.perCalc_A = parseFloat(this.cardOneDivisor);
            obj.perCalc_B = parseFloat(this.cardTwoDivisor);
            obj.paramFieldA = {
                name: this.cardOneSelectedNumericalValueList[0] || "Anzahl"
            };
            obj.paramFieldB = {
                name: this.cardTwoSelectedNumericalValueList[0] || "Anzahl"
            };
            obj.facilityPropertyList_A = this.cardOneSelectedNumericalValueList;
            obj.facilityPropertyList_B = this.cardTwoSelectedNumericalValueList;
            obj.year = this.selectedYear;

            this.$emit("set-params", obj);
        },

        /**
         * Sets a data property.
         * @param {String} key - Key of the data property.
         * @param {*} value - Value to set.
         * @returns {void}
         */
        setData (key, value) {
            this[key] = value;
            if (key === "cardOneType") {
                this.cardOneSelectedItemList = [];
            }
            if (key === "cardTwoType") {
                this.cardTwoSelectedItemList = [];
            }
        }
    }

};
</script>

<template lang="html">
    <div class="d-flex justify-content-start">
        <h4 class="align-self-center me-3">
            1.
        </h4>
        <CalculateRatioSelectionCard
            :id="'firstCard'"
            class="flex-grow-1"
            :card-type="cardOneType"
            :divisor="cardOneDivisor"
            :factor="cardOneFactor"
            :item-list="cardOneItemList"
            :item-list-selected="cardOneSelectedItemList"
            :numerical-values="cardOneNumericalValueList"
            :numerical-values-selected="cardOneSelectedNumericalValueList"
            @set-divisor="setData('cardOneDivisor', $event)"
            @set-factor="setData('cardOneFactor', $event)"
            @set-numerical-values="setData('cardOneSelectedNumericalValueList', $event)"
            @set-selected-items="setData('cardOneSelectedItemList', $event)"
            @set-type-card="setData('cardOneType', $event)"
        />
    </div>
    <div class="d-flex justify-content-center ">
        <button
            type="button"
            class="btn btn-light my-2"
            @click="changeCards"
        >
            <i class="bi bi-arrow-down-up fs-4" />
        </button>
    </div>
    <div class="d-flex justify-content-start mb-5">
        <h4 class="align-self-center me-3">
            2.
        </h4>
        <CalculateRatioSelectionCard
            :id="'secondCard'"
            class="flex-grow-1"
            :card-type="cardTwoType"
            :divisor="cardTwoDivisor"
            :factor="cardTwoFactor"
            :item-list="cardTwoItemList"
            :item-list-selected="cardTwoSelectedItemList"
            :numerical-values="cardTwoNumericalValueList"
            :numerical-values-selected="cardTwoSelectedNumericalValueList"
            @set-divisor="setData('cardTwoDivisor', $event)"
            @set-factor="setData('cardTwoFactor', $event)"
            @set-numerical-values="setData('cardTwoSelectedNumericalValueList', $event)"
            @set-selected-items="setData('cardTwoSelectedItemList', $event)"
            @set-type-card="setData('cardTwoType', $event)"
        />
    </div>
    <Dropdown-Autocomplete
        v-if="statisticalDataInCardTypes"
        v-model="selectedYear"
        :items="yearItemList"
        :label="$t('additional:modules.tools.cosi.calculateRatio.yearsForStatisticalData')"
        class="mb-3"
    />
    <FlatButton
        class="mx-auto mb-3"
        icon="bi bi-plus-slash-minus"
        :disabled="calculationDisabled"
        :text="$t('additional:modules.tools.cosi.calculateRatio.calculate')"
        @click.native="emitParams()"
    />
</template>
