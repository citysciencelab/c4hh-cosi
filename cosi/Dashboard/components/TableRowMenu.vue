<script>
import {mapActions, mapMutations} from "vuex";
import {VIcon} from "vuetify/components/VIcon";

export default {
    name: "TableRowMenu",
    components: {
        VIcon
    },
    props: {
        item: {
            type: Object,
            required: true
        }
    },
    data: () => ({
        selectedMenuItem: null
    }),
    computed: {
        _item () {
            return this.item;
        },
        isItemVisualized () {
            return this._item.visualized;
        }
    },
    methods: {
        ...mapMutations("Modules/ColorCodeMap", ["setVisualizationState", "setSelectedFeature"]),
        ...mapActions("Modules/ColorCodeMap", ["renderVisualization"]),
        renderFeature () {
            if (!this._item.visualized) {
                this.$emit("visualizationChanged");
                this.setSelectedFeature(this._item.category);
                this._item.visualized = true;
            }
            else {
                this.$emit("visualizationChanged");
            }

            this.setVisualizationState(this._item.visualized);
            this.renderVisualization();
        }
    }
};
</script>

<template>
    <div class="no-wrap">
        <v-icon
            :title="$t('additional:modules.tools.cosi.dashboard.tableRowMenu.visualizeTooltip')"
            class="visualize"
            @click="renderFeature"
        >
            {{ isItemVisualized ? 'mdi-eye' : 'mdi-eye-off' }}
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
