'use strict';

var user = {};
var socket = io();
var slideState = '';

window.onload = function() {
    setUserName();
};
window.onbeforeunload = exit;

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
        document.getElementById('message-container').innerHTML += '<div><b class="' + className + '">' + data.user.name + '</b>: ' + data.message + '</div>';
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

socket.on('test', function(data) {
    console.log(data);
});

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
    document.body.innerHTML = 'You have left.';
    socket.emit('exit', user);
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
    }
};

function slide(panelContent) {
    console.log('slideState', slideState);
    console.log('panelContent', panelContent);
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