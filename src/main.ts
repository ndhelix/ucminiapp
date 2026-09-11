import './assets/index.css'

import { createApp } from 'vue'
import { retrieveLaunchParams } from '@telegram-apps/sdk-vue'

import App from './App.vue'
import router from './router'
import { errorHandler } from './errorHandler'
import { init } from './init'

import './mockEnv'

const redirectedRoute = new URLSearchParams(location.search).get('__route')
if (redirectedRoute && /^(calendar|clients|events|reports|missions|notifications|payments|analytics|more|catalog|bulk|exams|audit|bot-stream)(\/|\?|$)/.test(redirectedRoute)) {
    history.replaceState(null, '', import.meta.env.BASE_URL + redirectedRoute + location.hash)
}

init( retrieveLaunchParams().startParam === 'debug' || import.meta.env.DEV )

const app = createApp( App )
app.config.errorHandler = errorHandler
app.use( router )
app.mount( '#app' )
