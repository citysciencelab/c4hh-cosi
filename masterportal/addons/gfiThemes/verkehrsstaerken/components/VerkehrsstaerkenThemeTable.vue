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
        tableData: {
            type: Array,
            required: true
        },
        contentType: {
            type: String,
            required: false,
            default: "car"
        }
    },
    methods: {
        /**
         * Returns the row header for the given category-name.
         * @param {String} name of the category
         * @returns {String} the row header
         */
        getRowHeader (name) {
            switch (this.contentType) {
                case "bike":
                    if (name === "DTV") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.bikesPerDay");
                    }
                    else if (name === "DTVw") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.bikesPerWeekday");
                    }
                    else if (name === "Anmerkung") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.note");
                    }
                    else if (name === "Erhebungsmethode") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.method");
                    }
                    break;
                default:
                    if (name === "DTV") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerDay");
                    }
                    else if (name === "DTVw") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.carsPerWeekday");
                    }
                    else if (name === "Schwerverkehrsanteil am DTVw") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.HGVsPerWeek");
                    }
                    else if (name === "Anmerkung") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.note");
                    }
                    else if (name === "Erhebungsmethode") {
                        return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.method");
                    }
            }
            return this.$t("additional:modules.tools.gfi.themes.verkehrsstaerken.constructionSiteInfluence");


        },
        /**
         * Checks if the input string only contains numbers.
         * @param {String} str input to inspect.
         * @returns {Boolean} true if input only consists of numbers.
         */
        isAllNumbers (str) {
            return (/^\d+$/).test(str);
        },
        /**
         * Returns the data in this. dataset for the given year.
         * @param {String} year to inspect
         * @param {String} rowName to inspect
         * @returns {String} the data for the year
         */
        getYearData (year, rowName) {
            const yearData = this.tableData.find(function (data) {
                    return data.year === year;
                }),
                contained = yearData[rowName] !== undefined;

            if (contained) {
                if (this.isAllNumbers(yearData[rowName])) {
                    return yearData[rowName].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
                }
                return yearData[rowName].toString();
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
        overflow: visible;
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
.fixed-columns td {
        max-width: 0;
    }
</style>

