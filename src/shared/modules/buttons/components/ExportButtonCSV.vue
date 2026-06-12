<script>
import axios from "axios";
import dayjs from "dayjs";
import {convertJsonToCsv} from "@shared/js/utils/convertJsonToCsv.js";
import {
    createCsvBlob,
    downloadBlobPerNavigator,
    downloadBlobPerHTML5
} from "../js/exportButtonUtils.js";


/**
 * ExportButtonCSV component: A component for handling, preparing and downloading Data in the csv format. The data to be downloaded can be specified in 3 different ways, either as a data-Object containing the raw data in either an Array or Object-Format
 * @module shared/modules/buttons/ExportButtonCSV
 * @vue-prop {string} title is the label of the Button. An i18next-String can be used for internationalization.
 * @vue-prop {Array<(Object|boolean)>} data is the data to be downloaded, provided as either an Array or an Array of Objects. In the latter case, the keys of the objects are used as csv Headers, e.g. [{a: 1, b: 2}, {a: 3, b: 4}] to create a csv file "a,b\r\n1,2\r\n3,4"
 * @vue-prop {(Function|boolean)} handler - a handler function can be passed to provide the downloadable data as well. the handler is called on export button click and onsuccess shall be called when the data with the available data as onsuccess(data)
         * e.g.: handler = onsuccess => {
         *   // do stuff and create the data here
         *   // than start download as csv file by handing over data to exportButton via onsuccess
         *   onsuccess(data);
         * }
 * @vue-prop {(string|boolean)} url can used to provide the data through an url. This way filename can be used to rename the file to be downloaded. If  filename is set to false it triggers a direct download of the csv file.
 * @vue-prop {(string|boolean)} filename sets the prefix of the filename. Can be set to false to use the filename of the url download or "download" in  other cases.
 * @vue-prop {string} postfixFormat sets the dayjs format to be used as a postfix for filename. Only used if filename is not a boolean value.
 * @vue-prop {boolean} useSemicolon can be set to use a semicolon instead of a comma as delimiter.
 */
export default {
    name: "ExportButtonCSV",
    props: {
        title: {
            type: String,
            required: false,
            default: "common:shared.modules.buttons.download"
        },
        data: {
            type: [Object, Boolean],
            required: false,
            default: false
        },
        handler: {
            type: [Function, Boolean],
            required: false,
            default: false
        },
        url: {
            type: [String, Boolean],
            required: false,
            default: false
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
        },
        useSemicolon: {
            type: Boolean,
            required: false,
            default: false
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

            if (typeof this.data === "object" && this.data !== null) {
                this.downloadWithData(this.data, filename);
            }
            else if (typeof this.handler === "function") {
                this.downloadWithHandler(this.handler, filename);
            }
            else if (typeof this.url === "string" && typeof filename === "string") {
                this.downloadWithUrl(this.url, filename);
            }
            else if (typeof this.url === "string") {
                window.location = this.url;
                this.enableDownloadAfterTimeout();
            }
            else {
                this.handleDownloadError("ExportButtonCSV: no data, handler or url was given to download something");
                this.enableDownload();
            }
        },
        /**
         * "downloads" the given json data
         * @param {Object} data the json data to download
         * @param {string} filename the filename to use
         * @returns {void}
         */
        downloadWithData (data, filename) {
            const csvText = convertJsonToCsv(data, error => {
                this.handleDownloadError(error);
            }, this.useSemicolon);

            this.fakeDownloadCsvText(csvText, filename ? filename : "download", error => {
                this.handleDownloadError(error);
            });
            this.enableDownloadAfterTimeout();
        },
        /**
         * "downloads" the data received by the given handler
         * @param {Function} handler the handler to use for receiving the data
         * @param {string} filename the filename to use
         * @returns {void}
         */
        downloadWithHandler (handler, filename) {
            handler(data => {
                this.downloadWithData(data, filename);
            });
        },
        /**
         * downloads data using the given url and starts the "download"
         * @param {string} url the url to receive the data with
         * @param {string} filename the filename to use
         * @returns {void}
         */
        downloadWithUrl (url, filename) {
            this.downloadUrl(url, csvText => {
                this.fakeDownloadCsvText(csvText, filename, error => {
                    this.handleDownloadError(error);
                });
                this.enableDownloadAfterTimeout();
            }, error => {
                this.handleDownloadError(error);
                this.enableDownload();
            });
        },
        /**
         * "downloads" the given csvText using navigator or html5
         * @post the given csvText is getting "fake"-downloaded
         * @param {string} csvText the text to download
         * @param {string} filename the filename to name the file with
         * @param {Function} onerror an error handler to call if something went wrong
         * @returns {boolean} true if the download was successfull, false if not - see onerror for details
         */
        fakeDownloadCsvText (csvText, filename, onerror) {
            if (typeof csvText !== "string") {
                if (typeof onerror === "function") {
                    onerror("ExportButtonCSV: The given csv text is not a string.");
                }
                return false;
            }
            const blob = createCsvBlob(csvText);

            if (downloadBlobPerNavigator(blob, filename) || downloadBlobPerHTML5(blob, filename, onerror)) {
                return true;
            }

            if (typeof onerror === "function") {
                onerror("ExportButtonCSV: Neither navigator nor html5 technic available for download.");
            }

            return false;
        },
        /**
         * uses axios to load data from the given url
         * @post onsuccess is called with the received data or onerror is called when an error occured
         * @param {string} url the url to call
         * @param {Function} onsuccess the function to hand over the data to
         * @param {Function} onerror the handler to call on error
         * @returns {void}
         */
        downloadUrl (url, onsuccess, onerror) {
            axios.get(url)
                .then(response => {
                    if (!Object.prototype.hasOwnProperty.call(response, "data")) {
                        if (typeof onerror === "function") {
                            onerror("ExportButtonCSV: the called url generates no valid axios data attribute - " + url);
                            return;
                        }
                    }
                    if (typeof onsuccess === "function") {
                        onsuccess(response.data);
                    }
                })
                .catch(error => onerror(error));
        },
        /**
         * creates a filename using the given prefix and postfixFormat
         * @param {string} prefix the prefix to begin the filename with
         * @param {string} postfixFormat the format to hand over to dayjs to create the end of the filename with
         * @returns {string} a concatination of prefix and postfixFormat extended with ".csv" extension
         */
        createFilename (prefix, postfixFormat) {
            if (postfixFormat) {
                return String(prefix) + dayjs().format(String(postfixFormat)) + ".csv";
            }
            return String(prefix) + ".csv";
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
        <span class="bootstrap-icon">
            <i class="bi-cloud-arrow-down-fill" />
        </span>
        <span class="btn-texts">
            {{ $t(title) }}
        </span>
    </button>
    <button
        v-else
        type="button"
        :class="['btn', 'exportButton']"
        disabled
    >
        <span class="bootstrap-icon spin-animation">
            <i class="bi-cloud-arrow-down-fill" />
        </span>
        <span class="btn-texts">
            {{ $t(title) }}
        </span>
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
        padding-right: 1.5rem;
        padding-left: 1rem;
        .btn-texts {
            white-space: normal;
            margin-left: .5rem;
        }
    }
    .exportButton > .spin-animation {
        animation: exportButtonLoaderSpinAnimation 1s 0.1s ease-in-out infinite both;
    }
    .exportButton > .bi-cloud-arrow-down-fill {
        margin-right: 5px;
    }
</style>
