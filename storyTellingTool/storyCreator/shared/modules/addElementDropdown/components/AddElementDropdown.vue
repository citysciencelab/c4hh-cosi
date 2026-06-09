<script>
export default {
    name: "AddElementDropdown",
    props: {
        /**
         * Optional array of allowed action names to restrict the selection.
         * If empty or not provided, all available items will be displayed.
         * e.g., ['text', 'image']
         */
        allowedActions: {
            type: Array,
            required: false,
            default: () => []
        }
    },
    data () {
        return {
            /**
             * Single source of truth containing all variants the component supports.
             */
            defaultItems: [
                {category: "elements", name: "text", icon: "bi-type", action: "text"},
                {category: "elements", name: "separator", icon: "bi-dash-lg", action: "divider"},
                {category: "media", name: "image", icon: "bi-image", action: "image"},
                {category: "media", name: "video", icon: "bi-play-btn", action: "video"}
            ]
        };
    },
    computed: {
        /**
         * Filters the master list based on allowedActions property and groups them by category.
         * @returns {Object} The filtered and grouped items.
         */
        filteredAndGroupedItems () {
            const groups = {},
                visibleItems = this.allowedActions && this.allowedActions.length > 0
                    ? this.defaultItems.filter(item => this.allowedActions.includes(item.action))
                    : this.defaultItems;

            visibleItems.forEach(item => {
                if (!groups[item.category]) {
                    groups[item.category] = [];
                }
                groups[item.category].push(item);
            });

            return groups;
        }
    },
    methods: {
        /**
         * Constructs the hardcoded path for i18n translation.
         * @param {String} type - 'categories' or 'items'.
         * @param {String} key - The specific identifier.
         * @returns {String} The translated string.
         */
        getTranslation (type, key) {
            return this.$t(`additional:modules.storyCreator.addElementDropdown.${type}.${key}`);
        },
        /**
         * Emits the click event with the corresponding action key to the parent component.
         * @param {String} action - The action identifier of the clicked item.
         * @returns {void}
         */
        emitAction (action) {
            this.$emit("action-triggered", action);
        }
    }
};
</script>

<template lang="html">
    <div class="d-flex justify-content-center mt-3 dropdown-container">
        <div class="dropdown">
            <button
                class="btn btn-secondary add-button dropdown-toggle shadow-sm d-flex align-items-center justify-content-center"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
            >
                <i class="bi bi-plus-lg" />
            </button>

            <ul class="dropdown-menu shadow">
                <template
                    v-for="(groupItems, categoryName, index) in filteredAndGroupedItems"
                    :key="categoryName"
                >
                    <li v-if="index > 0">
                        <hr class="dropdown-divider">
                    </li>

                    <li>
                        <h6
                            class="dropdown-header"
                            :class="{'mt-1': index > 0}"
                        >
                            {{ getTranslation('categories', categoryName) }}
                        </h6>
                    </li>

                    <li
                        v-for="item in groupItems"
                        :key="item.action"
                    >
                        <a
                            class="dropdown-item"
                            href="#"
                            @click.prevent="emitAction(item.action)"
                        >
                            <i :class="['bi', item.icon, 'me-2']" />
                            {{ getTranslation('items', item.name) }}
                        </a>
                    </li>
                </template>
            </ul>
        </div>
    </div>
</template>

<style lang="scss" scoped>
.add-button {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    font-size: 1.25rem;
    background-color: $secondary;
    border: none;

    i {
        line-height: 0;
        color: $white;
    }

    &::after {
        display: none !important;
    }
}

.dropdown-menu {
    border-radius: 8px;
    border: 1px solid $light_grey;
    padding: 0.5rem 0;

    .dropdown-header {
        color: $dark_grey;
        font-size: 0.85rem;
        padding: 0.25rem 1rem;
    }

    .dropdown-divider {
        margin: 0.5rem 0;
        border-color: $light_grey;
    }

    .dropdown-item {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        color: $dark_grey;
        transition: background-color 0.2s ease;

        i {
            color: $placeholder-color;
            font-size: 1.1rem;
            width: 24px;
            text-align: center;
        }

        &:hover, &:focus, &.active {
            background-color: $light_blue;
            color: $black;

            i {
                color: $black;
            }
        }
    }
}
</style>
