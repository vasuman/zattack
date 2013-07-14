define([], function () {
    json_data = {}, 
        images = {};
    function XHRGet(link_url, callback) {
        var xR = new XMLHttpRequest;
        xR.open('GET', link_url, true);
        xR.source = link_url;
        xR.onload = callback;
        xR.send();
    }
    function loadImages(image_names, callback) {
        var num_img = image_names.length;
        function cCb() {
            if (--num_img <= 0) {
                callback();
            }
        }
        for(var idx=0; idx < image_names.length; idx+=1) {
            if (!(image_names[idx] in images)) {
                var tmpImg = new Image();
                tmpImg.onload = cCb;
                tmpImg.src = image_names[idx];
                images[image_names[idx]] = tmpImg;
            } else {
                num_img--;
            }
        }
    }
    function loadJSON(json_list, callback) {
        var num_json = json_list.length;
        function cCb() {
            json_data[this.source] = JSON.parse(this.response);
            if(--num_json <= 0) {
                callback();
            }
        }
        for(var idx=0; idx < json_list.length; idx+=1) {
            if (!(json_list[idx] in json_data)) {
                XHRGet(json_list[idx], cCb)
            } else {
                num_json--;
            }
        }
    }
    return {
        images: images,
        json_data: json_data,
        loadJSON: loadJSON,
        loadImages: loadImages
    };
});
