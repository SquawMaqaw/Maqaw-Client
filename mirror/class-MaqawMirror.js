function Mirror(options) {
  // stores connection object if exists
  this.conn = options && options.conn;
  this.base;
}

Mirror.prototype.openMirror = function() {
  var _this = this;   
  this.mirrorDocument = window.open().document;

  this._mirror = new TreeMirror(this.mirrorDocument, {
    createElement: function(tagName) {
      if (tagName == 'SCRIPT') {
        var node = _this.mirrorDocument.createElement('NO-SCRIPT');
        node.style.display = 'none';
        return node;
      }

      if (tagName == 'HEAD') {
        var node = _this.mirrorDocument.createElement('HEAD');
        node.appendChild(_this.mirrorDocument.createElement('BASE'));
        node.firstChild.href = _this.base;
        return node;
      }
    }
  });
}

Mirror.prototype.setConnection = function(conn) {
  // set a connection if established later
  this.conn = conn;
}

Mirror.prototype.shareScreen = function() {
  // shares your screen with the associated connection
  //
  var _this = this;

  if (this.conn) {

    this.conn.send({ 
      type: 'SCREEN', 
      request: 'shareScreen'
    });

    this.conn.send({ 
      type: 'SCREEN',
      clear: true 
    });

    this.conn.send({ 
      type: 'SCREEN',
      base: location.href.match(/^(.*\/)[^\/]*$/)[1] 
    });

    var mirrorClient = new TreeMirrorClient(document, {

      initialize: function(rootId, children) {
        _this.conn.send({ 
          type: 'SCREEN',
          f: 'initialize',
          args: [rootId, children]
        });
      },

      applyChanged: function(removed, addedOrMoved, attributes, text) {
        _this.conn.send({
          type: 'SCREEN',
          f: 'applyChanged',
          args: [removed, addedOrMoved, attributes, text]
        });
      }
    });
  } else {
    console.log("Error: Connection not established. Unable to stream screen");
  }
}

Mirror.prototype.mirrorScreen = function(data) {
  var _this = this;

  function clearPage() {
    while (_this.mirrorDocument.firstChild) {
      _this.mirrorDocument.removeChild(_this.mirrorDocument.firstChild);
    }
  }

  function handleMessage(msg) {
    if (msg.clear)
      clearPage();
    else if (msg.base)
      _this.base = msg.base;
    else if (msg.request) 
      return;
    else 
      _this._mirror[msg.f].apply(_this._mirror, msg.args);
  }

  var msg = data;
  if (msg instanceof Array) {
    msg.forEach(function(subMessage) {
      handleMessage(JSON.parse(subMessage));
    });
  } else {
    handleMessage(msg);
  }
}
