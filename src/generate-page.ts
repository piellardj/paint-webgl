import * as fse from "fs-extra";
import * as path from "path";
import { Demopage } from "webpage-templates";

const data = {
    title: "Paint",
    description: "Interactive paint simulation",
    introduction: [
        "This project is a WebGL simulation of a dynamic painting running entirely on GPU. Each paint stroke is moving along an invisible vector field. You can interact with it using the left mouse button."
    ],
    githubProjectName: "paint-webgl",
    readme: {
        filepath: path.join(__dirname, "..", "README.md"),
        branchName: "master"
    },
    additionalLinks: [],
    scriptFiles: [
        "script/gl-utils.js",
        "script/sampler2D.js",
        "script/background.js",
        "script/flowmap.js",
        "script/particles.js",
        "script/scene.js",
        "script/parameters.js",
        "script/main.js"
    ],
    indicators: [
        {
            id: "fps",
            label: "Frames per second"
        },
        {
            id: "number-of-particles",
            label: "Number of particles"
        }
    ],
    canvas: {
        width: 1280,
        height: 720,
        enableFullscreen: false
    },
    controlsSections: [
        {
            title: "Paint",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Amount",
                    id: "amount-range-id",
                    min: 0,
                    max: 4,
                    value: 2,
                    step: 1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Stroke size",
                    id: "size-range-id",
                    min: 0.5,
                    max: 5,
                    value: 2,
                    step: 0.1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Speed",
                    id: "speed-range-id",
                    min: 0.1,
                    max: 2.9,
                    value: 1.5,
                    step: 0.1
                },
                {
                    type: Demopage.supportedControls.Range,
                    title: "Resilience",
                    id: "resilience-range-id",
                    min: 0,
                    max: 0.05,
                    value: 0.01,
                    step: 0.0001
                }
            ]
        },
        {
            title: "Interactions",
            controls: [
                {
                    type: Demopage.supportedControls.Range,
                    title: "Brush radius",
                    id: "brush-size-range-id",
                    min: 5,
                    max: 100,
                    value: 85,
                    step: 0.1
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show brush",
                    id: "show-brush-checkbox-id",
                    checked: true
                }
            ]
        },
        {
            title: "Display",
            controls: [
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Background",
                    id: "show-background-checkbox-id",
                    checked: false
                },
                {
                    type: Demopage.supportedControls.Checkbox,
                    title: "Show indicators",
                    id: "indicators-checkbox-id",
                    checked: true
                }
            ]
        }
    ]
};

const SRC_DIR = path.resolve(__dirname);
const DEST_DIR = path.resolve(__dirname, "..", "docs");
const minified = true;

Demopage.build(data, DEST_DIR, {
    debug: !minified,
});

fse.copySync(path.resolve(SRC_DIR, "rc"), path.resolve(DEST_DIR, "rc"));
fse.copySync(path.resolve(SRC_DIR, "script"), path.resolve(DEST_DIR, "script"));
