<script>
import CompareFeatureIcon from "@modules/getFeatureInfo/themes/default/components/favoriteIcons/components/CompareFeatureIcon.vue";

export default {
    name: "PrivateParking",
    components: {
        CompareFeatureIcon
    },
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            importedComponents: [],
            parsedData: {}
        };
    },
    watch: {
        feature: {
            handler (newFeature) {
                this.parsedData = this.getParsedFeatureData(newFeature);
            },
            deep: true,
            immediate: true
        }
    },
    created () {
        this.setImportedComponents();
    },
    methods: {
        /**
         * Collects all components imported into this component except for the DefaultTheme and stores them in the importedComponents array.
         * This allows for dynamic rendering of these components in the template.
         * @returns {void}
         */
        setImportedComponents () {
            Object.keys(this.$options.components).forEach(componentName => {
                if (componentName !== "DefaultTheme") {
                    this.importedComponents.push(this.$options.components[componentName]);
                }
            });
        },
        /**
         * Parses the feature data into a structured format based on the data template and attribute mapping.
         * @param {Object} feature The feature object to parse.
         * @returns {Object} The parsed feature data.
         */
        getParsedFeatureData (feature) {
            if (!feature) {
                return {};
            }
            const dataTemplate = {...feature.getTheme().dataTemplate, "additionals": "Nicht Kategorisiert"};
            const attributeMapping = feature.getAttributesToShow() || {};
            const propertiesWithValues = Object.entries(feature.getProperties() || {});

            const data = {};
            const categories = Object.entries(dataTemplate);

            categories.forEach(([categoryPrefix, categoryValue]) => {
                data[categoryValue] = {};
                propertiesWithValues.forEach(([key, value]) => {
                    if (!key.startsWith(categoryPrefix)) {
                        return;
                    }
                    data[categoryValue][attributeMapping[key] || key] = value;
                });
                if (Object.keys(data[categoryValue]).length === 0) {
                    delete data[categoryValue];
                }
            });
            return data;
        }
    }
};

</script>

<template>
    <div class="private-parking">
        <div
            class="favorite-icon-container"
        >
            <template
                v-for="component in importedComponents"
                :key="'favorite-' + component.name"
            >
                <component
                    :is="component"
                    :feature="feature"
                />
            </template>
        </div>
        <div class="result">
            <div class="stats-card">
                <section
                    v-for="(rows, section, sIdx) in parsedData"
                    :key="section"
                    class="stats-section"
                    :class="{ 'mt': sIdx > 0 }"
                >
                    <div class="section-header">
                        <span class="section-title">{{ section }}</span>
                    </div>
                    <div class="rows">
                        <div
                            v-for="(value, key) in rows"
                            :key="key"
                            class="row"
                        >
                            <div class="label">
                                {{ key }}
                            </div>
                            <div class="value">
                                {{ value }}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    </div>
</template>


<style scoped lang="scss">
.private-parking {
    position: relative;
    overflow-y: visible;
    padding: 0 12px;
    .disabled {
        pointer-events: none;
        opacity: 0.6;
    }
    .favorite-icon-container {
        display: flex;
        justify-content: center;
        .bootstrap-icon {
            font-size: $font_size_huge;
            padding: 0 2px;
        }
    }
    .stats-card {
        width: 100%;
        background: #fff;
        border-radius: 6px;
        overflow: hidden;
        border: 1px solid #e6eaf0;
    }

    .stats-section.mt {
        margin-top: 10px;
    }

    .section-header {
        position: relative;
        background: #eef3f7;
        padding: 10px 12px 10px 16px;
        border-bottom: 1px solid #dfe6ee;
    }

    .section-header::before {
        content: "";
        position: absolute;
        left: 8px;
        top: 8px;
        bottom: 8px;
        width: 4px;
        border-radius: 2px;
        background: #0b5aa2;
    }

    .section-title {
        font-weight: 700;
        font-size: 14px;
        color: #0f2c44;
    }

    .rows {
        background: #fff;
    }

    .row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 12px;
        padding: 10px 12px;
        border-bottom: 1px solid #edf1f6;
        align-items: center;
    }

    .row:last-child {
        border-bottom: 0;
    }
    .label {
        font-size: 13px;
        color: #1d2b36;
        line-height: 1.2;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .value {
        font-size: 13px;
        font-weight: 700;
        color: #0b0f14;
        text-align: right;
        min-width: 64px;
    }

    .result {
        margin-top: 10px;

        .table {
            margin-bottom: 20px;

            td {
                padding: 8px;
                border-top: 1px solid #ddd;
            }

            & > :not(:first-child) {
                border-top: 0 solid currentColor;
            }
        }
    }
}
</style>
