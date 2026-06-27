<script>
import {mapActions} from "vuex";
import IconButton from "@shared/modules/buttons/components/IconButton.vue";

/**
 * Wfs Transaction
 * @module modules/WfsTransaction
 * @description This module handles the selection interactions for WFS transactions,
 * providing buttons for different selection types (e.g., select, box, pen).
 */
export default {
    name: "SelectTypeButtons",
    components: {IconButton},
    props: {
        selectTypes: {
            type: Array,
            default: () => ["select", "box", "pen"]
        },
        selectIcons: {
            type: Object,
            default: () => ({
                select: "bi-cursor-fill",
                box: "bi-bounding-box",
                pen: "bi-pencil-fill"
            })
        }
    },
    data () {
        return {
            selectedSelectInteraction: "select",
            previousSelectType: null
        };
    },
    methods: {
        ...mapActions("Modules/Wfst", ["handleLassoInteraction", "handleBoxInteraction", "handleClickInteraction"]),
        /**
         * Regulates the select interactions based on the selected type.
         * Updates the `selectedSelectInteraction` and calls `updateInteractions`.
         * @param {string} selectType - The type of interaction selected.
         * @param {number} key - The key of the selected interaction.
         * @returns {void}
         */
        selectSelectInteraction (selectType, key) {
            this.previousSelectType = this.selectedSelectInteraction;

            if (this.previousSelectType === selectType) {
                this.selectedSelectInteraction = "select";
            }
            else {
                this.selectedSelectInteraction = selectType;
            }

            this.updateInteractions(key);
        },
        /**
         * Updates the interactions based on the currently selected interaction type.
         * Calls the appropriate handler method for the selected interaction.
         * @returns {void}
         */
        updateInteractions () {
            if (this.selectedSelectInteraction === "box") {
                this.handleBoxInteraction();
            }
            else if (this.selectedSelectInteraction === "pen") {
                this.handleLassoInteraction();
            }
            else {
                this.handleClickInteraction();
            }
        }
    }
};
</script>

<template lang="html">
    <IconButton
        v-for="(selectType, key) in selectTypes"
        :id="'select-' + selectType"
        :key="key"
        :aria="selectedSelectInteraction === selectType ? $t('common:modules.wfst.multiUpdate.buttonIcon.active.' + selectType) : $t('common:modules.wfst.multiUpdate.buttonIcon.notActive.' + selectType)"
        :class-array="[
            'btn-primary',
            'me-3',
            selectedSelectInteraction === selectType ? 'active': '',
        ]"
        :interaction="() => selectSelectInteraction(selectType, key)"
        :icon="selectIcons[selectType]"
    />
</template>

<style lang="scss" scoped>

</style>
