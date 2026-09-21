<script>
import {convertColor} from "@shared/js/utils/convertColor";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import HrDraw from "../../shared/components/HrDraw.vue";
import HrFooter from "../../shared/components/HrFooter.vue";
import HrSnackbar from "../../shared/components/HrSnackbar.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {mapGetters} from "vuex";

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
            creationDate: new Date().toLocaleDateString("de-DE"),
            invalid: false,
            showSnackbar: false,
            snackbarMessage: "",
            snackbarColor: "error"
        };
    },
    computed: {
        ...mapGetters("Modules/UpdateRequirements", ["informationType"]),

        /**
         * Gets the stroke color for draw style.
         * @returns {Number[]} the rgb color code.
         */
        strokeColor () {
            return convertColor(this.currentOpinion?.color, "rgb");
        }
    },
    mounted () {
        this.currentOpinion = this.informationType[0];
    },
    methods: {
        /**
         * Handles the save action.
         * @returns {void}
         */
        onSave () {
            if (this.name.trim() === "" || this.initiator.trim() === "" || this.contactPerson.trim() === "") {
                this.snackbarMessage = this.$t("additional:modules.updateRequirements.messages.invalid");
                this.showSnackbar = true;
                this.invalid = true;
                return;
            }

            this.invalid = false;
            this.$emit("showSnackbarMessage", this.$t("additional:modules.updateRequirements.messages.saveSuccess"));
            this.$emit("click:save");
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
            :heading="$t('additional:modules.updateRequirements.drawHeading')"
            :stroke-color="strokeColor"
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
            html-type="textarea"
            :label="$t('additional:modules.updateRequirements.form.commentOptional')"
            :placeholder="$t('additional:modules.updateRequirements.form.commentOptional')"
        />
        <InputText
            id="update-requirements-infolink"
            :label="$t('additional:modules.updateRequirements.form.infolinkOptional')"
            :placeholder="$t('additional:modules.updateRequirements.form.infolinkOptional')"
        />
        <h5 class="mb-2">
            {{ $t('additional:modules.updateRequirements.form.uploadOptional') }}
        </h5>
        <FileUpload
            class="mb-5"
            :change="() => undefined"
            :drop="() => undefined"
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
