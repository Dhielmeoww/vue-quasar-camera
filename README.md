# Vue Quasar Camera

A flexible, feature-rich camera component for Vue 3 + Quasar applications with image capture and emit functionality.

## Features

- 📸 Photo capture with webcam
- 🎨 Multiple display modes (corner, inline, fullscreen)
- 🖼️ Image preview and download
- 📤 Image data emit to parent component
- 🎯 Highly customizable with props
- 📱 Responsive design
- 🎭 Beautiful UI with glassmorphism effects
- ⚡ TypeScript support ready

## Installation

### From npm (when published)

```bash
npm install vue-quasar-camera
# or
yarn add vue-quasar-camera
```

### From Git Repository

```bash
npm install git+https://github.com/Dhielmeoww/vue-quasar-camera.git
# or
yarn add git+https://github.com/Dhielmeoww/vue-quasar-camera.git
```

### Local Development

```bash
git clone https://github.com/Dhielmeoww/vue-quasar-camera.git
cd vue-quasar-camera
npm install
npm run build
```

## Usage

### Global Registration

```javascript
// main.js
import { createApp } from "vue";
import { Quasar } from "quasar";
import VueQuasarCamera from "vue-quasar-camera";

const app = createApp(App);
app.use(Quasar);
app.use(VueQuasarCamera);
```

### Component Registration

```javascript
// In your component
import { QuasarCamera } from "vue-quasar-camera";

export default {
  components: {
    QuasarCamera,
  },
};
```

### Basic Usage

```vue
<template>
  <div>
    <QuasarCamera @image-captured="handleImageCapture" mode="corner" />
  </div>
</template>

<script setup>
const handleImageCapture = (imageData) => {
  console.log("Image captured:", imageData);
  // imageData contains: { dataUrl, blob, filename }

  // Use the image data as needed
  // For example, upload to server, display in gallery, etc.
};
</script>
```

### Advanced Usage

```vue
<template>
  <div>
    <QuasarCamera
      ref="cameraRef"
      mode="inline"
      :width="500"
      :height="400"
      open-button-text="Start Camera"
      close-button-text="Stop Camera"
      filename-prefix="my-photo"
      :video-constraints="{ width: 1280, height: 720 }"
      :show-download-button="false"
      :auto-emit-on-capture="true"
      @image-captured="onImageCaptured"
      @camera-opened="onCameraOpened"
      @camera-closed="onCameraClosed"
      @error="onCameraError"
    />

    <!-- Display captured images -->
    <div v-if="capturedImages.length" class="image-gallery">
      <img
        v-for="(img, index) in capturedImages"
        :key="index"
        :src="img.dataUrl"
        style="width: 100px; height: 100px; object-fit: cover; margin: 5px;"
      />
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const cameraRef = ref(null);
const capturedImages = ref([]);

const onImageCaptured = (imageData) => {
  capturedImages.value.push(imageData);

  // Upload to server example
  uploadToServer(imageData.blob, imageData.filename);
};

const onCameraOpened = () => {
  console.log("Camera opened");
};

const onCameraClosed = () => {
  console.log("Camera closed");
};

const onCameraError = (error) => {
  console.error("Camera error:", error);
};

const uploadToServer = async (blob, filename) => {
  const formData = new FormData();
  formData.append("image", blob, filename);

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    console.log("Upload successful:", await response.json());
  } catch (error) {
    console.error("Upload failed:", error);
  }
};

// Programmatic control
const openCamera = () => {
  cameraRef.value?.openCamera();
};

const closeCamera = () => {
  cameraRef.value?.closeCamera();
};

const capturePhoto = () => {
  cameraRef.value?.capturePhoto();
};
</script>
```

## Props

| Prop                   | Type          | Default                       | Description                                          |
| ---------------------- | ------------- | ----------------------------- | ---------------------------------------------------- |
| `mode`                 | String        | `'corner'`                    | Display mode: `'corner'`, `'inline'`, `'fullscreen'` |
| `width`                | String/Number | `320`                         | Camera width (for inline mode)                       |
| `height`               | String/Number | `240`                         | Camera height (for inline mode)                      |
| `openButtonText`       | String        | `'Open Camera'`               | Text for open button                                 |
| `closeButtonText`      | String        | `'Close Camera'`              | Text for close button                                |
| `buttonSize`           | String        | `'lg'`                        | Button size                                          |
| `showToggleButton`     | Boolean       | `true`                        | Show/hide toggle button                              |
| `showCloseButton`      | Boolean       | `true`                        | Show/hide close button                               |
| `showStatusIndicator`  | Boolean       | `true`                        | Show/hide status indicator                           |
| `showViewButton`       | Boolean       | `true`                        | Show/hide view button                                |
| `showRetakeButton`     | Boolean       | `true`                        | Show/hide retake button                              |
| `showDownloadButton`   | Boolean       | `true`                        | Show/hide download button                            |
| `showViewDialog`       | Boolean       | `true`                        | Enable/disable view dialog                           |
| `showDownloadInDialog` | Boolean       | `true`                        | Show download button in dialog                       |
| `dialogTitle`          | String        | `'Captured Photo'`            | Dialog title                                         |
| `videoConstraints`     | Object        | `{ width: 640, height: 480 }` | Camera constraints                                   |
| `autoEmitOnCapture`    | Boolean       | `true`                        | Auto emit image on capture                           |
| `filenamePrefix`       | String        | `'photo'`                     | Prefix for downloaded files                          |

## Events

| Event              | Payload                       | Description                    |
| ------------------ | ----------------------------- | ------------------------------ |
| `image-captured`   | `{ dataUrl, blob, filename }` | Fired when image is captured   |
| `camera-opened`    | -                             | Fired when camera is opened    |
| `camera-closed`    | -                             | Fired when camera is closed    |
| `image-downloaded` | `{ filename, dataUrl }`       | Fired when image is downloaded |
| `error`            | `Error`                       | Fired when error occurs        |
