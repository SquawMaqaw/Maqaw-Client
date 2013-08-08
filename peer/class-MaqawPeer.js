/**
 * Peer - connect with other Peers to send data
 */
function MaqawPeer(id, options) {
  // id acts as options when user doesn't pass in id
  if (id && id.constructor == Object) {
    options = id;
    id = undefined;
  }

  console.log("Initing a new MaqawPeer instance");
  console.log(id);
  console.log(options);

  // Ensure host, port, key exist
  if (!options.host || !options.port || !options.key) {
    console.log("Missing options: host, port, or key");
  }

  // Save the options
  this.options = options;

  // States
  this.destroyed = false;
  this.disconnected = false;

  // Connections
  this.connections = {};

  // Setup id
  this.id = id || null;

  // Establish connection to socket
  var socketUrl = 'http://' + options.host + ':' + options.port;
  this.socket = io.connect(socketUrl);
  this.socket.emit('init connect', { id: this.id, name: options.key, representative: options.representative });
}

// Connect to another peer
MaqawPeer.prototype.connect = function(id) {
  this.socket.emit('connect', { src: this.id, dst: id});
  var dataConnection = new DataConnection({ options: this.options, src: this.id, dst: id });
  return dataConnection;
};

// Poll for data 
MaqawPeer.prototype.poll = function(request) {
  this.socket.emit('poll', request);
};

// Setup an event listener
MaqawPeer.prototype.on = function(event, cb) {
  if (event == 'open') event = 'peer open';
  if (event == 'connection') {
    var self = this;
    this.socket.on('connection', function(data) {
      var dataConnection = new DataConnection({ options: self.options, src: data.src, dst: data.dst });
      console.log("what the data connection looks like");
      console.log(dataConnection);
      cb(dataConnection);
    });
  } else {
    this.socket.on(event, function(data) {
      cb(data);
    });
  }
};
