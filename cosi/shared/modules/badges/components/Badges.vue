<script>
export default {
    // eslint-disable-next-line vue/multi-word-component-names
    name: "Badges",
    props: {
        backgroundColor: {
            type: String,
            default: "#DCE2F3"
        },
        color: {
            type: String,
            default: "#212529"
        },
        icon: {
            type: String,
            default: ""
        },
        text: {
            type: String,
            default: ""
        }
    },
    computed: {
        style () {
            return {
                "--bg-color": this.backgroundColor,
                "--color": this.color
            };
        }
    }
};
</script>

<template>
    <div class="me-1">
        <span
            class="badge"
            :style="style"
        >
            <i
                v-if="icon !== ''"
                :class="icon + ' me-1'"
            />
            {{ text }}
        </span>
    </div>
</template>

<style lang="scss" scoped>
    .badge {
        background-color: var(--bg-color);
        color: var(--color);
        font-size: $font_size_sm;
        font-weight: 400;
    }
</style>
