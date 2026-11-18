<script>
import MenuContainerBodyRoot from "./MenuContainerBodyRoot.vue";
import MenuNavigation from "./MenuNavigation.vue";
import {mapActions, mapGetters} from "vuex";
import GetFeatureInfo from "../../getFeatureInfo/components/GetFeatureInfo.vue";
import MenuComponentKeepAlivePlaceholder from "./MenuComponentKeepAlivePlaceholder.vue";
import {getPiniaModuleStore, isPiniaModule} from "../../modules-store/piniaModules.js";
import initializePiniaStore from "@shared/js/utils/initializePiniaStore.js";

/**
 * The MenuContainerBody component is responsible for rendering the body of the menu, which includes the navigation, the currently visible component, and any feature information. It manages the state of the menu, including which component is currently displayed and which components should be cached using Vue's keep-alive feature. The component also initializes modules based on the menu configuration.
 * @module modules/MenuContainerBody
 * @vue-prop {String} side - The side in which the menu component is being rendered.
 * @vue-data {String[]} asyncKeepAliveComponentNames - Names of loaded async components that implement the keep-alive hooks.
 * @vue-computed {Object} menu - The menu configuration for the given menu.
 * @vue-computed {Object} currentComponent - Returns the currently visible component.
 */
export default {
    name: "MenuContainerBody",
    components: {
        GetFeatureInfo,
        MenuContainerBodyRoot,
        MenuNavigation,
        MenuComponentKeepAlivePlaceholder
    },
    props: {
        /** Defines in which menu the component is being rendered */
        side: {
            type: String,
            default: "mainMenu",
            validator: value => value === "mainMenu" || value === "secondaryMenu"
        }
    },
    data () {
        return {
            asyncKeepAliveComponentNames: []
        };
    },
    computed: {
        ...mapGetters("Menu", [
            "defaultComponent",
            "mainMenu",
            "secondaryMenu",
            "mainExpanded",
            "secondaryExpanded"
        ]),
        ...mapGetters("Modules", ["componentMap"]),
        ...mapGetters("Modules/GetFeatureInfo", {
            gfiMenuSide: "menuSide"
        }),

        /**
         * @returns {Object} Menu configuration for the given menu.
         */
        menu () {
            return this.side === "mainMenu" ? this.mainMenu : this.secondaryMenu;
        },

        /**
         * @returns {Object} Returns the currently visible Component.
         */
        currentComponent () {
            let current = this.menu.navigation.currentComponent.type;

            if (current !== "root" && current !== this.defaultComponent) {
                current = this.componentMap[current];
            }

            return current;
        },
        /**
         * Modules that are to be cached using Vue's keep-alive feature must implement
         * the keep-alive-specific lifecycle hooks "activated()" and "deactivated()".
         * Only if both hooks are found, the component is cached via keep-alive.
         * Async components only expose their hooks after loading, see registerAsyncKeepAliveComponent.
         * See documentation: docs/Dev/vueComponents/ModuleCaching.md
         *
         * @returns {Array} Returns a list of component names for keep-alive
         */
        keepAliveComponents () {
            const componentNames = Object.values(this.componentMap)
                .filter(component => this.hasKeepAliveHooks(component))
                .map(component => component.name);

            return [...componentNames, ...this.asyncKeepAliveComponentNames, "MenuComponentKeepAlivePlaceholder"];
        },
        /**
         * The Vue keep-alive feature only works if a component is always included.
         * Conditional skipping of components using v-if is not possible.
         * Therefore, we need to use an empty placeholder component for root and getFeatureInfo.
         *
         * @returns {*|string} Name of the component to render
         */
        currentComponentName () {
            if (["root", "getFeatureInfo"].includes(this.currentComponent)) {
                return "MenuComponentKeepAlivePlaceholder";
            }

            return this.currentComponent;
        }
    },
    watch: {
        currentComponent: {
            handler (component) {
                this.registerAsyncKeepAliveComponent(component);
            },
            immediate: true
        }
    },
    mounted () {
        this.menu?.sections?.forEach((elements, indexElements) => {
            const configPath = `${this.menu.configPaths}.${indexElements}`;

            this.initializeModuleConfig(elements, configPath);
        });
    },
    methods: {
        ...mapActions(["initializeModule"]),

        /**
         * Starts initializeModule for every configured module in menu.
         * @param {Object[]} elements The menu elements.
         * @param {String} configPath The path to elements
         * @returns {void}
         */
        initializeModuleConfig (elements, configPath) {
            elements.forEach((module, indexModule) => {
                const path = `${configPath}.${indexModule}`;

                if (module.type === "folder") {
                    this.initializeModuleConfig(module.elements, `${path}.elements`);
                }
                else if (isPiniaModule(module.type)) {
                    initializePiniaStore(getPiniaModuleStore(module.type)(), module);
                }
                else if (module.type !== "customMenuElement") {
                    this.initializeModule({configPaths: [path], type: module.type});
                }
            });
        },

        /**
         * Checks whether a component implements the keep-alive hooks "activated()" and "deactivated()".
         * @param {Object} component The component.
         * @returns {Boolean} True, if both hooks are implemented.
         */
        hasKeepAliveHooks (component) {
            return typeof component?.activated === "function" && typeof component?.deactivated === "function";
        },

        /**
         * Waits for an async component (defineAsyncComponent) to load and registers its name for keep-alive,
         * if the loaded component implements the keep-alive hooks.
         * The loader returns the same promise that is used for rendering, so no additional request is made.
         * @param {Object|String} component The component or the name of a special component like "root".
         * @returns {Promise<void>} Resolves when the component has been checked.
         */
        async registerAsyncKeepAliveComponent (component) {
            if (typeof component?.__asyncLoader !== "function") {
                return;
            }

            try {
                const loadedComponent = await component.__asyncLoader();

                if (this.hasKeepAliveHooks(loadedComponent) && !this.asyncKeepAliveComponentNames.includes(loadedComponent.name)) {
                    this.asyncKeepAliveComponentNames.push(loadedComponent.name);
                }
            }
            catch (error) {
                console.warn("The async component could not be loaded for keep-alive.", error);
            }
        }
    }
};
</script>

<template>
    <div
        :id="'mp-body-' + side"
        class="mp-menu-body flex-grow-1"
        :class="
            {'mp-menu-body-collapsed': !mainExpanded && side === 'mainMenu' || !secondaryExpanded && side === 'secondaryMenu'}
        "
    >
        <MenuNavigation :side="side" />
        <GetFeatureInfo
            v-if="side === gfiMenuSide"
            v-show="currentComponent === 'getFeatureInfo'"
        />
        <keep-alive :include="keepAliveComponents">
            <component
                :is="currentComponentName"
                :key="menu.navigation.currentComponent.props?.path?.join('-') || menu.navigation.currentComponent.props?.name || currentComponent"
                class="menu-body-component"
                :side="side"
            />
        </keep-alive>
        <MenuContainerBodyRoot
            v-show="currentComponent === 'root'"
            :side="side"
        />
    </div>
</template>

<style lang="scss" scoped>

    .mp-menu-body {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        padding: 0 $padding $padding $padding;
        font-size: $font-size-base;
        overflow-y: auto;
        max-height: 100%;

        &-collapsed {
            padding: 0;
            display: none;
        }
        div:first-child {
            padding-top: $padding;
        }

        .menu-body-component {
            /* Hide scrollbar for Firefox */
            -ms-overflow-style: none;
            scrollbar-width: none;
        }

        /* Hide scrollbar for Chrome, Edge, Safari and Opera */
        .menu-body-component::-webkit-scrollbar {
            display: none;
        }
    }

    @include media-breakpoint-up(sm)  {
        #mp-body-mainMenu {
            margin-right: .5rem;
        }

        #mp-body-secondaryMenu {
            overflow-y: auto;
        }
        .mp-menu-body-collapsed {
            display: flex;
        }

    }
</style>
