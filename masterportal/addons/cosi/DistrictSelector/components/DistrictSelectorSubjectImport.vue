<script>
import AccordionItem from "@shared/modules/accordion/components/AccordionItem.vue";
import AlertMessage from "../../shared/modules/alerts/components/AlertMessage.vue";
import FileUpload from "@shared/modules/inputs/components/FileUpload.vue";
import {GeoJSON} from "ol/format.js";
import {uniqueId} from "@shared/js/utils/uniqueId";

export default {
    name: "DistrictSelectorSubjectImport",
    components: {
        AccordionItem,
        AlertMessage,
        FileUpload
    },
    props: {
        resetTrigger: {
            type: Number,
            required: false,
            default: 0
        }
    },
    emits: ["set-imported-feature"],
    data () {
        return {
            isFormatValid: true
        };
    },
    watch: {
        resetTrigger () {
            this.isFormatValid = true;
        }
    },
    methods: {
        uniqueId,

        /**
         * Adds the uploaded files for processing
         * @param {FileList} files - The list of uploaded files.
         * @returns {void}
         */
        addFile (files) {
            Array.from(files).forEach(file => {
                const reader = new FileReader();

                if (!file.name.toLowerCase().endsWith(".geojson")) {
                    this.errorMessage = this.$t("additional:modules.cosi.districtSelector.importFileFormatError");
                    this.isFormatValid = false;
                    return;
                }
                reader.readAsText(file);
                reader.onload = evt => {
                    this.parseFeature(evt?.target?.result);
                };
            });
        },

        /**
         * Called when user drops a file in the upload container
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onDrop (e) {
            if (e.dataTransfer.files !== undefined) {
                this.addFile(e.dataTransfer.files);
            }
        },

        /**
         * Called when user uploads a file to process
         * @param {HTMLInputEvent} e event with the files
         * @returns {void}
         */
        onInputChange (e) {
            if (e.target.files !== undefined) {
                this.addFile(e.target.files);
                e.target.value = null;
            }
        },

        /**
         * Called when user clicks to input files
         * @param {HTMLInputEvent} e event with click.
         * @returns {void}
         */
        triggerClickOnFileInput (e) {
            if (e.which === 32 || e.which === 13) {
                this.$refs["upload-input-file"].click();
            }
        },

        /**
         * Parses the uploaded file content and emits the imported feature.
         * @param {String} content - The content of the uploaded file as string.
         * @returns {void}
         */
        parseFeature (content) {
            if (typeof content !== "string") {
                return;
            }

            const geojsonFeature = JSON.parse(content),
                geoJsonParser = new GeoJSON({
                    dataProjection: "EPSG:4326",
                    featureProjection: "EPSG:25832"
                });

            try {
                const olFeatures = geoJsonParser.readFeatures(geojsonFeature);

                this.$emit("set-imported-feature", olFeatures);
                this.isFormatValid = true;
            }
            catch (err) {
                this.errorMessage = this.$t("additional:modules.cosi.districtSelector.importFileValidError");
                this.isFormatValid = false;
            }
        }
    }
};
</script>

<template lang="html">
    <AccordionItem
        :id="uniqueId()"
        :is-open="false"
        :icon="'bi bi-arrow-bar-up'"
        :title="$t('additional:modules.cosi.districtSelector.importHeader')"
    >
        <FileUpload
            :id="'District-Selector-Upload'"
            :keydown="(e) => triggerClickOnFileInput(e)"
            :change="(e) => onInputChange(e)"
            :drop="(e) => onDrop(e)"
        >
            <div class="file-upload mt-2">
                {{ $t("additional:modules.cosi.districtSelector.fileUploadFormat") }}
            </div>
        </FileUpload>
    </AccordionItem>
    <AlertMessage
        v-if="!isFormatValid"
        :closeable="true"
        :type="'error'"
        :text="errorMessage"
        @closed="isFormatValid = true"
    />
</template>

<style lang="scss" scoped>
    .file-upload {
        color: $dark_grey;
        font-size: 0.9rem;
        opacity: 0.6;
    }
</style>
