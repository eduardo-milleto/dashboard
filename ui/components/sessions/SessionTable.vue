<script setup>
import {ref, onBeforeMount} from 'vue';
import {useToast} from 'primevue/usetoast';
import {FilterMatchMode, FilterOperator} from "primevue/api";
import lodash from "lodash";
import {useAsyncData} from "nuxt/app";
import {SessionStatuses} from "../../services/waha/dtos";
import SessionLogin from "./SessionLogin.vue";

const toast = useToast();

const store = useServerStore()
const {visibleSessions, refreshing, servers} = storeToRefs(store)


const session = ref({
  config: {
    webhooks: [],
  },
})
const sessionDialog = ref(false)
const sessionDialogMode = ref(undefined)
const sessionControlDialog = ref(false)
const sessionChatsDialog = ref(false)

const rows = ref(10)
const dt = ref(null);
const filters = ref({});
const loading = ref(null);
const selectedSessions = ref([])
const selectedVisibleSessions = computed(() => {
  // only those with visible actions
  return selectedSessions.value.filter(session => actions.value[`session-action-${session.server.id}-${session.name}`])
})

const isBatchStarting = ref(false)
const isBatchRestarting = ref(false)
const isBatchStopping = ref(false)
const isBatchLoggingOut = ref(false)
const isBatchRemoving = ref(false)

const actions = ref({})

function setBatchStatus(action, value) {
  switch (action) {
    case "startSession":
      isBatchStarting.value = value
      break
    case "restartSession":
      isBatchRestarting.value = value
      break
    case "stopSession":
      isBatchStopping.value = value
      break
    case "logoutSession":
      isBatchLoggingOut.value = value
      break
    case "deleteSession":
      isBatchRemoving.value = value
      break

  }
}

async function performAction(action) {
  setBatchStatus(action, true)
  // Iterate over selected sessions
  // and call the action for appropriate ref
  try {
    for (const session of selectedVisibleSessions.value) {
      const ref = actions.value[`session-action-${session.server.id}-${session.name}`]
      await ref[action]()
    }
  } finally {
    setBatchStatus(action, false)
  }
}

onBeforeUpdate(() => {
  actions.value = []
})

onBeforeMount(() => {
  initFilters()
});

const columns = ref([
  {field: "name", header: "Name"},
  {field: "metadata", header: "Metadata"},
  {field: "me", header: "Me"},
  {field: "status", header: "Status"},
  {field: "server", header: "Server"},
])

function loadHiddenColumns() {
  return JSON.parse(localStorage.getItem("sessions.table.columns.hidden")) || []
}

const hiddenColumnsSaved = loadHiddenColumns()

// Difference by "field"
const selectedColumns = ref(lodash.differenceBy(columns.value, hiddenColumnsSaved, 'field'))
const onToggle = (val) => {
  selectedColumns.value = columns.value.filter(col => val.includes(col));
};

function isEnabled(field) {
  if (!selectedColumns.value) {
    return true
  }
  if (selectedColumns.value.length === 0) {
    return true
  }
  return lodash.find(selectedColumns.value, {field})
}

const isNameEnabled = computed(() => isEnabled("name"))
const isMetadataEnabled = computed(() => isEnabled("metadata"))
const isMeEnabled = computed(() => isEnabled("me"))
const isStatusEnabled = computed(() => isEnabled("status"))
const isServerEnabled = computed(() => isEnabled("server"))

// on hidden columns change - save it in "localstorage[sessions.table.columns.hidden]"
const hiddenColumns = computed(() => lodash.differenceBy(columns.value, selectedColumns.value, "field"))
watch(() => hiddenColumns.value, (val) => {
  localStorage.setItem("sessions.table.columns.hidden", JSON.stringify(val))
}, {deep: true})


const initFilters = () => {
  filters.value = {
    global: {value: null, matchMode: FilterMatchMode.CONTAINS},
    status: {value: null, matchMode: FilterMatchMode.EQUALS},
    'server.id': {value: null, matchMode: FilterMatchMode.EQUALS},
    name: {value: null, matchMode: FilterMatchMode.CONTAINS},
    'me.id': {value: null, matchMode: FilterMatchMode.CONTAINS},
  };
};

function openNew() {
  // Get first connected server
  const server = servers.value.find(s => s.connected)
  if (!server) {
    toast.add({
      severity: 'error',
      summary: 'No connected server',
      detail: 'Please connect to a server first',
      life: 3000
    });
    return
  }

  session.value = {
    server: server.id,
    name: "",
    config: {
      metadata: {},
      webhooks: [],
      noweb: {
        markOnline: true,
        store: {
          enabled: true,
          fullSync: false
        },
      },
      proxy: {},
    },
  };
  sessionDialogMode.value = "new"
  sessionDialog.value = true;
}


function showSessionConfig(selected) {
  session.value = lodash.cloneDeep({
    name: selected.name,
    status: selected.status,
    server: selected.server.id,
    config: selected.config,
  });
  sessionDialogMode.value = "update"
  sessionDialog.value = true;
}


function refreshServers() {
  useAsyncData('store', async () => await store.refresh())
}

function clearFilter() {
  initFilters()
}

function rowClick(event) {
  openSessionControl(event.data)
}

function openSessionControl(data) {
  sessionControlDialog.value = true;
  session.value = data
}

function openSessionChats(data) {
  session.value = data
  sessionChatsDialog.value = true;
}

watch(sessionChatsDialog, (val) => {
  if (!val) {
    session.value = {
      config: {
        webhooks: [],
      },
    }
  }
})


const globalFilterFields = computed(
    () => {
      return [
        'name',
        'me.id',
        "me.pushName",
        "_metadata",
      ]
    }
)

</script>

<template>
  <div class="flex justify-content-between">
    <div>
      <h5 class="flex align-items-center gap-1">
        <i class="pi pi-whatsapp"></i>
        <span class="mr-1">
      Sessions
      </span>
        <RefreshIcon :refreshing="refreshing"/>
      </h5>
    </div>
    <div>
      <button
          v-tooltip.top="'Refresh'"
          @click="refreshServers" class="p-link layout-topbar-button" :disabled="refreshing">
        <i class="pi pi-refresh"></i>
      </button>
    </div>
  </div>

  <DataTable
      v-model:selection="selectedSessions"
      :value="visibleSessions.length > 0 ? visibleSessions : []"
      :paginator="true"
      :rows="rows"
      :rowsPerPageOptions="[5, 10, 20, 50, 100, 500]"
      :dataKey="(data) => `${data.server.id}-${data.name}`"
      :rowHover="true"
      v-model:filters="filters"
      filterDisplay="row"
      :loading="loading"
      :globalFilterFields="globalFilterFields"
      showGridlines
      style="white-space: nowrap;"
      sortField="name"
      :sortOrder="1"
      resizableColumns
  >

    <template #header>
      <div class="flex justify-content-between flex-column sm:flex-row gap-2 sm:gap-0">
        <div class="flex flex-column">
          <Button label="Start New" icon="pi pi-play" severity="success" @click="openNew"/>
        </div>
        <div class="flex justify-content-between flex-column sm:flex-row gap-2 sm:gap-2">
          <HideDuplicates></HideDuplicates>
          <div>
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search"/>
              <InputText
                  v-model="filters['global'].value"
                  placeholder="Search by Name, Phone, Metadata"
                  style="width: 100%"
              />
            </IconField>
          </div>
          <div style="text-align:left" class="flex flex-column">
            <MultiSelect
                placeholder="Columns"
                :modelValue="selectedColumns"
                :options="columns"
                optionLabel="header"
                selectedItemsLabel="Columns"
                :maxSelectedLabels="0"
                @update:modelValue="onToggle"
            />
          </div>
        </div>
      </div>
    </template>
    <template #empty> No sessions found</template>
    <template #loading> Loading sessions...</template>
    <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

    <Column
        v-if="isNameEnabled"
        field="name"
        header="Name"
        :show-filter-menu="false"
        sortable
    >
      <template #filter="{ filterModel, filterCallback }">
        <InputText
            v-model="filters['name'].value"
            type="text"
            placeholder="Session"
        />
      </template>
    </Column>

    <Column
        v-if="isMetadataEnabled"
        header="Metadata"
    >
      <template #body="{ data }">
        <Metadata
            :metadata="data.config?.metadata"
        ></Metadata>
      </template>
    </Column>

    <Column
        v-if="isMeEnabled"
        header="Me"
    >
      <template #body="{ data }">
        <div class="text-center">
          <SessionChip :session="data"></SessionChip>
        </div>
      </template>
      <template #filter="{ filterModel, filterCallback }">
        <InputText
            v-model="filters['me.id'].value"
            type="text"
            placeholder="Me (Phone Number)"
        />
      </template>
    </Column>

    <Column
        v-if="isStatusEnabled"
        field="status" header="Status" :showFilterMenu="false" style="width: 9rem">
      <template #body="{ data }">
        <div class="flex gap-2">
          <div>
            <SessionLogin :session="data"/>
          </div>
          <div>
            <ScreenshotButton :session="data"></ScreenshotButton>
          </div>
          <div>
            <Button
                icon="pi pi-whatsapp"
                v-tooltip.top="'Chat UI'"
                severity=""
                rounded
                outlined
                :disabled="data.status !== 'WORKING'"
                @click="openSessionChats(data)"
            />
          </div>
          <div>
            <Button
                icon="pi pi-code"
                v-tooltip.top="'Send Request'"
                severity="secondary"
                rounded
                outlined
                @click="openSessionControl(data)"
            />
          </div>
          <div class="my-auto">
            <SessionStatusTag
                :status="data.status"
                :value="data.status.toUpperCase()"
            ></SessionStatusTag>
          </div>
        </div>
      </template>

      <template #filter="{ filterModel, filterCallback }">
        <Dropdown
            v-model="filterModel.value" :options="SessionStatuses"
            @change="filterCallback()"
            placeholder="Any" class="p-column-filter"
            :showClear="true"
        >
          <template #option="{ option }">
            <SessionStatusTag
                :status="option"
                :value="option"
            ></SessionStatusTag>
          </template>
        </Dropdown>
      </template>
    </Column>

    <Column
        v-if="isServerEnabled"
        field="server.name"
        filterField='server.id'
        header="Server"
        :showFilterMenu="false"
    >
      <template #filter="{ filterModel, filterCallback }">
        <ServerDropdown
            placeholder="Any"
            @change="filterCallback()"
            v-model="filterModel.value"
            :showClear="true"
            :required="false"
        ></ServerDropdown>
      </template>
      <template #body="{ data }">
        {{ data.server.name }}
        <i
            v-if="data.assignedWorker && data.server.name !== data.assignedWorker"
            v-tooltip='`Assigned Worker ID does not match\n\n👉 Assigned Worker ID: ${ data.assignedWorker }`'
            class="pi pi-info-circle text-orange-400"
        ></i>
      </template>
    </Column>

    <Column
        :showFilterMenu="false"
    >
      <template #filter>
        <div class="flex flex-row gap-2 justify-content-end" style="order: 2;">
          <SessionActionButtons
              group="dialog"
              :name="`'${selectedVisibleSessions.length}' sessions`"
              :all-disabled="selectedVisibleSessions.length===0"
              :hide-actions="['view']"
              :is-starting="isBatchStarting"
              :is-restarting="isBatchRestarting"
              :is-stopping="isBatchStopping"
              :is-logging-out="isBatchLoggingOut"
              :is-removing="isBatchRemoving"
              @start="performAction('startSession')"
              @restart="performAction('restartSession')"
              @stop="performAction('stopSession')"
              @logout="performAction('logoutSession')"
              @delete="performAction('deleteSession')"
          />
        </div>
      </template>
      <template #body="{data}">
        <SessionActions
            :ref="el => { actions[`session-action-${data.server.id}-${data.name}`] = el }"
            :session="data"
            :disabled="selectedVisibleSessions.length!==0"
            @view="showSessionConfig"
        />
      </template>
    </Column>
  </DataTable>
  <ConfirmPopup></ConfirmPopup>
  <SessionChatDialog
      v-model:visible="sessionChatsDialog"
      v-model:session="session"
  ></SessionChatDialog>
  <SessionControlDialog
      v-model:visible="sessionControlDialog"
      v-model:session="session"
  ></SessionControlDialog>
  <SessionDialog
      v-model:visible="sessionDialog"
      v-model:session="session"
      :mode="sessionDialogMode"
  ></SessionDialog>
</template>

<style lang="scss">
.p-column-filter-clear-button {
  display: none;
}
</style>
