require(function () {
    var controlDiv = document.getElementById('controls');
    function addButton(buttonName, callback) {
        var button = document.createElement('button')
        button.innerHTML = buttonName;
        button.onclick = callback;
        controlDiv.appendChild(button);
    };
    function clear() {
        controlDiv.innerHTML = '';
    };
    return {
        addButton: addButton,
        clear: clear
    };
});
