<script>
import {mapActions, mapGetters, mapMutations} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

/**
 * Represents a filter button for a layer in the layertree.
 * @module modules/layerTree/components/LayerComponentIconFilter
 * @vue-prop {Object} layerConf - The current layer configuration.
 */
export default {
    name: "LayerComponentIconFilter",
    components: {IconButton},
    props: {
        /** current layer configuration */
        layerConf: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Modules/Filter", ["icon", "name", "menuSide"]),
        ...mapGetters("Menu", ["expanded"])
    },
    methods: {
        ...mapActions("Menu", ["changeCurrentComponent", "toggleMenu"]),
        ...mapMutations("Modules/Filter", ["setSelectedAccordions"]),

        /**
         * Opens the filter tool and opens the accordion of the referenced filter id.
         * @returns {void}
         */
        showFilter () {
            this.setSelectedAccordions([{filterId: this.layerConf.filterRefId, layerId: this.layerConf.id}]);
            this.changeCurrentComponent({type: "filter", side: this.menuSide, props: {"name": this.name, "icon": this.icon}});

            if (!this.expanded(this.menuSide)) {
                this.toggleMenu(this.menuSide);
            }
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="typeof layerConf.filterRefId === 'number'"
    >
        <IconButton
            :class-array="['btn-light']"
            :aria="$t('common:modules.filter.name')"
            :icon="icon"
            :interaction="() => showFilter()"
        />
    </div>
</template>

