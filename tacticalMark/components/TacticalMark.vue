<script>
import ToolTemplate from "../../../src/modules/tools/ToolTemplate.vue";
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersTacticalMark";
import mutations from "../store/mutationsTacticalMark";
import Icon from "ol/style/Icon";
import {Style, Text} from "ol/style.js";
import {click} from "ol/events/condition";
import {Draw, Select, Modify} from "ol/interaction.js";
import uniqueId from "../../../src/utils/uniqueId.js";
import convertFeaturesToKml from "../../../src/utils/convertFeaturesToKml.js";
import {Circle} from "ol/geom.js";
import {fromCircle} from "ol/geom/Polygon.js";

export default {
    name: "TacticalMark",
    components: {
        ToolTemplate
    },
    data () {
        return {
            mapElement: document.getElementById("map"),
            showDownload: false,
            format: "kml",
            filename: "",
            fileUrl: "",
            file: "",
            disableFileDownload: true
        };
    },
    computed: {
        ...mapGetters("Tools/TacticalMark", Object.keys(getters)),
        ...mapGetters(["imagePath"]),

        /**
         * Checks if there are visible features.
         * @returns {Boolean} True if there are visible features otherwise false.
         */
        hasVisibleFeatures () {
            const features = this.layer.getSource().getFeatures();
            let visibleFeatures = [];

            visibleFeatures = features.filter(feature => feature.get("drawState").drawType.isTacticalMark && feature.get("isVisible"));

            return visibleFeatures.length > 0;
        },

        /**
         * Checks if the layer has tactical features.
         * @returns {boolean} Returns true if the layer has features, otherwise false.
         */
        hasTacticalFeatures () {
            const features = this.layer.getSource().getFeatures();
            let tacticalFeatures = [];

            tacticalFeatures = features.filter(feature => feature.get("drawState").drawType.isTacticalMark);

            return tacticalFeatures.length > 0;
        },

        /**
         * returns text for title
         * @returns {String} -
         */
        title: function () {
            return this.$t("additional:modules.tools.tacticalMark.title");
        },

        /**
         * returns text for iconSetting
         * @returns {String} -
         */
        iconSetting: function () {
            return this.$t("additional:modules.tools.tacticalMark.iconSetting");
        },

        /**
         * returns text for iconDelete
         * @returns {String} -
         */
        iconDelete: function () {
            return this.$t("additional:modules.tools.tacticalMark.iconDelete");
        },

        /**
         * returns text for iconDownload
         * @returns {String} -
         */
        iconDownload: function () {
            return this.$t("additional:modules.tools.tacticalMark.iconDownload");
        },

        /**
         * returns text for iconEdit
         * @returns {String} -
         */
        iconEdit: function () {
            return this.$t("additional:modules.tools.tacticalMark.iconEdit");
        },

        /**
         * returns options for category selectbox
         * @returns {Array} -
         */
        options: function () {
            return [
                {name: this.$t("additional:modules.tools.tacticalMark.damageImage"), id: "dmg"},
                {name: this.$t("additional:modules.tools.tacticalMark.resources"), id: "rsc"},
                {name: this.$t("additional:modules.tools.tacticalMark.damageAccounts"), id: "dma"}
            ];
        },

        /**
         * returns text for damageAccount
         * @returns {String} -
         */
        damageAccount: function () {
            return this.$t("additional:modules.tools.tacticalMark.damageAccount");
        },

        /**
         * returns text for saveFile
         * @returns {String} -
         */
        saveFile: function () {
            return this.$t("additional:modules.tools.tacticalMark.saveFile");
        },

        /**
         * returns text for setFileName
         * @returns {String} -
         */
        setFileName: function () {
            return this.$t("additional:modules.tools.tacticalMark.setFileName");
        },

        /**
         * returns text for filenameLabel
         * @returns {String} -
         */
        filenameLabel: function () {
            return this.$t("additional:modules.tools.tacticalMark.filenameLabel");
        }
    },
    watch: {
        /**
         * Starts the action for processes, if the tool is be activated (active === true).
         * @param {Boolean} value Value deciding whether the tool gets activated or deactivated.
         * @returns {void}
         */
        active (value) {
            if (value) {
                this.setActive(value);
            }
            else {
                this.resetCanvasCursor();
                this.removeInteractionFromMap(this.interaction);
            }
        }
    },
    async created () {
        this.$on("close", this.close);
        this.interaction = "";
        this.selectedBtn = "";
        this.layer = await Radio.request("Map", "createLayerIfNotExists", "importDrawLayer");
    },
    /**
     * Put initialize here if mounting occurs after config parsing
     * @returns {void}
     */
    mounted () {
        this.applyTranslationKey(this.name);
    },
    methods: {
        ...mapMutations("Tools/TacticalMark", Object.keys(mutations)),
        ...mapActions("Maps", {
            addInteractionToMap: "addInteraction",
            removeInteractionFromMap: "removeInteraction"
        }),
        /**
         * call the setIcon function by changes in damage account
         * field to update the number with setted param dmaChg
         * @returns {void} -
         */
        changeDmaNr () {
            if (this.selectedBtn !== null && this.selectedBtn === "damage_account.jpg") {
                this.setIcon("damage_account.jpg", "dma_number", "dmaChg");
            }
        },

        /**
         * return the path to the given icon
         * @param {String} iconName the filename of the icon
         * @returns {String} the path to the icon
         */
        getIconPath (iconName) {
            return this.imagePath + iconName;
        },

        /**
         * set the selected icon to mark on the map
         * @param {String} iconName the filename of the icon
         * @param {String} [dmaNumber=null] the given number of the damage account
         * @param {String} [dmaChg=null] is setted if the function called by onChange in damage account
         * @returns {void} -
         */
        setIcon (iconName, dmaNumber = null, dmaChg = null) {
            const ref = this.$refs[iconName.slice(0, -4)];
            let style,
                number = "";

            if (this.selectedBtn === null || this.selectedBtn !== iconName || dmaChg !== null) {
                Object.keys(this.$refs).forEach(rf => {
                    this.$refs[rf].style.backgroundColor = "#F2F2F2";
                });
                ref.style.backgroundColor = "#CDCDCD";

                this.selectedBtn = iconName;

                this.setCanvasCursor();

                if (typeof dmaNumber !== "undefined" && this.$refs.dma_number.value !== "undefined") {
                    number = this.$refs.dma_number.value;

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
                    source: this.layer.getSource(),
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
                    this.layer.setVisible(true);
                    evt.feature.set("styleId", iconName + uniqueId("_"));
                    evt.feature.set("isVisible", true);
                    evt.feature.set("invisibleStyle", style);
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
         * delete selected icon
         * @returns {valueControlsoid}  -
         */
        deleteIcon () {
            const ref = this.$refs.delete;

            if (this.selectedBtn !== "delete") {
                Object.keys(this.$refs).forEach(rf => {
                    this.$refs[rf].style.backgroundColor = "#F2F2F2";
                });
                ref.style.backgroundColor = "#CDCDCD";

                this.removeInteractionFromMap(this.interaction);

                this.interaction = new Select({
                    condition: click
                });

                this.addInteractionToMap(this.interaction);

                this.interaction.on("select", (evt) => {
                    evt.target.getFeatures().forEach((feature) => {
                        this.layer.getSource().removeFeature(feature);
                    });
                    this.enableDownloadBtn();
                });
                this.setCanvasCursor();
                this.selectedBtn = "delete";
            }
            else {
                ref.style.backgroundColor = "#F2F2F2";

                this.removeInteractionFromMap(this.interaction);
                this.resetCanvasCursor();
                this.selectedBtn = "";
            }
        },

        /**
         * modify selected icon
         * @returns {void}  -
         */
        modifyIcon () {
            const ref = this.$refs.modify;

            if (this.selectedBtn !== "modify") {
                Object.keys(this.$refs).forEach(rf => {
                    this.$refs[rf].style.backgroundColor = "#F2F2F2";
                });
                ref.style.backgroundColor = "#CDCDCD";

                this.removeInteractionFromMap(this.interaction);

                this.interaction = new Modify({
                    source: this.layer.getSource()
                });

                this.addInteractionToMap(this.interaction);

                this.setCanvasCursor();
                this.selectedBtn = "modify";
            }
            else {
                ref.style.backgroundColor = "#F2F2F2";

                this.removeInteractionFromMap(this.interaction);
                this.resetCanvasCursor();
                this.selectedBtn = "";
            }
        },

        /**
         * Closes this tool window by setting active to false
         * @returns {void}
         */
        close () {
            this.setActive(false);

            const model = Radio.request("ModelList", "getModelByAttributes", {id: this.id});

            if (model) {
                model.set("isActive", false);
            }
        },

        /**
         * select and set the category of icons from the pull down
         * @param {Event} event changed selection event
         * @returns {void}
         */
        selectIconCat (event) {
            document.getElementById(event.target.value).style.display = "block";

            this.removeInteractionFromMap(this.interaction);
            this.resetCanvasCursor();
            this.selectedBtn = "";

            Object.keys(this.$refs).forEach(rf => {
                this.$refs[rf].style.backgroundColor = "#F2F2F2";
                this.$refs[rf].value = null;
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
         * set the cursor
         * @returns {void}
         */
        setCanvasCursor () {
            this.mapElement.style.cursor = "crosshair";
            this.mapElement.onmousedown = this.onMouseDown;
            this.mapElement.onmouseup = this.onMouseUp;
        },

        /**
         * reset the cursor
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
            const features = this.layer.getSource().getFeatures();

            if (features.length > 0) {
                features.forEach(feature => {
                    if (feature.get("drawState").drawType.isTacticalMark) {
                        feature.set("isVisible", value);
                    }
                });
            }
        },

        /**
         * toggle the download area
         *  @returns {void}
         */
        download () {
            this.showDownload = !this.showDownload;
        },

        /**
         * deactivates or activates the download button
         * @returns {void}
         */
        enableDownloadBtn () {
            if (this.prepareFileName(this.filename) !== "" && this.layer.getSource().getFeatures().length > 0) {
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
                drawnFeatures = this.layer.getSource().getFeatures();

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
         * starts the download process
         * @param {module:ol/Feature[]} downloadFeatures - Collection of openlayers features to be downloaded
         * @returns {void}
         */
        async startDownload (downloadFeatures) {
            if (downloadFeatures.length > 0) {

                const dataString = await convertFeaturesToKml(downloadFeatures);

                this.file = this.prepareFileName(this.filename);

                if (this.file && this.file !== "") {
                    this.prepareDownload(dataString);
                }
            }
        },

        /**
         * prepares the download process
         * @param {String} dataString - data in string
         * @returns {void}
         */
        prepareDownload (dataString) {
            const isIE = Radio.request("Util", "isInternetExplorer");

            if (isIE) {
                window.navigator.msSaveOrOpenBlob(new Blob([dataString]), this.file);
            }
            else {
                this.fileUrl = `data:text/plain;charset=utf-8,${encodeURIComponent(dataString)}`;
            }
        },

        /**
         * prepares the file name
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
    <ToolTemplate
        :title="$t(name)"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template #toolBody>
            <div
                v-if="active"
                id="tacticalMark"
            >
                <div
                    v-if="hasTacticalFeatures"
                    class="checkbox"
                >
                    <label>
                        <input
                            type="checkbox"
                            :checked="hasVisibleFeatures"
                            @change="setVisibility($event.target.checked)"
                        > {{ title }}
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
                        <div class="tm-item">
                            <div
                                ref="gefahr_akut"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_akut.jpg');"
                                @keydown.enter="setIcon('gefahr_akut.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr akut"
                                        :src="$t(getIconPath('gefahr_akut_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr akut
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_atomare_stoffe"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_atomare_stoffe.jpg');"
                                @keydown.enter="setIcon('gefahr_atomare_stoffe.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr atomare Stoffe"
                                        :src="$t(getIconPath('gefahr_atomare_stoffe_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr atomare Stoffe
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_biologische_stoffe"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_biologische_stoffe.jpg');"
                                @keydown.enter="setIcon('gefahr_biologische_stoffe.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr biologische Stoffe"
                                        :src="$t(getIconPath('gefahr_biologische_stoffe_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr biologische Stoffe
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_chemische_stoffe"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_chemische_stoffe.jpg');"
                                @keydown.enter="setIcon('gefahr_chemische_stoffe.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr chemische Stoffe"
                                        :src="$t(getIconPath('gefahr_chemische_stoffe_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr chemische Stoffe
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_deichlinie"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_deichlinie.jpg');"
                                @keydown.enter="setIcon('gefahr_deichlinie.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr Deichlinie"
                                        :src="$t(getIconPath('gefahr_deichlinie_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr Deichlinie
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_durch_wassereinbruch"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_durch_wassereinbruch.jpg');"
                                @keydown.enter="setIcon('gefahr_durch_wassereinbruch.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr durch Wassereinbruch"
                                        :src="$t(getIconPath('gefahr_durch_wassereinbruch_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr durch Wassereinbruch
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_elektrizitaet"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_elektrizitaet.jpg');"
                                @keydown.enter="setIcon('gefahr_elektrizitaet.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr Elektrizität"
                                        :src="$t(getIconPath('gefahr_elektrizitaet_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr Elektrizität
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_explosion"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_explosion.jpg');"
                                @keydown.enter="setIcon('gefahr_explosion.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr Explosion"
                                        :src="$t(getIconPath('gefahr_explosion_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr Explosion
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_explosionsfaehige_kampfmittel"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_explosionsfaehige_kampfmittel.jpg');"
                                @keydown.enter="setIcon('gefahr_explosionsfaehige_kampfmittel.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr explosionsfähige Kampfmittel"
                                        :src="$t(getIconPath('gefahr_explosionsfaehige_kampfmittel_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr explosionsf. Kampfmittel
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="gefahr_gefaehrliche_stoffe"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('gefahr_gefaehrliche_stoffe.jpg');"
                                @keydown.enter="setIcon('gefahr_gefaehrliche_stoffe.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr gefährliche Stoffe"
                                        :src="$t(getIconPath('gefahr_gefaehrtliche_stoffe_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr gefährliche Stoffe
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="Gefahr Öl"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('Gefahr Öl.jpg');"
                                @keydown.enter="setIcon('Gefahr Öl.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr Öl"
                                        :src="$t(getIconPath('gefahr_oel_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr Öl
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="Gefahr vermutet"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('Gefahr vermutet.jpg');"
                                @keydown.enter="setIcon('Gefahr vermutet.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Gefahr vermutet"
                                        :src="$t(getIconPath('gefahr_vermutet_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Gefahr vermutet
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person.jpg');"
                                @keydown.enter="setIcon('person.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person"
                                        :src="$t(getIconPath('person_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person_gerettet"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person_gerettet.jpg');"
                                @keydown.enter="setIcon('person_gerettet.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person gerettet"
                                        :src="$t(getIconPath('person_gerettet_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person gerettet
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person_tot"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person_tot.jpg');"
                                @keydown.enter="setIcon('person_tot.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person tot"
                                        :src="$t(getIconPath('person_tot_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person tot
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person_transportiert"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person_transportiert.jpg');"
                                @keydown.enter="setIcon('person_transportiert.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person transportiert"
                                        :src="$t(getIconPath('person_transportiert_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person transportiert
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person_verletzt"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person_verletzt.jpg');"
                                @keydown.enter="setIcon('person_verletzt.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person verletzt"
                                        :src="$t(getIconPath('person_verletzt_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person verletzt
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person_vermisst"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person_vermisst.jpg');"
                                @keydown.enter="setIcon('person_vermisst.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person vermisst"
                                        :src="$t(getIconPath('person_vermisst_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person vermisst
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person_verschuettet"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person_verschuettet.jpg');"
                                @keydown.enter="setIcon('person_verschuettet.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person verschuettet"
                                        :src="$t(getIconPath('person_verschuettet_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person verschuettet
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="person_zu_tranportieren"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('person_zu_tranportieren.jpg');"
                                @keydown.enter="setIcon('person_zu_tranportieren.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Person zu transportieren"
                                        :src="$t(getIconPath('person_zu_tranportieren_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Person zu transportieren
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_beschaedigt"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_beschaedigt.jpg');"
                                @keydown.enter="setIcon('schaden_beschaedigt.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden beschädigt"
                                        :src="$t(getIconPath('schaden_beschaedigt_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden beschädigt
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_blockiert"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_blockiert.jpg');"
                                @keydown.enter="setIcon('schaden_blockiert.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden blockiert"
                                        :src="$t(getIconPath('schaden_blockiert_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden blockiert
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_oelverschmutzung_auf_gewaesser"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_oelverschmutzung_auf_gewaesser.jpg');"
                                @keydown.enter="setIcon('schaden_oelverschmutzung_auf_gewaesser.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden Ölverschmutzung a. Gewässer"
                                        :src="$t(getIconPath('schaden_oelverschmutzung_auf_gewaesser_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden Ölverschm. a. Gewässer
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_teilblockiert"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_teilblockiert.jpg');"
                                @keydown.enter="setIcon('schaden_teilblockiert.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden teilblockiert"
                                        :src="$t(getIconPath('schaden_teilblockiert_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden teilblockiert
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_teilzerstoert"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_teilzerstoert.jpg');"
                                @keydown.enter="setIcon('schaden_teilzerstoert.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden teilzerstört"
                                        :src="$t(getIconPath('schaden_teilzerstoert_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden teilzerstört
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_total_zerstoert"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_total_zerstoert.jpg');"
                                @keydown.enter="setIcon('schaden_total_zerstoert.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden total zerstört"
                                        :src="$t(getIconPath('schaden_total_zerstoert_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden total zerstört
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_ueberschwemmtes_gebiet"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_ueberschwemmtes_gebiet.jpg');"
                                @keydown.enter="setIcon('schaden_ueberschwemmtes_gebiet.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden überschwemmtes Gebiet"
                                        :src="$t(getIconPath('schaden_ueberschwemmtes_gebiet_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden überschw. Gebiet
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="schaden_vollbrand"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('schaden_vollbrand.jpg');"
                                @keydown.enter="setIcon('schaden_vollbrand.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Schaden vollbrand"
                                        :src="$t(getIconPath('schaden_vollbrand_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Schaden vollbrand
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="tier"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('tier.jpg');"
                                @keydown.enter="setIcon('tier.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Tier"
                                        :src="$t(getIconPath('tier_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Tier
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="tier_tot"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('tier_tot.jpg');"
                                @keydown.enter="setIcon('tier_tot.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Tier tot"
                                        :src="$t(getIconPath('tier_tot_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Tier tot
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="tier_verletzt"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('tier_verletzt.jpg');"
                                @keydown.enter="setIcon('tier_verletzt.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Tier verletzt"
                                        :src="$t(getIconPath('tier_verletzt_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Tier verletzt
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="rsc">
                    <div class="tm-container">
                        <div class="tm-item">
                            <div
                                ref="einheit_bundespolizei"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_bundespolizei.jpg');"
                                @keydown.enter="setIcon('einheit_bundespolizei.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit Bundespolizei"
                                        :src="$t(getIconPath('einheit_bundespolizei_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit Bundespolizei
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="einheit_bundeswehr"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_bundeswehr.jpg');"
                                @keydown.enter="setIcon('einheit_bundeswehr.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit Bundeswehr"
                                        :src="$t(getIconPath('einheit_bundeswehr_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit Bundeswehr
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="einheit_feuerwehr"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_feuerwehr.jpg');"
                                @keydown.enter="setIcon('einheit_feuerwehr.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit Feuerwehr"
                                        :src="$t(getIconPath('einheit_feuerwehr_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit Feuerwehr
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="einheit_fuehrung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_fuehrung.jpg');"
                                @keydown.enter="setIcon('einheit_fuehrung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit Führung"
                                        :src="$t(getIconPath('einheit_fuehrung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit Führung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="einheit_hilfsorganisation"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_hilfsorganisation.jpg');"
                                @keydown.enter="setIcon('einheit_hilfsorganisation.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit Hilfsorganisation"
                                        :src="$t(getIconPath('einheit_hilfsorganisation_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit Hilfsorganisation
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="einheit_landespolizei"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_landespolizei.jpg');"
                                @keydown.enter="setIcon('einheit_landespolizei.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit Landespolizei"
                                        :src="$t(getIconPath('einheit_landespolizei_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit Landespolizei
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="einheit_thw"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_thw.jpg');"
                                @keydown.enter="setIcon('einheit_thw.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit THW"
                                        :src="$t(getIconPath('einheit_thw_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit THW
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="einheit_zoll"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('einheit_zoll.jpg');"
                                @keydown.enter="setIcon('einheit_zoll.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Einheit Zoll"
                                        :src="$t(getIconPath('einheit_zoll_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Einheit Zoll
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fachaufgabe_aerztliche_versorgung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fachaufgabe_aerztliche_versorgung.jpg');"
                                @keydown.enter="setIcon('fachaufgabe_aerztliche_versorgung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Fachaufgabe ärztl. Versorgung"
                                        :src="$t(getIconPath('fachaufgabe_aerztliche_versorgung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Fachaufgabe ärztl. Versorgung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fachaufgabe_betreuung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fachaufgabe_betreuung.jpg');"
                                @keydown.enter="setIcon('fachaufgabe_betreuung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Fachaufgabe Betreuung"
                                        :src="$t(getIconPath('fachaufgabe_betreuung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Fachaufgabe Betreuung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fachaufgabe_psnv"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fachaufgabe_psnv.jpg');"
                                @keydown.enter="setIcon('fachaufgabe_psnv.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Fachaufgabe PSNV"
                                        :src="$t(getIconPath('fachaufgabe_psnv_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Fachaufgabe PSNV
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fachaufgabe_sanitaetswesen"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fachaufgabe_sanitaetswesen.jpg');"
                                @keydown.enter="setIcon('fachaufgabe_sanitaetswesen.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Fachaufgabe Sanitätswesen"
                                        :src="$t(getIconPath('fachaufgabe_sanitaetswesen_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Fachaufgabe Sanitätswesen
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fachaufgabe_unterbringung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fachaufgabe_unterbringung.jpg');"
                                @keydown.enter="setIcon('fachaufgabe_unterbringung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Fachaufgabe Unterbringung"
                                        :src="$t(getIconPath('fachaufgabe_unterbringung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Fachaufgabe Unterbringung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fachaufgabe_warnung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fachaufgabe_warnung.jpg');"
                                @keydown.enter="setIcon('fachaufgabe_warnung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Fachaufgabe Warnung"
                                        :src="$t(getIconPath('fachaufgabe_warnung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Fachaufgabe Warnung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fuehrung_fuehrungsstelle"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fuehrung_fuehrungsstelle.jpg');"
                                @keydown.enter="setIcon('fuehrung_fuehrungsstelle.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Führung Führungsstelle"
                                        :src="$t(getIconPath('fuehrung_fuehrungsstelle_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Führung Führungsstelle
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fuehrung_meldekopf_bereistellungsraum"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fuehrung_meldekopf_bereistellungsraum.jpg');"
                                @keydown.enter="setIcon('fuehrung_meldekopf_bereistellungsraum.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Führung Meldekopf Bereitstellungsraum"
                                        :src="$t(getIconPath('fuehrung_meldekopf_bereistellungsraum_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Führung Meldekopf Bereitst.
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="fuehrung_stab"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('fuehrung_stab.jpg');"
                                @keydown.enter="setIcon('fuehrung_stab.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Führung Stab"
                                        :src="$t(getIconPath('fuehrung_stab_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Führung Stab
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="logistik"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('logistik.jpg');"
                                @keydown.enter="setIcon('logistik.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Logistik"
                                        :src="$t(getIconPath('logistik_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Logistik
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="logistik_betriebsstoffe"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('logistik_betriebsstoffe.jpg');"
                                @keydown.enter="setIcon('logistik_betriebsstoffe.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Logistik Betriebsstoffe"
                                        :src="$t(getIconPath('logistik_betriebsstoffe_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Logistik Betriebsstoffe
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="logistik_brauchwasser"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('logistik_brauchwasser.jpg');"
                                @keydown.enter="setIcon('logistik_brauchwasser.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Logistik Brauchwasser"
                                        :src="$t(getIconPath('logistik_brauchwasser_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Logistik Brauchwasser
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="logistik_elektrizitaet"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('logistik_elektrizitaet.jpg');"
                                @keydown.enter="setIcon('logistik_elektrizitaet.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Logistik Elektrizität"
                                        :src="$t(getIconPath('logistik_elektrizitaet_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Logistik Elektrizität
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="logistik_instandsetzung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('logistik_instandsetzung.jpg');"
                                @keydown.enter="setIcon('logistik_instandsetzung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Logistik Instandsetzung"
                                        :src="$t(getIconPath('logistik_instandsetzung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Logistik Instandsetzung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="logistik_trinkwasser"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('logistik_trinkwasser.jpg');"
                                @keydown.enter="setIcon('logistik_trinkwasser.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Logistik Trinkwasser"
                                        :src="$t(getIconPath('logistik_trinkwasser_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Logistik Trinkwasser
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="logistik_verpflegung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('logistik_verpflegung.jpg');"
                                @keydown.enter="setIcon('logistik_verpflegung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Logistik Verpflegung"
                                        :src="$t(getIconPath('logistik_verpflegung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Logistik Verpflegung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_beleuchtung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_beleuchtung.jpg');"
                                @keydown.enter="setIcon('maßnahme_beleuchtung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme Beleuchtung"
                                        :src="$t(getIconPath('maßnahme_beleuchtung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme Beleuchtung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_beraeumen"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_beraeumen.jpg');"
                                @keydown.enter="setIcon('maßnahme_beraeumen.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme beräumen"
                                        :src="$t(getIconPath('maßnahme_beraeumen_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme beräumen
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_brueckenbau"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_brueckenbau.jpg');"
                                @keydown.enter="setIcon('maßnahme_brueckenbau.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme Brückenbau"
                                        :src="$t(getIconPath('maßnahme_brueckenbau_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme Brückenbau
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_deichverteidungung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_deichverteidungung.jpg');"
                                @keydown.enter="setIcon('maßnahme_deichverteidungung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme Deichverteidigung"
                                        :src="$t(getIconPath('maßnahme_deichverteidungung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme Deichverteidigung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_dekontamination"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_dekontamination.jpg');"
                                @keydown.enter="setIcon('maßnahme_dekontamination.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme Dekontamination"
                                        :src="$t(getIconPath('maßnahme_dekontamination_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme Dekontamination
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_erkunden"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_erkunden.jpg');"
                                @keydown.enter="setIcon('maßnahme_erkunden.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme erkunden"
                                        :src="$t(getIconPath('maßnahme_erkunden_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme erkunden
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_fahren_auf_wasser"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_fahren_auf_wasser.jpg');"
                                @keydown.enter="setIcon('maßnahme_fahren_auf_wasser.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme fahren auf Wasser"
                                        :src="$t(getIconPath('maßnahme_fahren_ auf_wasser_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme fahren auf Wasser
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_instandsetzung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_instandsetzung.jpg');"
                                @keydown.enter="setIcon('maßnahme_instandsetzung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme Instandsetzung"
                                        :src="$t(getIconPath('maßnahme_instandsetzung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme Instandsetzung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_lenzen"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_lenzen.jpg');"
                                @keydown.enter="setIcon('maßnahme_lenzen.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme lenzen"
                                        :src="$t(getIconPath('maßnahme_lenzen_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme lenzen
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_lotsen"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_lotsen.jpg');"
                                @keydown.enter="setIcon('maßnahme_lotsen.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme lotsen"
                                        :src="$t(getIconPath('maßnahme_lotsen_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme lotsen
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_sandsackfuellen"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_sandsackfuellen.jpg');"
                                @keydown.enter="setIcon('maßnahme_sandsackfuellen.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme sandsackfüllen"
                                        :src="$t(getIconPath('maßnahme_sandsackfuellen_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme sandsackfüllen
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_sandsackverbau"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_sandsackverbau.jpg');"
                                @keydown.enter="setIcon('maßnahme_sandsackverbau.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme verbau"
                                        :src="$t(getIconPath('maßnahme_sandsackverbau_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme verbau
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_sprengen"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_sprengen.jpg');"
                                @keydown.enter="setIcon('maßnahme_sprengen.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme sprengen"
                                        :src="$t(getIconPath('maßnahme_sprengen_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme sprengen
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_suchen_mit_rettungshunden"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_suchen_mit_rettungshunden.jpg');"
                                @keydown.enter="setIcon('maßnahme_suchen_mit_rettungshunden.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme suchen mit Rettungshunden"
                                        :src="$t(getIconPath('maßnahme_suchen_ mit_rettungshunden_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme suchen m. Rettungsh.
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_transportieren"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_transportieren.jpg');"
                                @keydown.enter="setIcon('maßnahme_transportieren.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme transportieren"
                                        :src="$t(getIconPath('maßnahme_transportieren_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme transportieren
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="maßnahme_wasserrettung"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('maßnahme_wasserrettung.jpg');"
                                @keydown.enter="setIcon('maßnahme_wasserrettung.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Maßnahme Wasserrettung"
                                        :src="$t(getIconPath('maßnahme_wasserrettung_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Maßnahme Wasserrettung
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="stelle_behandlungsplatz"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('stelle_behandlungsplatz.jpg');"
                                @keydown.enter="setIcon('stelle_behandlungsplatz.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Stelle Behandlungsplatzt"
                                        :src="$t(getIconPath('stelle_behandlungsplatz_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Stelle Behandlungsplatzt
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="stelle_bereistellungsraum"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('stelle_bereistellungsraum.jpg');"
                                @keydown.enter="setIcon('stelle_bereistellungsraum.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Stelle Bereitstellungsraum"
                                        :src="$t(getIconPath('stelle_bereistellungsraum_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Stelle Bereitstellungsraum
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="stelle_betreuungsstelle"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('stelle_betreuungsstelle.jpg');"
                                @keydown.enter="setIcon('stelle_betreuungsstelle.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Stelle Betreuungsstelle"
                                        :src="$t(getIconPath('stelle_betreuungsstelle_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Stelle Betreuungsstelle
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="stelle_patiententransportmittel"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('stelle_patiententransportmittel.jpg');"
                                @keydown.enter="setIcon('stelle_patiententransportmittel.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Stelle Transportmittel"
                                        :src="$t(getIconPath('stelle_patiententransportmittel_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Stelle Transportmittel
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="stelle_sammelplatz_fuer_betroffene"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('stelle_sammelplatz_fuer_betroffene.jpg');"
                                @keydown.enter="setIcon('stelle_sammelplatz_fuer_betroffene.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Stelle Sammelplatz für Betroffene"
                                        :src="$t(getIconPath('stelle_sammelplatz_fuer_betroffene_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Stelle Sammelpl. f. Betroffene
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="tm-item">
                            <div
                                ref="stelle_sammelstelle"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('stelle_sammelstelle.jpg');"
                                @keydown.enter="setIcon('stelle_sammelstelle.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Stelle Sammelstelle"
                                        :src="$t(getIconPath('stelle_sammelstelle_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Stelle Sammelstelle
                                    </span>
                                </div>
                            </div>
                        </div><div class="tm-item">
                            <div
                                ref="stelle_unterkunft"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('stelle_unterkunft.jpg');"
                                @keydown.enter="setIcon('stelle_unterkunft.jpg');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        alt="Stelle Unterkunft"
                                        :src="$t(getIconPath('stelle_unterkunft_small.jpg'))"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        Stelle Unterkunft
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="dma">
                    <div class="tm-container">
                        <div class="tm-item">
                            <label for="dma_number">{{ damageAccount }} (0-99):</label>
                            <input
                                id="dma_number"
                                ref="dma_number"
                                type="number"
                                min="0"
                                max="99"
                                @change="changeDmaNr"
                            >
                            <div
                                ref="damage_account"
                                class="tm-btn"
                                role="button"
                                tabindex="0"
                                @click="setIcon('damage_account.jpg', 'dmaNumber');"
                                @keydown.enter="setIcon('damage_account.jpg', 'dmaNumber');"
                            >
                                <div class="tm-btn-img pull-left">
                                    <img
                                        :src="$t(getIconPath('damage_account_mini.jpg'))"
                                        alt="damage account"
                                    >
                                </div>
                                <div class="tm-btn-txt">
                                    <span>
                                        {{ iconSetting }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="tm-container">
                    <div class="tm-item">
                        <div
                            ref="modify"
                            class="tm-btn"
                            role="button"
                            tabindex="0"
                            @click="modifyIcon();"
                            @keydown.enter="modifyIcon();"
                        >
                            <div class="tm-btn-txt">
                                <span>
                                    {{ iconEdit }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="tm-item">
                        <div
                            ref="delete"
                            class="tm-btn"
                            role="button"
                            tabindex="0"
                            @click="deleteIcon();"
                            @keydown.enter="deleteIcon();"
                        >
                            <div class="tm-btn-txt">
                                <span>
                                    {{ iconDelete }}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div class="tm-item">
                        <div
                            ref="download"
                            class="tm-btn"
                            role="button"
                            tabindex="0"
                            @click="download();"
                            @keydown.enter="download();"
                        >
                            <div class="tm-btn-txt">
                                <span>
                                    {{ iconDownload }}
                                </span>
                            </div>
                        </div>
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
                                    {{ filenameLabel }}
                                </label>
                                <div class="col-md-7 col-sm-7">
                                    <input
                                        id="tool-tacticalmark-download-filename"
                                        v-model="filename"
                                        type="text"
                                        :placeholder="setFileName"
                                        class="form-control"
                                        @keyup="enableDownloadBtn"
                                    >
                                </div>
                            </div>
                            <label
                                class="col-md-5 col-sm-5 control-label"
                                for="tool-tacticalmark-download-file"
                            />
                            <a
                                id="tool-tacticalmark-download-file"
                                class="downloadFile"
                                :href="fileUrl"
                                :download="file"
                            >
                                <button
                                    class="btn btn-sm btn-block btn-secondary"
                                    type="button"
                                    :disabled="disableFileDownload"
                                    @click="setDownloadFeatures"
                                >
                                    <span>
                                        {{ saveFile }}
                                    </span>
                                </button>
                            </a>
                        </form>
                    </div>
                </div>
            </div>
        </template>
    </ToolTemplate>
</template>

<style lang="scss" scoped>
@import "~variables";

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
    button {
        border-radius: 3px;
        background-color: $secondary_table_style;
        border: 1px solid $light_grey;
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
