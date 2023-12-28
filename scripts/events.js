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

$('#sip-logitems').delegate('.row-table-log', 'dblclick', function(event) {
    event.preventDefault();
    var phoneValue = $(this).attr('phone');
    $('#numDisplay').val(phoneValue);
});
$('#sip-anexs').delegate('.row-table-log', 'dblclick', function(event) {
    event.preventDefault();
    var phoneValue = $(this).attr('anex');

    // Split the 'anex' value using '/' as the delimiter
    var parts = phoneValue.split('/');

    // Check if there are at least two parts (e.g., 'SIP' and the number)
    if (parts.length >= 2) {
        // Extract the number after the '/'
        var numberAfterSlash = parts[1].trim();

        // Set the extracted number in the #numDisplay input
        $('#numDisplay').val(numberAfterSlash);
    }
});
