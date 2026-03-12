const React = require("react");

//AI: "This React component is the page that Express renders when res.render('index') is called."
function Index() {
    return React.createElement(
        "html",
        { lang: "en" },
        React.createElement(
            "head",
            null,
            //AI: "Set standard page metadata and load the existing stylesheet from the public folder."
            React.createElement("meta", { charSet: "UTF-8" }),
            React.createElement("meta", {
                name: "viewport",
                content: "width=device-width, initial-scale=1.0"
            }),
            React.createElement("title", null, "YouTube to MP3"),
            React.createElement("link", {
                rel: "stylesheet",
                href: "/css/styles.css"
            })
        ),
        React.createElement(
            "body",
            null,
            //AI: "Main is currently empty and ready for your page content."
            React.createElement("main", null)
        )
    );
}

//AI: "Export the component so the custom Express .jsx engine can require and render it."
module.exports = Index;
