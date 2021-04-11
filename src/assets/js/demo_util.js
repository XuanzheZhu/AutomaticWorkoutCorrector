/**
 * @license
 * Copyright 2019 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */
import * as posenet from '@tensorflow-models/posenet';
import * as tf from '@tensorflow/tfjs-core';

const COLOR = 'aqua';
const BOUNDING_BOX_COLOR = 'red';
const LINE_WIDTH = 2;

export const TRY_RESNET_BUTTON_NAME = 'tryResNetButton';
export const TRY_RESNET_BUTTON_TEXT = '[New] Try ResNet50';
const TRY_RESNET_BUTTON_TEXT_CSS = 'width:100%;text-decoration:underline;';
const TRY_RESNET_BUTTON_BACKGROUND_CSS = 'background:#e61d5f;';

function isAndroid() {
  return /Android/i.test(navigator.userAgent);
}

function isiOS() {
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMobile() {
  return isAndroid() || isiOS();
}

function setDatGuiPropertyCss(propertyText, liCssString, spanCssString = '') {
  var spans = document.getElementsByClassName('property-name');
  for (var i = 0; i < spans.length; i++) {
    var text = spans[i].textContent || spans[i].innerText;
    if (text == propertyText) {
      spans[i].parentNode.parentNode.style = liCssString;
      if (spanCssString !== '') {
        spans[i].style = spanCssString;
      }
    }
  }
}

export function updateTryResNetButtonDatGuiCss() {
  setDatGuiPropertyCss(
      TRY_RESNET_BUTTON_TEXT, TRY_RESNET_BUTTON_BACKGROUND_CSS,
      TRY_RESNET_BUTTON_TEXT_CSS);
}

/**
 * Toggles between the loading UI and the main canvas UI.
 */
export function toggleLoadingUI(
    showLoadingUI, loadingDivId = 'loading', mainDivId = 'main') {
  if (showLoadingUI) {
    document.getElementById(loadingDivId).style.display = 'block';
    document.getElementById(mainDivId).style.display = 'none';
  } else {
    document.getElementById(loadingDivId).style.display = 'none';
    document.getElementById(mainDivId).style.display = 'block';
  }
}

export function drawPoint(ctx, y, x, r, color) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();
}

/**
 * Draws a line on a canvas, i.e. a joint
 */
export function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
  ctx.beginPath();
  ctx.moveTo(ax * scale, ay * scale);
  ctx.lineTo(bx * scale, by * scale);
  ctx.lineWidth = LINE_WIDTH;
  ctx.strokeStyle = color;
  ctx.stroke();
}

/**
 * Draws a pose skeleton by looking up all adjacent keypoints/joints
 */
export function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
  const adjacentKeyPoints =
      posenet.getAdjacentKeyPoints(keypoints, minConfidence);

  function toTuple({y, x}) {
    return [y, x];
  }

  adjacentKeyPoints.forEach((keypoints) => {
    drawSegment(
        toTuple(keypoints[0].position), toTuple(keypoints[1].position), COLOR,
        scale, ctx);
  });
}

/**
 * Draw pose keypoints onto a canvas
 */
export function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
  for (let i = 0; i < keypoints.length; i++) {
    const keypoint = keypoints[i];

    if (keypoint.score < minConfidence) {
      continue;
    }

    const {y, x} = keypoint.position;
    drawPoint(ctx, y * scale, x * scale, 3, COLOR);
  }
}

function calAngle(x1, y1, xc, yc, x2, y2) {
  //console.log({x1, y1, x2, y2, xc, yc});
  let vector1X = x1 - xc;
  let vector1Y = y1 - yc;
  let vector2X = x2 - xc;
  let vector2Y = y2 - yc;
  let dotProduct = vector1X * vector2X + vector1Y * vector2Y;
  let length1 = Math.sqrt(vector1X * vector1X + vector1Y * vector1Y);
  let length2 = Math.sqrt(vector2X * vector2X + vector2Y * vector2Y);
  let cosAngle = dotProduct / (length1 * length2);
  return Math.acos(cosAngle) * (180 / Math.PI);
}

function checkSideLift(keypoints, angles) {
  let xLeftShoulder = keypoints[5].position.x;
  let yLeftShoulder = keypoints[5].position.y;
  let xRightShoulder = keypoints[6].position.x;
  let yRightShoulder = keypoints[6].position.y;
  let xLeftElbow = keypoints[7].position.x;
  let yLeftElbow = keypoints[7].position.y;
  let xRightElbow = keypoints[8].position.x;
  let yRightElbow = keypoints[8].position.y;

  let leftAngle = calAngle(xLeftElbow, yLeftElbow, xLeftShoulder, yLeftShoulder, xRightShoulder, yRightShoulder);
  let rightAngle = calAngle(xLeftShoulder, yLeftShoulder, xRightShoulder, yRightShoulder, xRightElbow, yRightElbow);

  let maxLeft = -1;
  let maxRight = -1;
  if (leftAngle > 120 && rightAngle > 120) {
    angles.leftArmAngles.push(leftAngle);
    angles.rightArmAngles.push(rightAngle);
  }
  else {
    if (angles.leftArmAngles.length > 8) {
      for (let i = 0; i < angles.rightArmAngles.length - 2; ++i) {
        angles.leftArmAngles[i] = (angles.leftArmAngles[i] + angles.leftArmAngles[i + 1] + angles.leftArmAngles[i + 2]) / 3;
        angles.rightArmAngles[i] = (angles.rightArmAngles[i] + angles.rightArmAngles[i + 1] + angles.rightArmAngles[i + 2]) / 3;
        if (angles.leftArmAngles[i] > maxLeft) {
          maxLeft = angles.leftArmAngles[i];
        }
        if (angles.rightArmAngles[i] > maxRight) {
          maxRight = angles.rightArmAngles[i];
        }
      }
      ++angles.sideLiftCount;
      document.getElementById("sideLiftCount").textContent=angles.sideLiftCount.toString();
    }
    angles.leftArmAngles = [];
    angles.rightArmAngles = [];
  }
  if (maxLeft > 0 && maxRight > 0) {
    if (maxLeft < 165 && maxRight < 165) {
      document.getElementById("poseFeedback").textContent="Please Raise Your Arms Higher!";
      document.getElementById("BothArmsHigherAudio").play();
    }
    else if (maxLeft < 165) {
      document.getElementById("poseFeedback").textContent="Please Raise Your Left Arm Higher!";
      document.getElementById("LeftArmHigherAudio").play();
    }
    else if (maxRight < 165) {
      document.getElementById("poseFeedback").textContent="Please Raise Your Right Arm Higher!";
      document.getElementById("RightArmHigherAudio").play();
    }
    else {
      document.getElementById("poseFeedback").textContent="Well Done!";
      document.getElementById("WellDoneAudio").play();
    }
  }
}

function checkSquat(keypoints, angles) {
  let xLeftHip = keypoints[11].position.x;
  let yLeftHip = keypoints[11].position.y;
  let xRightHip = keypoints[12].position.x;
  let yRightHip = keypoints[12].position.y;
  let xLeftKnee = keypoints[13].position.x;
  let yLeftKnee = keypoints[13].position.y;
  let xRightKnee = keypoints[14].position.x;
  let yRightKnee = keypoints[14].position.y;

  let leftKneeAngle = calAngle(xLeftHip, yLeftHip, xLeftKnee, yLeftKnee, xLeftHip, yLeftKnee);
  let rightKneeAngle = calAngle(xRightHip, yRightHip, xRightKnee, yRightKnee, xRightHip, yRightKnee);

  let minLeft = 180;
  let minRight = 180;

  if (leftKneeAngle < 30 || rightKneeAngle < 30) {
    if (xLeftKnee > xLeftHip) {
      ++angles.perspective;
    }
    else if (xRightKnee < xRightHip) {
      --angles.perspective;
    }
  }

  let nowPerspective = 0;
  if (leftKneeAngle < 60 || rightKneeAngle < 60) {
    angles.leftKneeAngles.push(leftKneeAngle);
    angles.rightKneeAngles.push(rightKneeAngle);
  }
  else {
    if (angles.leftKneeAngles.length > 8) {
      for (let i = 0; i < angles.leftKneeAngles.length - 2; i++) {
        angles.leftKneeAngles[i] = (angles.leftKneeAngles[i] + angles.leftKneeAngles[i + 1] + angles.leftKneeAngles[i + 2]) / 3;
        angles.rightKneeAngles[i] = (angles.rightKneeAngles[i] + angles.rightKneeAngles[i + 1] + angles.rightKneeAngles[i + 2]) / 3;
        if (angles.leftKneeAngles[i] < minLeft) {
          minLeft = angles.leftKneeAngles[i];
        }
        if (angles.rightKneeAngles[i] < minRight) {
          minRight = angles.rightKneeAngles[i];
        }
      }
      nowPerspective = angles.perspective;
      ++angles.squatCount;
      document.getElementById("squatCount").textContent=angles.squatCount.toString();
    }
    angles.leftKneeAngles = [];
    angles.rightKneeAngles = [];
    angles.perspective = 0;
  }

  if (minLeft < 180 || minRight < 180) {
    console.log(angles.perspective);
    if (nowPerspective > 0) {
      if (minLeft < 15) {
        document.getElementById("poseFeedback").textContent="Left: Well Done!";
        document.getElementById("WellDoneAudio").play();
      }
      else {
        document.getElementById("poseFeedback").textContent="Left: Please Squat Deeper!";
      document.getElementById("SquatDeeperAudio").play();
      }
    }
    else {
      if (minRight < 15) {
        document.getElementById("poseFeedback").textContent="Right: Well Done!";
        document.getElementById("WellDoneAudio").play();
      }
      else {
        document.getElementById("poseFeedback").textContent="Right: Please Squat Deeper!";
      document.getElementById("SquatDeeperAudio").play();
      }
    }
  }
}

export function checkPoses(keypoints, angles, poseType) {
  if (poseType == 0) {
    checkSideLift(keypoints, angles);
  }
  else if (poseType == 1) {
    checkSquat(keypoints, angles);
  }
}

/**
 * Draw the bounding box of a pose. For example, for a whole person standing
 * in an image, the bounding box will begin at the nose and extend to one of
 * ankles
 */
export function drawBoundingBox(keypoints, ctx) {
  const boundingBox = posenet.getBoundingBox(keypoints);

  ctx.rect(
      boundingBox.minX, boundingBox.minY, boundingBox.maxX - boundingBox.minX,
      boundingBox.maxY - boundingBox.minY);

  ctx.strokeStyle = boundingBoxColor;
  ctx.stroke();
}

/**
 * Converts an array of pixel data into an ImageData object
 */
export async function renderToCanvas(a, ctx) {
  const [height, width] = a.shape;
  const imageData = new ImageData(width, height);

  const data = await a.data();

  for (let i = 0; i < height * width; ++i) {
    const j = i * 4;
    const k = i * 3;

    imageData.data[j + 0] = data[k + 0];
    imageData.data[j + 1] = data[k + 1];
    imageData.data[j + 2] = data[k + 2];
    imageData.data[j + 3] = 255;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Draw an image on a canvas
 */
export function renderImageToCanvas(image, size, canvas) {
  canvas.width = size[0];
  canvas.height = size[1];
  const ctx = canvas.getContext('2d');

  ctx.drawImage(image, 0, 0);
}

/**
 * Draw heatmap values, one of the model outputs, on to the canvas
 * Read our blog post for a description of PoseNet's heatmap outputs
 * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
 */
export function drawHeatMapValues(heatMapValues, outputStride, canvas) {
  const ctx = canvas.getContext('2d');
  const radius = 5;
  const scaledValues = heatMapValues.mul(tf.scalar(outputStride, 'int32'));

  drawPoints(ctx, scaledValues, radius, COLOR);
}

/**
 * Used by the drawHeatMapValues method to draw heatmap points on to
 * the canvas
 */
function drawPoints(ctx, points, radius, color) {
  const data = points.buffer().values;

  for (let i = 0; i < data.length; i += 2) {
    const pointY = data[i];
    const pointX = data[i + 1];

    if (pointX !== 0 && pointY !== 0) {
      ctx.beginPath();
      ctx.arc(pointX, pointY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
    }
  }
}

/**
 * Draw offset vector values, one of the model outputs, on to the canvas
 * Read our blog post for a description of PoseNet's offset vector outputs
 * https://medium.com/tensorflow/real-time-human-pose-estimation-in-the-browser-with-tensorflow-js-7dd0bc881cd5
 */
export function drawOffsetVectors(
    heatMapValues, offsets, outputStride, scale = 1, ctx) {
  const offsetPoints =
      posenet.singlePose.getOffsetPoints(heatMapValues, outputStride, offsets);

  const heatmapData = heatMapValues.buffer().values;
  const offsetPointsData = offsetPoints.buffer().values;

  for (let i = 0; i < heatmapData.length; i += 2) {
    const heatmapY = heatmapData[i] * outputStride;
    const heatmapX = heatmapData[i + 1] * outputStride;
    const offsetPointY = offsetPointsData[i];
    const offsetPointX = offsetPointsData[i + 1];

    drawSegment(
        [heatmapY, heatmapX], [offsetPointY, offsetPointX], COLOR, scale, ctx);
  }
}
