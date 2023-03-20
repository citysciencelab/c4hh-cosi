<script>
export default {
    name: "VerkehrsstaerkenThemeTable",
    props: {
        rowNames: {
            type: Array,
            required: true
        },
        years: {
            type: Array,
            required: true
        },
        dataset: {
            type: Array,
            required: true
        }
    },
    methods: {
        /**
         * Returns the row header for the given category-name.
         * @param {String} name of the category
         * @returns {String} the row header
         */
        getRowHeader (name) {
            if (name === "DTV") {
                return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerDay");
            }
            else if (name === "DTVw") {
                return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerDayWeekly");
            }
            else if (name === "Schwerverkehrsanteil am DTVw") {
                return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.HGVsPerWeek");
            }

            return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.constructionSiteInfluence");

        },
        /**
         * Returns the data in this. dataset for the given year.
         * @param {String} year to inspect
         * @param {String} rowName to inspect
         * @returns {String} the data for the year
         */
        getYearData (year, rowName) {
            const yearData = this.dataset.find(function (data) {
                    return data.year === year;
                }),
                contained = yearData[rowName] !== undefined;

            if (contained) {
                return yearData[rowName].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
            }
            return "-";
        }
    }
};
</script>

<template>
    <div class="tab-pane active verkehrsstaerken-table">
        <table class="table table-striped">
            <thead>
                <tr>
                    <th>{{ $t("additional:modules.tools.gfi.themes.verkehrsstaerken.category") }}</th>
                    <th
                        v-for="(year, i) in years"
                        :key="i"
                    >
                        {{ year }}
                    </th>
                </tr>
            </thead>
            <tbody>
                <tr
                    v-for="(name, i) in rowNames"
                    :key="i"
                >
                    <td class="kategory">
                        {{ getRowHeader(name) }}
                    </td>
                    <td
                        v-for="(year, j) in years"
                        :key="j"
                        class="data"
                    >
                        {{ getYearData(year, name) }}
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style lang="scss" scoped>
.verkehrsstaerken-table {
        margin: 6px 15px 10px 12px;
        overflow: auto;
        table {
            margin: 0;
            td,
            th {
                text-align: center;
                padding: 8px;
            }
              th:first-child{
                 text-align: left;
             }
             td:first-child{
                 text-align: left;
             }
        }
}
</style>

