import { io } from "socket.io-client";

let socket;
let inputBox;
let inputButton;
let inputNickName;


async function main() {
    inputBox = document.getElementById("chatbox");
    inputButton = document.getElementById("send");
    inputNickName = document.getElementById("nickname");
    console.log("seeee");
    
    socket.on("connect", () => {
        console.log(socket.id);
        socket.emit("messageToServer", `Hello`);
        socket.on("messageFromServer", function (msg) {
            const messages = document.getElementById("main")
            const item = document.createElement('div');
            item.className = "message";
            item.textContent = msg;
            messages.appendChild(item);
            console.log(msg);
        });
    });

    socket.on("disconnect", () => {
        console.log(socket.id); // undefined
    });

    let msg = document.createElement('p');

    inputButton.onclick = () => socket.emit("messageToServer", inputNickName.value + ": " + inputBox.value);

    msg.textContent = "lodjjdjd";
}

window.addEventListener("load", () => {
    socket = io();
    main();
});