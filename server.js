const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

let boxApos = [400,200];

const myserver = http.createServer(function (req, res) {
    const urlObj = url.parse(req.url, true);

    // console.log(req.url);
    // console.log(urlObj);

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
            newPath = "./frontend.html";
        }else {
            newPath = "."+urlObj.path;
        }
        console.log(newPath);
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
var boxA = Bodies.circle(400, 200, 20);
var boxB = Bodies.circle(450, 50, 20);
boxA.frictionAir = 0.05;
boxB.frictionAir = 0.05;
boxA.restitution = 0.8;
boxB.restitution = 0.8;
var ground = Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
// add all of the bodies to the world
Composite.add(engine.world, [boxA, boxB, ground]);
frameRate = 16.666

setInterval(() => {
  Engine.update(engine, frameRate);
  io.emit("update", {
    boxApos: [boxA.position.x, boxA.position.y] //,
  });
}, frameRate);


io.on('connection', function(socket) {
    console.log(socket.id);

    socket.on('message', function(data) {
        console.log(data);
        io.emit('message', data);
    });
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('click', (force) => {
        pos = Matter.Vector.create(boxA.position.x, boxA.position.y);
        Matter.Body.applyForce(boxA, pos, force);
    })
});