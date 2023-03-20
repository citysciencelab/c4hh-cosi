<script>
<<<<<<< HEAD
export default {
    name: "ExportPDF",
    render () {
        return null;
    }
};
</script>
=======

import Tool from "../../../../src/modules/tools/ToolTemplate.vue";
import {mapGetters, mapActions, mapMutations} from "vuex";
import getters from "../store/gettersExportPDF";
import mutations from "../store/mutationsExportPDF";
import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";
pdfMake.vfs = pdfFonts.pdfMake.vfs;

export default {
    name: "ExportPDF",
    components: {
        Tool
    },
    props: {
        exportPdf: {
            type: String,
            default: ""
        }
    },
    data: function () {
        return {
            // ...
        };
    },

    computed: {
        ...mapGetters("Language", ["currentLocale"]),
        ...mapGetters("Tools/ExportPDF", Object.keys(getters))
    },

    watch: {
        active (isActive) {

            if (isActive) {
                // --
            }
        }},

    created () {
        this.$on("close", () => {
            this.setActive(false);
        });
    },

    methods: {
        ...mapActions("Tools/ExportPDF", ["reportTemplateToPDF"]),
        ...mapMutations("Tools/ExportPDF", Object.keys(mutations)),


        ExportPDF () {
            this.reportTemplateToPDF(this.jsonData);
        }
    }

};
</script>

<template lang="html">
    <Tool
        :title="$t('additional:modules.tools.cosi.exportPDF.title')"
        :icon="icon"
        :active="active"
        :render-to-window="renderToWindow"
        :resizable-window="resizableWindow"
        :deactivate-gfi="deactivateGFI"
    >
        <template

            v-if="active"
            #toolBody
        >
            <div>
                <v-btn
                    color="orange"
                    rounded
                    dark
                    @click="ExportPDF"
                >
                    Convert File
                </v-btn>
            </div>
        </template>
    </Tool>
</template>

    <style lang="scss" scoped>
     @import "~/css/mixins.scss";
    @import "~variables";
    .textfield {
        display: block;
        height: fit-content;
        width: fit-content;
    }

    </style>

>>>>>>> cbf2be88 (add new addons_3_0_0 structure-add missing addons)
