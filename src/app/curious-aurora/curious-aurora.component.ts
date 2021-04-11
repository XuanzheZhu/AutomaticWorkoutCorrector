import { Component, OnInit } from '@angular/core';
import * as bodyPix from '@tensorflow-models/body-pix';
import { BodyPixArchitecture, BodyPixMultiplier, BodyPixOutputStride, BodyPixQuantBytes } from '@tensorflow-models/body-pix/dist/types';
import { MatSnackBar, MatSnackBarRef } from '@angular/material/snack-bar';
import { now } from '@tensorflow/tfjs-core/dist/util';

import {drawKeypoints, drawSkeleton, checkPoses, toggleLoadingUI, TRY_RESNET_BUTTON_NAME, TRY_RESNET_BUTTON_TEXT, updateTryResNetButtonDatGuiCss} from './demo_util';
import * as partColorScales from './part_color_scales';

export interface countElement {
  workoutType: String;
  count: Number;
}

@Component({
  selector: 'app-curious-aurora',
  templateUrl: './curious-aurora.component.html',
  styleUrls: ['./curious-aurora.component.css']
})
export class CuriousAuroraComponent implements OnInit {

  public _snackBar: MatSnackBar;
  selectedWorkout = "None";

  displayedColumns: string[] = ["workoutType", "count"];
  workoutCounts: countElement[] = [
    {workoutType: "Side Lateral Raise", count: 0},
    {workoutType: "Squat", count: 0},
  ];

  constructor(_snackBar: MatSnackBar) { }

  ngOnInit(): void {
    // setupButtons();
    bindPage();
  }

  updateSelectedWorkout(event) {
    nowWorkout = event.value;
    if (nowWorkout == "sideLift") {
      //document.getElementById("poseType").textContent="Pose: Side Lift";
      document.getElementById("videoTest2").style.display = "none";
      document.getElementById("videoTest1").style.display = "flex";
    }
    else if (nowWorkout == "squat") {
      //document.getElementById("poseType").textContent="Pose: Squat";
      document.getElementById("videoTest1").style.display = "none";
      document.getElementById("videoTest2").style.display = "flex";
    }
    else {
      document.getElementById("videoTest1").style.display = "none";
      document.getElementById("videoTest2").style.display = "none";
    }
  }

  resetCounts() {
    angles.sideLiftCount = 0;
    angles.squatCount = 0;
    document.getElementById("sideLiftCount").textContent="0";
    document.getElementById("squatCount").textContent="0";
  }

  openSnackBar() {
    this._snackBar.open("Well Done", "Close", {
      duration: 2000,
    });
  }

}


var nowWorkout = "None";

const state = {
  video: null,
  stream: null,
  net: null,
  videoConstraints: {},
  // Triggers the TensorFlow model to reload
  changingArchitecture: false,
  changingMultiplier: false,
  changingStride: false,
  changingResolution: false,
  changingQuantBytes: false,
  changingCamera: false,
};

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isMobile() {
  return isAndroid() || isiOS();
}

async function getVideoInputs() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log('enumerateDevices() not supported.');
    return [];
  }

  const devices = await navigator.mediaDevices.enumerateDevices();

  const videoDevices = devices.filter(device => device.kind === 'videoinput');

  return videoDevices;
}

function stopExistingVideoCapture() {
  if (state.video && state.video.srcObject) {
    state.video.srcObject.getTracks().forEach(track => {
      track.stop();
    })
    state.video.srcObject = null;
  }
}

async function getDeviceIdForLabel(cameraLabel) {
  const videoInputs = await getVideoInputs();

  for (let i = 0; i < videoInputs.length; i++) {
    const videoInput = videoInputs[i];
    if (videoInput.label === cameraLabel) {
      return videoInput.deviceId;
    }
  }

  return null;
}

// on mobile, facing mode is the preferred way to select a camera.
// Here we use the camera label to determine if its the environment or
// user facing camera
function getFacingMode(cameraLabel) {
  if (!cameraLabel) {
    return 'user';
  }
  if (cameraLabel.toLowerCase().includes('back')) {
    return 'environment';
  } else {
    return 'user';
  }
}

async function getConstraints(cameraLabel) {
  let deviceId;
  let facingMode;

  if (cameraLabel) {
    deviceId = await getDeviceIdForLabel(cameraLabel);
    // on mobile, use the facing mode based on the camera.
    facingMode = isMobile() ? getFacingMode(cameraLabel) : null;
  };
  return {deviceId, facingMode};
}

/**
 * Loads a the camera to be used in the demo
 *
 */
async function setupCamera(cameraLabel) {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available');
  }

  const videoElement = document.getElementById('video') as HTMLVideoElement;

  stopExistingVideoCapture();

  const videoConstraints = await getConstraints(cameraLabel);

  const stream = await navigator.mediaDevices.getUserMedia(
      {'audio': false, 'video': videoConstraints});
  videoElement.srcObject = stream;

  return new Promise((resolve) => {
    videoElement.onloadedmetadata = () => {
      videoElement.width = videoElement.videoWidth;
      videoElement.height = videoElement.videoHeight;
      resolve(videoElement);
    };
  });
}

async function loadVideo(cameraLabel) {
  try {
    state.video = await setupCamera(cameraLabel);
  } catch (e) {
    let info = document.getElementById('info') as HTMLDivElement;
    info.textContent = 'this browser does not support video capture,' +
        'or this device does not have a camera';
    info.style.display = 'block';
    throw e;
  }

  state.video.play();
}

const defaultQuantBytes = 2;

const defaultMobileNetMultiplier = isMobile() ? 0.50 : 0.75;
const defaultMobileNetStride = 16;
const defaultMobileNetInternalResolution = 'medium';

const defaultResNetMultiplier = 1.0;
const defaultResNetStride = 16;
const defaultResNetInternalResolution = 'low';

const guiState = {
  algorithm: 'multi-person-instance',
  estimate: 'partmap',
  camera: null,
  flipHorizontal: true,
  input: {
    architecture: 'MobileNetV1',
    outputStride: 16,
    internalResolution: 'medium',
    multiplier: 0.75,
    quantBytes: 2
  },
  multiPersonDecoding: {
    maxDetections: 5,
    scoreThreshold: 0.3,
    nmsRadius: 20,
    numKeypointForMatching: 17,
    refineSteps: 10
  },
  segmentation: {
    segmentationThreshold: 0.7,
    effect: 'mask',
    maskBackground: true,
    opacity: 0.7,
    backgroundBlurAmount: 3,
    maskBlurAmount: 0,
    edgeBlurAmount: 3
  },
  partMap: {
    colorScale: 'rainbow',
    effect: 'partMap',
    segmentationThreshold: 0.5,
    opacity: 0.9,
    blurBodyPartAmount: 3,
    bodyPartEdgeBlurAmount: 3,
  },
  showFps: false // !isMobile()
};

function toCameraOptions(cameras) {
  const result = {default: null};

  cameras.forEach(camera => {
    result[camera.label] = camera.label;
  })

  return result;
}

function setShownPartColorScales(colorScale) {
  const colors = document.getElementById('colors') as HTMLUListElement;
  colors.innerHTML = '';

  const partColors = partColorScales[colorScale];
  const partNames = bodyPix.PART_CHANNELS;

  for (let i = 0; i < partColors.length; i++) {
    const partColor = partColors[i];
    const child = document.createElement('li');

    child.innerHTML = `
        <div class='color' style='background-color:rgb(${partColor[0]},${
        partColor[1]},${partColor[2]})' ></div>
        ${partNames[i]}`;

    colors.appendChild(child);
  }
}

/**
 * Sets up a frames per second panel on the top-left of the window
 
function setupFPS() {
  stats.showPanel(0);  // 0: fps, 1: ms, 2: mb, 3+: custom
  if (guiState.showFps) {
    document.body.appendChild(stats.dom);
  }
}
*/
async function estimateSegmentation() {
  let multiPersonSegmentation = null;
  switch (guiState.algorithm) {
    case 'multi-person-instance':
      return await state.net.segmentMultiPerson(state.video, {
        internalResolution: guiState.input.internalResolution,
        segmentationThreshold: guiState.segmentation.segmentationThreshold,
        maxDetections: guiState.multiPersonDecoding.maxDetections,
        scoreThreshold: guiState.multiPersonDecoding.scoreThreshold,
        nmsRadius: guiState.multiPersonDecoding.nmsRadius,
        numKeypointForMatching:
            guiState.multiPersonDecoding.numKeypointForMatching,
        refineSteps: guiState.multiPersonDecoding.refineSteps
      });
    case 'person':
      return await state.net.segmentPerson(state.video, {
        internalResolution: guiState.input.internalResolution,
        segmentationThreshold: guiState.segmentation.segmentationThreshold,
        maxDetections: guiState.multiPersonDecoding.maxDetections,
        scoreThreshold: guiState.multiPersonDecoding.scoreThreshold,
        nmsRadius: guiState.multiPersonDecoding.nmsRadius,
      });
    default:
      break;
  };
  return multiPersonSegmentation;
}

async function estimatePartSegmentation() {
  let multiPersonPartSegmentation = null; // luan xie de
  switch (guiState.algorithm) {
    case 'multi-person-instance':
      return await state.net.segmentMultiPersonParts(state.video, {
        internalResolution: guiState.input.internalResolution,
        segmentationThreshold: guiState.segmentation.segmentationThreshold,
        maxDetections: guiState.multiPersonDecoding.maxDetections,
        scoreThreshold: guiState.multiPersonDecoding.scoreThreshold,
        nmsRadius: guiState.multiPersonDecoding.nmsRadius,
        numKeypointForMatching:
            guiState.multiPersonDecoding.numKeypointForMatching,
        refineSteps: guiState.multiPersonDecoding.refineSteps
      });
    case 'person':
      return await state.net.segmentPersonParts(state.video, {
        internalResolution: guiState.input.internalResolution,
        segmentationThreshold: guiState.segmentation.segmentationThreshold,
        maxDetections: guiState.multiPersonDecoding.maxDetections,
        scoreThreshold: guiState.multiPersonDecoding.scoreThreshold,
        nmsRadius: guiState.multiPersonDecoding.nmsRadius,
      });
    default:
      break;
  };
  return multiPersonPartSegmentation;
}

var angles = {
  leftArmAngles: [],
  rightArmAngles: [],
  leftKneeAngles: [],
  rightKneeAngles: [],
  perspective: 0,
  sideLiftCount: 0,
  squatCount: 0
};

var poseType = 0; // 0 -> Side Lift; 1-> Squat
/*
function setupButtons() {
  const sideLiftButton = document.getElementById("sideLiftButton") as HTMLInputElement;
  const squatButton = document.getElementById("squatButton") as HTMLInputElement;
  const resetCountsButton = document.getElementById("resetCountsButton") as HTMLInputElement;

  sideLiftButton.addEventListener("click", chgPoseToSideLift);
  squatButton.addEventListener("click", chgPoseToSquat);
  resetCountsButton.addEventListener("click", resetCounts);

  function chgPoseToSideLift() {
    //poseType = 0;
    document.getElementById("poseType").textContent="Pose: Side Lift";
  }

  function chgPoseToSquat() {
    //poseType = 1;
    document.getElementById("poseType").textContent="Pose: Squat";
  }

  function resetCounts() {
    angles.sideLiftCount = 0;
    angles.squatCount = 0;
    document.getElementById("sideLiftCount").textContent="0";
    document.getElementById("squatCount").textContent="0";
  }
}*/

function drawPoses(personOrPersonPartSegmentation, flipHorizontally, ctx) {
  if (Array.isArray(personOrPersonPartSegmentation)) {
    personOrPersonPartSegmentation.forEach(personSegmentation => {
      let pose = personSegmentation.pose;
      if (flipHorizontally) {
        pose = bodyPix.flipPoseHorizontal(pose, personSegmentation.width);
      }
      drawKeypoints(pose.keypoints, 0.1, ctx);
      drawSkeleton(pose.keypoints, 0.1, ctx);
      //console.log(nowWorkout);
      checkPoses(pose.keypoints, angles, poseType, nowWorkout);
    });
  } else {
    personOrPersonPartSegmentation.allPoses.forEach(pose => {
      if (flipHorizontally) {
        pose = bodyPix.flipPoseHorizontal(
            pose, personOrPersonPartSegmentation.width);
      }
      drawKeypoints(pose.keypoints, 0.1, ctx);
      drawSkeleton(pose.keypoints, 0.1, ctx);
      //console.log(nowWorkout);
      checkPoses(pose.keypoints, angles, poseType, nowWorkout);
    })
  }
}

async function loadBodyPix() {
  toggleLoadingUI(true);
  state.net = await bodyPix.load({
    architecture: guiState.input.architecture as BodyPixArchitecture,
    outputStride: guiState.input.outputStride as BodyPixOutputStride,
    multiplier: guiState.input.multiplier as BodyPixMultiplier,
    quantBytes: guiState.input.quantBytes as BodyPixQuantBytes
  });
  toggleLoadingUI(false);
}

/**
 * Feeds an image to BodyPix to estimate segmentation - this is where the
 * magic happens. This function loops with a requestAnimationFrame method.
 */
function segmentBodyInRealTime() {
  const canvas = document.getElementById('output') as HTMLCanvasElement;
  // since images are being fed from a webcam

  async function bodySegmentationFrame() {
    // if changing the model or the camera, wait a second for it to complete
    // then try again.
    if (state.changingArchitecture || state.changingMultiplier ||
        state.changingCamera || state.changingStride ||
        state.changingQuantBytes) {
      console.log('load model...');
      loadBodyPix();
      state.changingArchitecture = false;
      state.changingMultiplier = false;
      state.changingStride = false;
      state.changingQuantBytes = false;
    }

    // Begin monitoring code for frames per second
    //stats.begin();

    const flipHorizontally = guiState.flipHorizontal;

    switch (guiState.estimate) {
      case 'segmentation':
        const multiPersonSegmentation = await estimateSegmentation();
        switch (guiState.segmentation.effect) {
          case 'mask':
            const ctx = canvas.getContext('2d');
            const foregroundColor = {r: 255, g: 255, b: 255, a: 255};
            const backgroundColor = {r: 0, g: 0, b: 0, a: 255};
            const mask = bodyPix.toMask(
                multiPersonSegmentation, foregroundColor, backgroundColor,
                true);

            bodyPix.drawMask(
                canvas, state.video, mask, guiState.segmentation.opacity,
                guiState.segmentation.maskBlurAmount, flipHorizontally);
            drawPoses(multiPersonSegmentation, flipHorizontally, ctx);
            break;
          case 'bokeh':
            bodyPix.drawBokehEffect(
                canvas, state.video, multiPersonSegmentation,
                +guiState.segmentation.backgroundBlurAmount,
                guiState.segmentation.edgeBlurAmount, flipHorizontally);
            break;
        }

        break;
      case 'partmap':
        const ctx = canvas.getContext('2d');
        const multiPersonPartSegmentation = await estimatePartSegmentation();
        const coloredPartImageData = bodyPix.toColoredPartMask(
            multiPersonPartSegmentation,
            partColorScales[guiState.partMap.colorScale]);

        const maskBlurAmount = 0;
        switch (guiState.partMap.effect) {
          case 'pixelation':
            const pixelCellWidth = 10.0;

            bodyPix.drawPixelatedMask(
                canvas, state.video, coloredPartImageData,
                guiState.partMap.opacity, maskBlurAmount, flipHorizontally,
                pixelCellWidth);
            break;
          case 'partMap':
            bodyPix.drawMask(
                canvas, state.video, coloredPartImageData, guiState.segmentation.opacity,
                maskBlurAmount, flipHorizontally);
            break;
          case 'blurBodyPart':
            const blurBodyPartIds = [0, 1];
            bodyPix.blurBodyPart(
                canvas, state.video, multiPersonPartSegmentation,
                blurBodyPartIds, guiState.partMap.blurBodyPartAmount,
                guiState.partMap.bodyPartEdgeBlurAmount, flipHorizontally);
        }
        drawPoses(multiPersonPartSegmentation, flipHorizontally, ctx);
        break;
      default:
        break;
    }

    // End monitoring code for frames per second
    //stats.end();

    requestAnimationFrame(bodySegmentationFrame);
  }

  bodySegmentationFrame();
}

/**
 * Kicks off the demo.
 */
export async function bindPage() {
  // Load the BodyPix model weights with architecture 0.75
  await loadBodyPix();
  document.getElementById('loading').style.display = 'none';
  document.getElementById('main').style.display = 'flex';

  await loadVideo(guiState.camera);

  let cameras = await getVideoInputs();

  //setupFPS();
  //setupGui(cameras);

  segmentBodyInRealTime();
}


navigator.getUserMedia = navigator.getUserMedia
//    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
// kick off the demo
//bindPage();
