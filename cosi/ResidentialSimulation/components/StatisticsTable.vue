<script>
export default {
    name: "StatisticsTable",
    props: {
        value: {
            required: true,
            type: Array
        }
    },
    data: () => ({
        snack: false,
        snackColor: "",
        snackText: "",
        isNumber: v => !isNaN(parseFloat(v)) || this.$t("additional:modules.tools.cosi.statisticsTable.isNotNumber")
    }),
    computed: {
        headers () {
            return [
                {text: this.$t("additional:modules.tools.cosi.statisticsTable.statsCategory"), value: "category"},
                {text: this.$t("additional:modules.tools.cosi.statisticsTable.statsValue"), value: "value"}
            ];
        }
    },
    watch: {
        value: {
            deep: true,
            handler (e) {
                this.$emit("input", e);
            }
        }
    },
    methods: {
        save () {
            this.snack = true;
            this.snackColor = "success";
            this.snackText = this.$t("common:general.success");
        },
        cancel () {
            this.snack = true;
            this.snackColor = "warning";
            this.snackText = this.$t("common:general.cancelled");
        },
        open () {
            this.snack = true;
            this.snackColor = "info";
            this.snackText = this.$t("common:general.opened");
        },
        editStats (v, item) {
            item.value = parseFloat(v);
        }
    }
};
</script>

<template>
    <div>
        <v-data-table
            :headers="headers"
            :items="value"
            group-by="group"
            dense
            :items-per-page="-1"
            hide-default-footer
        >
            <!-- eslint-disable-next-line vue/valid-v-slot -->
            <template #item.value="{ item }">
                <v-edit-dialog
                    :return-value.sync="item.value"
                    :rules="[isNumber]"
                    large
                    persistent
                    :save-text="$t('common:button.save')"
                    :cancel-text="$t('common:button.cancel')"
                    @save="save(item)"
                    @cancel="cancel"
                    @open="open"
                >
                    <div>{{ item.value }}</div>
                    <template #input>
                        <div class="mt-4 text-h6">
                            {{ $t("additional:modules.tools.cosi.statisticsTable.editStatsField") }}
                        </div>
                        <v-text-field
                            :value="item.value"
                            type="number"
                            single-line
                            @change="editStats($event, item)"
                        />
                        {{ $t('additional:modules.tools.cosi.statisticsTable.editStatsInfo') }}
                    </template>
                </v-edit-dialog>
            </template>
        </v-data-table>
        <v-snackbar
            v-model="snack"
            :timeout="3000"
            :color="snackColor"
        >
            {{ snackText }}

            <template #action="{ attrs }">
                <v-btn
                    v-bind="attrs"
                    text
                    @click="snack = false"
                >
                    {{ $t("common:button.close") }}
                </v-btn>
            </template>
        </v-snackbar>
    </div>
</template>
