console.log("hello");
const test = new WebSocket("wss://hot-potato-42gu.onrender.com")
const body = document.getElementById("body")!
const audio = new Audio("https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg");
let hasInteracted = false;
let myPosition = -1;

test.onopen = (ev) =>{
    console.log(ev.type, "socket connected");
    test.send("Hello")
}

test.onmessage = (ev)=>{
    console.log("got message", ev.data);
    const data = JSON.parse(ev.data);
    if(data.type === "position") {
        myPosition = data.position
    }
    else if(data.type === "current") {
        if(data.currentTurn === myPosition) {
            body.style.backgroundColor = "red"
            if(hasInteracted)
            audio.play();
        } else {
            body.style.background = "white"
        }
    } else if(data.type === "game-over") {
        document.getElementById("text")!.innerHTML="You Lose!"
    }
    else if(data.type === "you-win") {
        document.getElementById("text")!.innerHTML="You Win!"
    }
    
}
console.log(body);

body?.addEventListener("click", (ev)=>{
    hasInteracted = true;
    console.log("click", ev.clientX);
    if(ev.clientX < window.innerWidth/2)
    test.send("left")
    else {
        test.send("right")
    }
})