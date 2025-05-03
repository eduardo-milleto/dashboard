import Tooltip from 'primevue/tooltip';
import ConfirmationService from 'primevue/confirmationservice';

export default defineNuxtPlugin((nuxtApp) => {
    nuxtApp.vueApp.directive('tooltip', Tooltip)
    nuxtApp.vueApp.use(ConfirmationService)
})
