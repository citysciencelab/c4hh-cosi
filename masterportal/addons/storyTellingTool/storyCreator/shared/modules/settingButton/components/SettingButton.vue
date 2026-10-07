<script>
export default {
    name: "SettingButton",
    props: {
        active: {
            type: Boolean,
            default: false
        },
        ariaLabel: {
            type: String,
            required: true
        },
        icon: {
            type: String,
            required: true
        },
        id: {
            type: String,
            required: true
        },
        title: {
            type: String,
            required: true
        },
        value: {
            type: String,
            default: ""
        }
    },
    emits: ["click"]
};
</script>

<template>
    <button
        :id="id"
        :class="[
            'btn',
            'btn-primary',
            'rounded-circle',
            'me-3',
            active ? 'active' : ''
        ]"
        type="button"
        :aria-label="ariaLabel"
        :title="title"
        @click="$emit('click', $event)"
    >
        <div class="button-content">
            <i :class="icon" />

            <span v-if="value">
                {{ value }}
            </span>

            <slot />
        </div>
    </button>
</template>

<style lang="scss" scoped>
.btn {
    width: 3.5rem;
    height: 3.5rem;
    padding: 0;
    text-align: center;
    font-size: 1.143rem;
    border-radius: 50%;
    border: solid $white 1px;

    .button-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        line-height: 1;
    }

    .button-content > i {
        display: block;
        line-height: 1;
    }

    .button-content > span {
        display: block;
        font-size: $font_size_sm;
        margin-top: 0.1rem;
        width: 3rem;
        text-align: center;
    }

    .button-content :deep(input[type="color"]) {
        display: block;
        width: 1.8rem;
        height: 0.5rem;
        margin: 0.1rem 0 0;
        padding: 0;
    }
}

.btn.active {
    background-color: $dark_blue;
}

input {
    cursor: pointer;
    border: none;
}
</style>
