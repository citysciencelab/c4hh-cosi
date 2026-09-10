<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import getters from "../store/gettersColorCodeMap";
import mutations from "../store/mutationsColorCodeMap";
import actions from "../store/actionsColorCodeMap";
import utils from "../../utils";
import ColorCodeLegend from "./ColorCodeLegend.vue";
import {generateColorScale} from "../../utils/colorScale.js";
import groupMapping from "../../utils/groupMapping";
import {mapDistrictNames} from "../../DistrictSelector/utils/prepareDistrictLevels";

export default {
    name: "ColorCodeMap",
    components: {
        ColorCodeLegend
    },
    data () {
        return {
            // List of available features for selected Districts
            featuresList: [],
            // Array of all available years
            availableYears: [],
            // colorScale results for ColorCodeLegend
            colorScale: [],
            // Saves the last year when user changes year manually.
            // lastYear: null,
            // Highest Value of selected feature among all selected districts
            hiVal: null,
            // Lowest Value of selected feature among all selected districts
            loVal: null,
            // Playback speed of the animation
            playSpeed: 1,
            // // Helper Variable to force Legend Markers to rerender
            // updateLegendList: 0,
            // Helper to pass data to the graph generator
            graphData: [],
            // Helper to store type of feature dataset
            dataCategory: "",
            // Statistical features of the selected districts
            selectedStatFeatures: []
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        ...mapGetters("Modules/ColorCodeMap", Object.keys(getters)),
        ...mapGetters("Modules/DistrictSelector", ["selectedDistrictLevel", "selectedFeatures", "label", "keyOfAttrName", "keyOfAttrNameStats", "loadend", "metadataUrls", "mapping"]),
        ...mapGetters("Modules/CalculateRatio", ["dataToColorCodeMap", "colorCodeMapDataset"]),
        _selectedFeature: {
            get () {
                return this.selectedFeature;
            },
            set (v) {
                this.setSelectedFeature(v);
            }
        },
        _selectedYear: {
            get () {
                return this.selectedYear;
            },
            set (v) {
                this.setSelectedYear(v);
            }
        },
        minimize: {
            get () {
                return this.minimized;
            },
            set (v) {
                this.setMinimized(v);
            }
        },
        dashboardOpen () {
            return this.$store.getters["Tools/Dashboard/active"] || this.$store.getters["Tools/FeaturesList/active"];
        },
        statsMapping () {
            return groupMapping(this.mapping);
        }
    },
    watch: {
        selectedFeatures (newValue, oldValue) {
            if (newValue.length < oldValue.length) {
                this.$nextTick(() => {
                    this.updateSelectedDistricts();
                });
            }
        },
        visualizationState () {
            if (!this.dataToColorCodeMap) {
                this.renderVisualization();
            }

            this.$nextTick(()=> {
                this.setUpperEdge(window.innerHeight - this.$refs.ccm?.getBoundingClientRect().top);
            });
        },
        minimize () {
            this.$nextTick(()=> {
                this.setUpperEdge(window.innerHeight - this.$refs.ccm?.getBoundingClientRect().top);
            });
        },
        loadend (newValue) {
            const selectedDistricts = this.selectedDistrictLevel.districts.filter(district => district.isSelected === true);

            this.selectedStatFeatures = selectedDistricts.map(district => district.statFeatures).flat();
            if (newValue && this.selectedFeatures.length > 0) {
                this.updateSelectedDistricts();
            }
        },
        playState (stateChange) {
            if (stateChange) {
                this.animationOverYears(this.playSpeed);
            }
        },
        // no watchers on dataToColorCodeMap / colorCodeMapDataset: the Versorgungsanalyse
        // dispatches the rendering itself, so it no longer depends on this component existing
        selectedFeature () {
            this.generateGraphData();
            this.renderVisualization();
        },
        selectedYear () {
            this.renderVisualization();
        },
        lastYear () {
            this.renderVisualization();
        }
    },
    mounted () {
        this.applyTranslationKey(this.name);
    },
    methods: {
        ...mapActions("Modules/ColorCodeMap", Object.keys(actions)),
        ...mapMutations("Modules/ColorCodeMap", Object.keys(mutations)),
        ...mapActions("Alerting", ["addSingleAlert", "cleanup"]),

        /**
         * @description Updates featuresList when selection of district changes and finds all available years for data.
         * @returns {void}
         */
        updateSelectedDistricts () {
            this.featuresList = [];
            if (this.selectedStatFeatures.length) {
                this.availableYears = utils.getAvailableYears(this.selectedStatFeatures, this.yearSelector);
                this.setSelectedYear(utils.getAvailableYears([this.selectedStatFeatures[0]], this.yearSelector)[0]);
                this.updateFeaturesList();
            }
        },

        /**
         * @description Gets relevant features based on MappingJson and triggers visualization.
         * @returns {void}
         */
        updateFeaturesList () {
            this.setSelectedFeature(this.mapping[0]?.value);

            if (Array.isArray(this.mapping) && this.mapping.length > 0) {
                this.mapping.forEach(attr => {
                    if (attr[this.keyOfAttrNameStats]) {
                        const findGrp = this.featuresList.find(el => el.group === attr.group);

                        if (findGrp) {
                            findGrp.data.push(attr.value);
                        }
                        else {
                            const createObj = {
                                group: attr.group,
                                data: [attr.value]
                            };

                            this.featuresList.push(createObj);
                        }
                    }
                });
            }

            this.generateGraphData();
            this.renderVisualization();
        },
        /**
         * @description Animates data for selected feature on the map over the available years.
         * @param {String} tempo Value for animation playback speed in seconds.
         * @returns {void}
         */
        animationOverYears (tempo) {
            if (this.playState) {
                let current = this.availableYears.indexOf(this.selectedYear) - 1;

                if (current < 0) {
                    current = this.availableYears.length - 1;
                }

                setTimeout(() => {
                    window.requestAnimationFrame(() => {
                        this.setSelectedYear(this.availableYears[current]);
                        this.renderVisualization();
                        this.animationOverYears(tempo);
                    });
                }, tempo * 1000);
            }
        },

        /**
         * @description Calculate dynamic colors for Array based on its values.
         * @param {*} values Array of ints.
         * @returns {Object} the colorScale function(value) and the n-step legend color/value pairs.
         */
        getColorsByValues (values) {
            return generateColorScale(values, this.colorScheme);
        },
        /**
         * @description Changes selected feature with arrow buttons.
         * @param {*} value 1 or -1 for next or prev.
         * @returns {void}
         */
        changeSelector (value) {
            const index = this.mapping.map(e => e.value).indexOf(this.selectedFeature) + value;

            if (index === -1) {
                this.setSelectedFeature(this.mapping[this.mapping.length - 1].value);
            }
            else if (index === this.mapping.length) {
                this.setSelectedFeature(this.mapping[0].value);
            }
            else {
                this.setSelectedFeature(this.mapping[index].value);
            }
            this.renderVisualization();
        },
        /**
         * @description Shows component info as new window.
         * @returns {Void} Function returns nothing.
         */
        showInfo () {
            window.open(this.readmeUrl[this.currentLocale], "_blank");
        },
        /**
         * @description Filters the feature data sets and pass them to the prepareGraphData() for graph visualization.
         * @returns {Void} Function returns nothing.
         */
        generateGraphData () {
            this.graphData = [];
            const results = this.selectedStatFeatures.filter(x => x.get("kategorie") === this.selectedFeature);

            this.selectedFeatures.forEach(district => {
                const matchResults = results.find(
                    x => utils.unifyString(x.get(this.keyOfAttrNameStats)) === utils.unifyString(mapDistrictNames(district.get(this.keyOfAttrName), this.selectedDistrictLevel))
                );

                this.prepareGraphData(matchResults);
            });
        },
        /**
         * @description Adjusting CCM data for Graph Generator Tool.
         * @param {Object} dataset dataset from renderVisualization function.
         * @returns {void}
         */
        prepareGraphData (dataset) {
            const newDataset = {
                label: dataset?.get(this.keyOfAttrNameStats),
                data: []
            };

            this.dataCategory = dataset?.get("kategorie");
            this.availableYears.forEach(year => {
                newDataset.data.push(dataset.get(this.yearSelector + year));
            });

            this.graphData.push(newDataset);
        },

        openMetadata () {
            this.metadataUrls.forEach(url => {
                window.open(url);
            });
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="loadend && selectedFeatures.length > 0 && !dashboardOpen"
        id="ccm"
        ref="ccm"
        class="addon_container"
        :class="{minimized: minimize}"
    >
        <div
            class="addon_wrapper"
        >
            <div class="select_wrapper">
                <div class="btn_group">
                    <button
                        class="minimize"
                        :class="{ highlight: !minimize }"
                        :title="$t('additional:modules.tools.colorCodeMap.minimize')"
                        @click="minimize = !minimize"
                    >
                        <template v-if="minimize">
                            <i class="bi bi-plus-lg" />
                        </template>
                        <template v-else>
                            <i class="bi bi-dash-lg" />
                        </template>
                    </button>
                    <button
                        id="switch"
                        class="switch"
                        :class="{ highlight: !visualizationState }"
                        :title="$t('additional:modules.tools.colorCodeMap.toggleVisualization')"
                        @click="toggleVisualizationState"
                    >
                        <i
                            v-if="visualizationState"
                            class="bi bi-eye-slash"
                        />
                        <i
                            v-else
                            class="bi bi-eye"
                        />
                    </button>
                    <button
                        class="prev btn btn-default btn-sm"
                        :title="$t('additional:modules.tools.colorCodeMap.prev')"
                        @click="changeSelector(-1)"
                    >
                        <i class="bi bi-chevron-left" />
                    </button>
                    <button
                        class="next btn btn-default btn-sm"
                        :title="$t('additional:modules.tools.colorCodeMap.next')"
                        @click="changeSelector(1)"
                    >
                        <i class="bi bi-chevron-right" />
                    </button>
                    <v-select
                        v-if="selectedStatFeatures.length"
                        v-model="_selectedYear"
                        outlined
                        density="compact"
                        :items="availableYears"
                        :title="$t('additional:modules.tools.colorCodeMap.yearsLabel')"
                        class="year_selection selection"
                    />
                    <v-select
                        v-if="selectedStatFeatures.length"
                        v-model="lastYear"
                        outlined
                        density="comfortable"
                        :items="availableYears"
                        clearable
                        class="year_selection selection"
                    />
                </div>
                <v-autocomplete
                    v-if="featuresList.length"
                    v-model="_selectedFeature"
                    class="feature_selection selection"
                    :items="statsMapping"
                    item-text="value"
                    outlined
                    density="comfortable"
                    hide-details
                />
            </div>
            <div
                v-if="visualizationState && selectedFeatures.length > 1"
                id="colorCodeMapLegend"
                class="legend"
                :class="{ active: visualizationState && selectedFeatures.length > 1 }"
            >
                <ColorCodeLegend
                    :results="legendValues"
                    :color-scale="colorScale"
                    :update-legend-list="updateLegendList"
                    :dashboard-open="dashboardOpen"
                    :selected-year="selectedYear"
                    :year-selector="yearSelector"
                />
            </div>
        </div>
        <div class="hovermenu">
            <div class="btn_grp">
                <button
                    class="help_button"
                    :title="$t('additional:modules.tools.colorCodeMap.infoTooltip')"
                    @click="showInfo"
                >
                    <i class="bi bi-question-circle" />
                </button>
                <div
                    v-if="visualizationState && !minimize"
                    class="field"
                >
                    <button
                        class="play_button"
                        :class="{highlight: playState}"
                        :title="$t('additional:modules.tools.colorCodeMap.animate')"
                        @click="setPlayState(!playState)"
                    >
                        <i
                            v-if="!playState"
                            class="bi bi-play-circle"
                        />
                        <i
                            v-else
                            class="bi bi-pause-circle"
                        />
                    </button>
                    <input
                        v-model="playSpeed"
                        class="mini_input"
                    >
                </div>
                <button
                    class="graph_button"
                    :title="$t('additional:modules.tools.colorCodeMap.generateChart')"
                >
                    <i class="bi bi-bar-chart" />
                </button>
                <button
                    :title="$t('additional:modules.tools.colorCodeMap.metadata')"
                    @click="openMetadata()"
                >
                    <i class="bi bi-info-circle" />
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    .addon_container {
        position:fixed;
        z-index:100;
        left:10px;
        bottom:30px;
        width:460px;
        height:auto;

        .hovermenu {
            position:absolute;
            left:calc(100% - 5px);
            top:5px;
            padding:10px;
            width:auto;
            height:auto;
            transform:translateX(-100%);
            background:rgba(255,255,255,0.9);
            opacity:0;
            pointer-events:none;
            z-index:-1;

            .btn_grp {
                .ccm_info_button {
                    background:transparent;
                    display: inline-block !important;

                    .v_btn {
                        border-radius:0px !important;
                        margin: 2px !important;
                    }

                    .v-divider {
                        display:none;
                    }
                }

                button {
                    width:26px;
                    height:26px;
                    background:#eee;
                    border:1px solid #ccc;
                    margin:2px 20px 2px 0px;

                    span {
                        top:0px;
                        line-height:26px;
                    }

                    &.disabled {
                        opacity:0.5;
                    }
                }

                .field {
                    display:flex;
                    flex-flow:row wrap;
                    justify-content:flex-start;
                    width:54px;
                    height:26px;
                    margin:2px 0px;

                    button {
                        flex:0 0 26px;
                        height:26px;
                        margin:0px 2px 0px 0px;

                        &.highlight {
                            color:white;
                            background: $dark_blue;
                        }
                    }

                    input {
                        width:26px;
                        text-align:center;
                        font-size:90%;
                        font-weight:700;
                        height:26px;
                        line-height:26px;
                        border:1px solid #888;
                    }
                }
            }
        }

        &:hover {
            outline:1px solid #ccc;
            .hovermenu {
                transform:translateX(0);
                opacity:1;
                pointer-events:all;
                transition:0.3s;
            }
        }

        &:after {
            // @include fullsize_bg_pseudo(white, 0.95);
            // @include drop_shadow();
        }

        .addon_wrapper {
            position:relative;
            width:100%;
            height:100%;
            padding:10px;
            box-sizing: border-box;
            // z-index:3;

            .select_wrapper {
                display:flex;
                flex-flow:row wrap;
                justify-content: flex-start;
                width:100%;
                margin:5px auto 5px auto;

                .btn_group {
                    display:flex;
                    flex-flow:row wrap;
                    justify-content: flex-start;
                    flex-basis:100%;

                    button {
                        flex-basis:40px;
                        border-radius:0px;
                        border:1px solid #aaa;
                        margin-right:3px;
                        background-color: #e1e1e1;

                        &.switch {
                            flex-basis:40px;
                            border-radius:0px;
                            background-color:#eee;

                            &.highlight {
                                color:white;
                                border:none;
                                background-color: $dark_blue;
                            }
                        }
                    }

                    .year_selection {
                        height:30px;
                        flex-basis:120px;
                        border-radius:none;
                        margin:0px 3px;
                        min-height:0px;
                        // border:1px solid #aaa;

                        &.disable {
                            opacity:0.5;
                            pointer-events:none;
                        }
                    }
                }

                .feature_selection {
                    flex:1 0 100%;
                    margin:10px auto;
                    padding:10px 0px;
                    // border-top:1px solid #aaa;
                    // border-bottom:1px solid #aaa;
                }
            }
        }
        &.minimized {
            .hovermenu {
                width:152px;
                .btn_grp {
                    button {
                        margin:2px !important;
                        &.ccm_info_button {
                            display: inline-block !important;
                        }
                    }
                }
            }

            .legend {
                margin:0;
                display:none;
            }

            .select_wrapper {

                .year_selection {
                    display:none;
                }

                .btn_group {
                    flex-basis:45%;
                }

                .feature_selection {
                    flex: 1 0 54%;
                    border: none;
                    margin: 0px 2px;
                    height: 30px;
                    min-height: 0px;
                    padding: 0;
                }
            }
        }
    }
</style>
