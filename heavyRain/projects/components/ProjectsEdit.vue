<script>
import {convertColor} from "@shared/js/utils/convertColor";
import dayjs from "dayjs";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import {getDownloadFileName, hasAllowedExtension} from "../../shared/js/fileData.js";
import {getGeometryCenter} from "../../shared/js/getGeometryCenter.js";
import HrDraw from "../../shared/components/HrDraw.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import {sendWfstTransaction} from "../../shared/js/sendWfstTransaction.js";
import {setWfstFeatureVisibility} from "../../shared/js/setWfstFeatureVisibility.js";

export default {
    name: "ProjectsEdit",
    components: {
        FileUpload,
        HrDraw,
        HrFooter,
        HrSnackbar,
        IconButton,
        InputText,
        Multiselect
    },
    data () {
        return {
            chosenCriteria: [],
            contactExt: "",
            contactPerson: "",
            creator: "",
            description: "",
            drawnGeometry: null,
            endDate: "",
            history: "",
            file: undefined,
            fileName: undefined,
            infoLink: "",
            invalid: false,
            isSaving: false,
            projectName: "",
            protectedAreas: "",
            showSnackbar: false,
            snackbarColor: "error",
            snackbarMessage: "",
            source: "",
            startDate: ""
        };
    },
    computed: {
        ...mapGetters("Modules/Projects", ["allowedFileExtensions", "criteria", "currentProject", "maxFileSize", "wfstAttributes", "wfstDateFormat", "wfstGeometryName", "wfstLayerId"]),
        ...mapGetters("Maps", ["projectionCode"]),

        /**
         * Gets the allowed file types for the file dialog, e.g. ".pdf,.docx".
         * @returns {String} the allowed file types.
         */
        acceptedFileTypes () {
            return this.allowedFileExtensions.map(extension => `.${extension}`).join(",");
        },

        /**
         * Gets the name of the uploaded or saved file for the display in the form.
         * The name of a saved file is not known, so it is created from the name of the project.
         * @returns {String} the name of the file.
         */
        displayedFileName () {
            return getDownloadFileName(this.file, this.fileName, this.projectName);
        },

        /**
         * Gets the values of the form in the structure the transaction expects.
         * @returns {Object} the values of the form.
         */
        formValues () {
            return {
                contactExt: this.contactExt.trim(),
                contactPerson: this.contactPerson.trim(),
                creator: this.creator.trim(),
                createdAt: dayjs().format(this.wfstDateFormat),
                criteria: this.chosenCriteria.map(cri => cri.name).join(", "),
                description: this.description.trim(),
                endDate: this.endDate,
                file: this.file,
                fileName: this.fileName,
                history: this.history.trim(),
                infoLink: this.infoLink.trim(),
                lastUpdate: dayjs().format(this.wfstDateFormat),
                projectName: this.projectName.trim(),
                protectedAreas: this.protectedAreas.trim(),
                source: this.source.trim(),
                startDate: this.startDate
            };
        },

        /**
         * Gets if an area was drawn on the map.
         * @returns {Boolean} true if there is a drawn area.
         */
        hasDrawnGeometry () {
            return this.drawnGeometry !== null;
        },

        /**
         * Gets the stroke color for draw style.
         * @returns {Number[]} the rgb color code.
         */
        strokeColor () {
            const index = this.chosenCriteria
                .map(chosenCri => this.criteria.findIndex(cri => cri.name === chosenCri?.name))
                .filter(idx => idx >= 0);

            if (!index.length) {
                return convertColor(this.criteria[0]?.color, "rgb");
            }

            return convertColor(this.criteria[Math.min(...index)].color, "rgb");
        }
    },
    created () {
        this.chosenCriteria = [this.criteria[0]];
    },
    mounted () {
        // the edited feature is hidden, as its geometry is edited on the draw layer
        setWfstFeatureVisibility(this.wfstLayerId, this.currentProject?.id, false);
        if (typeof this.currentProject !== "undefined") {
            this.chosenCriteria = this.getChosenCriteria(this.currentProject?.formValues?.criteria);
            this.projectName = this.currentProject?.formValues?.projectName;
            this.creator = this.currentProject?.formValues?.creator;
            this.contactPerson = this.currentProject?.formValues?.contactPerson;
            this.startDate = this.currentProject?.formValues?.startDate;
            this.endDate = this.currentProject?.formValues?.endDate;
            // a project without file has an empty value in the service, it is set to undefined to show no file
            this.file = this.currentProject?.formValues?.file || undefined;
            this.fileName = this.currentProject?.formValues?.fileName;
            this.source = this.currentProject?.formValues?.source;
            this.description = this.currentProject?.formValues?.description;
            this.contactExt = this.currentProject?.formValues?.contactExt;
            this.infoLink = this.currentProject?.formValues?.infoLink;
            this.history = this.currentProject?.formValues?.history;
            this.protectedAreas = this.currentProject?.formValues?.protectedAreas;
            this.drawnGeometry = this.currentProject?.geometry;
        }
    },
    unmounted () {
        setWfstFeatureVisibility(this.wfstLayerId, this.currentProject?.id, true);
    },
    methods: {
        ...mapActions("Maps", ["placingPointMarker"]),
        ...mapMutations("Modules/Projects", ["setCurrentView", "setCurrentProject"]),

        /**
         * Gets the parsed chosen criteria.
         * @param {String} value the criteria in string.
         * @returns {Object[]} the chosen criteria.
         */
        getChosenCriteria (value) {
            const result = [];

            if (typeof value !== "string" || value === "") {
                return result;
            }

            value.split(",").forEach(val => {
                result.push(...this.criteria.filter(cri => cri.name === val.trim()));
            });

            return result;
        },

        /**
         * Deletes the uploaded or saved file. When an edited project is saved, the file is removed in the service.
         * @returns {void}
         */
        removeFile () {
            this.file = undefined;
            this.fileName = undefined;
        },

        /**
         * Loads the file and stores it.
         * A file with a type which is not allowed or which is larger than the maximum size is rejected with a message.
         * @param {Event} event the change or drop event of the file upload.
         * @returns {void}
         */
        async loadFile (event) {
            const file = event?.dataTransfer?.files?.[0] ?? event?.target?.files?.[0],
                  reader = new FileReader();

            if (!file) {
                return;
            }

            if (!hasAllowedExtension(file, this.allowedFileExtensions)) {
                this.showErrorMessage(this.$t("additional:modules.projects.messages.fileTypeNotAllowed", {
                    fileName: file.name,
                    fileTypes: this.allowedFileExtensions.join(", ")
                }));
                return;
            }

            if (file.size > this.maxFileSize) {
                this.showErrorMessage(this.$t("additional:modules.projects.messages.fileTooLarge", {
                    fileName: file.name,
                    maxSize: this.maxFileSize / (1024 * 1024)
                }));
                return;
            }

            this.fileName = file.name;

            reader.onload = () => {
                this.file = reader.result;
                this.$emit("showSnackbarMessage", this.$t("additional:modules.projects.messages.fileUpload", {fileName: this.fileName}));
            };

            reader.readAsDataURL(file);
        },

        /**
         * Handles the save action and sends the project to the WFS-T service.
         * @returns {Promise<void>} resolves when the transaction is finished.
         */
        async onSave () {
            if (this.isSaving) {
                return;
            }

            if (this.projectName.trim() === "" || this.creator.trim() === "" || this.contactPerson.trim() === "") {
                this.invalid = true;
                this.showErrorMessage(this.$t("additional:modules.projects.messages.invalid"));
                return;
            }

            this.invalid = false;

            if (!this.hasDrawnGeometry) {
                this.showErrorMessage(this.$t("additional:modules.projects.messages.drawFirst"));
                return;
            }

            this.isSaving = true;

            try {
                await sendWfstTransaction({
                    wfstId: this.wfstLayerId,
                    projectionCode: this.projectionCode,
                    geometry: this.drawnGeometry,
                    formValues: this.formValues,
                    wfstAttributes: this.wfstAttributes,
                    wfstGeometryName: this.wfstGeometryName,
                    featureId: this.currentProject?.id
                });

                layerCollection.getLayerById(this.wfstLayerId)?.getLayerSource()?.refresh();
                this.$emit("showSnackbarMessage", this.$t("additional:modules.projects.messages.saveSuccess"));
                this.setCurrentProject({
                    id: this.currentProject?.id,
                    geometry: this.drawnGeometry,
                    formValues: this.formValues
                });
                this.placingPointMarker(getGeometryCenter(this.drawnGeometry));
                this.setCurrentView("main");
            }
            catch (error) {
                console.error(error);
                this.showErrorMessage(this.$t("additional:modules.projects.messages.saveError"));
            }
            finally {
                this.isSaving = false;
            }
        },

        /**
         * Shows the given message in the snackbar of the form.
         * @param {String} message the message to display.
         * @returns {void}
         */
        showErrorMessage (message) {
            this.snackbarMessage = message;
            this.snackbarColor = "error";
            this.showSnackbar = true;
        }
    }
};
</script>

<template lang="html">
    <div class="projects-edit mt-3">
        <div class="mb-4">
            <h5 class="headline mb-3">
                {{ $t('additional:modules.projects.createProject') || $t('additional:modules.projects.editProject') }}
            </h5>
            <p>{{ $t('additional:modules.projects.description') }}</p>
        </div>

        <div>
            <h5 class="mb-3">
                {{ $t('additional:modules.projects.drawTitle') }}
            </h5>
            <HrDraw
                class="mb-4"
                :geometry="currentProject?.geometry"
                :stroke-color="strokeColor"
                @update:drawn-geometry="drawnGeometry = $event"
            />
        </div>

        <hr class="my-4">

        <div class="row g-3">
            <div class="col-12">
                <h5 class="mb-1">
                    {{ $t('additional:modules.projects.detailsTitle') }}
                </h5>
                <p>{{ $t('additional:modules.projects.detailsDescription') }}</p>
            </div>

            <div class="col-12">
                <InputText
                    id="project-name"
                    v-model="projectName"
                    :class="projectName.trim() === '' && invalid ? 'invalid': ''"
                    :label="$t('additional:modules.projects.labels.projectName')"
                    :placeholder="$t('additional:modules.projects.labels.projectName')"
                />
            </div>

            <div class="col-12 criteria-select">
                <Multiselect
                    id="criteria"
                    v-model="chosenCriteria"
                    :aria-label="$t('additional:modules.projects.labels.criteria')"
                    :options="criteria"
                    name="criteria"
                    :multiple="true"
                    :placeholder="$t('additional:modules.projects.labels.criteria')"
                    :tabindex="-1"
                    :close-on-select="false"
                    :clear-on-select="false"
                    :show-labels="false"
                    :limit="3"
                    :limit-text="count => count + ' ' + $t('common:modules.statisticDashboard.label.more')"
                    :taggable="true"
                    track-by="color"
                    label="name"
                >
                    {{ chosenCriteria }}
                </Multiselect>
            </div>

            <div class="col-12">
                <InputText
                    id="createdBy"
                    v-model="creator"
                    :class="creator.trim() === '' && invalid ? 'invalid': ''"
                    :label="$t('additional:modules.projects.labels.createdBy')"
                    :placeholder="$t('additional:modules.projects.labels.createdBy')"
                />
            </div>

            <div class="col-6">
                <InputText
                    id="startDate"
                    v-model="startDate"
                    type="date"
                    :label="$t('additional:modules.projects.labels.startDate')"
                    :placeholder="'YYYY-MM-DD'"
                />
            </div>
            <div class="col-6">
                <InputText
                    id="endDate"
                    v-model="endDate"
                    type="date"
                    :label="$t('additional:modules.projects.labels.endDate')"
                    :placeholder="'YYYY-MM-DD'"
                />
            </div>

            <div class="col-12">
                <InputText
                    id="quelle"
                    v-model="source"
                    :label="$t('additional:modules.projects.labels.source')"
                    :placeholder="$t('additional:modules.projects.labels.source')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="contact"
                    v-model="contactPerson"
                    :class="contactPerson.trim() === '' && invalid ? 'invalid': ''"
                    :label="$t('additional:modules.projects.labels.contact')"
                    :placeholder="$t('additional:modules.projects.labels.contact')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="description"
                    v-model="description"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.description')"
                    :placeholder="$t('additional:modules.projects.labels.description')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="contactExt"
                    v-model="contactExt"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.contactExt')"
                    :placeholder="$t('additional:modules.projects.labels.contactExt')"
                />
            </div>
            <div class="col-12">
                <InputText
                    id="infolink"
                    v-model="infoLink"
                    :label="$t('additional:modules.projects.labels.infolink')"
                    :placeholder="'https://...'"
                />
            </div>

            <div class="col-12">
                <InputText
                    id="history"
                    v-model="history"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.history')"
                    :placeholder="$t('additional:modules.projects.labels.history')"
                />
            </div>

            <div class="col-12">
                <InputText
                    id="protectedAreas"
                    v-model="protectedAreas"
                    html-type="textarea"
                    :label="$t('additional:modules.projects.labels.protectedAreas')"
                    :placeholder="$t('additional:modules.projects.labels.protectedAreas')"
                />
            </div>

            <div class="col-12">
                <h5 class="mb-2">
                    {{ $t('additional:modules.projects.labels.fileUpload') }}
                </h5>
                <div
                    v-if="typeof file !== 'undefined'"
                    class="d-flex align-items-center gap-3 mb-2"
                >
                    <i class="bi bi-file-earmark fs-3" />
                    <span class="flex-grow-1 text-break">
                        {{ displayedFileName }}
                    </span>
                    <div class="file-remove ms-auto">
                        <IconButton
                            :class-array="['btn-primary']"
                            :aria="$t('additional:modules.projects.labels.removeFile')"
                            icon="bi bi-trash"
                            :interaction="removeFile"
                            :label="$t('additional:modules.projects.labels.removeFile')"
                        />
                    </div>
                </div>
                <FileUpload
                    class="mb-5"
                    :change="loadFile"
                    :drop="loadFile"
                    :multiple="false"
                    :accept="acceptedFileTypes"
                />
            </div>
        </div>
        <HrSnackbar
            :model-value="showSnackbar"
            :message="snackbarMessage"
            :color="snackbarColor"
            @update:model-value="val => showSnackbar = val"
        />
        <HrFooter
            :cancel-text="$t('additional:modules.projects.cancelButtonLabel')"
            :save-text="$t('additional:modules.projects.saveButtonLabel')"
            @click:save="onSave"
            @click:cancel="setCurrentView('main')"
        />
    </div>
</template>

<style src="vue-multiselect/dist/vue-multiselect.css"></style>

<style lang="scss" scoped>
.projects-edit {
    .form-label {
        color: var(--bs-secondary);
    }
}
// the label is centered below the icon, so the wrapper of the button is only as wide as the label
.file-remove :deep(.btn-wrapper) {
    width: auto;
}

.headline {
    color: #3C5F94;
    font-family: "MasterPortalFont Bold", "Arial Narrow Bold", Arial, sans-serif;
}
</style>

<style lang="scss">
.criteria-select .multiselect__strong{
    font-family: "MasterPortalFont Bold";
}

.criteria-select .multiselect__placeholder {
    color: #8f8f8f;
}

.criteria-select .multiselect__tag {
    background: $light_blue;
    padding: 4px 20px 4px 10px;
    border-radius: 50px;
    border: none;
}

.criteria-select .difference-modal .multiselect__tag {
    padding: 4px 26px 4px 10px;
    border-radius: 10px;
}
.criteria-select .multiselect__tag:hover {
    background: $dark_blue;
    color: $white;
}
.criteria-select .multiselect .multiselect__tag i::before {
    vertical-align: middle;
}
.criteria-select .multiselect .multiselect__tag i::after {
    color: $dark_blue;
}
.criteria-select .multiselect__clear {
    position: absolute;
    font-size: 12px;
    top: 12px;
    left: 9px;
}

.criteria-select .multiselect__option--selected.multiselect__option--highlight,
.criteria-select .multiselect__option--selected.multiselect__option--highlight:after,
.criteria-select .multiselect__option:after,
.criteria-select .multiselect__option--selected,
.criteria-select .multiselect__option--selected:after,
.criteria-select .multiselect__tag {
  color: $black;
  font-weight: normal;
}

.criteria-select .multiselect__option--highlight,
.criteria-select .multiselect__option--highlight:after {
    background: $secondary;
}

.invalid {
    outline: 0;
    box-shadow: inset 0 1px 2px rgba(225, 0, 25, 0.075), 0 0 0 0.25rem rgba(225, 0, 25, 0.25);
}
</style>
