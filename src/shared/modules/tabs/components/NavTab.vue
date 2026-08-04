<script>

/**
 * NavTab component: A small implementation of navigation tabs, as used for layer information.
 * @module shared/modules/tabs/NavTab
 * @vue-prop {String} id - the id of the navTab-button.
 * @vue-prop {String} label - the label used on the navTab-button.
 * @vue-prop {String} [icon] - optional bootstrap icon class suffix (e.g. 'bi-geo-alt') shown before the label.
 * @vue-prop {Boolean} active - whether the tab is currently active.
 * @vue-prop {Boolean} [disabled] - whether the tab is non-interactive.
 * @vue-prop {String} target - used to specify the id of the element shown by the navTab button (i.e. '#section-1').
 * @vue-prop {String} [value] - optional value attribute for the list element (e.g. &lt;li value="my-value"&gt;).
 * @vue-prop {Function} [interaction] - can be used to bind a function to an interaction with the navTab-button, to be executed on click.
 * @vue-prop {String} [styleVariant] - optional styling variant for the NavTab button (e.g. 'blue')
 */
export default {
    name: "NavTab",
    props: {
        id: {
            type: String,
            required: true
        },
        label: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: false,
            default: ""
        },
        active: {
            type: Boolean,
            required: true
        },
        disabled: {
            type: Boolean,
            required: false,
            default: false
        },
        target: {
            type: String,
            required: true
        },
        value: {
            type: String,
            required: false,
            default: undefined
        },
        interaction: {
            type: Function,
            required: false,
            default: () => {
                return true;
            }
        },
        styleVariant: {
            type: String,
            required: false,
            default: undefined,
            validator: v => !v || ["blue"].includes(v)
        }
    },
    methods: {
        onclick (event) {
            if (this.disabled) {
                return;
            }
            this.interaction(event);
        },
        onkeydown (event) {
            const step = {ArrowLeft: -1, ArrowRight: 1}[event.key];

            if (step === undefined) {
                return;
            }
            const tablist = event.currentTarget.closest("[role=tablist]");

            if (!tablist) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();
            const tabs = [...tablist.querySelectorAll("[role=tab]:not([disabled])")],
                  currentIndex = tabs.indexOf(event.currentTarget),
                  next = currentIndex >= 0
                      ? tabs[(currentIndex + step + tabs.length) % tabs.length]
                      : null;

            next?.focus();
            next?.click();
        }
    }
};
</script>

<template>
    <li
        :class="[
            'nav-item',
            styleVariant && `nav-item--${styleVariant}`
        ]"
        role="presentation"
        :value="value"
    >
        <button
            :id="id"
            :class="['nav-link', {active}, styleVariant && `nav-link--${styleVariant}`]"
            data-bs-toggle="tab"
            :data-bs-target="target"
            type="button"
            role="tab"
            :disabled="disabled"
            :tabindex="active ? 0 : -1"
            :aria-controls="target"
            :aria-selected="active"
            :aria-disabled="disabled"
            :aria-label="label"
            @click="onclick"
            @keydown="onkeydown"
        >
            <i
                v-if="icon"
                class="bi me-2"
                :class="icon"
                aria-hidden="true"
            />
            {{ $t(label) }}
            <slot />
        </button>
    </li>
</template>

<style lang="scss" scoped>
    .nav-link {
        border: none;
        color: $black;

        &.active {
            border: none;
            border-bottom: 3px solid $dark_blue;
            font-family: $font_family_accent;
            &.nav-link--blue {
                color: $link-color;
                border-bottom-color: $link-color;
            }
        }

        &:hover {
            background-color: $light_blue;
            border-radius: 0;
        }

        &--blue {
            color: $link-color;
        }
    }
</style>
