<script>
import getMappingJson from "../../utils/getMappingJson";
import getters from "../store/gettersTemplateAdmin";
import isObject from "@shared/js/utils/isObject.js";
import {mapGetters, mapMutations, mapState} from "vuex";
import mutations from "../store/mutationsTemplateAdmin";
import {sort} from "@shared/js/utils/sort.js";
import TemplateAdminForm from "./TemplateAdminForm.vue";
import store from "@appstore/index.js";

export default {
    name: "TemplateAdmin",
    components: {
        TemplateAdminForm
    },
    data () {
        return {
            dataOptions: [],
            statOptions: [],
            toolOptions: [],
            currentTab: "#add-template-tab"
        };
    },
    computed: {
        ...mapGetters("Modules/TemplateAdmin", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", ["selectedDistrictLevel", "selectedDistrictLevelId", "selectedDistrictsCollection", "selectedDistrictNames"]),
        ...mapGetters(["configuredModules", "allLayerConfigs"])
    },
    async created () {
        const mapping = await getMappingJson(),
            filteredPropertyNames = this.getFilteredPropertyNames(this.selectedDistrictLevel?.propertyNameList, this.ignorePropertyNames),
            toIgnoreTools = ["templateAdmin", "templateManager"],
            configuredModules = this.configuredModules.map(value => {
                return value.type;
            }).filter(toolNames => !toIgnoreTools.includes(toolNames));

        this.toolOptions = this.getToolList(configuredModules);
        this.statOptions = this.getMappedLabelByValue(filteredPropertyNames, mapping),
        this.dataOptions = this.getLayerNames(this.allLayerConfigs);
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
                const capModuleName =  val.charAt(0).toUpperCase() + val.slice(1);

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
         * Returns a list of layer names.
         * @param {Object} layers the Layers from the card.
         * @returns {Object[]} A list of objects with following format: {propertyName: x, label: y}
         */
        getLayerNames (layers) {
            let layerNames = [];

            if (!Array.isArray(layers)) {
                return [];
            }

            layers.forEach(layer => {
                if (typeof layer?.name !== "undefined" && layer.isNeverVisibleInTree !== true) {
                    layerNames.push({layerId: layer.id, label: layer.name});
                }
            });

            layerNames = sort("", layerNames, "label");

            return layerNames;
        }
    }
};
</script>

<template lang="html">
    <div class="container">
        <div
            class="decription mb-2"
        >
            {{ $t("additional:modules.cosi.templateAdmin.description") }}
        </div>
        <!-- Nav tabs -->
        <ul
            id="templateTabs"
            class="nav nav-tabs"
            role="tablist"
        >
            <li
                class="nav-item"
                role="presentation"
            >
                <button
                    id="add-template-tab"
                    :class="currentTab === '#add-template-tab' ? 'active' : ''"
                    class="nav-link fs-6"
                    data-bs-toggle="tab"
                    data-bs-target="#add-template"
                    type="button"
                    role="tab"
                    aria-controls="add-template"
                    aria-selected="true"
                    @click="currentTab = '#add-template-tab'"
                >
                    <i class="bi bi-plus-square pe-2" />
                    {{ $t("additional:modules.cosi.templateAdmin.button.addTemplate") }}
                </button>
            </li>
            <li
                class="nav-item"
                role="presentation"
            >
                <button
                    id="edit-template-tab"
                    :class="currentTab === '#edit-template-tab' ? 'active' : ''"
                    class="nav-link fs-6"
                    data-bs-toggle="tab"
                    data-bs-target="#edit-template"
                    type="button"
                    role="tab"
                    aria-controls="edit-template"
                    aria-selected="false"
                    @click="currentTab = '#edit-template-tab'"
                >
                    <i class="bi bi-pencil-square pe-2" />
                    {{ $t("additional:modules.cosi.templateAdmin.button.editTemplate") }}
                </button>
            </li>
        </ul>
        <!-- Tab panes -->
        <div class="tab-content">
            <div
                id="add-template"
                :class="currentTab === '#add-template-tab' ? 'active' : ''"
                class="tab-pane"
                role="tabpanel"
                aria-labelledby="add-template-tab"
                tabindex="0"
            >
                <TemplateAdminForm
                    :geo-data="dataOptions"
                    :stat-data="statOptions"
                    :tool-data="toolOptions"
                />
            </div>
            <div
                id="edit-template"
                :class="currentTab === '#edit-template-tab' ? 'active' : ''"
                class="tab-pane"
                role="tabpanel"
                aria-labelledby="edit-template-tab"
                tabindex="0"
            >
                <TemplateAdminForm
                    :geo-data="dataOptions"
                    :stat-data="statOptions"
                    :tool-data="toolOptions"
                    :show-edit-template="true"
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
