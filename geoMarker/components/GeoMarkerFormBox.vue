<script>
export default {
    name: "GeoMarkerFormBox",
    props: {
        title: {
            type: String,
            required: true
        }
    }
};
</script>

<template>
    <div class="geoMarkerFormBox">
        <div class="formBoxTitle">
            {{ title }}
        </div>
        <div class="formBoxContent">
            <slot />
        </div>
    </div>
</template>

<style lang="scss" scoped>

div.geoMarkerFormBox {
    border: 0.0625rem solid $light_blue;
    border-radius: 0.375rem;
    padding: 1rem;
    background: $white;
    position: relative;

    div.formBoxTitle {
        position: absolute;
        top: -0.75rem;
        left: 0.75rem;
        padding: 0 0.5rem;
        font-weight: bold;
        font-size: 1rem;
        color: $dark_grey;
        background-color: $white;
    }
    div.formBoxContent {
        margin-top: 0.5rem;
    }
}
</style>
