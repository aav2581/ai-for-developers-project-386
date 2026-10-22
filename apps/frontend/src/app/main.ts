import { createApp } from 'vue'
import App from './App.vue'
import { createAppRouter } from './router'
import './styles/main.css'
import 'flyonui/flyonui'

createApp(App).use(createAppRouter()).mount('#app')
