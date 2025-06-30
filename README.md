# Vue Quasar Camera 📸

A modern, feature-rich camera component for Vue 3 + Quasar applications with advanced image capture capabilities, beautiful UI, and extensive customization options.

## ✨ Features

- 📸 **Photo Capture** - High-quality webcam photo capture
- 🎨 **Multiple Display Modes** - Corner overlay, inline, and fullscreen modes
- 🖼️ **Image Management** - Preview, retake, download, and share captured images
- 📤 **Event System** - Comprehensive event emissions for parent component integration
- 🎯 **Highly Customizable** - Extensive props for tailoring appearance and behavior
- 📱 **Responsive Design** - Optimized for desktop and mobile devices
- 🎭 **Modern UI** - Beautiful glassmorphism effects and smooth animations
- ⚡ **Performance Optimized** - Efficient resource management and cleanup
- 🔧 **Developer Friendly** - TypeScript support ready with exposed methods
- 🎥 **Recording Ready** - Built-in support for future video recording features
- 💡 **Flash Control** - Toggle flash functionality
- 🔄 **Camera Switching** - Front/back camera switching capability

## 🚀 Installation

### From npm (when published)

```bash
npm install vue-quasar-camera
# or
yarn add vue-quasar-camera
# or
pnpm add vue-quasar-camera
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

## 📖 Usage

### Global Registration

```javascript
// main.js
import { createApp } from "vue";
import { Quasar } from "quasar";
import VueQuasarCamera from "vue-quasar-camera";

const app = createApp(App);
app.use(Quasar);
app.use(VueQuasarCamera);
app.mount("#app");
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
  // imageData contains: { dataUrl, blob, filename, timestamp }

  // Use the image data as needed
  // Upload to server, save to local storage, display in gallery, etc.
};
</script>
```

### Advanced Usage with All Features

```vue
<template>
  <div>
    <!-- Camera Component -->
    <QuasarCamera
      ref="cameraRef"
      mode="inline"
      :width="600"
      :height="450"
      open-button-text="📷 Start Camera"
      close-button-text="❌ Stop Camera"
      filename-prefix="my-photo"
      :video-constraints="{
        width: 1280,
        height: 720,
        frameRate: { ideal: 30 },
      }"
      :show-download-button="true"
      :show-view-button="true"
      :show-status-indicator="true"
      :auto-emit-on-capture="true"
      button-size="lg"
      dialog-title="🖼️ Your Captured Photo"
      @image-captured="onImageCaptured"
      @camera-opened="onCameraOpened"
      @camera-closed="onCameraClosed"
      @image-downloaded="onImageDownloaded"
      @image-shared="onImageShared"
      @flash-toggled="onFlashToggled"
      @camera-switched="onCameraSwitched"
      @recording-started="onRecordingStarted"
      @recording-stopped="onRecordingStopped"
      @error="onCameraError"
    />

    <!-- Control Panel -->
    <div class="control-panel q-mt-md">
      <q-btn
        color="primary"
        label="Open Camera"
        @click="openCamera"
        class="q-mr-sm"
      />
      <q-btn
        color="negative"
        label="Close Camera"
        @click="closeCamera"
        class="q-mr-sm"
      />
      <q-btn
        color="secondary"
        label="Capture Photo"
        @click="capturePhoto"
        :disable="!isCameraOpen"
      />
    </div>

    <!-- Image Gallery -->
    <div v-if="capturedImages.length" class="image-gallery q-mt-lg">
      <h5>📸 Captured Images ({{ capturedImages.length }})</h5>
      <div class="row q-gutter-md">
        <div
          v-for="(img, index) in capturedImages"
          :key="index"
          class="col-auto"
        >
          <q-card class="image-card">
            <q-img
              :src="img.dataUrl"
              style="width: 150px; height: 150px;"
              fit="cover"
              class="cursor-pointer"
              @click="previewImage(img)"
            />
            <q-card-section class="q-pa-sm text-center">
              <small>{{ formatTimestamp(img.timestamp) }}</small>
            </q-card-section>
          </q-card>
        </div>
      </div>
    </div>

    <!-- Statistics -->
    <q-card v-if="stats.totalCaptured > 0" class="q-mt-lg">
      <q-card-section>
        <div class="text-h6">📊 Statistics</div>
        <div class="row q-gutter-md q-mt-sm">
          <div class="col">
            <q-chip color="primary" text-color="white">
              Total Captured: {{ stats.totalCaptured }}
            </q-chip>
          </div>
          <div class="col">
            <q-chip color="secondary" text-color="white">
              Downloads: {{ stats.totalDownloads }}
            </q-chip>
          </div>
          <div class="col">
            <q-chip color="positive" text-color="white">
              Shares: {{ stats.totalShares }}
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useQuasar } from "quasar";

const $q = useQuasar();
const cameraRef = ref(null);
const capturedImages = ref([]);
const isCameraOpen = ref(false);
const stats = ref({
  totalCaptured: 0,
  totalDownloads: 0,
  totalShares: 0,
});

// Event Handlers
const onImageCaptured = (imageData) => {
  capturedImages.value.push(imageData);
  stats.value.totalCaptured++;

  $q.notify({
    message: `📸 Photo captured! Total: ${stats.value.totalCaptured}`,
    color: "positive",
    icon: "photo_camera",
  });

  // Upload to server example
  uploadToServer(imageData.blob, imageData.filename);
};

const onCameraOpened = () => {
  isCameraOpen.value = true;
  console.log("📹 Camera opened");
};

const onCameraClosed = () => {
  isCameraOpen.value = false;
  console.log("📹 Camera closed");
};

const onImageDownloaded = (downloadData) => {
  stats.value.totalDownloads++;
  console.log("💾 Image downloaded:", downloadData.filename);
};

const onImageShared = (shareData) => {
  if (shareData.success) {
    stats.value.totalShares++;
  }
  console.log("📤 Image share:", shareData);
};

const onFlashToggled = (enabled) => {
  console.log("💡 Flash:", enabled ? "ON" : "OFF");
};

const onCameraSwitched = (facingMode) => {
  console.log("🔄 Camera switched to:", facingMode);
};

const onRecordingStarted = () => {
  console.log("🎥 Recording started");
};

const onRecordingStopped = () => {
  console.log("⏹️ Recording stopped");
};

const onCameraError = (error) => {
  console.error("❌ Camera error:", error);
  $q.notify({
    message: "Camera error occurred. Please check permissions.",
    color: "negative",
    icon: "error",
  });
};

// Programmatic Control
const openCamera = () => {
  cameraRef.value?.openCamera();
};

const closeCamera = () => {
  cameraRef.value?.closeCamera();
};

const capturePhoto = () => {
  if (isCameraOpen.value) {
    cameraRef.value?.capturePhoto();
  }
};

// Utility Functions
const uploadToServer = async (blob, filename) => {
  const formData = new FormData();
  formData.append("image", blob, filename);
  formData.append("timestamp", new Date().toISOString());

  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      console.log("✅ Upload successful:", result);

      $q.notify({
        message: "Photo uploaded successfully!",
        color: "positive",
        icon: "cloud_upload",
      });
    }
  } catch (error) {
    console.error("❌ Upload failed:", error);

    $q.notify({
      message: "Upload failed. Please try again.",
      color: "negative",
      icon: "cloud_off",
    });
  }
};

const previewImage = (imageData) => {
  $q.dialog({
    title: "🖼️ Image Preview",
    message: `Captured: ${formatTimestamp(imageData.timestamp)}`,
    html: true,
    ok: "Close",
  });
};

const formatTimestamp = (timestamp) => {
  return new Date(timestamp).toLocaleString();
};
</script>

<style scoped>
.control-panel {
  text-align: center;
  padding: 16px;
}

.image-gallery {
  padding: 16px;
}

.image-card {
  transition: transform 0.2s;
}

.image-card:hover {
  transform: scale(1.05);
}
</style>
```

## 🔧 Props

| Prop                     | Type          | Default                       | Description                                          |
| ------------------------ | ------------- | ----------------------------- | ---------------------------------------------------- |
| **Display & Layout**     |               |                               |                                                      |
| `mode`                   | String        | `'corner'`                    | Display mode: `'corner'`, `'inline'`, `'fullscreen'` |
| `width`                  | String/Number | `350px` (corner/inline)       | Camera width                                         |
| `height`                 | String/Number | `260px` (corner/inline)       | Camera height                                        |
| **Button Configuration** |               |                               |                                                      |
| `openButtonText`         | String        | `'Open Camera'`               | Text for open button                                 |
| `closeButtonText`        | String        | `'Close Camera'`              | Text for close button                                |
| `buttonSize`             | String        | `'lg'`                        | Button size (`'xs'`, `'sm'`, `'md'`, `'lg'`, `'xl'`) |
| **UI Elements**          |               |                               |                                                      |
| `showToggleButton`       | Boolean       | `true`                        | Show/hide main toggle button                         |
| `showCloseButton`        | Boolean       | `true`                        | Show/hide close button                               |
| `showStatusIndicator`    | Boolean       | `true`                        | Show/hide live/captured status indicator             |
| `showViewButton`         | Boolean       | `true`                        | Show/hide view button                                |
| `showRetakeButton`       | Boolean       | `true`                        | Show/hide retake button                              |
| `showDownloadButton`     | Boolean       | `true`                        | Show/hide download button                            |
| **Dialog Configuration** |               |                               |                                                      |
| `showViewDialog`         | Boolean       | `true`                        | Enable/disable image view dialog                     |
| `showDownloadInDialog`   | Boolean       | `true`                        | Show download button in dialog                       |
| `dialogTitle`            | String        | `'Captured Photo'`            | Dialog title text                                    |
| **Camera Settings**      |               |                               |                                                      |
| `videoConstraints`       | Object        | `{ width: 640, height: 480 }` | Camera resolution and settings                       |
| `autoEmitOnCapture`      | Boolean       | `true`                        | Auto emit image data on capture                      |
| `filenamePrefix`         | String        | `'photo'`                     | Prefix for downloaded filenames                      |

### Video Constraints Examples

```javascript
// Basic constraints
{ width: 640, height: 480 }

// High definition
{ width: 1280, height: 720 }

// Full HD with frame rate
{
  width: 1920,
  height: 1080,
  frameRate: { ideal: 30, max: 60 }
}

// Mobile optimized
{
  width: { ideal: 640 },
  height: { ideal: 480 },
  facingMode: "user" // or "environment" for back camera
}
```

## 📡 Events

| Event                | Payload                                  | Description                                 |
| -------------------- | ---------------------------------------- | ------------------------------------------- |
| **Core Events**      |                                          |                                             |
| `image-captured`     | `{ dataUrl, blob, filename, timestamp }` | Fired when image is captured                |
| `camera-opened`      | -                                        | Fired when camera starts                    |
| `camera-closed`      | -                                        | Fired when camera stops                     |
| `error`              | `Error`                                  | Fired when error occurs                     |
| **Action Events**    |                                          |                                             |
| `image-downloaded`   | `{ filename, dataUrl, timestamp }`       | Fired when image is downloaded              |
| `image-shared`       | `{ filename?, success, error? }`         | Fired when image is shared                  |
| **Control Events**   |                                          |                                             |
| `flash-toggled`      | `Boolean`                                | Fired when flash is toggled                 |
| `camera-switched`    | `String`                                 | Fired when camera is switched (facing mode) |
| **Recording Events** |                                          |                                             |
| `recording-started`  | -                                        | Fired when recording starts                 |
| `recording-stopped`  | -                                        | Fired when recording stops                  |

## 🎛️ Exposed Methods

Access these methods via template ref:

```javascript
const cameraRef = ref(null);

// Camera Control
cameraRef.value.openCamera(); // Open camera
cameraRef.value.closeCamera(); // Close camera
cameraRef.value.capturePhoto(); // Take photo
cameraRef.value.retakePhoto(); // Retake current photo

// Image Actions
cameraRef.value.downloadImage(); // Download captured image
cameraRef.value.shareImage(); // Share captured image

// Feature Controls
cameraRef.value.toggleFlash(); // Toggle flash on/off
cameraRef.value.switchCamera(); // Switch front/back camera
cameraRef.value.toggleRecording(); // Start/stop recording

// State Getters
cameraRef.value.isOpen(); // Returns Boolean
cameraRef.value.hasCapturedImage(); // Returns Boolean
cameraRef.value.getCapturedImage(); // Returns image data URL
cameraRef.value.isRecording(); // Returns Boolean
cameraRef.value.flashEnabled(); // Returns Boolean
```

## 🎨 Display Modes

### Corner Mode

```vue
<QuasarCamera mode="corner" />
```

- Floating camera overlay in corner
- Perfect for persistent camera access
- Minimal space usage

### Inline Mode

```vue
<QuasarCamera mode="inline" :width="400" :height="300" />
```

- Embedded in page layout
- Customizable dimensions
- Great for forms and content integration

### Fullscreen Mode

```vue
<QuasarCamera mode="fullscreen" />
```

- Full viewport coverage
- Immersive camera experience
- Optimal for mobile devices

## 📱 Responsive Behavior

The component automatically adapts to different screen sizes:

- **Desktop**: Full feature set with hover effects
- **Tablet**: Optimized button sizes and spacing
- **Mobile**: Touch-friendly interface with larger controls

## 🔒 Browser Permissions

The component requires camera permissions. Handle permission requests gracefully:

```javascript
const onCameraError = (error) => {
  if (error.name === "NotAllowedError") {
    // Guide user to enable camera permissions
    showPermissionDialog();
  } else if (error.name === "NotFoundError") {
    // No camera available
    showNoCameraMessage();
  }
};
```

## 🛠️ Development

### Prerequisites

- Vue 3.0+
- Quasar Framework 2.0+
- Modern browser with camera support

### Build Setup

```bash
# Install dependencies
npm install

# Serve with hot reload
npm run dev

# Build for production
npm run build

# Run tests
npm run test

# Lint and fix files
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Vue.js team for the amazing framework
- Quasar team for the comprehensive UI framework
- Contributors and community members

## 📞 Support

- 🐛 Issues: [GitHub Issues](https://github.com/Dhielmeoww/vue-quasar-camera/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/Dhielmeoww/vue-quasar-camera/discussions)

---

Made with ❤️ for the Vue.js community
