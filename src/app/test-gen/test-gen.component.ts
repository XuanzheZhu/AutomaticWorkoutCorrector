import { Component, OnInit } from '@angular/core';
import * as bodyPix from '@tensorflow-models/body-pix';

@Component({
  selector: 'app-test-gen',
  templateUrl: './test-gen.component.html',
  styleUrls: ['./test-gen.component.css']
})
export class TestGenComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  	const img = document.getElementById('image');
  	loadAndPredict();
  }

}

async function loadAndPredict() {
    const img = document.getElementById('image') as HTMLImageElement;
    const net = await bodyPix.load();
    const partSegmentation = await net.segmentMultiPersonParts(img);
    
    // The colored part image is an rgb image with a corresponding color from the
    // rainbow colors for each part at each pixel, and black pixels where there is
    // no part.
    const coloredPartImage = bodyPix.toColoredPartMask(partSegmentation);
    const opacity = 0.7;
    const flipHorizontal = false;
    const maskBlurAmount = 0;
    const canvas = document.getElementById('canvas') as HTMLCanvasElement;
    // Draw the colored part image on top of the original image onto a canvas.
    // The colored part image will be drawn semi-transparent, with an opacity of
    // 0.7, allowing for the original image to be visible under.
    bodyPix.drawMask(
        canvas, img, coloredPartImage, opacity, maskBlurAmount,
        flipHorizontal);
    console.log(partSegmentation);
}