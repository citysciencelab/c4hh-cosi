<script>

export default {
    name: "InfoText",
    props: {
        text: {
            type: String,
            required: true
        }
    }
};
</script>

<template lang="html">
    <div
        class="alert alert-info border-2 d-flex align-items-center"
        role="alert"
    >
        <i
            class="bi ms-2 me-5 fs-4 bi-info-circle-fill"
        />
        <div class="me-4">
            <span>{{ text }}</span>
        </div>
    </div>
</template>

<style lang="scss">
.alert-info {
    background-color: rgba($light-blue, 0.7);
    border-color: $secondary;
    color: $secondary;
}
</style>
