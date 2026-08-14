<script>
import {mapActions} from "vuex";

export default {
    name: "TabGraphics",
    props: {
        params: {
            type: Object,
            required: true
        },
        allAttributes: {
            type: Object,
            required: true
        }
    },
    watch: {
        allAttributes: {
            deep: true,
            handler (newAttributes, oldAttributes) {
                if (newAttributes === oldAttributes) {
                    return;
                }

                const oafParams = this.params?.oafParams,
                      // TODO chartTheme muss angepasst werden, wenn mehrere Charts in einem Tab vorhanden sind und es ein Dropdown gibt
                      chartParams = this.params?.chartThemes?.[0],
                      queryAttribute = chartParams?.queryParams?.literalFilters?.queryAttribute;

                const queryParams = {
                    url: oafParams?.url,
                    collections: oafParams?.collection,
                    queryField: queryAttribute,
                    queryProperties: chartParams?.queryParams?.properties,
                    literalFilters: {
                        sortby: chartParams?.queryParams?.literalFilters?.sortBy
                    },
                    queryValue: newAttributes[queryAttribute],
                    queryCrs: oafParams?.filterCRS,
                    dateField: chartParams?.chartParams?.xAxis
                };

                this.queryOaf({params: queryParams});
            },
            immediate: true
        }
    },
    methods: {
        ...mapActions("Modules/WaterStatistics", [
            "queryOaf"
        ])
    }
};
</script>

<template>
    <div id="TabGraphics" />
</template>

<style lang="scss" scoped>
#TabGraphics {

}
</style>
