/*
 MaqawManager is the top level class for managing the Maqaw client
 */
function MaqawManager(display) {
    var key = 'cat',
        host= 'ec2-54-212-11-221.us-west-2.compute.amazonaws.com',
        port= 3000;

    this.id;
    var that = this;
    this.visitors = [];

    var that = this;
    this.activeSession = undefined;
    this.maqawDisplay = display;
    this.peer = new Peer({key: key, host: host, port: port});
    /* listen for peer js events */
    this.peer.on('open', function(id) {
        that.id = id;
    });

    this.peer.on('clients', function(clients) {
        console.log(clients);
        that.visitors = clients;
        that.activeSession && that.activeSession.setVisitors && that.activeSession.setVisitors(clients);
    });

    this.peer.on('representatives', function(reps) {
        console.log(reps.msg);
    });

    this.updateDisplay = function () {
        that.maqawDisplay.setHeaderContents(that.activeSession.getHeaderContents());
        that.maqawDisplay.setBodyContents(that.activeSession.getBodyContents());
    }

    this.loginClicked = function () {
        /*
        maqawAjaxPost(host+':'+port, params, function(){
            that.clientSession = that.activeSession;
            that.activeSession = new RepSession(that);
            that.updateDisplay();
        });     */
        $.ajax({
            type: 'POST',
            url: "http://ec2-54-212-11-221.us-west-2.compute.amazonaws.com:3000/login",
            data: { username: 'additt', password: 'MapleAdditt', user : { id: that.id, key: key} },
            success: function() {
                that.clientSession = that.activeSession;
                that.activeSession = new RepSession(that);
                that.updateDisplay();
            }
        });
    }

    this.logoutClicked = function () {
        that.repSession = that.activeSession;
        that.activeSession = that.clientSession;
        that.updateDisplay();
    }
}

MaqawManager.prototype.setActiveSession = function (session) {
    this.activeSession = session;
}


