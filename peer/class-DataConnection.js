function DataConnection(options) {
  this.src = options.src;
  this.dst = options.dst;
  this.options = options.options;
  this.open = false;

  // Establish connection to socket
  var socketUrl = 'http://' + this.options.host + ':' + this.options.port;
  this.socket = io.connect(socketUrl);
}

DataConnection.prototype.send = function(data) {
  console.log("we are sending a message");
  console.log(data);
  console.log(this);
  this.socket.emit('send', { src: this.src, dst: this.dst, message: data });
};

DataConnection.prototype.close = function(data) {
  if (!this.open) return;
  this._cleanUp();
}

DataConnection.prototype._cleanUp = function() {
  this.open = false;
  this.socket.emit('close', { src: this.src, dst: this.dst });
}

DataConnection.prototype.on = function(event, cb) {
  if (event == 'open') event = 'connection open';

  var that = this;
  this.socket.on(event, function(data) {
    switch (event) {
      case "connection open":
        if (that.src == data.src && that.dst == data.dst) {
          console.log("success in firing connection open cb for");
          that.open = true;
          console.log(that);
          cb(data);
        }
        break;
      case "data":
        console.log("got data event with open of");
        console.log(that.open);
        if (that.dst == data.src && that.src == data.dst && that.open == true) {
          console.log("success in firing data cb");
          console.log("the open status is:");
          console.log(that.open);
          cb(data);
        }
        break;
      case "close":
        if (that.src == data.src && that.dst == data.dst) {
          console.log("success in firing close cb for");
          that.open = false;
          console.log(that);
          cb(data);
        }
        break;
      default:
        console.log("fired default cb");
        cb(data);
        break;
    }
  });
}
