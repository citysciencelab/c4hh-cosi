
<script>
export default {
    name: "DashboardResult",
    components: {
    },
    props: {
        resultTableHeaders: {
            type: Array,
            default: null
        },
        results: {
            type: Array,
            default: null
        },
        i18n: {
            type: Object,
            default: null
        }
    }
};
</script>

<template lang="html">
    <div>
        <p><strong>{{ i18n['comparableResults'] }}: </strong></p>
        <v-data-table
            id="result-table"
            dense
            :headers="resultTableHeaders"
            :items="results"
            item-key="name"
            class="elevation-1"
            :footer-props="{
                'items-per-page-text': i18n['rowsPerPage']
            }"
        />
    </div>
</template>

<style lang="scss" scoped>
</style>


