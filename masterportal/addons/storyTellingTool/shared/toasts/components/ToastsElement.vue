<script>

export default {
    name: "ToastsElement",
    props: {
        type: {
            type: String,
            required: false,
            default: "info"
        },
        text: {
            type: String,
            required: true
        }
    }
};
</script>

<template lang="html">
    <div
        class="d-flex align-items-center gap-2 py-1 px-2 small"
        :class="type === 'success' ? 'success' : 'info' "
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
    >
        <i
            class="bi flex-shrink-0"
            :class="type === 'success' ? 'bi-check-lg' : 'bi-info-circle' "
            aria-hidden="true"
        />
        <span>{{ text }}</span>
    </div>
</template>

<style lang="scss">
.info {
    background-color: $secondary;
    color: $white;
}
.success {
    background-color: #469d50;
    color: $white;
}
</style>
