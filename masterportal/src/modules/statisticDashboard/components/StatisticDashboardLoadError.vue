<script>
/**
 * Shows an error message, if the statistic dashboard could not be loaded.
 * @module modules/statisticDashboard/components/StatisticDashboardLoadError
 */
export default {
    name: "StatisticDashboardLoadError"
};
</script>

<template>
    <div
        class="alert alert-danger my-4"
        role="alert"
    >
        {{ $t('common:modules.statisticDashboard.loadingError') }}
    </div>
</template>
