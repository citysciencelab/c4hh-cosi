<script>
import {mapGetters} from "vuex";
import {VDialog} from "vuetify/components/VDialog";
import {VCard, VCardTitle, VCardText, VCardActions} from "vuetify/components/VCard";
import {VBtn} from "vuetify/components/VBtn";
import {VDataTable} from "vuetify/components/VDataTable";
import {VAvatar} from "vuetify/components/VAvatar";
import {VColorPicker} from "vuetify/components/VColorPicker";
import {convertColor} from "@shared/js/utils/convertColor";

export default {
    name: "PolygonStylerSettings",
    components: {
        VDialog,
        VCard,
        VCardTitle,
        VCardText,
        VCardActions,
        VBtn,
        VDataTable,
        VAvatar,
        VColorPicker
    },
    props: {
        isVisible: {
            type: Boolean,
            required: true
        },
        styleList: {
            type: Array,
            required: true
        }
    },
    data () {
        return {
            colorPickerDialog: false,
            colorPickerValue: {r: 0, g: 0, b: 0, a: 1},
            selectedStyle: null
        };
    },
    computed: {
        ...mapGetters("Modules/Language", ["currentLocale"]),
        tableHeader () {
            return [
                {
                    title: this.$t("additional:modules.tools.cosi.polygonStyler.settings.columnValue"),
                    value: "text"
                },
                {
                    title: this.$t("additional:modules.tools.cosi.polygonStyler.settings.columnFill"),
                    value: "fill",
                    align: "center",
                    sortable: false
                },
                {
                    title: this.$t("additional:modules.tools.cosi.polygonStyler.settings.columnStroke"),
                    value: "stroke",
                    align: "center",
                    sortable: false
                }
            ];
        }
    },
    watch: {
        currentLocale (newLocal) {
            this.$vuetify.lang.current = newLocal;
        }
    },
    methods: {
        convertColor: convertColor,

        /**
         * Sets the color of a style object.
         * @param {Object} style - The style object (fill or stroke) with a color and opacity.
         * @param {Object} color - The color to set.
         * @returns {void}
         */
        setColorToStyle (style, color) {
            style.color = convertColor(color);
            this.toggleColorPickerDialog();
        },

        /**
         * Sets the selected style object (fill or stroke).
         * @param {Object} style - The style object.
         * @returns {void}
         */
        setSelectedStyle (style) {
            this.selectedStyle = style;
            this.toggleColorPickerDialog();
        },

        /**
         * Toggles the color picker dialog.
         * @returns {void}
         */
        toggleColorPickerDialog () {
            this.colorPickerDialog = !this.colorPickerDialog;
        }
    }
};
</script>

<template>
    <div>
        <v-dialog
            :model-value="isVisible"
            max-width="590"
            persistent
        >
            <v-card tile>
                <v-card-title class="border-bottom">
                    {{ $t("additional:modules.tools.cosi.polygonStyler.settings.title") }}
                </v-card-title>
                <v-card-text class="border-bottom">
                    <v-data-table
                        :headers="tableHeader"
                        :items="styleList"
                        density="compact"
                    >
                        <template #[`item.fill`]="{ item }">
                            <v-avatar
                                class="pointer"
                                :color="convertColor(item.fill.color, 'rgbaString')"
                                size="24"
                                @click="setSelectedStyle(item.fill)"
                            />
                        </template>
                        <template #[`item.stroke`]="{ item }">
                            <v-avatar
                                class="pointer"
                                :color="convertColor(item.stroke.color, 'rgbaString')"
                                size="24"
                                @click="setSelectedStyle(item.stroke)"
                            />
                        </template>
                    </v-data-table>
                </v-card-text>
                <v-card-actions class="py-4 justify-space-between">
                    <v-btn
                        color="grey lighten-1"
                        @click.native="$emit('updateStyle')"
                    >
                        {{ $t("additional:modules.tools.cosi.polygonStyler.settings.applyButton") }}
                    </v-btn>
                    <v-btn
                        color="grey lighten-1"
                        @click.native="$emit('resetStyle')"
                    >
                        {{ $t("additional:modules.tools.cosi.polygonStyler.removeButton") }}
                    </v-btn>
                    <v-btn
                        color="grey lighten-1"
                        @click.native="$emit('hideDialog')"
                    >
                        {{ $t("additional:modules.tools.cosi.polygonStyler.settings.abortButton") }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog
            v-model="colorPickerDialog"
            width="fit-content"
            persistent
        >
            <v-card tile>
                <v-card-text class="border-bottom">
                    <v-color-picker
                        v-model="colorPickerValue"
                        class="pt-4"
                        show-swatches
                        swatches-max-height="200"
                        dot-size="25"
                    />
                </v-card-text>
                <v-card-actions class="py-3 justify-space-between">
                    <v-btn
                        color="grey lighten-1"
                        @click.native="setColorToStyle(selectedStyle, colorPickerValue)"
                    >
                        {{ $t("additional:modules.tools.cosi.polygonStyler.settings.applyButton") }}
                    </v-btn>
                    <v-btn
                        color="grey lighten-1"
                        @click.native="toggleColorPickerDialog"
                    >
                        {{ $t("additional:modules.tools.cosi.polygonStyler.settings.abortButton") }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>
