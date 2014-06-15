//(function($){


var smile = {
//    ':)': '<img src="http://www.matcuoi.com/smiley/sm2nini15.gif">',
    ':)': '<img src="/images/icons/1.gif">',
    ':(': '<img src="/images/icons/2.gif">',
    ';)': '<img src="/images/icons/3.gif">',
    ':d': '<img src="/images/icons/4.gif">',
    ':x': '<img src="/images/icons/8.gif">',
    'x(': '<img src="/images/icons/14.gif">',
    ':-s': '<img src="/images/icons/17.gif">',
    ':-((': '<img src="/images/icons/20.gif">',
    ':|': '<img src="/images/icons/22.gif">',
    ':-?': '<img src="/images/icons/39.gif">',
    ':-))': '<img src="/images/icons/21.gif">',
    ':-ss': '<img src="/images/icons/42.gif">',
    ':-w': '<img src="/images/icons/45.gif">',
    '=))': '<img src="/images/icons/24.gif">'

};

// create global app variable...
var NICK_MAX_LENGTH = 15,
	ROOM_MAX_LENGTH = 10,
	lockShakeAnimation = false,
	socket = null,
	clientId = null,
	nickname = null,
    avatar = '/images/git.jpg',

	// holds the current room we are in
	currentRoom = null,

	// server information
	serverAddress = 'http://localhost',
	serverDisplayName = 'Server',
	serverDisplayColor = '#1c5380',
    


	// some templates we going to use in the chat,
	// like message row, client and room, this
	// templates will be rendered with jQuery.tmpl
	tmplt = {
		room: [
			'<li data-roomId="${room}">',
			'<span class="icon"></span> ${room}',
			'</li>'
		].join(""),
		client: [
			'<li data-clientId="${clientId}" id="${clientId}" class="cf">',
			'<div class="fl clientName" style="margin-top: 7px; margin-left: 7px;"><span class="icon"></span> ${nickname}</div>',
            '<form action="/images/uploads" method="post" enctype="multipart/form-data" style="display: none;"><input type="file" id="fileUpload"></form>',
            '<img src="${avatar}" class="pull-right img-profile" width="32px" height="32px" style="border-radius: 5px; box-shadow: 0 2px 3px #000;">',
			'<div class="fr composing"></div>',
			'</li>'
		].join(""),
		message: [
			'<li class="cf">',
            '<p>',
			'<span class="fl sender">${sender}: </span><span class="fl text">{{html text}}</span><span class="fr time">${time}</span>',
            '</p>',
			'</li>'
		].join("")
	};




// bind DOM elements like button clicks and keydown
function bindDOMEvents(){
	
	$('.chat-input input').on('keydown', function(e){
		var key = e.which || e.keyCode;
		if(key == 13) { handleMessage(); }
	});

	$('.chat-submit button').on('click', function(){
		handleMessage();
	});

	$('#nickname-popup .input input').on('keydown', function(e){
		var key = e.which || e.keyCode;
		if(key == 13) { 
            handleNickname(); 
        }
	});

	$('#nickname-popup .begin').on('click', function(){
		handleNickname();
	});
	
	$('#addroom-popup .input input').on('keydown', function(e){
		var key = e.which || e.keyCode;
		if(key == 13) { createRoom(); }
	});

	$('#addroom-popup .create').on('click', function(){
		createRoom();
	});

	$('.big-button-green.start').on('click', function(){
		$('#nickname-popup .input input').val('');
		Avgrund.show('#nickname-popup');
		window.setTimeout(function(){
	        $('#nickname-popup .input input').focus();
	    },100);
	});

	$('.chat-rooms .title-button').on('click', function(){
		$('#addroom-popup .input input').val('');
		Avgrund.show('#addroom-popup');
		window.setTimeout(function(){
	        $('#addroom-popup .input input').focus();
	    },100);
	});

	$('.chat-rooms ul').on('scroll', function(){
		$('.chat-rooms ul li.selected').css('top', $(this).scrollTop());
	});

	$('.chat-messages').on('scroll', function(){
		var self = this;
		window.setTimeout(function(){
			if($(self).scrollTop() + $(self).height() < $(self).find('ul').height()){
				$(self).addClass('scroll');
			} else {
				$(self).removeClass('scroll');
			}
		}, 50);
	});

	$('.chat-rooms ul li').live('click', function(){
		var room = $(this).attr('data-roomId');
		if(room != currentRoom){
			socket.emit('unsubscribe', { room: currentRoom });
			socket.emit('subscribe', { room: room });
		}
	});
    

    
    $('.right img').on('click', function() {
        $('.modalEmo').toggle();
    });
    
    $('.modalEmo').on('click', function() {
        $(this).hide();
    });
    
    
    $('.listEmo li img').on('click', function() {
        var smi = '<img src="' +$(this).attr('src') + '">';

        for(var pro in smile) {
            if (smile[pro] == smi) {
                $('.inputDiv input').val(pro);
                $('.inputDiv input').focus();
            }
        }
    });
    
    // Transfer file to server
    $('#file img').on('click', function() {
        $('#filetrans').click();
    });
    
    
    $('.chat-private').on('click', function() {
        alert('hehe');
    });
    
    $('.chat-private-title').on('click', function() {
        chatpri();
    });
    
}

var chatpri = function() {
    if($('.nga').hasClass('abc')) {
        $('.nga').removeClass('abc');
    } else {
        $('.nga').addClass('abc');
    }
};

function checkTime(i) {
    if (i<10) {
        i = "0" + i;
    };  // add zero in front of numbers < 10
    return i;
}

var startTime = function () {
    var today=new Date();
    var h=today.getHours();
    var m=today.getMinutes();
    var s=today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('clock').innerHTML = h+":"+m+":"+s;
    var t = setTimeout(function(){
        startTime();
    },500);
};



// bind socket.io event handlers
// this events fired in the server
function bindSocketEvents(){

	// when the connection is made, the server emiting
	// the 'connect' event
	socket.on('connect', function(){
		// firing back the connect event to the server
		// and sending the nickname for the connected client
		socket.emit('connect', { nickname: nickname, avatar: avatar });
	});
	
	// after the server created a client for us, the ready event
	// is fired in the server with our clientId, now we can start 
	socket.on('ready', function(data){
		// hiding the 'connecting...' message
		$('.chat-shadow').animate({ 'opacity': 0 }, 200, function(){
			$(this).hide();
			$('.chat input').focus();
		});
		
		// saving the clientId localy
		clientId = data.clientId;
	});
    
    
    socket.on('changeAvatar', function(data) {
        var s = "#" + data.client.clientId + " img";
//        console.log(data.data);
        $(s).attr('src', data.data);
//        document.getElementById("data.client.clientId");
    });

	// after the initialize, the server sends a list of
	// all the active rooms
	socket.on('roomslist', function(data){
		for(var i = 0, len = data.rooms.length; i < len; i++){
			// in socket.io, their is always one default room
			// without a name (empty string), every socket is automaticaly
			// joined to this room, however, we don't want this room to be
			// displayed in the rooms list
			if(data.rooms[i] != ''){
				addRoom(data.rooms[i], false);
			}
		}
	});

	// when someone sends a message, the sever push it to
	// our client through this event with a relevant data
	socket.on('chatmessage', function(data){
		var nickname = data.client.nickname;
		var message = data.message;
        var avatar = data.client.avatar;
		console.log(data);
        // Insert smile in chat
		for(var pro in smile) {
            message = message.replace(pro, smile[pro]);
        }
		//display the message in the chat window
		insertMessage(nickname, message, true, false, false, avatar);
	});
	
	// when we subscribes to a room, the server sends a list
	// with the clients in this room
	socket.on('roomclients', function(data){
		
		// add the room name to the rooms list
		addRoom(data.room, false);

		// set the current room
		setCurrentRoom(data.room);
		
        
//        console.log(data);
		// announce a welcome message
		insertMessage(serverDisplayName, 'Welcome to the room: `' + data.room + '`... enjoy!', true, false, true);
		$('.chat-clients ul').empty();
		
		// add the clients to the clients list
		addClient({ nickname: nickname, clientId: clientId }, false, true);
        
        
        // $('.notme').on('click', function() {
        //     alert('test');
        // });
        
		for(var i = 0, len = data.clients.length; i < len; i++){
			if(data.clients[i]){
				addClient(data.clients[i], false);

			}
		}
        
        

        
		// hide connecting to room message message
		$('.chat-shadow').animate({ 'opacity': 0 }, 200, function(){
			$(this).hide();
			$('.chat input').focus();
		});
	});
	
	// if someone creates a room the server updates us
	// about it
	socket.on('addroom', function(data){
		addRoom(data.room, true);
	});
	
	// if one of the room is empty from clients, the server,
	// destroys it and updates us
	socket.on('removeroom', function(data){
		removeRoom(data.room, true);
	});
	
	// with this event the server tells us when a client
	// is connected or disconnected to the current room
	socket.on('presence', function(data){
		if(data.state == 'online'){
			addClient(data.client, true);
		} else if(data.state == 'offline'){
			removeClient(data.client, true);
		}
	});
}

// add a room to the rooms list, socket.io may add
// a trailing '/' to the name so we are clearing it
var addRoom = function (name, announce){
	// clear the trailing '/'
	name = name.replace('/','');

	// check if the room is not already in the list
	if($('.chat-rooms ul li[data-roomId="' + name + '"]').length == 0){
		$.tmpl(tmplt.room, { room: name }).appendTo('.chat-rooms ul');
		// if announce is true, show a message about this room
		if(announce){
			insertMessage(serverDisplayName, 'The room `' + name + '` created...', true, false, true);
		}
	}
}

// remove a room from the rooms list
function removeRoom(name, announce){
	$('.chat-rooms ul li[data-roomId="' + name + '"]').remove();
	// if announce is true, show a message about this room
	if(announce){
		insertMessage(serverDisplayName, 'The room `' + name + '` destroyed...', true, false, true);
	}
}

// add a client to the clients list
var addClient = function (client, announce, isMe){
	var $html = $.tmpl(tmplt.client, client);

    $html.appendTo('.chat-clients ul');
    
    // if this is our client, mark him with color
	if(isMe){
		$html.addClass('me');
        
        $('.me .img-profile').on('click', function() {
            changeAvatar();
        });        
        
	} else {
        $html.addClass('notme');
        // var idCl = '#' + $('.notme').attr('id');
        // console.log(idCl);
        // $(idCl).on('click', function() {
        //     alert('haha');
        // });
        
        
        // $('.notme').on('click', function() {
        //     socket.emit('hehe', 'day la hehe');
        //     socket.on('chatpri', function(data) {
        //         console.log(data.nickname);
        //         $('.nga .chat-private-title').html(data.nickname);
        //     });
        //     $('.nga').toggle();
            
        // });
        
        // if(!$('.chat-clients ul li').hasClass('me')) {
        //     console.log('exist');
        // } else {
        //     console.log('empty');
        // }
    }
    


	// if announce is true, show a message about this client
	if(announce){
		insertMessage(serverDisplayName, client.nickname + ' has joined the room...', true, false, true);
	}

};

var test = function(evt) {
    var files = evt.target.files;
    if (files.length != 0) {
        var f = files[0];
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function(theFile) {
            return function(e) {
                var pic = $(".me .img-profile");
                pic.attr('src', e.target.result);
                socket.emit('change', e.target.result);
//                console.log(e.target.result);
            };
        })(f);
        reader.readAsDataURL(f);

//        console.log(reader.readAsDataURL(f));
//        console.log(f.name);
    } else {
        console.log('chua chon');
    }
//    console.log(files);
};


var changeAvatar = function() {
    document.getElementById("fileUpload").click();
    document.getElementById('fileUpload').addEventListener('change', test, false);
    
};    

// remove a client from the clients list
var removeClient = function (client, announce){
	$('.chat-clients ul li[data-clientId="' + client.clientId + '"]').remove();
	
    
	// if announce is true, show a message about this room
	if(announce){
		insertMessage(serverDisplayName, client.nickname + ' has left the room...', true, false, true);
	}
};


// every client can create a new room, when creating one, the client
// is unsubscribed from the current room and then subscribed to the
// room he just created, if he trying to create a room with the same
// name like another room, then the server will subscribe the user
// to the existing room
var createRoom = function (){
	var room = $('#addroom-popup .input input').val().trim();
	if(room && room.length <= ROOM_MAX_LENGTH && room != currentRoom){
		
		// show room creating message
		$('.chat-shadow').show().find('.content').html('Creating room: ' + room + '...');
		$('.chat-shadow').animate({ 'opacity': 1 }, 200);
		
		// unsubscribe from the current room
		socket.emit('unsubscribe', { room: currentRoom });

		// create and subscribe to the new room
		socket.emit('subscribe', { room: room });
		Avgrund.hide();
        $('.chat-messages ul').empty();
	} else {
		shake('#addroom-popup', '#addroom-popup .input input', 'tada', 'yellow');
		$('#addroom-popup .input input').val('');
	}
}

// sets the current room when the client
// makes a subscription
var setCurrentRoom = function (room){
	currentRoom = room;
	$('.chat-rooms ul li.selected').removeClass('selected');
	$('.chat-rooms ul li[data-roomId="' + room + '"]').addClass('selected');
}

// save the client nickname and start the chat by
// calling the 'connect()' function
var handleNickname = function (){
	var nick = $('#nickname-popup .input input').val().trim();
	if(nick && nick.length <= NICK_MAX_LENGTH){
		nickname = nick;
		Avgrund.hide();
		connect();
	} else {
		shake('#nickname-popup', '#nickname-popup .input input', 'tada', 'yellow');
		$('#nickname-popup .input input').val('');
	}
}

// handle the client messages
function handleMessage(){
	var message = $('.chat-input input').val().trim();


	if(message){

		// send the message to the server with the room name
		socket.emit('chatmessage', { message: message, room: currentRoom });
        
        // Insert smile in chat
		for(var pro in smile) {
            message = message.replace(pro, smile[pro]);
        }
        
		// display the message in the chat window
		insertMessage(nickname, message, true, true);
        
//        $('#mess').tmpl(smile).appendTo('.chat-messages ul');

		$('.chat-input input').val('');
	} else {
		shake('.chat', '.chat input', 'wobble', 'yellow');
	}
}


// insert a message to the chat window, this function can be
// called with some flags
function insertMessage(sender, message, showTime, isMe, isServer, avatar){
	var $html = $.tmpl(
        tmplt.message, {
            avatar: avatar,
			sender: sender,
			text: message,
			time: showTime ? getTime() : ''
		});

	// if isMe is true, mark this message so we can
	// know that this is our message in the chat window
    
	if(isMe){
		$html.addClass('marker');
	} else if(!isServer) {
        $html.addClass('notmarker');
    }

	// if isServer is true, mark this message as a server
	// message
	if(isServer){
        $html.addClass('server');
		$html.find('.sender').css('color', serverDisplayColor);
	}
    
	$html.appendTo('.chat-messages ul');
    
	$('.chat-messages').animate({ scrollTop: $('.chat-messages ul').height() }, 100);
}

// return a short time format for the messages
var getTime = function (){
	var date = new Date();
	return (date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours()) + ':' +
		(date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes());
};
// just for animation
var shake = function (container, input, effect, bgColor){
	if(!lockShakeAnimation){
		lockShakeAnimation = true;
		$(container).addClass(effect);
		$(input).addClass(bgColor);
		window.setTimeout(function(){
			$(container).removeClass(effect);
			$(input).removeClass(bgColor);
			$(input).focus();
			lockShakeAnimation = false;
		}, 1500);
	}
}

// after selecting a nickname we call this function
// in order to init the connection with the server
var connect = function (){
	// show connecting message
	$('.chat-shadow .content').html('Connecting...');
	
	// creating the connection and saving the socket
    //		socket = io.connect(serverAddress);
    socket = io.connect();
	
	// now that we have the socket we can bind events to it
	bindSocketEvents();
    


}

// on document ready, bind the DOM elements to events
//	$(function(){
$(document).ready(function(){
	bindDOMEvents();
    $('.modalEmo').hide();
    $('.nga').hide();
    startTime();
});

//})(jQuery);
