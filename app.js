//notes to self
//requierd packages

const path = require('path')
const express = require('express')
const fetch = require('node-fetch')
const React = require('react')
const ReactDOMServer = require('react-dom/server')
const { ServerStyleSheet } = require('styled-components')
require('dotenv').config();
//AI: "Enable Babel at runtime so Node can load .jsx view files with normal JSX syntax and fragments."
require("@babel/register")({
    extensions: [".jsx"],
    presets: [["@babel/preset-react", { runtime: "classic" }]]
});

//express server creation

const app = express();

//port num

const PORT = process.env.PORT || 3000;

//set template engine
//AI: "Register a custom Express view engine that server-renders React components from .jsx view files."
app.engine("jsx", (filePath, options, callback) => {
    const sheet = new ServerStyleSheet();

    try {
        //AI: "Clear the module cache so view edits show up without needing a full server restart."
        delete require.cache[require.resolve(filePath)];

        const viewModule = require(filePath);
        //AI: "Support either module.exports = Component or export default Component."
        const View = viewModule.default || viewModule;
        //AI: "Render the React view to plain HTML before sending it to the browser."
        const html = ReactDOMServer.renderToStaticMarkup(
            sheet.collectStyles(React.createElement(View, options))
        );
        const styleTags = sheet.getStyleTags();

        //AI: "Prepend the doctype so the browser parses the rendered markup as a full HTML document."
        callback(null, `<!DOCTYPE html>${html.replace("</head>", `${styleTags}</head>`)}`);
    } catch (error) {
        callback(error);
    } finally {
        sheet.seal();
    }
});

//AI: "Point Express at the views folder and make .jsx the default extension for res.render()."
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jsx");
app.use(express.static("public"));
app.use("/IMAGES", express.static(path.join(__dirname, "IMAGES")));

//needed to parse html data for POST request

app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());

const YOUTUBE_VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;
const RESULT_STATUS = {
    IDLE: "idle",
    SUCCESS: "success",
    ERROR: "error",
    PROCESSING: "processing"
};
const MAX_PROCESSING_RETRIES = 3;
const PROCESSING_RETRY_DELAY_MS = 2000;

function isSupportedYouTubeHost(hostname) {
    return hostname === "youtube.com" ||
        hostname.endsWith(".youtube.com") ||
        hostname === "youtube-nocookie.com" ||
        hostname.endsWith(".youtube-nocookie.com");
}

function extractVideoId(input) {
    if (typeof input !== "string") {
        return null;
    }

    const trimmedInput = input.trim();

    if (!trimmedInput) {
        return null;
    }

    if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmedInput)) {
        return trimmedInput;
    }

    let parsedUrl;

    try {
        parsedUrl = new URL(trimmedInput);
    } catch (error) {
        return null;
    }

    const normalizedHost = parsedUrl.hostname.replace(/^www\./, "").toLowerCase();

    if (normalizedHost === "youtu.be") {
        const shortLinkId = parsedUrl.pathname.split("/").filter(Boolean)[0];
        return YOUTUBE_VIDEO_ID_PATTERN.test(shortLinkId) ? shortLinkId : null;
    }

    if (isSupportedYouTubeHost(normalizedHost)) {
        const watchPageId = parsedUrl.searchParams.get("v");
        if (YOUTUBE_VIDEO_ID_PATTERN.test(watchPageId)) {
            return watchPageId;
        }

        const pathSegments = parsedUrl.pathname.split("/").filter(Boolean);
        const supportedPathTypes = new Set(["embed", "shorts", "live"]);

        if (supportedPathTypes.has(pathSegments[0]) && YOUTUBE_VIDEO_ID_PATTERN.test(pathSegments[1])) {
            return pathSegments[1];
        }
    }

    return null;
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function isProcessingResponse(fetchResponse) {
    return typeof fetchResponse?.status === "string" &&
        fetchResponse.status.toLowerCase() === RESULT_STATUS.PROCESSING;
}

async function requestMp3Conversion(videoId) {
    const fetchAPI = await fetch(`https://youtube-mp36.p.rapidapi.com/dl?id=${encodeURIComponent(videoId)}`, {
        method: "GET",
        headers: {
            "x-rapidapi-key": process.env.API_KEY,
            "x-rapidapi-host": process.env.API_HOST
        }
    });

    return fetchAPI.json();
}

async function requestMp3ConversionUntilReady(videoId) {
    let fetchResponse = null;

    for (let attempt = 0; attempt <= MAX_PROCESSING_RETRIES; attempt += 1) {
        fetchResponse = await requestMp3Conversion(videoId);

        if (!isProcessingResponse(fetchResponse)) {
            return fetchResponse;
        }

        if (attempt < MAX_PROCESSING_RETRIES) {
            await sleep(PROCESSING_RETRY_DELAY_MS);
        }
    }

    return fetchResponse;
}

function renderIndex(res, overrides = {}) {
    return res.render("index", {
        status: RESULT_STATUS.IDLE,
        songTitle: "",
        songLink: "",
        message: "",
        ...overrides
    });
}

//AI: "Render the page with default props so the React view has a stable shape on first load."
app.get("/", (req, res) => {
    renderIndex(res);
});

app.post("/convert-mp3", async (req, res) => {
    //AI: "Read the form field using videoId so it matches the React form input name."
    const videoInput = req.body.videoId;
    const normalizedInput = typeof videoInput === "string" ? videoInput.trim() : videoInput;
    const videoId = extractVideoId(videoInput);
    //AI: "Log the parsed body while debugging so you can confirm the POST payload is reaching Express."
    console.log(req.body);
    console.log(videoInput);
    console.log(videoId);

    if (
        normalizedInput === undefined ||
        normalizedInput === "" ||
        normalizedInput === null
    ) {
        //AI: "Send the same props shape back to the React view when validation fails so the error window can render safely."
        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: "Please enter a video link"
        });
    }

    if (!videoId) {
        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: "Please enter a valid YouTube URL or video ID"
        });
    }

    try {
        const fetchResponse = await requestMp3ConversionUntilReady(videoId);

        if (fetchResponse.status === "ok") {
            return renderIndex(res, {
                status: RESULT_STATUS.SUCCESS,
                songTitle: fetchResponse.title,
                songLink: fetchResponse.link
            });
        }

        if (isProcessingResponse(fetchResponse)) {
            return renderIndex(res, {
                status: RESULT_STATUS.PROCESSING,
                message: fetchResponse.msg || "The API is still processing this video. Please wait a few seconds and try again."
            });
        }

        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: fetchResponse.msg || "Could not convert that video"
        });
    } catch (error) {
        console.error(error);
        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: "The converter API could not be reached"
        });
    }

    // //AI: "Render the page again on a valid submit so the browser gets a complete response instead of hanging."
    // return res.render("index", {
    //     success: true,
    //     songTitle: `Received video: ${videoId}`,
    //     songLink: "#",
    //     errorMessage: ""
    // });
});
//close alert button functionality
app.post("/closeAlert", async (req, res) => {

    console.log(req.method)

    renderIndex(res);
})

//START SERVER

app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
})
