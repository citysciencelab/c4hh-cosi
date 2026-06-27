<script>
import {mapGetters} from "vuex";
import layerTypes from "@core/layers/js/layerTypes.js";
import LayerCheckBox from "./LayerCheckBox.vue";
import LayerComponentIconFilter from "./LayerComponentIconFilter.vue";
import LayerComponentIconInfo from "./LayerComponentIconInfo.vue";
import LayerComponentIconCustom from "./LayerComponentIconCustom.vue";
import LayerComponentIconSubMenu from "./LayerComponentIconSubMenu.vue";
import LayerComponentSubMenu from "./LayerComponentSubMenu.vue";
import scaleOutOfRangeMixin from "@shared/mixins/scaleOutOfRangeMixin.js";

/**
 * Representation of a layer in layerTree.
 * @module modules/layerTree/components/LayerComponent
 * @vue-prop {Object} conf - The current layer configuration.
 */
export default {
    name: "LayerComponent",
    components: {
        LayerCheckBox,
        LayerComponentIconFilter,
        LayerComponentIconInfo,
        LayerComponentIconCustom,
        LayerComponentIconSubMenu,
        LayerComponentSubMenu
    },
    mixins: [scaleOutOfRangeMixin("conf")],
    props: {
        /** current layer configuration */
        conf: {
            type: Object,
            required: true
        }
    },
    computed: {
        ...mapGetters("Maps", ["mode", "scale", "scales"])
    },
    methods: {
        /**
         * Returns true, if layer configuration shall be shown in tree in current map mode.
         * Filteres by attribute 'showInLayerTree' and respects 'isNeverVisibleInTree' is not true.
         * @returns {Boolean} true, if layer configuration shall be shown in tree
         */
        show () {
            const showLayerTyp = this.mode === "2D" ? !layerTypes.getLayerTypes3d().includes(this.conf.typ?.toUpperCase()) : !layerTypes.getLayerTypesNotVisibleIn3d().includes(this.conf.typ?.toUpperCase());

            if (this.isLayerTree()) {
                return this.conf.showInLayerTree === true && showLayerTyp && this.conf.isNeverVisibleInTree !== true;
            }
            return showLayerTyp && this.conf.isNeverVisibleInTree !== true;
        },
        /**
         * Returns true, if this parent is a 'LayerTreeNode' in layer-tree and false if parent is 'LayerSelectionTreeNode' in layer-selection.
         * @returns {Boolean} true, if this parent is a 'LayerTreeNode' in layer-tree
         */
        isLayerTree () {
            return this.$parent.$options.name !== "LayerSelectionTreeNode";
        }
    }
};
</script>

<template lang="html">
    <div
        v-if="show()"
        :id="'layer-tree-layer-' + conf.id"
        :class="['layer-tree-layer', 'd-flex', 'flex-column', 'justify-content-between', !isLayerTree() ? 'layer-selection': '']"
    >
        <div class="d-flex justify-content-between align-items-center handle-layer-component-drag">
            <span
                :data-bs-toggle="scaleIsOutOfRange ? 'tooltip' : null"
                data-bs-placement="bottom"
                data-bs-custom-class="custom-tooltip"
                :title="scaleIsOutOfRange ? tooltipText : ''"
                class="layer-checkbox-tooltip"
            >
                <LayerCheckBox
                    :conf="conf"
                    :disabled="scaleIsOutOfRange"
                    :is-layer-tree="isLayerTree()"
                />
            </span>
            <div
                class="d-flex"
            >
                <LayerComponentIconFilter
                    :layer-conf="conf"
                />
                <LayerComponentIconSubMenu
                    v-if="isLayerTree()"
                    :layer-conf="conf"
                />
                <LayerComponentIconInfo
                    :is-layer-tree="isLayerTree()"
                    :layer-conf="conf"
                />
                <LayerComponentIconCustom
                    v-if="isLayerTree()"
                    :layer-conf="conf"
                />
            </div>
        </div>
        <div
            v-if="isLayerTree()"
            :id="'collapse-sub-menu-' + conf.id.split('.').join('_')"
            class="collapse"
        >
            <LayerComponentSubMenu :layer-conf="conf" />
        </div>
    </div>
</template>

<style lang="scss" scoped>


    .handle-layer-component-drag {
      position: relative;
    }

    .layer-tree-layer {
      font-size: 0.9rem;

      &.layer-selection {
        margin-left: 0.7rem;
      }
    }

    .layer-checkbox-tooltip {
      overflow-x: hidden;
      overflow-y: visible;
      display: block;
      position: relative;
      width: 100%;

      &:hover + .mp-tooltip {
        visibility: visible;
        opacity: 0.8;

        &::before {
          visibility: visible;
          opacity: 1;
        }
      }
    }

    .mp-tooltip {
      position: absolute;
      display: inline-block;
      visibility: hidden;
      opacity: 0;
      transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
      left: 50%;
      top: 100%;
      margin-top: 6px;
      transform: translateX(-50%);
      background-color: $black;
      color: $white;
      padding: 6px 8px;
      border-radius: 0.25rem;
      font-size: 0.85rem;
      z-index: 2000;
      max-width: 200px;
      white-space: normal;
      word-wrap: break-word;
      text-align: center;

      &::before {
        content: "";
        position: absolute;
        left: 50%;
        top: -12px;
        transform: translateX(-50%) rotate(180deg);
        border-width: 6px;
        border-style: solid;
        border-color: $black transparent transparent transparent;
        z-index: 2000;
        visibility: hidden;
        opacity: 0;
        transition: opacity 0.15s ease-in-out, visibility 0.15s ease-in-out;
      }
    }
</style>
