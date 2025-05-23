<script setup>
import lodash from "lodash";

const props = defineProps(['server'])
const store = useServerStore()
const showAll = ref(false)
const req = useShowToastOnResult()

function sortVariables(variables) {
  /**
   * DEBUG, WAHA_, WHATSAPP_, rest
   */
  return lodash.sortBy(variables, (variable) => {
    if (variable.name.startsWith("DEBUG")) return 0
    if (variable.name.startsWith("WAHA_")) return 1
    if (variable.name.startsWith("WHATSAPP_")) return 2
    return 3
  })
}

function formatVariables(variables) {
  /**
   * KEY1=VALUE1
   * KEY2=VALUE2
   */
  return variables.map(variable => `${variable.name}=${variable.value}`).join("\n")
}

const {
  data,
  pending,
  error,
  refresh
} = useAsyncData(
    `server-environment-${props.server.id}`,
    async () => {
      if (!props.server.id) {
        return []
      }
      const data = await req(
          store.getServerEnvironment(props.server.id, showAll.value),
          undefined,
          "Failed to fetch server environment",
          undefined,
          props.server.name,
      )
      // convert from key-value to {name: key, value: value}
      const vars = Object.keys(data).map(key => ({name: key, value: data[key]}))
      return sortVariables(vars)
    })
watch(() => props.server, refresh, {immediate: true})
watch(showAll, refresh)

async function copyVariables(event) {
  const value = formatVariables(data.value)
  await navigator.clipboard.writeText(value);
  event.preventDefault();
}


</script>

<template>
  <DataTable
      :value="data"
      :loading="pending"
      resizableColumns
  >
    <template #header>
      <div class="flex flex-wrap justify-content-between">
        <div class="flex gap-2 align-items-center">
          <span class="text-xl font-bold">Copy</span>
          <Button
              rounded
              text=""
              v-tooltip.focus.bottom="{ value: 'Copied to clipboard' }"
              icon="pi pi-copy"
              @click="copyVariables($event)">
          </Button>
        </div>
        <div class="flex gap-2 align-items-center">
          <InputSwitch inputId="show-all" v-model="showAll"/>
          <label for="show-all">Show All</label>
        </div>
      </div>
    </template>
    <Column field="name" header="Environment Variable">
      <template #body="{ data }">
        <code>{{ data.name }}</code>
      </template>
    </Column>
    <Column field="value" header="Value"></Column>
  </DataTable>
</template>

<style scoped lang="scss">

</style>
