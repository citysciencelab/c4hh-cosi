<script>
import beautifyKey from "@shared/js/utils/beautifyKey";
import {VSheet} from "vuetify/components/VSheet";
import {VCard} from "vuetify/components/VCard";
import {VTable} from "vuetify/components/VTable";

export default {
    name: "DetailView",
    components: {
        VCard,
        VSheet,
        VTable
    },
    props: {
        item: {
            required: true,
            type: Object
        },
        propBlacklist: {
            required: false,
            type: Array,
            default: () => []
        }
    },
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
        }
    }
};
</script>

<template>
    <v-sheet>
        <v-card>
            <v-table dense>
                <template #default>
                    <tbody class="detail-view-row">
                        <tr
                            v-for="(val, prop) in featureProperties"
                            :key="prop"
                        >
                            <th>{{ gfiOrBeautifyKey(prop) }}</th>
                            <td>{{ val }}</td>
                        </tr>
                    </tbody>
                </template>
            </v-table>
        </v-card>
    </v-sheet>
</template>

<style lang="scss">
</style>
