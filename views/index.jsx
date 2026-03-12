const React = require("react");

//AI: "This React component is the page that Express renders when res.render('index') is called."
function Index() {
    return (
        <html lang="en">
            <head>
                {/*AI: "Set standard page metadata and load the existing stylesheet from the public folder."*/}
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>YouTube to MP3</title>
                <link rel="stylesheet" href="/css/styles.css" />
            </head>
            <body>
                {/*AI: "Use a fragment here so you can freely add multiple sibling elements without an extra wrapper."*/}
                <main>
                    <>
                        <h1>hello</h1>
                    </>
                </main>
            </body>
        </html>
    );
}

//AI: "Export the component so the custom Express .jsx engine can require and render it."
module.exports = Index;
