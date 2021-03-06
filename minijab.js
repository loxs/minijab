var MINIJAB =  {
    connection: null,
    NS_MUC: 'http://jabber.org/protocol/muc',
    userLogin: null,
    mucRooms: []
};

MINIJAB.connect = function(ev, data){
    var conn = new Strophe.Connection(MINIJAB.bosh_url);
    conn.connect(data.jid, data.password, function(status){
	if (status === Strophe.Status.CONNECTING){
	    $('#connStatusIndicator').html('Connecting...');
	} else if (status === Strophe.Status.AUTHENTICATING){
	    $('#connStatusIndicator').html('Authenticating...');
	} else if (status === Strophe.Status.CONNECTED){
	    $(document).trigger('connected');
	} else if (status === Strophe.Status.DISCONNECTING){
	    $('#connStatusIndicator').html('Disconnecting...');
	} else if (status === Strophe.Status.DISCONNECTED){
	    $('#connStatusIndicator').html('Disconnected');
	    MINIJAB.connection = null;
	    MINIJAB.showLoginDialog('Disconnected from server. Please, try again.');
	} else if (status === Strophe.Status.CONNFAIL){
	    $('#connStatusIndicator').html('Disconnected');
	    MINIJAB.showLoginDialog('Connection Failure. Please, try again.');
	} else if (status === Strophe.Status.AUTHFAIL){
	    $('#connStatusIndicator').html('Disconnected');
	    MINIJAB.showLoginDialog('Wrong user or password.');
	}
    });
    MINIJAB.connection = conn;
};

MINIJAB.showLoginDialog = function(message){
    /*$('#login_dialog').dialog({
	autoOpen: true,
	draggable: false,
	modal: true,
	title: 'Welcome!',
	buttons: {
	    "Connect": function(){
		MINIJAB.userLogin = $('#jid').val();
		var userJid = $('#jid').val(), userPass = $('#password').val();
		if (userJid.indexOf('@') == -1){
		    userJid += ('@' + MINIJAB.anonymous_domain);
		}
		$(document).trigger('connect', {jid: userJid, password: userPass});
		$('#password').val('');
		$(this).dialog('close');
	    }    
	}
    });
    $('#loginMessage').html(message);*/
    $('#anonymous_login_dialog').dialog(
	{
	    autoOpen: true,
	    draggable: false,
	    modal: true,
	    title: 'Welcome!',
	    buttons: {
		"Connect": function(){
		    MINIJAB.userIdent = $('#anonymous_login').val();
		    MINIJAB.anonymousNode = Sha1.hash(MINIJAB.userIdent).substring(0,12);
		    MINIJAB.anonymousJid = MINIJAB.anonymousNode + '@' + MINIJAB.anonymous_domain;
		    MINIJAB.anonymousJid += '/minijab';
		    $(document).trigger('connect', {jid: MINIJAB.anonymousJid, password: ''});
		    $(this).dialog('close');
		}
	    }
	}
    );
};

MINIJAB.createChannel = function(chanid, chanLabel, chanJid, msgType){
    if (!$(chanid).length){
	$('#channels').tabs("add", chanid, chanLabel);
	$(chanid).addClass('scrollable')
	    .attr('jid', chanJid).attr('msgType', msgType);
    }
};

MINIJAB.handlePresence = function(presence){
    var from = $(presence).attr('from');
    var bareJid = Strophe.getBareJidFromJid(from);
    if ($(presence).attr('type') === 'error') {
	alert('Error joining room, try to reload the page');
    } else {
	if (MINIJAB.mucRooms.indexOf(bareJid) != -1){
	    MINIJAB.createChannel('#' + Sha1.hash(bareJid),
				  Strophe.getNodeFromJid(from),
				  bareJid, 'groupchat');
	}
    }
    return true;
};

MINIJAB.addMessageToChannel = function(jid, message, chanid){
    var vars = {jid: jid, msg: message};
    var template = '<p class="message"><span>{{jid}}</span>: {{msg}}</p>'; 
    $('#' + chanid).append(Mustache.to_html(template, vars)).scrollTop(100000);
    var tab = $('#tab-' + chanid);
    if (!tab.parent().hasClass('ui-tabs-selected')){
	tab.addClass('new-message').effect('highlight', null, 1000);	
    }
};

MINIJAB.handleMessage = function(message){
    var msgType = $(message).attr('type');
    var from = $(message).attr('from');
    var bareJid = Strophe.getBareJidFromJid(from);
    var fromName = Strophe.getResourceFromJid(from);
    if (msgType === 'groupchat'){
	var chanid = Sha1.hash(bareJid);
    } else if (msgType === 'chat') {
	if (MINIJAB.mucRooms.indexOf(bareJid) != -1){
	    var chanid = Sha1.hash(from);
	} else {
	    fromName = Strophe.getNodeFromJid(from);
	}
	MINIJAB.createChannel('#' + chanid, fromName, from, 'chat');
    }
    MINIJAB.addMessageToChannel(fromName,
				$(message).children('body').text(),
				chanid);
    return true;
};

MINIJAB.connected = function(){
    MINIJAB.connection.addHandler(MINIJAB.handleMessage, null, "message");
    MINIJAB.connection.addHandler(MINIJAB.handlePresence, null, "presence");
    MINIJAB.connection.send($pres());
    $('#connStatusIndicator').html('Connected');
    var roomJid = MINIJAB.anonymousNode + '@' + MINIJAB.conference;
    MINIJAB.mucRooms.push(roomJid);
    MINIJAB.joinRoom(roomJid + '/' + MINIJAB.userIdent);
    $('#channels').tabs("remove", 0);
    return true;
};

MINIJAB.joinRoom = function(room){
    MINIJAB.connection.send($pres({to: room}).c('x',{xmlns: MINIJAB.NS_MUC}));
};

MINIJAB.chatInputEnter = function(e) {
    if (e.which == 13 /* Return */) {
        e.preventDefault();
	var activeChan = $('.ui-tabs-panel').not('.ui-tabs-hide');
	var msgType = activeChan.attr('msgType');
	var chatinp = $("#chatinput");
	if (msgType == 'chat'){
	    var sendTo  = activeChan.attr('jid');
	    MINIJAB.addMessageToChannel(MINIJAB.userIdent,
					chatinp.val(),
					activeChan.attr('id'));
	} else {
	    var sendTo  = Strophe.getBareJidFromJid(activeChan.attr('jid'));
	}
	var msg = $msg({to: sendTo, type: msgType}).c('body').t(chatinp.val());
	console.log(sendTo);
	MINIJAB.connection.send(msg);
        chatinp.val('');
    }
};

MINIJAB.tabAdded = function(event, ui){
    $(ui.tab).attr('id', 'tab-' + $(ui.panel).attr('id'));
};
MINIJAB.tabShown = function(event, ui){
    $(ui.tab).removeClass('new-message');
    $('#chatinput').focus();
};

$('document').ready(
    function(){
	$('#channels').tabs({add: MINIJAB.tabAdded,
			     show: MINIJAB.tabShown});
	$(document).bind('connect', MINIJAB.connect);
	$(document).bind('connected', MINIJAB.connected);
	$('#chatinput').bind('keydown', MINIJAB.chatInputEnter);
	$("a", ".demo").click(function() { return false; });
	MINIJAB.showLoginDialog();
    }
);