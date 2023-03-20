<script>
import beautifyKey from "../../../../src/utils/beautifyKey";
export default {
    name: "DetailView",
    props: {
        item: {
            required: true,
            type: Object
        },
        propBlacklist: {
            required: false,
            type: Array,
            default: () => []
        },
        filterProps: {
            required: false,
            type: Object,
            default: undefined
        }
    },
    data: () => ({
        selectedProps: []
    }),
    computed: {
        /**
         * Get a feature's properties, sanitized of blacklisted attributes
         * @param {Object} tableItem - the table item containing the feature
         * @returns {Object} the properties as dictionary
         */
        featureProperties () {
            const _propBlacklist = this.propBlacklist,
                props = this.item.feature.getProperties(),
                filteredProps = Object.entries(props).filter(prop => !_propBlacklist.includes(prop[0]));

            return Object.fromEntries(filteredProps);
        }
    },
    watch: {
        /**
         * @listens #change:filterProps listens to changes on the filterProps prop
         * @returns {void}
         */
        filterProps () {
            this.updateFilterProps();
        }
    },
    mounted () {
        this.updateFilterProps();
    },
    methods: {
        /**
         * Beautifies the Key, removes special characters, capitalizes first letters
         * @param {String} key - the key to beautify
         * @returns {String} the beautified key
         */
        beautifyKey: key => beautifyKey(key),
        /**
         * Normalizes the key according to the gfiAttributes of the layer or beautifies it
         * @param {String} key - the key to normalize
         * @returns {String} the normalized key
         */
        gfiOrBeautifyKey (key) {
            return this.item.gfiAttributes[key] ? this.item.gfiAttributes[key] : beautifyKey(key);
        },
        /**
         * Fires when the property selection for export is changed
         * @fires #emit:filterProps Emits an event to the list to update all other detail tables
         * @returns {void}
         */
        onChangeProps () {
            this.$emit("filterProps", {[this.item.layerId]: this.selectedProps});
        },
        /**
         * Updates the currently selected Props when updated on the parent
         * @returns {void}
         */
        updateFilterProps () {
            if (Object.prototype.hasOwnProperty.call(this.filterProps, this.item.layerId)) {
                this.selectedProps = this.filterProps[this.item.layerId];
            }
        }
    }
};
</script>

<template>
    <v-sheet>
        <v-card>
            <v-simple-table dense>
                <template #default>
                    <tbody class="detail-view-row">
                        <tr
                            v-for="(val, prop) in featureProperties"
                            :key="prop"
                        >
                            <td>
                                <v-checkbox
                                    v-model="selectedProps"
                                    :value="prop"
                                    dense
                                    hide-details
                                    @change="onChangeProps"
                                />
                            </td>
                            <th>{{ gfiOrBeautifyKey(prop) }}</th>
                            <td>{{ val }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-simple-table>
        </v-card>
    </v-sheet>
</template>

<style lang="scss">
</style>
