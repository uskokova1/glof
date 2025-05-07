const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const Matter = require("matter-js");
const mysql = require('mysql2');

const conPool = mysql.createPool({
    host: '35.237.125.25',
    user: 'nodeuser',
    password: 'mysqlguys',
    database: 'mapsdb',
    connectionLimit: 10
});


//players = {};
games = {};

const myserver = http.createServer(function (req, res) {
    const urlObj = url.parse(req.url, true);
    //console.log(req.url);
    //console.log(urlObj);

    switch(urlObj.pathname.slice(1)){
        case "data": //each case will be a queury such as cancel or schedule from the homework
            writeEnd("Day not valid");
            break;
        case "sql":
            processSql(req,res);
            break;
        case "hostpage.html":
            none();
            break;
        case "start":
            io.to(urlObj.query.code).emit("startGame");
            break;
        case "frontend.html":
            //console.log(urlObj.pathname);
            if(games[urlObj.query.room].map == null) {
                games[urlObj.query.room].setMap(urlObj.query.mapName);
                console.log("NEW GAME");
                //new Game(urlObj.query.room,"dacurvve");
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

class Game{
    constructor(code)
    {
        this.segments = [];
        this.spawn = null;
        this.map = null;
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

        this.obstacles = {};
        this.allobstacles = [];
        this.index = 0;


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
                        Matter.Body.setPosition(playerObj.ballObj, { x:this.spawn[0], y:this.spawn[1] });
                        Matter.Body.setVelocity(playerObj.ballObj, { x: 0, y: 0 });
                    }
                }
            }
        });

    }



    setMap = function(map) {
        this.map = map;
        //this.segments = [];
        conPool.query("select * from maps where mapName=\""+map.toString()+"\";", (e,r,f) => {
            this.segNum = JSON.parse(r[0].lenSegs);
            this.spawn = JSON.parse(r[0].spawnPos);
            this.holePos = JSON.parse(r[0].holePos);
            for (let z = 0; z < this.segNum.length; z++) {
                conPool.query("SELECT * FROM SegWith" + this.segNum[z] + " WHERE mapOwner=\"" + map + "\"",
                    (err, results, fields) => {
                        //console.log(err);
                        //console.log(results);
                        this.tmpVerts = [];
                        this.verts = results;
                        //console.log(this.verts);
                        //console.log(this.verts.length);
                        for (let j = 0; j < this.verts.length; j++) {
                            for (let i = 0; this.verts[j]["x" + i] != null; i++) {
                                this.tmpVerts[i] = {x: this.verts[j]["x" + i], y: this.verts[j]["y" + i]};
                                //console.log(this.tmpVerts);
                            }
                            //console.log("push");
                            this.mapObj = createMap(0, 0, this.tmpVerts, 25, {isStatic: true}, "rgb(23,143,25)");
                            this.segments.push(this.tmpVerts);
                            this.Composite.add(this.engine.world, this.mapObj);
                            if(this.segments.length >= this.segNum.length){
                                console.log("wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww");
                                io.to(this.code).emit("mapSegment", JSON.stringify(this.segments));
                                break;
                            }
                        }
                });
            }

            //adding a hole for the glof ball to go int
            this.hole = this.Bodies.circle(this.holePos[0], this.holePos[1], 0.05, {
                isStatic: true,
                isSensor: true,
                render: {
                    fillStyle: 'black'
                }
            });


            io.to(this.code).emit("createHole", this.holePos[0],this.holePos[1]);
            this.Composite.add(this.engine.world, this.hole);

            for (const [id, playerObj] of Object.entries(this.players)) {
                Matter.Body.setPosition(playerObj.ballObj, {x: this.spawn[0], y: this.spawn[1]});
            }
        });
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

function processSql(req,res){
    console.log("im being called!");
    cmd = "";
    req.on('data', data => {cmd += data;}); // get the request data
    req.on('end', () => { // request data received – call route processing function
        console.log(cmd);
        conPool.query(cmd,(err,results,fields)=>{
            res.writeHead(200, {"Content-Type": "app/json"});
            if(err) res.write("sql error");
            else res.write(JSON.stringify(results));
            console.log(results);
            console.log(err);
            res.end();
        });
    });
}



myserver.listen(80); //the server object listens on port 8080


setInterval(() => {
    for (const [code, game] of Object.entries(games)) {
        //console.log(code);
        games[code].updateGame();
    }
    }, 16.666);


io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => {
        socket.code = room;
        socket.join(room);
        console.log("ITHINKIGNEIGNEI");
        console.log([...socket.rooms]);
    });
    socket.on('newPlayer', (room,name,color) => {
        socket.code = room;
        socket.join(room);
        console.log(room);
        console.log([...socket.rooms]);
        if(games[room]){
            if(games[room].spawn) {
                x = games[room].spawn[0];
                y = games[room].spawn[1];
            }else{
                x = -5;
                y = -5;
            }
        }
        games[room].addPlayer(
            new Player(socket.id,
                Matter.Bodies.circle(x, y, 14, {
                    frictionAir:0.05,
                    restitution:0.8
                }),name,color
            ));
        io.to(socket.id).emit("mapSegment", JSON.stringify(games[room].segments));
        console.log(games[room].segments);
        if(games[room].holePos)
            io.to(socket.id).emit("createHole", games[room].holePos[0],games[room].holePos[1]);
//from here
        //This BElow is important code for updated new players with current obstacle postions
        let indexCounter = games[socket.code].index
        let indexCounter2 = (games[socket.code].index -1)
        console.log("There are currently: ",indexCounter, " obstacles in game room");

        if (indexCounter > 0) {
            console.log("LOADING CURRENTLY PLACED OBSTACLES")

            for (let i = 0; i < indexCounter; i++) {
                let currentObstacle = games[socket.code].obstacles["Obstacle" + i];
                console.log("Static notice: ",currentObstacle.isStatic);
                if (!currentObstacle.isStatic){
                    continue;
                }


                console.log("back at the TOP")
                //socket.to(socket.code).emit('createObstacle',);
                console.log(indexCounter);
                //console.log(i,'The current Obstacle is: ', games[socket.code].obstacles["Obstacle" + i]);
                let width2 = currentObstacle.bounds.max.x - currentObstacle.bounds.min.x;
                let height2 = currentObstacle.bounds.max.y - currentObstacle.bounds.min.y;

                socket.emit('createObstacle',currentObstacle.position.x,currentObstacle.position.y,width2,height2);
                console.log("MADE IT HERE",i);
            }

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
        games[socket.code].allobstacles.push(games[socket.code].obstacles["Obstacle" + index])
        console.log(games[socket.code].index);
        games[socket.code].index++;
    });
//to here
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
        if(socket.code){
            if(games[socket.code]){
                if (games[socket.code].players[socket.id]) {
                    games[socket.code].deletePlayer(games[socket.code].players[socket.id]);
                    console.log("fjewiofjeiwo");
                }
            }
        }
        console.log('user disconnected');
    });

    socket.on('removeObstacle', (indexToRemove) => {
        console.log("removing obstacle",indexToRemove,games[socket.code].allobstacles);
        games[socket.code].Composite.remove(games[socket.code].engine.world,games[socket.code].allobstacles[indexToRemove]);
        console.log(":Removing index",indexToRemove);
        Matter.Body.setStatic(games[socket.code].allobstacles[indexToRemove], false);
        socket.to(socket.code).emit('removeObstacle', indexToRemove);
    });


    socket.on("uploadMap", (cmd1,cmd2)=>{
        console.log(cmd1);
        console.log(cmd2);
        conPool.query(cmd1,(err,results,fields)=>{
            conPool.query(cmd2,(err,results,fields)=>{
                console.log(err);
                console.log(results);
            });
        });
    });

    socket.on("sqlcmd", (cmd)=>{
        conPool.query(cmd,(err,results,fields)=>{
        });
    });
    socket.on("iwantalltheverts", (name,segments)=>{
        console.log(segments);
        for(i = 0; i < segments.length; i++){
            //console.log(segments[i]);
            conPool.query("SELECT * FROM SegWith"+segments[i]+" WHERE mapOwner=\""+name+"\"",
                (err,results,fields)=>{
                //console.log(results);
                io.to(socket.id).emit("hereyougo", JSON.stringify(results));
            });
        }
    });

    socket.on("NewGame", (code) =>{
        console.log("fjewiofj8932jfu843r2jf7890r4h2g78thrb8u");
        games[code] = new Game(code);
    });
});

function createMap(x,y, verts, width, options,col) {
    Bodies = Matter.Bodies; //change structure later :P
    Body = Matter.Body; //change structure later :P

    const parts = [];
    for(let i = 1; i < verts.length; i++) {
        m = (verts[i-1].y-verts[i].y)/(verts[i-1].x-verts[i].x); //slope
        normal = -1/m; //perpendicular line of slope
        angle = Math.atan(normal); //angle of normal in radians

        const body = Bodies.fromVertices((verts[i-1].x + verts[i].x)/2,(verts[i-1].y+verts[i].y)/2, [
            { x: verts[i-1].x , y: verts[i-1].y },
            { x: verts[i-1].x +width*Math.cos(angle), y: verts[i-1].y+width*Math.sin(angle) },
            { x: verts[i].x +width*Math.cos(angle), y: verts[i].y+width*Math.sin(angle) },
            { x: verts[i].x , y: verts[i].y }
        ],{render:{
                fillStyle: col
            }});
        parts.push(body);
    }
    //catches the last edge :P
    m = (verts[verts.length-1].y-verts[0].y)/(verts[verts.length-1].x-verts[0].x);
    normal = -1/m;
    angle = Math.atan(normal);
    const body = Bodies.fromVertices((verts[0].x+verts[verts.length-1].x)/2,(verts[0].y+verts[verts.length-1].y)/2, [
        { x: verts[0].x , y: verts[0].y },
        { x: verts[0].x +width*Math.cos(angle), y: verts[0].y+width*Math.sin(angle) },
        { x: verts[verts.length-1].x +width*Math.cos(angle), y: verts[verts.length-1].y+width*Math.sin(angle) },
        { x: verts[verts.length-1].x , y: verts[verts.length-1].y }
    ],{render:{
            fillStyle: col
        }});
    parts.push(body);

    const ret = Body.create(options);
    Body.setParts(ret, parts);
    Body.translate(ret, {x: x, y: y});

    return ret;
}

