import QuasarCamera from './components/QuasarCamera.vue'

// Install function for Vue.use()
const install = (app) => {
    app.component('QuasarCamera', QuasarCamera)
}

// Export component and install function
export { QuasarCamera }
export default { install }

// Auto-install when used as script tag
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue)
}