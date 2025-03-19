const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path')


const myserver = http.createServer(function (req, res) {
    const urlObj = url.parse(req.url, true);

    console.log(req.url);
    console.log(urlObj);

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


    function sendFile(pathIn){ //changes content type in the header based on what file type user wants
        fs.readFile(pathIn,function (err, content){
            switch(path.extname(pathIn)){
                case ".png":
                    res.writeHead(200,{'Content-Type':'image/png'});
                    break;
                case ".html":
                    res.writeHead(200,{'Content-Type':'text/html'});
                    break;
                case ".css":
                    res.writeHead(200,{'Content-Type':'text/css'});
                    break;
                case ".ico":
                    res.writeHead(200,{'Content-Type':'image/vnd.microsoft.icon'});
                    break;
                case ".js":
                    res.writeHead(200,{'Content-Type':'text/javascript'});
                    break;
                default:
                    break;
            }
            res.write(content);
            res.end();
        });
    }

    function writeEnd(msg){ //this will go away soon probably :P leftover from other homework
        res.writeHead(200,{ 'Content-Type':'application/json'});
        res.write(JSON.stringify({message:msg}));
        res.end();
    }

});

myserver.listen(80); //the server object listens on port 80