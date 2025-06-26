<template>
  <div>
    <!-- Toggle Button -->
    <q-btn
      v-if="showToggleButton"
      :color="isOpen ? 'negative' : 'secondary'"
      :label="isOpen ? closeButtonText : openButtonText"
      @click="toggleCamera"
      :icon="isOpen ? 'videocam_off' : 'videocam'"
      :size="buttonSize"
      class="camera-toggle-btn"
      rounded
      push
    />

    <!-- Camera Component -->
    <div v-if="isOpen" :class="cameraWrapperClass">
      <div :class="cameraContentClass">
        <!-- Status indicator -->
        <div v-if="showStatusIndicator" class="status-indicator">
          <q-icon
            :name="capturedImage ? 'check_circle' : 'videocam'"
            :color="capturedImage ? 'positive' : 'primary'"
            size="sm"
          />
        </div>

        <!-- Video stream or captured image -->
        <video
          v-if="!capturedImage"
          ref="videoElement"
          autoplay
          muted
          :class="videoClass"
        />
        <img v-else :src="capturedImage" :class="imageClass" alt="Captured" />

        <!-- Controls -->
        <div :class="controlsClass">
          <q-btn
            v-if="!capturedImage"
            size="md"
            round
            color="primary"
            icon="camera"
            @click="capturePhoto"
            class="control-btn"
            push
          >
            <q-tooltip class="bg-primary">Capture</q-tooltip>
          </q-btn>

          <q-btn
            v-if="capturedImage && showViewButton"
            size="md"
            round
            color="positive"
            icon="visibility"
            @click="viewCapturedImage"
            class="control-btn"
            push
          >
            <q-tooltip class="bg-positive">View</q-tooltip>
          </q-btn>

          <q-btn
            v-if="capturedImage && showRetakeButton"
            size="md"
            round
            color="secondary"
            icon="refresh"
            @click="retakePhoto"
            class="control-btn"
            push
          >
            <q-tooltip class="bg-secondary">Retake</q-tooltip>
          </q-btn>

          <q-btn
            v-if="capturedImage && showDownloadButton"
            size="md"
            round
            color="accent"
            icon="download"
            @click="downloadImage"
            class="control-btn"
            push
          >
            <q-tooltip class="bg-accent">Download</q-tooltip>
          </q-btn>
        </div>

        <!-- Close button -->
        <q-btn
          v-if="showCloseButton"
          class="camera-close-btn"
          size="sm"
          round
          flat
          color="white"
          icon="close"
          @click="closeCamera"
        />
      </div>
    </div>

    <!-- Result Dialog -->
    <q-dialog v-model="resultDialog" v-if="showViewDialog">
      <q-card class="result-dialog">
        <q-card-section class="result-header">
          <div class="row items-center">
            <div class="col">
              <div class="text-h6 text-primary">
                <q-icon name="photo" class="q-mr-sm" />
                {{ dialogTitle }}
              </div>
            </div>
            <q-btn icon="close" flat round dense v-close-popup />
          </div>
        </q-card-section>

        <q-card-section class="result-content">
          <div class="result-image-container">
            <img
              v-if="capturedImage"
              :src="capturedImage"
              class="result-image"
              alt="Result"
            />
          </div>
        </q-card-section>

        <q-card-actions class="result-actions">
          <div class="row justify-center q-gutter-md full-width">
            <q-btn
              v-if="showDownloadInDialog"
              color="positive"
              label="Download"
              @click="downloadImage"
              icon="download"
              class="result-action-btn"
              rounded
              push
            />
            <q-btn
              color="secondary"
              label="Retake"
              @click="retakeFromDialog"
              icon="refresh"
              class="result-action-btn"
              rounded
              push
            />
          </div>
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from "vue";
import { useQuasar } from "quasar";

// Props
const props = defineProps({
  // Appearance
  mode: {
    type: String,
    default: "corner", // 'corner', 'inline', 'fullscreen'
    validator: (value) => ["corner", "inline", "fullscreen"].includes(value),
  },
  width: {
    type: [String, Number],
    default: 320,
  },
  height: {
    type: [String, Number],
    default: 240,
  },

  // Button texts
  openButtonText: {
    type: String,
    default: "Open Camera",
  },
  closeButtonText: {
    type: String,
    default: "Close Camera",
  },
  buttonSize: {
    type: String,
    default: "lg",
  },

  // Features
  showToggleButton: {
    type: Boolean,
    default: true,
  },
  showCloseButton: {
    type: Boolean,
    default: true,
  },
  showStatusIndicator: {
    type: Boolean,
    default: true,
  },
  showViewButton: {
    type: Boolean,
    default: true,
  },
  showRetakeButton: {
    type: Boolean,
    default: true,
  },
  showDownloadButton: {
    type: Boolean,
    default: true,
  },
  showViewDialog: {
    type: Boolean,
    default: true,
  },
  showDownloadInDialog: {
    type: Boolean,
    default: true,
  },

  // Dialog
  dialogTitle: {
    type: String,
    default: "Captured Photo",
  },

  // Camera settings
  videoConstraints: {
    type: Object,
    default: () => ({ width: 640, height: 480 }),
  },

  // Auto emit
  autoEmitOnCapture: {
    type: Boolean,
    default: true,
  },

  // Filename
  filenamePrefix: {
    type: String,
    default: "photo",
  },
});

// Emits
const emit = defineEmits([
  "image-captured",
  "camera-opened",
  "camera-closed",
  "image-downloaded",
  "error",
]);

const $q = useQuasar();

// State
const isOpen = ref(false);
const videoElement = ref(null);
const capturedImage = ref(null);
const stream = ref(null);
const resultDialog = ref(false);

// Computed classes
const cameraWrapperClass = computed(() => {
  const baseClass = "camera-wrapper";
  return `${baseClass} ${baseClass}--${props.mode}`;
});

const cameraContentClass = computed(() => {
  return `camera-content camera-content--${props.mode}`;
});

const videoClass = computed(() => {
  return `camera-video camera-video--${props.mode}`;
});

const imageClass = computed(() => {
  return `camera-image camera-image--${props.mode}`;
});

const controlsClass = computed(() => {
  return `camera-controls camera-controls--${props.mode}`;
});

// Methods
const toggleCamera = () => {
  if (isOpen.value) {
    closeCamera();
  } else {
    openCamera();
  }
};

const openCamera = async () => {
  try {
    isOpen.value = true;
    capturedImage.value = null;

    // Wait for DOM update
    await new Promise((resolve) => setTimeout(resolve, 100));

    stream.value = await navigator.mediaDevices.getUserMedia({
      video: props.videoConstraints,
    });

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
    }

    emit("camera-opened");

    console.log("Camera opened successfully");
  } catch (error) {
    console.error("Error accessing camera:", error);
    isOpen.value = false;

    const errorMessage = "Cannot access camera. Please check permissions.";
    emit("error", error);

    console.log(errorMessage);
  }
};

const closeCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }
  isOpen.value = false;
  capturedImage.value = null;
  resultDialog.value = false;

  emit("camera-closed");
};

const capturePhoto = () => {
  if (!videoElement.value) return;

  const canvas = document.createElement("canvas");
  canvas.width = videoElement.value.videoWidth;
  canvas.height = videoElement.value.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(videoElement.value, 0, 0);

  const imageDataUrl = canvas.toDataURL("image/png");
  capturedImage.value = imageDataUrl;

  // Stop stream after capture
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }

  // Create image data object
  const imageData = {
    dataUrl: imageDataUrl,
    blob: null,
    filename: `${props.filenamePrefix}_${new Date().getTime()}.png`,
  };

  // Convert to blob
  canvas.toBlob((blob) => {
    imageData.blob = blob;

    // Emit the captured image
    emit("image-captured", imageData);

    console.log("Photo captured successfully!");
  }, "image/png");
};

const retakePhoto = async () => {
  capturedImage.value = null;
  resultDialog.value = false;

  try {
    stream.value = await navigator.mediaDevices.getUserMedia({
      video: props.videoConstraints,
    });

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    emit("error", error);
  }
};

const retakeFromDialog = () => {
  resultDialog.value = false;
  retakePhoto();
};

const viewCapturedImage = () => {
  resultDialog.value = true;
};

const downloadImage = () => {
  if (!capturedImage.value) return;

  const link = document.createElement("a");
  const filename = `${props.filenamePrefix}_${new Date().getTime()}.png`;
  link.download = filename;
  link.href = capturedImage.value;
  link.click();

  emit("image-downloaded", {
    filename,
    dataUrl: capturedImage.value,
  });
  console.log("Photo downloaded successfully!");
};

// Expose methods for parent component
defineExpose({
  openCamera,
  closeCamera,
  capturePhoto,
  retakePhoto,
  downloadImage,
  isOpen: () => isOpen.value,
  hasCapturedImage: () => !!capturedImage.value,
  getCapturedImage: () => capturedImage.value,
});

// Cleanup
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }
});
</script>

<style scoped>
/* Base styles */
.camera-toggle-btn {
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 70%
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.camera-toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
}

/* Camera wrapper modes */
.camera-wrapper--corner {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  width: 320px;
  height: 240px;
}

.camera-wrapper--inline {
  display: inline-block;
  margin: 10px;
}

.camera-wrapper--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Camera content */
.camera-content {
  position: relative;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 15px 50px rgba(0, 0, 0, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
}

.camera-content--corner {
  width: 100%;
  height: 100%;
}

.camera-content--inline {
  width: 400px;
  height: 300px;
}

.camera-content--fullscreen {
  width: 80vw;
  height: 70vh;
  max-width: 800px;
  max-height: 600px;
}

/* Status indicator */
.status-indicator {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  padding: 6px;
  backdrop-filter: blur(10px);
}

/* Video and image */
.camera-video,
.camera-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 18px;
}

/* Controls */
.camera-controls {
  position: absolute;
  bottom: 15px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 10px;
}

.control-btn {
  background: linear-gradient(
    45deg,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0.2)
  );
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.control-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
}

/* Close button */
.camera-close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;
}

.camera-close-btn:hover {
  background: rgba(255, 0, 0, 0.7);
}

/* Result dialog */
.result-dialog {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 20px;
  overflow: hidden;
  min-width: 450px;
  max-width: 90vw;
}

.result-header {
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.result-content {
  padding: 25px;
}

.result-image-container {
  display: flex;
  justify-content: center;
  background: #000;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.result-image {
  width: 100%;
  max-width: 400px;
  height: auto;
  border-radius: 15px;
}

.result-actions {
  background: rgba(0, 0, 0, 0.2);
  padding: 20px;
}

.result-action-btn {
  min-width: 120px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* Responsive */
@media (max-width: 768px) {
  .camera-wrapper--corner {
    width: 240px;
    height: 180px;
    top: 10px;
    right: 10px;
  }

  .camera-content--inline {
    width: 90vw;
    height: 60vw;
  }

  .camera-content--fullscreen {
    width: 95vw;
    height: 80vh;
  }
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.camera-wrapper {
  animation: fadeInUp 0.3s ease-out;
}
</style>
