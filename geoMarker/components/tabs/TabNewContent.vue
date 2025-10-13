<script>
import GeoMarkerForm from "../GeoMarkerForm.vue";

export default {
    name: "TabNewContent",
    components: {
        GeoMarkerForm
    }
};
</script>

<template>
    <div class="TabNewContent">
        <GeoMarkerForm
            mode="create"
            :show-create-another-switch="true"
        />
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";

div.TabNewContent {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    height: 100%;
}
</style>
