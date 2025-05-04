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

        this.obstacles = [];
        this.index = 0;

        //adding a hole for the glof ball to go int
        this.hole = this.Bodies.circle(900, 500, 0.05, {
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



        //this.g6 = this.Bodies.rectangle(0, 300, 30, 600, { isStatic: true});
        //this.g5 = this.Bodies.circle(400, 125, 30, { isStatic: true});



        //this.Composite.add(this.engine.world, [this.ground,this.g1,this.g2,this.g3,this.g4,this.g5,this.g6]);

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

let shapes = [ //SHAPES ARE JUST THE WALLS IN THE WORLD
    [200, 610,425, 30], //Ground
    [800, 350, 30, 500], //Right Wall
    [400, 600, 30, 600], //Middle Wall
    [400, 400, 500, 30], //Horizontal middle Bar
    [400, 100, 850, 30], //Top
    [0, 300, 30, 600],   //Left Wall
    [600, 800,425, 30],  //Bottom Most Ground(right side)
    [29, 30, 31, 32],
    [33, 34, 35, 36],
    [37, 38, 39, 40]
];


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
        //This BElow is important code for updated new players with current obstacle postions
        let indexCounter = games[socket.code].index
        let indexCounter2 = (games[socket.code].index -1)
        console.log("There are currently: ",indexCounter, " obstacles in game room");

        if (indexCounter > 0) {
            console.log("LOADING CURRENTLY PLACED OBSTACLES")
            for (let i = 0; i < indexCounter; i++) {
                console.log("back at the TOP")
                socket.to(socket.code).emit('createObstacle',);
                console.log(indexCounter);
                let currentObstacle = games[socket.code].obstacles["Obstacle" + i];
                console.log(i,'The current Obstacle is: ', games[socket.code].obstacles["Obstacle" + i]);
                let width2 = currentObstacle.bounds.max.x - currentObstacle.bounds.min.x;
                let height2 = currentObstacle.bounds.max.y - currentObstacle.bounds.min.y;

                socket.emit('createObstacle',currentObstacle.position.x,currentObstacle.position.y,width2,height2);
                console.log("MADE IT HERE",i);
            }

        }


        /*
        for (let key in obstacles) {
            let obstacle = obstacles[key];
            let width2 = obstacle.bounds.max.x - obstacle.bounds.min.x;
            let height2 = obstacle.bounds.max.y - obstacle.bounds.min.y;
            socket.to(socket.code).emit('createObstacle', obstacle[draggableBox.position.x,draggableBox.position.y,width2,height2]);



         */
        //BELOW IS TEST SQUARE CODE CAN BE DELETED
        /*
        let testsquare1 = [400,500,50,100];
        socket.emit('CreateWall',testsquare1[0],testsquare1[1],testsquare1[2],testsquare1[3]);
        const wall = Matter.Bodies.rectangle(testsquare1[0],testsquare1[1],testsquare1[2],testsquare1[3], {isStatic:true});
        const currentgame = games[socket.code];
        games[socket.code].Composite.add(games[socket.code].engine.world, [wall]);


         */
        //Below will go through list of shapes(WALLS/MAP) and emit each to the client side then add them to the server side engine as rectangles
        for (let i = 0; i < shapes.length; i++) {
            //console.log(`item ${i + 1}`);
            socket.emit('CreateWall',shapes[i][0],shapes[i][1],shapes[i][2],shapes[i][3]);
            games[socket.code].Composite.add(games[socket.code].engine.world, [Matter.Bodies.rectangle(shapes[i][0],shapes[i][1],shapes[i][2],shapes[i][3],{isStatic:true})]);
        }



    });//end of newPlayer Socket

    // THIS CODE will create obstacle postions recieved from the client then send the new ones to the other players
    socket.on('createObstacle', (x2,y2,Width,Hight) =>{
        console.log("createObstacle");
        index = games[socket.code].index; // don't know why these shortcuts I made dont work
        //obstacles = [socket.code].obstacles; // don't know why these shortcuts I made dont work
        games[socket.code].obstacles["Obstacle" + index] = Matter.Bodies.rectangle(x2,y2,Width,Hight, {
            isStatic: true,
            render: { fillStyle: "grey"}
        });
        //Matter.Body.setAngle(obstacles["Obstacle" + index], Angle);

        index = games[socket.code].index;
        console.log(x2,y2,Width,Hight);
        socket.to(socket.code).emit('createObstacle', x2,y2,Width,Hight);
        games[socket.code].Composite.add(games[socket.code].engine.world,games[socket.code].obstacles["Obstacle" + index]);
        games[socket.code].index++;
        console.log(games[socket.code].index);
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

