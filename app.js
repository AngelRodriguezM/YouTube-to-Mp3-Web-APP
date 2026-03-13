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

//needed to parse html data for POST request

app.use(express.urlencoded({
    extended: true
}))
app.use(express.json());

app.get("/", (req, res) => {
    res.render("index")
})
app.post("/", (req, res) => {
    
})

//START SERVER

app.listen(PORT, () => {
    console.log(`server started on port ${PORT}`);
})
