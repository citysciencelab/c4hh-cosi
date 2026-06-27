<script>
import {VSkeletonLoader} from "vuetify/components/VSkeletonLoader";

export default {
    name: "TabBar",
    components: {
        VSkeletonLoader
    },
    props: {
        activeItem: {
            type: Object,
            required: true
        },
        items: {
            type: Array,
            required: true
        },
        loading: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        /**
         * Checks whether the passed item is different from the active item.
         * If the items are different, a change event is emitted and the item is passed as payload.
         * @param {Object} item - The item to be checked.
         * @param {Object} activeItem - The currently active item to which the passed item is compared.
         * @returns {void}
         */
        emitChange (item, activeItem) {
            if (item.type !== activeItem.type) {
                this.$emit("change", item);
            }
        }
    }
};
</script>
<template lang="html">
    <div class="tab-bar">
        <v-skeleton-loader
            v-if="loading"
            type="button,button"
        />
        <ul
            v-else
            class="nav nav-fill p-0"
        >
            <li
                v-for="item in items"
                :key="item.type"
                class="nav-item"
                role="button"
                tabindex="0"
            >
                <button
                    class="nav-link p-2"
                    :class="{active: activeItem.type === item.type}"
                    :disabled="item.disabled"
                    @click="emitChange(item, activeItem)"
                    @keypress="emitChange(item, activeItem)"
                >
                    <i
                        v-if="item.icon"
                        class="mr-1"
                        :class="item.icon"
                    />
                    {{ $t(item.text) }}
                </button>
            </li>
        </ul>
    </div>
</template>

<style lang="scss">
    .tab-bar {
        .nav {
            font-size: $font_size_big;
        }
        .nav-link {
            color: var(--bs-dark);
        }
        .active {
            font-family: $font_family_accent;
            border-bottom: 2px solid #3C5F94;
            color: #3C5F94 !important;
        }
        .v-skeleton-loader__button {
            max-width: 50%;
            height: 50px;
            margin: 0 16px 0 0;
        }
        li:has(button:disabled) {
            cursor: not-allowed;
            opacity: 0.6;
        }
    }
</style>
