<script>
import {convertColor} from "@shared/js/utils/convertColor.js";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import SettingButton from "../shared/modules/settingButton/components/SettingButton.vue";

export default {
    name: "StoryCreatorAddWriteCardStroke",
    components: {
        SliderItem,
        SettingButton
    },
    props: {
        currentLayout: {
            type: Object,
            required: true
        },
        setCurrentLayout: {
            type: Function,
            required: true
        }
    },
    data () {
        return {
            activeLayoutKey: ""
        };
    },
    methods: {
        convertColor,

        /**
         * Activates the color setting and opens its native color picker.
         * @param {String} layoutKey - The color layout setting key.
         * @param {String} pickerId - The color input element id.
         * @param {Event} event - The button click event.
         * @returns {void}
         */
        handleColorButtonClick (layoutKey, pickerId, event) {
            this.setActiveLayoutKey(layoutKey);

            if (event.target.id === pickerId) {
                return;
            }

            const picker = document.getElementById(pickerId);

            picker?.showPicker?.();
        },

        /**
         * Sets the active layout setting.
         * @param {String} layoutKey - The layout setting key.
         * @returns {void}
         */
        setActiveLayoutKey (layoutKey) {
            this.activeLayoutKey = layoutKey;
        },

        /**
         * Updates a value in the current stroke layout.
         * @param {String} layoutKey - The layout setting key.
         * @param {String|Number} value - The new layout value.
         * @returns {void}
         */
        updateCurrentLayout (layoutKey, value) {
            const currentLayout = {...this.currentLayout};

            if (layoutKey === "color") {
                currentLayout[layoutKey] = this.convertColor(value, "rgb");
            }
            else if (layoutKey === "type") {
                currentLayout[layoutKey] = value;
                this.activeLayoutKey = "";
            }
            else if (layoutKey === "width") {
                currentLayout[layoutKey] = parseFloat(value);
            }

            this.setCurrentLayout(currentLayout);
        }
    }
};
</script>

<template>
    <div class="d-flex flex-column gap-3 w-100">
        <div class="d-flex flex-row align-items-center">
            <div class="dropdown">
                <SettingButton
                    id="stroke-layout-type"
                    :aria-label="$t('additional:modules.storyCreator.labels.lineType')"
                    :title="$t('additional:modules.storyCreator.labels.lineType')"
                    :icon="currentLayout.type === 'line' ? 'bi bi-slash' : 'bi bi-arrow-up-right'"
                    :value="$t(`additional:modules.storyCreator.buttons.${currentLayout.type}`)"
                    :active="activeLayoutKey === 'type'"
                    @click="setActiveLayoutKey('type')"
                />
                <ul
                    v-if="activeLayoutKey === 'type'"
                    class="dropdown-menu show"
                >
                    <li>
                        <button
                            type="button"
                            class="dropdown-item"
                            :class="{active: currentLayout.type === 'line'}"
                            @click="updateCurrentLayout('type', 'line')"
                        >
                            <i class="bi bi-slash" />
                            {{ $t('additional:modules.storyCreator.buttons.line') }}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            class="dropdown-item"
                            :class="{active: currentLayout.type === 'arrow'}"
                            @click="updateCurrentLayout('type', 'arrow')"
                        >
                            <i class="bi bi-arrow-up-right" />
                            {{ $t('additional:modules.storyCreator.buttons.arrow') }}
                        </button>
                    </li>
                </ul>
            </div>
            <SettingButton
                id="stroke-layout-color"
                :aria-label="$t('additional:modules.storyCreator.labels.lineColor')"
                :title="$t('additional:modules.storyCreator.labels.lineColor')"
                icon="bi bi-palette"
                :active="activeLayoutKey === 'color'"
                @click="handleColorButtonClick('color', 'color-picker-stroke', $event)"
            >
                <input
                    id="color-picker-stroke"
                    type="color"
                    :value="convertColor(currentLayout.color, 'hex')"
                    @input="updateCurrentLayout('color', $event.target.value)"
                >
            </SettingButton>
            <SettingButton
                id="stroke-layout-width"
                :aria-label="$t('additional:modules.storyCreator.labels.lineWidth')"
                :title="$t('additional:modules.storyCreator.labels.lineWidth')"
                icon="bi bi-border-width"
                :value="`${currentLayout.width}px`"
                :active="activeLayoutKey === 'width'"
                @click="setActiveLayoutKey('width')"
            />
        </div>
        <div
            v-if="activeLayoutKey === 'width'"
            class="w-100"
        >
            <SliderItem
                id="stroke-width"
                :aria="`${currentLayout.width}px`"
                :label="`${currentLayout.width}px`"
                min="1"
                max="20"
                :value="currentLayout.width.toString()"
                :step="1"
                :interaction="(event) => updateCurrentLayout('width', event.target.value)"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
.dropdown-menu {
    .dropdown-item {
        color: $black;

        &:hover,
        &:focus {
            background-color: $secondary;
            color: $white;
        }

        &.active {
            background-color: $dark_blue;
            color: $white;
        }
    }
}
</style>
