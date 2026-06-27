<script>
import GeoMarkerForm from "../GeoMarkerForm.vue";

export default {
    name: "TabNewContent",
    components: {
        GeoMarkerForm
    },
    props: {
        tabActive: {
            type: Boolean,
            required: true
        }
    },
    data () {
        return {
            formRenderKey: 0
        };
    },
    watch: {
        tabActive (val) {
            if (val) {
                ++this.formRenderKey;
            }
        }
    }
};
</script>

<template>
    <div class="TabNewContent">
        <GeoMarkerForm
            :key="formRenderKey"
            mode="create"
            :show-create-another-switch="true"
        />
    </div>
</template>

<style lang="scss" scoped>

div.TabNewContent {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-top: 1rem;
    height: 100%;
}
</style>
