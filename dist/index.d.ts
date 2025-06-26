import { DefineComponent, Plugin } from 'vue'

// Define the props interface berdasarkan komponen Vue Anda
export interface QuasarCameraProps {
  // Appearance
  mode?: 'corner' | 'inline' | 'fullscreen'
  width?: string | number
  height?: string | number
  
  // Button texts
  openButtonText?: string
  closeButtonText?: string
  buttonSize?: string
  
  // Features
  showToggleButton?: boolean
  showCloseButton?: boolean
  showStatusIndicator?: boolean
  showViewButton?: boolean
  showRetakeButton?: boolean
  showDownloadButton?: boolean
  showViewDialog?: boolean
  showDownloadInDialog?: boolean
  
  // Dialog
  dialogTitle?: string
  
  // Camera settings
  videoConstraints?: object
  
  // Auto emit
  autoEmitOnCapture?: boolean
  
  // Filename
  filenamePrefix?: string
}

// Define the events interface berdasarkan emit yang ada
export interface QuasarCameraEvents {
  'image-captured': (imageData: {
    dataUrl: string
    blob: Blob | null
    filename: string
  }) => void
  'camera-opened': () => void
  'camera-closed': () => void
  'image-downloaded': (data: {
    filename: string
    dataUrl: string
  }) => void
  'error': (error: Error) => void
}

// Define the component type
export declare const QuasarCamera: DefineComponent<
  QuasarCameraProps,
  {},
  {},
  {},
  {},
  {},
  {},
  QuasarCameraEvents
>

// Define the plugin interface
export interface VueQuasarCameraPlugin extends Plugin {
  install(app: any): void
}

// Default export (plugin)
declare const plugin: VueQuasarCameraPlugin

export default plugin

// Module declaration
declare module 'vue-quasar-camera' {
  export { QuasarCamera }
  export default plugin
}