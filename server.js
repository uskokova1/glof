const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const Matter = require("matter-js");

//players = {};
games = {};

class Game{

    constructor(code)
    {
        this.players = {};
        // module aliases
        this.Engine = Matter.Engine,
        this.Render = Matter.Render,
        this.Runner = Matter.Runner,
        this.Bodies = Matter.Bodies,
        this.Composite = Matter.Composite;
// create an engine
        this.engine = this.Engine.create();
        this.engine.gravity.y = 0
// create two boxes and a ground

        this.frameRate = 16.666;

        this.code = code;
        games[code] = this;

        //adding a hole for the glof ball to go int
        this.hole = this.Bodies.circle(500, 500, 0.05, {
            isStatic: true,
            isSensor: true,
            render: {
                fillStyle: 'black'
            }
        });
        this.Composite.add(this.engine.world, this.hole);

        Matter.Events.on(this.engine, 'collisionStart', (event) => {
            const pairs = event.pairs;

            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;

                for (const [id, playerObj] of Object.entries(this.players)) {
                    if (
                        (bodyA === playerObj.ballObj && bodyB === this.hole) ||
                        (bodyB === playerObj.ballObj && bodyA === this.hole)
                    ) {
                        console.log(`Player ${id} scored!`);
                        io.to(this.code).emit('playerScored', id);

                        // Reset player ball position or take other action
                        Matter.Body.setPosition(playerObj.ballObj, { x:Math.random()*5+250, y:Math.random()*5+550 });
                        Matter.Body.setVelocity(playerObj.ballObj, { x: 0, y: 0 });
                    }
                }
            }
        });


        this.ground = this.Bodies.rectangle(400, 610, 810, 60, { isStatic: true});
        this.g1 = this.Bodies.rectangle(800, 400, 30, 600, { isStatic: true});
        this.g2 = this.Bodies.rectangle(400, 450, 30, 355, { isStatic: true});
        this.g3 = this.Bodies.rectangle(400, 400, 500, 30, { isStatic: true});
        this.g4 = this.Bodies.rectangle(400, 100, 850, 30, { isStatic: true});
        this.g6 = this.Bodies.rectangle(0, 300, 30, 600, { isStatic: true});
        this.g5 = this.Bodies.circle(400, 125, 30, { isStatic: true});

        this.Composite.add(this.engine.world, [this.ground,this.g1,this.g2,this.g3,this.g4,this.g5,this.g6]);

    }


    addPlayer = function(player){
        //console.log(player);
        this.players[player.socketID] = player;
        this.Composite.add(this.engine.world,this.players[player.socketID].ballObj);
        //console.log(this.players);
    }

    deletePlayer = function(player){
        this.Composite.remove(this.engine.world,this.players[player.socketID].ballObj);
        delete this.players[player.socketID];
        io.to(this.code).emit('removePlayer', player.socketID);
    }

    updateGame = function(){
        this.Engine.update(this.engine, this.frameRate);
        //io.emit("updateAll",JSON.stringify(players));

        for (const [id, playerObj] of Object.entries(this.players)) {
            //console.log(id, playerObj);
            io.to(this.code).emit('updateAll',
                playerObj.ballObj.position.x,
                playerObj.ballObj.position.y,
                playerObj.ballObj.velocity.x,
                playerObj.ballObj.velocity.y,
                playerObj.socketID);
        }
    }
}

class Player
{

    constructor(socketID, ballObj, name, color)
    {
        this.socketID = socketID;
        this.ballObj = ballObj;
        this.name = name;
        this.color = color;
        //players[socketID] = this;
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
        case "frontend.html":
            //console.log(urlObj.pathname);
            if(games[urlObj.query.room] == null) {
                console.log("NEW GAME");
                new Game(urlObj.query.room);
                //createPlayer(urlObj.query.room);
            }
            none();
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
            if(!err){
                res.write(content);
                res.end();
            }
        });
    }
});


const io = require('socket.io')(myserver,{
    cors: {origin: '*', methods:["GET","POST"]} //any url can access our backend

});

myserver.listen(80); //the server object listens on port 8080


setInterval(() => {
    for (const [code, game] of Object.entries(games)) {
        //console.log(code);
        games[code].updateGame();
    }
    }, 16.666);




io.on('connection', (socket) => {
    socket.on('newPlayer', (room,name,color) => {
        socket.code = room;
        socket.join(room);
        console.log(room);
        console.log([...socket.rooms]);
        games[room].addPlayer(
            new Player(socket.id,
                Matter.Bodies.circle(Math.random()*5+250, Math.random()*5+550, 14, {
                    frictionAir:0.05,
                    restitution:0.8
                }),name,color
            ));
    });
    console.log(socket.id);

    socket.on('requestPlayer', (sock,room) => {
        socket.emit('createPlayer',
            games[room].players[sock].name,
            sock,
            games[room].players[sock].ballObj.x,
            games[room].players[sock].ballObj.y,
            games[room].players[sock].color,
        );
    });
    socket.on('click', (pos,force,sock) => {
        Matter.Body.applyForce(games[socket.code].players[sock].ballObj, pos, force);
    });
    socket.on('disconnect', () => {
        if(games[socket.code] != undefined){
            games[socket.code].deletePlayer(games[socket.code].players[socket.id]);
        }
        console.log('user disconnected');
    });
});

