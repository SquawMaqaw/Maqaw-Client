/*
 This file generates a Maqaw client that can be loaded onto a site
 */

// start by creating the display
// pass true to start the client minimized, or false to default to maximize
var maqawDisplay = new MaqawDisplay(!maqawDebug);
maqawDisplay.setup();

// Initialize the MaqawManager to deal with clients and representatives
var maqawManager = new MaqawManager(maqawOptions, maqawDisplay);

// start a visitor session
maqawManager.startVisitorSession();

// try to restore a previously logged in rep session if one exists

var maqawRepSessionStarted;
maqawRepSessionStart = maqawManager.loadRepSession();

// if no rep session could be loaded, display the visitor session
if(!maqawRepSessionStarted){
    maqawManager.showVisitorSession();
}

