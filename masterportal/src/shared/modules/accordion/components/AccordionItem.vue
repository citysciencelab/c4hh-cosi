<script>

/**
 * AccordionItem: An accordion component with a foldable slot to show or hide information dynamically through user-interaction.
 * @module shared/modules/accordion/AccordionItem
 * @vue-prop {String} id - sets the id to be used for the accordion container, the resulting id will be accordion-container-id.
 * @vue-prop {String} title - sets the title to be shown even when the accordion is closed.
 * @vue-prop {Boolean|String} icon - sets an optional (bootstrap-)icon to be displayed next to the title.
 * @vue-prop {Boolean} isOpen - manages the state of the accordion.
 * @vue-prop {String} fontSize - defaults to font-size-big (1.167rem) and can be changed to use a different size.
 * @vue-prop {Boolean} colouredHeader - if true, the title of the accordion will have a light blue background.
 * @vue-prop {Boolean} useIndentation - if true, keeps the default accordion button left padding.
 * @vue-prop {String} headingLevel - sets the heading level for the accordion title (e.g., h1, h2, h3).
 * @vue-prop {String} iconMarginEnd - sets the margin-end utility class for the icon (e.g., me-2, me-3).
 * @vue-prop {String} subTitle - sets an optional subtitle to be displayed below the title.
 * @vue-prop {String} subFontSize - defaults to font-size-base (1rem) and can be changed to use a different size for the subtitle.
 * @vue-prop {String} badgeText - sets an optional text to be displayed in a badge right of the title/subtitle block.
 * @vue-prop {Boolean} withBorder - if true, the accordion will have a border around it and a border between the title and the content.
 * @vue-event {updateAccordionState} - emitted when the accordion state changes, passing a boolean indicating whether the accordion is open.
 */
export default {
    name: "AccordionItem",
    props: {
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        icon: {
            type: [Boolean, String],
            required: false,
            default: false
        },
        isOpen: {
            type: Boolean,
            required: false,
            default: false
        },
        fontSize: {
            type: String,
            required: false,
            default: "font-size-big",
            validator: value => ["font-size-base", "font-size-big", "font-size-small"].includes(value)
        },
        colouredHeader: {
            type: Boolean,
            required: false,
            default: null
        },
        useIndentation: {
            type: Boolean,
            required: false,
            default: false
        },
        headingLevel: {
            type: String,
            required: false,
            default: "div",
            validator: value => ["h1", "h2", "h3", "h4", "h5", "h6", "div"].includes(value)
        },
        iconMarginEnd: {
            type: String,
            required: false,
            default: "me-3"
        },
        subTitle: {
            type: String,
            required: false,
            default: null
        },
        subFontSize: {
            type: String,
            required: false,
            default: "font-size-base",
            validator: value => ["font-size-base", "font-size-big", "font-size-small"].includes(value)
        },
        badgeText: {
            type: String,
            required: false,
            default: null
        },
        withBorder: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ["updateAccordionState"],
    methods: {
        updateState (event) {
            this.$emit("updateAccordionState", event.target.classList.contains("collapsed"));
        }
    }
};
</script>

<template>
    <div
        :id="`accordion-container-${id}`"
        class="accordion accordion-bg accordion-flush"
        :class="[!colouredHeader && !withBorder ? 'border-0' : 'pt-2 pb-2', withBorder? 'border-1 border rounded-2' : '']"
    >
        <div
            class="accordion-item"
        >
            <component
                :is="headingLevel"
                v-if="title"
                :id="`flush-heading-${id}`"
                class="accordion-header ms-0"
                :class="[withBorder ? 'px-3' : '']"
            >
                <button
                    :class="[
                        'accordion-button',
                        badgeText ? 'has-badge' : '',
                        fontSize,
                        !isOpen? 'collapsed' : '',
                        colouredHeader ? 'rounded' : useIndentation ? '' : 'ps-0'
                    ]"
                    type="button"
                    :coloured="colouredHeader"
                    data-bs-toggle="collapse"
                    :data-bs-target="`#flush-collapse-${id}`"
                    aria-expanded="true"
                    :aria-controls="`#flush-collapse-${id}`"
                    @click="updateState"
                    @keydown.enter="updateState"
                >
                    <i
                        v-if="icon"
                        :class="[icon, iconMarginEnd || undefined]"
                    />
                    <span class="d-block">
                        <span class="d-block w-100">
                            {{ title }}
                        </span>
                        <span
                            v-if="subTitle"
                            :class="[subFontSize, 'd-block', 'w-100']"
                        >
                            {{ subTitle }}
                        </span>
                    </span>
                    <span
                        v-if="badgeText"
                        class="badge rounded-pill bg-mp-light-blue text-body mx-auto"
                    >
                        {{ badgeText }}
                    </span>
                </button>
            </component>
            <div
                :id="`flush-collapse-${id}`"
                :class="['accordion-collapse', 'collapse', isOpen ? 'show' : '', withBorder ? 'p-3 border-top' : '']"
                :aria-labelledby="`flush-heading-${id}`"
                :data-bs-parent="`#accordion-container-${id}`"
            >
                <div
                    class="accordion-body"
                    :class="['accordion-body', !colouredHeader? 'pt-0' : 'pb-2']"
                >
                    <slot />
                </div>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .accordion {
        --bs-accordion-border-width: 0;
        --bs-accordion-active-bg: $white;
        --bs-accordion-btn-focus-box-shadow: none;
        .font-size-big {
            font-size: $font_size_big;
        }
        .font-size-base {
            font-size: $font-size-base;
        }
        .font-size-small {
            font-size: $font_size_sm;
        }
        .accordion-button.has-badge::after {
            margin-left: 0;
        }
        [coloured=true] {
                background-color: $light_blue;
        }
    }
</style>
