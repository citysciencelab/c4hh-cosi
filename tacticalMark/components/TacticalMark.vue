<script>
import axios from "axios";
import {Circle} from "ol/geom.js";
import {click} from "ol/events/condition";
import convertFeaturesToKml from "@shared/js/utils/convertFeaturesToKml.js";
import {Draw, Select, Modify} from "ol/interaction.js";
import {fromCircle} from "ol/geom/Polygon.js";
import getters from "../store/gettersTacticalMark";
import Icon from "ol/style/Icon";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import {mapGetters, mapMutations, mapActions} from "vuex";
import mutations from "../store/mutationsTacticalMark";
import {Style, Text} from "ol/style.js";
import {uniqueId} from "@shared/js/utils/uniqueId.js";

export default {
    name: "TacticalMark",
    components: {
        FlatButton
    },
    data () {
        return {
            disableFileDownload: true,
            format: "kml",
            filename: "",
            fileUrl: "",
            file: "",
            iconSettings: [],
            imagePath: Config.wfsImgPath,
            mapElement: document.getElementById("map"),
            showDownload: false,
            tacticalFeatures: []
        };
    },
    computed: {
        ...mapGetters("Modules/TacticalMark", Object.keys(getters)),

        /**
         * Checks if there are visible features.
         * @returns {Boolean} True if there are visible features otherwise false.
         */
        hasVisibleFeatures () {
            const features = this.layer.layerSource.getFeatures();
            let visibleFeatures = [];

            visibleFeatures = features.filter(feature => feature.get("drawState").drawType.isTacticalMark && feature.get("isVisible"));

            return visibleFeatures.length > 0;
        },

        /**
         * Checks if the layer has tactical features.
         * @returns {boolean} Returns true if the layer has features, otherwise false.
         */
        hasTacticalFeatures () {
            return this.tacticalFeatures.length > 0;
        },

        /**
         * Returns options for category selectbox
         * @returns {Array} The array of options with name and id.
         */
        options: function () {
            return [
                {name: this.$t("additional:modules.tools.tacticalMark.damageImage"), id: "dmg"},
                {name: this.$t("additional:modules.tools.tacticalMark.resources"), id: "rsc"},
                {name: this.$t("additional:modules.tools.tacticalMark.damageAccounts"), id: "dma"}
            ];
        }
    },

    async created () {
        this.interaction = "";
        this.selectedBtn = "";
        this.layer = this.getLayerById("importDrawLayer");
        await axios.get("assets/iconSettings.json", {
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then(res => {
                this.iconSettings = res?.data;

            })
            .catch(error => {
                console.error(error);
            });
    },

    unmounted () {
        this.resetCanvasCursor();
        this.removeInteractionFromMap(this.interaction);
    },
    methods: {
        ...mapMutations("Modules/TacticalMark", Object.keys(mutations)),
        ...mapActions("Maps", {
            addInteractionToMap: "addInteraction",
            removeInteractionFromMap: "removeInteraction"
        }),
        /**
         * Calls the setIcon function by changes in damage account
         * field to update the number with setted param dmaChg
         * @returns {void} -
         */
        changeDmaNr () {
            if (this.selectedBtn !== null && this.selectedBtn === "damage_account.jpg") {
                this.setIcon("damage_account.jpg", "dma_number", "dmaChg");
            }
        },

        /**
         * Returns the path to the given icon
         * @param {String} iconName the filename of the icon
         * @returns {String} the path to the icon
         */
        getIconPath (iconName) {
            return this.imagePath + iconName;
        },

        /**
         * Gets a layer by its ID from the layer collection. If the layer does not exist,
         * it creates a new vector-based layer with the specified ID, adds it to the layer collection,
         * and then returns the newly created layer.         *
         * @param {String} id - The unique identifier of the layer to get or create.
         * @returns {ol/Layer} The layer object corresponding to the given ID.
         */
        getLayerById (id) {
            if (typeof layerCollection.getLayerById(id) !== "undefined") {
                return layerCollection.getLayerById(id);
            }
            const layer = layerFactory.createLayer({
                typ: "VECTORBASE",
                id: id,
                name: id,
                alwaysOnTop: true
            });

            layerCollection.addLayer(layer);
            return layer;
        },

        /**
         * Sets the selected icon to mark on the map
         * @param {String} iconName the filename of the icon
         * @param {String} [dmaNumber=null] the given number of the damage account
         * @param {String} [dmaChg=null] is setted if the function called by onChange in damage account
         * @returns {void} -
         */
        setIcon (iconName, dmaNumber = null, dmaChg = null) {
            const ref = this.$refs[iconName.slice(0, -4)][0];
            let style,
                number = "";

            if (this.selectedBtn === null || this.selectedBtn !== iconName || dmaChg !== null) {
                Object.keys(this.$refs).forEach(rf => {
                    if (Array.isArray(this.$refs[rf]) && this.$refs[rf][0] && this.$refs[rf][0].style) {
                        this.$refs[rf][0].style.backgroundColor = "#F2F2F2";
                    }
                    else {
                        this.$refs[rf].style.backgroundColor = "#F2F2F2";
                    }
                });
                ref.style.backgroundColor = "#CDCDCD";

                this.selectedBtn = iconName;

                this.setCanvasCursor();

                if (typeof dmaNumber !== "undefined" && this.$refs.dma_number[0].value !== "undefined") {
                    number = this.$refs.dma_number[0].value;

                    style = new Style({
                        text: new Text({
                            text: number,
                            textAlign: "center",
                            textBaseline: "middle",
                            offsetY: 7,
                            font: "12px sans-serif"
                        }),
                        image: new Icon({
                            src: this.imagePath + iconName,
                            scale: 1,
                            opacity: 1
                        }),
                        zIndex: 0
                    });
                }
                else {
                    style = new Style({

                        image: new Icon({
                            src: this.imagePath + iconName,
                            scale: 1,
                            opacity: 1
                        }),
                        zIndex: 0
                    });
                }

                this.removeInteractionFromMap(this.interaction);
                this.interaction = new Draw({
                    source: this.layer.layerSource,
                    type: "Point",
                    style: style
                });

                this.interaction.on("drawend", (evt) => {
                    const that = this;

                    evt.feature.set("drawState", {
                        drawType: {
                            id: "drawSymbol",
                            geometry: "Point",
                            isTacticalMark: true
                        },
                        symbol: {
                            id: "iconPoint",
                            type: "simple_point",
                            value: "simple_point"
                        }});

                    evt.feature.setStyle(feature => {
                        that.enableDownloadBtn();
                        if (feature.get("isVisible")) {
                            return style;
                        }
                        return undefined;
                    });
                    this.layer.layer.setVisible(true);
                    evt.feature.set("styleId", iconName + uniqueId("_"));
                    evt.feature.set("isVisible", true);
                    evt.feature.set("invisibleStyle", style);
                    this.tacticalFeatures.push(evt.feature);
                });

                this.addInteractionToMap(this.interaction);
            }
            else {
                ref.style.backgroundColor = "#F2F2F2";

                this.removeInteractionFromMap(this.interaction);
                this.resetCanvasCursor();
                this.selectedBtn = "";
            }
        },

        /**
         * Deletes the selected icon
         * @returns {valueControlsoid}  -
         */
        deleteIcon () {
            if (this.selectedBtn !== "delete") {
                Object.keys(this.$refs).forEach(rf => {
                    if (Array.isArray(this.$refs[rf]) && this.$refs[rf][0] && this.$refs[rf][0].style) {
                        this.$refs[rf][0].style.backgroundColor = "#F2F2F2";
                    }
                    else {
                        this.$refs[rf].style.backgroundColor = "#F2F2F2";
                    }
                });

                this.removeInteractionFromMap(this.interaction);

                this.interaction = new Select({
                    condition: click
                });

                this.addInteractionToMap(this.interaction);

                this.interaction.on("select", (evt) => {
                    evt.target.getFeatures().forEach((feature) => {
                        const index = this.tacticalFeatures.indexOf(feature);

                        this.layer.layerSource.removeFeature(feature);
                        if (index > -1) {
                            this.tacticalFeatures.splice(index, 1);
                        }
                    });
                    this.enableDownloadBtn();
                });
                this.setCanvasCursor();
                this.selectedBtn = "delete";
            }
            else {
                this.removeInteractionFromMap(this.interaction);
                this.resetCanvasCursor();
                this.selectedBtn = "";
            }
        },

        /**
         * Modifies the selected icon
         * @returns {void}  -
         */
        modifyIcon () {
            if (this.selectedBtn !== "modify") {
                Object.keys(this.$refs).forEach(rf => {
                    if (Array.isArray(this.$refs[rf]) && this.$refs[rf][0] && this.$refs[rf][0].style) {
                        this.$refs[rf][0].style.backgroundColor = "#F2F2F2";
                    }
                    else {
                        this.$refs[rf].style.backgroundColor = "#F2F2F2";
                    }
                });

                this.removeInteractionFromMap(this.interaction);

                this.interaction = new Modify({
                    source: this.layer.layerSource
                });

                this.addInteractionToMap(this.interaction);

                this.setCanvasCursor();
                this.selectedBtn = "modify";
            }
            else {
                this.removeInteractionFromMap(this.interaction);
                this.resetCanvasCursor();
                this.selectedBtn = "";
            }
        },

        /**
         * Selects and sets the category of icons from the pull down
         * @param {Event} event changed selection event
         * @returns {void}
         */
        selectIconCat (event) {
            document.getElementById(event.target.value).style.display = "block";

            this.removeInteractionFromMap(this.interaction);
            this.resetCanvasCursor();
            this.selectedBtn = "";

            Object.keys(this.$refs).forEach(rf => {
                if (Array.isArray(this.$refs[rf]) && this.$refs[rf][0] && this.$refs[rf][0].style) {
                    this.$refs[rf][0].style.backgroundColor = "#F2F2F2";
                    this.$refs[rf][0].value = null;
                }
                else {
                    this.$refs[rf].style.backgroundColor = "#F2F2F2";
                    this.$refs[rf].value = null;
                }
            });

            if (event.target.value === "rsc") {
                document.getElementById("dmg").style.display = "none";
                document.getElementById("dma").style.display = "none";
            }
            if (event.target.value === "dmg") {
                document.getElementById("rsc").style.display = "none";
                document.getElementById("dma").style.display = "none";
            }
            if (event.target.value === "dma") {
                document.getElementById("dmg").style.display = "none";
                document.getElementById("rsc").style.display = "none";
            }
        },

        /**
         * Sets the cursor
         * @returns {void}
         */
        setCanvasCursor () {
            this.mapElement.style.cursor = "crosshair";
            this.mapElement.onmousedown = this.onMouseDown;
            this.mapElement.onmouseup = this.onMouseUp;
        },

        /**
         * Resets the cursor
         * @returns {void}
         */
        resetCanvasCursor () {
            this.mapElement.style.cursor = "";
            this.mapElement.onmousedown = undefined;
            this.mapElement.onmouseup = undefined;
        },

        /**
         * Sets the visibility of the layer.
         * @param {Boolean} value - True for visible and false for not.
         * @returns {void}
         */
        setVisibility (value) {
            const features = this.layer.layerSource.getFeatures();

            if (features.length > 0) {
                features.forEach(feature => {
                    if (feature.get("drawState").drawType.isTacticalMark) {
                        feature.set("isVisible", value);
                    }
                });
            }
        },

        /**
         * Toggles the download area
         * @returns {void}
         */
        download () {
            this.showDownload = !this.showDownload;
        },

        /**
         * Deactivates or activates the download button
         * @returns {void}
         */
        enableDownloadBtn () {
            if (this.prepareFileName(this.filename) !== "" && this.layer.layerSource.getFeatures().length > 0) {
                this.disableFileDownload = false;
            }
            else {
                this.disableFileDownload = true;
            }
        },

        /**
         * Commits the current features of the draw layer to the state.
         * Action is dispatched when a feature is drawn, edited or deleted.
         * NOTE: When a feature is an instance of ol/Circle, it is converted to a ol/Polygon first.
         *
         * @returns {void}
         */
        async setDownloadFeatures () {
            const downloadFeatures = [],
                drawnFeatures = this.layer.layerSource.getFeatures();

            drawnFeatures.forEach(drawnFeature => {
                const feature = drawnFeature.clone(),
                    geometry = feature.getGeometry();

                // If the feature is invisible from filter, the style will be reset by printing.
                if (!feature.get("isVisible") && feature.get("invisibleStyle")) {
                    feature.setStyle(feature.get("invisibleStyle"));
                }

                if (geometry instanceof Circle) {
                    feature.setGeometry(fromCircle(geometry));
                }
                downloadFeatures.push(feature);
            });

            await this.startDownload(downloadFeatures);
        },

        /**
         * Starts the download process
         * @param {module:ol/Feature[]} downloadFeatures - Collection of openlayers features to be downloaded
         * @returns {void}
         */
        async startDownload (downloadFeatures) {
            if (downloadFeatures.length > 0) {

                const dataString = await convertFeaturesToKml(downloadFeatures),
                    link = document.createElement("a");

                this.file = this.prepareFileName(this.filename);

                if (this.file && this.file !== "") {
                    this.prepareDownload(dataString);
                }

                link.href = this.fileUrl;
                link.download = this.file;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
        },

        /**
         * Prepares the download process
         * @param {String} dataString - data in string
         * @returns {void}
         */
        prepareDownload (dataString) {
            this.fileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(dataString)}`;
        },

        /**
         * Prepares the file name
         * @param {String} fileName - the given filename from html input field
         * @returns {String} - prepared filename with suffix or empty string
         */
        prepareFileName (fileName) {
            if (fileName.length > 0) {
                const suffix = "." + this.format;

                return fileName.toLowerCase().endsWith(suffix) ? fileName : fileName + suffix;
            }
            return "";
        }
    }
};
</script>

<template lang="html">
    <div id="tacticalMark">
        <div
            v-if="hasTacticalFeatures"
            class="checkbox"
        >
            <label>
                <input
                    type="checkbox"
                    :checked="hasVisibleFeatures"
                    @change="setVisibility($event.target.checked)"
                > {{ $t("additional:modules.tools.tacticalMark.title") }}
            </label>
        </div>
        <label for="tacticalMark-category">
            {{ $t("additional:modules.tools.tacticalMark.category") }}
        </label>
        <select
            id="tacticalMark-category"
            class="form-control input-sm"
            @change="selectIconCat($event)"
        >
            <option
                v-for="option in options"
                :key="'draw-drawType-' + option.id"
                :value="option.id"
            >
                {{ option.name }}
            </option>
        </select>

        <div id="dmg">
            <div class="tm-container">
                <div
                    v-for="obj in iconSettings.dmg"
                    :key="obj.icon"
                    class="tm-item"
                >
                    <div
                        :ref="obj.icon.slice(0, -4)"
                        class="tm-btn"
                        role="button"
                        tabindex="0"
                        @click="setIcon(obj.icon);"
                        @keydown.enter="setIcon(obj.icon);"
                    >
                        <div class="tm-btn-img pull-left">
                            <img
                                :alt="obj.text"
                                :src="$t(getIconPath(obj.iconSmall))"
                            >
                        </div>
                        <div class="tm-btn-txt">
                            <span>
                                {{ obj.text }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div id="rsc">
            <div class="tm-container">
                <div
                    v-for="obj in iconSettings.rsc"
                    :key="obj.icon"
                    class="tm-item"
                >
                    <div
                        :ref="obj.icon.slice(0, -4)"
                        class="tm-btn"
                        role="button"
                        tabindex="0"
                        @click="setIcon(obj.icon);"
                        @keydown.enter="setIcon(obj.icon);"
                    >
                        <div class="tm-btn-img pull-left">
                            <img
                                :alt="obj.text"
                                :src="$t(getIconPath(obj.iconSmall))"
                            >
                        </div>
                        <div class="tm-btn-txt">
                            <span>
                                {{ obj.text }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="dma">
            <div class="tm-container">
                <div
                    v-for="obj in iconSettings.dma"
                    :key="obj.icon"
                    class="tm-item"
                >
                    <label for="dma_number">{{ $t("additional:modules.tools.tacticalMark.damageAccount") }} (0-99):</label>
                    <input
                        id="dma_number"
                        ref="dma_number"
                        type="number"
                        min="0"
                        max="99"
                        @change="changeDmaNr"
                    >
                    <div
                        :ref="obj.icon.slice(0, -4)"
                        class="tm-btn"
                        role="button"
                        tabindex="0"
                        @click="setIcon(obj.icon, 'dmaNumber');"
                        @keydown.enter="setIcon(obj.icon, 'dmaNumber');"
                    >
                        <div class="tm-btn-img pull-left">
                            <img
                                :alt="obj.text"
                                :src="$t(getIconPath(obj.iconSmall))"
                            >
                        </div>
                        <div class="tm-btn-txt">
                            <span>
                                {{ obj.text }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="tm-container">
            <div class="tm-item">
                <FlatButton
                    :aria="$t('additional:modules.tools.tacticalMark.iconEdit')"
                    icon="bi-wrench"
                    :title="$t('additional:modules.tools.tacticalMark.iconEdit')"
                    :interaction="() => modifyIcon()"
                    :text="$t('additional:modules.tools.tacticalMark.iconEdit')"
                />
            </div>
            <div class="tm-item">
                <FlatButton
                    :aria="$t('additional:modules.tools.tacticalMark.iconDelete')"
                    icon="bi-trash"
                    :title="$t('additional:modules.tools.tacticalMark.iconDelete')"
                    :interaction="() => deleteIcon()"
                    :text="$t('additional:modules.tools.tacticalMark.iconDelete')"
                />
            </div>
            <div class="tm-item">
                <FlatButton
                    :aria="$t('additional:modules.tools.tacticalMark.iconDownload')"
                    icon="bi-save"
                    :title="$t('additional:modules.tools.tacticalMark.iconDownload')"
                    :interaction="() => download()"
                    :text="$t('additional:modules.tools.tacticalMark.iconDownload')"
                />
            </div>
        </div>
        <div
            v-show="showDownload"
            class="tm-container download-container"
        >
            <div class="tm-item" />
            <div class="tm-item" />
            <div class="tm-item">
                <form
                    id="tool-tacticalmark-download"
                    role="form"
                    class="form-horizontal"
                >
                    <div class="form-group form-group-sm">
                        <label
                            class="col-md-5 col-sm-5 control-label"
                            for="tool-tacticalmark-download-filename"
                        >
                            {{ $t("additional:modules.tools.tacticalMark.filenameLabel") }}
                        </label>
                        <div class="col-md-7 col-sm-7">
                            <input
                                id="tool-tacticalmark-download-filename"
                                v-model="filename"
                                type="text"
                                :placeholder="$t('additional:modules.tools.tacticalMark.setFileName')"
                                class="form-control"
                                @keyup="enableDownloadBtn"
                            >
                        </div>
                    </div>
                    <label
                        class="col-md-5 col-sm-5 control-label"
                        for="tool-tacticalmark-download-file"
                    />
                    <FlatButton
                        :aria="$t('additional:modules.tools.tacticalMark.saveFile')"
                        :disabled="disableFileDownload"
                        icon="bi-save"
                        :title="$t('additional:modules.tools.tacticalMark.saveFile')"
                        :interaction="() => setDownloadFeatures()"
                        :text="$t('additional:modules.tools.tacticalMark.saveFile')"
                    />
                </form>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    input[type="checkbox"] {
        margin-top: 0;
    }
    #tool-tacticalmark-download {
        margin:0 auto;
        text-align: center;
    }
    .btn-secondary {
        float: right;
        width: 206px;
    }
    .button:hover {
        background-color: $white;
        color: $black;
        border: 1px solid $secondary_table_style;
    }
    .tm-container {
        display: grid;
        grid-template-columns: auto auto auto;
        padding: 5px 0;
        .tm-item {
            background-color: rgba(255, 255, 255, 0.8);
            padding: 0px 1px;
            font-size: 12px;
            text-align: center;
            .tm-btn {
                border-radius: 3px;
                background-color: $secondary_table_style;
                color: $black;
                padding: 2px;
                font-size: 12px;
                cursor: pointer;
                text-align: center;
                border: 1px solid #cdcdcd;
                width: 215px;
                &:hover {
                    background-color: $white;
                    color: $black;
                    border: 1px solid $secondary_table_style;
                }
                &:active {
                    background-color: lighten($secondary_table_style, 15%);
                }
                .tm-btn-img {
                    float: left;
                }
            }
        }
    }
    .form-horizontal {
        .form-group {
            label {
                float: left;
                padding-top: 6px;
            }
            > div {
                float: left;
            }
        }
    }
    .downloadFile {
        display: block;
    }
    .tool-window-vue {
        max-width: 680px;
    }
    #rsc {
        display: none;
    }
    #dma {
        display: none;
        .tm-container {
            .tm-item {
                label {
                    margin-bottom: 10px;
                }
            }
        }
    }
    .checkbox {
        margin: 0 0 5px 0;
    }
</style>
