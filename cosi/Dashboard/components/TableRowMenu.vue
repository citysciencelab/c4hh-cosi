<script>
import {mapGetters, mapMutations, mapActions} from "vuex";
import FieldsTooltip from "./FieldsTooltip.vue";
import {VIcon} from "vuetify/components/VIcon";
import {VToolbar, VToolbarTitle} from "vuetify/components/VToolbar";
import {VListItem, VList, VListGroup} from "vuetify/components/VList";
import {VMenu} from "vuetify/components/VMenu";
import {VCard} from "vuetify/components/VCard";
import {VTooltip} from "vuetify/components/VTooltip";

export default {
    name: "TableRowMenu",
    components: {
        FieldsTooltip,
        VCard,
        VIcon,
        VListGroup,
        VMenu,
        VToolbar,
        VToolbarTitle,
        VList,
        VListItem,
        VTooltip
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
        ...mapGetters("Modules/ColorCodeMap", ["showMapNames", "playState"]),
        _item () {
            return this.item;
        }
    },
    methods: {
        ...mapMutations("Modules/ColorCodeMap", ["setShowMapNames", "setVisualizationState", "setPlayState", "setSelectedFeature"]),
        ...mapActions("Modules/ColorCodeMap", ["renderVisualization"]),
        renderFeature () {
            if (!this._item.visualized) {
                this.$emit("visualizationChanged");
                this.setSelectedFeature(this._item.category);
                this._item.visualized = true;
            }
            else {
                this._item.visualized = false;
            }

            this.setVisualizationState(this._item.visualized);
            this.renderVisualization();
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
            <template #activator="{ props }">
                <v-icon
                    title="Menü öffnen"
                    class="open-burger-menu"
                    v-bind="props"
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
                    density="compact"
                >
                    <v-icon>mdi-home-analytics</v-icon>
                    <v-toolbar-title>{{ _item.category }}</v-toolbar-title>
                </v-toolbar>
                <v-list
                    v-model="selectedMenuItem"
                    density="compact"
                    color="primary"
                >
                    <v-list-item
                        density="compact"
                        @click="renderFeature"
                    >
                        <v-icon>
                            {{ _item.visualized ? 'mdi-eye' : 'mdi-eye-off' }}
                        </v-icon>
                        {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.visualize') }}
                    </v-list-item>
                    <div
                        class="ml-12"
                        :title="!_item.visualized ? 'Visualisierung in der Karte muss aktiv sein.' : ''"
                    >
                        <v-list-item
                            density="compact"
                            :disabled="!_item.visualized"
                            @click="setPlayState(!playState)"
                        >
                            <v-icon>{{ playState ? 'mdi-pause' : 'mdi-play' }}</v-icon>
                            {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.visualize') }}
                        </v-list-item>
                        <v-list-item
                            density="compact"
                            :disabled="!_item.visualized"
                            :title="!_item.visualized ? 'Visualisierung in der Karte muss aktiv sein.' : ''"
                            @click="setShowMapNames(!showMapNames)"
                        >
                            <v-icon>mdi-map-marker</v-icon>
                            {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.districtName') }}
                        </v-list-item>
                    </div>
                    <v-tooltip left>
                        <template #activator="{ props }">
                            <v-list-group
                                v-bind="props"
                                no-action
                            >
                                <template #activator=" {props}">
                                    <v-list-item
                                        v-bind="props"
                                        prepend-icon="mdi-checkbox-marked"
                                        :title="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.selection')"
                                    />
                                </template>

                                <v-list-item
                                    id="set-field-A"
                                    density="compact"
                                    @click="$emit('setField', 'A', _item)"
                                >
                                    <v-icon>mdi-alpha-a-box</v-icon>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.selectA') }}
                                </v-list-item>
                                <v-list-item
                                    id="set-field-B"
                                    density="compact"
                                    @click="$emit('setField', 'B', _item)"
                                >
                                    <v-icon>mdi-alpha-b-box</v-icon>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.selectB') }}
                                </v-list-item>
                                <v-list-item
                                    density="compact"
                                    @click="$emit('resetFields')"
                                >
                                    <v-icon>mdi-cancel</v-icon>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.cancelSelection') }}
                                </v-list-item>
                            </v-list-group>
                        </template>
                        <FieldsTooltip :fields="fields" />
                    </v-tooltip>
                    <v-tooltip left>
                        <template #activator="{ props }">
                            <v-list-group
                                no-action
                                v-bind="props"
                            >
                                <template #activator=" {props}">
                                    <v-list-item
                                        v-bind="props"
                                        prepend-icon="mdi-file-chart"
                                        :title="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.charts')"
                                    />
                                </template>
                                <v-list-item
                                    id="standard-charts"
                                    density="compact"
                                    @click="$emit('renderCharts', _item)"
                                >
                                    <v-icon>mdi-chart-bar</v-icon>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.standardCharts') }}
                                </v-list-item>
                                <v-list-item
                                    id="chart-for-multiple-rows"
                                    density="compact"
                                    :disabled="selectedItems.length <= 1"
                                    @click="$emit('renderGroupedChart')"
                                >
                                    <v-icon>mdi-chart-areaspline</v-icon>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.chartForMultipleRows') }}
                                </v-list-item>
                                <v-list-item
                                    id="scatter-chart"
                                    density="compact"
                                    :disabled="!fields.A || !fields.B"
                                    @click="$emit('correlate')"
                                >
                                    <v-icon>mdi-chart-scatter-plot</v-icon>
                                    {{ $t('additional:modules.tools.cosi.dashboard.tableRowMenu.correlationChart') }}
                                </v-list-item>
                            </v-list-group>
                            <template v-if="_item.isTemp">
                                <v-list-item
                                    density="compact"
                                    @click="$emit('delete', _item.category, _item.group)"
                                >
                                    <v-icon>mdi-delete</v-icon>
                                    {{ $t('common:button.delete') }}
                                </v-list-item>
                            </template>
                        </template>
                        <FieldsTooltip :fields="fields" />
                    </v-tooltip>
                </v-list>
            </v-card>
        </v-menu>
        <v-icon
            :title="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.visualizeTooltip')"
            class="visualize"
            @click="renderFeature"
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
