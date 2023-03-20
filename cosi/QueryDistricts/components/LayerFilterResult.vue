
<script>
export default {
    name: "LayerFilterResult",
    props: {
        name: {
            type: String,
            default: null
        },
        field: {
            type: String,
            default: null
        },
        value: {
            type: Number,
            default: NaN
        },
        low: {
            type: Number,
            default: 0
        },
        high: {
            type: Number,
            default: 0
        },
        i18n: {
            type: Object,
            default: null
        }
    }
};
</script>

<template lang="html">
    <div class="filter-result-panel">
        <p><strong>{{ name }}</strong></p>
        <table class="table filter-result-table">
            <tr>
                <th scope="col">
                    {{ i18n['year'] }}
                </th>
                <th scope="col">
                    {{ i18n['referenceValue'] }}
                </th>
                <th scope="col">
                    -
                </th>
                <th scope="col">
                    +
                </th>
            </tr>
            <tr>
                <td>{{ field }}</td>
                <td>{{ value }}</td>
                <td>{{ low }}</td>
                <td>{{ high }}</td>
            </tr>
        </table>
    </div>
</template>

<style lang="scss" scoped>
.filter-result-table{
    margin-bottom: 5px;
    td {
        border-bottom: 1px solid #ddd;
        background-color:white;
    }
    background-color: white;
}
.filter-result-panel {
    padding-bottom: 10px;
}
</style>


