/**
 * Created with JetBrains RubyMine.
 * User: Eli
 * Date: 7/12/13
 * Time: 12:41 PM
 * To change this template use File | Settings | File Templates.
 */
function maqawAjaxPost(url, params, callback) {
    var xhr;

    if(typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
    else {
        var versions = ["MSXML2.XmlHttp.5.0",
            "MSXML2.XmlHttp.4.0",
            "MSXML2.XmlHttp.3.0",
            "MSXML2.XmlHttp.2.0",
            "Microsoft.XmlHttp"]

        for(var i = 0, len = versions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            }
            catch(e){}
        } // end for
    }

    xhr.onreadystatechange = ensureReadiness;

    function ensureReadiness() {
        if(xhr.readyState < 4) {
            return;
        }

        if(xhr.status !== 200) {
            return;
        }

        // all is well
        if(xhr.readyState === 4) {
            console.log("Ready!");
            callback(xhr);
        }
    }

    //xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.open('POST', url, true);
    xhr.send(params);
}