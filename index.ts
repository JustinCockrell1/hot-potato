import figlet from 'figlet'; 
import index from "./index.html"

let players: Bun.ServerWebSocket<undefined>[] = []
let currentTurn = 0;
let gameStarted = false

let timeoutId:NodeJS.Timeout;

const PORT = process.env.PORT || 3000

const server = Bun.serve({
  fetch: (req, server)=> {
    // upgrade the request to a WebSocket
    if (server.upgrade(req)) {
      return; // do not return a Response
    }
    return new Response("Upgrade failed", { status: 500 });
  },
  websocket:{
    message(ws, message) {
        console.log("got message", message);
        const playerNum = players.indexOf(ws);
        if(playerNum===currentTurn) {
            switch(message) {
                case "left":
                    currentTurn--;
                    if(currentTurn < 0) currentTurn = players.length-1
                break;
                case "right":
                    currentTurn++;
                    if(currentTurn >= players.length) currentTurn = 0
                break;
            }
            if(message==="left"||message==="right") {
            server.publish("game", JSON.stringify({type:"current", currentTurn}))
            if(!gameStarted) {
                gameStarted = true;
                startRound();
            }
            }
        }
        
    }, // a message is received
    open(ws) {
        if(!gameStarted) {
        console.log("socket connected");
        ws.send(JSON.stringify({type:"position", position:players.length}))
     
        players.push(ws)
        ws.subscribe("game")

        server.publish("game", JSON.stringify({type:"current", currentTurn}))
        }

        console.log(players.length);
        
    }, // a socket is opened
    close(ws, code, message) {
        const p = players.indexOf(ws)
        if(p===currentTurn) restartGame()
        handleClose(ws)
        
    }, // a socket is closed
    drain(ws) {}, // the socket is ready to receive more data
  },
  port: PORT,
  routes: {
    "/": index,
    "/figlet": () => { 
      const body = figlet.textSync('Hot Potato!'); 
      return new Response(body); 
    } 
  },
  development:true
});

function handleClose(ws:Bun.ServerWebSocket<undefined>) {
        const p = players.indexOf(ws)
        if(p===-1)return

        players.splice(p, 1)
        console.log(players.length, "player length");
        ws.unsubscribe("game")
        for(let i = 0; i < players.length; i++) {
            players[i]?.send(JSON.stringify({type:"position", position:i}))
        }
}

function startRound() {
    console.log("starting game");
    
    timeoutId = setTimeout(()=>{
        if(players[currentTurn]===undefined) return
        players[currentTurn]!.send(JSON.stringify({type:"game-over"}))

        handleClose(players[currentTurn]!)
        if(players.length>=2) {
            console.log(players.length, "players length");
            
        currentTurn = Math.floor(Math.random()*players.length)
        console.log(currentTurn);
        
        server.publish("game", JSON.stringify({type:"current", currentTurn}))
        startRound()
        } else {
            players[0]?.send(JSON.stringify({type:"you-win"}))
            // for(const player of players) {
            //     player.close()
            // }

        }
    }, 20000)
}

function restartGame() {
    players = []
    currentTurn = 0
    gameStarted = false;
    if(timeoutId)
    clearTimeout(timeoutId)
}


console.log(`Listening on ${server.url}`);