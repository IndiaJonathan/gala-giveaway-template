import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import '@mdi/font/css/materialdesignicons.css'
import { VTimePicker } from 'vuetify/labs/VTimePicker'
import { createPinia } from 'pinia'

const app = createApp(App);

const vuetify = createVuetify({
    components: {
        ...components,
        VTimePicker
    },
    directives,
    icons: {
        defaultSet: 'mdi',
        aliases,
        sets: {
            mdi,
        },
    },
    theme: {
        defaultTheme: 'dark',
        themes: {
            light: {
                colors: {
                    primary: "#0088cc"
                }
            },
            dark: {
                colors: {
                    primary: "#0088cc"
                }
            },
        },
    }
});
const pinia = createPinia()

app.use(pinia)
app.use(router);
app.use(vuetify);

app.mount('#app')
