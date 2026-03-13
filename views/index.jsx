const React = require("react");
const { ThemeProvider, createGlobalStyle } = require("styled-components");
const { Frame,
    Button,
    styleReset,
    Window,
    WindowContent,
    WindowHeader,
    Toolbar
 } = require("react95");
const original = require("react95/dist/themes/original");
// import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
// import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';

//AI: "Apply the React95 global reset so its components render with the expected base styles."
const GlobalStyles = createGlobalStyle`
    ${styleReset}

    body {
        font-family: "ms_sans_serif", sans-serif;
        background: ${({ theme }) => theme.desktopBackground};
        margin: 0;
        padding: 16px;
    }
    .close-icon {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-left: -1px;
    margin-top: -1px;
    transform: rotateZ(45deg);
    position: relative;
        &:before,
        &:after {
        content: '';
        position: absolute;
        background: ${({ theme }) => theme.materialText};
        }
        &:before {
        height: 100%;
        width: 3px;
        left: 50%;
        transform: translateX(-50%);
        }
        &:after {
        height: 3px;
        width: 100%;
        left: 0px;
        top: 50%;
        transform: translateY(-50%);
        }
    }
      .window {
    width: 400px;
    min-height: 200px;
  }
    .window-header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    }
`;


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
                <ThemeProvider theme={original}>
                    <GlobalStyles />
                    {/*AI: "Use a fragment here so you can freely add multiple sibling elements without an extra wrapper."*/}
                    <main>
                        <>
                            <h1>hello</h1>
                            <Frame style={{ marginBottom: "16px", padding: "12px" }}>
                                hlolol
                                <Button style={{ marginLeft: "12px" }}>default</Button>
                            </Frame>
                        </>
                    </main>
                    <h2>world</h2>

                    <Window resizable className="window">
                        <WindowHeader className="window-header">
                            TEST

                            <Button><span className="close-icon"></span></Button>
                        </WindowHeader>
                        <WindowContent>
                            <Toolbar>
                                <Button variant="menu">File</Button>
                                <Button variant="menu">File</Button>
                                <Button variant="menu">File</Button>
                                <Button variant="menu">File</Button>
                            </Toolbar>

                            <Button >File</Button>
                        </WindowContent>
                    </Window>



                </ThemeProvider>
            </body>
        </html>
    );
}

//AI: "Export the component so the custom Express .jsx engine can require and render it."
module.exports = Index;
