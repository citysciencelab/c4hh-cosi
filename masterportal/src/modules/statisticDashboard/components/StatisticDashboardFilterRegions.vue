<script>
/**
 * @import {StatisticDashboardMapGetters} from "../types/helpers.js"
 */
import DropdownAutocomplete from "@shared/modules/dropdown/components/DropdownAutocomplete.vue";
import {mapGetters, mapMutations} from "vuex";
import {rawLayerList} from "@masterportal/masterportalapi/src/index.js";
import getOAFFeature from "@shared/js/api/oaf/getOAFFeature.js";
import {getUniqueValuesFromFetchedFeatures as getUniqueValuesFromOAF} from "../../filter/utils/fetchAllOafProperties.js";
import FetchDataHandler from "../js/fetchData.js";
import {
    equalTo as equalToFilter,
    or as orFilter
} from "ol/format/filter.js";
import getFeature from "@shared/js/api/wfs/getFeature.js";
import WFS from "ol/format/WFS.js";
import isObject from "@shared/js/utils/isObject.js";

export default {
    name: "StatisticDashboardFilterRegions",
    components: {
        DropdownAutocomplete
    },
    computed: {
        .../** @type {StatisticDashboardMapGetters} */ (mapGetters)("Modules/StatisticDashboard", {
            "selectedLevel": "selectedLevel",
            "regions": "flattenedRegions"
        }),
        ...mapGetters("Maps", ["projection"])
    },

    methods: {
        ...mapMutations("Modules/StatisticDashboard", ["setSelectedRegions"]),

        /**
         * Checks whether the region has child.
         * @param {Object} region - The region to be checked.
         * @returns {Boolean} True if it has child otherwise false.
         */
        hasRegionChild (region) {
            return Object.prototype.hasOwnProperty.call(region, "child");
        },

        /**
         * Checks whether all values of the region are selected.
         * @param {Object} region - The region to be checked.
         * @returns {Boolean} True if the region has values and all of them are selected, otherwise false.
         */
        isAllSelected (region) {
            if (!Array.isArray(region?.values) || !Array.isArray(region?.selectedValues) || !region.values.length) {
                return false;
            }

            return region.selectedValues.length === region.values.length;
        },

        /**
         * Sets the selected value(s) to the region and updates the values of its child under certain conditions.
         * @param {Object[]} value - The value to select.
         * @param {Object} region - The region.
         * @param {Boolean} schemeRequest - Flag to decide wether the scheme schould be requested or not. Only for OAF.
         * @returns {void}
         */
        async setSelectedValuesToRegion (value, region, schemeRequest = false) {
            region.selectedValues = value;

            if (!this.hasRegionChild(region)) {
                this.setSelectedRegions(region.selectedValues);
            }
            else if (!region.selectedValues.length) {
                region.child.values = [];
                this.setSelectedValuesToRegion([], region.child);
            }
            else {
                const childWasAllSelected = this.isAllSelected(region.child),
                      uniqueValues = await this.getValuesFromLayer(this.selectedLevel.layerId, region, schemeRequest || this.requestScheme(region, this.isAllSelected(region)));

                const childAttributeNames = Array.isArray(region.child.attrName) ? region.child.attrName : [region.child.attrName],
                      childValues = [...new Set(childAttributeNames.flatMap(attributeName => Object.keys(uniqueValues[attributeName] || {})))];

                region.child.values = childValues.map(key => {
                    return {title: key, value: key};
                });

                if (childWasAllSelected) {
                    this.setSelectedValuesToRegion(region.child.values.slice(), region.child);
                }
                else if (region.child.selectedValues.length) {
                    const udpatedSelectedValues = this.updatesRegionSelectedValues(region.child.selectedValues, region.child.values);

                    this.setSelectedValuesToRegion(udpatedSelectedValues, region.child);
                }

            }
        },

        /**
         * Gets values from the layer. This function decides wether to get the values by oaf or wfs based on the given layerId.
         * @param {String|String[]} layerId The layer id or layer ids.
         * @param {Object} region The region object.
         * @param {Boolean} schemeRequest Flag to decide if the data for the given region field should be requested via scheme oaf scheme.
         * @returns {Object} the values unified.
         */
        async getValuesFromLayer (layerId, region, schemeRequest = false) {
            const layerIds = Array.isArray(layerId) ? layerId : [layerId],
                  uniqueValues = {};

            region.child.loadingDataCounter++;
            try {
                for (const [index, currentLayerId] of layerIds.entries()) {
                    const {url, collection, typ, featureType, featureNS} = rawLayerList.getLayerWhere({id: currentLayerId}),
                          childAttributeName = Array.isArray(region.child.attrName) ? region.child.attrName[index] : region.child.attrName,
                          regionAttributeName = Array.isArray(region.attrName) ? region.attrName[index] : region.attrName;
                    let layerUniqueValues = {};

                    if (typ === "OAF") {
                        if (schemeRequest) {
                            layerUniqueValues = await getOAFFeature.getUniqueValuesByScheme(url, collection, [childAttributeName]);
                        }
                        else {
                            const filter = this.getFilterOAF(regionAttributeName, region.selectedValues),
                                  features = await getOAFFeature.getOAFFeatureGet(url, collection, {
                                      filter,
                                      filterCrs: this.selectedLevel.oafRequestCRS,
                                      crs: this.selectedLevel.oafRequestCRS,
                                      propertyNames: [childAttributeName],
                                      datetime: this.selectedLevel.geomRequestParams?.datetime,
                                      limit: 10000,
                                      skipGeometry: true
                                  }),
                                  fetchedProperties = features.map(feature => feature?.properties);

                            layerUniqueValues = getUniqueValuesFromOAF(fetchedProperties, [childAttributeName], true);
                        }
                    }
                    else {
                        const payload = {
                                  featureTypes: [featureType],
                                  featureNS: featureNS,
                                  srsName: this.projection.getCode(),
                                  propertyNames: [childAttributeName],
                                  filter: this.getFilterWFS(regionAttributeName, region.selectedValues)
                              },
                              features = await getFeature.getFeaturePOST(url, payload, error => {
                                  console.error(error);
                              }),
                              olFeatures = new WFS().readFeatures(features),
                              attributesWithType = await FetchDataHandler.getAttributesWithType(url, [childAttributeName], featureType);

                        layerUniqueValues = FetchDataHandler.getUniqueValuesFromFeatures(olFeatures, attributesWithType);
                    }

                    Object.entries(layerUniqueValues || {}).forEach(([attributeName, values]) => {
                        uniqueValues[attributeName] = {...uniqueValues[attributeName], ...values};
                    });
                }
            }
            finally {
                region.child.loadingDataCounter--;
            }

            return uniqueValues;
        },

        /**
         * Checks whether the selected values still exist in the value list.
         * If not, they are removed and an updated list is returned.
         * @param {Object[]} selectedValues - Current list of selected values.
         * @param {Object[]} values - The value list.
         * @returns {Object[]} Updated list of selected values.
         */
        updatesRegionSelectedValues (selectedValues, values) {
            const updatedSelectedValues = [];

            selectedValues.forEach(selectedValue => {
                const stillExist = values.findIndex(value => value.title === selectedValue.title);

                if (stillExist !== -1) {
                    updatedSelectedValues.push(selectedValue);
                }
            });

            return updatedSelectedValues;
        },

        /**
         * Updates the top level region selected values.
         * @param {Object} region - The top level region.
         * @param {Object} value - Value to add or remove.
         * @returns {void}
         */
        updatesTopLevelRegionSelectedValues (value, region) {
            const selectedValues = region.selectedValues,
                  indexOfValue = selectedValues.map(selectedValue => selectedValue.value).indexOf(value.value);

            if (indexOfValue !== -1) {
                selectedValues.splice(indexOfValue, 1);
            }
            else {
                selectedValues.push(value);
            }

            this.setSelectedValuesToRegion(selectedValues, region);
        },

        /**
         * Gets an oaf filter for given list and property.
         * If given list has more than one entry the function returns an or Filter.
         * @param {String} propertyName - The propertyName to create a filter for.
         * @param {String[]} list - The list to create a filter for.
         * @returns {String} The oaf filter.
         */
        getFilterOAF (propertyName, list) {
            let filter = "";

            list.forEach((value, idx) => {
                filter += `${propertyName}='${value.value}'`;
                if (idx < list.length - 1) {
                    filter += " OR ";
                }
            });
            return filter;
        },

        /**
         * Gets a wfs filter for given list and property.
         * If given list has more than one entry the function returns an
         * Or Filter otherwise an EqualTo Filter.
         * @param {String} propertyName - The propertyName to create a filter for.
         * @param {String[]} list - The list to create a filter for.
         * @returns {ol/format/filter} The filter.
         */
        getFilterWFS (propertyName, list) {
            const filterArray = list.map(entry => equalToFilter(propertyName, entry.value));

            return filterArray.length > 1 ? orFilter(...filterArray) : filterArray[0];
        },

        /**
         * Sets or resets the "active-button" class if the given value is selected.
         * @param {Object} value - The value that is checked.
         * @param {Object[]} selectedValues - The selected values.
         * @returns {String} The css class.
         */
        toggleButtonActive (value, selectedValues) {
            const indexOfValue = selectedValues.map(selectedValue => selectedValue.value).indexOf(value.value);

            if (indexOfValue !== -1) {
                return "active-button";
            }
            return "";
        },

        /**
         * Select all the regions.
         * @param {Object} region - The top level region.
         * @returns {void}
         */
        selectAll (region) {
            if (!Array.isArray(region?.values)) {
                return;
            }

            if (region?.selectedValues.length === region?.values.length) {
                this.setSelectedValuesToRegion([], region);
                return;
            }

            region.values.forEach((value) => {
                const selectedValues = region?.selectedValues,
                      indexOfValue = selectedValues.map(selectedValue => selectedValue?.value).indexOf(value?.value);

                if (indexOfValue === -1) {
                    selectedValues.push(value);
                }
            });
            this.setSelectedValuesToRegion(region.selectedValues, region, true);
        },
        /**
         * Returns wether the scheme should be requested or not.
         * @param {Object} region The region.
         * @param {Boolean} allSelected true if the given region has "all" in selected values.
         * @returns {Boolean} true if the scheme should be requested for given region, false if not.
         */
        requestScheme (region, allSelected) {
            if (!isObject(region) || allSelected === false) {
                return false;
            }

            const tmpRegions = [...this.regions].reverse(),
                  position = tmpRegions.findIndex(regionsRegion => regionsRegion.attrName === region.attrName);

            if (position === -1) {
                return true;
            }

            for (let i = position; i < tmpRegions.length; i++) {
                const nextRegion = tmpRegions[i];

                if (nextRegion.selectedValues.length !== nextRegion.values.length) {
                    return false;
                }
            }
            return true;
        }
    }
};
</script>

<template>
    <div>
        <div
            v-for="(region, index) in regions"
            :key="region.attrName"
            class="region-filter"
        >
            <div
                v-if="hasRegionChild(region) && index === 0"
                class="col-sm-12 mb-2"
            >
                <label
                    class="col-form-label-sm mb-1"
                    :for="'top-region-filter-' + index"
                >
                    {{ region.name }}
                </label>
                <br>
                <button
                    v-if="region?.values.length"
                    class="btn btn-sm btn-light rounded-pill lh-1 me-2 mb-2 p-2"
                    :class="region?.selectedValues.length === region?.values.length ? 'active-button' : ''"
                    @click="selectAll(region)"
                >
                    <i class="bi bi-toggles" />
                    {{ $t("common:modules.statisticDashboard.button.selectAllAreas") }}
                </button>
                <button
                    v-for="(value, idx) in region.values"
                    :id="'top-region-filter' + index"
                    :key="idx"
                    class="btn btn-sm btn-light lh-1 rounded-pill me-2 mb-2 p-2"
                    :class="toggleButtonActive(value, region.selectedValues)"
                    @click="updatesTopLevelRegionSelectedValues(value, region)"
                >
                    {{ value.title }}
                </button>
            </div>
            <div
                v-else
                class="col-sm-12 mb-2"
            >
                <DropdownAutocomplete
                    :id="'region-filter' + index"
                    :label="region.name ?? $t('common:modules.statisticDashboard.label.area')"
                    :items="region.values"
                    :placeholder="$t('common:modules.statisticDashboard.reference.placeholder')"
                    multiple
                    select-all
                    :select-all-title="$t('common:modules.statisticDashboard.button.allAreas')"
                    sortable
                    selected-first
                    :model-value="region.selectedValues"
                    :v-loading="region.loadingDataCounter > 0"
                    :disabled="region.loadingDataCounter > 0"
                    return-object
                    @update:model-value="setSelectedValuesToRegion($event, region)"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
.region-filter {
    .btn-light {
        background: $light_blue;
        &:hover {
            background: $dark_blue;
            color: $white;
        }
        &:active {
            background: $dark_blue;
        }
    }
    .active-button {
        background: $dark_blue;
        color: $white;
    }
}
</style>

