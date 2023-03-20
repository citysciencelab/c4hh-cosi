<script>
export default {
    name: "DetailComponent",
    props: {
        feature: {
            type: Object,
            required: true
        },
        keys: {
            type: Array,
            required: true
        },
        label: {
            type: String,
            required: true
        }
    },
    methods: {
        getValue () {
            let value = "";

            this.keys.forEach(key => {
                if (this.feature.get(key) !== undefined) {
                    value += this.feature.get(key);
                    value += " ";
                }
            });
            return value.substring(0, value.length - 1);
        }
    }
};
</script>

<template>
    <div
        v-if="Object.keys(feature).length > 0 && feature.get(keys[0])"
        class="detail-component"
    >
        <dt class="label">
            {{ label }}:
        </dt>
        <dd class="value">
            {{ getValue() }}
        </dd>
    </div>
</template>
