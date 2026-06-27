<script>
import Card from "../../shared/modules/cards/components/Card.vue";
import dayjs from "dayjs";
import DropdownAutocomplete from "../../shared/modules/dropdown/components/DropdownAutocomplete.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import getters from "../store/gettersTemplateAdmin";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import isObject from "@shared/js/utils/isObject.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import TemplateAdminFormCard from "./TemplateAdminFormCard.vue";
import {uniqueId} from "@shared/js/utils/uniqueId.js";
import {VueDraggableNext} from "vue-draggable-next";

export default {
    name: "TemplateAdminForm",
    components: {
        Card,
        Draggable: VueDraggableNext,
        DropdownAutocomplete,
        FileUpload,
        FlatButton,
        InputText,
        TemplateAdminFormCard
    },
    props: {
        geoData: {
            type: Array,
            required: true
        },
        statData: {
            type: Array,
            required: true
        },
        toolData: {
            type: Array,
            required: false,
            default: () => []
        },
        showEditTemplate: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    data () {
        return {
            fileUploaded: false,
            templateName: "",
            templateDes: "",
            selectedGeoData: [],
            selectedStatData: [],
            selectedToolData: [],
            isNameValidating: false,
            isStatDataValidating: false,
            isValidated: false,
            limitReferenceValues: true,
            referenceValueList: [],
            importedReferenceValueList: [],
            selectedGeoDataLabel: [],
            selectedToolLabel: ""
        };
    },
    computed: {
        ...mapGetters("Modules/TemplateAdmin", Object.keys(getters)),

        /**
         * Returns true or false, depending on the number of statistics.
         * @returns {Boolean} True if the number of statistics are more than two.
         */
        countSelectedStatistics () {
            return this.selectedStatData.length > 2;
        },
        uploadedTemplates () {
            return this.importedTemplateNames;
        },
        toolDataList () {
            return this.toolData.map(data => data?.label);
        }
    },
    watch: {
        selectedStatData: {
            handler (val) {
                const label = val.map(v => v.label);

                this.referenceValueList = this.referenceValueList.filter(badge => label.includes(badge?.statisticName));

                if (this.enableExport && this.initialStatus?.statList !== JSON.stringify(label)) {
                    this.setEnableExport(false);
                    this.setSelectedStatDataList(label);
                }
            },
            deep: true
        },
        selectedTemplate (value) {
            if (this.showEditTemplate) {
                this.changeSelectedTemplate(value);
            }
        },
        selectedGeoDataLabel: {
            handler (val) {
                this.setSelectedGeoDataList(val);
                this.selectedGeoData = this.geoData.filter(data => val.includes(data?.label));
            },
            deep: true
        },
        selectedGeoDataList: {
            handler (val) {
                this.selectedGeoDataLabel = val;
                if (this.enableExport && this.initialStatus?.geoList !== JSON.stringify(val)) {
                    this.setEnableExport(false);
                }
            },
            deep: true
        },
        selectedStatDataList: {
            handler (val) {
                this.selectedStatData = this.getStatDataObj(val);
            },
            deep: true
        },
        selectedToolLabel (value) {
            this.selectedToolData = this.toolData.find(data => data?.label === value);
        }
    },
    mounted () {
        if (this.showEditTemplate && this.selectedTemplate !== undefined) {
            this.changeSelectedTemplate(this.selectedTemplate);
        }
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapMutations("Modules/TemplateAdmin", ["setEnableExport", "setImportedTemplateNames", "setIsInitialLoad", "setLoadedTemplates", "setSavedTemplateContents", "setSelectedTemplate", "setSelectedGeoDataList", "setSelectedStatDataList"]),

        /**
         * Adds or changes the key and value in object.
         * @param {Object} obj - the current object
         * @param {Object} newObj - the new object.
         * @returns {void}
         */
        addStatDataObj (obj, newObj) {
            obj.group = newObj.group;
            obj.propertyName = newObj.propertyName;
            obj.label = newObj.label;
            obj.valueType = newObj.valueType;
        },

        /**
         * Adds new empty statistic card.
         * @returns {void}
         */
        addStatisticCards () {
            this.selectedStatData.push(
                {
                    "group": "",
                    "propertyName": uniqueId("new_"),
                    "label": "",
                    "valueType": ""
                }
            );
        },

        /**
         * Changes the selected template.
         * @param {String} id - the index of the saved template.
         * @returns {void}
         */
        changeSelectedTemplate (id) {
            if (!Array.isArray(this.savedTemplateContents) ||
                typeof id !== "string" ||
                !isObject(this.savedTemplateContents[id])) {
                return;
            }

            this.loadingTemplate(this.savedTemplateContents[id]);
        },
        /**
         * Gets the statisdata object list.
         * @param {String[]} val The label list.
         * @returns {Object[]} the statisdata object list.
         */
        getStatDataObj (val) {
            const statDataObj = [];

            this.statData.forEach(stats => {
                if (stats?.data.filter(data => val.includes(data?.label)).length) {
                    statDataObj.push(...stats.data.filter(data => val.includes(data.label)));
                }
            });

            statDataObj.sort((a, b) => val.indexOf(a.label) - val.indexOf(b.label));

            return statDataObj;
        },
        /**
         * Removes the geo data by the given layerId.
         * @param {String} layerId The layerId.
         * @returns {void}
         */
        removeGeoData (layerId) {
            this.selectedGeoData = this.selectedGeoData.filter(badge => badge?.layerId !== layerId);
        },

        /**
         * Removes the statistic data by the given propertyName.
         * @param {String} name The property name.
         * @returns {void}
         */
        removeStatData (name) {
            this.selectedStatData = this.selectedStatData.filter(badge => badge?.propertyName !== name);
        },

        /**
         * Validating the form
         * @returns {void}
         */
        validateForm () {
            this.setIsNameValidating(true);
            this.setIsStatDataValidating(true);

            if (this.templateName !== "" && this.selectedStatData.length) {
                this.isValidated = true;
            }
            else {
                this.isValidated = false;
            }

            if (this.templateName !== "") {
                this.setIsNameValidating(false);
            }

            if (this.selectedStatData.some(data => data.label !== "")) {
                this.setIsStatDataValidating(false);
            }

            if (this.isValidated) {
                const exportedData = this.getExportedData(this.templateName, this.templateDes, this.selectedGeoData, this.selectedStatData, this.selectedToolData, this.referenceValueList);

                this.exportFile(this.templateName, exportedData);
            }
        },

        /**
         * Gets the exported data
         * @param {String} templateName The template name
         * @param {String} templateDes The template description.
         * @param {Object[]} geoData The geo data.
         * @param {Object[]} statData The statistical data.
         * @param {Object[]} toolData The tool data.
         * @param {Object[]} referenceValueList The reference value list.
         * @returns {Object} the exported data
         */
        getExportedData (templateName, templateDes, geoData, statData, toolData, referenceValueList) {
            const createdDate = dayjs(new Date()).format("DD.MM.YYYY, HH:mm:ss"),
                formatedDate = dayjs(new Date()).format("YYYY-MM-DD, HH:mm:ss").replace(", ", "T") + ".174Z",
                layerIds = geoData.map(data => data.layerId),
                toolId = toolData?.toolId,
                statsFeatureLable = statData.reduce((result, data) => {
                    if (data.label !== "") {
                        result.push(data.label);
                    }
                    return result;
                }, []);

            return {
                "meta": {
                    "title": templateName,
                    "info": templateDes,
                    "created": createdDate,
                    "date": formatedDate,
                    "icon": "mdi-filter"
                },
                "state": {
                    "Maps": {
                        "layerIds": layerIds
                    },
                    "Tools": {
                        "toolToOpen": toolId,
                        "Dashboard": {
                            "statsFeatureFilter": statsFeatureLable,
                            "orientationValues": referenceValueList
                        }
                    }
                }
            };
        },

        /**
         * Exports the exported data
         * @param {String} name The template name
         * @param {Object} data The exported data
         * @returns {void}
         */
        exportFile (name, data) {
            const filename = name + ".json",
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
         * Sets the isNameValidating
         * @param {Boolean} value true or false
         * @returns {void}
         */
        setIsNameValidating (value) {
            this.isNameValidating = value;
        },

        /**
         * Sets the isStatDataValidating
         * @param {Boolean} value true or false
         * @returns {void}
         */
        setIsStatDataValidating (value) {
            this.isStatDataValidating = value;
        },

        /**
         * Sets the reference value list
         * @param {object} value the reference value
         * @returns {void}
         */
        setReferenceValueList (value) {
            this.referenceValueList = this.referenceValueList.filter(item => {
                return item.statisticName !== value.statisticName;
            });

            if (value.value !== "") {
                this.referenceValueList.push(value);
            }

            this.importedReferenceValueList = this.referenceValueList;
        },

        /**
         * Importing the template from local storage.
         * @param {Event} evt - An input change event
         * @param {Boolean} drop - the flag to check it is from drop event.
         * @returns {void}
         */
        importTemplate (evt, drop = false) {
            if (!drop && (!Array.isArray(Object.keys(evt?.target?.files)) || !Object.keys(evt?.target?.files).length)) {
                return;
            }

            if (drop && (!Array.isArray(Object.keys(evt?.dataTransfer?.files)) || !Object.keys(evt?.dataTransfer?.files).length)) {
                return;
            }

            this.prepareTemplate(drop ? evt.dataTransfer.files : evt.target.files);
        },

        /**
         * Prepares the template.
         * @param {Object} files - The imported files.
         * @returns {void}
         */
        prepareTemplate (files) {
            if (!(files instanceof FileList) || Object.values(files).length === 0) {
                return;
            }

            Object.values(files).forEach(file => {
                this.handleFile(file);
            });
        },

        /**
         * Handles the given file and loads the template with its content.
         * @param {Object} file - The given file
         * @returns {void|undefined} returns undefined, if the given file is not correct
         */
        handleFile (file) {
            if (!(file instanceof File)) {
                return;
            }

            const fileName = file?.name ? file.name : "",
                fileType = fileName !== "" ? fileName.substring(fileName.length - 4, fileName.length) : "undefined",
                reader = new FileReader();

            if (fileName === "") {
                console.warn("The file is corrupt.");
                return;
            }
            if (fileType !== "json") {
                this.addSingleAlert({
                    content: `${this.$t("additional:modules.cosi.templateAdmin.errors.wrongFormat")}`,
                    category: "Warning",
                    displayClass: "warning"
                });
                return;
            }

            reader.readAsText(file);
            reader.onload = (res) => {
                const fileContent = this.parseResult(res);

                if (fileContent !== null) {
                    this.addTemplate(fileContent);
                }
            };
            reader.onerror = (err) => console.error(err);
        },

        /**
         * Parses the given object.
         * @param {Object} res - The given content of the file
         * @returns {String|null} - returns the file content as string or null
         */
        parseResult (res) {
            let fileContent = null;

            try {
                fileContent = JSON.parse(res?.target?.result);
            }
            catch (error) {
                console.warn("jsonParse failed: could not parse\"" + res?.target?.result + "\" to JSON: " + error);
            }

            return fileContent;
        },

        /**
         * Adds the name of the imported template and saves the content of the uploaded file.
         * @param {String} fileContent - The content of the uploaded file
         * @returns {void}
         */
        addTemplate (fileContent) {
            if (typeof this.getTemplateText(fileContent.meta?.title) !== "string" ||
                this.getTemplateText(fileContent.meta?.title).length === 0) {
                return;
            }

            if (!this.importedTemplateNames.includes(this.getTemplateText(fileContent.meta?.title))) {
                this.importedTemplateNames.push(this.getTemplateText(fileContent.meta?.title));
                this.savedTemplateContents[this.getTemplateText(fileContent.meta?.title)] = fileContent;
                this.loadingTemplate(fileContent);
                this.loadedTemplates.push({
                    data: [
                        {
                            "label": fileContent.meta?.title
                        },
                        {
                            "icon": "bi bi-sliders2",
                            "label": fileContent.meta?.created
                        }
                    ],
                    title: fileContent.meta?.title
                });
            }
            else {
                this.addSingleAlert({
                    content: `${this.$t("additional:modules.cosi.templateAdmin.errors.templateName")}` + fileContent?.meta?.title + `${this.$t("additional:modules.cosi.templateAdmin.errors.isLoaded")}`,
                    category: "Warning",
                    displayClass: "warning"
                });
            }
        },

        /**
         * Loading the template and assign the value to different field
         * @param {Object} content - the parsed json format content
         * @returns {void}
         */
        loadingTemplate (content) {
            if (!isObject(content)) {
                return;
            }

            this.setSelectedTemplate(this.getTemplateText(content.meta?.title));
            this.templateName = this.getTemplateText(content.meta?.title);
            this.templateDes = this.getTemplateText(content.meta?.info);
            this.selectedGeoData = this.getSelectedGeoData(content.state?.Maps?.layerIds);
            this.selectedGeoDataLabel = this.selectedGeoData.map(data => data?.label);
            this.selectedStatData = this.getSelectedStatData(content.state?.Tools?.Dashboard);
            this.selectedToolData = this.getSelectedToolData(content.state?.Tools?.toolToOpen);
            this.selectedToolLabel = this.selectedToolData?.label;
            this.importedReferenceValueList = this.getImportedReferenceValueList(content.state?.Tools?.Dashboard?.orientationValues);
            this.referenceValueList = this.importedReferenceValueList;
        },

        /**
         * Gets the template attributes if it is in string type
         * @param {String} txt - the text
         * @returns {string} the text
         */
        getTemplateText (txt) {
            return typeof txt === "string" ? txt : "";
        },

        /**
         * Gets the selected Geo data.
         * @param {String[]} layerId - the layer Id
         * @returns {Object} the selected geo data
         */
        getSelectedGeoData (layerId) {
            const geoData = [];

            if (Array.isArray(layerId)) {
                layerId.forEach(id => {
                    geoData.push(this.geoData.find(data => data?.layerId === id));
                });
            }

            return geoData;
        },

        /**
         * Gets the selected statistical data.
         * @param {Object} dashboard - the dashboard object
         * @returns {Object[]} the selected stats data
         */
        getSelectedStatData (dashboard) {
            const statData = [];

            if (Array.isArray(dashboard?.statsFeatureFilter)) {
                dashboard.statsFeatureFilter.forEach(stat => {
                    this.statData.forEach(stData => {
                        if (stat !== "" && stData?.data.find(data => data?.label === stat)) {
                            statData.push(stData.data.find(data => data?.label === stat));
                        }
                    });
                });
            }

            return statData;
        },

        /**
         * Gets the selected template tool option.
         * @param {String} option - the option
         * @returns {Object} the selected tool data
         */
        getSelectedToolData (option) {
            if (typeof option === "string") {
                return this.toolData.find(data => data?.toolId === option);
            }

            return [];
        },

        /**
         * Gets the reference value list
         * @param {Object[]} val - the reference value list
         * @returns {string} the reference value list
         */
        getImportedReferenceValueList (val) {
            return Array.isArray(val) ? val : [];
        },

        /**
         * Gets the reference value for each reference input field.
         * @param {String} name - the statistical data name
         * @param {Object[]} referenceValueList - the reference value list
         * @returns {Object} the selected tool data
         */
        getReferenceValue (name, referenceValueList) {
            if (typeof name !== "string" || !Array.isArray(referenceValueList) || !referenceValueList.length) {
                return "";
            }

            return referenceValueList.find(data => data?.statisticName === name)?.value;
        },
        /**
         * Called when user uploads a file to process
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onInputChange (e) {
            if (e.target.files !== undefined) {
                this.importTemplate(e);
                e.target.value = null;
            }
        },
        /**
         * Called when user drops a file in the upload container
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onDrop (e) {
            if (e.dataTransfer.files !== undefined) {
                this.importTemplate(e, true);
            }
        },
        /**
         * Removes the loaded template from the title
         * @param {String} title the title of the template
         * @returns {void}
         */
        removeLoadedTemplate (title) {
            if (typeof title !== "string") {
                return;
            }

            this.setLoadedTemplates(this.loadedTemplates.filter(template => template.title !== title));
            this.setImportedTemplateNames(this.importedTemplateNames.filter(name => name !== title));
            delete this.savedTemplateContents[title];
        },
        /**
         * Reset all the field..
         * @returns {void}
         */
        resetAll () {
            this.templateName = "";
            this.templateDes = "";
            this.selectedGeoData = [];
            this.selectedStatData = [];
            this.selectedToolData = [];
            this.selectedGeoDataLabel = [];
            this.selectedToolLabel = "";
            this.setEnableExport(false);
        },
        /**
         * Returns the unit or false depending on valueType.
         * @param {String} valueType - the value type ("relative", "absolute" or false) of the selected statistics.
         * @returns {String|Boolean} the unit if the valueType is "relative" otherwise false.
         */
        showUnit (valueType) {
            return valueType === "relative" ? "%" : false;
        },
        /**
         * Called when user clicks to input files
         * @param {HTMLInputEvent} e event with click.
         * @returns {void}
         */
        triggerClickOnFileInput (event) {
            if (event.which === 32 || event.which === 13) {
                this.$refs["upload-input-file"].click();
            }
        }
    }
};

</script>

<template lang="html">
    <!-- Form -->
    <form id="template-admin-form">
        <div
            v-if="!showEditTemplate || showEditTemplate && uploadedTemplates.length !== 0"
            class="required mt-2"
        >
            * {{ $t("additional:modules.cosi.templateAdmin.required") }}
        </div>
        <div
            v-if="showEditTemplate"
            class="mt-3"
        >
            <FileUpload
                :id="'templateUpload'"
                :keydown="(e) => triggerClickOnFileInput(e)"
                :change="(e) => onInputChange(e)"
                :drop="(e) => onDrop(e)"
            >
                <span class="row form-text ps-3 align-items-center justify-content-center">
                    {{ $t("additional:modules.cosi.templateAdmin.label.supportedFormats") }}
                </span>
            </FileUpload>
            <div
                v-if="uploadedTemplates.length !== 0"
            >
                <label
                    class="form-label mb-3 mt-3"
                    for="select-template"
                >
                    <i class="mr-1 bi bi-plus-square" />
                    {{ $t("additional:modules.cosi.templateAdmin.label.selectTemplate") }}
                </label>
                <div
                    v-for="template in loadedTemplates"
                    :key="template.title"
                >
                    <Card
                        :data="template.data"
                        :downloadable="false"
                        icon="bi bi-pencil"
                        :status="template.title === selectedTemplate ? 'active' : ''"
                        class="col-12"
                        @click="setSelectedTemplate(template.title)"
                        @remove-set="removeLoadedTemplate(template.title)"
                    />
                </div>
            </div>
        </div>
        <div
            v-if="!showEditTemplate || showEditTemplate && uploadedTemplates.length !== 0"
        >
            <div class="mb-3 mt-0">
                <InputText
                    :id="'template-name'"
                    v-model.trim="templateName"
                    :class="[isNameValidating && templateName === '' ? 'novalidate' : '', showEditTemplate ? 'no-border' : '']"
                    :min="1"
                    :label="$t('additional:modules.cosi.templateAdmin.label.name')"
                    :placeholder="$t('additional:modules.cosi.templateAdmin.label.name')"
                    @input="setIsNameValidating(false)"
                />
                <span
                    v-if="isNameValidating && templateName === ''"
                    class="hint"
                >
                    {{ $t("additional:modules.cosi.templateAdmin.hintName") }}
                </span>
            </div>
            <div class="my-3">
                <InputText
                    :id="'template-description'"
                    v-model.trim="templateDes"
                    :class="showEditTemplate ? 'no-border' : ''"
                    html-type="textarea"
                    :label="$t('additional:modules.cosi.templateAdmin.label.description') + ' (optional)'"
                    :placeholder="$t('additional:modules.cosi.templateAdmin.label.description')"
                />
            </div>
            <div class="row no-gutters mb-2">
                <Dropdown-Autocomplete
                    v-model="selectedGeoDataLabel"
                    multiple
                    :is-group="true"
                    :items="geoData"
                    :label="$t('additional:modules.cosi.templateAdmin.label.layer')"
                />
            </div>
            <label
                class="form-label mb-0"
                for="add-statistic-data"
            >
                {{ $t("additional:modules.cosi.templateAdmin.label.addStatisticalData") }} *
            </label>
            <div class="mb-4">
                <span
                    v-if="isStatDataValidating && !selectedStatData.some(data => data.label !== '')"
                    class="hint"
                >
                    {{ $t("additional:modules.cosi.templateAdmin.hintStatisticData") }}
                </span>
                <Draggable
                    v-model="selectedStatData"
                    class="mt-3"
                    handle=".handle"
                >
                    <TemplateAdminFormCard
                        v-for="(statDataObj, idx) in selectedStatData"
                        :key="idx + statDataObj.label"
                        :class="idx > 1 && limitReferenceValues ? 'more-statistics' : ''"
                        :stat-data="statData"
                        :title="statDataObj.label"
                        :imported-reference-value="getReferenceValue(statDataObj.label, importedReferenceValueList)"
                        :origin-reference-value="getReferenceValue(statDataObj.label, referenceValueList)"
                        :label="$t(labelOfOrientationValue)"
                        :unit="showUnit(statDataObj.valueType)"
                        @removeCard="removeStatData(statDataObj.propertyName)"
                        @setReferenceValueList="setReferenceValueList"
                        @addStatDataObj="addStatDataObj(statDataObj, $event)"
                    />
                </Draggable>
                <div
                    v-if="countSelectedStatistics"
                    class="align-self-end p-0"
                >
                    <button
                        id="more-button"
                        type="button"
                        class="btn btn-link btn-sm pt-0"
                        @click="limitReferenceValues = !limitReferenceValues"
                    >
                        {{ limitReferenceValues ? $t("additional:modules.cosi.templateAdmin.button.showMore") : $t("additional:modules.cosi.templateAdmin.button.showLess") }}
                    </button>
                </div>
            </div>
            <div class="d-grid add-statistic mb-5 mt-1">
                <button
                    class="btn btn-light p-4 rounded-4 d-flex flex-row align-items-center justify-content-center"
                    type="button"
                    @click="addStatisticCards"
                >
                    <i class="mr-2 bi bi-plus-circle" />
                    {{ $t("additional:modules.cosi.templateAdmin.label.addStatisticalData") }}
                </button>
            </div>
            <div class="row no-gutters mb-4">
                <Dropdown-Autocomplete
                    v-model="selectedToolLabel"
                    clearable
                    :items="toolDataList"
                    :label="$t('additional:modules.cosi.templateAdmin.label.tool')"
                />
            </div>
            <FlatButton
                v-if="!showEditTemplate"
                class="mx-auto"
                icon="bi bi-arrow-counterclockwise"
                :text="$t('additional:modules.cosi.templateAdmin.button.reset')"
                @click.native="resetAll"
            />
            <FlatButton
                class="mx-auto"
                icon="bi bi-download"
                :text="showEditTemplate ? $t('additional:modules.cosi.templateAdmin.button.downloadeditTemplate') : $t('additional:modules.cosi.templateAdmin.button.downloadTemplate')"
                @click.native="validateForm"
            />
        </div>
    </form>
</template>

<style lang="scss" scoped>
@import "/src/assets/css/variables";

.add-statistic button {
    color: $secondary;
    border: 2px dashed $secondary;
    transition: background 0.25s, border-color 0.25s;
}

.btn-outline-primary, .btn-outline-primary:focus-visible {
    color: $light_blue;
    border-color: $light_blue;
}

.btn-outline-primary:hover{
    color: $white;
    background-color: $light_blue;
}

.search-icon {
    font-size: 15px;
    position: relative;
    top: 2px;
}

.search-button {
    border: 1px solid #ced4da;
    border-right: 0;
    background-color: $light_grey;
}

.btn-outline-secondary, label {
    color: $dark_grey;
}

.btn-pb {
    padding-bottom: 2px;
}

.novalidate {
    outline: 0;
    box-shadow: inset 0 1px 2px rgba(225, 0, 25, 0.075), 0 0 0 0.25rem rgba(225, 0, 25, 0.25);
}

.hint {
    display: block;
    color: $danger;
}

#form-name + .hint {
    margin-top: 8px;
}
#more-button {
    text-align: left;
}
.more-statistics {
        display: none;
    }
.required {
    font-size: 11px;
    text-align: right;
}
.no-border {
    border: 1px solid #ffffff;
    box-shadow: none;
     &:hover {
        border: 1px solid #ced4da;
        box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.075);
     }
}
</style>

<style lang="scss">
@import "/src/assets/css/mixins.scss";
@import "/src/assets/css/variables";

</style>
