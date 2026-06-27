<script>
import axios from "axios";
import {Circle} from "ol/geom.js";
import {click} from "ol/events/condition";
import convertFeaturesToKml from "@shared/js/utils/convertFeaturesToKml.js";
import {Draw, Select, Modify} from "ol/interaction.js";
import {fromCircle} from "ol/geom/Polygon.js";
import getters from "../store/gettersTacticalMark";
import Icon from "ol/style/Icon";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";
import FlatButton from "@shared/modules/buttons/components/FlatButton.vue";
import layerCollection from "@core/layers/js/layerCollection";
import layerFactory from "@core/layers/js/layerFactory";
import {mapGetters, mapMutations, mapActions} from "vuex";
import mutations from "../store/mutationsTacticalMark";
import NavTab from "@shared/modules/tabs/components/NavTab.vue";
import InputText from "@shared/modules/inputs/components/InputText.vue";
import {Style, Text} from "ol/style.js";
import {uniqueId} from "@shared/js/utils/uniqueId.js";

export default {
    name: "TacticalMark",
    components: {
        IconButton,
        FlatButton,
        NavTab,
        InputText
    },
    data () {
        return {
            activeTab: "dmg",
            disableFileDownload: true,
            format: "kml",
            filename: "",
            fileUrl: "",
            file: "",
            iconSettings: [],
            dmaNumber: "",
            imagePath: Config.wfsImgPath,
            mapElement: document.getElementById("map"),
            selectedBtn: "",
            showDownload: false,
            showVisibleFeatures: true,
            tacticalFeatures: []
        };
    },
    computed: {
        ...mapGetters("Modules/TacticalMark", Object.keys(getters)),

        /**
         * Checks if the layer has tactical features.
         * @returns {boolean} Returns true if the layer has features, otherwise false.
         */
        hasTacticalFeatures () {
            return this.tacticalFeatures.length > 0;
        }
    },

    async created () {
        this.interaction = "";
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

    activated: () => undefined,

    deactivated: () => undefined,

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
                this.setIcon("damage_account.jpg", "dmaChg");
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
         * @param {String} [dmaChg=null] is setted if the function called by onChange in damage account
         * @returns {void} -
         */
        setIcon (iconName, dmaChg = null) {
            if (this.selectedBtn === null || this.selectedBtn !== iconName || dmaChg !== null) {
                this.selectedBtn = iconName;

                this.setCanvasCursor();

                const style = new Style({
                    text: new Text({
                        text: this.activeTab === "dma" ? this.dmaNumber : "",
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
         * Removes the interaction upon selecting another icon category.
         * @returns {void}
         */
        selectIconCat () {
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
        <ul
            id="tactical-mark-tabs"
            class="nav nav-tabs nav-justified mb-4"
            role="tablist"
        >
            <NavTab
                v-for="(tab, tabKey) in iconSettings"
                :id="`tactical-mark-${tabKey}-label`"
                :key="tabKey"
                :active="activeTab === tabKey"
                :target="`#${tabKey}`"
                :icon="tab.icon"
                :label="`additional:modules.tools.tacticalMark.tabs.${tabKey}`"
                :interaction="() => { activeTab = tabKey; selectIconCat(); }"
            />
        </ul>

        <h5>
            {{ $t("additional:modules.tools.tacticalMark.edit") }}
        </h5>
        <div class="d-flex justify-content-between mb-5">
            <div class="d-flex gap-4 ms-3">
                <IconButton
                    :class-array="['btn-primary']"
                    :aria="$t('additional:modules.tools.tacticalMark.iconMove')"
                    icon="bi-arrows-move"
                    :title="$t('additional:modules.tools.tacticalMark.iconMove')"
                    :interaction="() => modifyIcon()"
                    :label="$t('additional:modules.tools.tacticalMark.iconMove')"
                />
                <IconButton
                    :class-array="['btn-primary']"
                    :aria="$t('additional:modules.tools.tacticalMark.iconDelete')"
                    icon="bi-trash"
                    :title="$t('additional:modules.tools.tacticalMark.iconDelete')"
                    :interaction="() => deleteIcon()"
                    :label="$t('additional:modules.tools.tacticalMark.iconDelete')"
                />
                <IconButton
                    v-if="hasTacticalFeatures"
                    :class-array="['btn-primary']"
                    :aria="$t('additional:modules.tools.tacticalMark.iconToggleAllVisibility')"
                    :icon="'bi-eye'"
                    :title="$t('additional:modules.tools.tacticalMark.iconToggleAllVisibility')"
                    :label="$t('additional:modules.tools.tacticalMark.iconToggleAllVisibility')"
                    :interaction="() => { showVisibleFeatures = !showVisibleFeatures; setVisibility(showVisibleFeatures); }"
                />
            </div>
            <FlatButton
                :aria="$t('additional:modules.tools.tacticalMark.iconDownload')"
                icon="bi-cloud-arrow-down-fill"
                :title="$t('additional:modules.tools.tacticalMark.iconDownload')"
                :interaction="() => download()"
                :text="$t('additional:modules.tools.tacticalMark.iconDownload')"
            />
        </div>

        <div class="tab-content">
            <div
                v-for="(tab, tabKey) in iconSettings"
                :id="tabKey"
                :key="tabKey"
                :class="['tab-pane', { 'active': activeTab === tabKey }]"
            >
                <h5 class="mb-4">
                    {{ $t(`additional:modules.tools.tacticalMark.tabs.${tabKey}`) }}
                </h5>
                <div
                    v-for="(group, groupKey) in tab.marks"
                    :key="groupKey"
                >
                    <h6 v-if="groupKey !== 'noGroupHeader'">
                        {{ $t(`additional:modules.tools.tacticalMark.groups.${groupKey}`) }}
                    </h6>
                    <div class="d-flex flex-wrap gap-3 mb-5">
                        <div
                            v-for="obj in group"
                            :key="obj.icon"
                            class="tactical-icon-cell"
                        >
                            <div class="d-flex flex-column align-items-center text-center">
                                <div
                                    class="p-2 tactical-icon-btn"
                                    :class="{'selected': obj.icon === selectedBtn}"
                                    role="button"
                                    tabindex="0"
                                    @click="setIcon(obj.icon);"
                                    @keydown.enter="setIcon(obj.icon);"
                                >
                                    <img
                                        :alt="obj.text"
                                        :src="getIconPath(obj.iconSmall)"
                                        class="tactical-icon-image"
                                    >
                                </div>
                                <span class="mt-2 lh-sm tactical-icon-label">{{ obj.text }}</span>
                            </div>
                        </div>
                        <InputText
                            v-if="tabKey === 'dma'"
                            id="dma_number"
                            v-model="dmaNumber"
                            class="flex-grow-1"
                            type="number"
                            :label="$t('additional:modules.tools.tacticalMark.damageAccount') + ' (0-99)'"
                            :placeholder="$t('additional:modules.tools.tacticalMark.damageAccount')"
                            :min="0"
                            :max="99"
                            :on-change="() => changeDmaNr()"
                        />
                    </div>
                </div>
            </div>
        </div>
        <div
            v-show="showDownload"
        >
            <div>
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
    .btn-wrapper {
        width: unset;
    }
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
    .checkbox {
        margin: 0 0 5px 0;
    }

    .tactical-icon-cell {
        width: 92px;
    }

    .tactical-icon-btn {
        width: 57px;
        height: 49px;
        outline: 0.5px solid #DEE2E6;
        border-radius: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        &.selected {
            outline-color: $secondary;
            outline-width: 2px;
        }
    }

    .tactical-icon-image {
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    .tactical-icon-label {
        font-size: $font_size_sm;
    }
</style>
