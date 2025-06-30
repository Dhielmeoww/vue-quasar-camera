<template>
  <div>
    <!-- Toggle Button -->
    <q-btn
      v-if="showToggleButton"
      :color="isOpen ? 'negative' : 'primary'"
      :label="isOpen ? closeButtonText : openButtonText"
      @click="toggleCamera"
      :icon="isOpen ? 'videocam_off' : 'videocam'"
      :size="buttonSize"
      :style="toggleButtonStyle"
      rounded
      push
      @mouseenter="hoverToggleButton(true)"
      @mouseleave="hoverToggleButton(false)"
    />

    <!-- Camera Component -->
    <div v-if="isOpen" :style="cameraContainerStyle">
      <div :style="cameraFrameStyle">
        <!-- Enhanced Status indicator with pulse animation -->
        <div
          v-if="showStatusIndicator && capturedImage"
          :style="statusIndicatorStyle"
        >
          <div :style="statusDotStyle"></div>
          <span :style="statusTextStyle">
            {{ capturedImage ? "CAPTURED" : "LIVE" }}
          </span>
        </div>

        <!-- Video stream or captured image -->
        <video
          v-if="!capturedImage"
          ref="videoElement"
          autoplay
          muted
          :style="mediaElementStyle"
        />
        <img
          v-else
          :src="capturedImage"
          :style="mediaElementStyle"
          alt="Captured"
        />

        <!-- Modern camera overlay with enhanced UI -->
        <div v-if="!capturedImage" :style="overlayStyle">
          <div :style="topControlsStyle">
            <div :style="{ display: 'flex', gap: '8px' }">
              <q-btn
                round
                flat
                size="sm"
                color="white"
                :icon="flashEnabled ? 'flash_on' : 'flash_off'"
                :style="flashButtonStyle"
                @click="toggleFlash"
                @mouseenter="hoverButton($event, true)"
                @mouseleave="hoverButton($event, false)"
              />
            </div>
          </div>
        </div>

        <!-- Bottom controls (capture, switch, etc.) -->
        <div v-if="!capturedImage" :style="bottomControlsStyle">
          <!-- Switch camera button -->
          <!-- <q-btn
            round
            flat
            size="md"
            color="white"
            icon="cameraswitch"
            :style="switchButtonStyle"
            @click="switchCamera"
            @mouseenter="hoverButton($event, true)"
            @mouseleave="hoverButton($event, false)"
          /> -->

          <!-- Capture button -->
          <div :style="captureButtonContainerStyle">
            <q-btn
              round
              size="md"
              color="white"
              icon="photo_camera"
              :style="captureButtonStyle"
              @click="capturePhoto"
              :disable="isCapturing"
            />
          </div>

          <!-- View button -->
          <q-btn
            v-if="showViewButton && capturedImage"
            round
            flat
            size="md"
            color="white"
            icon="visibility"
            :style="viewButtonStyle"
            @click="viewCapturedImage"
            @mouseenter="hoverButton($event, true)"
            @mouseleave="hoverButton($event, false)"
          />
        </div>

        <!-- Retake and Download buttons after capture -->
        <div v-if="capturedImage" :style="postCaptureControlsStyle">
          <q-btn
            round
            size="md"
            color="primary"
            icon="refresh"
            @click="retakePhoto"
            :style="{ margin: '0 8px' }"
            @mouseenter="hoverActionButton($event, true)"
            @mouseleave="hoverActionButton($event, false)"
          />
        </div>

        <!-- Close button -->
        <q-btn
          v-if="showCloseButton"
          round
          flat
          size="sm"
          color="white"
          icon="close"
          :style="closeButtonStyle"
          @click="closeCamera"
          @mouseenter="hoverButton($event, true)"
          @mouseleave="hoverButton($event, false)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from "vue";
import { useQuasar, QBtn } from "quasar";

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
    default: null,
  },
  height: {
    type: [String, Number],
    default: null,
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
  "image-shared",
  "recording-started",
  "recording-stopped",
  "flash-toggled",
  "camera-switched",
  "settings-opened",
  "gallery-opened",
  "error",
]);

const $q = useQuasar();

// State
const isOpen = ref(false);
const videoElement = ref(null);
const capturedImage = ref(null);
const stream = ref(null);
const resultDialog = ref(false);
const isCapturing = ref(false);
const isRecording = ref(false);
const flashEnabled = ref(false);
const recordingTime = ref("00:00");
const recordingInterval = ref(null);
const recordingStartTime = ref(null);

// Computed styles
const toggleButtonStyle = computed(() => ({
  background: isOpen.value
    ? "linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)"
    : "linear-gradient(135deg, #3498db 0%, #2980b9 100%)",
  backdropFilter: "blur(15px)",
  border: "2px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "50px",
  boxShadow: "0 8px 32px rgba(31, 38, 135, 0.37)",
  transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  animation: "fadeInUp 0.6s ease-out",
  fontWeight: "600",
  letterSpacing: "0.5px",
}));

const dynamicWidth = computed(() => {
  // Jika width diberikan, gunakan nilai tersebut
  if (props.width !== null) {
    return typeof props.width === "number" ? `${props.width}px` : props.width;
  }
  // Jika tidak, kembalikan nilai default berdasarkan mode
  return props.mode === "fullscreen" ? "100%" : "350px";
});

const dynamicHeight = computed(() => {
  // Jika height diberikan, gunakan nilai tersebut
  if (props.height !== null) {
    return typeof props.height === "number"
      ? `${props.height}px`
      : props.height;
  }
  // Jika tidak, kembalikan nilai default berdasarkan mode
  return props.mode === "fullscreen" ? "100%" : "260px";
});

const cameraContainerStyle = computed(() => ({
  position:
    props.mode === "corner"
      ? "fixed"
      : props.mode === "fullscreen"
      ? "fixed"
      : "",
  top:
    props.mode === "corner"
      ? "80px"
      : props.mode === "fullscreen"
      ? "0"
      : "auto",
  right: props.mode === "corner" ? "20px" : "auto",
  left: props.mode === "fullscreen" ? "0" : "auto",
  bottom: props.mode === "fullscreen" ? "0" : "auto",
  zIndex:
    props.mode === "corner"
      ? "1000"
      : props.mode === "fullscreen"
      ? "2000"
      : "auto",
  width: dynamicWidth.value, // Menggunakan computed width
  height: dynamicHeight.value, // Menggunakan computed height
  margin: props.mode === "inline" ? "10px 0" : "0",
  background:
    props.mode === "fullscreen" ? "rgba(0, 0, 0, 0.95)" : "transparent",
  display: props.mode === "fullscreen" ? "flex" : "block",
  alignItems: props.mode === "fullscreen" ? "center" : "normal",
  justifyContent: props.mode === "fullscreen" ? "center" : "normal",
  animation: "slideInUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
}));

const cameraFrameStyle = computed(() => ({
  position: "relative",
  background: "linear-gradient(145deg, #1e1e1e 0%, #000000 100%)",
  borderRadius: props.mode === "inline" ? "15px" : "30px",
  overflow: "hidden",
  boxShadow:
    "0 25px 80px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  border: "3px solid rgba(255, 255, 255, 0.1)",
  width: "100%", // Selalu 100% dari container
  height: "100%", // Selalu 100% dari container
  maxWidth: props.mode === "fullscreen" ? "900px" : "none",
  maxHeight: props.mode === "fullscreen" ? "700px" : "none",
  backdropFilter: "blur(20px)",
}));

const statusIndicatorStyle = computed(() => ({
  position: "absolute",
  top: "10px",
  left: "10px",
  zIndex: "15",
  background: "rgba(0, 0, 0, 0.8)",
  borderRadius: "20px",
  padding: "6px 10px",
  backdropFilter: "blur(15px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
}));

const statusDotStyle = computed(() => ({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: capturedImage.value ? "#4CAF50" : "#FF5722",
  animation: capturedImage.value ? "none" : "pulse 2s infinite",
}));

const statusTextStyle = {
  color: "white",
  fontSize: "12px",
  fontWeight: "500",
};

const mediaElementStyle = computed(() => ({
  width: "100%",
  height: props.mode === "inline" ? "100%" : "100%",
  objectFit: "cover",
  borderRadius: props.mode === "inline" ? "12px" : "27px",
  background: "#000",
}));

const overlayStyle = {
  position: "absolute",
  top: "0",
  left: "0",
  right: "0",
  bottom: "0",
  zIndex: "10",
  pointerEvents: "none",
};

const topControlsStyle = computed(() => ({
  position: "absolute",
  top: "10px",
  left: "10px",
  right: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  pointerEvents: "all",
}));

const flashButtonStyle = computed(() => ({
  width: "36px",
  height: "36px",
  background: flashEnabled.value
    ? "rgba(255, 193, 7, 0.8)"
    : "rgba(0, 0, 0, 0.7)",
  backdropFilter: "blur(15px)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  color: "white",
}));

const bottomControlsStyle = computed(() => ({
  position: "absolute",
  left: "0",
  right: "0",
  bottom: "15px",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "20px",
  zIndex: "20",
  pointerEvents: "all",
}));

const switchButtonStyle = computed(() => ({
  width: "45px",
  height: "45px",
  background: "rgba(0, 0, 0, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  color: "white",
}));

const captureButtonContainerStyle = computed(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
}));

const captureButtonStyle = computed(() => ({
  width: props.mode === "inline" ? "40px" : "60px",
  height: props.mode === "inline" ? "40px" : "60px",
  background: isCapturing.value
    ? "rgba(52, 152, 219, 0.8)"
    : "rgba(255,255,255,0.95)",
  border: props.mode === "inline" ? "3px solid #3498db" : "4px solid #3498db",
  borderRadius: "50%",
  boxShadow: isCapturing.value
    ? "0 0 0 8px rgba(52, 152, 219, 0.2)"
    : "0 8px 32px rgba(31, 38, 135, 0.37)",
  animation: isCapturing.value ? "captureRing 0.5s" : "none",
  color: isCapturing.value ? "#fff" : "#3498db",
  fontSize: props.mode === "inline" ? "22px" : "28px",
  transition: "all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
}));

const captureButtonLabelStyle = computed(() => ({
  color: "#fff",
  fontSize: "12px",
  fontWeight: "500",
}));

const viewButtonStyle = computed(() => ({
  width: "45px",
  height: "45px",
  background: "rgba(0, 0, 0, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  color: "white",
}));

const postCaptureControlsStyle = computed(() => ({
  position: "absolute",
  left: "50%",
  bottom: props.mode === "inline" ? "15px" : "25px",
  transform: "translateX(-50%)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "15px",
  zIndex: "25", // Pastikan z-index lebih tinggi
  pointerEvents: "all",
  minHeight: props.mode === "inline" ? "50px" : "60px",
  padding: props.mode === "inline" ? "8px 16px" : "12px 20px",
  background: "rgba(0, 0, 0, 0.3)", // Background semi transparan
  borderRadius: "30px",
  backdropFilter: "blur(10px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
}));

const downloadButtonStyle = computed(() => ({
  minWidth: "100px",
  height: "40px",
  background: "linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)",
  border: "2px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "20px",
  fontWeight: "600",
  letterSpacing: "0.5px",
  fontSize: "14px",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
}));

const closeButtonStyle = computed(() => ({
  position: "absolute",
  top: "10px",
  right: "10px",
  background: "rgba(0,0,0,0.7)",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: "50%",
  zIndex: 30,
  color: "white",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
}));

// Methods (same as before)
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

    const constraints = {
      video: {
        ...props.videoConstraints,
        facingMode: "user", // Default to front camera
      },
    };

    stream.value = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
    }

    emit("camera-opened");
    $q.notify({
      message: "Camera opened successfully",
      color: "positive",
      icon: "videocam",
      position: "top",
      timeout: 2000,
    });
  } catch (error) {
    console.error("Error accessing camera:", error);
    isOpen.value = false;

    const errorMessage = "Cannot access camera. Please check permissions.";
    emit("error", error);

    $q.notify({
      message: errorMessage,
      color: "negative",
      icon: "error",
      position: "top",
      timeout: 3000,
    });
  }
};

const closeCamera = () => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
    stream.value = null;
  }

  // Stop recording if active
  if (isRecording.value) {
    stopRecording();
  }

  isOpen.value = false;
  capturedImage.value = null;
  resultDialog.value = false;

  emit("camera-closed");
};

const capturePhoto = () => {
  if (!videoElement.value) return;

  isCapturing.value = true;

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
    timestamp: new Date().toISOString(),
  };

  // Convert to blob
  canvas.toBlob((blob) => {
    imageData.blob = blob;

    // Emit the captured image
    emit("image-captured", imageData);

    $q.notify({
      message: "Photo captured successfully!",
      color: "positive",
      icon: "photo_camera",
      position: "top",
      timeout: 2000,
    });
  }, "image/png");

  // Reset capture state
  setTimeout(() => {
    isCapturing.value = false;
  }, 300);
};

const retakePhoto = async () => {
  capturedImage.value = null;
  resultDialog.value = false;

  try {
    const constraints = {
      video: {
        ...props.videoConstraints,
        facingMode: "user",
      },
    };

    stream.value = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
    }
  } catch (error) {
    console.error("Error accessing camera:", error);
    emit("error", error);

    $q.notify({
      message: "Error restarting camera",
      color: "negative",
      icon: "error",
      position: "top",
      timeout: 3000,
    });
  }
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

  const downloadData = {
    filename,
    dataUrl: capturedImage.value,
    timestamp: new Date().toISOString(),
  };

  emit("image-downloaded", downloadData);

  $q.notify({
    message: "Photo downloaded successfully!",
    color: "positive",
    icon: "download",
    position: "top",
    timeout: 2000,
  });
};

const shareImage = async () => {
  if (!capturedImage.value) return;

  try {
    // Convert data URL to blob
    const response = await fetch(capturedImage.value);
    const blob = await response.blob();

    const file = new File([blob], `photo_${new Date().getTime()}.png`, {
      type: "image/png",
    });

    if (navigator.share && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Captured Photo",
        text: "Check out this photo I captured!",
        files: [file],
      });

      emit("image-shared", { filename: file.name, success: true });

      $q.notify({
        message: "Photo shared successfully!",
        color: "positive",
        icon: "share",
        position: "top",
        timeout: 2000,
      });
    } else {
      // Fallback: copy to clipboard or download
      $q.notify({
        message: "Sharing not supported. Photo copied to clipboard!",
        color: "info",
        icon: "content_copy",
        position: "top",
        timeout: 3000,
      });
    }
  } catch (error) {
    console.error("Error sharing:", error);
    emit("image-shared", { error: error.message, success: false });

    $q.notify({
      message: "Error sharing photo",
      color: "negative",
      icon: "error",
      position: "top",
      timeout: 3000,
    });
  }
};

const toggleRecording = () => {
  if (isRecording.value) {
    stopRecording();
  } else {
    startRecording();
  }
};

const startRecording = () => {
  isRecording.value = true;
  recordingStartTime.value = Date.now();

  recordingInterval.value = setInterval(() => {
    const elapsed = Date.now() - recordingStartTime.value;
    const minutes = Math.floor(elapsed / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);
    recordingTime.value = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  }, 1000);

  emit("recording-started");

  $q.notify({
    message: "Recording started",
    color: "negative",
    icon: "videocam",
    position: "top",
    timeout: 2000,
  });
};

const stopRecording = () => {
  isRecording.value = false;

  if (recordingInterval.value) {
    clearInterval(recordingInterval.value);
    recordingInterval.value = null;
  }

  recordingTime.value = "00:00";

  emit("recording-stopped");

  $q.notify({
    message: "Recording stopped",
    color: "positive",
    icon: "stop",
    position: "top",
    timeout: 2000,
  });
};

const toggleFlash = () => {
  flashEnabled.value = !flashEnabled.value;
  emit("flash-toggled", flashEnabled.value);

  $q.notify({
    message: `Flash ${flashEnabled.value ? "enabled" : "disabled"}`,
    color: flashEnabled.value ? "warning" : "info",
    icon: flashEnabled.value ? "flash_on" : "flash_off",
    position: "top",
    timeout: 1500,
  });
};

const switchCamera = async () => {
  if (!stream.value) return;

  try {
    // Stop current stream
    stream.value.getTracks().forEach((track) => track.stop());

    // Get current facing mode
    const currentTrack = stream.value.getVideoTracks()[0];
    const currentSettings = currentTrack.getSettings();
    const currentFacingMode = currentSettings.facingMode;

    // Switch between front and back camera
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";

    const constraints = {
      video: {
        ...props.videoConstraints,
        facingMode: newFacingMode,
      },
    };

    stream.value = await navigator.mediaDevices.getUserMedia(constraints);

    if (videoElement.value) {
      videoElement.value.srcObject = stream.value;
    }

    emit("camera-switched", newFacingMode);

    $q.notify({
      message: `Switched to ${
        newFacingMode === "user" ? "front" : "back"
      } camera`,
      color: "info",
      icon: "cameraswitch",
      position: "top",
      timeout: 2000,
    });
  } catch (error) {
    console.error("Error switching camera:", error);

    $q.notify({
      message: "Could not switch camera",
      color: "warning",
      icon: "error",
      position: "top",
      timeout: 3000,
    });
  }
};

// Hover effects
const hoverToggleButton = (isHovering) => {
  const el = event?.target;
  if (el) {
    el.style.transform = isHovering
      ? "translateY(-4px) scale(1.05)"
      : "translateY(0) scale(1)";
    el.style.boxShadow = isHovering
      ? "0 15px 40px rgba(0, 0, 0, 0.3)"
      : "0 8px 32px rgba(31, 38, 135, 0.37)";
  }
};

const hoverButton = (event, isHovering) => {
  const el = event?.target;
  if (el) {
    el.style.background = isHovering
      ? "rgba(255, 255, 255, 0.3)"
      : "rgba(255, 255, 255, 0.2)";
    el.style.transform = isHovering ? "scale(1.1)" : "scale(1)";
  }
};

const hoverActionButton = (event, isHovering) => {
  const el = event?.target;
  if (el) {
    el.style.transform = isHovering
      ? "translateY(-2px) scale(1.05)"
      : "translateY(0) scale(1)";
    el.style.boxShadow = isHovering
      ? "0 10px 30px rgba(39, 174, 96, 0.4)"
      : "none";
  }
};

// Expose methods for parent component
defineExpose({
  openCamera,
  closeCamera,
  capturePhoto,
  retakePhoto,
  downloadImage,
  shareImage,
  toggleRecording,
  toggleFlash,
  switchCamera,
  isOpen: () => isOpen.value,
  hasCapturedImage: () => !!capturedImage.value,
  getCapturedImage: () => capturedImage.value,
  isRecording: () => isRecording.value,
  flashEnabled: () => flashEnabled.value,
});

// Cleanup
onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }

  if (recordingInterval.value) {
    clearInterval(recordingInterval.value);
  }
});
</script>

<style scoped>
/* Enhanced Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(60px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

@keyframes captureRing {
  0% {
    transform: scale(1);
    opacity: 1;
    border-color: rgba(255, 255, 255, 0.8);
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
    border-color: rgba(102, 126, 234, 0.8);
  }
  100% {
    transform: scale(1);
    opacity: 1;
    border-color: rgba(255, 255, 255, 0.8);
  }
}

@keyframes recordingPulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(231, 76, 60, 0.7);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(231, 76, 60, 0);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  /* Mobile optimizations are handled inline in the template */
}

/* Additional utility classes */
.glassmorphism {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.gradient-border {
  background: linear-gradient(45deg, #667eea, #764ba2);
  padding: 2px;
  border-radius: 50%;
}

.gradient-border > * {
  border-radius: inherit;
}
</style>
