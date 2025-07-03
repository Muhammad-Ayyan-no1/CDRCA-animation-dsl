let currentANIM = null;

async function refreshPreview() {
  var fileSystem =
    (await (async function () {
      const iframeTextEditer = document.getElementById("textEditer");
      if (!iframeTextEditer) {
        console.error("iframe with id 'textEditer' not found.");
        return;
      }

      // Helper to wait for the iframe to load if needed
      if (!iframeTextEditer.contentWindow) {
        await new Promise((resolve) => {
          iframeTextEditer.addEventListener("load", resolve, { once: true });
        });
      }

      // Send the message and wait for the reply
      const payload = await new Promise((resolve) => {
        function handleMessage(event) {
          if (
            event.source === iframeTextEditer.contentWindow &&
            event.data &&
            event.data.type === "fileSystem"
          ) {
            window.removeEventListener("message", handleMessage);
            resolve(event.data.payload);
          }
        }
        window.addEventListener("message", handleMessage);
        iframeTextEditer.contentWindow.postMessage(
          { type: "getFileSystem" },
          "*"
        );
      });

      return payload;
    })()) || {};
  return updateRenderer(await transpileCDRCA(fileSystem));
}

function updateRenderer(newJScode) {
  if (currentANIM) currentANIM.instantHault();
  //   console.log(newJScode);
  currentANIM = ObjectAnimationSystem_INS.main(
    new Function(`
  function a() {
    ${newJScode}
  }
  return a();
`)()
  );
  //   console.log(currentANIM);
  currentANIM.init(60, true);
}
