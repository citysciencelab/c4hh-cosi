<script>
import {mapGetters, mapActions, mapMutations} from "vuex";
import getMappingJson from "../../utils/getMappingJson";
import getters from "../store/gettersTemplateManager";
import mutations from "../store/mutationsTemplateManager";
import actions from "../store/actionsTemplateManager";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import TemplateManagerImport from "./TemplateManagerImport.vue";
import axios from "axios";
import TemplateManagerCard from "./TemplateManagerCard.vue";
import {VChip} from "vuetify/components/VChip";
import {VChipGroup} from "vuetify/components/VChipGroup";
import layerCollection from "@core/layers/js/layerCollection";

export default {
    name: "TemplateManager",
    components: {
        ToolInfo,
        TemplateManagerImport,
        TemplateManagerCard,
        VChip,
        VChipGroup
    },
    data () {
        return {
            activeTemplateName: false,
            filters: [],
            isTemplateActive: false,
            saveTemplate: [],
            selectedTemplateName: false,
            showImportSection: true,
            templates: []
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/TemplateManager", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", {
            districtLevels: "districtLevels",
            selectedDistrictLevel: "selectedDistrictLevel",
            selectedDistrictNames: "selectedDistrictNames",
            isDistrictSelectorActive: "active"
        }),
        ...mapGetters("Maps", ["getVisibleLayerList"]),
        ...mapGetters(["visibleSubjectDataLayerConfigs", "allLayerConfigs"]),

        /**
         * Checks whether at least one template is available.
         * @returns {Boolean} True if it is.
         */
        hasTemplates () {
            return this.templates.length > 0;
        },

        /**
         * Gets the current selected template.
         * @returns {Object} The selected template.
         */
        selectedTemplate () {
            return this.templates.find(template => template.meta.title === this.selectedTemplateName);
        },

        /**
         * Gets the index of the selected template.
         * @returns {Number} The index.
         */
        selectedTemplateIndex () {
            return this.templates.findIndex(template => template.meta.title === this.selectedTemplateName);
        },

        /**
         * Gets the current selected categories in template.
         * @returns {String[]} The selected categories.
         */
        selectedCategoriesInTemplate () {
            return this.saveTemplate.find(template => template.name === this.selectedTemplateName).statsCategories;
        },

        /**
         * Gets the selected layer ids in template.
         * @returns {String[]} The layer ids.
         */
        selectedLayerIdsInTemplate () {
            const foundTemplate = this.saveTemplate.find(template => template.name === this.selectedTemplateName);

            if (!Array.isArray(foundTemplate?.activeLayer)) {
                return [];
            }
            return foundTemplate.activeLayer.map(layer => layer.id);
        },

        /**
         * Gets the current active template.
         * @returns {Object} The activated template.
         */
        activeTemplateIndex () {
            return this.templates.findIndex(template => template.meta.title === this.activeTemplateName);
        },
        /**
         * Gets the index of the active template.
         * @returns {Number} The index.
         */
        activeTemplate () {
            return this.templates.find(template => template.meta.title === this.activeTemplateName);
        },
        /**
         * Gets the titles of all templates.
         * @returns {String[]} The titles.
         */
        templateTitles () {
            return this.templates.map(template => template.meta.title);
        },
        /**
         * Select and deselect the active layers in the selected templates.
         * @returns {Object} The active layers.
         */
        selectedActiveLayer: {
            get () {
                return this.getAllSelectedDataFromTemplate("activeLayer");

            },
            set (val) {
                const filterArray = Object.keys(this.filters[this.selectedTemplateIndex].activeLayerList);

                if (Array.isArray(filterArray) && filterArray.length > 0) {
                    filterArray.forEach(layer => {
                        if (Object.values(val).some(item => item.id.includes(layer))) {
                            this.filters[this.selectedTemplateIndex].activeLayerList[layer] = true;
                        }
                        else {
                            this.filters[this.selectedTemplateIndex].activeLayerList[layer] = false;
                        }
                    });

                    this.setSelectedData(val, "activeLayer");
                }
            }
        },
        /**
         * Select and deselect the districts in the selected templates.
         * @returns {Object} The selected districts.
         */
        selectedDistricts: {
            get () {
                return this.getAllSelectedDataFromTemplate("districts");
            },
            set (val) {
                const filterArray = Object.keys(this.filters[this.selectedTemplateIndex].selectedDistrictNames);

                if (Array.isArray(filterArray) && filterArray.length > 0) {
                    filterArray.forEach(name => {
                        if (Object.values(val).some(item => item.includes(name))) {
                            this.filters[this.selectedTemplateIndex].selectedDistrictNames[name] = true;
                        }
                        else {
                            this.filters[this.selectedTemplateIndex].selectedDistrictNames[name] = false;
                        }
                    });

                    this.setSelectedData(val, "districts");
                }

            }
        },
        /**
         * Select and deselect the statistical categories in the selected templates.
         * @returns {Object} The statistical categories.
         */
        selectedStatsCategories: {
            get () {
                return this.getAllSelectedDataFromTemplate("statsCategories");
            },
            set (val) {
                const filterArray = Object.keys(this.filters[this.selectedTemplateIndex].statsCategories);

                if (Array.isArray(filterArray) && filterArray.length > 0) {
                    filterArray.forEach(category => {
                        if (Object.values(val).some(item => item.includes(category))) {
                            this.filters[this.selectedTemplateIndex].statsCategories[category] = true;
                        }
                        else {
                            this.filters[this.selectedTemplateIndex].statsCategories[category] = false;
                        }
                    });
                    this.setSelectedData(val, "statsCategories");
                }
            }
        },
        /**
         * Select and deselect the calculations in the selected templates.
         * @returns {Object} The calculations.
         */
        selectedCalculations: {
            get () {
                return this.getAllSelectedDataFromTemplate("calculations");
            },
            set (val) {
                const layerIdArray = Object.keys(this.filters[this.selectedTemplateIndex].calculations);

                if (Array.isArray(layerIdArray) && layerIdArray.length > 0) {
                    layerIdArray.forEach(calc => {
                        if (Object.values(val).some(item => item.id.includes(calc))) {
                            this.filters[this.selectedTemplateIndex].calculations[calc] = true;
                        }
                        else {
                            this.filters[this.selectedTemplateIndex].calculations[calc] = false;
                        }
                    });
                    this.setSelectedData(val, "calculations");
                }
            }
        }
    },
    watch: {
        templates: "createFilterObjects",

        /**
         * Listens to the district selector.
         * If the district selector is deactivated, no districts are selected and there is an active template, this will be deselected.
         * @param {Boolean} value - True if district selector is activated.
         * @returns {void}
         */
        isDistrictSelectorActive (value) {
            if (!value && !this.selectedDistrictNames.length && this.activeTemplate) {
                this.activeCard(this.activeTemplateName, false);
            }
        }
    },
    async created () {
        this.setMapping(await getMappingJson());

        this.setDefaultActiveLayerIds(this.getVisibleLayers().map(x => x?.getLayer().getProperties()?.id));
    },
    updated () {
        this.showTemplateImport(true);
    },
    mounted () {
        this.loadTemplates();
    },
    methods: {
        ...mapMutations("Modules/TemplateManager", Object.keys(mutations)),
        ...mapActions("Modules/TemplateManager", Object.keys(actions)),
        ...mapMutations("Modules/DistrictSelector", ["setMapping"]),
        ...mapActions("Modules/SaveSession", ["loadSessionData"]),
        ...mapActions(["replaceByIdInLayerConfig"]),

        /**
         * Returns all visible vector layers from the layer collection that are of supported types.
         * Supported types include "WFS", "OAF", and "GeoJSON".
         * @returns {Array} An array of visible vector layer objects.
         */
        getVisibleLayers () {
            return layerCollection.getLayers().filter(layer => {
                return layer?.attributes.visibility === true;
            });
        },

        /**
         * Load templates from paths defined in config.json
         * @async
         * @returns {void}
         */
        async loadTemplates () {
            let path, res;
            const templates = [];

            for (const filename of this.templateFiles) {
                path = `${this.templatePath}/${filename}.json`;

                try {
                    res = await axios(path);
                    res = await res.data;
                    templates.push(res);
                }
                catch (e) {
                    console.warn(`Template at ${path} could not be loaded. Please check that it is a valid JSON file.`);
                }
            }

            this.templates = templates;
            this.selectedTemplateName = this.templates[0].meta.title;
            this.templates.forEach(temp => {
                this.templateData(temp);
            });
        },

        createFilterObjects () {
            this.filters = this.templates.map(template => ({
                name: template.meta.title,
                activeLayerList: Object.fromEntries(this.getActiveLayerList(template).map(el => [el.id, true])),
                selectedDistrictNames: Object.fromEntries(this.getSelectedDistricts(template).map(el => [el, true])),
                statsCategories: Object.fromEntries(this.getStatsCategories(template).map(el => [el, true])),
                calculations: Object.fromEntries(this.getCalculations(template).map(el => [el.id, true]))
            }));
        },

        templateData (template) {
            this.saveTemplate.push({name: template.meta.title,
                activeLayer: this.getActiveLayerList(template),
                districts: this.getSelectedDistricts(template),
                statsCategories: this.getStatsCategories(template),
                calculations: this.getCalculations(template)});
        },

        applyFilters (template, filter) {
            const
                _template = JSON.parse(JSON.stringify(template)),
                activeLayerList = Object.keys(filter.activeLayerList).filter(key => filter.activeLayerList[key]),
                selectedDistrictNames = Object.keys(filter.selectedDistrictNames).filter(key => filter.selectedDistrictNames[key]),
                statsCategories = Object.keys(filter.statsCategories).filter(key => filter.statsCategories[key]),
                calculations = this.getCalculations(template).filter(calc => filter.calculations[calc.id]);

            if (_template.state.Maps?.layerIds) {
                _template.state.Maps.layerIds = activeLayerList;
            }
            if (_template.state.Tools.DistrictSelector?.selectedDistrictNames) {
                _template.state.Tools.DistrictSelector.selectedDistrictNames = selectedDistrictNames;
            }
            if (_template.state.Tools.Dashboard?.statsFeatureFilter) {
                _template.state.Tools.Dashboard.statsFeatureFilter = statsCategories;
            }
            if (_template.state.Tools.Dashboard?.calculations) {
                _template.state.Tools.Dashboard.calculations = calculations;
            }

            return _template;
        },

        async loadFromTemplate (template, index, active) {
            template.meta.isActive = active;

            const _template = this.applyFilters(template, this.filters[index]),
                startingTool = template?.state?.Tools?.toolToOpen,
                time = new Date().getTime();

            if (this.useTemplatesForMapping) {
                template.meta.time = time;

                this.createMappingByTemplates(this.templates, await getMappingJson());
            }

            this.loadSessionData({template: _template, reset: !active});
            this.openTool(startingTool, active);
            this.loadLayer(_template?.state?.Maps?.layerIds, active, this.templates);
        },

        /**
         * Loading the layers from id
         * @param {String[]} layerIds The layer Id list
         * @param {Boolean} active - Flag if it is activated.
         * @param {Object[]} templates - The templates.
         * @returns {void}
         */
        loadLayer (layerIds, active, templates) {
            const activeLayersId = this.getActiveLayerIds(templates);

            if (Array.isArray(layerIds) && layerIds.length) {
                layerIds.forEach(layerId => {
                    let layer = layerCollection.getLayerById(layerId);
                    const visiblity = !this.defaultActiveLayerIds.includes(layerId) && !activeLayersId.includes(layerId) ? active : true;

                    if (layer) {
                        layer.layer.setVisible(visiblity);
                    }
                    else {
                        layer = this.allLayerConfigs.find(lay => lay.id === layerId);
                        if (layer) {
                            this.replaceByIdInLayerConfig({
                                layerConfigs: [{
                                    id: layer.id,
                                    layer: {
                                        id: layer.id,
                                        visibility: visiblity
                                    }
                                }]
                            });
                        }
                    }
                });
            }
        },

        /**
         * Opening a tool after loading the template
         * @param {String} startingTool - the starting tool to open after loading the template
         * @param {Boolean} active - Flag if it is activated.
         * @returns {void}
         */
        openTool (startingTool, active) {
            if (!active) {
                return;
            }

            if (typeof startingTool === "string") {
                this.$store.dispatch("Tools/setToolActive", {id: startingTool, active: true});
            }
            else if (typeof this.toolToOpen === "string") {
                this.$store.dispatch("Tools/setToolActive", {id: this.toolToOpen, active: true});
            }
        },

        /**
         * Returns active layerList
         * @param {Object} template - The template.
         * @returns {Array} array of layer
         */
        getActiveLayerList (template) {
            if (typeof template === "undefined") {
                return [];
            }

            if (Array.isArray(template?.state?.Maps?.layerIds) && template.state.Maps.layerIds.length === 0) {
                return [];
            }
            // const layers = getItemsByAttributes({type: "layer"});
            const layers = this.allLayerConfigs;

            if (!Array.isArray(layers)) {
                return [];
            }

            return layers.filter(layer => template.state.Maps.layerIds.includes(layer.id));
        },

        getActiveTool (template) {
            const id = Object.entries(template.state.Tools).find(tool => tool[1].active)?.[0];

            return this.$store.getters[`Tools/${id}/name`];
        },

        getActiveDistrictLevel (template) {
            const layerId = template?.state?.Tools?.DistrictSelector?.selectedDistrictLevelId;

            return this.districtLevels?.find(districtLevel => districtLevel.layerId === layerId)?.label;
        },

        getSelectedDistricts (template) {
            return template?.state?.Tools?.DistrictSelector?.selectedDistrictNames || [];
        },

        getStatsCategories (template) {
            return template?.state?.Tools?.Dashboard?.statsFeatureFilter || [];
        },

        getInitTool (template) {
            return template?.state?.Tools?.toolToOpen;
        },

        getCalculations (template) {
            return template?.state?.Tools?.Dashboard?.calculations || [];
        },
        /**
         * Returns the selected data from selected templates.
         * @param {String} type - The type of data.
         * @returns {Object} The selected data or empty object.
         */
        getAllSelectedDataFromTemplate (type) {
            if (typeof type !== "string") {
                return {};
            }
            let result = [];

            if (Array.isArray(this.templateContents)) {
                this.templateContents.forEach(template => {
                    if (template.name === this.selectedTemplateName) {
                        result = template[type];
                    }
                });
                return result;
            }
            return this.saveTemplate[this.selectedTemplateIndex][type];
        },
        /**
         * Sets the selected data.
         * @param {String} selected - The selected data from the user.
         * @param {Function} type - The type of data.
         * @returns {void}
         */
        setSelectedData (selected, type) {
            if (!Array.isArray(this.saveTemplate) || !this.saveTemplate.length) {
                return;
            }

            this.saveTemplate.forEach(template => {
                if (template.name === this.selectedTemplateName) {
                    template[type] = selected;
                }
            });

            this.setTemplateContents(this.saveTemplate);
        },

        /**
         * Adds a template to the list of templates.
         * @param {Object} template - The template to add.
         * @returns {void}
         */
        addTemplate (template) {
            this.templates.push(template);
            this.selectedTemplateName = template.meta.title;
            this.templateData(template);
        },

        /**
         * Creates a new mapping based on the statistical data in the templates.
         * The name of the template is used as the name of the group.
         * @param {Object[]} templates - All available templates.
         * @param {Object[]} initMapping - The mapping array for statistical data.
         * @returns {void}
         */
        createMappingByTemplates (templates, initMapping) {
            if (!Array.isArray(initMapping) || initMapping.length === 0) {
                return;
            }

            const activeTemplates = templates.filter(template => template.meta.isActive),
                sortedTemplates = activeTemplates.sort((a, b) => b.meta.time - a.meta.time),
                newMapping = [];

            sortedTemplates.forEach(template => {
                const filterForTemplate = this.filters.find(filter => filter.name === template.meta.title),
                    _template = this.applyFilters(template, filterForTemplate),
                    statsFeatures = _template.state?.Tools?.Dashboard?.statsFeatureFilter,
                    orientationValues = _template.state?.Tools?.Dashboard?.orientationValues;

                if (statsFeatures) {
                    statsFeatures.forEach(statName => {
                        const mappingObject = initMapping.find(obj => obj.value === statName),
                            newMappingObject = {};

                        if (mappingObject) {
                            Object.assign(newMappingObject, mappingObject);
                            newMappingObject.value = statName;
                            newMappingObject.group = template.meta.title;
                            if (orientationValues && Array.isArray(orientationValues) && orientationValues.length > 0) {
                                newMappingObject.orientationValue = this.getOrientationValueByStatistic(orientationValues, statName);
                            }
                            newMapping.push(newMappingObject);
                        }
                    });
                }
                else {
                    initMapping.forEach(mapp => {
                        const newMappingObject = Object.assign({}, mapp);

                        newMappingObject.group = template.meta.title;
                        newMapping.push(newMappingObject);
                    });
                }
            });

            if (newMapping.length > 0) {
                this.setMapping(newMapping);
            }
        },

        /**
         * Gets the orientation value for a statistic.
         * @param {Object[]} orientationValues - The orientation values.
         * @param {String} stat - The statistic for which the value is looked for.
         * @returns {String} The value of the statistic or "-" if none is available.
         */
        getOrientationValueByStatistic (orientationValues, stat) {
            return orientationValues.find(orientation => orientation.statisticName === stat)?.value || "-";

        },

        /**
         * Show import section.
         * @param {Boolean} val - true if show import section.
         * @returns {void}
         */
        showTemplateImport (val) {
            this.showImportSection = val;
        },
        /**
         * Sets the current selected card.
         * @param {String} name - The selected template name.
         * @returns {void}
         */
        selectCard (name) {
            this.selectedTemplateName = name;

            this.isTemplateActive = this.activeTemplates.includes(name);
        },
        /**
         * Sets the current activated template and loads it.
         * @param {String} name - The activated template name.
         * @param {Boolean} active - Flag if it is activated.
         * @returns {void}
         */
        async activeCard (name, active) {
            this.activeTemplateName = name;
            this.isTemplateActive = active;

            if (!active) {
                this.openExportWindow(true);
            }

            this.loadFromTemplate(this.activeTemplate, this.activeTemplateIndex, active);

            if (active) {
                this.setActiveTemplates([...this.activeTemplates, name]);
            }
            else {
                this.setActiveTemplates(this.activeTemplates.filter(template => template !== name));
            }

            if (!active && this.currentActiveTemplate === "") {
                this.activeTemplateName = "";
                this.setCurrentActiveTemplate("");
                if (!this.activeTemplates.length) {
                    this.setMapping(await getMappingJson());
                }
            }

            this.setReportName(this.activeTemplate?.meta?.title);
            this.setReportLayerIds(this.selectedLayerIdsInTemplate);
            this.setReportCategories(this.selectedCategoriesInTemplate);
        },

        /**
         * Sets the current activated template and loads it.
         * @param {Object} template - The current saved template.
         * @param {String[]} selectedDistrictNames - The selected district names.
         * @returns {Boolean} true if there are selected districts or default districts existed.
         */
        checkSelectedDistricts (template, selectedDistrictNames) {
            if (Array.isArray(selectedDistrictNames) && selectedDistrictNames.length
                || (Array.isArray(template?.districts) && template.districts.length)) {
                return true;
            }

            return false;
        },

        /**
         * Sets the current activated template and loads it.
         * @param {Object[]} templates - All the loaded templates.
         * @returns {String[]} the active layer Ids.
         */
        getActiveLayerIds (templates) {
            if (!Array.isArray(templates) || !templates.length) {
                return [];
            }

            const activeTemplates = templates.filter(template => template.meta.isActive),
                activeLayerIds = [];

            activeTemplates.forEach(template => {
                if (Array.isArray(template.state?.Maps?.layerIds) && template.state?.Maps?.layerIds.length) {
                    activeLayerIds.push(...template.state.Maps.layerIds);
                }
            });

            return activeLayerIds;
        }
    }
};
</script>

<template lang="html">
    <div
        id="template-manager"
        class="container"
    >
        <ToolInfo
            :url="readmeUrl"
            :locale="currentLocale"
            :summary="$t('additional:modules.tools.cosi.templateManager.infoLoadFromTemplates')"
        />
        <div v-if="showImportSection">
            <TemplateManagerImport
                v-if="useImport"
                @addTemplate="addTemplate"
            />
            <div
                :id="`accordion-container-manage`"
                class="accordion accordion-bg accordion-flush"
            >
                <div class="accordion-item">
                    <div
                        :id="`flush-heading-manage`"
                        class="accordion-header ms-0"
                    >
                        <button
                            class="accordion-button ps-0, collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            :data-bs-target="`#flush-collapse-manage`"
                            aria-expanded="true"
                            :aria-controls="`#flush-collapse-manage`"
                        >
                            <i :class="`bi bi-clipboard-check mt-1 me-3`" />
                            {{ $t("additional:modules.tools.cosi.templateManager.label.manageTemplate") }}
                        </button>
                    </div>
                    <div
                        :id="`flush-collapse-manage`"
                        class="accordion-collapse collapse show"
                        :aria-labelledby="`flush-heading-manage`"
                        :data-bs-parent="`#accordion-container-manage`"
                    >
                        <div class="accordion-body pt-1">
                            <div
                                v-if="hasTemplates"
                                class="row row-cols-1 row-cols-md-2 pb-3 pt-1"
                            >
                                <TemplateManagerCard
                                    v-for="(templateCard, idx) in templates"
                                    :key="idx"
                                    class="col col-md-4 mt-0 p-1"
                                    :card-id="`${idx}`"
                                    :title="templateCard?.meta?.title"
                                    :created="templateCard?.meta?.created"
                                    :selected-template="selectedTemplate?.meta?.title === templateCard?.meta?.title"
                                    :active-template="activeTemplates.includes(templateCard?.meta?.title)"
                                    :is-enabled="checkSelectedDistricts(saveTemplate[idx], selectedDistrictNames)"
                                    @showTemplate="selectCard"
                                    @activateTemplate="activeCard"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <hr>
            <div class="button-bar mb-3">
                <button
                    class="btn btn-primary lh-1 fs-5"
                >
                    <i class="bi bi-file-text pe-2" />{{ $t("additional:modules.tools.cosi.templateManager.overview") }}
                </button>
            </div>
        </div>
        <div>
            <div
                v-if="selectedTemplate?.meta?.isActive"
                class="template-note pt-1 pb-3"
            >
                <i class="bi bi-lock-fill pe-1" />{{ $t('additional:modules.tools.cosi.templateManager.note') }}
            </div>
            <div class="mb-4">
                <h5
                    id="selected-template-title"
                    class="headline"
                >
                    {{ selectedTemplate?.meta?.title || $t('additional:modules.tools.cosi.templateManager.noInfo') }}
                </h5>
                <label for="selected-template-created">
                    {{ $t("additional:modules.tools.cosi.templateManager.label.created") }}
                </label>
                <p id="selected-template-created">
                    {{ selectedTemplate?.meta?.created || $t('additional:modules.tools.cosi.templateManager.noInfo') }}
                </p>
            </div>
            <div
                v-if="selectedTemplate?.meta?.info"
                class="mb-4"
            >
                <p
                    id="selected-template-description"
                    v-html="selectedTemplate?.meta?.info"
                />
            </div>
            <div
                id="accordionTemplateComponents"
                class="accordion accordion-flush"
            >
                <div
                    v-if="getActiveLayerList(selectedTemplate).length > 0"
                    class="accordion-item"
                >
                    <h2 class="accordion-header">
                        <button
                            class="accordion-button"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseLayerList"
                            aria-expanded="true"
                            aria-controls="collapseLayerList"
                        >
                            <i class="bi bi-grid mt-1 me-3" />
                            {{ $t("additional:modules.tools.cosi.templateManager.label.layers") }}
                        </button>
                    </h2>
                    <div
                        id="collapseLayerList"
                        class="accordion-collapse collapse show"
                        data-bs-parent="#accordionTemplateComponents"
                    >
                        <div class="accordion-body pt-0">
                            <div id="selected-template-layer">
                                <v-chip-group
                                    v-model="selectedActiveLayer"
                                    column
                                    multiple
                                >
                                    <v-chip
                                        v-for="(layerMap) in getActiveLayerList(selectedTemplate)"
                                        :key="layerMap.id"
                                        :value="layerMap"
                                        class="m-1"
                                        variant="outlined"
                                        filter
                                        :disabled="selectedTemplate?.meta?.isActive"
                                    >
                                        {{ layerMap.name }}
                                    </v-chip>
                                </v-chip-group>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    v-if="getActiveDistrictLevel(selectedTemplate)"
                    class="accordion-item"
                >
                    <h2 class="accordion-header">
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseDistrictLevel"
                            aria-expanded="false"
                            aria-controls="collapseDistrictLevel"
                        >
                            <i class="bi bi-circle-square mt-1 me-3" />
                            {{ $t("additional:modules.tools.cosi.templateManager.label.districtLevel") }}
                        </button>
                    </h2>
                    <div
                        id="collapseDistrictLevel"
                        class="accordion-collapse collapse"
                        data-bs-parent="#accordionTemplateComponents"
                    >
                        <div class="accordion-body pt-0">
                            <p id="selected-template-level">
                                {{ getActiveDistrictLevel(selectedTemplate) }}
                            </p>
                        </div>
                    </div>
                </div>
                <div
                    v-if="getSelectedDistricts(selectedTemplate).length > 0"
                    class="accordion-item"
                >
                    <h2 class="accordion-header">
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseSelectedDistricts"
                            aria-expanded="false"
                            aria-controls="collapseSelectedDistricts"
                        >
                            <i class="bi bi-geo-alt-fill mt-1 me-3" />
                            {{ $t("additional:modules.tools.cosi.templateManager.label.selectedDistricts") }}
                        </button>
                    </h2>
                    <div
                        id="collapseSelectedDistricts"
                        class="accordion-collapse collapse"
                        data-bs-parent="#accordionTemplateComponents"
                    >
                        <div class="accordion-body pt-0">
                            <div id="selected-template-districts">
                                <v-chip-group
                                    v-model="selectedDistricts"
                                    column
                                    multiple
                                >
                                    <v-chip
                                        v-for="(districtName, j) in getSelectedDistricts(selectedTemplate)"
                                        :key="j"
                                        :value="districtName"
                                        class="m-1"
                                        variant="outlined"
                                        filter
                                        :disabled="selectedTemplate?.meta?.isActive"
                                    >
                                        {{ districtName }}
                                    </v-chip>
                                </v-chip-group>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    v-if="getStatsCategories(selectedTemplate).length > 0"
                    class="accordion-item"
                >
                    <h2 class="accordion-header">
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseCategories"
                            aria-expanded="false"
                            aria-controls="collapseCategories"
                        >
                            <i class="bi bi-graph-up mt-1 me-3" />
                            {{ $t("additional:modules.tools.cosi.templateManager.label.categories") }}
                        </button>
                    </h2>
                    <div
                        id="collapseCategories"
                        class="accordion-collapse collapse"
                        data-bs-parent="#accordionTemplateComponents"
                    >
                        <div class="accordion-body pt-0">
                            <div id="selected-template-statistics">
                                <v-chip-group
                                    :key="selectedTemplateIndex"
                                    v-model="selectedStatsCategories"
                                    column
                                    multiple
                                >
                                    <v-chip
                                        v-for="(category, indexCat) in getStatsCategories(selectedTemplate)"
                                        :key="indexCat"
                                        :value="category"
                                        class="m-1"
                                        variant="outlined"
                                        filter
                                        :disabled="selectedTemplate?.meta?.isActive"
                                    >
                                        {{ category }}
                                    </v-chip>
                                </v-chip-group>
                            </div>
                        </div>
                    </div>
                    <div
                        v-if="getInitTool(selectedTemplate)"
                        class="accordion-item"
                    >
                        <h2 class="accordion-header">
                            <button
                                class="accordion-button collapsed"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapseTool"
                                aria-expanded="false"
                                aria-controls="collapseTool"
                            >
                                <i class="bi bi-tools mt-1 me-3" />
                                {{ $t("additional:modules.tools.cosi.templateManager.label.addTool") }}
                            </button>
                        </h2>
                        <div
                            id="collapseTool"
                            class="accordion-collapse collapse"
                            data-bs-parent="#accordionTemplateComponents"
                        >
                            <div class="accordion-body pt-0">
                                <p id="selected-template-tool">
                                    {{ getInitTool(selectedTemplate) }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div
                    v-if="getCalculations(selectedTemplate).length > 0"
                    class="accordion-item"
                >
                    <h2 class="accordion-header">
                        <button
                            class="accordion-button collapsed"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#collapseCalculations"
                            aria-expanded="false"
                            aria-controls="collapseCalculations"
                        >
                            <i class="bi bi-plus-slash-minus mt-1 me-3" />
                            {{ $t("additional:modules.tools.cosi.templateManager.label.calculations") }}
                        </button>
                    </h2>
                    <div
                        id="collapseCalculations"
                        class="accordion-collapse collapse"
                        data-bs-parent="#accordionTemplateComponents"
                    >
                        <div class="accordion-body pt-0">
                            <div id="selected-template-calculations">
                                <v-chip-group
                                    v-model="selectedCalculations"
                                    column
                                    multiple
                                >
                                    <v-chip
                                        v-for="(calculation, j) in getCalculations(selectedTemplate)"
                                        :key="selectedTemplate?.meta?.title + 'calculation' + j"
                                        :value="calculation"
                                        class="m-1"
                                        variant="outlined"
                                        filter
                                        :disabled="selectedTemplate?.meta?.isActive"
                                    >
                                        {{ calculation.id }}
                                    </v-chip>
                                </v-chip-group>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    #template-manager {
        font-family: $font_family_default;

        label {
            color: $dark_grey;
            font-family: $font_family_accent;
        }

        .btn-outline {
            border-color: $light_blue;
            color: $light_blue;
            &.float-right {
                float: right;
            }
        }
       .btn-outline:hover {
            cursor: pointer;
            background-color: $light_blue;
            color: $white;
       }
       .btn:disabled {
            background-color: $light_grey_inactive_contrast;
            color: $white;
            border-color: $light_grey_inactive_contrast;
       }
       .headline {
            color: $dark_blue;
            font-family: $font_family_accent;
       }
       .accordion {
        --bs-border-color: $white;
        --bs-accordion-active-bg: $white;
        --bs-accordion-btn-focus-box-shadow: none;
        .accordion-button {
            font-size: $font_size_icon_lg;
        }
        #selected-template-title {
            color: $light_blue;
            font-family: $font_family_accent;
        }
        .template-note {
            font-size: 11px;
            color: $dark_grey;
        }
    }
}
</style>

<style lang="scss">
    .v-chip.v-size--default {
        font-size: 12px;
        height: 25px;
    }
    .v-chip .v-icon {
        font-size: 18px;
    }
    .v-chip--active {
        background-color: #DCE2F3;
    }
    .v-chip--disabled {
        opacity: 0.8;
    }
</style>
