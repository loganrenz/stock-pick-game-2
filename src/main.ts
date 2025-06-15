import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import './utils/axios' // Import axios configuration

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
