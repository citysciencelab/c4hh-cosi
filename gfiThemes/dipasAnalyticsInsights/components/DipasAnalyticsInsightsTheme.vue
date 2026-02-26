<script>
export default {
    name: "DipasAnalyticsInsightsTheme",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    data () {
        return {
            headingTitleElement: null
        };
    },
    computed: {
        attributes () {
            return this.feature.getMappedProperties();
        },
        categories () {
            const categoryString = this.attributes.categories.filter((cat) => cat !== null).join(", ");

            return categoryString;
        },
        categoriesCount () {
            return this.attributes.categories.filter((cat) => cat !== null).length;
        }
    },
    mounted () {
        if (document.querySelector(".gfi-title")) {
            this.headingTitleElement = document.querySelector(".gfi-title");
            this.headingTitleElement.innerHTML = this.$t("additional:addons.gfiThemes.dipasAnalyticsInsights.title");
        }
    }
};
</script>

<template>
    <div class="dipas-analytics-insights-theme">
        <h3 class="dipas-analytics-insights-title">
            {{ attributes.title }}
        </h3>

        <div class="dipas-analytics-insight-categories">
            <span class="dipas-analytics-insight-categories-key"> {{ $t("additional:addons.gfiThemes.dipasAnalyticsInsights.categories", {count: categoriesCount}) }}: </span>
            {{ categories }}
        </div>

        <div class="dipas-analytics-insights-contribution-text">
            <!-- Masterportal replaces newlines with pipes automatically. Split the text into paragraphs again. -->
            <template v-for="(textBlock, index) in attributes.description.split('|')">
                <p
                    v-if="textBlock.length"
                    :key="`textBlock_${index}`"
                >
                    {{ textBlock }}
                </p>
            </template>
        </div>
    </div>
</template>

<style lang="scss">
div.dipas-analytics-insights-theme {
    font-size: 1rem;
    padding: 1rem;
    max-width: 600px;

    div.dipas-analytics-insight-categories {
        font-size: 0.875rem;
        color: black;
        margin: 0.5rem 0;

        span.dipas-analytics-insight-categories-key {
            font-weight: bold;
        }
    }

    h3.dipas-analytics-insights-title {
        font-size: 1rem;
        font-weight: bold;
        line-height: 2rem;
        border: none;
        padding: 0;
        color: black;
    }

    div.dipas-analytics-insights-contribution-text {
        p {
            color: black;
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
    }
}
</style>
