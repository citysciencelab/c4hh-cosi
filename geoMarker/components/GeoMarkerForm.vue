<script>
import SwitchInput from "@shared/modules/checkboxes/components/SwitchInput.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import GeoMarkerFormBox from "./GeoMarkerFormBox.vue";
import SelectableList from "./SelectableList.vue";
import CreateScreenshot from "./CreateScreenshot.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import dayjs from "dayjs";
import layerCollection from "@core/layers/js/layerCollection";
import {Style} from "ol/style";

export default {
    name: "GeoMarkerForm",
    components: {
        GeoMarkerFormBox,
        SwitchInput,
        CreateScreenshot,
        IconButton,
        SelectableList,
        Multiselect,
        InputText,
        FileUpload,
        FlatButton
    },
    props: {
        /**
         * The mode for geomarker form.
         * It can be used for a new geomarker create or update.
         * For Create mode should be create
         * For Update mode should be edit
         */
        mode: {
            type: String,
            default: "create",
            validator: (value) => ["create", "edit"].includes(value)
        },
        selectedFeature: {
            type: Object,
            default: null
        },
        showCreateAnotherSwitch: {
            type: Boolean,
            default: false
        }
    },
    emits: ["cancel-edit", "update-successfull", "geomarker-created"],
    data () {
        return {
            selectedCategoryId: null,
            categories: {},
            departments: {},
            departmentData: {},
            departmentDataInitial: {},
            statusForSelectedDepartments: "offen",
            reminderDate: null,
            geomarkerDescription: "",
            geomarkerClosedDate: null,
            geomarkerDescriptionInitial: "",
            screenshotImage: "",
            attachment: null,
            createAnotherGeoMarker: false,
            savingInProgress: false
        };
    },
    computed: {
        ...mapGetters("Modules/GeoMarker", [
            "statusOptions",
            "newGeoMarkerFeature",
            "geoMarkerFeatureList",
            "geoMarkerUpdateFeature",
            "isFilterApplied",
            "geoMarkerShortFeatureId",
            "geoMarkerState",
            "isGemisFeature"
        ]),
        ...mapGetters(["visibleLayerConfigs"]),
        /**
         * Provides table configuration with headers and items for department selection display
         * @returns {Object} Configuration object with headers array and items array
         */
        tableDataConfig () {
            const departmentIds = Object.keys(this.departmentData || {}),
                headers = [
                    {itemProperty: "Abteilung", displayName: "Abteilung"},
                    {itemProperty: "Status", displayName: "Status"}
                ];

            if (this.mode === "edit") {
                headers.push({itemProperty: "ReminderDate", displayName: "WiedervorlageDatum"});
            }

            headers.push({itemProperty: "Bemerkung", displayName: "Bemerkung"});

            return {
                headers: headers,
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
         * Validates whether the form can be submitted
         * Checks if at least one department is selected and feature exists for create/edit modes
         * @returns {Boolean} True if form is invalid, false if valid
         */
        formValidation () {
            const validations = [
                Object.keys(this.departmentData).length === 0,
                this.mode === "create" ? this.newGeoMarkerFeature === null : !this.selectedFeature
            ];

            return validations.some(Boolean);
        },
        /**
         * Creates a new geomarker object for creation mode with all form data
         * @returns {Object|null} Object with geomarker properties or null if not in create mode
         */
        newGeoMarker () {
            if (this.mode !== "create") {
                return null;
            }

            return {
                kategorie: this.categories[this.selectedCategoryId]?.name,
                anhang_name: this.attachment ? this.attachment.name : null,
                anhang_base_64: this.attachment ? this.attachment.base64 : null,
                screenshot_base_64: this.screenshotImage,
                ...this.departmentValuesForGeomarker,
                beschreibung: this.appendUserToDescription(this.geomarkerDescription),
                zeitstempel: dayjs().toISOString(),
                zeitstempel_geschlossen: this.closedDateIfEveryDepartmentIsClosed(),
                quelle: window.activeDirectoryUser ? window.activeDirectoryUser.username : "geomarker"
            };
        },
        /**
         * Creates an updated geomarker object for edit mode with all form data including geometry
         * @returns {Object|null} Object with updated geomarker properties or null if not in edit mode or no feature selected
         */
        updatedGeoMarker () {
            if (!this.selectedFeature || this.mode !== "edit") {
                return null;
            }

            return {
                id: this.selectedFeature.getId(),
                kategorie: this.categories[this.selectedCategoryId]?.name,
                anhang_name: this.attachment ? this.attachment.name : null,
                anhang_base_64: this.attachment ? this.attachment.base64 : null,
                screenshot_base_64: this.screenshotImage,
                ...this.departmentValuesForGeomarker,
                beschreibung: this.geomarkerDescription !== this.geomarkerDescriptionInitial
                    ? this.appendUserToDescription(this.geomarkerDescription)
                    : this.geomarkerDescription,
                zeitstempel: dayjs().toISOString(),
                zeitstempel_geschlossen: this.closedDateIfEveryDepartmentIsClosed(),
                quelle: window.activeDirectoryUser ? window.activeDirectoryUser.username : "geomarker",
                geom: this.geoMarkerUpdateFeature?.getGeometry()
            };
        },
        /**
         * Maps department form data to WFS field names
         */
        departmentValuesForGeomarker () {
            const departmentValues = {};

            Object.keys(this.departmentData || {}).forEach(departmentId => {
                const department = this.departments?.[departmentId],
                    departmentFormData = this.departmentData[departmentId] || {},
                    departmentFormDataInitial = this.departmentDataInitial[departmentId] || {},
                    currentStatus = departmentFormData.status;

                if (department?.fields) {
                    Object.entries(department.fields).forEach(([fieldKey, fieldValue]) => {
                        if (fieldKey === "wiedervorlage" && currentStatus !== "offen") {
                            const dateValue = this.mode === "create"
                                ? this.reminderDate
                                : departmentFormData[fieldKey];

                            departmentValues[fieldValue] = dateValue
                                ? dayjs(dateValue).toISOString()
                                : null;
                        }
                        else if (fieldKey === "bemerkung") {
                            departmentValues[fieldValue] = departmentFormData[fieldKey] !== departmentFormDataInitial[fieldKey]
                                ? this.appendUserToDescription(departmentFormData[fieldKey])
                                : departmentFormData[fieldKey];
                        }
                        else if (departmentFormData[fieldKey] !== null) {
                            departmentValues[fieldValue] = departmentFormData[fieldKey];
                        }
                    });
                }
            });

            return departmentValues;
        },
        /**
         * Returns layer IDs for selected departments
         */
        layerIdsForSelectedDepartments () {
            const departmentIds = Object.keys(this.departmentData || {}),
                layerIdsArray = [];

            departmentIds.forEach(departmentId => {
                if (this.departments[departmentId]?.layerIds) {
                    const status = this.departmentData[departmentId].status;

                    layerIdsArray.push(this.departments[departmentId].layerIds[status]);
                }
            });

            return layerIdsArray;
        },
        /**
         * The current user name from active directory.
         */
        currentUsername () {
            return window.activeDirectoryUser ? window.activeDirectoryUser.username : "geomarker";
        },
        isGemisFeatureEditNotAllowed () {
            return this.isGemisFeature(this.selectedFeature);
        }
    },
    watch: {
        reminderDate (newDate) {
            if (!newDate || this.mode === "edit") {
                return;
            }

            const today = new Date(),
                selected = new Date(newDate);

            this.statusForSelectedDepartments = selected <= today ? "offen" : "inaktiv";

            Object.keys(this.departmentData).forEach(departmentId => {
                if (this.departmentData[departmentId]) {
                    this.departmentData[departmentId].status = this.statusForSelectedDepartments;
                    this.departmentData[departmentId].geschlossen = null;
                }
            });
        },
        selectedFeature: {
            handler (newFeature) {
                if (newFeature && this.mode === "edit") {
                    this.loadFeatureData(newFeature);
                }
            },
            immediate: true
        }
    },
    mounted () {
        this.getDepartmentsAndCategoriesFromState();
        this.initializeComponent();
    },
    methods: {
        ...mapActions("Alerting", ["addSingleAlert"]),
        ...mapActions("Modules/GeoMarker", [
            "upsertPoint",
            "setMapInteraction",
            "updateGeoMarker",
            "loadPropertyOfFeatureById",
            "refreshLayer",
            "refreshLayerAndReapplyFilter",
            "setGeoMarkerFeatureListAction"
        ]),
        ...mapMutations("Modules/GeoMarker", [
            "setGeoMarkerActiveTab",
            "setNewGeoMarkerFeature",
            "setGeoMarkerFeatureList",
            "setTriggerFilter",
            "setGeoMarkerFeatureSelected",
            "setNewGeoMarkerCreated"
        ]),
        /**
         * Register dayjs in order to use it in the template
         */
        dayjs,
        /**
         * Initializes the component after mounting.
         * Sets up the form state depending on the mode:
         * - In 'create' mode, prepares the form for a new GeoMarker.
         * - In 'edit' mode, loads data from the selected feature into the form.
         * Called automatically in mounted().
         */
        initializeComponent () {
            if (this.mode === "create") {
                this.initializeForCreate();
            }
            else if (this.mode === "edit" && this.selectedFeature) {
                this.loadFeatureData(this.selectedFeature);
            }
        },
        /**
         * Initialize form for create mode
         */
        initializeForCreate () {
            this.setInitiallySelectedCategoryId();
            this.updateDepartmentsFromCategory();
        },
        /**
         * Load data from feature for edit mode
         */
        async loadFeatureData (feature) {
            if (!feature) {
                return;
            }

            const featureProps = feature.getProperties();

            this.selectedCategoryId = Object.keys(this.categories).find(
                categoryId => this.categories[categoryId].name === featureProps.kategorie
            );

            this.departmentData = this.extractDepartmentData(featureProps);
            this.departmentDataInitial = JSON.parse(JSON.stringify(this.departmentData));

            this.geomarkerDescription = featureProps.beschreibung || "";
            this.geomarkerDescriptionInitial = JSON.parse(JSON.stringify(this.geomarkerDescription));

            this.geomarkerClosedDate = featureProps.zeitstempel_geschlossen || null;
            this.reminderDate = this.extractReminderDate(featureProps);
            this.screenshotImage = await this.loadPropertyOfFeatureById({
                geomarkerId: feature.getId(),
                propertyName: "screenshot_base_64"
            });

            if (featureProps.anhang_name) {
                this.attachment = {
                    name: featureProps.anhang_name
                };
            }
            else {
                this.attachment = null;
            }
        },
        /**
         * Extract department data from feature properties
         */
        extractDepartmentData (featureProps) {
            const departmentData = {};

            if (this.isGemisFeatureEditNotAllowed) {
                return departmentData;
            }

            Object.keys(this.departments).forEach(departmentId => {
                const department = this.departments[departmentId],
                    hasData = Object.values(department?.fields || {}).some(fieldKey => {
                        return featureProps[fieldKey] !== undefined && featureProps[fieldKey] !== null;
                    });

                if (!department?.fields) {
                    return;
                }

                if (hasData) {
                    departmentData[departmentId] = {};

                    Object.entries(department.fields).forEach(([fieldKey, fieldValue]) => {
                        if (featureProps[fieldValue] !== undefined && featureProps[fieldValue] !== null) {
                            if (fieldKey === "wiedervorlage") {
                                departmentData[departmentId][fieldKey] = dayjs(featureProps[fieldValue]).format("YYYY-MM-DD");
                            }
                            else {
                                departmentData[departmentId][fieldKey] = featureProps[fieldValue];
                            }
                        }
                    });
                }
            });

            return departmentData;
        },
        /**
         * Extract reminder date from feature properties
         */
        extractReminderDate (featureProps) {
            for (const department of Object.values(this.departments)) {
                if (department?.fields?.wiedervorlage) {
                    const dateValue = featureProps[department.fields.wiedervorlage];

                    if (dateValue) {
                        return dayjs(dateValue).format("YYYY-MM-DD");
                    }
                }
            }
            return null;
        },
        /**
         * Get file type from base64 string
         * @param {String} base64String - The base64 encoded string
         * @returns {String|null} The MIME type of the file or null if not recognized
         */
        getFileTypeFromBase64 (base64String) {
            if (!base64String) {
                return null;
            }

            if (base64String.startsWith("data:application/pdf")) {
                return "application/pdf";
            }
            if (base64String.startsWith("data:image/png")) {
                return "image/png";
            }
            if (base64String.startsWith("data:image/jpeg")) {
                return "image/jpeg";
            }
            if (base64String.startsWith("data:application/zip")) {
                return "application/zip";
            }

            return null;
        },
        /**
         * Sets the initially selected category ID to the first available category
         * @returns {void}
         */
        setInitiallySelectedCategoryId () {
            this.selectedCategoryId = Object.keys(this.categories || {})[0];
        },
        /**
         * Handles category selection change
         * @param {String} categoryId - The ID of the selected category
         * @returns {void}
         */
        onCategorySelect (categoryId) {
            this.selectedCategoryId = categoryId;

            this.updateDepartmentsFromCategory();
        },
        /**
         * Handle selection of the status select
         */
        handleDepartmentStateSelection (department) {
            department.geschlossen = department.status === "geschlossen"
                ? dayjs().toISOString()
                : null;
        },
        /**
         * Updates department data based on the selected category
         * @returns {void}
         */
        updateDepartmentsFromCategory () {
            const category = this.categories[this.selectedCategoryId];

            if (category && category.departments) {
                const newDepartmentData = {};

                category.departments.forEach(departmentId => {
                    if (this.mode === "edit") {
                        const initialDepartmentsData = this.extractDepartmentData(this.selectedFeature.getProperties());

                        if (Object.keys(initialDepartmentsData).includes(departmentId)) {
                            newDepartmentData[departmentId] = initialDepartmentsData[departmentId];
                            return;
                        }
                    }

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
         * Toggles department selection on/off and updated departmentData property
         * @param {String} departmentId - The ID of the department to toggle
         * @returns {void}
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
         * Handles screenshot creation event
         * @param {String} screenshotImage - The base64 encoded screenshot image
         * @returns {void}
         */
        onScreenshotCreated (screenshotImage) {
            this.screenshotImage = screenshotImage;
        },
        /**
         * Handles screenshot deletion event
         * @returns {void}
         */
        onScreenshotDeleted () {
            this.screenshotImage = "";
        },
        /**
         * Handles attachment file change event (file input or drag & drop)
         * @param {Event} e - The change or drop event
         * @returns {void}
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
                    content: this.$t("additional:modules.geoMarker.geoMarkerForm.attachmentWarning"),
                    category: "warn",
                    title: this.$t("additional:modules.geoMarker.geoMarkerForm.attachmentWarningTitle")
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
         * Triggers file upload click on keyboard interaction (Space or Enter key)
         * @param {KeyboardEvent} e - The keyboard event
         * @returns {void}
         */
        triggerClickOnFileUploadKeyDown (e) {
            if (e.code === "Space" || e.code === "Enter") {
                this.$refs.fileUpload.click();
            }
        },
        /**
         * Removes the attached file
         * @returns {void}
         */
        removeAttachment () {
            this.attachment = null;
        },
        /**
         * Gets departments and categories from the store and creates deep copies
         * @returns {void}
         */
        getDepartmentsAndCategoriesFromState () {
            this.categories = JSON.parse(JSON.stringify(this.$store.getters["Modules/GeoMarker/categories"]));
            this.departments = JSON.parse(JSON.stringify(this.$store.getters["Modules/GeoMarker/departmentsAllowNewEdit"]));
        },
        /**
         * Resets the form to its initial state
         * @returns {void}
         */
        resetForm () {
            this.getDepartmentsAndCategoriesFromState();
            this.setInitiallySelectedCategoryId();
            this.updateDepartmentsFromCategory();
            this.removeAttachment();
            this.statusForSelectedDepartments = "offen";
            this.reminderDate = null;
            this.geomarkerDescription = "";
            this.geomarkerClosedDate = null;
            this.$refs.screenshotComponent.deleteScreenshot();
        },
        /**
         * Creates a new geomarker and saves it to the database
         * @returns {Promise<void>}
         */
        async createNewGeomarker () {
            if (!this.newGeoMarker) {
                return;
            }

            this.savingInProgress = true;

            const {transactionResponse, transactionFeature} = await this.upsertPoint({
                geoMarkerFormValues: this.newGeoMarker,
                selectedTransaction: "insert"
            });


            if (!transactionResponse) {
                this.savingInProgress = false;
                return;
            }

            if (transactionFeature && transactionResponse) {
                this.addSingleAlert({
                    content: this.$t("additional:modules.geoMarker.geoMarkerForm.successMessageAfterSave",
                        {id: this.geoMarkerShortFeatureId(transactionResponse.featureIds[0])}),
                    category: "success"
                });

                await this.loadNewlyCreatedGeoMarker(transactionFeature, transactionResponse);
            }

            this.resetForm();
            this.setNewGeoMarkerFeature(null);
            this.savingInProgress = false;
            this.setNewGeoMarkerCreated(true);

            if (!this.createAnotherGeoMarker) {
                this.setGeoMarkerActiveTab("tabList");
            }
            else {
                this.refreshNewFeaturePointOnMap();
            }

            this.moveUpdatedFeatureToTop(transactionResponse.featureIds[0]);
        },
        /**
         * Updates an existing geomarker and saves changes to the database
         * @returns {Promise<void>}
         */
        async updateExistingGeomarker () {
            if (!this.selectedFeature || !this.updatedGeoMarker) {
                return;
            }

            this.savingInProgress = true;

            try {
                const {transactionResponse} = await this.upsertPoint({
                    geoMarkerFormValues: this.updatedGeoMarker,
                    selectedTransaction: "selectedUpdate"
                });

                if (transactionResponse) {
                    // Refresh "beschreibung" in form to show appended user name and update the initial data.
                    this.geomarkerDescription = this.updatedGeoMarker.beschreibung ?? "";
                    this.geomarkerDescriptionInitial = JSON.parse(JSON.stringify(this.geomarkerDescription));

                    // Refresh "department / bemerkung" and initial data too.
                    Object.keys(this.departmentData).forEach((department) => {
                        const remarkFieldId = this.departments[department].fields.bemerkung;

                        this.departmentData[department].bemerkung = this.departmentValuesForGeomarker[remarkFieldId] ?? "";
                    });
                    this.departmentDataInitial = JSON.parse(JSON.stringify(this.departmentData));

                    await this.updateGeoMarkerFeatureListAfterEdit();

                    this.moveUpdatedFeatureToTop(this.selectedFeature.getId());

                    this.layerIdsForSelectedDepartments.forEach(async layerId => {
                        await this.setFilterAgain(layerId);
                    });

                    this.addSingleAlert({
                        content: this.$t("additional:modules.geoMarker.geoMarkerForm.successMessageAfterUpdate"),
                        category: "success"
                    });
                }
            }
            catch (error) {
                console.error("Error updating GeoMarker:", error);
                this.addSingleAlert({
                    content: this.$t("additional:modules.geoMarker.edit.errorMessage"),
                    category: "error"
                });
            }
            finally {
                this.$emit("update-successfull");
                this.savingInProgress = false;
            }
        },
        /**
         * Handles form cancellation
         * @returns {void}
         */
        cancelForm () {
            if (this.mode === "create") {
                this.resetForm();
                this.refreshNewFeaturePointOnMap();
            }
            else {
                this.$emit("cancel-edit");
            }
        },
        /**
         * Refreshes the new feature point on the map and resets draw interaction
         * @returns {Promise<void>}
         */
        refreshNewFeaturePointOnMap () {
            this.setMapInteraction(null);
            this.setMapInteraction("Point");
            this.setNewGeoMarkerFeature(null);
        },
        /**
         * Handles the save action based on the current mode (create or edit)
         * @returns {void}
         */
        handleSave () {
            if (this.mode === "create") {
                this.createNewGeomarker();
            }
            else {
                this.updateExistingGeomarker();
            }
        },
        /**
         * Updates the geoMarkerFeatureList in the store after editing a geomarker.
         * Updates both general geomarker properties and department-specific fields.
         * For departments that are removed, sets their fields to null.
         * @returns {Promise<void>}
         */
        async updateGeoMarkerFeatureListAfterEdit () {
            const updatedList = this.geoMarkerFeatureList.map(feature => {
                if (feature.getId() === this.selectedFeature.getId()) {
                    Object.keys(this.updatedGeoMarker).forEach(key => {
                        if (key !== "id" && this.updatedGeoMarker[key] !== undefined) {
                            feature.set(key, this.updatedGeoMarker[key]);
                        }
                    });

                    const allDepartmentIds = Object.keys(this.departments);

                    allDepartmentIds.forEach(departmentId => {
                        const department = this.departments[departmentId];

                        if (department?.fields) {
                            if (this.departmentData[departmentId]) {
                                Object.entries(department.fields).forEach(([fieldKey, fieldValue]) => {
                                    const departmentFormData = this.departmentData[departmentId];

                                    if (departmentFormData[fieldKey] !== undefined && departmentFormData[fieldKey] !== null) {
                                        if (fieldKey === "wiedervorlage" && departmentFormData[fieldKey]) {
                                            feature.set(fieldValue, dayjs(departmentFormData[fieldKey]).toISOString());
                                        }
                                        else {
                                            feature.set(fieldValue, departmentFormData[fieldKey]);
                                        }
                                    }
                                });
                            }
                            else {
                                Object.values(department.fields).forEach(fieldValue => {
                                    feature.set(fieldValue, null);
                                });
                            }
                        }
                    });

                    return feature;
                }
                return feature;
            });

            this.setGeoMarkerFeatureList(updatedList);
        },
        /**
         * Moves the updated feature to the top of the list
         * @returns {void}
         */
        moveUpdatedFeatureToTop (featureId) {
            const updatedList = [...this.geoMarkerFeatureList],
                updatedFeatureIndex = updatedList.findIndex(
                    feature => feature.getId() === featureId
                );

            if (updatedFeatureIndex > -1) {
                const updatedFeature = updatedList.splice(updatedFeatureIndex, 1)[0];

                updatedList.unshift(updatedFeature);
                this.setGeoMarkerFeatureList(updatedList);
            }
        },
        /**
         * Loads the newly created GeoMarker and displays it in the list
         * @param {Object} transactionFeature - The feature that was just created
         * @returns {Promise<void>}
         */
        async loadNewlyCreatedGeoMarker (transactionFeature, transactionResponse) {
            const relevantLayerIds = this.layerIdsForSelectedDepartments,
                loadPromises = relevantLayerIds.map(layerId => {
                    return new Promise(resolve => {
                        const layer = layerCollection.getLayerById(layerId);

                        if (layer) {
                            const layerSource = layer.getLayerSource();

                            layerSource.once("featuresloadend", () => {
                                setTimeout(() => resolve(), 100);
                            });

                            layerSource.refresh();
                        }
                        else {
                            resolve();
                        }
                    });
                });

            await Promise.all(loadPromises);

            await this.findAndDisplayNewFeature(transactionResponse, relevantLayerIds);

            if (this.isFilterApplied) {
                relevantLayerIds.forEach(layerId => {
                    this.setFilterAgain(layerId);
                });
            }
        },
        /**
         * Filter should be reapplied after geomarker is saved or updated if the filter is already applied.
         * @param {String} layerId The layer id which geomarker is added to.
         */
        setFilterAgain (layerId) {
            const layer = layerCollection.getLayerById(layerId);

            if (layer) {
                const layerSource = layer?.getLayerSource();

                layerSource.once("featuresloadend", () => {
                    const style = layer.getStyleAsFunction(layer.get("style")),
                        allFeaturesOnLayer = layerSource.getFeatures(),
                        geoMarkerFeatureListIds = this.geoMarkerFeatureList.map(feature => feature.getId());

                    allFeaturesOnLayer.forEach(feature => {
                        if (geoMarkerFeatureListIds.includes(feature.getId())) {

                            feature.setStyle(style(feature));
                        }
                        else {
                            feature.setStyle(new Style());
                        }
                    });
                    // this will only work if feature updated, not when there is a new geomarker erstellt
                    if (this.mode === "edit" && this.geoMarkerUpdateFeature?.getId()) {
                        this.setGeoMarkerFeatureListAction();
                    }
                });
                return layerSource.refresh();
            }
            return "";
        },
        /**
         * Finds the newly created feature and displays it in the list
         * @param {Object} transactionResponse - The newly created feature response from transaction
         * @param {Array<String>} relevantLayerIds - Array of layer IDs to search
         * @returns {void}
         */
        findAndDisplayNewFeature (transactionResponse, relevantLayerIds) {
            const list = this.geoMarkerFeatureList,
                feature = layerCollection.getLayerById(relevantLayerIds[0])?.getLayerSource()?.getFeatureById(transactionResponse.featureIds[0]);

            if (feature) {
                list.push(feature);
                this.setGeoMarkerFeatureSelected(feature);
            }

            this.setGeoMarkerFeatureList(list);
        },
        /**
         * Downloads the attachment file associated with the selected geomarker
         * @returns {Promise<void>}
         */
        async downloadAttachment () {
            const base64Data = await this.loadPropertyOfFeatureById({
                    geomarkerId: this.selectedFeature.getId(),
                    propertyName: "anhang_base_64"
                }),
                fileType = this.getFileTypeFromBase64(base64Data),
                link = document.createElement("a");

            if (!base64Data) {
                return;
            }

            this.attachment.base64 = base64Data;

            link.href = base64Data;
            link.download = this.attachment.name;
            link.click();

            if (fileType) {
                this.attachment.type = fileType;
            }
        },
        /**
         * Appends the current current date and the user name at the end of the description.
         * Example: Some text [11.05.2025, username]
         * @param {String|null} description
         * @returns {String} updated description
         */
        appendUserToDescription (description) {
            const userPlaceholder = `${this.currentUsername}]`;

            let newDescription = description?.trim() ?? "";

            if (newDescription && !newDescription.endsWith(userPlaceholder)) {
                newDescription = `${newDescription} [${dayjs().format("DD.MM.YYYY")}, ${userPlaceholder}`;
            }

            return newDescription;
        },
        /**
         * If all departments are closed, return the latest date.
         */
        closedDateIfEveryDepartmentIsClosed () {
            const departmentStatus = Object.keys(this.departmentData).map(departmentId => {
                return this.departmentData[departmentId].status;
            });

            if (!departmentStatus.every(value => value === "geschlossen")) {
                return null;
            }

            // eslint-disable-next-line one-var
            const newestDate = Object.keys(this.departmentData).map(departmentId => {
                return this.departmentData[departmentId].geschlossen;
            })
                .map(date => dayjs(date))
                .sort((a, b) => b.valueOf() - a.valueOf())[0];

            return newestDate
                ? newestDate.toISOString()
                : null;
        }
    }
};
</script>

<template>
    <div class="GeoMarkerForm">
        <div class="formElements">
            <div class="firstRow">
                <GeoMarkerFormBox
                    :title="$t('additional:modules.geoMarker.geoMarkerForm.infoTitle')"
                    class="infoSection"
                >
                    <div class="categoriesSelectBox">
                        <label for="categories">
                            {{ $t("additional:modules.geoMarker.geoMarkerForm.category") }}
                        </label>

                        <select
                            v-if="!isGemisFeatureEditNotAllowed"
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

                        <p
                            v-else
                            class="infoFeatureEditNotAllowed"
                        >
                            {{ $t("additional:modules.geoMarker.geoMarkerForm.gemisNoEditInfo") }}
                        </p>
                    </div>

                    <label for="geomarkerDescription">
                        {{ $t('additional:modules.geoMarker.geoMarkerForm.descriptionLabel') }}
                    </label>

                    <textarea
                        id="geomarkerDescription"
                        v-model="geomarkerDescription"
                        :class="[
                            'form-control',
                            isGemisFeatureEditNotAllowed ? 'no-edit-cursor' : ''
                        ]"
                        :readOnly="isGemisFeatureEditNotAllowed"
                        :rows="mode === 'create' ? '8' : '12'"
                    />

                    <InputText
                        v-if="mode === 'create'"
                        id="reminderDate"
                        v-model="reminderDate"
                        :label="$t('additional:modules.geoMarker.geoMarkerForm.reminderDate')"
                        type="date"
                        :disabled="isGemisFeatureEditNotAllowed"
                        :placeholder="$t('additional:modules.geoMarker.geoMarkerForm.reminderDate')"
                    />
                </GeoMarkerFormBox>

                <GeoMarkerFormBox
                    :title="$t('additional:modules.geoMarker.geoMarkerForm.attachmentTitle')"
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
                                {{ $t("additional:modules.geoMarker.geoMarkerForm.attachmentWarning") }}
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
                                    :aria="$t('additional:modules.geoMarker.geoMarkerForm.removeAttachment')"
                                    icon="bi-trash3"
                                    :interaction="removeAttachment"
                                />
                            </div>
                        </FileUpload>
                        <div
                            v-if="mode==='edit' && attachment"
                            class="editMode"
                        >
                            <FlatButton
                                :aria-label="$t('additional:modules.geoMarker.geoMarkerForm.downloadAttachment')"
                                :text="$t('additional:modules.geoMarker.geoMarkerForm.downloadAttachment')"
                                @click="downloadAttachment"
                            />
                        </div>
                    </div>

                    <div class="screenshot">
                        <p>
                            {{ $t("additional:modules.geoMarker.screenshot.altImage") }}:
                        </p>

                        <CreateScreenshot
                            ref="screenshotComponent"
                            :screenshot-image="screenshotImage"
                            @onScreenshotCreated="onScreenshotCreated"
                            @onScreenshotDeleted="onScreenshotDeleted"
                        />
                    </div>

                    <!-- Overlay for Edit-Not-Allowed -->
                    <div
                        v-if="isGemisFeatureEditNotAllowed"
                        class="attachmentSectionOverlay"
                    />
                </GeoMarkerFormBox>

                <GeoMarkerFormBox
                    :title="$t('additional:modules.geoMarker.geoMarkerForm.departmentsTitle')"
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
                                :disabled="isGemisFeatureEditNotAllowed"
                                :interaction="() => toggleDepartment(departmentId)"
                            />
                        </template>
                    </div>
                </GeoMarkerFormBox>
            </div>

            <div
                v-if="geomarkerClosedDate"
                class="geoMarkerClosed"
            >
                {{ $t('additional:modules.geoMarker.geoMarkerForm.geoMarkerClosedAt') }} <strong>{{ dayjs(geomarkerClosedDate).format("DD.MM.YYYY H:mm") }}</strong>
            </div>

            <div
                v-if="!isGemisFeatureEditNotAllowed"
                class="selectedDepartments"
            >
                <GeoMarkerFormBox
                    class="selectedDepartmentsTableSection"
                    :title="$t('additional:modules.geoMarker.geoMarkerForm.selectedDepartmentsTitle')"
                >
                    <SelectableList
                        v-if="Object.keys(departmentData).length > 0"
                        :table-data="tableDataConfig"
                        :highlight-selection="false"
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
                                @select="handleDepartmentStateSelection(departmentData[cellData.departmentId])"
                            />

                            <div
                                v-if="departmentData[cellData.departmentId].status === 'geschlossen'"
                                class="departmentStatusClosed"
                            >
                                {{ $t("additional:modules.geoMarker.geoMarkerForm.departmentClosedLabel") }}: {{ dayjs(departmentData[cellData.departmentId].geschlossen).format("DD.MM.YYYY H:mm") }}
                            </div>
                        </template>

                        <template #cell-ReminderDate="{ cellData }">
                            <InputText
                                :id="`wiedervorlageDatum-${cellData.departmentId}`"
                                v-model="departmentData[cellData.departmentId].wiedervorlage"
                                :label="$t('additional:modules.geoMarker.geoMarkerForm.reminderDate')"
                                type="date"
                                :disabled="departmentData[cellData.departmentId].status === 'offen'"
                                :placeholder="$t('additional:modules.geoMarker.geoMarkerForm.reminderDate')"
                            />
                        </template>

                        <template #cell-Bemerkung="{ cellData }">
                            <textarea
                                :id="`departmentDescription-${cellData.departmentId}`"
                                v-model="departmentData[cellData.departmentId].bemerkung"
                                class="categoryDescriptionInput form-control"
                                rows="3"
                            />
                        </template>
                    </SelectableList>
                </GeoMarkerFormBox>
            </div>
        </div>

        <div
            v-if="!isGemisFeatureEditNotAllowed"
            class="footer"
        >
            <SwitchInput
                v-if="showCreateAnotherSwitch && mode === 'create'"
                id="createAnotherGeoMarker"
                :label="$t('additional:modules.geoMarker.geoMarkerForm.createAnotherGeoMarker')"
                :aria="$t('additional:modules.geoMarker.geoMarkerForm.createAnotherGeoMarker')"
                :checked="createAnotherGeoMarker"
                :interaction="() => { createAnotherGeoMarker = !createAnotherGeoMarker; }"
            />

            <div class="buttons">
                <FlatButton
                    :aria-label="mode === 'create' ? $t('additional:modules.geoMarker.geoMarkerForm.save') : $t('additional:modules.geoMarker.geoMarkerForm.update')"
                    :text="mode === 'create' ? $t('additional:modules.geoMarker.geoMarkerForm.save') : $t('additional:modules.geoMarker.geoMarkerForm.update')"
                    :disabled="formValidation || savingInProgress"
                    @click="handleSave"
                />

                <FlatButton
                    :aria-label="$t('additional:modules.geoMarker.geoMarkerForm.cancel')"
                    :text="$t('additional:modules.geoMarker.geoMarkerForm.cancel')"
                    :disabled="savingInProgress"
                    @click="cancelForm"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

div.GeoMarkerForm {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    height: 100%;

    div.formElements {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        overflow: auto;
        padding-top: 1rem;
        flex: 1;

        div.geoMarkerClosed {
            color: #FF0000;
            margin-bottom: 0.25rem 0;
            text-align: center;
        }

        div.firstRow {
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
            width: 100%;

            div.infoSection {
                :deep(div.formBoxContent) {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }

                textarea.no-edit-cursor {
                    cursor: default;
                }

                p.infoFeatureEditNotAllowed {
                    margin: 0.25rem 0;
                    font-weight: bold;
                    font-style: italic;
                    cursor: default;
                }
            }

            div.attachmentSection {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                position: relative;

                div.attachment {
                    div.editMode {
                        display: flex;
                        justify-content: center;
                    }
                }
                div.screenshot {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                }

                .attachmentSectionOverlay {
                    position: absolute;
                    top: 0.4rem;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(255,255,255,0.6);
                    z-index: 21;
                    pointer-events: all;
                    border-radius: 0.5rem;
                }
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
                overflow-wrap: anywhere;
            }
        }

        div.selectedDepartmentsTableSection {
            width: 100%;

            .departmentStatusSelect {
                width: 12rem;
            }

            .departmentStatusClosed {
                padding: 0.75rem 0 0 0;
            }
        }
    }

    div.footer {
        display: flex;
        justify-content: space-between;
        padding-top: 1rem;

        div.buttons {
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
        }
    }
}
</style>
