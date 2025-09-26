<script>
export default {
    name: "FieldsTooltip",
    props: {
        fields: {
            required: true,
            type: Object
        }
    }
};

</script>

<template>
    <div>
        <span
            v-for="(val, key) in fields"
            :key="key"
        >
            {{ key }}: {{ val ? val.category : '-' }} <br>
        </span>
    </div>
</template>
