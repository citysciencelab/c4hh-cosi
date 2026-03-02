<script>
export default {
    name: "SimpleCard",
    props: {
        icon: {
            type: String,
            default: null
        },
        label: {
            type: String,
            default: ""
        },
        text: {
            type: String,
            default: ""
        },
        closeable: {
            type: Boolean,
            default: true
        },
        hoverable: {
            type: Boolean,
            default: false
        }
    },
    emits: ["click:close"]
};
</script>

<template lang="html">
    <div
        class="card shadow"
        :class="{hoverable}"
    >
        <div class="card-body p-2 d-flex flex-row align-center">
            <div
                v-if="icon"
                class="p-1 fs-3"
            >
                <i :class="icon" />
            </div>
            <div class="ps-4 py-1 flex-grow-1">
                <div class="label">
                    {{ label }}
                </div>
                <div class="text">
                    {{ text }}
                </div>
            </div>
            <button
                v-if="closeable"
                type="button"
                class="btn-close align-self-start"
                aria-label="Close"
                @click="$emit('click:close')"
            />
        </div>
    </div>
</template>

<style lang="scss" scoped>
    @import "../assets/style.scss";
</style>
