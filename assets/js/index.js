'use strict';

var user = {};
var socket = io();
var slideState = '';

window.onload = function() {
    setUserName();
};
window.onbeforeunload = exit;

/**** Utility Functions *****/

//Slide panel object for menu items
var slidePanel = {
    open: function(panel, style) {
        var pos = parseInt(style.right.replace('px', ''));
        var id = setInterval(frame, 1);
        function frame() {
            if (pos === 0) {
                clearInterval(id);
            } else {
                pos++;
                panel.style.right = pos + 'px';
            }
        }
    },
    close: function(panel, style, width, callback) {
        var pos = 0;
        var id = setInterval(frame, 1);
        function frame() {
            if (pos === width) {
                clearInterval(id);
                callback();
            } else {
                pos--;
                panel.style.right = pos + 'px';
            }
        }
    },
    slide: function(panelContent) {
        var panel = document.getElementById('slide-panel');
        var width = panel.offsetWidth * -1;
        var style = window.getComputedStyle(panel, null);

        if (panelContent === slideState && style.right === '0px') {
            slidePanel.close(panel, style, width, function() {});
        } else if (style.right !== '0px') {
            setPanelContent(panelContent);
            slidePanel.open(panel, style);
        } else {
            slidePanel.close(panel, style, width, function() {
                setTimeout(function() {
                    setPanelContent(panelContent);
                    slidePanel.open(panel, style);
                }, 200);
            });
        }
        slideState = panelContent;
    }
};

function sendMessage() {
    var input = document.getElementById('message');
    var msg = input.value;
    if (msg) {
        socket.emit('msg', {message: msg, user: user});
        input.value = '';
        input.focus();
    }
}

function addKeypressEvents() {
    var input = document.getElementById('message');
    input.onkeydown = function(e) {
        if (e.which === 10 || e.which === 13) {
            sendMessage();

            return false;
        }
    };
    var textarea = document.getElementById('message');
    textarea.focus();
}

function setUserName() {
    user.name = prompt('Please enter your user name', 'Anonymous');
    user.name = user.name || 'Anonymous';
    socket.emit('setUsername', user.name);
}

function exit() {
    socket.emit('exit', user);
    document.getElementById('body').innerHTML = 'You have left.';
}

function changeName() {
    var input = document.getElementById('name-change');
    var newName = input.value;
    var oldName = user.name;
    if (newName) {
        user.name = newName;
        input.value = '';
        updateName(oldName);
    }
}

function updateName(oldName) {
    var nameDisplay = document.getElementById('name');
    nameDisplay.innerHTML = user.name;
    if (oldName) {
        var names = {
            old: oldName,
            new: user.name
        };
        socket.emit('updateName', names);
    }
}

function setPanelContent(content) {
    var settings = document.getElementById('settings');
    var users = document.getElementById('users');
    var all = document.querySelectorAll('.hidden');
    switch(content) {
        case 'settings':
            all.forEach(function(element) {
                element.classList.remove('hidden');
            });
            users.classList.add('hidden');
            break;
        case 'users':
            all.forEach(function(element) {
                element.classList.remove('hidden');
            });
            settings.classList.add('hidden');
            break;
        default:
            break;
    }
}

/**** Socket Events *****/

//User exists event
socket.on('userExists', function(data) {
    //turn into alert bar
    document.getElementById('error-container').innerHTML = data;
    setUserName();
});

//User set event
socket.on('userSet', function(data) {
    user = {
        id  : data.id,
        name: data.username
    };
    updateName('');
    addKeypressEvents();
});

//New message event
socket.on('newmsg', function(data) {
    if (user) {
        var className = (data.user.id === user.id) ? 'self' : '';
        var textContainer = document.getElementById('message-container');
        textContainer.innerHTML += '<div><b class="msg-username ' + className + '">' + data.user.name + '</b>: ' + data.message + '</div>';
        textContainer.scrollTop = textContainer.scrollHeight;
    }
});

//update user list
socket.on('updateUserList', function(data) {
    var list = document.getElementById('active-users-list');
    list.innerHTML = '';
    data.forEach(function(element) {
        var el = document.createElement('li');
        el.innerHTML = element.name;
        list.appendChild(el);
    });
});

socket.on('alertNewUser', function(data) {
    document.getElementById('message-container').innerHTML += '<div class="user-joined"><b>' + data + '</b> has joined the room</div>';
});

socket.on('alertUserLeft', function(data) {
    document.getElementById('message-container').innerHTML += '<div class="user-joined"><b>' + data + '</b> has left the room</div>';
});