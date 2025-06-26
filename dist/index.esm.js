import { ref, computed, onUnmounted, resolveComponent, resolveDirective, openBlock, createElementBlock, createCommentVNode, createBlock, normalizeClass, createElementVNode, createVNode, withCtx, createTextVNode, toDisplayString, withDirectives } from 'vue';
import { useQuasar } from 'quasar';

const _hoisted_1 = {
  key: 0,
  class: "status-indicator"
};
const _hoisted_2 = ["src"];
const _hoisted_3 = { class: "row items-center" };
const _hoisted_4 = { class: "col" };
const _hoisted_5 = { class: "text-h6 text-primary" };
const _hoisted_6 = { class: "result-image-container" };
const _hoisted_7 = ["src"];
const _hoisted_8 = { class: "row justify-center q-gutter-md full-width" };

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
},
  emits: [
  "image-captured",
  "camera-opened",
  "camera-closed",
  "image-downloaded",
  "error",
],
  setup(__props, { expose: __expose, emit: __emit }) {

const props = __props;

// Emits
const emit = __emit;

useQuasar();

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
__expose({
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

return (_ctx, _cache) => {
  const _component_q_btn = resolveComponent("q-btn");
  const _component_q_icon = resolveComponent("q-icon");
  const _component_q_tooltip = resolveComponent("q-tooltip");
  const _component_q_card_section = resolveComponent("q-card-section");
  const _component_q_card_actions = resolveComponent("q-card-actions");
  const _component_q_card = resolveComponent("q-card");
  const _component_q_dialog = resolveComponent("q-dialog");
  const _directive_close_popup = resolveDirective("close-popup");

  return (openBlock(), createElementBlock("div", null, [
    createCommentVNode(" Toggle Button "),
    (__props.showToggleButton)
      ? (openBlock(), createBlock(_component_q_btn, {
          key: 0,
          color: isOpen.value ? 'negative' : 'secondary',
          label: isOpen.value ? __props.closeButtonText : __props.openButtonText,
          onClick: toggleCamera,
          icon: isOpen.value ? 'videocam_off' : 'videocam',
          size: __props.buttonSize,
          class: "camera-toggle-btn",
          rounded: "",
          push: ""
        }, null, 8 /* PROPS */, ["color", "label", "icon", "size"]))
      : createCommentVNode("v-if", true),
    createCommentVNode(" Camera Component "),
    (isOpen.value)
      ? (openBlock(), createElementBlock("div", {
          key: 1,
          class: normalizeClass(cameraWrapperClass.value)
        }, [
          createElementVNode("div", {
            class: normalizeClass(cameraContentClass.value)
          }, [
            createCommentVNode(" Status indicator "),
            (__props.showStatusIndicator)
              ? (openBlock(), createElementBlock("div", _hoisted_1, [
                  createVNode(_component_q_icon, {
                    name: capturedImage.value ? 'check_circle' : 'videocam',
                    color: capturedImage.value ? 'positive' : 'primary',
                    size: "sm"
                  }, null, 8 /* PROPS */, ["name", "color"])
                ]))
              : createCommentVNode("v-if", true),
            createCommentVNode(" Video stream or captured image "),
            (!capturedImage.value)
              ? (openBlock(), createElementBlock("video", {
                  key: 1,
                  ref_key: "videoElement",
                  ref: videoElement,
                  autoplay: "",
                  muted: "",
                  class: normalizeClass(videoClass.value)
                }, null, 2 /* CLASS */))
              : (openBlock(), createElementBlock("img", {
                  key: 2,
                  src: capturedImage.value,
                  class: normalizeClass(imageClass.value),
                  alt: "Captured"
                }, null, 10 /* CLASS, PROPS */, _hoisted_2)),
            createCommentVNode(" Controls "),
            createElementVNode("div", {
              class: normalizeClass(controlsClass.value)
            }, [
              (!capturedImage.value)
                ? (openBlock(), createBlock(_component_q_btn, {
                    key: 0,
                    size: "md",
                    round: "",
                    color: "primary",
                    icon: "camera",
                    onClick: capturePhoto,
                    class: "control-btn",
                    push: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_q_tooltip, { class: "bg-primary" }, {
                        default: withCtx(() => _cache[1] || (_cache[1] = [
                          createTextVNode("Capture")
                        ])),
                        _: 1 /* STABLE */,
                        __: [1]
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : createCommentVNode("v-if", true),
              (capturedImage.value && __props.showViewButton)
                ? (openBlock(), createBlock(_component_q_btn, {
                    key: 1,
                    size: "md",
                    round: "",
                    color: "positive",
                    icon: "visibility",
                    onClick: viewCapturedImage,
                    class: "control-btn",
                    push: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_q_tooltip, { class: "bg-positive" }, {
                        default: withCtx(() => _cache[2] || (_cache[2] = [
                          createTextVNode("View")
                        ])),
                        _: 1 /* STABLE */,
                        __: [2]
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : createCommentVNode("v-if", true),
              (capturedImage.value && __props.showRetakeButton)
                ? (openBlock(), createBlock(_component_q_btn, {
                    key: 2,
                    size: "md",
                    round: "",
                    color: "secondary",
                    icon: "refresh",
                    onClick: retakePhoto,
                    class: "control-btn",
                    push: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_q_tooltip, { class: "bg-secondary" }, {
                        default: withCtx(() => _cache[3] || (_cache[3] = [
                          createTextVNode("Retake")
                        ])),
                        _: 1 /* STABLE */,
                        __: [3]
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : createCommentVNode("v-if", true),
              (capturedImage.value && __props.showDownloadButton)
                ? (openBlock(), createBlock(_component_q_btn, {
                    key: 3,
                    size: "md",
                    round: "",
                    color: "accent",
                    icon: "download",
                    onClick: downloadImage,
                    class: "control-btn",
                    push: ""
                  }, {
                    default: withCtx(() => [
                      createVNode(_component_q_tooltip, { class: "bg-accent" }, {
                        default: withCtx(() => _cache[4] || (_cache[4] = [
                          createTextVNode("Download")
                        ])),
                        _: 1 /* STABLE */,
                        __: [4]
                      })
                    ]),
                    _: 1 /* STABLE */
                  }))
                : createCommentVNode("v-if", true)
            ], 2 /* CLASS */),
            createCommentVNode(" Close button "),
            (__props.showCloseButton)
              ? (openBlock(), createBlock(_component_q_btn, {
                  key: 3,
                  class: "camera-close-btn",
                  size: "sm",
                  round: "",
                  flat: "",
                  color: "white",
                  icon: "close",
                  onClick: closeCamera
                }))
              : createCommentVNode("v-if", true)
          ], 2 /* CLASS */)
        ], 2 /* CLASS */))
      : createCommentVNode("v-if", true),
    createCommentVNode(" Result Dialog "),
    (__props.showViewDialog)
      ? (openBlock(), createBlock(_component_q_dialog, {
          key: 2,
          modelValue: resultDialog.value,
          "onUpdate:modelValue": _cache[0] || (_cache[0] = $event => ((resultDialog).value = $event))
        }, {
          default: withCtx(() => [
            createVNode(_component_q_card, { class: "result-dialog" }, {
              default: withCtx(() => [
                createVNode(_component_q_card_section, { class: "result-header" }, {
                  default: withCtx(() => [
                    createElementVNode("div", _hoisted_3, [
                      createElementVNode("div", _hoisted_4, [
                        createElementVNode("div", _hoisted_5, [
                          createVNode(_component_q_icon, {
                            name: "photo",
                            class: "q-mr-sm"
                          }),
                          createTextVNode(" " + toDisplayString(__props.dialogTitle), 1 /* TEXT */)
                        ])
                      ]),
                      withDirectives(createVNode(_component_q_btn, {
                        icon: "close",
                        flat: "",
                        round: "",
                        dense: ""
                      }, null, 512 /* NEED_PATCH */), [
                        [_directive_close_popup]
                      ])
                    ])
                  ]),
                  _: 1 /* STABLE */
                }),
                createVNode(_component_q_card_section, { class: "result-content" }, {
                  default: withCtx(() => [
                    createElementVNode("div", _hoisted_6, [
                      (capturedImage.value)
                        ? (openBlock(), createElementBlock("img", {
                            key: 0,
                            src: capturedImage.value,
                            class: "result-image",
                            alt: "Result"
                          }, null, 8 /* PROPS */, _hoisted_7))
                        : createCommentVNode("v-if", true)
                    ])
                  ]),
                  _: 1 /* STABLE */
                }),
                createVNode(_component_q_card_actions, { class: "result-actions" }, {
                  default: withCtx(() => [
                    createElementVNode("div", _hoisted_8, [
                      (__props.showDownloadInDialog)
                        ? (openBlock(), createBlock(_component_q_btn, {
                            key: 0,
                            color: "positive",
                            label: "Download",
                            onClick: downloadImage,
                            icon: "download",
                            class: "result-action-btn",
                            rounded: "",
                            push: ""
                          }))
                        : createCommentVNode("v-if", true),
                      createVNode(_component_q_btn, {
                        color: "secondary",
                        label: "Retake",
                        onClick: retakeFromDialog,
                        icon: "refresh",
                        class: "result-action-btn",
                        rounded: "",
                        push: ""
                      })
                    ])
                  ]),
                  _: 1 /* STABLE */
                })
              ]),
              _: 1 /* STABLE */
            })
          ]),
          _: 1 /* STABLE */
        }, 8 /* PROPS */, ["modelValue"]))
      : createCommentVNode("v-if", true)
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

export { script as QuasarCamera, index as default };
