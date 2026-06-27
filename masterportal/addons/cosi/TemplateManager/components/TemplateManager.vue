<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getMappingJson from "../../utils/getMappingJson";
import getters from "../store/gettersTemplateManager";
import mutations from "../store/mutationsTemplateManager";
import actions from "../store/actionsTemplateManager";
import ToolInfo from "../../shared/modules/toolInfo/components/ToolInfo.vue";
import TemplateManagerImport from "./TemplateManagerImport.vue";
import axios from "axios";
import TagGroup from "../../shared/modules/tags/components/TagGroup.vue";
import TemplateManagerCard from "./TemplateManagerCard.vue";
import layerCollection from "@core/layers/js/layerCollection";
import store from "@appstore/index.js";

export default {
    name: "TemplateManager",
    components: {
        AccordionItem,
        TagGroup,
        ToolInfo,
        TemplateManagerImport,
        TemplateManagerCard
    },
    data () {
        return {
            isTemplateActive: false,
            showImportSection: true
        };
    },
    computed: {
        ...mapGetters(["configuredModules", "allLayerConfigs"]),
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/TemplateManager", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", {
            districtLevels: "districtLevels",
            selectedDistrictLevel: "selectedDistrictLevel",
            selectedDistrictNames: "selectedDistrictNames",
            isDistrictSelectorActive: "active"
        }),
        ...mapGetters("Maps", ["getVisibleLayerList"]),

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
        },
        /**
         * Gets the active layer items.
         * @returns {Object[]} The active layers.
         */
        activeLayerListItems () {
            const activeLayerTags = [];

            this.getActiveLayerList(this.selectedTemplate)?.forEach(layer => {
                activeLayerTags.push({
                    label: layer.name,
                    value: layer.id,
                    selected: this.selectedActiveLayer.some(v => layer.name === v.name)
                });
            });

            return activeLayerTags;
        },
        /**
         * Gets the selected statistical categories.
         * @returns {Object[]} The categories.
         */
        statsCategoriesItems () {
            return this.getStatsCategories(this.selectedTemplate)?.map(name => ({
                label: name,
                selected: this.selectedStatsCategories.includes(name)
            }));
        },
        /**
         * Gets the selected calculations.
         * @returns {Object[]} The active layers.
         */
        calculationsItems () {
            return this.getCalculations(this.selectedTemplate)?.map(calc => ({
                label: calc.id,
                selected: this.selectedCalculations.some(v => calc.id === v.id)
            }));
        },
        /**
         * Gets the selected districts.
         * @returns {Object[]} The districts.
         */
        districtTagItems () {
            return this.getSelectedDistricts(this.selectedTemplate)?.map(district => ({
                label: district,
                selected: this.selectedDistricts.includes(district)
            }));
        }
    },
    watch: {
        templates: {
            handler () {
                this.createFilterObjects();
            },
            deep: true,
            immediate: true
        },

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
        ...mapActions(["addOrReplaceLayer"]),
        ...mapActions("Modules/LayerTree", ["removeLayer"]),
        ...mapMutations("Modules/TemplateManager", Object.keys(mutations)),
        ...mapActions("Modules/TemplateManager", Object.keys(actions)),
        ...mapActions("Menu", ["changeCurrentComponent"]),
        ...mapMutations("Modules/Dashboard", ["setCalculations", "setStatsFeatureFilter"]),
        ...mapActions("Modules/DistrictSelector", ["setDistrictsByName"]),
        ...mapMutations("Modules/DistrictSelector", ["setMapping", "setSelectedDistrictLevelId"]),

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
            if (this.templates.length) {
                return;
            }

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

            this.templates.push(...templates);
            this.setSelectedTemplateName(this.templates[0].meta.title);
            this.templates.forEach(temp => {
                this.templateData(temp);
                if (!this.importedTemplateNames.includes(temp?.meta?.title)) {
                    this.importedTemplateNames.push(temp?.meta?.title);
                }
            });
        },

        createFilterObjects () {
            this.setFilters(this.templates.map(template => ({
                name: template.meta.title,
                activeLayerList: Object.fromEntries(this.getActiveLayerList(template).map(el => [el.id, true])),
                selectedDistrictNames: Object.fromEntries(this.getSelectedDistricts(template).map(el => [el, true])),
                statsCategories: Object.fromEntries(this.getStatsCategories(template).map(el => [el, true])),
                calculations: Object.fromEntries(this.getCalculations(template).map(el => [el.id, true]))
            })));
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


        /**
         * Loading all the data from template.
         * @param {Object} template - The template.
         * @param {Boolean} active - activated or inactivated of the template.
         * @returns {void}
         */
        async loadFromTemplate (template, active) {
            template.meta.isActive = active;

            const startingTool = template?.state?.Tools?.toolToOpen,
                time = new Date().getTime(),
                visibleLayerIds = this.saveTemplate[this.selectedTemplateIndex].activeLayer.map(layer => layer.id);

            if (this.useTemplatesForMapping) {
                template.meta.time = time;

                this.createMappingByTemplates(this.templates, await getMappingJson());
            }

            this.openTool(startingTool, active);
            this.loadLayer(visibleLayerIds, active, this.templates);
        },

        /**
         * Loading the layers from id and removing the existed other layers which are not in the black layer list.
         * @param {String[]} layerIds The layer Id list
         * @param {Boolean} active - Flag if it is activated.
         * @param {Object[]} templates - The templates.
         * @returns {void}
         */
        loadLayer (layerIds, active, templates) {
            const activeLayersId = this.getActiveLayerIds(templates);

            if (active) {
                this.getVisibleLayers().forEach(layer => {
                    if (!this.blackLayerlist.includes(layer?.attributes?.id)) {
                        this.removeLayer(layer?.attributes);
                    }
                });
            }

            if (Array.isArray(layerIds) && layerIds.length) {
                layerIds.forEach(layerId => {
                    const visiblity = !this.defaultActiveLayerIds.includes(layerId) && !activeLayersId.includes(layerId) ? active : true;

                    this.addOrReplaceLayer({layerId: layerId, visibility: visiblity});
                    if (!visiblity && layerCollection.getLayerById(layerId)) {
                        this.removeLayer(layerCollection.getLayerById(layerId)?.attributes);
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
                store.dispatch("Menu/changeCurrentComponent", {type: startingTool, side: "secondaryMenu", props: {name: startingTool}}, {root: true});
            }
            else if (typeof this.toolToOpen === "string") {
                store.dispatch("Menu/changeCurrentComponent", {type: this.toolToOpen, side: "secondaryMenu", props: {name: this.toolToOpen}}, {root: true});
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

        /**
         * Returns the beautified tool name from translation.
         * @param {Object} template - The template.
         * @returns {String} the beautified tool name.
         */
        getInitTool (template) {
            if (!template?.state?.Tools?.toolToOpen) {
                return undefined;
            }

            const tool = template?.state?.Tools?.toolToOpen,
                capModuleName = tool.charAt(0).toUpperCase() + tool.slice(1);

            return i18next.t(store.getters["Modules/" + capModuleName + "/name"]);
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
            this.setSelectedTemplateName(template.meta.title);
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
            this.setSelectedTemplateName(name);

            this.isTemplateActive = this.activeTemplates.includes(name);
        },
        /**
         * Sets the current activated template and loads it.
         * @param {String} name - The activated template name.
         * @param {Boolean} active - Flag if it is activated.
         * @returns {void}
         */
        async activeCard (name, active) {
            this.setActiveTemplateName(name);
            this.isTemplateActive = active;

            this.loadFromTemplate(this.activeTemplate, active);

            if (active) {
                this.setActiveTemplates([...this.activeTemplates, name]);
            }
            else {
                this.setActiveTemplates(this.activeTemplates.filter(template => template !== name));
            }

            if (!active && this.currentActiveTemplate === "") {
                this.setActiveTemplateName("");
                this.setCurrentActiveTemplate("");
                if (!this.activeTemplates.length) {
                    this.setMapping(await getMappingJson());
                }
            }

            if (active && this.selectedDistricts.length) {
                this.setSelectedDistrictLevelId(this.activeTemplate?.state?.Tools?.DistrictSelector?.selectedDistrictLevelId);
                this.$nextTick(async () => {
                    await this.$nextTick();
                    this.setDistrictsByName({
                        districtNames: this.selectedDistricts,
                        zoomToExtent: false
                    });
                });
            }

            if (active && this.selectedStatsCategories.length) {
                this.setStatsFeatureFilter(this.selectedStatsCategories);
            }

            if (active && this.selectedCalculations.length) {
                this.setCalculations(this.selectedCalculations);
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
        },
        /**
         * Updates the selected active layers.
         * @param {Object[]} layer The selected layers.
         * @returns {void}
         */
        updateActiveLayerList (layer) {
            if (!layer) {
                return;
            }

            const updatedList = this.getActiveLayerList(this.selectedTemplate).filter(l => layer.some(sel => sel.value === l.id));

            this.selectedActiveLayer = updatedList;
        },

        /**
         * Updates the selected statistical categories.
         * @param {Object[]} categories The selected statistical categeories.
         * @returns {void}
         */
        updateStatsCategories (categories) {
            if (!categories) {
                return;
            }
            const selectedLabels = categories.map(i => i.label);

            this.selectedStatsCategories = selectedLabels;

        },
        /**
         * Updates the selected calculations.
         * @param {Object[]} calc The selected calculations.
         * @returns {void}
         */
        updateCalculations (calc) {
            if (!calc) {
                return;
            }
            const selectedCalc = calc.map(i => i.label),
                updatedCalculations = this.getCalculations(this.selectedTemplate).filter(c => selectedCalc.includes(c.id));

            this.selectedCalculations = updatedCalculations;
        },
        /**
         * Updates the selected districts.
         * @param {Object[]} districts The selected calculations.
         * @returns {void}
         */
        updateDistricts (districts) {
            if (!districts) {
                return;
            }
            const selectedLabels = districts.map(i => i.label);

            this.selectedDistricts = selectedLabels;
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
            <AccordionItem
                id="TemplateMangerAccordion"
                :title="$t('additional:modules.tools.cosi.templateManager.label.manageTemplate')"
                icon="bi bi-clipboard-check"
                :is-open="true"
            >
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
            </AccordionItem>
            <hr>
        </div>
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
        <AccordionItem
            v-if="getActiveLayerList(selectedTemplate).length > 0"
            id="collapseLayerList"
            :title="$t('additional:modules.tools.cosi.templateManager.label.layers')"
            icon="bi bi-layers"
            :is-open="true"
        >
            <div id="selected-template-layer">
                <TagGroup
                    class="my-4"
                    :items="activeLayerListItems"
                    :multiple="true"
                    :disabled="selectedTemplate?.meta?.isActive"
                    @update:selected-items="updateActiveLayerList"
                />
            </div>
        </AccordionItem>
        <AccordionItem
            v-if="getActiveDistrictLevel(selectedTemplate)"
            id="collapseDistrictLevel"
            :title="$t('additional:modules.tools.cosi.templateManager.label.districtLevel')"
            icon="bi bi-circle-square"
            :is-open="false"
        >
            <p id="selected-template-level">
                {{ getActiveDistrictLevel(selectedTemplate) }}
            </p>
        </AccordionItem>
        <AccordionItem
            v-if="getSelectedDistricts(selectedTemplate).length > 0"
            id="collapseSelectedDistricts"
            :title="$t('additional:modules.tools.cosi.templateManager.label.selectedDistricts')"
            icon="bi bi-geo-alt-fill"
            :is-open="false"
        >
            <div id="selected-template-districts">
                <TagGroup
                    :items="districtTagItems"
                    :multiple="true"
                    :disabled="selectedTemplate?.meta?.isActive"
                    @update:selected-items="updateDistricts"
                />
            </div>
        </AccordionItem>
        <AccordionItem
            v-if="getStatsCategories(selectedTemplate).length > 0"
            id="collapseCategories"
            :title="$t('additional:modules.tools.cosi.templateManager.label.categories')"
            icon="bi bi-bar-chart"
            :is-open="false"
        >
            <div
                id="selected-template-statistics"
            >
                <TagGroup
                    :items="statsCategoriesItems"
                    :multiple="true"
                    :disabled="selectedTemplate?.meta?.isActive"
                    @update:selected-items="updateStatsCategories"
                />
            </div>
        </AccordionItem>
        <AccordionItem
            v-if="getInitTool(selectedTemplate)"
            id="collapseTool"
            :title="$t('additional:modules.tools.cosi.templateManager.label.addTool')"
            icon="bi bi-tools"
            :is-open="false"
        >
            <p id="selected-template-tool">
                {{ getInitTool(selectedTemplate) }}
            </p>
        </AccordionItem>
        <AccordionItem
            v-if="getCalculations(selectedTemplate).length > 0"
            id="collapseCalculations"
            :title="$t('additional:modules.tools.cosi.templateManager.label.calculations')"
            icon="bi bi-plus-slash-minus"
            :is-open="false"
        >
            <div id="selected-template-calculations">
                <TagGroup
                    :items="calculationsItems"
                    :multiple="true"
                    :disabled="selectedTemplate?.meta?.isActive"
                    @update:selected-items="updateCalculations"
                />
            </div>
        </AccordionItem>
    </div>
</template>

<style lang="scss" scoped>
    #template-manager {
        font-family: $font_family_default;

        label {
            color: $dark_grey;
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
       }
        .template-note {
            font-size: $font_size_sm;
            color: $dark_grey;
        }
    }
</style>

<style lang="scss">
</style>
