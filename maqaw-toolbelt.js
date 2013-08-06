/**
 * Created with JetBrains RubyMine.
 * User: Eli
 * Date: 7/12/13
 * Time: 12:41 PM
 * To change this template use File | Settings | File Templates.
 */


function maqawAjaxPost(url, params, callback) {
    var xhr;

    if (typeof XMLHttpRequest !== 'undefined') xhr = new XMLHttpRequest();
    else {
        var versions = ["MSXML2.XmlHttp.5.0",
            "MSXML2.XmlHttp.4.0",
            "MSXML2.XmlHttp.3.0",
            "MSXML2.XmlHttp.2.0",
            "Microsoft.XmlHttp"]

        for (var i = 0, len = versions.length; i < len; i++) {
            try {
                xhr = new ActiveXObject(versions[i]);
                break;
            }
            catch (e) {
            }
        } // end for
    }

    xhr.onreadystatechange = ensureReadiness;

    function ensureReadiness() {
        // post completed
        if (xhr.readyState === 4) {
            callback(xhr);
        }
    }


    xhr.open('POST', url, true);
    xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xhr.send(params);

}

var maqawCookies = {
    //
    // Thank you, Mozilla
    // Documentation at https://developer.mozilla.org/en-US/docs/Web/API/document.cookie

    getItem: function (sKey) {
        return decodeURI(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURI(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
    },
    setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
        if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) {
            return false;
        }
        var sExpires = "";
        if (vEnd) {
            switch (vEnd.constructor) {
                case Number:
                    sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
                    break;
                case String:
                    sExpires = "; expires=" + vEnd;
                    break;
                case Date:
                    sExpires = "; expires=" + vEnd.toGMTString();
                    break;
            }
        }
        document.cookie = encodeURI(sKey) + "=" + encodeURI(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
        return true;
    },

    removeItem: function (sKey, sPath) {
        if (!sKey || !this.hasItem(sKey)) {
            return false;
        }
        document.cookie = encodeURI(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + (sPath ? "; path=" + sPath : "");
        return true;
    },

    hasItem: function (sKey) {
        return (new RegExp("(?:^|;\\s*)" + encodeURI(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
    }

};

/*
 * Returns an array containing the position of the given node in the dom
 */
function maqawGetNodeHierarchy(node) {
    var index = [];
    while (node !== document.body) {
        index.unshift(Array.prototype.indexOf.call(node.parentElement.children, node));
        node = node.parentElement;
    }
    return index;
}

/*
 * Given an array from maqawGetNodeHierarchy returns the specified node in the dom
 */
function maqawGetNodeFromHierarchy(doc, hierarchy){
    var i, length = hierarchy.length, node = doc.body;
          for(i = 0; i < length; i++){
              node = node.children[hierarchy[i]];
          }
    return node;
}


/*
 * Type codes for sending data with a MaqawConnection
 */
var MAQAW_DATA_TYPE = {
    TEXT: 0,
    SCREEN: 1
};