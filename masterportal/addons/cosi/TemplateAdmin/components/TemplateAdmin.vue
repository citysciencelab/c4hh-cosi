<script>
import getters from "../store/gettersTemplateAdmin";
import isObject from "@shared/js/utils/isObject.js";
import layerCollection from "@core/layers/js/layerCollection";
import {mapGetters, mapMutations} from "vuex";
import mutations from "../store/mutationsTemplateAdmin";
import {sort} from "@shared/js/utils/sort.js";
import store from "@appstore/index.js";
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import TabBar from "../../shared/modules/tabBar/components/TabBar.vue";
import TemplateAdminForm from "./TemplateAdminForm.vue";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import {treeBaselayersKey, treeSubjectsKey} from "@shared/js/utils/constants.js";

export default {
    name: "TemplateAdmin",
    components: {
        SwitchInput,
        TabBar,
        TemplateAdminForm,
        ToolInfo
    },
    data () {
        return {
            availableModes: [
                {
                    type: "create",
                    text: this.$t("additional:modules.cosi.templateAdmin.button.addTemplate"),
                    icon: "bi bi-plus-square"
                },
                {
                    type: "edit",
                    text: this.$t("additional:modules.cosi.templateAdmin.button.editTemplate"),
                    icon: "bi bi-pencil-square"
                }
            ]
        };
    },
    computed: {
        ...mapGetters("Modules/TemplateAdmin", Object.keys(getters)),
        ...mapGetters("Modules/Dashboard", ["statsFeatureFilter"]),
        ...mapGetters("Modules/DistrictSelector", ["initMapping", "selectedDistrictLevel", "selectedDistrictLevelId", "selectedDistrictsCollection", "selectedDistrictNames"]),
        ...mapGetters(["configuredModules", "allBaselayerConfigs", "allSubjectDataLayerConfigs", "allLayerConfigsStructured"])
    },
    watch: {
        /**
         * Loads the current status of layer and selected statistic data from dashboard.
         * @param {Boolean} val - true if it is enabled.
         * @returns {void}
         */
        enableExport (val) {
            if (!val) {
                if (this.initialStatus?.geoList === JSON.stringify(this.selectedGeoDataList) && this.initialStatus?.statList === JSON.stringify(this.selectedStatDataList)) {
                    this.setSelectedGeoDataList([]);
                    this.setSelectedStatDataList([]);
                }

                this.setInitialStatus(undefined);

                return;
            }

            const visibleLayers = layerCollection.getLayers().filter(layer => {
                    return layer?.attributes.visibility && !layer?.attributes?.isNeverVisibleInTree;
                }),
                categoryList = [];

            this.setSelectedGeoDataList([]);
            this.setSelectedStatDataList([]);

            visibleLayers.forEach(layer => {
                this.setSelectedGeoDataList([...this.selectedGeoDataList, layer?.attributes.name]);
            });

            if (this.statsFeatureFilter.length) {
                const filteredGroup = this.initMapping.filter(obj => {
                    return this.statsFeatureFilter.includes(obj.value);
                });

                categoryList.push(...filteredGroup.map(group => group?.value));
            }
            else {
                this.statOptions.forEach(stats => {
                    if (stats?.data.length) {
                        categoryList.push(...stats.data.map(data => data.label));
                    }
                });
            }

            this.setSelectedStatDataList(categoryList);
            this.setInitialStatus({
                geoList: JSON.stringify(this.selectedGeoDataList),
                statList: JSON.stringify(this.selectedStatDataList)
            });
        }
    },
    async created () {
        const filteredPropertyNames = this.getFilteredPropertyNames(this.selectedDistrictLevel?.propertyNameList, this.ignorePropertyNames),
            toIgnoreTools = ["templateAdmin", "templateManager"],
            configuredModules = this.configuredModules.map(value => {
                return value.type;
            }).filter(toolNames => !toIgnoreTools.includes(toolNames));

        this.setToolOptions(this.getToolList(configuredModules));
        this.setStatOptions(this.getMappedLabelByValue(filteredPropertyNames, this.initMapping));
        this.setDataOptions(this.getLayerConfigs());
    },
    unmounted () {
        this.setEnableExport(false);
        if (typeof this.initialStatus !== "undefined") {
            this.setSelectedGeoDataList([]);
            this.setSelectedStatDataList([]);
        }
    },
    methods: {
        ...mapMutations("Modules/TemplateAdmin", Object.keys(mutations)),

        /**
         * Gets all the tools from Masterportal filtered by the configured list of tools.
         * @param {String[]} configuredModules - list of strings where each string represent tool key
         * @returns {Object[]} the tool list with the key and the title as label
         */
        getToolList (configuredModules) {
            if (!Array.isArray(configuredModules)) {
                return [];
            }
            let toolList = [];

            configuredModules.forEach(val => {
                const capModuleName = val.charAt(0).toUpperCase() + val.slice(1);

                toolList.push({toolId: val, label: i18next.t(store.getters["Modules/" + capModuleName + "/name"])});
            });

            toolList = sort("", toolList, "label");
            return toolList;
        },

        /**
         * Gets the property names filtered by the given list of strings to ignore.
         * @param {Array<String[]>} propertyNamesOfEachLayer List of property name lists for each layer.
         * @param {String[]} propertyNamesToIgnore List of strings to ignore.
         * @returns {Array<String[]>} A list of strings for each layer.
         */
        getFilteredPropertyNames (propertyNamesOfEachLayer, propertyNamesToIgnore) {
            if (!Array.isArray(propertyNamesOfEachLayer) || !Array.isArray(propertyNamesToIgnore)) {
                return [];
            }
            const result = [];

            propertyNamesOfEachLayer.forEach(propertyNamesForLayer => {
                if (!Array.isArray(propertyNamesForLayer)) {
                    return;
                }
                const resultForLayer = propertyNamesForLayer.filter(
                    propertyName => !propertyNamesToIgnore.includes(propertyName)
                );

                result.push(resultForLayer);
            });
            return result;
        },

        /**
         * Gets a list of objects with mapped propertyNames and labels.
         * @param {Array<String[]>} propertyNamesOfEachLayer List of property name lists for each layer.
         * @param {Object[]} mappingList The list of objects to use for mapping.
         * @returns {Object[]} A list of objects with following format: {propertyName: x, label: y, valueType: z}
         */
        getMappedLabelByValue (propertyNamesOfEachLayer, mappingList) {
            if (!Array.isArray(propertyNamesOfEachLayer) || !Array.isArray(mappingList)) {
                return [];
            }
            const result = [];
            let resultData = [];

            propertyNamesOfEachLayer.forEach(propertiesForLayer => {
                if (!Array.isArray(propertiesForLayer)) {
                    return;
                }
                propertiesForLayer.forEach(property => {
                    const foundObject = mappingList.find(mappingObject => mappingObject?.category === property);

                    if (!isObject(foundObject) || !Object.prototype.hasOwnProperty.call(foundObject, "value")) {
                        resultData.push({group: foundObject?.group, propertyName: property, label: property, valueType: foundObject?.valueType || false});
                        return;
                    }
                    resultData.push({group: foundObject?.group, propertyName: property, label: foundObject.value, valueType: foundObject.valueType || false});
                });
            });

            resultData = sort("", resultData, "label");

            [...new Set(mappingList.map(ml => ml.group))].forEach(cat => {
                const data = resultData.filter(rd => rd.group === cat);

                if (data.length) {
                    result.push({category: cat, data: data});
                }
            });

            return result;
        },

        /**
         * Returns a list of layer names and groups.
         * @returns {Object[]} A list of objects with groups and layers.
         */
        getLayerConfigs () {
            const layerConfigs = [],
                backgroundLayerConfigs = this.allLayerConfigsStructured(treeBaselayersKey),
                subjectLayerConfigs = this.allLayerConfigsStructured(treeSubjectsKey);

            // Adds background layers
            layerConfigs.push({group: i18next.t("common:modules.layerSelection.backgrounds"), level: 1});
            layerConfigs.push(...this.getLayerNames(backgroundLayerConfigs));

            // Adds Subject layers
            subjectLayerConfigs.forEach(config => {
                if (config.type !== "folder") {
                    return;
                }

                layerConfigs.push({group: config.name, level: 1});

                config?.elements.forEach(element => {
                    if (element.type !== "folder") {
                        return;
                    }

                    layerConfigs.push({group: element.name, level: 2});
                    layerConfigs.push(...this.getLayerNames(this.findAllObjectsByKeyValueDeep(element.elements)));
                });
            });

            return layerConfigs;
        },

        /**
         * Returns a list of layers objects.
         * @param {Objects[]|Object} data the data to be checked if it is a layer or folder.
         * @param {Objects[]} results the found results in array.
         * @returns {Object[]} A list of found results in array.
         */
        findAllObjectsByKeyValueDeep (data, results = []) {
            if (Array.isArray(data)) {
                data.forEach(element => this.findAllObjectsByKeyValueDeep(element, results));
            }

            if (data.type === "folder") {
                this.findAllObjectsByKeyValueDeep(data.elements, results);
            }

            if (data.type === "layer") {
                results.push(data);
            }

            return results;
        },

        /**
         * Returns a list of layer names.
         * @param {Object} layers the Layers from the card.
         * @returns {Object[]} A list of objects with following format: {propertyName: x, label: y}
         */
        getLayerNames (layers) {
            const layerNames = [];

            if (!Array.isArray(layers)) {
                return [];
            }

            layers.forEach(layer => {
                if (typeof layer?.name !== "undefined" && layer.isNeverVisibleInTree !== true) {
                    layerNames.push({layerId: layer.id, label: layer.name});
                }
            });

            return layerNames;
        },

        /**
         * Toggles the status of the export button.
         * @returns {void}
         */
        toggleEnableExport () {
            this.setEnableExport(!this.enableExport);
        }
    }
};
</script>

<template lang="html">
    <div class="container">
        <ToolInfo
            :summary="$t('additional:modules.cosi.templateAdmin.description')"
        />
        <!-- Nav tabs -->
        <TabBar
            class="mb-4"
            :items="availableModes"
            :active-item="activeMode"
            @change="setActiveMode"
        />
        <!-- Tab panes -->
        <div>
            <SwitchInput
                v-if="activeMode.type === 'create'"
                id="enable-export"
                :aria="$t('additional:modules.cosi.templateAdmin.label.enableExport')"
                :checked="enableExport"
                :interaction="toggleEnableExport"
                :label="$t('additional:modules.cosi.templateAdmin.label.enableExport')"
                class="mb-3"
            />
            <div
                tabindex="0"
            >
                <TemplateAdminForm
                    :key="activeMode.type"
                    :geo-data="dataOptions"
                    :stat-data="statOptions"
                    :tool-data="toolOptions"
                    :show-edit-template="activeMode.type === 'edit'"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "/src/assets/css/mixins.scss";
@import "/src/assets/css/variables";

.nav-tabs .nav-link.active {
    color: $light_blue;
    font-family: "MasterPortalFont Bold";
    background-color: white;
}

.nav-tabs, .nav-link  {
    background-color: #F3F3F3;
    color: $secondary;
}

</style>
