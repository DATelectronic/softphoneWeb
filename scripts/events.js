function executeFunction() {
    setInterval(ajaxAgentes, 3000);
    setInterval(ajaxCalls, 3000);
    observer.disconnect();
}

// Callback function for the MutationObserver
function mutationCallback(mutationsList) {
    for (const mutation of mutationsList) {
        console.log(mutation)
        if (mutation.type === 'childList' && mutation.target.textContent.trim() === 'Listo') {
            executeFunction();
        }
    }
}

// Create a MutationObserver with the callback
const observer = new MutationObserver(mutationCallback);

// Configure and start observing the target element
const targetNode = document.getElementById('txtRegStatus');
const config = { childList: true, subtree: true };
observer.observe(targetNode, config);