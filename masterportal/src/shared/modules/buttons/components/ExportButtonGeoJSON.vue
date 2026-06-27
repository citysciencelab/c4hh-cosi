<script>
import dayjs from "dayjs";
import {
    downloadBlobPerNavigator,
    downloadBlobPerHTML5
} from "../js/exportButtonUtils.js";

/**
 * ExportButtonGeoJSON component: A component for handling, preparing and downloading Data in geojson format.
 * @module shared/modules/buttons/ExportButtonGeoJSON
 * @vue-prop {string} title is the label of the Button. An i18next-String can be used for internationalization.
 * @vue-prop {Array<(Object|boolean)>} data is the geojson data to be downloaded, provided as either a String.
 * @vue-prop {(string|boolean)} filename sets the prefix of the filename. Can be set to false to use "download".
 * @vue-prop {string} postfixFormat sets the dayjs format to be used as a postfix for filename. Only used if filename is not a boolean value.
 */
export default {
    name: "ExportButtonGeoJSON",
    props: {
        title: {
            type: String,
            required: false,
            default: "common:shared.modules.buttons.download"
        },
        data: {
            type: String,
            required: false,
            default: ""
        },
        filename: {
            type: [String, Boolean],
            required: false,
            default: false
        },
        postfixFormat: {
            type: String,
            required: false,
            default: "_YYYY-MM-DD_HH-mm-ss"
        }
    },
    data () {
        return {
            downloadDisabled: false
        };
    },
    methods: {
        /**
         * enables the button
         * @post the button is enabled
         * @returns {void}
         */
        enableDownload () {
            this.downloadDisabled = false;
        },
        /**
         * disables the button
         * @post the button is disabled
         * @returns {void}
         */
        disableDownload () {
            this.downloadDisabled = true;
        },
        /**
         * enables the button after a short timeout (for better ui)
         * @post the button is enabled after a short timeout
         * @returns {void}
         */
        enableDownloadAfterTimeout () {
            setTimeout(() => {
                this.downloadDisabled = false;
            }, 2200);
        },
        /**
         * handles the given error message according to portal standards
         * @post the error message is processed
         * @param {string} msg the error message to use on the console (alert uses standard from translation)
         * @returns {void}
         */
        handleDownloadError (msg) {
            console.warn(msg);
            this.$store.dispatch("Alerting/addSingleAlert", i18next.t("common:shared.modules.buttons.error.download"));
        },
        /**
         * triggers the download based on the given props
         * @post the download has been triggered or an error is processed
         * @returns {void}
         */
        download () {
            if (this.downloadDisabled) {
                return;
            }
            const filename = typeof this.filename === "string" ? this.createFilename(this.filename, this.postfixFormat) : false;

            this.disableDownload();

            if (typeof this.data === "string") {
                this.createFile(new Blob([this.data], {type: "application/json;"}), filename);
            }
            else {
                this.handleDownloadError("ExportButtonGeoJSON: no data, handler or url was given to download something");
                this.enableDownload();
            }
        },
        /**
         * Creates a file based on given blob.
         * @param {Blob} blob the blob to create the file on
         * @param {string} fileName the file name
         * @returns {void}
         */
        createFile (blob, fileName) {
            const succeed = downloadBlobPerNavigator(blob, fileName);

            if (!succeed) {
                downloadBlobPerHTML5(blob, fileName);
            }

            this.enableDownloadAfterTimeout();
        },
        /**
         * creates a filename using the given prefix and postfixFormat
         * @param {string} prefix the prefix to begin the filename with
         * @param {string} postfixFormat the format to hand over to dayjs to create the end of the filename with
         * @returns {string} a concatination of prefix and postfixFormat
         */
        createFilename (prefix, postfixFormat) {
            if (postfixFormat) {
                return String(prefix) + dayjs().format(String(postfixFormat));
            }
            return String(prefix);
        }
    }
};
</script>

<template>
    <button
        v-if="!downloadDisabled"
        type="button"
        :class="['btn', 'exportButton']"
        @click="download()"
    >
        <span
            id="bootstrap-icon"
            class="bootstrap-icon"
        >
            <i class="bi-cloud-arrow-down-fill" />
        </span>
        {{ $t(title) }}
    </button>
    <button
        v-else
        type="button"
        :class="['btn', 'exportButton']"
        disabled
    >
        <span
            id="bootstrap-icon"
            class="bootstrap-icon spin-animation"
        >
            <i class="bi-cloud-arrow-down-fill" />
        </span>
        {{ $t(title) }}
    </button>
</template>

<style lang="scss" scoped>
    @keyframes exportButtonLoaderSpinAnimation {
        from {
            transform: rotate(0);
        }
        to {
            transform: rotate(360deg);
        }
    }

    .exportButton {
        outline:none;
    }
    .exportButton > .spin-animation {
        animation: exportButtonLoaderSpinAnimation 1s 0.1s ease-in-out infinite both;
    }
    .exportButton > .bi-cloud-arrow-down-fill {
        margin-right: 5px;
    }
</style>
