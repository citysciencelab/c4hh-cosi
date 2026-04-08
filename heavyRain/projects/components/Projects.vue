<script>
import HrHeader from "../../shared/components/HrHeader.vue";

export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Projects",
    components: {
        HrHeader
    }
};
</script>

<template lang="html">
    <HrHeader
        :text="$t('additional:modules.projects.description')"
        :button-text="$t('additional:modules.projects.createProject')"
    />
</template>

<style lang="scss" scoped>
</style>

