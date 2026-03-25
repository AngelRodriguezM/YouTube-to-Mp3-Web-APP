const React = require("react");
const { ThemeProvider, createGlobalStyle } = require("styled-components");
const {
  Frame,
  Button,
  styleReset,
  Window,
  WindowContent,
  WindowHeader,
  AppBar,
  Hourglass,
  Toolbar,
  TextInput,
} = require("react95");
const profileImage = "/IMAGES/profileIconWin95.png";
const darkmodeIcon = "/IMAGES/LightDarkModeWin95Icon.png";
const original = require("react95/dist/themes/original");
const tokyoDark = require("react95/dist/themes/tokyoDark");
const THEMES = {
  original,
  "tokyo-dark": tokyoDark,
};
// import ms_sans_serif from 'react95/dist/fonts/ms_sans_serif.woff2';
// import ms_sans_serif_bold from 'react95/dist/fonts/ms_sans_serif_bold.woff2';
//AI: "Apply the React95 global reset so its components render with the expected base styles."
const GlobalStyles = createGlobalStyle`
    ${styleReset}

    *{
    font-family: "ms_sans_serif", sans-serif;
    }

    body {
        display: block;
        justify-content:center;
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
        display: grid;
        gap: 35px;
        grid-template-columns: repeat(1, 1fr);
        justify-items:center;
        width:100%;
    }
`;

//AI: "Render the result window from props so success, processing, and errors each show the right message."
function SongResult({ status, songTitle, songLink, message, retryVideoId, themeName }) {
  //AI: "Skip rendering the result box on the first page load before any form submission happens."
  if (typeof status === "undefined" || status === "idle") {
    return null;
  }

  if (status === "success") {
    return (
      <Window className="success">
        <WindowHeader>Success!</WindowHeader>
        <WindowContent className="success">
          <p>{songTitle}</p>
          <a href={songLink}>
            {" "}
            <Button id="download-btn">Download</Button>
          </a>
        </WindowContent>
      </Window>
    );
  }

  if (status === "processing") {
    return (
      <Window className="processing">
        <WindowHeader>Processing...</WindowHeader>
        <WindowContent>
          <p>{message}</p>
          <p>Retrying automatically...</p>
          <Hourglass />
          <form action="/convert-mp3" method="POST" id="processing-form">
            <input type="hidden" name="videoId" value={retryVideoId} />
            <input type="hidden" name="theme" value={themeName} />
          </form>
        </WindowContent>
      </Window>
    );
  }

  return (
    <Window className="errors">
      <WindowHeader className="window-header">
        ALERT!
        <form action="/closeAlert" method="POST">
          <input type="hidden" name="theme" value={themeName} />
          <Button id="closeAlertBtn" type="submit" name="closeAlert">
            <span className="close-icon"></span>
          </Button>
        </form>
      </WindowHeader>
      <WindowContent>
        <p>{message}</p>
      </WindowContent>
    </Window>
  );
}

//AI: "This React component is the page that Express renders when res.render('index') is called."
function Index({
  //AI: "Accept render props from Express so the page can show validation errors or a successful download result."
  status = "idle",
  songTitle = "",
  songLink = "",
  message = "",
  retryVideoId = "",
  retryDelayMs = 1000,
  themeName = "original",
}) {
  const shouldRetryProcessing = status === "processing" && retryVideoId;
  const currentTheme = THEMES[themeName] || original;

  return (
    <html lang="en">
      <head>
        {/*AI: "Set standard page metadata and load the existing stylesheet from the public folder."*/}
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>YouTube to MP3</title>

        <link
          rel="icon"
          type="image/png"
          href="/favicon/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="MyWebSite" />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="stylesheet" href="/css/styles.css" />
        {shouldRetryProcessing ? (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                                window.addEventListener("load", function () {
                                    var retryForm = document.getElementById("processing-form");

                                    if (!retryForm) {
                                        return;
                                    }

                                    window.setTimeout(function () {
                                        retryForm.submit();
                                    }, ${retryDelayMs});
                                });
                            `,
            }}
          />
        ) : null}
      </head>
      <body>
        <ThemeProvider theme={currentTheme}>
          <GlobalStyles />
          {/*AI: "Use a fragment here so you can freely add multiple sibling elements without an extra wrapper."*/}
          <main>
            <>
              <div className="windowWrapper">
                <Window resizable className="window">
                  <WindowHeader className="window-header">
                    Youtube to MP3 Converter
                    <Button>
                      <span className="close-icon"></span>
                    </Button>
                  </WindowHeader>
                  <WindowContent>
                    <Frame className="inputFrame">
                      {/*AI: "Post to the Express route using the same field name the backend reads: videoId."*/}
                      <form action="/convert-mp3" method="POST" id="form">
                        <input type="hidden" name="theme" value={themeName} />
                        <TextInput
                          fullWidth
                          name="videoId"
                          placeholder="YouTube URL or Video ID"
                        ></TextInput>
                        <Button id="convert-btn" type="submit">
                          Convert
                        </Button>
                      </form>
                    </Frame>
                  </WindowContent>
                </Window>

                <div>
                  {/*AI: "Render the result window as a normal React component fed by Express props."*/}
                  <SongResult
                    status={status}
                    songTitle={songTitle}
                    songLink={songLink}
                    message={message}
                    retryVideoId={retryVideoId}
                    themeName={themeName}
                  />
                </div>

                <AppBar style={{left: 0, bottom: 0, right: 0, top: "auto" }}>
                  <Toolbar style={{ justifyContent: 'space-between' }}>
                    <a href="https://github.com/AngelRodriguezM">

                    <Button>
                        <img src={profileImage} alt="" style={{width: 25, height:25}}/>

                        Creator
                    </Button>

                    </a>

                    <form action="/toggle-theme" method="POST">
                        <input type="hidden" name="theme" value={themeName} />
                        <input type="hidden" name="status" value={status} />
                        <input type="hidden" name="songTitle" value={songTitle} />
                        <input type="hidden" name="songLink" value={songLink} />
                        <input type="hidden" name="message" value={message} />
                        <input type="hidden" name="retryVideoId" value={retryVideoId} />
                        <Button type="submit">
                            <img src={darkmodeIcon} style={{width:50, height: "auto"}} alt="" />
                        </Button>
                    </form>
                  </Toolbar>
                </AppBar>
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
