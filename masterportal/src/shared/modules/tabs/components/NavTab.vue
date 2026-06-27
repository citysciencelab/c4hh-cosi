<script>

/**
 * NavTab component: A small implementation of navigation tabs, as used for layer information.
 * @module shared/modules/tabs/NavTab
 * @vue-prop {String} id - the id of the navTab-button.
 * @vue-prop {String} label - the label used on the navTab-button.
 * @vue-prop {String} icon - optional bootstrap icon class suffix (e.g. 'bi-geo-alt') shown before the label.
 * @vue-prop {Boolean} active - whether the tab is currently active.
 * @vue-prop {String} target - used to specify the id of the element shown by the navTab button (i.e. '#section-1').
 * @vue-prop {String} value - optional value attribute for the list element (e.g. <li value="my-value">)
 * @vue-prop {Function} interaction - can be used to bind a function to an interaction with the navTab-button, to be executed on click.
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
        }
    },
    methods: {
        onkeydown (event) {
            const step = {ArrowLeft: -1, ArrowRight: 1}[event.key];

            if (step === undefined) {
                return;
            }
            event.preventDefault();
            const tabs = [...event.currentTarget.closest("[role=tablist]").querySelectorAll("[role=tab]")],
                next = tabs[(tabs.indexOf(event.currentTarget) + step + tabs.length) % tabs.length];

            next?.focus();
            next?.click();
        }
    }
};
</script>

<template>
    <li
        class="nav-item"
        role="presentation"
        :value="value"
    >
        <button
            :id="id"
            class="nav-link"
            :class="active ? 'active' : ''"
            data-bs-toggle="tab"
            :data-bs-target="target"
            type="button"
            role="tab"
            :tabindex="active ? 0 : -1"
            :aria-controls="target"
            :aria-selected="active"
            :aria-label="label"
            @click="interaction"
            @keydown="onkeydown"
        >
            <i
                v-if="icon"
                class="bi me-2"
                :class="icon"
                aria-hidden="true"
            />
            {{ $t(label) }}
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
        }

        &:hover {
            background-color: $light_blue;
            border-radius: 0;
        }
    }
</style>
