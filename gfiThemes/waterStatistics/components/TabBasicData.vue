<script>
export default {
    name: "TabBasicData",
    props: {
        attributes: {
            type: Object,
            required: true
        },
        params: {
            type: Object,
            required: true
        }
    }
};
</script>

<template>
    <div id="TabBasicData">
        {{ attributes }}

        {{ params }}
    </div>
</template>

<style lang="scss" scoped>
#TabBasicData {

}
</style>
