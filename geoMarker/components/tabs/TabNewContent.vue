<script>
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import GeoMarkerFormBox from "../GeoMarkerFormBox.vue";
import SelectableList from "../SelectableList.vue";
import CreateScreenshot from "../CreateScreenshot.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import dayjs from "dayjs";
import Multiselect from "vue-multiselect";

export default {
    name: "TabNewContent",
    components: {
        GeoMarkerFormBox,
        SwitchInput,
        CreateScreenshot,
        FlatButton,
        IconButton,
        SelectableList,
        Multiselect,
        InputText,
        FileUpload
    },
    data () {
        return {
            selectedCategoryId: null,
            selectedDepartmentsTableSection: [],
            departmentData: {}, // { departmentId: { status: '', bemerkung: '' }}
            categories: {},
            departments: {},
            statusForSelectedDepartments: "offen",
            reminderDate: null,
            geomarkerDescription: "",
            screenshotImage: "",
            attachment: "",
            createAnotherGeoMarker: false,
            savingInProgress: false
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "statusOptions",
            "newGeoMarkerFeature"
        ]),
        tableDataConfig () {
            const departmentIds = Object.keys(this.departmentData || {});

            return {
                headers: [
                    {itemProperty: "Abteilung", displayName: "Abteilung"},
                    {itemProperty: "Status", displayName: "Status"},
                    {itemProperty: "Bemerkung", displayName: "Bemerkung"}
                ],
                items: departmentIds.map(departmentId => {
                    return {
                        departmentId: departmentId,
                        Abteilung: this.departments[departmentId]?.name || "",
                        Status: this.departmentData[departmentId]?.status || "offen"
                    };
                })
            };
        },
        /**
         * Maps departments using the keys defined in `departments.json`.
         *
         * Example output:
         *     "sta_steuerungsstelle": "geschlossen",
         *     "bem_steuerungsstelle": "new geo marker bemerkung"
         *
         * Notes:
         * - The keys like `sta_*` and `bem_*` come directly from `departments.json`.
         */
        departmentValuesForNewGeomarker () {
            const departmentValuesForNewGeomarker = {};

            Object.keys(this.departmentData || {}).forEach(departmentId => {
                const department = this.departments?.[departmentId],
                    departmentFormData = this.departmentData[departmentId] || {};

                if (department?.fields) {
                    Object.entries(department.fields).forEach(([fieldKey, fieldValue]) => {
                        if (fieldKey === "wiedervorlage") {
                            departmentValuesForNewGeomarker[fieldValue] = this.reminderDate;
                        }

                        if (departmentFormData[fieldKey] !== null && departmentFormData[fieldKey] !== undefined) {
                            departmentValuesForNewGeomarker[fieldValue] = departmentFormData[fieldKey];
                        }
                    });
                }
            });

            return departmentValuesForNewGeomarker;
        },
        newGeoMarker () {
            return {
                kategorie: this.categories[this.selectedCategoryId].name,
                anhang_name: this.attachment ? this.attachment.name : null,
                anhang_base_64: this.attachment ? this.attachment.base64 : null,
                screenshot_base_64: this.screenshotImage,
                ...this.departmentValuesForNewGeomarker,
                beschreibung: this.geomarkerDescription,
                zeitstempel: dayjs().toISOString(),
                quelle: window.activeDirectoryUser ? window.activeDirectoryUser.username : "geomarker"
            };
        },
        /**
         * Computes the IDs of all map layers that are associated with the currently selected departments.
         * Each department has 3 layers. This property returns a flat array
         * of all matching layer IDs, which can be used for map operations or transactions.
         *
         * @returns {string[]} Array of layer IDs for selected departments.
         */
        layerIdsForSelectedDepartments () {
            const departmentIds = Object.keys(this.departmentData || {}),
                layerIdsForSelectedDepartmentsArray = [];

            departmentIds.forEach(departmentId => {
                layerIdsForSelectedDepartmentsArray.push(...Object.values(this.departments[departmentId].layerIds));

            });

            return layerIdsForSelectedDepartmentsArray;
        },
        /**
         * Checks if the form is invalid by evaluating a list of conditions.
         * Each condition in the validations array represents a rule that must be fulfilled for the form to be valid.
         * If at least one condition is true (i.e., the form is incomplete or invalid), the method returns true.
         * This is typically used to disable the save button until all required fields are filled.
         * To add new validation rules, simply add new conditions to the validations array.
         *
         * @returns {Boolean} true if the form is invalid, false if the form is valid
         */
        formValidation () {
            const validations = [
                Object.keys(this.departmentData).length === 0,
                this.newGeoMarkerFeature === null
            ];

            return validations.some(Boolean);
        }
    },
    watch: {
        reminderDate (newDate) {
            if (!newDate) {
                return;
            }

            const today = new Date(),
                selected = new Date(newDate);

            this.statusForSelectedDepartments = selected <= today ? "offen" : "inaktiv";

            Object.keys(this.departmentData).forEach(departmentId => {
                if (this.departmentData[departmentId]) {
                    this.departmentData[departmentId].status = this.statusForSelectedDepartments;
                }
            });
        }
    },
    mounted () {
        this.getDepartmentsAndCategoriesFromState();
        this.setInitiallySelectedCategoryId();
        this.updateDepartmentsFromCategory();
        // this.refreshNewFeaturePointOnMap();
    },
    methods: {
        ...mapActions("Modules/GeoMarker", [
            "loadCategories",
            "loadDepartments",
            "savePoint",
            "refreshLayer",
            "clearInteractions",
            "setMapInteraction"
        ]),
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerActiveTab",
            "setNewGeoMarkerFeature",
            "setGeoMarkerFeatureList"
        ]),
        /**
         * Sets the first category as the selected category
         */
        setInitiallySelectedCategoryId () {
            this.selectedCategoryId = Object.keys(this.categories || {})[0];
        },
        /**
         * Handles category selection change
         * Sets the new category and updates departments accordingly
         * @param {string} categoryId - ID of the selected category
         */
        onCategorySelect (categoryId) {
            this.selectedCategoryId = categoryId;
            this.updateDepartmentsFromCategory();
        },
        /**
         * Updates the department list based on the selected category
         * If selected category exists and has departments, copies them,
         * otherwise sets an empty array
         */
        updateDepartmentsFromCategory () {
            const category = this.categories[this.selectedCategoryId];

            if (category && category.departments) {
                const newDepartmentData = {};

                category.departments.forEach(departmentId => {
                    newDepartmentData[departmentId] = {
                        status: this.statusForSelectedDepartments,
                        bemerkung: ""
                    };
                });

                this.departmentData = newDepartmentData;
            }
            else {
                this.departmentData = {};
            }

            if (this.selectedCategoryId && this.categories[this.selectedCategoryId]) {
                this.categories[this.selectedCategoryId].departments = Object.keys(this.departmentData);
            }
        },
        /**
         * Toggles department selection (removes if exists, adds if not)
         * Also updates the selected category's department list
         * @param {string|number} departmentId - ID of the department to toggle
         */
        toggleDepartment (departmentId) {
            if (this.departmentData[departmentId]) {
                delete this.departmentData[departmentId];

            }
            else {
                this.departmentData[departmentId] = {
                    status: this.statusForSelectedDepartments,
                    bemerkung: ""
                };
            }

            if (this.selectedCategoryId && this.categories?.[this.selectedCategoryId]) {
                this.categories[this.selectedCategoryId].departments = Object.keys(this.departmentData);
            }
        },
        /**
         * Handles the screenshot creation event and updates the screenshotImage data property.
         * @param {String} screenshotImage - The base64 string of the created screenshot image.
         */
        onScreenshotCreated (screenshotImage) {
            this.screenshotImage = screenshotImage;
        },
        /**
         * Handles the screenshot deletion event.
         * Sets the screenshotImage property to an empty string:
         */
        onScreenshotDeleted () {
            this.screenshotImage = "";
        },
        /**
         * Handles file attachment changes (file input or drag & drop) and reads the file as base64.
         * @param {Event} e - The file change or drop event.
         */
        onAttachmentChange (e) {
            const reader = new FileReader(),
                allowedTypes = [
                    "application/pdf",
                    "image/png",
                    "image/jpeg",
                    "application/zip",
                    "application/x-zip-compressed"
                ];

            let file = null;

            switch (e.type) {
                case "change":
                    file = e.target.files?.[0] || null;
                    break;
                case "drop":
                    file = e.dataTransfer?.files?.[0] || null;
                    break;
                default:
                    console.warn("Unsupported event type:", e.type);
            }

            if (!file) {
                return;
            }

            if (!allowedTypes.includes(file.type)) {
                this.addSingleAlert({
                    content: this.$t("additional:modules.geoMarker.tabNewContent.attachmentWarning"),
                    category: "warn",
                    title: this.$t("additional:modules.geoMarker.tabNewContent.attachmentWarningTitle")
                });
                return;
            }

            reader.onload = () => {
                this.attachment = {
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    base64: reader.result
                };
            };

            reader.readAsDataURL(file);
            e.target.value = null;
        },
        /**
         * Triggers a click on the file upload input when space or enter is pressed for accessibility.
         * @param {KeyboardEvent} e - The keyboard event.
         */
        triggerClickOnFileUploadKeyDown (e) {
            if (e.code === "Space" || e.code === "Enter") {
                this.$refs.fileUpload.click();
            }
        },
        /**
         * Removes the currently attached file from the form.
         */
        removeAttachment () {
            this.attachment = "";
        },
        /**
         * Resets the form to its initial state, including categories, departments, and all form fields.
         * Reloads categories and departments from the store.
         */
        refreshForm () {
            this.getDepartmentsAndCategoriesFromState();
            this.setInitiallySelectedCategoryId();
            this.updateDepartmentsFromCategory();
            this.removeAttachment();
            this.statusForSelectedDepartments = "offen";
            this.reminderDate = null;
            this.geomarkerDescription = "";
            this.screenshotImage = "";
            this.refreshNewFeaturePointOnMap();
        },
        /**
         * Creates a new GeoMarker by saving the form data.
         * If successful, resets the form and optionally switches to the list tab.
         * @returns {Promise<void>}
         */
        async createNewGeomarker () {
            this.savingInProgress = true;
            // this transactionFeature will be used and this part will be edited
            // thats why I am leaving it here.
            // eslint-disable-next-line
            const {transactionFeature, transactionResponse} = await this.savePoint({
                newGeoMarkerFormValues: this.newGeoMarker,
                updatedLayerIds: this.layerIdsForSelectedDepartments
            });

            if (!transactionResponse) {
                return;
            }

            this.refreshForm();
            this.savingInProgress = false;

            if (!this.createAnotherGeoMarker) {
                // This does not work compatible with tablist component,
                // There are some properties and id is missing
                // TypeError: can't access property "key", geometryProperty is undefined
                // This part can be implemented after we have the saved feature from sendTransaction methode.
                // this.setGeoMarkerFeatureList([transactionFeature]);
                this.setGeoMarkerActiveTab("tabList");
            }
        },
        /**
         * Creates deep copies of the departments and categories objects from the Vuex store.
         * This ensures that any modifications within the component do not affect the global state
         * by using JSON.parse and JSON.stringify
         */
        getDepartmentsAndCategoriesFromState () {
            this.categories = JSON.parse(JSON.stringify(this.$store.getters["Modules/GeoMarker/categories"]));
            this.departments = JSON.parse(JSON.stringify(this.$store.getters["Modules/GeoMarker/departments"]));
        },
        /**
         * Refreshes the map interaction for creating a new GeoMarker feature.
         * This method clears the current map interaction and re-initializes the interaction for drawing a new point.
         * Here it is used to refresh the blue point on the map.
         */
        refreshNewFeaturePointOnMap () {
            this.setMapInteraction(null);
            this.setMapInteraction("Point");
            this.setNewGeoMarkerFeature(null);
        }
    }
};
</script>

<template>
    <div
        class="TabNewContent"
    >
        <div class="formElements">
            <div class="firstRow">
                <GeoMarkerFormBox
                    :title="$t('additional:modules.geoMarker.tabNewContent.infoTitle')"
                    class="infoSection"
                >
                    <div class="categoriesSelectBox">
                        <label for="categories">
                            {{ $t("additional:modules.geoMarker.tabNewContent.category") }}
                        </label>

                        <select
                            id="categories"
                            class="form-select"
                            :value="selectedCategoryId"
                            @change="onCategorySelect($event.target.value)"
                        >
                            <option
                                v-for="categoryId in Object.keys(categories)"
                                :key="categoryId"
                                :value="categoryId"
                                :title="categories[categoryId].description"
                            >
                                {{ categories[categoryId].name }}
                            </option>
                        </select>
                    </div>

                    <label for="geomarkerDescription">
                        {{ $t('additional:modules.geoMarker.tabNewContent.descriptionLabel') }}
                    </label>

                    <textarea
                        id="geomarkerDescription"
                        v-model="geomarkerDescription"
                        class="form-control"
                        rows="3"
                    />

                    <InputText
                        id="reminderDate"
                        v-model="reminderDate"
                        :label="$t('additional:modules.geoMarker.tabNewContent.reminderDate')"
                        type="date"
                        :placeholder="$t('additional:modules.geoMarker.tabNewContent.reminderDate')"
                    />
                </GeoMarkerFormBox>

                <GeoMarkerFormBox
                    :title="$t('additional:modules.geoMarker.tabNewContent.attachmentTitle')"
                    class="attachmentSection"
                >
                    <div class="attachment">
                        <FileUpload
                            id="attachmentUpload"
                            ref="fileUpload"
                            :change="onAttachmentChange"
                            :keydown="triggerClickOnFileUploadKeyDown"
                            :drop="onAttachmentChange"
                        >
                            <span v-if="!attachment">
                                {{ $t("additional:modules.geoMarker.tabNewContent.attachmentWarning") }}
                            </span>

                            <div
                                v-if="attachment"
                                class="fileUploadSlotContent"
                            >
                                <span>
                                    {{ attachment.name }}
                                </span>

                                <IconButton
                                    class="removeAttachmentButton"
                                    :aria="$t('additional:modules.geoMarker.tabNewContent.removeAttachment')"
                                    icon="bi-trash3"
                                    :interaction="removeAttachment"
                                />
                            </div>
                        </FileUpload>
                    </div>

                    <div class="screenshot">
                        <p>
                            {{ $t("additional:modules.geoMarker.screenshot.altImage") }}:
                        </p>

                        <CreateScreenshot
                            :screenshot-image="screenshotImage"
                            @onScreenshotCreated="onScreenshotCreated"
                            @onScreenshotDeleted="onScreenshotDeleted"
                        />
                    </div>
                </GeoMarkerFormBox>

                <GeoMarkerFormBox
                    :title="$t('additional:modules.geoMarker.tabNewContent.departmentsTitle')"
                    class="departmentsCheckboxSection"
                >
                    <div class="departments">
                        <template
                            v-for="(department, departmentId) in departments"
                            :key="departmentId"
                        >
                            <SwitchInput
                                :id="departmentId"
                                :label="department.name"
                                :aria="department.name"
                                :checked="Boolean(departmentData[departmentId])"
                                :disabled="false"
                                :interaction="() => toggleDepartment(departmentId)"
                            />
                        </template>
                    </div>
                </GeoMarkerFormBox>
            </div>
            <div class="selectedDepartments">
                <GeoMarkerFormBox
                    class="selectedDepartmentsTableSection"
                    :title="$t('additional:modules.geoMarker.tabNewContent.selectedDepartmentsTitle')"
                >
                    <SelectableList
                        v-if="Object.keys(departmentData).length > 0"
                        :highlight-selection="false"
                        :table-data="tableDataConfig"
                        :show-header="true"
                    >
                        <template #cell-Status="{ cellData }">
                            <Multiselect
                                :id="`statusSelect-${cellData.departmentId}`"
                                v-model="departmentData[cellData.departmentId].status"
                                class="departmentStatusSelect"
                                :options="statusOptions"
                                name="select-box"
                                :multiple="false"
                                :placeholder="$t('additional:modules.geoMarker.filter.status.placeholder')"
                                :show-labels="false"
                                open-direction="bottom"
                                :hide-selected="false"
                                :allow-empty="false"
                                :close-on-select="true"
                                :clear-on-select="false"
                                :internal-search="false"
                                :aria-expanded="true"
                            />
                        </template>

                        <template #cell-Bemerkung="{ cellData }">
                            <textarea
                                :id="`departmentDescription-${cellData.departmentId}`"
                                v-model="departmentData[cellData.departmentId].bemerkung"
                                class="categoryDescriptionInput form-control"
                                rows="1"
                            />
                        </template>
                    </SelectableList>
                </GeoMarkerFormBox>
            </div>
        </div>
        <div class="footer">
            <SwitchInput
                id="createAnotherGeoMarker"
                :label="'additional:modules.geoMarker.tabNewContent.createAnotherGeoMarker'"
                :aria="$t('additional:modules.geoMarker.tabNewContent.createAnotherGeoMarker')"
                :checked="createAnotherGeoMarker"
                :interaction="() => { createAnotherGeoMarker = !createAnotherGeoMarker; }"
            />

            <div class="buttons">
                <FlatButton
                    :aria-label="$t('additional:modules.geoMarker.tabNewContent.save')"
                    :text="$t('additional:modules.geoMarker.tabNewContent.save')"
                    :disabled="formValidation || savingInProgress"
                    @click="createNewGeomarker()"
                />

                <FlatButton
                    :aria-label="$t('additional:modules.geoMarker.tabNewContent.cancel')"
                    :text="$t('additional:modules.geoMarker.tabNewContent.cancel')"
                    :disabled="savingInProgress"
                    @click="refreshForm()"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

div.TabNewContent {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    height: 100%;

    div.formElements {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow: auto;
        padding-top: 1rem;

        div.firstRow {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            width: 100%;

            div.infoSection {
                ::v-deep div.formBoxContent{
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
            }

            div.attachmentSection {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
        }

        div.firstRow > * {
            flex: 1 1 15rem;
            min-width: 0;
        }

        div.fileUploadSlotContent {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            gap: 0.5rem;

            div.removeAttachmentButton {
                position: relative;
                z-index: 20;
            }

            span {
                overflow-wrap: anywhere
            }
        }

        div.selectedDepartmentsTableSection {
            width: 100%;

            .departmentStatusSelect {
                width: 12rem;
            }
        }
    }

    div.footer {
        display: flex;
        justify-content: space-between;

        div.buttons {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
    }
}
</style>
