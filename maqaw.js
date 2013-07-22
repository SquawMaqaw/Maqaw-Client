/*
 This file generates a Maqaw client that can be loaded onto a site
 */

// start by creating the display
var maqawDisplay = new MaqawDisplay(false);
maqawDisplay.setup();

// Initialize the MaqawManager to deal with clients and representatives
var maqawManager = new MaqawManager(maqawDisplay);

// start a visitor session
maqawManager.startVisitorSession();

// try to restore a previously logged in rep session if one exists

var maqawRepSessionStarted = maqawManager.loadRepSession();

// if no rep session could be loaded, display the visitor session
if(!maqawRepSessionStarted){
    maqawManager.showVisitorSession();
}

