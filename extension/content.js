chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "jump") {
        const videoElement = document.querySelector('video');
        if (videoElement) {
            videoElement.currentTime = request.time;
            videoElement.play();
        }
    }
});
