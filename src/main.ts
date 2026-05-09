import './assets/index.css'

import { createApp } from 'vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk-vue'

import App from './App.vue'
import router from './router'
import { errorHandler } from './errorHandler'
import { init } from './init'

import './mockEnv'

init( retrieveLaunchParams().startParam === 'debug' || import.meta.env.DEV )

const app = createApp( App )
app.config.errorHandler = errorHandler
app.use( router )
app.mount( '#app' )
