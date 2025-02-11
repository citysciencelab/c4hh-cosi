<script>
export default {
    name: "FloodRiskManagementSwitcher",
    props: {
        buttons: {
            type: Array,
            required: true
        },
        group: {
            type: String,
            required: true
        },
        selectedValue: {
            type: String,
            required: false,
            default: undefined
        }
    },
    emits: ["setSelectedElement"],
    data () {
        return {
        };
    }
};
</script>
<template>
    <div class="switchRadioButtons mt-0">
        <div
            class="btn-group"
            role="group"
            aria-label="First group"
        >
            <div
                v-for="(button, idx) in buttons"
                :key="idx"
                class="button-wrapper"
            >
                <input
                    :id="`btnradio${idx}${button}`"
                    type="radio"
                    class="btn-check"
                    :name="group"
                    autocomplete="off"
                    :checked="button === selectedValue"
                >
                <label
                    class="btn text-nowrap px-3 py-2"
                    :for="`btnradio${idx}${button}`"
                    role="button"
                    tabindex="0"
                    @click="$emit('setSelectedElement', button)"
                    @keydown="$emit('setSelectedElement', button)"
                >
                    {{ button }}
                </label>
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
@import "~variables";
.btn {
    border-radius: 0px;
    background-color: $light_grey;
    color: $light_grey_inactive_contrast;
}

.btn-check:checked + .btn {
    background: $secondary;
    color: $white;
    border-color: $secondary;
}

.btn:hover {
    background: $primary;
    border-color: $primary;
}

.button-wrapper:first-child {
    .btn {
        border-top-left-radius: 20px;
        border-bottom-left-radius: 20px;
    }
}
.button-wrapper:last-child {
    .btn {
        border-top-right-radius: 20px;
        border-bottom-right-radius: 20px;
    }
}
</style>
