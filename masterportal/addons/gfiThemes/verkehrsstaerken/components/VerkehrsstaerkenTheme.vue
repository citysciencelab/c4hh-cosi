<script>

import {mapGetters, mapActions} from "vuex";
import {createNewRowName, combineYearsData} from "../utils/helpers.js";
import VerkehrsstaerkenThemeTable from "./VerkehrsstaerkenThemeTable.vue";
import VerkehrsstaerkenThemeLineChart from "./VerkehrsstaerkenThemeLineChart.vue";
import FlatButton from "../../../../src/shared/modules/buttons/components/FlatButton.vue";

export default {
    name: "VerkehrsstaerkenTheme",
    components: {
        VerkehrsstaerkenThemeTable,
        VerkehrsstaerkenThemeLineChart,
        FlatButton
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            activeTab: "table",
            years: [],
            rowNames: [],
            dataset: [],
            fullViewActivated: false,
            contentType: ""
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters(["isMobile"]),
        ...mapGetters("Menu", ["currentSecondaryMenuWidth", "mainExpanded"]),
        gfiParams: function () {
            return this.feature.getTheme()?.params;
        },
        downloadLink: function () {
            return this.gfiParams?.downloadurl ? this.gfiParams.downloadurl : "https://daten-hamburg.de/transport_verkehr/verkehrsstaerken/DTV_DTVw_Download.xlsx";
        }
    },
    watch: {
        // When the gfi window switched with arrow, the connection will be refreshed
        feature: {
            handler () {
                this.filterProperties();
                this.setContentStyle();
                this.determineContentType();
            },
            immediate: true
        },
        // language is switched
        currentLocale: function (newVal, oldVal) {
            if (oldVal) {
                this.dataset = [];
                this.filterProperties();
            }
        },
        currentSecondaryMenuWidth: {
            handler () {
                if (this.fullViewActivated && this.currentSecondaryMenuWidth < 0.55) {
                    this.fullView();
                }
            }
        }
    },
    mounted () {
        this.setContentStyle();
    },
    unmounted () {
        if (this.fullViewActivated) {
            this.fullView(true);
        }
    },
    methods: {
        ...mapActions("Menu", ["toggleMenu", "setCurrentMenuWidth"]),
        /**
         * Parses the mapped properties of gfi into several variables for the graphics and for the info tab.
         * @returns {void}
         */
        filterProperties () {
            const allProperties = this.feature.getMappedProperties(),
                dataPerYear = [],
                newRowNames = [],
                parsedYears = [],
                Erhebungsmethode = [],
                surveyMethodLabel = "Erhebungsmethode",
                yearThreshold = new Date().getFullYear() - 10;

            Object.keys(allProperties).forEach(rowName => {
                const year = parseInt(rowName.slice(-4), 10);
                let newRowName,
                    yearData;

                if (!isNaN(year) && year >= yearThreshold) {
                    newRowName = createNewRowName(rowName, year);
                    yearData = {
                        year: year,
                        attrName: newRowName,
                        value: allProperties[rowName]
                    };
                    dataPerYear.push(yearData);
                    if (newRowName === surveyMethodLabel) {
                        Erhebungsmethode.push(newRowName);
                    }
                    else {
                        newRowNames.push(newRowName);
                    }
                    parsedYears.push(year);
                }
            });
            if (Erhebungsmethode.length) {
                newRowNames.push(surveyMethodLabel);
            }
            this.years = [...new Set(parsedYears)].length > 10 ? [...new Set(parsedYears)].slice(Math.max([...new Set(parsedYears)].length - 10, 1)) : [...new Set(parsedYears)];
            this.rowNames = [...new Set(newRowNames)];
            this.dataset = combineYearsData(dataPerYear, this.years);
        },


        /**
         * checks if the given tab name is currently active
         * @param {String} tab the tab name
         * @returns {Boolean}  true if the given tab name is active
         */
        isActiveTab (tab) {
            return this.activeTab === tab;
        },
        /**
         * set the current tab id after clicking.
         * @param {Object[]} evt the target of current click event
         * @returns {void}
         */
        setActiveTab (evt) {
            if (evt && evt.target && evt.target.hash) {
                this.activeTab = evt.target.hash.substring(1);
            }
        },
        /**
         * checks whether the layer is a bike or car layer.
         * @returns {void}
         */
        determineContentType () {
            if (this.feature && typeof this.feature.getTitle === "function") {
                if (this.feature.getTitle().toLowerCase().includes("rad")) {
                    this.contentType = "bike";
                }
                else {
                    this.contentType = "car";
                }
            }
        },
        /**
         * Setting the gfi content max width the same as graph
         * @returns {void}
         */
        setContentStyle () {
            if (document.getElementsByClassName("gfi-content").length) {
                document.getElementsByClassName("gfi-content")[0].style.maxWidth = "880px";
            }
        },
        /**
         * Reacts on click on download button. Opens the downloadLink.
         * @param {Object} evt the dedicated event
         * @returns {void}
         */
        onClick (evt) {
            evt.stopPropagation();
            window.open(this.downloadLink);
        },
        /**
         * Expands table to fullscreen view, hides sorting elements, footer and layerPills to make space. Also enlarges the header row of the table on smaller screens.
         * @param {boolean} unmounted True if leaving the gfiComponent by navigating back to menu or closing the secondary Menu
         * @returns {void}
         */
        fullView (unmounted = false) {
            const footer = document.getElementById("module-portal-footer"),
                layerPills = document.getElementById("layer-pills");

            if (this.fullViewActivated) {
                if (!this.mainExpanded) {
                    this.toggleMenu("mainMenu");
                }
                this.setCurrentMenuWidth({type: "secondaryMenu", attributes: {width: 25}});
                if (!unmounted) {
                    this.$refs["card-header"].classList.remove("text-center");
                    this.$refs["card-header"].classList.add("mx-4");
                }
                if (layerPills) {
                    layerPills.style.display = "";
                }
                if (footer) {
                    footer.style.display = "";
                }
                this.fullViewActivated = false;
            }
            else if (!unmounted) {
                if (this.mainExpanded) {
                    this.toggleMenu("mainMenu");
                }
                if (layerPills) {
                    layerPills.style.display = "none";
                }
                if (footer) {
                    footer.style.display = "none";
                }
                this.setCurrentMenuWidth({type: "secondaryMenu", attributes: {width: 95}});
                this.$refs["card-header"].classList.add("text-center");
                this.$refs["card-header"].classList.remove("mx-4");
                this.fullViewActivated = true;
            }
        }
    }
};
</script>

<template>
    <div class="verkehrsstaerken">
        <div
            ref="card-header"
            class="card header mx-4"
        >
            <strong>{{ "Zählstelle: " + feature.getMappedProperties().Zählstelle }}</strong>
            <br>
            <strong>{{ "Bezeichnung: " + feature.getMappedProperties().Bezeichnung }}</strong>
        </div>
        <ul class="nav nav-pills">
            <li
                id="verkehrsstaerken-table-tab"
                value="table"
                :class="{ active: isActiveTab('table'), 'nav-item': true }"
            >
                <a
                    class="nav-link"
                    href="#table"
                    @click="setActiveTab"
                >
                    {{ $t("additional:modules.tools.gfi.themes.verkehrsstaerken.table") }}
                </a>
            </li>
            <li
                id="verkehrsstaerken-diagram-tab"
                value="diagram"
                :class="{ active: isActiveTab('diagram'), 'nav-item': true }"
            >
                <a
                    class="nav-link"
                    href="#diagram"
                    @click="setActiveTab"
                >
                    {{ $t("additional:modules.tools.gfi.themes.verkehrsstaerken.diagram") }}
                </a>
            </li>
        </ul>
        <div
            id="verkehrsstaerken-tab-content"
            class="tab-content"
            :class="{ 'fixed-columns': fullViewActivated }"
        >
            <VerkehrsstaerkenThemeTable
                v-if="isActiveTab('table')"
                :class="{ active: isActiveTab('table'), 'tab-pane': true }"
                :row-names="rowNames"
                :years="years"
                :table-data="dataset"
                :content-type="contentType"
                :type="String('table')"
            />
            <VerkehrsstaerkenThemeLineChart
                v-if="isActiveTab('diagram')"
                :class="{ active: isActiveTab('diagram'), 'tab-pane': true }"
                :line-chart-data="dataset"
                :content-type="contentType"
                :type="String('diagram')"
            />
        </div>
        <div
            v-if="!isActiveTab('info')"
            class="tab-pane extraButtons active"
        >
            <FlatButton
                v-if="!isMobile"
                id="gfi-view-full"
                aria-label="$t('common:shared.modules.table.reset')"
                :text="fullViewActivated ? $t('common:shared.modules.table.fullscreenViewActive') : $t('common:shared.modules.table.fullscreenView')"
                :title="fullViewActivated ? $t('common:shared.modules.table.fullscreenViewActiveToolTip') : $t('common:shared.modules.table.fullscreenViewToolTip') "
                :icon="'bi-fullscreen'"
                :class="fullViewActivated ? 'active-Fullview me-3 rounded-pill' : 'me-3 rounded-pill'"
                :interaction="() => fullView()"
            />
            <FlatButton
                id="download-btn"
                aria-label="$t('additional:modules.tools.gfi.themes.verkehrsstaerken.download')"
                :interaction="onClick"
                :text="$t('additional:modules.tools.gfi.themes.verkehrsstaerken.download')"
                :icon="'bi-download'"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>

.verkehrsstaerken {
    box-sizing: border-box;
    padding: 5px 20px 5px 20px;
    @media (max-width: 767px) {
        width: inherit;
        height: inherit;
        padding-left: 10px;
        padding-right: 10px;

        div.graph {
            width: inherit;
            height: inherit;
        }
    }
    @media (min-width: 768px) {
        min-width: 50vw;
        height: 60vh;
    }
    @media (min-width: 1024px) {
        min-width: 50vw;
        height: 60vh;
    }
    .header{
        margin-bottom: 20px;
    }
    .nav-pills {
        padding: 6px;

        // @include active-pill(0.9375em, 1em);
    }
    .tab-content {
        width: 100%;
        padding: 0 5px 5px 5px;
    }
    .extraButtons{
         padding: 6px;
         display: flex;
         button{
            outline: none;
         }
    }
    .bootstrap-icon {
        padding-right: 5px;
    }
    .active-Fullview {
        background-color: $dark_blue;
    }
    .active-Fullview:hover {
        background-color: $light_blue;
    }
}
</style>
