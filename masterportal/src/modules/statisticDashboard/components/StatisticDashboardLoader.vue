<script>
import {defineAsyncComponent, h} from "vue";
import SpinnerItem from "@shared/modules/spinner/components/SpinnerItem.vue";
import StatisticDashboardLoadError from "./StatisticDashboardLoadError.vue";

/**
 * Lightweight entry point of the statistic dashboard for the menu.
 * Loads the StatisticDashboard lazily, shows a spinner while loading and an error message if loading fails.
 * Implements the keep-alive hooks, so the menu caches this component and with it the loaded dashboard.
 * See documentation: docs/Dev/vueComponents/ModuleCaching.md
 * @module modules/statisticDashboard/components/StatisticDashboardLoader
 */
export default {
    name: "StatisticDashboardLoader",

    components: {
        StatisticDashboard: defineAsyncComponent({
            loader: () => import("./StatisticDashboard.vue"),
            loadingComponent: {
                render () {
                    return h("div", {
                        class: "p-3 d-flex justify-content-center"
                    }, [
                        h(SpinnerItem)
                    ]);
                }
            },
            errorComponent: StatisticDashboardLoadError,
            delay: 200
        })
    },

    /**
     * Keep-alive hook, required by the menu to cache this component. The dashboard handles its own activation.
     * @returns {void}
     */
    activated () {
        /* handled by StatisticDashboard */
    },

    /**
     * Keep-alive hook, required by the menu to cache this component. The dashboard handles its own deactivation.
     * @returns {void}
     */
    deactivated () {
        /* handled by StatisticDashboard */
    }
};
</script>

<template>
    <StatisticDashboard />
</template>
