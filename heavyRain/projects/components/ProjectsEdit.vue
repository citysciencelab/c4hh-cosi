<script>
import {convertColor} from "@shared/js/utils/convertColor";
import dayjs from "dayjs";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import HrDraw from "../../shared/components/HrDraw.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters, mapMutations} from "vuex";
import Multiselect from "vue-multiselect";
import {sendWfstTransaction} from "../../shared/js/sendWfstTransaction.js";
import {wfstAttributes, wfstDateFormat, wfstGeometryName} from "../js/wfstSchema.js";

export default {
    name: "ProjectsEdit",
    components: {
        FileUpload,
        HrDraw,
        HrFooter,
        HrSnackbar,
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
        ...mapGetters("Modules/Projects", ["criteria", "wfstId"]),
        ...mapGetters("Maps", ["projectionCode"]),

        /**
         * Gets the values of the form in the structure the transaction expects.
         * @returns {Object} the values of the form.
         */
        formValues () {
            return {
                contactExt: this.contactExt.trim(),
                contactPerson: this.contactPerson.trim(),
                creator: this.creator.trim(),
                criteria: this.chosenCriteria.map(cri => cri.name).join(", "),
                description: this.description.trim(),
                endDate: this.endDate,
                history: this.history.trim(),
                infoLink: this.infoLink.trim(),
                lastUpdate: dayjs().format(wfstDateFormat),
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
            if (!this.chosenCriteria.length) {
                return convertColor(this.criteria[0].color, "rgb");
            }

            const index = [];

            this.chosenCriteria.forEach(chosenCri => {
                index.push(this.criteria.findIndex(cri => cri.name === chosenCri.name));
            });

            return convertColor(this.criteria[Math.min(...index)].color, "rgb");
        }
    },
    methods: {
        ...mapMutations("Modules/Projects", ["setCurrentView"]),

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
                    wfstId: this.wfstId,
                    projectionCode: this.projectionCode,
                    geometry: this.drawnGeometry,
                    formValues: this.formValues,
                    wfstAttributes,
                    wfstGeometryName,
                    transactionMethod: "insert"
                });

                this.$emit("showSnackbarMessage", this.$t("additional:modules.projects.messages.saveSuccess"));
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
                <FileUpload
                    class="mb-5"
                    :change="() => undefined"
                    :drop="() => undefined"
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
