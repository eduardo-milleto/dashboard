<script setup>
import {ref, computed, onMounted, onBeforeUnmount} from 'vue';
import {useLayout} from './composables/layout';
import {useRouter} from 'vue-router';
import {useAsyncData} from "nuxt/app";
import {useServerStore} from "../stores/useServerStore";

const {layoutConfig, onMenuToggle} = useLayout();
const outsideClickListener = ref(null);
const topbarMenuActive = ref(false);
const router = useRouter();
const store = useServerStore()

onMounted(() => {
  bindOutsideClickListener();
});
onBeforeUnmount(() => {
  unbindOutsideClickListener();
});
const logoUrl = computed(() => {
  return `/dashboard/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

const onTopBarMenuButton = () => {
  topbarMenuActive.value = !topbarMenuActive.value;
};

const onSettingsClick = () => {
  topbarMenuActive.value = false;
  router.push('/utilities/documentation');
};

const topbarMenuClasses = computed(() => {
  return {
    'layout-topbar-menu-mobile-active': topbarMenuActive.value
  };
});

const bindOutsideClickListener = () => {
  if (!outsideClickListener.value) {
    outsideClickListener.value = (event) => {
      if (isOutsideClicked(event)) {
        topbarMenuActive.value = false;
      }
    };

    document.addEventListener('click', outsideClickListener.value);
  }
};

const unbindOutsideClickListener = () => {
  if (outsideClickListener.value) {
    document.removeEventListener('click', outsideClickListener);
    outsideClickListener.value = null;
  }
};

const isOutsideClicked = (event) => {
  if (!topbarMenuActive.value) return;
  const sidebarEl = document.querySelector('.layout-topbar-menu');
  const topbarEl = document.querySelector('.layout-topbar-menu-button');

  return !(sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target) || topbarEl.isSameNode(event.target) || topbarEl.contains(event.target));
};

function refreshServers() {
  useAsyncData('store', async () => await store.refresh())
}

function eventMonitor(){
  router.push('/event-monitor')
}

const {refreshing} = storeToRefs(store)
</script>

<template>
  <div class="layout-topbar">
    <button class="p-link layout-menu-button layout-topbar-button" @click="onMenuToggle()">
      <i class="pi pi-bars"></i>
    </button>

    <router-link to="/" class="layout-topbar-logo">
      <img class="mb-1" :src="logoUrl" alt="logo"/>
      <span>Dashboard | WAHA</span>
    </router-link>


    <button class="p-link layout-topbar-menu-button layout-topbar-button" @click="onTopBarMenuButton()">
      <i class="pi pi-ellipsis-v"></i>
    </button>

    <div class="layout-topbar-menu" :class="topbarMenuClasses">
      <router-link
          to="/event-monitor"
          v-tooltip.bottom="'Event Monitor'"
          class="p-link layout-topbar-button">
        <i class="pi pi-eye" style="color: #459e74" ></i>
        <span>Event Monitor</span>
      </router-link>
      <div class="m-auto">
        <RefreshIcon :refreshing="refreshing"/>
      </div>
      <button
          v-tooltip.bottom="'Refresh'"
          @click="refreshServers" class="p-link layout-topbar-button" :disabled="refreshing">
        <i class="pi pi-refresh"></i>
        <span>Refresh</span>
      </button>
      <!--      <button @click="onTopBarMenuButton()" class="p-link layout-topbar-button">-->
      <!--        <i class="pi pi-user"></i>-->
      <!--        <span>Profile</span>-->
      <!--      </button>-->
      <!--            <button @click="onSettingsClick()" class="p-link layout-topbar-button">-->
      <!--                <i class="pi pi-cog"></i>-->
      <!--                <span>Settings</span>-->
      <!--            </button>-->
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
