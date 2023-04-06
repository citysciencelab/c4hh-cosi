<script>

import {mapGetters} from "vuex";
import getters from "../../../../../src_3_0_0/modules/getFeatureInfo/store/gettersGetFeatureInfo";
import {isWebLink} from "../../../../../src_3_0_0/shared/js/utils/urlHelper.js";
import ExportButtonCSV from "../../../../../src_3_0_0/shared/modules/buttons/components/ExportButtonCSV.vue";

export default {
    name: "DataTable",
    components: {
        ExportButtonCSV
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    computed: {
        refinedData: function () {
            const result = {
                head: [],
                rows: []
            };

            this.feature.getFeatures().forEach(singleFeature => {

                const mappedProps = singleFeature.getMappedProperties();

                Object.keys(mappedProps).forEach(attrKey => {
                    if (mappedProps[attrKey] !== undefined && typeof mappedProps[attrKey] === "string" && result.head.indexOf(attrKey) === -1) {
                        result.head.push(attrKey);
                    }
                });

                result.rows.push(mappedProps);
            });

            return result;
        },
        enableDownload: function () {
            return this.feature?.getTheme()?.params?.enableDownload;
        }
    },
    created () {
        this.downloadData = this.refinedData?.rows;
        this.fileName = this.feature?.getTitle();
    },
    methods: {
        ...mapGetters("Tools/Gfi", Object.keys(getters)),
        isWebLink
    }
};
</script>

<template>
    <div id="table-data-container">
        <table
            v-if="refinedData.rows.length > 0"
            class="table table-hover"
        >
            <thead>
                <th
                    v-for="propNameKey in refinedData.head"
                    :key="propNameKey"
                >
                    {{ propNameKey }}
                </th>
            </thead>

            <tbody>
                <tr
                    v-for="(singleRow, index1) in refinedData.rows"
                    :key="index1"
                >
                    <td
                        v-for="(propKey, index2) in refinedData.head"
                        :key="index2"
                    >
                        <a
                            v-if="isWebLink(singleRow[propKey])"
                            :href="singleRow[propKey]"
                            target="_blank"
                        >
                            {{ singleRow[propKey] ? singleRow[propKey] : '' }}
                        </a>
                        <span v-else>
                            {{ singleRow[propKey] ? singleRow[propKey] : '' }}
                        </span>
                    </td>
                </tr>
            </tbody>
        </table>
        <div
            v-if="enableDownload === true"
            class="download"
        >
            <ExportButtonCSV
                :url="false"
                :filename="fileName"
                :data="downloadData"
                :use-semicolon="true"
                :title="$t('modules.tools.filter.download.labelBtn')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

#table-data-container {
    margin:6px 15px 0 12px;

    table {
        margin: 0;
        th {
            position: sticky;
            top: 0px;
            background: $white;
        }
        td, th {
            padding: 6px;
        }
    }
    .download {
        position: sticky;
        bottom: 20px;
        float: right;
    }
}
</style>
