<script>
import {convertColor} from "@shared/js/utils/convertColor.js";
import SliderItem from "@shared/modules/slider/components/SliderItem.vue";
import SettingButton from "../shared/modules/settingButton/components/SettingButton.vue";

export default {
    name: "StoryCreatorAddWriteCardText",
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
         * Activates a color setting and opens its native color picker.
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
         * Updates a value in the current text layout.
         * @param {String} layoutKey - The layout setting key.
         * @param {String|Number} value - The new layout value.
         * @returns {void}
         */
        updateCurrentLayout (layoutKey, value) {
            const currentLayout = {...this.currentLayout};

            if (layoutKey === "textColor" || layoutKey === "backgroundColor") {
                currentLayout[layoutKey] = this.convertColor(value, "rgb");
            }
            else if (layoutKey === "fontSize" || layoutKey === "backgroundOpacity") {
                currentLayout[layoutKey] = parseFloat(value);
            }
            else if (layoutKey === "fontStyle") {
                currentLayout[layoutKey] = value;
                this.activeLayoutKey = "";
            }

            this.setCurrentLayout(currentLayout);
        }

    }
};
</script>

<template>
    <div class="d-flex flex-column gap-3 w-100">
        <div class="d-flex flex-row align-items-center">
            <SettingButton
                id="text-layout-textColor"
                :aria-label="$t('additional:modules.storyCreator.labels.textColor')"
                :title="$t('additional:modules.storyCreator.labels.textColor')"
                icon="bi bi-paint-bucket"
                :active="activeLayoutKey === 'textColor'"
                @click="handleColorButtonClick('textColor', 'color-picker-textColor', $event)"
            >
                <input
                    id="color-picker-textColor"
                    type="color"
                    :value="convertColor(currentLayout.textColor, 'hex')"
                    @input="updateCurrentLayout('textColor', $event.target.value)"
                >
            </SettingButton>
            <SettingButton
                id="text-layout-fontSize"
                :aria-label="$t('additional:modules.storyCreator.labels.fontSize')"
                :title="$t('additional:modules.storyCreator.labels.fontSize')"
                icon="bi bi-border-width"
                :value="`${currentLayout.fontSize}px`"
                :active="activeLayoutKey === 'fontSize'"
                @click="setActiveLayoutKey('fontSize')"
            />
            <div class="dropdown">
                <SettingButton
                    id="text-layout-fontStyle"
                    :aria-label="$t('additional:modules.storyCreator.labels.fontStyle')"
                    :title="$t('additional:modules.storyCreator.labels.fontStyle')"
                    icon="bi bi-fonts"
                    :value="$t(`additional:modules.storyCreator.labels.${currentLayout.fontStyle}`)"
                    :active="activeLayoutKey === 'fontStyle'"
                    @click="setActiveLayoutKey('fontStyle')"
                />
                <ul
                    v-if="activeLayoutKey === 'fontStyle'"
                    class="dropdown-menu show"
                >
                    <li>
                        <button
                            type="button"
                            class="dropdown-item"
                            :class="{active: currentLayout.fontStyle === 'regular'}"
                            @click="updateCurrentLayout('fontStyle', 'regular')"
                        >
                            <i class="bi bi-fonts" /> {{ $t('additional:modules.storyCreator.labels.regular') }}
                        </button>
                    </li>
                    <li>
                        <button
                            type="button"
                            class="dropdown-item"
                            :class="{active: currentLayout.fontStyle === 'bold'}"
                            @click="updateCurrentLayout('fontStyle', 'bold')"
                        >
                            <i class="bi bi-type-bold" /> {{ $t('additional:modules.storyCreator.labels.bold') }}
                        </button>
                    </li>

                    <li>
                        <button
                            type="button"
                            class="dropdown-item"
                            :class="{active: currentLayout.fontStyle === 'italic'}"
                            @click="updateCurrentLayout('fontStyle', 'italic')"
                        >
                            <i class="bi bi-type-italic" /> {{ $t('additional:modules.storyCreator.labels.italic') }}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
        <div
            v-if="activeLayoutKey === 'fontSize'"
            class="w-100"
        >
            <SliderItem
                id="text-font-size"
                :aria="`${currentLayout.fontSize}px`"
                :label="`${currentLayout.fontSize}px`"
                min="8"
                max="72"
                :value="currentLayout.fontSize.toString()"
                :step="1"
                :interaction="(event) => updateCurrentLayout('fontSize', event.target.value)"
            />
        </div>
        <h5>
            {{ $t('additional:modules.storyCreator.headlines.background') }}
        </h5>
        <div class="d-flex flex-row align-items-center">
            <SettingButton
                id="text-layout-backgroundColor"
                :aria-label="$t('additional:modules.storyCreator.labels.backgroundColor')"
                :title="$t('additional:modules.storyCreator.labels.backgroundColor')"
                icon="bi bi-palette"
                :active="activeLayoutKey === 'backgroundColor'"
                @click="handleColorButtonClick('backgroundColor', 'color-picker-backgroundColor', $event)"
            >
                <input
                    id="color-picker-backgroundColor"
                    type="color"
                    :value="convertColor(currentLayout.backgroundColor, 'hex')"
                    @input="updateCurrentLayout('backgroundColor', $event.target.value)"
                >
            </SettingButton>
            <SettingButton
                id="text-layout-backgroundOpacity"
                :aria-label="$t('additional:modules.storyCreator.labels.backgroundOpacity')"
                :title="$t('additional:modules.storyCreator.labels.backgroundOpacity')"
                icon="bi bi-droplet"
                :value="`${currentLayout.backgroundOpacity}%`"
                :active="activeLayoutKey === 'backgroundOpacity'"
                @click="setActiveLayoutKey('backgroundOpacity')"
            />
        </div>
        <div
            v-if="activeLayoutKey === 'backgroundOpacity'"
            class="w-100"
        >
            <SliderItem
                id="text-background-opacity"
                :aria="`${currentLayout.backgroundOpacity}%`"
                :label="`${currentLayout.backgroundOpacity}%`"
                min="0"
                max="100"
                :value="currentLayout.backgroundOpacity.toString()"
                :step="1"
                :interaction="(event) => updateCurrentLayout('backgroundOpacity', event.target.value)"
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
