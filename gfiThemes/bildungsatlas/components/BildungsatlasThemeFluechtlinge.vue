<script>
export default {
    name: "BildungsatlasThemeFluechtlinge",
    props: {
        /**
         * checks if the given tab name is currently active
         * @param {String} tab the tab name
         * @returns {Boolean}  true if the given tab name is active
         */
        isActiveTab: {
            type: Function,
            required: true
        },

        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate: {
            type: Function,
            required: true
        },

        /**
         * Parsing the text with Html Tags into Html Format
         * @param {String} str the text
         * @returns {String} html format text
         */
        parseTranslationInHtml: {
            type: Function,
            required: true
        },

        /**
         * the featureType of current layer
         */
        featureType: {
            type: String,
            required: true
        },

        /**
         * the properties as a key value object
         */
        properties: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            bezeichnung: "",
            bemerkung: "",
            platzzahl: "",
            platzzahl_hinweis: "",
            infoKey: ""
        };
    },
    watch: {
        // when the gfi window is switched, the gfi is refreshed
        properties: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.refreshGfi();
                }
            },
            immediate: true
        }
    },
    mounted () {
        this.refreshGfi();
    },
    methods: {
        /**
         * refreshes the gfi
         * @returns {void}
         */
        refreshGfi () {
            this.bezeichnung = this.properties?.bezeichnung ? this.properties.bezeichnung : "";
            this.bemerkung = this.properties?.bemerkung ? this.properties.bemerkung : "";
            this.platzzahl = this.properties?.platzzahl ? this.properties.platzzahl : "";
            this.platzzahl_hinweis = this.properties?.platzzahl_hinweis ? this.properties.platzzahl_hinweis : "";
            this.infoKey = typeof this.featureType === "string" && this.featureType !== "" ? this.featureType.split(":")[1] : "";

            if (this.infoKey !== "") {
                this.$el.querySelector(".gfi-info").innerHTML = this.parseTranslationInHtml(this.translate("additional:addons.gfiThemes.bildungsatlas.fluechtlinge.info." + this.infoKey));
            }
        }
    }
};
</script>

<template>
    <div class="gfi-bildungsatlas-current-content">
        <div
            v-if="isActiveTab('data')"
            class="gfi-data"
        >
            <div class="gbf-header">
                {{ bezeichnung }}
            </div>
            <div class="gbf-content">
                <table>
                    <tr>
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.fluechtlinge.capacity") }}</td>
                        <td>{{ platzzahl + " " + translate("additional:addons.gfiThemes.bildungsatlas.fluechtlinge.place") }}</td>
                    </tr>
                    <tr v-if="bemerkung !== ''">
                        <td>{{ translate("additional:addons.gfiThemes.bildungsatlas.fluechtlinge.remark") }}</td>
                        <td>{{ bemerkung }}</td>
                    </tr>
                </table>
                <span>
                    {{ platzzahl_hinweis }}
                </span>
            </div>
        </div>
        <div
            v-if="isActiveTab('info')"
            class="gfi-info"
        />
    </div>
</template>

<style lang="scss" scoped>
.gfi-bildungsatlas-current-content {
    .gbf-content {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #ddd;

        table {
            width: 100%;
            margin-bottom: 5px;

            tr {
                td {
                    &:first-child {
                        text-align: left;
                    }

                    &:last-child {
                        text-align: right;
                        font-weight: bold;
                    }
                }
            }
        }
    }
}
</style>
