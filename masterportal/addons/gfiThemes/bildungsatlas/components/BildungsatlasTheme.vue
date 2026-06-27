<script>
import {BildungsatlasApi} from "../utils/bildungsatlasApi.js";
import BildungsatlasThemeBalkendiagramm from "./BildungsatlasThemeBalkendiagramm.vue";
import BildungsatlasThemeBalkendiagrammWanderungen from "./BildungsatlasThemeBalkendiagrammWanderungen.vue";
import BildungsatlasThemeFluechtlinge from "./BildungsatlasThemeFluechtlinge.vue";
import BildungsatlasThemeOKJA from "./BildungsatlasThemeOKJA.vue";
import BildungsatlasThemeSchulentlassene from "./BildungsatlasThemeSchulentlassene.vue";
import BildungsatlasThemeSchulenWohnort from "./BildungsatlasThemeSchulenWohnort.vue";
import BildungsatlasThemeSchulenEinzugsgebiete from "./BildungsatlasThemeSchulenEinzugsgebiete.vue";
import NavTab from "../../../../src/shared/modules/tabs/components/NavTab.vue";

export default {
    name: "BildungsatlasTheme",
    components: {
        BildungsatlasThemeBalkendiagramm,
        BildungsatlasThemeBalkendiagrammWanderungen,
        BildungsatlasThemeFluechtlinge,
        BildungsatlasThemeOKJA,
        BildungsatlasThemeSchulentlassene,
        BildungsatlasThemeSchulenWohnort,
        BildungsatlasThemeSchulenEinzugsgebiete,
        NavTab
    },
    props: {
        /**
         * the feature as an object{getTheme, getTitle, getAttributesToShow, getProperties, getGfiUrl}
         */
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            activeTab: "data",
            subTheme: "",
            chartOptions: false,
            featureType: "",
            properties: {},
            api: null,
            configApiUrl: "config.api.json"
        };
    },
    watch: {
        // When the gfi window switched with arrow, the connection will be refreshed
        feature: {
            handler (newVal, oldVal) {
                if (oldVal) {
                    this.refreshGfi();
                }
            },
            immediate: true
        }
    },
    created () {
        this.refreshGfi();
    },
    methods: {
        /**
         * refreshes the gfi
         * @returns {void}
         */
        refreshGfi () {
            const gfiTheme = this.feature?.getTheme(),
                gfiParams = gfiTheme?.params,
                properties = this.feature?.getProperties();

            if (typeof gfiParams === "object" && gfiParams?.subTheme) {
                this.subTheme = gfiParams.subTheme;
            }
            else {
                console.error("for Bildungsatlas, the config must include a gfiTheme.params.subTheme (" + this.feature.getTitle() + ")");
                this.subTheme = "";
            }
            if (typeof gfiParams === "object" && gfiParams?.featureType) {
                this.featureType = gfiParams.featureType;
            }
            else {
                this.featureType = "";
            }
            if (typeof gfiParams === "object" && gfiParams?.chartOptions) {
                this.chartOptions = gfiParams.chartOptions;
            }
            else {
                this.chartOptions = false;
            }

            this.properties = typeof properties === "object" && properties !== null ? properties : {};

            if (this.subTheme === "") {
                this.configApiUrl = false;
            }
            // BildungsatlasApi is a singleton
            this.api = new BildungsatlasApi(this.configApiUrl);
        },
        /**
         * checks if the given tab name is currently active
         * @param {String} tab the tab name
         * @returns {boolean} true if the given tab name is active
         */
        isActiveTab (tab) {
            return this.activeTab === tab;
        },
        /**
         * sets the active tab by tab name
         * @param {String} tab the tab name
         * @returns {void}
         */
        setActiveTab (tab) {
            this.activeTab = tab;
        },
        /**
         * translates the given key, checkes if the key exists and throws a console warning if not
         * @param {String} key the key to translate
         * @param {Object} [options=null] for interpolation, formating and plurals
         * @returns {String} the translation or the key itself on error
         */
        translate (key, options = null) {
            if (key === "additional:" + this.$t(key)) {
                console.warn("the key " + JSON.stringify(key) + " is unknown to the additional translation");
            }
            return this.$t(key, options);
        },

        /**
         * Parsing the text with Html Tags into Html Format
         * @param {String} str the text
         * @returns {String} html format text
         */
        parseTranslationInHtml (str) {
            const parser = new DOMParser(),
                doc = parser.parseFromString(str, "text/html");

            return doc.body.innerHTML;
        }
    }
};
</script>

<template>
    <div class="gfi-bildungsatlas">
        <ul
            id="bildungsatlas-tabs"
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                :id="'data-tab'"
                :active="true"
                :target="'#data'"
                :label="'additional:addons.gfiThemes.bildungsatlas.general.tabData'"
                :interaction="() => setActiveTab('data')"
            />
            <NavTab
                :id="'info-tab'"
                :active="false"
                :target="'#info'"
                :label="'additional:addons.gfiThemes.bildungsatlas.general.tabInfo'"
                :interaction="() => setActiveTab('info')"
            />
        </ul>
        <div
            v-if="subTheme !== ''"
            class="tab-content"
        >
            <component
                :is="subTheme"
                :is-active-tab="isActiveTab"
                :feature="feature"
                :properties="properties"
                :chart-options="chartOptions"
                :api="api"
                :feature-type="featureType"
                :translate="translate"
                :parse-translation-in-html="parseTranslationInHtml"
            />
        </div>
    </div>
</template>

<style lang="scss">

.portal-title a img[alt*="Bildungsatlas"] {
    width: 80px;
}

.gfi-bildungsatlas-current-content {
    .gfi-data {
        & > * {
            margin-top: 1rem;
        }

        .rba_header {
            margin-top: 0;

            .rba_header_title {
                font-weight: bold;
            }
        }

        .rba_table {
            padding-top: .5rem;
            border-top: 1px solid #ddd;

            table {
                width: 100%;
            }

            td {
                vertical-align: top;
            }

            td.rba_table_rightcol {
                text-align: right;
            }
        }

        .rba_chart {
            padding-top: 1rem;
            border-top: 1px solid #ddd;

            .rba_chart_title {
                font-weight: bold;
            }
        }

        .rba_footer {
            padding-top: 1rem;
            border-top: 1px solid #ddd;
        }
    }

    .gfi-info {
        p {
            margin-bottom: 1rem;
            font-size: $font-size-base;
        }
    }
}
</style>

<style lang="scss" scoped>

.gfi-bildungsatlas {
    // @include active-pill(0.625rem, 1.25em);

    .nav-pills {
        margin: 10px 10px 0;
    }

    .tab-content > * {
        padding: 10px;
    }

    .gfi-bildungsatlas-footer {
        border-top: 1px solid #ddd;
    }
}
</style>
