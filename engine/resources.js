var resourceManager = (function () {
    function XHRGet(link_url, callback) {
        var xR = new XMLHttpRequest;
        xR.open('GET', link_url, true);
        xR.source = link_url;
        xR.onload = callback;
        xR.send();
    }
    function loadImages(image_names, callback) {
        var num_img = 0;
        function cCb() {
            num_img++;
            if(num_img >= image_names.length) {
                callback();
            }
        }
        for(var idx=0; idx < image_names.length; idx+=1) {
            var tmpImg = new Image();
            tmpImg.onload = cCb;
            tmpImg.src = image_names[idx];
            this.images[image_names[idx]] = tmpImg;
        }
    }
    function loadJSON(json_list, callback) {
        var num_json = 0;
        function cCb() {
            resourceManager.json_data[this.source] = JSON.parse(this.response);
            num_json++;
            if(num_json >= json_list.length) {
                callback(this.source);
            }
        }
        for(var idx=0; idx < json_list.length; idx+=1) {
            XHRGet(json_list[idx], cCb)
        }
    }
    return {
        images: {},
        json_data: {},
        loadJSON: loadJSON,
        loadImages: loadImages
    };
}());
