<script>
import NavTab from "@shared/modules/tabs/components/NavTab.vue";

export const TAB_SET_CURRENT = Symbol("tabContainer.setCurrentTab");

export default {
    name: "TabContainer",
    components: {
        NavTab
    },
    provide () {
        return {
            [TAB_SET_CURRENT]: this.setCurrentTab
        };
    },
    props: {
        /**
         * List of tab descriptors for navigation and content rendering.
         * @type {Object[]}
         * @example
         * {
         * id: "tabSearch", // Unique identifier for the tab (used as `key` and `aria-labelledby`).
         * contentId: "tabSearchContent", // id of the tab content pane.
         * ref: "tabSearchRef", // Optional Vue ref name to reference the tab content component.
         * label: "Search", // label shown in the tab navigation.
         * component: TabSearch, // The Vue component to render inside the tab pane.
         * propsForTabContent: { query: '' }, // Optional props object to be bound to the tab component.
         * renderComponent: true // If false, skips rendering the tab content. Can be used to wait rendering while loading data for the tab in TabContainer
         * }
         */
        tabs: {
            type: Array,
            required: true
        },
        initialActiveTabId: {
            type: String,
            default: "",
            required: false
        }
    },
    data () {
        return {
            activeTabIdLocal: this.initialActiveTabId || this.tabs[0]?.id || null
        };
    },
    computed: {},
    methods: {
        setCurrentTab (tabId) {
            this.activeTabIdLocal = tabId;
        }
    }
};
</script>

<template>
    <div id="TabContainer">
        <ul
            id="tabNavs"
            class="nav nav-tabs nav-justified"
            role="tablist"
        >
            <NavTab
                v-for="tab in tabs"
                :id="tab.id"
                :key="tab.id"
                :active="activeTabIdLocal === tab.id"
                :target="`#${tab.contentId}`"
                :label="tab.label"
                @click="setCurrentTab(tab.id)"
            />
        </ul>

        <div
            id="tabContents"
            class="tab-content"
        >
            <div
                v-for="tab in tabs"
                :id="tab.contentId"
                :key="tab.id"
                class="tab-pane fade"
                :class="activeTabIdLocal === tab.id ? 'show active' : ''"
                role="tabpanel"
                :aria-labelledby="tab.id"
                tabindex="0"
            >
                <component
                    :is="tab.component"
                    v-if="tab.renderComponent"
                    :ref="tab.ref"
                    v-bind="tab.propsForTabContent"
                />
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
#TabContainer {
    height: 100%;

    div.tab-content {
        height: 100%;

        div.tab-pane {
            height: 100%;
        }
    }
}
</style>
