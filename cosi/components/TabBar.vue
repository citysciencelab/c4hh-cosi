<script>
export default {
    name: "TabBar",
    props: {
        items: {
            type: Array,
            required: true
        },
        activeItem: {
            type: Object,
            required: true
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
    <ul class="nav fs-5 justify-content-between p-0">
        <li
            v-for="item in items"
            :key="item.type"
            class="nav-item"
            role="button"
            tabindex="0"
            @click="emitChange(item, activeItem)"
            @keypress="emitChange(item, activeItem)"
        >
            <button
                class="nav-link p-2"
                :class="{active: activeItem.type === item.type}"
            >
                <i
                    v-if="item.icon"
                    class="mr-1"
                    :class="item.icon"
                />
                {{ item.text }}
            </button>
        </li>
    </ul>
</template>

<style lang="scss" scoped>
    .nav-link {
        color: var(--bs-dark);
    }
    .active {
        font-family: $font_family_accent;
        border-bottom: 2px solid #3C5F94;
        color: #3C5F94 !important;
    }
</style>
