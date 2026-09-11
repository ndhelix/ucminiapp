import { backButton } from '@telegram-apps/sdk-vue'
import { onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

export function useBackButton() {
    let offClick: () => void = () => {}
    const route = useRoute()
    const router = useRouter()

    watch(() => route.path, () => {
        if (!backButton.isSupported())
            return
        if (route.path === '/') {
            backButton.hide()
            offClick()
        } else if (!backButton.isVisible()) {
            backButton.show()
            offClick = backButton.onClick(onBackButtonClick)
        }
    }, { immediate: true })
    onUnmounted(() => offClick())

    async function onBackButtonClick(): Promise<void> {
        if (window.history.state?.back)
            router.back()
        else
            await router.push('/')
    }
}
