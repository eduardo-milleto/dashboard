<script setup>
import {useLayout} from '@/layouts/composables/layout';
import {ref, computed} from 'vue';
import AppConfig from '@/layouts/AppConfig.vue';

const {layoutConfig} = useLayout();
const username = ref('');
const password = ref('');
const checked = ref(false);
const logoUrl = computed(() => {
  return `/dashboard/layout/images/${layoutConfig.darkTheme.value ? 'logo-white' : 'logo-dark'}.svg`;
});

definePageMeta({
  layout: false
});

function login() {

}
</script>

<template>
  <div class="surface-ground flex align-items-center justify-content-center min-h-screen min-w-screen overflow-hidden">
    <div class="flex flex-column align-items-center justify-content-center">
      <div
          style="border-radius: 56px; padding: 0.3rem; background: linear-gradient(180deg, var(--primary-color) 10%, rgba(33, 150, 243, 0) 30%)">
        <div class="w-full surface-card py-8 px-5 sm:px-8" style="border-radius: 53px">
          <div class="text-center mb-5">
            <img :src="logoUrl" alt="Sakai logo" class="mb-5 w-6rem flex-shrink-0"/>
            <div class="text-900 text-3xl font-medium mb-3">Welcome to WAHA Hub!</div>
          </div>

          <div>
            <label for="username1" class="block text-900 text-xl font-medium mb-2">Username</label>
            <InputText id="username1" v-model="username" type="text" placeholder="Username"
                       class="w-full md:w-30rem mb-5" style="padding: 1rem"/>

            <label for="password1" class="block text-900 font-medium text-xl mb-2">Password</label>
            <Password id="password1" v-model="password" placeholder="Password" :toggleMask="true" class="w-full mb-3"
                      inputClass="w-full" :inputStyle="{ padding: '1rem' }"></Password>

            <div class="flex align-items-center justify-content-between mb-5 gap-5">
            </div>
            <Button
                @click="login"
                label="Sign In" class="w-full p-3 text-xl"
            ></Button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <AppConfig simple/>
</template>

<style scoped>
.pi-eye {
  transform: scale(1.6);
  margin-right: 1rem;
}

.pi-eye-slash {
  transform: scale(1.6);
  margin-right: 1rem;
}
</style>
