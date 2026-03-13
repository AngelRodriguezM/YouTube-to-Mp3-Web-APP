const React = require("react");
const { ThemeProvider, createGlobalStyle } = require("styled-components");
const { Frame,
    Button,
    styleReset,
    Window,
    WindowContent,
    WindowHeader,
    Toolbar,
    TextInput,
 } = require("react95");
const original = require("react95/dist/themes/original");
// import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
// import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';

//AI: "Apply the React95 global reset so its components render with the expected base styles."
const GlobalStyles = createGlobalStyle`
    ${styleReset}

    body {
        display: block;
        font-family: "ms_sans_serif", sans-serif;
        background: ${({ theme }) => theme.desktopBackground};
        margin: 0 auto;
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
        max-width: 600px;
        min-width:200px;
        width: 100%;
        min-height: 200px;
  }
    .window-header{
    display: flex;
    align-items: center;
    justify-content: space-between;
    }
    .inputFrame{

    width: 100%;
    }

    #form{
    display: flex;
    }

    .windowWrapper{
        display: flex;
        justify-content:center;
        width:100%;
    }
`;


function songResult(success, songTitle, songLink){
    if (success != "undefined" && success){
        return <>
            <div className="success">
                <p>{songTitle}</p>
                <a href={songLink}> <Button id="download-btn">Download</Button></a>
            </div>
        </>
    }else if( success != "undefined" && !success){
       return <>
        <Frame></Frame>
       </> 
    }
}

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
                          <div className="windowWrapper">


                    <Window resizable className="window">
                        <WindowHeader className="window-header">
                            Youtube to MP3 Converter

                            <Button><span className="close-icon"></span></Button>
                        </WindowHeader>
                        <WindowContent>
                            
                            <Frame className="inputFrame">

                            <form  action="convert-mp3" method="POST" id="form">
                                <TextInput fullWidth>

                                </TextInput>
                                <Button id="convert-btn">Convert</Button>
                            </form>

                            

                            </Frame>

                            <div>
                               
                            </div>

                            <Frame>

                                

                            </Frame>

                        </WindowContent>
                    </Window>

            
                          </div>



                        </>
                    </main>

                        </ThemeProvider>
            </body>
        </html>
    );
}

//AI: "Export the component so the custom Express .jsx engine can require and render it."
module.exports = Index;
