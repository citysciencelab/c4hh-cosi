<script>
import {convertColor} from "@shared/js/utils/convertColor";
import dayjs from "dayjs";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import {formatDate} from "../../shared/js/formatDate.js";
import {getGeometryCenter} from "../../shared/js/getGeometryCenter.js";
import HrDraw from "../../shared/components/HrDraw.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import layerCollection from "@core/layers/js/layerCollection.js";
import {mapActions, mapGetters, mapMutations} from "vuex";
import {sendWfstTransaction} from "../../shared/js/sendWfstTransaction.js";
import {setWfstFeatureVisibility} from "../../shared/js/setWfstFeatureVisibility.js";

export default {
    name: "UpdateEdit",
    components: {
        FileUpload,
        HrDraw,
        HrFooter,
        HrSnackbar,
        InputText
    },
    emits: ["showSnackbarMessage", "click:save", "click:cancel"],
    data () {
        return {
            currentOpinion: undefined,
            name: "",
            initiator: "",
            contactPerson: "",
            comment: "",
            image: undefined,
            imageName: undefined,
            infoLink: "",
            createdAt: dayjs(),
            drawnGeometry: null,
            invalid: false,
            isSaving: false,
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "error"
        };
    },
    computed: {
        ...mapGetters("Modules/UpdateRequirements", ["informationType", "currentRequirement", "wfstAttributes", "wfstDateFormat", "wfstGeometryName", "wfstLayerId"]),
        ...mapGetters("Maps", ["projectionCode"]),

        /**
         * Gets the creation date of the report for the display in the form.
         * @returns {String} the creation date.
         */
        creationDate () {
            return this.createdAt.format("DD.MM.YYYY");
        },

        /**
         * Gets the values of the form in the structure the transaction expects.
         * @returns {Object} the values of the form.
         */
        formValues () {
            return {
                name: this.name.trim(),
                initiator: this.initiator.trim(),
                creationDate: this.createdAt.format(this.wfstDateFormat),
                informationType: this.currentOpinion ? `${this.currentOpinion.cat} ${this.currentOpinion.name}` : "",
                contactPerson: this.contactPerson.trim(),
                comment: this.comment.trim(),
                image: this.image,
                imageName: this.imageName,
                infoLink: this.infoLink.trim(),
                lastUpdate: dayjs().format(this.wfstDateFormat)
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
            return convertColor(this.currentOpinion?.color, "rgb");
        }
    },
    mounted () {
        // the edited feature is hidden, as its geometry is edited on the draw layer
        setWfstFeatureVisibility(this.wfstLayerId, this.currentRequirement?.id, false);
        if (typeof this.currentRequirement !== "undefined") {
            this.name = this.currentRequirement?.formValues?.name;
            this.initiator = this.currentRequirement?.formValues?.initiator;
            this.image = this.currentRequirement?.formValues?.image;
            this.imageName = this.currentRequirement?.formValues?.imageName;
            this.contactPerson = this.currentRequirement?.formValues?.contactPerson;
            this.currentOpinion = this.getCurrentOption(this.currentRequirement?.formValues?.informationType) || this.informationType[0];
            this.comment = this.currentRequirement?.formValues?.comment;
            this.infoLink = this.currentRequirement?.formValues?.infoLink;
            this.drawnGeometry = this.currentRequirement?.geometry;
            this.createdAt = this.getCreatedAt(this.currentRequirement?.formValues?.creationDate);
        }
        else {
            this.currentOpinion = this.informationType[0];
        }
    },
    unmounted () {
        setWfstFeatureVisibility(this.wfstLayerId, this.currentRequirement?.id, true);
    },
    methods: {
        ...mapActions("Maps", ["placingPointMarker"]),
        ...mapMutations("Modules/UpdateRequirements", ["setCurrentRequirement"]),

        /**
         * Gets the creation date of an edited report, so that it is kept when saving.
         * A report without a valid creation date gets the current date.
         * @param {String} value the creation date of the service, e.g. "2026-09-28" or "2026-09-28Z".
         * @returns {Object} the creation date as dayjs object.
         */
        getCreatedAt (value) {
            const date = dayjs(formatDate(value, "YYYY-MM-DD"));

            return date.isValid() ? date : dayjs();
        },

        /**
         * Gets the current option.
         * @param {String} value the current option in string
         * @returns {Object|undefined} the current option object or undefined, if no option matches.
         */
        getCurrentOption (value) {
            if (typeof value !== "string" || value.trim() === "") {
                return undefined;
            }

            return this.informationType.find(type => `${type.cat} ${type.name}` === value.trim());
        },

        /**
         * Loads the image and stores it.
         * @param {Event} event
         */
        async loadImage (event) {
            const file = event?.dataTransfer?.files?.[0] ?? event?.target?.files?.[0],
                  reader = new FileReader();

            this.imageName = file.name;

            reader.onload = () => {
                this.image = reader.result;
                this.$emit("showSnackbarMessage", this.$t("additional:modules.updateRequirements.messages.imageLoad", {imageName: this.imageName}));
            };

            reader.readAsDataURL(file);
        },

        /**
         * Handles the save action and sends the report to the WFS-T service.
         * @returns {Promise<void>} resolves when the transaction is finished.
         */
        async onSave () {
            if (this.isSaving) {
                return;
            }

            if (this.name.trim() === "" || this.initiator.trim() === "" || this.contactPerson.trim() === "") {
                this.invalid = true;
                this.showErrorMessage(this.$t("additional:modules.updateRequirements.messages.invalid"));
                return;
            }

            this.invalid = false;

            if (!this.hasDrawnGeometry) {
                this.showErrorMessage(this.$t("additional:modules.updateRequirements.messages.missingGeometry"));
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
                    featureId: this.currentRequirement?.id
                });

                layerCollection.getLayerById(this.wfstLayerId)?.getLayerSource()?.refresh();
                this.setCurrentRequirement({
                    id: this.currentRequirement?.id,
                    geometry: this.drawnGeometry,
                    formValues: this.formValues
                });
                this.placingPointMarker(getGeometryCenter(this.drawnGeometry));
                this.$emit("showSnackbarMessage", this.$t("additional:modules.updateRequirements.messages.saveSuccess"));
                this.$emit("click:save");
            }
            catch (error) {
                console.error(error);
                this.showErrorMessage(this.$t("additional:modules.updateRequirements.messages.saveError"));
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
    <div class="update-edit">
        <h5 class="headline mb-3">
            {{ $t('additional:modules.updateRequirements.createFormTitle') }}
        </h5>
        <p class="mb-3">
            {{ $t('additional:modules.updateRequirements.createNewDescriptionFirst') }}
        </p>
        <p class="mb-5">
            {{ $t('additional:modules.updateRequirements.createNewDescriptionSecond') }}
        </p>
        <HrDraw
            class="mb-4"
            :geometry="currentRequirement?.geometry"
            :heading="$t('additional:modules.updateRequirements.drawHeading')"
            :stroke-color="strokeColor"
            @update:drawn-geometry="drawnGeometry = $event"
        />
        <InputText
            id="update-requirements-name"
            v-model="name"
            :class="name.trim() === '' && invalid ? 'invalid': ''"
            :label="$t('additional:modules.updateRequirements.form.name')"
            :placeholder="$t('additional:modules.updateRequirements.form.name')"
        />
        <InputText
            id="update-requirements-initiator"
            v-model="initiator"
            :class="initiator.trim() === '' && invalid ? 'invalid': ''"
            :label="$t('additional:modules.updateRequirements.form.initiator')"
            :placeholder="$t('additional:modules.updateRequirements.form.initiator')"
        />
        <InputText
            id="update-requirements-creation-date"
            :model-value="creationDate"
            readonly
            :label="$t('additional:modules.updateRequirements.form.creationDate')"
            :placeholder="$t('additional:modules.updateRequirements.form.creationDate')"
        />
        <div class="form-floating mb-3">
            <select
                id="update-requirements-type"
                v-model="currentOpinion"
                class="form-select"
            >
                <option
                    v-for="(data, key) in informationType"
                    :key="key"
                    :value="data"
                >
                    {{ data.cat + " " + data.name }}
                </option>
            </select>
            <label for="update-requirements-type">
                {{ $t('additional:modules.updateRequirements.form.typeOptional') }}
            </label>
        </div>
        <InputText
            id="update-requirements-contact"
            v-model="contactPerson"
            :class="contactPerson.trim() === '' && invalid ? 'invalid': ''"
            :label="$t('additional:modules.updateRequirements.form.contact')"
            :placeholder="$t('additional:modules.updateRequirements.form.contact')"
        />
        <InputText
            id="update-requirements-comment"
            v-model="comment"
            html-type="textarea"
            :label="$t('additional:modules.updateRequirements.form.commentOptional')"
            :placeholder="$t('additional:modules.updateRequirements.form.commentOptional')"
        />
        <InputText
            id="update-requirements-infolink"
            v-model="infoLink"
            :label="$t('additional:modules.updateRequirements.form.infolinkOptional')"
            :placeholder="$t('additional:modules.updateRequirements.form.infolinkOptional')"
        />
        <h5 class="mb-2">
            {{ $t('additional:modules.updateRequirements.form.uploadOptional') }}
        </h5>
        <div
            v-if="typeof image !== 'undefined'"
            class="mb-2"
        >
            {{ $t("additional:modules.updateRequirements.messages.imageLoad", {imageName: imageName}) }}
        </div>
        <FileUpload
            class="mb-5"
            :change="loadImage"
            :drop="loadImage"
            :multiple="false"
            accept="image/*"
        />
        <HrSnackbar
            :model-value="showSnackbar"
            :message="snackbarMessage"
            :color="snackbarColor"
            @update:model-value="val => showSnackbar = val"
        />
        <HrFooter
            :cancel-text="$t('additional:modules.updateRequirements.cancelButtonLabel')"
            :save-text="$t('additional:modules.updateRequirements.saveButtonLabel')"
            @click:save="onSave"
            @click:cancel="$emit('click:cancel')"
        />
    </div>
</template>

<style lang="scss" scoped>
.headline {
    color: $secondary;
    font-family: $font-family_accent;
}

.invalid {
    outline: 0;
    box-shadow: inset 0 1px 2px rgba(225, 0, 25, 0.075), 0 0 0 0.25rem rgba(225, 0, 25, 0.25);
}
</style>
