var MAQAW_MIRROR_ENUMS = {
  SHARE_SCREEN: 0, 
  SHARE_SCREEN_OK: 1,
  SHARE_SCREEN_REFUSE: 2,
  SCREEN_DATA: 3,
  MOUSE_MOVE: 4,
  MOUSE_CLICK: 5,
  SCROLL: 6,
  INPUT: 7
};

function Mirror(options) {
  // stores connection object if exists
  this.conn = options && options.conn;
  this.base;

  this.mirrorDocument;
  this.mirrorWindow;
  this.mouseMirror;
  this.inputMirror;

  // whether or not we are currently viewing our peer's screen
  this.isViewingScreen = false;

}

/*
 * Called when the connection to our peer is reset
 */
Mirror.prototype.connectionReset = function () {
   // if we were watching our peer's screen, tell that to start sending screen
   //data again
    if(this.mirrorWindow && !this.mirrorWindow.closed){
        this.requestScreen();
    }
};

Mirror.prototype.data = function(_data) {
  //
  // handle new data. For a new share screen
  // request, function opens a new mirror
  // for all other requests, function passes
  // data to mirrorScreen
  //
  switch(_data.request) {
    case MAQAW_MIRROR_ENUMS.SHARE_SCREEN:
      // Request from peer to view this screen  
      this.conn.send({ type: MAQAW_DATA_TYPE.SCREEN, request: MAQAW_MIRROR_ENUMS.SHARE_SCREEN_OK });
      this.shareScreen();
      break;
    case MAQAW_MIRROR_ENUMS.SHARE_SCREEN_OK:
      //  Share screen request received and 
      //  validated open a screen mirror 
      this.openMirror();
      break;
    case MAQAW_MIRROR_ENUMS.SCREEN_DATA:
      //  Screen Data.
    case MAQAW_MIRROR_ENUMS.MOUSE_MOVE:
      // Mouse move event
    case MAQAW_MIRROR_ENUMS.MOUSE_CLICK:
      // Mouse click event
    case MAQAW_MIRROR_ENUMS.INPUT:
      // Interactions with input elements
    case MAQAW_MIRROR_ENUMS.SELECT:
      // Interactions with select elements
    case MAQAW_MIRROR_ENUMS.TEXT_AREA:
     // Interactions with textarea elements
      this.mirrorScreen(_data);  
      break;
    case MAQAW_MIRROR_ENUMS.SCROLL:
      this.mirrorWindow.scrollTo(_data.left, _data.top);
      break;
    default:
      // Unknown
      break;
  }
};

Mirror.prototype.openMirror = function() {
  var _this = this;

  // if we are already viewing the screen, don't open a new window
    if(!this.isViewingScreen) {
         this.mirrorWindow = window.open();
         this.mirrorDocument = this.mirrorWindow.document;

        // attach a listener for if the window is closed
        this.mirrorWindow.addEventListener('unload', function() {
            // TODO: implement me
            _this.isViewingScreen = false;
        }, false);
    }

    this.isViewingScreen = true;


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
  
  this.mouseMirror = new MouseMirror(this.mirrorDocument, {
    mousemove: function(event) {
      _this.conn.send({
        type: MAQAW_DATA_TYPE.SCREEN,
        request: MAQAW_MIRROR_ENUMS.MOUSE_MOVE,
        coords: {x: event.pageX, y: event.pageY}
      });
    }, 
    click: function(event) {
        _this.conn.send({
            type: MAQAW_DATA_TYPE.SCREEN,
            request: MAQAW_MIRROR_ENUMS.MOUSE_CLICK,
            coords: {x: event.pageX, y: event.pageY},
            target: maqawGetNodeHierarchy(event.target)
        });
    }
  });

  this.inputMirror = new MaqawInputMirror(this.mirrorDocument, {
      multipleSelect: function(){
          // get list of selected options
          var selectedOptions = [];
          for(var j = 0; j < this.selectedOptions.length; j++){
              selectedOptions.push(this.selectedOptions[j].text);
          }
          _this.conn.send({
              type: MAQAW_DATA_TYPE.SCREEN,
              request: MAQAW_MIRROR_ENUMS.INPUT,
              index: maqawGetNodeHierarchy(this),
              selectedOptions: selectedOptions
          });
      },
      singleSelect: function(){
          _this.conn.send({
              type: MAQAW_DATA_TYPE.SCREEN,
              request: MAQAW_MIRROR_ENUMS.INPUT,
              index: maqawGetNodeHierarchy(this),
              selectedIndex: this.selectedIndex
          });
      }
          ,
      inputDefault: function(){
          _this.conn.send({
              type: MAQAW_DATA_TYPE.SCREEN,
              request: MAQAW_MIRROR_ENUMS.INPUT,
              index: maqawGetNodeHierarchy(this),
              text: this.value
          });
      }
          ,
      radioAndCheckbox: function(){
          _this.conn.send({
              type: MAQAW_DATA_TYPE.SCREEN,
              request: MAQAW_MIRROR_ENUMS.INPUT,
              index: maqawGetNodeHierarchy(this),
              checked: this.checked
          });
      }
  });
};

Mirror.prototype.setConnection = function(conn) {
  // set a connection if established later
  this.conn = conn;
};

Mirror.prototype.requestScreen = function() {
  //
  //  Sends share screen request to peer
  //
  if (this.conn) {
    this.conn.send({ 
      type: MAQAW_DATA_TYPE.SCREEN,
      request: MAQAW_MIRROR_ENUMS.SHARE_SCREEN
    });
  }
};

Mirror.prototype.shareScreen = function() {
  //
  // streams screen to peer
  //
  var _this = this;
  if (this.conn) {

    this.conn.send({
      type: MAQAW_DATA_TYPE.SCREEN,
      request: MAQAW_MIRROR_ENUMS.SCREEN_DATA,
      clear: true 
    });

    this.conn.send({
      type: MAQAW_DATA_TYPE.SCREEN,
      request: MAQAW_MIRROR_ENUMS.SCREEN_DATA,
      base: location.href.match(/^(.*\/)[^\/]*$/)[1] 
    });

    var mirrorClient = new TreeMirrorClient(document, {

      initialize: function(rootId, children) {
        _this.conn.send({
          type: MAQAW_DATA_TYPE.SCREEN,
          request: MAQAW_MIRROR_ENUMS.SCREEN_DATA,
          f: 'initialize',
          args: [rootId, children]
        });
      },

      applyChanged: function(removed, addedOrMoved, attributes, text) {
        _this.conn.send({
          type: MAQAW_DATA_TYPE.SCREEN,
          request: MAQAW_MIRROR_ENUMS.SCREEN_DATA,
          f: 'applyChanged',
          args: [removed, addedOrMoved, attributes, text]
        });
      }
    });

    this.mouseMirror = new MouseMirror(document, {
      mousemove: function(event) {
        _this.conn.send({ 
          type: MAQAW_DATA_TYPE.SCREEN,
          request: MAQAW_MIRROR_ENUMS.MOUSE_MOVE,
          coords: {x: event.pageX, y: event.pageY}
        });
      }, 
      click: function(event) {
          _this.conn.send({
              type: MAQAW_DATA_TYPE.SCREEN,
              request: MAQAW_MIRROR_ENUMS.MOUSE_CLICK,
              coords: {x: event.pageX, y: event.pageY},
              target: maqawGetNodeHierarchy(event.target)
          });
      }
    });
  
    // Set up scroll listener
    window.addEventListener('scroll', scrollListener, false);
    function scrollListener(){
      var top = window.pageYOffset;
      var left = window.pageXOffset;
      _this.conn.send({
        type: MAQAW_DATA_TYPE.SCREEN,
        request: MAQAW_MIRROR_ENUMS.SCROLL,
        top: top,
        left: left
      });
    }



    /* Set up listeners to input events */
      this.inputMirror = new MaqawInputMirror(document, {
          multipleSelect: function(){
              // get list of selected options
              var selectedOptions = [];
              for(var j = 0; j < this.selectedOptions.length; j++){
                  selectedOptions.push(this.selectedOptions[j].text);
              }
              _this.conn.send({
                  type: MAQAW_DATA_TYPE.SCREEN,
                  request: MAQAW_MIRROR_ENUMS.INPUT,
                  index: maqawGetNodeHierarchy(this),
                  selectedOptions: selectedOptions
              });
          },
          singleSelect: function(){
              _this.conn.send({
                  type: MAQAW_DATA_TYPE.SCREEN,
                  request: MAQAW_MIRROR_ENUMS.INPUT,
                  index: maqawGetNodeHierarchy(this),
                  selectedIndex: this.selectedIndex
              });
          }
          ,
          inputDefault: function(){
              _this.conn.send({
                  type: MAQAW_DATA_TYPE.SCREEN,
                  request: MAQAW_MIRROR_ENUMS.INPUT,
                  index: maqawGetNodeHierarchy(this),
                  text: this.value
              });
          }
          ,
          radioAndCheckbox: function(){
              _this.conn.send({
                  type: MAQAW_DATA_TYPE.SCREEN,
                  request: MAQAW_MIRROR_ENUMS.INPUT,
                  index: maqawGetNodeHierarchy(this),
                  checked: this.checked
              });
          }
      });

  } else {
    console.log("Error: Connection not established. Unable to stream screen");
  }
};

Mirror.prototype.mirrorScreen = function(data) {
  var _this = this;

  function clearPage() {
    // clear page //
    while (_this.mirrorDocument.firstChild) {
      _this.mirrorDocument.removeChild(_this.mirrorDocument.firstChild);
    }
  }

  function handleMessage(msg) {
    if (msg.clear)
      clearPage();
    else if (msg.base)
      _this.base = msg.base;
    else if (msg.request === MAQAW_MIRROR_ENUMS.SCREEN_DATA)
      _this._mirror[msg.f].apply(_this._mirror, msg.args);
    else if (msg.request === MAQAW_MIRROR_ENUMS.MOUSE_MOVE || msg.request === MAQAW_MIRROR_ENUMS.MOUSE_CLICK)
      _this.mouseMirror.data(msg);
    else if (msg.request === MAQAW_MIRROR_ENUMS.INPUT) {
      _this.inputMirror.data(msg);
    }
  }

  var msg = data;
  if (msg instanceof Array) {
    msg.forEach(function(subMessage) {
      handleMessage(JSON.parse(subMessage));
    });
  } else {
    handleMessage(msg);
  }
};

function MouseMirror(doc, options) {
  this.CURSOR_RADIUS = 10;
  this.moveEvent = options.mousemove;
  this.clickEvent = options.click;
  this.doc = doc;
  var _this = this;

    // keep track of the last element that was clicked on
  this.lastElementClicked;

  this.cursor = this.doc.createElement('div'); 
  this.cursor.style.backgroundImage = "url('http://gohapuna.com/wp/wp-content/uploads/2013/08/cursor.png')";
  this.cursor.style.height = '30px';
  this.cursor.style.width = '20px';
  this.cursor.style.zIndex = 10000;
  this.cursor.style.position = 'absolute';
  this.cursor.style.top = '0px';
  this.cursor.style.left = '0px';
  this.cursor.setAttribute("ignore", "true");

    // maximum number of times per second mouse movement data will be sent
    var MAX_SEND_RATE = 40;
    // has enough time elapsed to send data again?
    var isMouseTimeUp = true;
    function moveMouse(event){
      if(isMouseTimeUp){
          _this.moveEvent(event);
          isMouseTimeUp = false;
          setTimeout(function(){isMouseTimeUp = true;}, 1000 / MAX_SEND_RATE);
      }
    }


  this.doc.addEventListener('mousemove', moveMouse, false);
  this.doc.addEventListener('click', this.clickEvent, false);


  this.isDrawn = false;

  return this;
}

MouseMirror.prototype.data = function(_data) {

  if (!this.isDrawn) {
    //  Hack that appends cursor only  
    //  once a document.body exists
    if (this.doc.body) {
      this.doc.body.appendChild(this.cursor);
      this.isDrawn = true;
    }
  }

  if (_data.request === MAQAW_MIRROR_ENUMS.MOUSE_MOVE) {
    this.moveMouse(_data);
  } else if (_data.request === MAQAW_MIRROR_ENUMS.MOUSE_CLICK) {
    this.clickMouse(_data);
  }

};

MouseMirror.prototype.moveMouse = function(_data) {
  this.cursor.style.top = _data.coords.y - this.CURSOR_RADIUS + 'px';
  this.cursor.style.left = _data.coords.x - this.CURSOR_RADIUS + 'px';
};

MouseMirror.prototype.clickMouse = function(_data) {
    var x = _data.coords.x;
    var y = _data.coords.y;
    var _this = this;

    // get the clicked element
    var target = maqawGetNodeFromHierarchy(this.doc, _data.target);
    // remove highlight from last clicked element
    if(this.lastElementClicked){
        this.lastElementClicked.className = this.lastElementClicked.className.replace(/\bmaqaw-mirror-clicked-element\b/,'');
    }
    // highlight the element that was clicked if it wasn't the body
    if(target.tagName !== 'BODY'){
        target.className = target.className + ' maqaw-mirror-clicked-element';
        this.lastElementClicked = target;
    }


    function makeExpandingRing(){
        var radius = 1;
        var click = _this.doc.createElement('div');
        click.style.width = 2*radius + 'px';
        click.style.height = 2*radius + 'px';
        click.style.backgroundColor = 'transparent';
        click.style.border = '2px solid rgba(255, 255, 0, 1)';
        click.style.borderRadius = '999px';
        click.style.zIndex = 10000;
        click.style.position = 'absolute';
        click.style.top = y - radius + 'px';
        click.style.left = x - radius + 'px';
        click.setAttribute("ignore", "true");
        _this.doc.body.appendChild(click);

        var rate = 50;
        var radiusIncrease = 2;
        var transparency = 1;
        var transparencyRate = .03;

        (function expand() {
            radius += radiusIncrease;
            transparency -= transparencyRate;
            click.style.border = '2px solid rgba(255, 255, 0, ' + transparency + ')';
            click.style.width = 2*radius + 'px';
            click.style.height = 2*radius + 'px';
            click.style.top = y - radius + 'px';
            click.style.left = x - radius + 'px';

            if(transparency > 0){
                setTimeout(expand, rate);
            } else {
                _this.doc.body.removeChild(click);
            }
        })();
    }

    var numRings = 6;
    var ringSpacing = 300;
    var ringCounter = 0;

    function doRings (){
        if(ringCounter < numRings){
            makeExpandingRing();
            ringCounter++;
            setTimeout(doRings, ringSpacing);
        }
    }
};

MouseMirror.prototype.off = function() {
  this.doc.removeEventListener('mousemove', this.moveEvent, false);
  this.doc.removeEventListener('click', this.clickEvent, false);
};


/*
 * Attach listeners to input elements so that they can be mirrored.
 * doc - The document to search for input elements
 * conn - The connection to use to send mirror updates about the inputs
 */
function MaqawInputMirror(doc, options){
    this.doc = doc;
    var _this = this;

    this.radioAndCheckbox = options.radioAndCheckbox;
    this.singleSelect = options.singleSelect;
    this.multipleSelect = options.multipleSelect;
    this.inputDefault = options.inputDefault;

    // attach listeners for form data
    var inputs, index;
    inputs = this.doc.getElementsByTagName('input');
    inputs = Array.prototype.slice.call(inputs);
    // include textareas
    var textareas = this.doc.getElementsByTagName('textarea');
    textareas = Array.prototype.slice.call(textareas);
    inputs = inputs.concat(textareas);
    for (index = 0; index < inputs.length; ++index) {
        var elem = inputs[index];

        // attach change listeners for radio and check buttons
        if(elem.type === 'radio' || elem.type === 'checkbox'){
            elem.addEventListener('change', this.radioAndCheckbox, false);
        }

        // listen to value for other input types
        else {
            elem.addEventListener('keyup', this.inputDefault, false);
        }
    }

    // listen for select fields
    // We need to differentiate between single select and multiple select
    var selects = this.doc.getElementsByTagName('select');
    for(index = 0; index < selects.length; index++){
        var selectNode = selects[index];
        if(selectNode.type === 'select-one'){
            selectNode.addEventListener('change', this.singleSelect, false);
        } else if (selectNode.type === 'select-multiple'){
            selectNode.addEventListener('change', _this.multipleSelect, false);
        }

    }
}

MaqawInputMirror.prototype.data = function(data){
    // get the DOM node that was changed
    var inputNode = maqawGetNodeFromHierarchy(this.doc, data.index);

    // set the checked attribute if applicable
    if(typeof data.checked !== 'undefined'){
        inputNode.checked = data.checked;
    }

    // check for select options
    else if (typeof data.selectedIndex !== 'undefined'){
        inputNode.selectedIndex = data.selectedIndex;
    }

    // check for multiple select options
    else if (typeof data.selectedOptions !== 'undefined'){
        var i, option, length = inputNode.options.length, selectedOptions = data.selectedOptions,
            optionsList = inputNode.options;
        for (i = 0; i < length; i++ ) {
            option = optionsList[i];
            var index = selectedOptions.indexOf(option.text);
            if(index !== -1){
                option.selected = true;
            } else {
                option.selected = false;
            }

        }
    }

    // otherwise set text value
    else {
        inputNode.value = data.text;
    }
};

MaqawInputMirror.prototype.off = function() {
    this.doc.removeEventListener('keyup', this.inputDefault, false);
    this.doc.removeEventListener('change', this.radioAndCheckbox, false);
    this.doc.removeEventListener('change', this.singleSelect, false);
    this.doc.removeEventListener('change', this.multipleSelect, false);
};
