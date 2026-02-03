<script>
import {downloadBlobPerHTML5, downloadBlobPerNavigator} from "../../../src/shared/modules/buttons/js/exportButtonUtils.js";
import isObject from "../../../src/shared/js/utils/isObject.js";
import {mapGetters, mapMutations} from "vuex";
import {register as registerMap} from "../js/observer/MapObserver.js";
import {register as registerLayers} from "../js/observer/LayerObserver.js";
import {register as registerFilter} from "../js/observer/FilterObserver.js";
import {register as registerDraw} from "../js/observer/DrawObserver.js";
import {register as registerModeler3D} from "../js/observer/Modeler3DObserver.js";

export default {
    name: "SessionTool",
    data () {
        return {
            fileName: ""
        };
    },
    computed: {
        ...mapGetters("Modules/SessionTool", ["observer"])
    },
    created () {
        if (!this.observer.find(observer => observer.key === "Maps")) {
            registerMap(this.$store);
        }
        if (!this.observer.find(observer => observer.key === "Layers")) {
            registerLayers(this.$store);
        }
        if (!this.observer.find(observer => observer.key === "Filter")) {
            registerFilter(this.$store);
        }
        if (!this.observer.find(observer => observer.key === "DrawTool")) {
            registerDraw(this.$store);
        }
        if (!this.observer.find(observer => observer.key === "Modeler3D")) {
            registerModeler3D(this.$store);
        }
    },
    methods: {
        ...mapMutations("Modules/SessionTool", ["setObserver"]),
        /**
         * Uploads selected file.
         * @param {Event} event the native upload event
         * @returns {void}
         */
        async uploadFile (event) {
            const file = event.target.files.item(0),
                fileReader = new FileReader();

            fileReader.onload = (evt) => this.onFileLoad(evt.target.result);

            if (file) {
                fileReader.readAsText(file);
                this.fileName = file?.name ? file.name : "";
            }
        },
        /**
         * Onload function for the FileReader.
         * @param {String} fileContent The file content as string.
         * @returns {void}
         */
        async onFileLoad (fileContent) {
            const originalObservers = [...this.observer];
            let json;

            try {
                json = JSON.parse(fileContent);
            }
            catch (e) {
                console.warn("Trying to parse given string into a json", json);
                this.$store.dispatch("Alerting/addSingleAlert", i18next.t("additional:modules.sessionTool.errorOnLoad"));
            }
            if (!isObject(json?.state)) {
                return;
            }
            if (json.state.Maps?.mode === "3D" && Object.prototype.hasOwnProperty.call(json.state, "Modeler3D")) {
                const mapObserver = this.observer.find(observer => observer.key === "Maps"),
                    observersWithoutMap = this.observer.filter(observer => observer.key !== "Maps");

                if (typeof mapObserver?.setter === "function") {
                    await mapObserver.setter(json.state.Maps);
                }
                this.setObserver(observersWithoutMap);
            }
            this.observer.forEach(({key, setter}) => {
                if (typeof setter !== "function") {
                    return;
                }

                Object.entries(json.state).forEach(async ([jsonKey, value]) => {
                    if (jsonKey === key) {
                        await setter(value, json.state);
                    }
                });
            });
            this.setObserver(originalObservers);
        },
        /**
         * Creates a file based on given blob.
         * @param {Blob} blob the blob to create the file on
         * @param {String} fileName the file name
         * @returns {void}
         */
        createFile (blob, fileName) {
            const succeed = downloadBlobPerNavigator(blob, fileName);

            if (!succeed) {
                downloadBlobPerHTML5(blob, fileName);
            }
        },
        /**
         * Downloads a file.
         * @param {Object[]} observer the observer array from state
         * @returns {void}
         */
        async downloadFile (observer) {
            const copyObject = {
                state: {}
            };

            if (!Array.isArray(observer)) {
                return;
            }

            for (let index = 0; index < observer.length; index++) {
                if (typeof observer[index]?.getter !== "function") {
                    continue;
                }
                const result = await observer[index].getter();

                copyObject.state[observer[index].key] = result;
            }
            this.createFile(new Blob([JSON.stringify(copyObject)], {type: "application/json;"}), "session.masterportal");
        },
        /**
         * Triggers a click event on the hidden button to trigger the upload.
         * @returns {void}
         */
        triggerUpload () {
            if (this.$refs.fileInput) {
                this.$refs.fileInput.click();
            }
        }
    }
};
</script>

<template lang="html">
    <div
        id="tool-sessionTool"
        class="session-tool"
    >
        <div class="card">
            <div class="card-header">
                {{ $t('additional:modules.sessionTool.uploadHeader') }}
            </div>
            <div class="card-body">
                <input
                    ref="fileInput"
                    class="d-none"
                    :aria-hidden="true"
                    type="file"
                    name="fileUpload"
                    @change="uploadFile"
                >
                <input
                    id="fileUpload"
                    type="button"
                    class="btn btn-primary"
                    :aria-label="$t('additional:modules.sessionTool.buttonTextUpload')"
                    :value="$t('additional:modules.sessionTool.buttonTextUpload')"
                    @click="triggerUpload"
                >
                <span class="ms-2">{{ fileName }}</span>
            </div>
        </div>
        <div class="card mt-3">
            <div class="card-header">
                {{ $t('additional:modules.sessionTool.downloadHeader') }}
            </div>
            <div class="card-body">
                <input
                    id="fileDownload"
                    class="btn btn-primary"
                    type="button"
                    :value="$t('additional:modules.sessionTool.buttonTextDownload')"
                    @click.prevent="downloadFile(observer)"
                >
            </div>
        </div>
    </div>
</template>
