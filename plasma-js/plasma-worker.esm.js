/**
 * Copyright (c) 2022, Justin Seyster
 * All rights reserved.
 * Redistribution and use in source and binary forms, with or without modification, are permitted
 * provided that the following conditions are met:
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions
 * and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of
 * conditions and the following disclaimer in the documentation and/or other materials provided with
 * the distribution.
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR
 * IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
 * FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY
 * WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * This worker computes the frame data for a random plasma fractal in a background thread and
 * responds with a bitmap object.
 */

const kInitialDisplacementMax = 0.75;
const kDisplacementAttenuation = 0.5;

function computePlasma(imageData, initialDisplacementMax, displacementAttenuation) {
    const cornerHeights = Array.from({length: 4}, () => Math.random());
    subdivide(imageData,
              [0, 0],
              [imageData.width, imageData.height],
              cornerHeights,
              initialDisplacementMax,
              displacementAttenuation);
}

/**
 * Compute a random height map by starting with a rectangle that has height values assigned to its
 * corners and recursively subdividing into quadrants. At each recursive step, the height values for
 * the new corners are interpolated from the corners of the input rectangle, except for the midpoint
 * (the vertex shared by all four sub-rectangles), which is displaced by a random amount.
 *
 * The maximum magnitude of the displacement is reduced at each level of recursion by the
 * 'displacementAttenuation' factor.
 *
 * At the base case, rectangles are small enough to provide heights for each pixel. The height
 * values are mapped to color values and drawn to the 'imageData' bitmap.
 *
 * The 4 values in 'cornerHeights' start with the top-left corner and proceed clockwise around the
 * rectangle.
 */
function subdivide(
    imageData, [x, y], [width, height], cornerHeights, displacementMax, displacementAttenuation) {
    const halfWidth = width / 2;
    const halfHeight = height / 2;

    // When the rectangle is small enough that corners occupy adjacent pixels, we have hit the base
    // case. Color the pixels that each corner resides in according to the corner's height and then
    // terminate the recursion.
    if (width <= 2.0 && height <= 2.0) {
        for (let [i, heightValue] of cornerHeights.entries()) {
            drawPixel(imageData, chooseCorner(x, y, 1, 1, i), heightValue);
        }
        return;
    }

    const averageHeight =
        cornerHeights.reduce((sum, height) => sum + height) / cornerHeights.length;
    const edgeHeights =
        Array.from(cornerHeights,
                   (height, i) => ((height + cornerHeights[(i + 1) % cornerHeights.length]) / 2));

    // Choose the midpoint height as the average of the corner heights displaced up or down a random
    // amount and then clamped to the range [0, 1]. Clamping is not necessary for a good result, but
    // it's a choice made in the original Java implementation that we are staying faithful to here.
    const displacement = chooseRandomDisplacement(displacementMax);
    const midpointHeight = [0, averageHeight + displacement, 1].sort((a, b) => a - b)[1];

    // Recursively map the four quadrants.
    for (let [i, height] of cornerHeights.entries()) {
        // The heights of the 'i'th sub-rectangle include the height of the 'i'th corner from the
        // parent rectangle, the average heights (i.e., their heights at their respective midpoints)
        // of the two edges connected to that corner, and the height at the midpoint of the parent
        // rectangle (which has been displaced by a random amount).
        let subRectangleHeights = [height, edgeHeights[i], midpointHeight, edgeHeights.at(i - 1)];

        // "Rotate" the sub-rectangle's corners so that the top-left corner is at index 0.
        subRectangleHeights =
            subRectangleHeights.slice(-i).concat(subRectangleHeights.slice(0, -i));

        subdivide(imageData,
                  chooseCorner(x, y, halfWidth, halfHeight, i),
                  [halfWidth, halfHeight],
                  subRectangleHeights,
                  displacementAttenuation * displacementMax,
                  displacementAttenuation);
    }
}

/**
 * Return the coordinates of the 'i'th corner of the input rectangle, where 'i' starts with 0 at the
 * top-left corner and proceeds clockwise.
 */
function chooseCorner(x, y, width, height, i) {
    return [x + (((i + 1) % 4 < 2) ? 0 : width), y + ((i % 4 < 2) ? 0 : height)];
}

/**
 * Return a random value from the uniform distribution with range [-max, max).
 */
function chooseRandomDisplacement(max) {
    return 2 * max * (Math.random() - 0.5);
}

function drawPixel(imageData, [x, y], height) {
    const colorValues = colorForHeight(height);
    const pixelIndex = 4 * (Math.floor(y) * imageData.width + Math.floor(x));
    for (let [i, value] of colorValues.entries()) {
        imageData.data[pixelIndex + i] = value;
    }
}

/**
 * Map a height in the range [0, 1] to a color using a separate scale for each color component. The
 * scales were chosen experimentally to look cool in the opinion of the author. The alpha component
 * is always the maximum.
 */
function colorForHeight(height) {
    return [
        2.0 * (height < 0.5 ? height : 1.0 - height), // Red
        2.0 * (height < 0.3   ? 0.3 - height          // Green
               : height < 0.8 ? height - 0.3
                              : 1.3 - height),
        2.0 * (height < 0.5 ? 0.5 - height : height - 0.5), // Blue
        1.0,                                                // Alpha
    ].map(component => [0, Math.floor(256 * component), 256].sort((a, b) => a - b)[1]);
}

async function respondWithPlasmaImage(width, height, startTime) {
    const imageData = new ImageData(width, height);
    computePlasma(imageData, kInitialDisplacementMax, kDisplacementAttenuation);
    const bitmap = await createImageBitmap(imageData);
    postMessage({imageReady: bitmap, startTime: startTime}, [bitmap])
}

addEventListener("message", e => {
    if (e.data.computePlasmaImageData) {
        respondWithPlasmaImage(e.data.width, e.data.height, e.data.startTime);
    }
});
