const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');
const Matter = require("matter-js");

//players = {};
games = {};

class Game {

  constructor(code) {
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

    this.ground = this.Bodies.rectangle(400, 610, 810, 60, { isStatic: true });
    // add all of the bodies to the world
    this.Composite.add(this.engine.world, [this.ground]);
    this.mapbod = this.Bodies.fromVertices(300, 300,
      [{ x: 300, y: 200 }, { x: 320, y: 390 }, { x: 550, y: 565 }, { x: 500, y: 200 }]);
    this.mapbod.isStatic = true;
    this.Composite.add(this.engine.world, this.mapbod);

    this.frameRate = 16.666;

    this.code = code;
    games[code] = this;
  }
  addPlayer = function (player) {
    this.players[player.socketID] = player;
    this.Composite.add(this.engine.world, this.players[player.socketID].ballObj);
  }

  updateGame = function () {
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

class Player {

  constructor(socketID, ballObj, name, room) {
    this.socketID = socketID;
    this.ballObj = ballObj;
    this.name = name;
    this.room = room;
    //players[socketID] = this;
    //players.push(this);
  }

}

const myserver = http.createServer(function (req, res) {
  const urlObj = url.parse(req.url, true);
  //console.log(req.url);
  //console.log(urlObj);

  switch (urlObj.pathname.slice(1)) {
    case "data": //each case will be a queury such as cancel or schedule from the homework
      writeEnd("Day not valid");
      break;
    case "frontend.html":
      console.log(urlObj.pathname);
      if (games[urlObj.query.room] == null) {
        new Game(urlObj.query.room);
      }
      io.on('connection', function (socket) {
        console.log(socket.id);
        Bodies = Matter.Bodies;
        socket.join(urlObj.query.room);
        games[urlObj.query.room].addPlayer(
          new Player(socket.id,
            Bodies.circle(330 + Math.random() * 5, 330 + Math.random() * 5, 20, {
              frictionAir: 0.05,
              restitution: 0.8
            })
          )
        );
        //socket.emit('init', players[socket.id].x,players[socket.id].y,socket.id);
      });
      none();
      break;
    default:
      none(); //this needs a better name lol :P
      break;
  }

  function none() {
    if (urlObj.path == "/") {
      newPath = "./main_menu.html";
    } else {
      newPath = "." + urlObj.pathname;
    }
    //console.log(newPath);
    sendFile(newPath);
  }


  function sendFile(pathIn) { //changes content type in the header based on what file type user wants
    fs.readFile(pathIn, function (err, content) {
      switch (path.extname(pathIn)) {
        case ".png":
          res.writeHead(200, { 'Content-Type': 'image/png' });
          break;
        case ".html":
          res.writeHead(200, { 'Content-Type': 'text/html' });
          break;
        case ".css":
          res.writeHead(200, { 'Content-Type': 'text/css' });
          break;
        case ".ico":
          res.writeHead(200, { 'Content-Type': 'image/vnd.microsoft.icon' });
          break;
        case ".js":
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          break;
        case ".php":
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          break;
        default:
          break;
      }
      res.write(content);
      res.end();
    });
  }
});

const io = require('socket.io')(myserver, {
  cors: { origin: '*' } //any url can access our backend
});


myserver.listen(80); //the server object listens on port 8080


setInterval(() => {
  for (const [code, game] of Object.entries(games)) {
    game.updateGame();
  }
}, 16.666);


io.on('connection', function (socket) {
  /*
  console.log(socket.id);
  new Player(socket.id,
      Bodies.circle(Math.random()*250, Math.random()*250, 20, {
      frictionAir:0.05,
      restitution:0.8
  })
  );
  Composite.add(engine.world,players[socket.id].ballObj);
  socket.emit('init', players[socket.id].x,players[socket.id].y,socket.id);
  */

  socket.on('disconnect', () => {
    socket.emit('removePlayer', socket.id);
    console.log('user disconnected');
    //delete players[socket.id]
  });

  /*
  socket.on('updateSelf', (x,y,velx,vely) => {
      players[socket.id].x = x;
      players[socket.id].y = y;
      players[socket.id].velx = velx;
      players[socket.id].vely = vely;
  });
   */

  socket.on('click', (pos, force, sock) => {
    //console.log(players);
    console.log([...socket.rooms]);
    //pos = Matter.Vector.create(boxA.position.x, boxA.position.y);
    Matter.Body.applyForce(games[[...socket.rooms][1]].players[sock].ballObj, pos, force);
  })

});
