<script>
export default {
    name: "WaterStatistics",
    props: {
        feature: {
            type: Object,
            required: true
        }
    },
    computed: {
        attributes () {
            return this.feature.getMappedProperties();
        },
        params () {
            return this.feature?.getTheme().params;
        }
    }
};
</script>

<template>
    <div class="water-statistics-theme">
        {{ attributes }}

        {{ params }}
    </div>
</template>

<style lang="scss" scoped>
div.water-statistics-theme {

}
</style>
