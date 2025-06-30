'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var vue = require('vue');
var quasar = require('quasar');

const _hoisted_1 = ["src"];
const _hoisted_2 = { style: { display: 'flex', gap: '8px' } };

// Props

var script = {
  __name: 'QuasarCamera',
  props: {
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
},
  emits: [
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
],
  setup(__props, { expose: __expose, emit: __emit }) {

const props = __props;

// Emits
const emit = __emit;

const $q = quasar.useQuasar();

// State
const isOpen = vue.ref(false);
const videoElement = vue.ref(null);
const capturedImage = vue.ref(null);
const stream = vue.ref(null);
const resultDialog = vue.ref(false);
const isCapturing = vue.ref(false);
const isRecording = vue.ref(false);
const flashEnabled = vue.ref(false);
const recordingTime = vue.ref("00:00");
const recordingInterval = vue.ref(null);
const recordingStartTime = vue.ref(null);

// Computed styles
const toggleButtonStyle = vue.computed(() => ({
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

const dynamicWidth = vue.computed(() => {
  // Jika width diberikan, gunakan nilai tersebut
  if (props.width !== null) {
    return typeof props.width === "number" ? `${props.width}px` : props.width;
  }
  // Jika tidak, kembalikan nilai default berdasarkan mode
  return props.mode === "fullscreen" ? "100%" : "350px";
});

const dynamicHeight = vue.computed(() => {
  // Jika height diberikan, gunakan nilai tersebut
  if (props.height !== null) {
    return typeof props.height === "number"
      ? `${props.height}px`
      : props.height;
  }
  // Jika tidak, kembalikan nilai default berdasarkan mode
  return props.mode === "fullscreen" ? "100%" : "260px";
});

const cameraContainerStyle = vue.computed(() => ({
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

const cameraFrameStyle = vue.computed(() => ({
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

const statusIndicatorStyle = vue.computed(() => ({
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

const statusDotStyle = vue.computed(() => ({
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

const mediaElementStyle = vue.computed(() => ({
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

const topControlsStyle = vue.computed(() => ({
  position: "absolute",
  top: "10px",
  left: "10px",
  right: "10px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  pointerEvents: "all",
}));

const flashButtonStyle = vue.computed(() => ({
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

const bottomControlsStyle = vue.computed(() => ({
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

vue.computed(() => ({
  width: "45px",
  height: "45px",
  background: "rgba(0, 0, 0, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  color: "white",
}));

const captureButtonContainerStyle = vue.computed(() => ({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "6px",
}));

const captureButtonStyle = vue.computed(() => ({
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

vue.computed(() => ({
  color: "#fff",
  fontSize: "12px",
  fontWeight: "500",
}));

const viewButtonStyle = vue.computed(() => ({
  width: "45px",
  height: "45px",
  background: "rgba(0, 0, 0, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  borderRadius: "50%",
  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  color: "white",
}));

const postCaptureControlsStyle = vue.computed(() => ({
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

vue.computed(() => ({
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

const closeButtonStyle = vue.computed(() => ({
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
__expose({
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
vue.onUnmounted(() => {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop());
  }

  if (recordingInterval.value) {
    clearInterval(recordingInterval.value);
  }
});

return (_ctx, _cache) => {
  return (vue.openBlock(), vue.createElementBlock("div", null, [
    vue.createCommentVNode(" Toggle Button "),
    (__props.showToggleButton)
      ? (vue.openBlock(), vue.createBlock(vue.unref(quasar.QBtn), {
          key: 0,
          color: isOpen.value ? 'negative' : 'primary',
          label: isOpen.value ? __props.closeButtonText : __props.openButtonText,
          onClick: toggleCamera,
          icon: isOpen.value ? 'videocam_off' : 'videocam',
          size: __props.buttonSize,
          style: vue.normalizeStyle(toggleButtonStyle.value),
          rounded: "",
          push: "",
          onMouseenter: _cache[0] || (_cache[0] = $event => (hoverToggleButton(true))),
          onMouseleave: _cache[1] || (_cache[1] = $event => (hoverToggleButton(false)))
        }, null, 8 /* PROPS */, ["color", "label", "icon", "size", "style"]))
      : vue.createCommentVNode("v-if", true),
    vue.createCommentVNode(" Camera Component "),
    (isOpen.value)
      ? (vue.openBlock(), vue.createElementBlock("div", {
          key: 1,
          style: vue.normalizeStyle(cameraContainerStyle.value)
        }, [
          vue.createElementVNode("div", {
            style: vue.normalizeStyle(cameraFrameStyle.value)
          }, [
            vue.createCommentVNode(" Enhanced Status indicator with pulse animation "),
            (__props.showStatusIndicator && capturedImage.value)
              ? (vue.openBlock(), vue.createElementBlock("div", {
                  key: 0,
                  style: vue.normalizeStyle(statusIndicatorStyle.value)
                }, [
                  vue.createElementVNode("div", {
                    style: vue.normalizeStyle(statusDotStyle.value)
                  }, null, 4 /* STYLE */),
                  vue.createElementVNode("span", { style: statusTextStyle }, vue.toDisplayString(capturedImage.value ? "CAPTURED" : "LIVE"), 1 /* TEXT */)
                ], 4 /* STYLE */))
              : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" Video stream or captured image "),
            (!capturedImage.value)
              ? (vue.openBlock(), vue.createElementBlock("video", {
                  key: 1,
                  ref_key: "videoElement",
                  ref: videoElement,
                  autoplay: "",
                  muted: "",
                  style: vue.normalizeStyle(mediaElementStyle.value)
                }, null, 4 /* STYLE */))
              : (vue.openBlock(), vue.createElementBlock("img", {
                  key: 2,
                  src: capturedImage.value,
                  style: vue.normalizeStyle(mediaElementStyle.value),
                  alt: "Captured"
                }, null, 12 /* STYLE, PROPS */, _hoisted_1)),
            vue.createCommentVNode(" Modern camera overlay with enhanced UI "),
            (!capturedImage.value)
              ? (vue.openBlock(), vue.createElementBlock("div", {
                  key: 3,
                  style: overlayStyle
                }, [
                  vue.createElementVNode("div", {
                    style: vue.normalizeStyle(topControlsStyle.value)
                  }, [
                    vue.createElementVNode("div", _hoisted_2, [
                      vue.createVNode(vue.unref(quasar.QBtn), {
                        round: "",
                        flat: "",
                        size: "sm",
                        color: "white",
                        icon: flashEnabled.value ? 'flash_on' : 'flash_off',
                        style: vue.normalizeStyle(flashButtonStyle.value),
                        onClick: toggleFlash,
                        onMouseenter: _cache[2] || (_cache[2] = $event => (hoverButton($event, true))),
                        onMouseleave: _cache[3] || (_cache[3] = $event => (hoverButton($event, false)))
                      }, null, 8 /* PROPS */, ["icon", "style"])
                    ])
                  ], 4 /* STYLE */)
                ]))
              : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" Bottom controls (capture, switch, etc.) "),
            (!capturedImage.value)
              ? (vue.openBlock(), vue.createElementBlock("div", {
                  key: 4,
                  style: vue.normalizeStyle(bottomControlsStyle.value)
                }, [
                  vue.createCommentVNode(" Switch camera button "),
                  vue.createCommentVNode(" <q-btn\r\n            round\r\n            flat\r\n            size=\"md\"\r\n            color=\"white\"\r\n            icon=\"cameraswitch\"\r\n            :style=\"switchButtonStyle\"\r\n            @click=\"switchCamera\"\r\n            @mouseenter=\"hoverButton($event, true)\"\r\n            @mouseleave=\"hoverButton($event, false)\"\r\n          /> "),
                  vue.createCommentVNode(" Capture button "),
                  vue.createElementVNode("div", {
                    style: vue.normalizeStyle(captureButtonContainerStyle.value)
                  }, [
                    vue.createVNode(vue.unref(quasar.QBtn), {
                      round: "",
                      size: "md",
                      color: "white",
                      icon: "photo_camera",
                      style: vue.normalizeStyle(captureButtonStyle.value),
                      onClick: capturePhoto,
                      disable: isCapturing.value
                    }, null, 8 /* PROPS */, ["style", "disable"])
                  ], 4 /* STYLE */),
                  vue.createCommentVNode(" View button "),
                  (__props.showViewButton && capturedImage.value)
                    ? (vue.openBlock(), vue.createBlock(vue.unref(quasar.QBtn), {
                        key: 0,
                        round: "",
                        flat: "",
                        size: "md",
                        color: "white",
                        icon: "visibility",
                        style: vue.normalizeStyle(viewButtonStyle.value),
                        onClick: viewCapturedImage,
                        onMouseenter: _cache[4] || (_cache[4] = $event => (hoverButton($event, true))),
                        onMouseleave: _cache[5] || (_cache[5] = $event => (hoverButton($event, false)))
                      }, null, 8 /* PROPS */, ["style"]))
                    : vue.createCommentVNode("v-if", true)
                ], 4 /* STYLE */))
              : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" Retake and Download buttons after capture "),
            (capturedImage.value)
              ? (vue.openBlock(), vue.createElementBlock("div", {
                  key: 5,
                  style: vue.normalizeStyle(postCaptureControlsStyle.value)
                }, [
                  vue.createVNode(vue.unref(quasar.QBtn), {
                    round: "",
                    size: "md",
                    color: "primary",
                    icon: "refresh",
                    onClick: retakePhoto,
                    style: { margin: '0 8px' },
                    onMouseenter: _cache[6] || (_cache[6] = $event => (hoverActionButton($event, true))),
                    onMouseleave: _cache[7] || (_cache[7] = $event => (hoverActionButton($event, false)))
                  })
                ], 4 /* STYLE */))
              : vue.createCommentVNode("v-if", true),
            vue.createCommentVNode(" Close button "),
            (__props.showCloseButton)
              ? (vue.openBlock(), vue.createBlock(vue.unref(quasar.QBtn), {
                  key: 6,
                  round: "",
                  flat: "",
                  size: "sm",
                  color: "white",
                  icon: "close",
                  style: vue.normalizeStyle(closeButtonStyle.value),
                  onClick: closeCamera,
                  onMouseenter: _cache[8] || (_cache[8] = $event => (hoverButton($event, true))),
                  onMouseleave: _cache[9] || (_cache[9] = $event => (hoverButton($event, false)))
                }, null, 8 /* PROPS */, ["style"]))
              : vue.createCommentVNode("v-if", true)
          ], 4 /* STYLE */)
        ], 4 /* STYLE */))
      : vue.createCommentVNode("v-if", true)
  ]))
}
}

};

script.__scopeId = "data-v-296ba788";
script.__file = "src/components/QuasarCamera.vue";

// Install function for Vue.use()
const install = (app) => {
    app.component('QuasarCamera', script);
};
var index = { install };

// Auto-install when used as script tag
if (typeof window !== 'undefined' && window.Vue) {
    install(window.Vue);
}

exports.QuasarCamera = script;
exports.default = index;
