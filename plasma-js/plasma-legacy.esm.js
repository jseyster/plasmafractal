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
 * The 'PlasmaFractal' class defines a Web Component that computes and displays a random plasma
 * fractal. Each time the user clicks, the image is recomputed with new random values.
 *
 * Embed this in a web page using the <plasma-fractal> tag, using the CSS 'width' and 'height'
 * properties to size the fractal image.
 */
class PlasmaFractal extends HTMLElement {
    constructor() {
        super();

        this.attachShadow({mode: "open"});

        const style = document.createElement("style");
        style.textContent = `
            :host {
                display: block;
            }

            canvas: {
                width: 100%,
                height: 100%;
            };`;
        this.shadowRoot.append(style);

        this.plasmaWorker = this.launchPlasmaWorker();

        this.canvas = document.createElement("canvas");
        this.shadowRoot.append(this.canvas);

        this.addEventListener("click", () => { this.drawPlasma(); });
        this.drawPlasma();
    }

    launchPlasmaWorker() {
        let worker;
        const workerUrl = new URL('./plasma-worker.esm.js', import.meta.url);
        try {
            worker = new Worker(workerUrl, {type: "module"});
        } catch {
            // This hack is necessary for sites that embed this module from another domain, such as
            // a CDN that serves JavaScript libraries.
            //
            // When this module is loaded across domains, then any sibling modules, including
            // 'plasma-worker.esm.js' are also considered cross-domain loads. That's a problem,
            // because as of writing (August 2022), Web Workers do not support launching a
            // cross-domain script.
            //
            // How are you supposed to use a Web Worker in a script that is intended to be used
            // across domains, then? Who knows?! This is JavaScript, not a language that in any way
            // efficiently uses the resources of the hardware it executes on, so why are we trying
            // to use multiple threads anyway (╯°□°)╯︵ ┻━┻?
            //
            // In an ideal world, we could define an entry function for the new worker directly in
            // this file. That is sort of possible in JavaScript, but only in the hackiest way
            // concievable: by creating a string with the function and converting it into a "data
            // url" that the new worker pretends to download. Be aware that there is not consensus
            // as to whether that's actually supported by the standards, but it does work on some
            // browsers (for now). Of the browsers tested, Firefox was the only one to enforce its
            // security policy on the data url (preventing this hack from working).
            //
            // This workaround creates a "trampoline" script that loads "plasma-worker.esm.js" from
            // the new worker's thread. For those of you keeping score at home, yes, the security
            // model prohibits a Web Worker's entry point from being a cross-domain script, but it
            // _allows_ a Web Worker to import a cross-domain script once it's running. That is how
            // we achieve security in the 21st century.
            //
            // If you are reading this, it's undoubtedly because browsers changed something that has
            // broken this workaround. My apologies. You can file a GitHub issue, and I'll see what
            // I can do. You probably want to host your own copies of these files, though, which is
            // permitted by the license.
            //
            // https://stackoverflow.com/questions/10343913/how-to-create-a-web-worker-from-a-string
            const crossOriginTrampoline = `importScripts("${workerUrl}");`;
            const dataUrl =
                (window.URL ? URL : webkitURL).createObjectURL(new Blob([crossOriginTrampoline]), {
                    type: 'application/javascript; charset=utf-8'
                });
            worker = new Worker(dataUrl /*, {type: "module"}*/);
        }

        worker.addEventListener("message", e => { this.handleWorkerResponse(e.data); });
        return worker;
    }

    drawPlasma() {
        this.plasmaWorker.postMessage({
            computePlasmaImageData: 1,
            width: this.clientWidth,
            height: this.clientHeight,
            startTime: Date.now()
        });
    }

    updateComputeTime(startTime, endTime) {
        this.setAttribute("title", `Computed in ${endTime - startTime}ms`)
    };

    handleWorkerResponse(response) {
        if (response.imageReady) {
            this.canvas.width = response.imageReady.width;
            this.canvas.height = response.imageReady.height;
            this.canvas.getContext("2d").drawImage(response.imageReady, 0, 0);
            this.updateComputeTime(response.startTime, Date.now());
        }
    }
}

customElements.define('plasma-fractal', PlasmaFractal);
