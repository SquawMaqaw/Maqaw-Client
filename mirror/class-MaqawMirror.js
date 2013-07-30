function Mirror(options) {
  // stores connection object if exists
  this.conn = options && options.conn;
  this.base;
}

Mirror.prototype = {
  SHARE_SCREEN: 0, 
  SHARE_SCREEN_OK: 1,
  SHARE_SCREEN_REFUSE: 2,
  SCREEN_DATA: 3,
  MOUSE_MOVE: 4,
  MOUSE_CLICK: 5,
  SCROLL: 6
}

Mirror.prototype.data = function(_data) {
  //
  // handle new data. For a new share screen
  // request, function opens a new mirror 
  // for all other requests, function passes 
  // data to mirrorScreen
  //
  switch(_data.request) {
    case this.SHARE_SCREEN: 
      // Request from peer to view this screen  
      this.conn.send({ type: 'SCREEN', request: this.SHARE_SCREEN_OK });
      this.shareScreen();
      break;
    case this.SHARE_SCREEN_OK:
      //  Share screen request received and 
      //  validated open a screen mirror 
      this.openMirror();
      break;
    case this.SCREEN_DATA:
      //  Screen Data.
      this.mirrorScreen(_data);
      break;
    case this.MOUSE_MOVE:
      // TODO:  Update fake mouse positions. 
      // There's a working example of mouse movement that we built a few weeks ago.
      break;
    case this.MOUSE_CLICK:
      // TODO: Trigger some sort of fake mouse click. (could be a UI event or something more complicated)
      break;
    case this.SCROLL:
      // TODO: Scroll mirror screen to reflect peer.
      break;
    default: 
      // Unknown
      break;
  }
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

Mirror.prototype.requestScreen = function() {
  //
  //  Sends share screen request to peer
  //
  if (this.conn) {
    this.conn.send({ 
      type: 'SCREEN', 
      request: this.SHARE_SCREEN 
    });
  }
}

Mirror.prototype.shareScreen = function() {
  //
  // streams screen to peer
  // 
  var _this = this;

  if (this.conn) {

    this.conn.send({ 
      type: 'SCREEN',
      request: this.SCREEN_DATA,
      clear: true 
    });

    this.conn.send({ 
      type: 'SCREEN',
      request: this.SCREEN_DATA,
      base: location.href.match(/^(.*\/)[^\/]*$/)[1] 
    });

    var mirrorClient = new TreeMirrorClient(document, {

      initialize: function(rootId, children) {
        _this.conn.send({ 
          type: 'SCREEN',
          request: _this.SCREEN_DATA,
          f: 'initialize',
          args: [rootId, children]
        });
      },

      applyChanged: function(removed, addedOrMoved, attributes, text) {
        _this.conn.send({
          type: 'SCREEN',
          request: _this.SCREEN_DATA,
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
    else if (msg.request === _this.SCREEN_DATA) 
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
