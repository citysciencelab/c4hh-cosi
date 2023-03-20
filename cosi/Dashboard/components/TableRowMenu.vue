<script>
import {mapGetters, mapMutations} from "vuex";
import FieldsTooltip from "./FieldsTooltip.vue";

export default {
    name: "TableRowMenu",
    components: {
        FieldsTooltip
    },
    props: {
        item: {
            type: Object,
            required: true
        },
        fields: {
            type: Object,
            required: true
        },
        selectedItems: {
            type: Array,
            required: true
        }
    },
    data: () => ({
        selectedMenuItem: null
    }),
    computed: {
        ...mapGetters("Tools/ColorCodeMap", ["showMapNames", "playState"]),
        _item () {
            return this.item;
        }
    },
    methods: {
        ...mapMutations("Tools/ColorCodeMap", ["setShowMapNames", "setVisualizationState", "setPlayState", "setSelectedFeature"]),
        renderVisualization () {
            if (!this._item.visualized) {
                this.$emit("visualizationChanged");
                this.setSelectedFeature(this._item.category);
                this._item.visualized = true;
            }
            else {
                this._item.visualized = false;
            }

            this.setVisualizationState(this._item.visualized);
        }
    }
};
</script>

<template>
    <div class="no-wrap">
        <v-menu
            left
            nudge-top="280"
            nudge-left="40"
            :close-on-content-click="false"
            @input="selectedMenuItem = null"
        >
            <template #activator="{ on, attrs }">
                <v-icon
                    title="Menü öffnen"
                    class="open-burger-menu"
                    v-bind="attrs"
                    v-on="on"
                >
                    mdi-dots-vertical
                </v-icon>
            </template>
            <v-card
                class="mx-auto burger-menu"
                max-width="500"
            >
                <v-toolbar
                    color="light-grey"
                    dark
                    dense
                >
                    <v-icon>mdi-home-analytics</v-icon>
                    <v-toolbar-title>{{ _item.category }}</v-toolbar-title>
                </v-toolbar>
                <v-list dense>
                    <v-list-item-group
                        v-model="selectedMenuItem"
                        color="primary"
                    >
                        <v-list-item
                            dense
                            @click="renderVisualization"
                        >
                            <v-list-item-icon>
                                <v-icon>
                                    {{ _item.visualized ? 'mdi-eye' : 'mdi-eye-off' }}
                                </v-icon>
                            </v-list-item-icon>
                            <v-list-item-content>
                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.visualize') }}
                            </v-list-item-content>
                        </v-list-item>
                        <div
                            class="ml-12"
                            :title="!_item.visualized ? 'Visualisierung in der Karte muss aktiv sein.' : ''"
                        >
                            <v-list-item
                                dense
                                :disabled="!_item.visualized"
                                @click="setPlayState(!playState)"
                            >
                                <v-list-item-icon>
                                    <v-icon>{{ playState ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.visualize') }}
                                </v-list-item-content>
                            </v-list-item>
                            <v-list-item
                                dense
                                :disabled="!_item.visualized"
                                :title="!_item.visualized ? 'Visualisierung in der Karte muss aktiv sein.' : ''"
                                @click="setShowMapNames(!showMapNames)"
                            >
                                <v-list-item-icon>
                                    <v-icon>mdi-map-marker</v-icon>
                                </v-list-item-icon>
                                <v-list-item-content>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.districtName') }}
                                </v-list-item-content>
                            </v-list-item>
                        </div>
                        <v-tooltip left>
                            <template #activator="{ on, attrs }">
                                <div
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    <v-list-group
                                        prepend-icon="mdi-checkbox-marked"
                                        no-action
                                    >
                                        <template #activator>
                                            <v-list-item-content class="activator">
                                                <v-list-item-title>
                                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.selection') }}
                                                </v-list-item-title>
                                            </v-list-item-content>
                                        </template>

                                        <v-list-item
                                            id="set-field-A"
                                            dense
                                            @click="$emit('setField', 'A', _item)"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-alpha-a-box</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.selectA') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            id="set-field-B"
                                            dense
                                            @click="$emit('setField', 'B', _item)"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-alpha-b-box</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.selectB') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            dense
                                            @click="$emit('resetFields')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-cancel</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.cancelSelection') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                    </v-list-group>
                                </div>
                            </template>
                            <FieldsTooltip :fields="fields" />
                        </v-tooltip>
                        <v-tooltip left>
                            <template #activator="{ on, attrs }">
                                <div
                                    v-bind="attrs"
                                    v-on="on"
                                >
                                    <v-list-group
                                        prepend-icon="mdi-calculator-variant"
                                        no-action
                                    >
                                        <template #activator>
                                            <v-list-item-content class="activator">
                                                <v-list-item-title>
                                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.calculate') }}
                                                </v-list-item-title>
                                            </v-list-item-content>
                                        </template>

                                        <v-list-item
                                            id="add"
                                            dense
                                            :disabled="!fields.A || !fields.B"
                                            @click="$emit('add')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-plus</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.add') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            id="subtract"
                                            dense
                                            :disabled="!fields.A || !fields.B"
                                            @click="$emit('subtract')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-minus</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.subtract') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            id="multiply"
                                            dense
                                            :disabled="!fields.A || !fields.B"
                                            @click="$emit('multiply')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-close</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.multiply') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            id="divide"
                                            dense
                                            :disabled="!fields.A || !fields.B"
                                            @click="$emit('divide')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-slash-forward</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.divide') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            id="sum"
                                            dense
                                            :disabled="selectedItems.length === 0"
                                            @click="$emit('sum')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-plus-box-multiple</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.sumUpSelected') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            dense
                                            :disabled="selectedItems.length === 0 || !fields.B"
                                            @click="$emit('divideSelected')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-calculator</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.divideSelected') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                    </v-list-group>
                                    <v-list-group
                                        prepend-icon="mdi-file-chart"
                                        no-action
                                    >
                                        <template #activator>
                                            <v-list-item-content class="activator">
                                                <v-list-item-title>
                                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.charts') }}
                                                </v-list-item-title>
                                            </v-list-item-content>
                                        </template>

                                        <v-list-item
                                            id="standard-charts"
                                            dense
                                            @click="$emit('renderCharts', _item)"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-chart-bar</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.standardCharts') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            id="chart-for-multiple-rows"
                                            dense
                                            :disabled="selectedItems.length <= 1"
                                            @click="$emit('renderGroupedChart')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-chart-areaspline</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.chartForMultipleRows') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                        <v-list-item
                                            id="scatter-chart"
                                            dense
                                            :disabled="!fields.A || !fields.B"
                                            @click="$emit('correlate')"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-chart-scatter-plot</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.correlationChart') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                    </v-list-group>
                                    <template v-if="_item.isTemp">
                                        <v-list-item
                                            dense
                                            @click="$emit('delete', _item.category, _item.group)"
                                        >
                                            <v-list-item-icon>
                                                <v-icon>mdi-delete</v-icon>
                                            </v-list-item-icon>
                                            <v-list-item-content>
                                                {{ $t('common:button.delete') }}
                                            </v-list-item-content>
                                        </v-list-item>
                                    </template>
                                </div>
                            </template>
                            <FieldsTooltip :fields="fields" />
                        </v-tooltip>
                    </v-list-item-group>
                </v-list>
            </v-card>
        </v-menu>
        <v-icon
            :title="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.visualizeTooltip')"
            class="visualize"
            @click="renderVisualization"
        >
            {{ _item.visualized ? 'mdi-eye' : 'mdi-eye-off' }}
        </v-icon>
        <v-icon
            :title="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.expandTooltip')"
            class="expand"
            @click="_item.expanded = !_item.expanded"
        >
            {{ _item.expanded ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
        </v-icon>
    </div>
</template>

<style lang="scss" scoped>
    #dashboard-wrapper {
        .v-list-item--dense {
            min-height: unset;
        }
    }
</style>
