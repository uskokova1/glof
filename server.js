const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

players = {};

class Player
{

    constructor(socketID, ballObj, name, room)
    {
        this.socketID = socketID;
        this.ballObj = ballObj;
        this.name = name;
        this.room = room;
        players[socketID] = this;
        //players.push(this);
    }

}

const myserver = http.createServer(function (req, res) {
    const urlObj = url.parse(req.url, true);
    //console.log(req.url);
    //console.log(urlObj);

    switch(urlObj.pathname.slice(1)){
        case "data": //each case will be a queury such as cancel or schedule from the homework
            writeEnd("Day not valid");
            break;
        default:
            none(); //this needs a better name lol :P
            break;
    }

    function none(){
        if (urlObj.path == "/"){
            newPath = "./main_menu.html";
        }else {
            newPath = "."+urlObj.pathname;
        }
        //console.log(newPath);
        sendFile(newPath);
    }


    function sendFile(pathIn) { //changes content type in the header based on what file type user wants
        fs.readFile(pathIn, function (err, content) {
            switch (path.extname(pathIn)) {
                case ".png":
                    res.writeHead(200, {'Content-Type': 'image/png'});
                    break;
                case ".html":
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    break;
                case ".css":
                    res.writeHead(200, {'Content-Type': 'text/css'});
                    break;
                case ".ico":
                    res.writeHead(200, {'Content-Type': 'image/vnd.microsoft.icon'});
                    break;
                case ".js":
                    res.writeHead(200, {'Content-Type': 'text/javascript'});
                    break;
                case ".php":
                    res.writeHead(200, {'Content-Type': 'text/javascript'});
                    break;
                default:
                    break;
            }
            res.write(content);
            res.end();
        });
    }
});

const io = require('socket.io')(myserver,{
    cors: {origin: '*'} //any url can access our backend
});


myserver.listen(80); //the server object listens on port 8080



const Matter = require("matter-js");
// module aliases
var Engine = Matter.Engine,
    Render = Matter.Render,
    Runner = Matter.Runner,
    Bodies = Matter.Bodies,
    Composite = Matter.Composite;
// create an engine
var engine = Engine.create();
engine.gravity.y = 0
// create two boxes and a ground

var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
// add all of the bodies to the world
Composite.add(engine.world, [ground]);

frameRate = 16.666

setInterval(() => {
  Engine.update(engine, frameRate);
    //io.emit("updateAll",JSON.stringify(players));

    for (const [id, playerObj] of Object.entries(players)) {
        //console.log(id, playerObj);
        io.emit('updateAll',
            playerObj.ballObj.position.x,
            playerObj.ballObj.position.y,
            playerObj.ballObj.velocity.x,
            playerObj.ballObj.velocity.y,
            playerObj.socketID);
    }

    /*
     for (let i = 0; i < players.length; i++) {
         io.emit('update', players[i].ball.position.x, players[i].ball.position.y,players[i].socketID);
     }*/
}, frameRate);


io.on('connection', function(socket) {
    console.log(socket.id);
    new Player(socket.id,
        Bodies.circle(Math.random()*250, Math.random()*250, 20, {
        frictionAir:0.05,
        restitution:0.8
    })
    );
    Composite.add(engine.world,players[socket.id].ballObj);
    socket.emit('init', players[socket.id].x,players[socket.id].y,socket.id);


    socket.on('disconnect', () => {
        socket.emit('removePlayer', socket.id);
        console.log('user disconnected');
        delete players[socket.id]
    });

    socket.on('updateSelf', (x,y,velx,vely) => {
        players[socket.id].x = x;
        players[socket.id].y = y;
        players[socket.id].velx = velx;
        players[socket.id].vely = vely;
    });

    socket.on('click', (pos,force,sock) => {
        //console.log(players);

        //pos = Matter.Vector.create(boxA.position.x, boxA.position.y);
        Matter.Body.applyForce(players[sock].ballObj, pos, force);
    })

});