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
const THEME_NAME = {
    ORIGINAL: "original",
    TOKYO_DARK: "tokyo-dark"
};
const PROCESSING_RETRY_DELAY_MS = 1000;
const REQUIRED_ENV_VARS = ["API_KEY", "API_HOST"];

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

function isProcessingResponse(fetchResponse) {
    return typeof fetchResponse?.status === "string" &&
        fetchResponse.status.toLowerCase() === RESULT_STATUS.PROCESSING;
}

function getMissingRequiredEnvVars() {
    return REQUIRED_ENV_VARS.filter((envVarName) => {
        const envValue = process.env[envVarName];

        return typeof envValue !== "string" || envValue.trim() === "";
    });
}

function normalizeThemeName(themeName) {
    return themeName === THEME_NAME.TOKYO_DARK
        ? THEME_NAME.TOKYO_DARK
        : THEME_NAME.ORIGINAL;
}

function getThemeNameFromRequest(req) {
    return normalizeThemeName(req.body?.theme || req.query?.theme);
}

function getNextThemeName(themeName) {
    return themeName === THEME_NAME.TOKYO_DARK
        ? THEME_NAME.ORIGINAL
        : THEME_NAME.TOKYO_DARK;
}

function normalizeResultStatus(status) {
    return Object.values(RESULT_STATUS).includes(status)
        ? status
        : RESULT_STATUS.IDLE;
}

function getIndexStateFromRequest(req) {
    return {
        status: normalizeResultStatus(req.body?.status),
        songTitle: typeof req.body?.songTitle === "string" ? req.body.songTitle : "",
        songLink: typeof req.body?.songLink === "string" ? req.body.songLink : "",
        message: typeof req.body?.message === "string" ? req.body.message : "",
        retryVideoId: typeof req.body?.retryVideoId === "string" ? req.body.retryVideoId : ""
    };
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

function renderIndex(res, overrides = {}) {
    return res.render("index", {
        status: RESULT_STATUS.IDLE,
        songTitle: "",
        songLink: "",
        message: "",
        retryVideoId: "",
        retryDelayMs: PROCESSING_RETRY_DELAY_MS,
        themeName: THEME_NAME.ORIGINAL,
        ...overrides
    });
}

app.get("/healthz", (req, res) => {
    const missingEnvVars = getMissingRequiredEnvVars();

    return res.status(missingEnvVars.length === 0 ? 200 : 500).json({
        status: missingEnvVars.length === 0 ? "ok" : "misconfigured",
        missingEnvVars
    });
});

//AI: "Render the page with default props so the React view has a stable shape on first load."
app.get("/", (req, res) => {
    renderIndex(res, {
        themeName: getThemeNameFromRequest(req)
    });
});

app.post("/convert-mp3", async (req, res) => {
    //AI: "Read the form field using videoId so it matches the React form input name."
    const videoInput = req.body.videoId;
    const normalizedInput = typeof videoInput === "string" ? videoInput.trim() : videoInput;
    const videoId = extractVideoId(videoInput);
    const themeName = getThemeNameFromRequest(req);
    const missingEnvVars = getMissingRequiredEnvVars();

    if (missingEnvVars.length > 0) {
        console.error(`Missing required environment variables: ${missingEnvVars.join(", ")}`);

        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: "The server is missing API configuration. Set API_KEY and API_HOST before deploying.",
            themeName
        });
    }

    if (
        normalizedInput === undefined ||
        normalizedInput === "" ||
        normalizedInput === null
    ) {
        //AI: "Send the same props shape back to the React view when validation fails so the error window can render safely."
        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: "Please enter a video link",
            themeName
        });
    }

    if (!videoId) {
        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: "Please enter a valid YouTube URL or video ID",
            themeName
        });
    }

    try {
        const fetchResponse = await requestMp3Conversion(videoId);
        const apiStatus = typeof fetchResponse?.status === "string"
            ? fetchResponse.status.toLowerCase()
            : "";

        if (apiStatus === "ok") {
            return renderIndex(res, {
                status: RESULT_STATUS.SUCCESS,
                songTitle: fetchResponse.title,
                songLink: fetchResponse.link,
                themeName
            });
        }

        if (isProcessingResponse(fetchResponse)) {
            return renderIndex(res, {
                status: RESULT_STATUS.PROCESSING,
                message: fetchResponse.msg || "The API is still processing this video. Retrying automatically...",
                retryVideoId: videoId,
                themeName
            });
        }

        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: fetchResponse.msg || "Could not convert that video",
            themeName
        });
    } catch (error) {
        console.error(error);
        return renderIndex(res, {
            status: RESULT_STATUS.ERROR,
            message: "The converter API could not be reached",
            themeName
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

app.post("/toggle-theme", (req, res) => {
    return renderIndex(res, {
        ...getIndexStateFromRequest(req),
        themeName: getNextThemeName(getThemeNameFromRequest(req))
    });
});

//close alert button functionality
app.post("/closeAlert", async (req, res) => {
    renderIndex(res, {
        themeName: getThemeNameFromRequest(req)
    });
})

//START SERVER

app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
})
