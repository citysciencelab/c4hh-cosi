<script>
import {mapGetters, mapActions} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import {TAB_SET_CURRENT} from "./shared/TabContainer.vue";
import {isWebLink} from "@shared/js/utils/urlHelper.js";

export default {
    name: "LandRegistryFileDetails",
    components: {
        IconButton
    },
    inject: {
        setCurrentTab: {from: TAB_SET_CURRENT, default: null}
    },
    computed: {
        ...mapGetters("Modules/LandRegistryFile", [
            "getSortedFeatures",
            "selectedDetailFeatureId",
            "oafSchema",
            "detailsFields"
        ]),
        /**
         * Returns the index of the currently selected feature in the sorted features array.
         * @returns {Number} - The index of the selected feature, or -1 if not found.
         */
        selectedFeatureIndex () {
            return this.getSortedFeatures.findIndex(
                feature => feature.id === this.selectedDetailFeatureId
            );
        },
        /**
         * Returns the previous feature in the sorted features array relative to the selected feature.
         * @returns {Object|null} - The previous feature object, or null if at the beginning of the array.
         */
        previousFeature () {
            if (this.selectedFeatureIndex <= 0) {
                return null;
            }

            return this.getSortedFeatures[this.selectedFeatureIndex - 1];
        },
        /**
         * Returns the next feature in the sorted features array relative to the selected feature.
         * @returns {Object|null} - The next feature object, or null if at the end of the array.
         */
        nextFeature () {
            if (this.selectedFeatureIndex < 0
                || this.selectedFeatureIndex >= this.getSortedFeatures.length - 1) {
                return null;
            }

            return this.getSortedFeatures[this.selectedFeatureIndex + 1];
        },
        /**
         * Returns an array of key-value pairs representing the details of the selected feature.
         * Each object in the array contains a key, value, and displayName for the property.
         * @returns {Array} - An array of objects with keys: key, value, displayName.
         */
        detailsData () {
            if (!this.selectedDetailFeatureId) {
                return [];
            }
            const oafProperties = this.oafSchema?.properties || {};
            const selectedFeature = this.getSortedFeatures.find(feature => feature.id === this.selectedDetailFeatureId);

            if (!selectedFeature) {
                return [];
            }

            return this.detailsFields.map(field => {
                return {
                    key: field,
                    value: selectedFeature.properties?.[field] || "",
                    displayName: oafProperties[field]?.title || field
                };
            });
        }
    },
    methods: {
        ...mapActions("Modules/LandRegistryFile", [
            "selectFeatureOnMap"
        ]),
        isWebLink,
        /**
         * Sets the selected feature to the previous feature in the sorted features array.
         * @returns {void}
         */
        setPreviousFeature () {
            if (!this.previousFeature) {
                return;
            }

            this.showFeature(this.previousFeature.id);
        },
        /**
         * Sets the selected feature to the next feature in the sorted features array.
         * @returns {void}
         */
        setNextFeature () {
            if (!this.nextFeature) {
                return;
            }

            this.showFeature(this.nextFeature.id);
        },
        /**
         * Selects the feature on the map, which makes it the detail feature.
         * @param {string|number} id - The feature ID.
         * @returns {void}
         */
        showFeature (id) {
            this.selectFeatureOnMap({featureId: id, zoomToFeature: true});
        }
    }
};
</script>

<template lang="html">
    <div
        id="LandRegistryFileDetails"
        class="InnerLayoutFrame"
    >
        <div
            v-if="detailsData.length === 0"
            class="ScrollableContent"
        >
            <p class="no-detail-message">
                {{ $t("additional:modules.landRegistryFile.tabs.tabDetails.noDetailsMessage") }}
            </p>
        </div>

        <div
            v-else
            class="InnerLayoutFrame"
        >
            <div
                class="pager-button-wrapper"
            >
                <div
                    v-if="previousFeature"
                    class="pager-left"
                >
                    <IconButton
                        id="previous-feature"
                        :aria="$t('additional:modules.landRegistryFile.tabs.tabDetails.buttonBack')"
                        :class-array="['pager-left', 'pager', 'btn-primary']"
                        icon="bi-chevron-left"
                        role="button"
                        :interaction="setPreviousFeature"
                    />
                </div>
                <p v-if="getSortedFeatures.length > 1">
                    {{ selectedFeatureIndex + 1 }}/{{ getSortedFeatures.length }}
                </p>
                <div
                    v-if="nextFeature"
                    class="pager-right"
                >
                    <IconButton
                        id="next-feature"
                        :aria="$t('additional:modules.landRegistryFile.tabs.tabDetails.buttonForward')"
                        :class-array="['pager', 'btn-primary', 'd-flex', 'flex-row-reverse']"
                        icon="bi-chevron-right"
                        role="button"
                        :interaction="setNextFeature"
                    />
                </div>
            </div>

            <div class="ScrollableContent">
                <table>
                    <tr
                        v-for="item in detailsData"
                        :key="item.key"
                    >
                        <td class="font-bold">
                            {{ item.displayName }}
                        </td>
                        <td>
                            <a
                                v-if="isWebLink(item.value)"
                                :href="item.value"
                                target="_blank"
                            >Link</a>
                            <span v-else>{{ item.value }}</span>
                        </td>
                    </tr>
                </table>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #LandRegistryFileDetails{
        height: 100%;

        p.no-detail-message {
            padding-top: 1.5rem;
            text-align: center;
        }

        div.pager-button-wrapper {
            position: relative;
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            padding: 1rem 0;

            p {
                position: absolute;
                left: 50%;
                margin: 0;
                transform: translateX(-50%);
            }

            .pager-right {
                margin-inline-start: auto;
            }
        }

        table {
            width: 100%;
            table-layout: fixed;

            tr {
                border-color: var(--bs-border-color);
                border-style: solid;
                border-width: 0.5px 0;

                &:first-child {
                    border-top-width: 0;
                }

                &:last-child {
                    border-bottom-width: 0;
                }

                td {
                    padding: 0.5rem;
                    border-color: inherit;
                    border-style: solid;
                    border-width: 0;

                    overflow-wrap: anywhere;
                    word-break: normal;
                    hyphens: auto;
                }
            }
        }
    }
</style>
