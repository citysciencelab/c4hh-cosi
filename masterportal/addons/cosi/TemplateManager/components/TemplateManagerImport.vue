<script>

import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import getters from "../store/gettersTemplateManager";
import {mapGetters} from "vuex";

export default {
    name: "TemplateManagerImport",
    components: {
        AlertMessage,
        FlatButton
    },
    data () {
        return {
            errorInfo: undefined
        };
    },
    computed: {
        ...mapGetters("Modules/TemplateManager", Object.keys(getters))
    },
    methods: {
        /**
         * Triggers the click event on the file input to open the explorer.
         * @returns {void}
         */
        triggerFileInput () {
            this.$el.querySelector("#file-input").click();
        },

        /**
         * Loading the data from files.
         * @param {Event} evt - A input change event.
         * @returns {void}
         */
        loadFiles (evt) {
            for (const file of evt.target.files) {
                if (!file.type.match("application/json")) {
                    this.errorInfo = file.name + ": " + this.$t("additional:modules.tools.cosi.templateManager.errors.wrongFileFormat");

                    continue;
                }
                const reader = new FileReader();

                reader.onload = this.parseFileContent;
                reader.readAsText(file);
            }
            this.$refs.form.reset();
        },

        /**
         * Parses the file content to JSON and emits it.
         * @param {Event} evt - A file reader load event.
         * @returns {void}
         */
        parseFileContent (evt) {
            let template = {};

            try {
                template = JSON.parse(evt?.target?.result);
            }
            catch (err) {
                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.invalid");

                return;
            }

            if (!Object.prototype.hasOwnProperty.call(template, "meta")) {
                const attribute = "Meta";

                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.invalid") + " " + this.$t("additional:modules.tools.cosi.templateManager.errors.attErr", {attribute});

                return;
            }
            if (!Object.prototype.hasOwnProperty.call(template?.meta, "title")) {
                const attribute = "Title";

                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.invalid") + " " + this.$t("additional:modules.tools.cosi.templateManager.errors.attErr", {attribute});

                return;
            }
            if (!Object.prototype.hasOwnProperty.call(template, "state")) {
                const attribute = "State";

                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.invalid") + " " + this.$t("additional:modules.tools.cosi.templateManager.errors.attErr", {attribute});

                return;
            }
            if (!Object.prototype.hasOwnProperty.call(template?.state, "Tools")) {
                const attribute = "Tools";

                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.invalid") + " " + this.$t("additional:modules.tools.cosi.templateManager.errors.attErr", {attribute});

                return;
            }
            if (!Object.prototype.hasOwnProperty.call(template?.state?.Tools, "Dashboard")) {
                const attribute = "Dashboard";

                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.invalid") + " " + this.$t("additional:modules.tools.cosi.templateManager.errors.attErr", {attribute});

                return;
            }
            if (!Object.prototype.hasOwnProperty.call(template?.state?.Tools?.Dashboard, "statsFeatureFilter")) {
                const attribute = "statsFeatureFilter";

                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.invalid") + " " + this.$t("additional:modules.tools.cosi.templateManager.errors.attErr", {attribute});

                return;
            }

            if (Array.isArray(this.importedTemplateNames) && this.importedTemplateNames.includes(template?.meta?.title)) {
                this.errorInfo = this.$t("additional:modules.tools.cosi.templateManager.errors.templateName") + template?.meta?.title + " " + this.$t("additional:modules.tools.cosi.templateManager.errors.isLoaded");

                return;
            }

            this.errorInfo = undefined;
            this.importedTemplateNames.push(template?.meta?.title);

            this.$emit("addTemplate", template);
        },

        /**
         * Resets the error info into undefined.
         * @returns {void}
         */
        resetErrorInfo () {
            this.errorInfo = undefined;
        }
    }
};
</script>

<template lang="html">
    <div id="template-manager-import">
        <FlatButton
            id="confirmButton"
            icon="bi-upload"
            type="button"
            :aria-label="$t('additional:modules.tools.cosi.templateManager.importTemplate')"
            :text="$t('additional:modules.tools.cosi.templateManager.importTemplate')"
            :interaction="triggerFileInput"
        />
        <form ref="form">
            <label for="file-input">
                <input
                    id="file-input"
                    type="file"
                    multiple
                    class="d-none"
                    @change="loadFiles"
                >
            </label>
        </form>
        <AlertMessage
            v-if="typeof errorInfo !== 'undefined'"
            :closeable="true"
            :text="errorInfo"
            type="error"
            @closed="resetErrorInfo"
        />
    </div>
</template>

<style lang="scss" scoped>
    #template-manager-import {
        font-family: $font_family_default;

        .btn-outline {
            border-color: $light_blue;
            color: $light_blue;
        }
       .btn-outline:hover {
            cursor: pointer;
            background-color: $light_blue;
            color: $white;
       }

       form {
            height: 0;
       }
    }

</style>
