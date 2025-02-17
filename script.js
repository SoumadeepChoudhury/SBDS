var socketio = io();
var my_ip = undefined
var my_name = undefined
var receivedSize = 0;
var receivedChunk = [];

const devices = document.getElementById("devices");
const ol = document.createElement('ol');
devices.appendChild(ol);

function sendFile(sendToIP) {
    let fileInput = document.getElementById("file");
    fileInput.click()

    fileInput.onchange = function () {
        sendFileChunk(sendToIP);
    }
}

// 📌 Function to Show Overlay & Update Progress
function showOverlay(filename, percentage) {
    let overlay = document.getElementById("fileOverlay");
    let fileNameElement = document.getElementById("fileName");
    let progressBar = document.getElementById("progressBar");

    overlay.style.visibility = "visible";
    overlay.style.opacity = "1";
    fileNameElement.textContent = "File: " + filename;
    progressBar.style.width = percentage + "%";

    if (percentage >= 100) {
        setTimeout(() => closeOverlay(), 1000);
    }
}

// 📌 Function to Hide Overlay
function closeOverlay() {
    let overlay = document.getElementById("fileOverlay");
    overlay.style.visibility = "hidden";
    overlay.style.opacity = "0";
}




let chunkSize = 70 * 1024; // 70KB
let offset = 0;

function sendFileChunk(sendTo) {
    let reader = new FileReader();
    let file = document.getElementById("file").files[0];
    let mime = file.type

    if (offset >= file.size) {
        socketio.emit("sendFile", { ip: sendTo, filename: file.name, filesize: file.size, chunk: '', isLast: true, mime: mime });
        return;
    }

    let blob = file.slice(offset, offset + chunkSize);
    // reader.readAsDataURL(blob);
    reader.readAsArrayBuffer(blob);

    reader.onload = function (event) {
        socketio.emit("sendFile", {
            ip: sendTo,
            filename: file.name,
            filesize: file.size,
            chunk: event.target.result,
            isLast: false,
            mime: mime
        });
        offset += chunkSize;
        sendFileChunk(sendTo); // Send next chunk
    };
}


fetch('/get_ip').then(res => res.json()).then(data => {
    my_ip = data.ip;
    my_name = data.name;
    if (my_ip && my_name) {
        const selfDeviceName = document.getElementById("selfDeviceName");
        selfDeviceName.innerText = my_name;
    }
    socketio.on('connect', function (_) {
        console.log("Connected to server..");
    });

    socketio.on('new_connection', function (data) {
        const ips = Object.keys(data);
        const names = Object.values(data);
        ol.innerHTML = '';
        if (my_ip && my_name) {
            for (let index = 0; index < ips.length; index++) {
                if (ips[index].toString() !== my_ip) {
                    const li = document.createElement('li');
                    li.innerHTML = `<a onclick={sendFile('${ips[index].toString()}')} style='cursor:pointer;'>${names[index]}</a>`;
                    ol.appendChild(li);
                }
            }
        }
    });

    socketio.on("receiveFile", function (data) {
        console.log("Receiving")
        let { filename, filesize, chunk, isLast, mime } = data; 4
        receivedSize += chunk.byteLength;
        let percentage = Math.round((receivedSize / filesize) * 100);
        showOverlay(filename, percentage);
        if (!isLast) {
            receivedChunk.push(chunk);
        } else {
            let fileBlob = new Blob(receivedChunk, { type: mime });

            if (fileBlob !== null) {
                // Create a hidden auto-download link
                let downloadLink = document.createElement("a");
                downloadLink.style.display = 'none';
                downloadLink.href = URL.createObjectURL(fileBlob);
                downloadLink.download = filename;
                document.body.appendChild(downloadLink);

                downloadLink.click(); // Auto-download the file
                document.body.removeChild(downloadLink);
            }
            receivedChunk = [];
            receivedSize = 0;
        }
    });


}).catch(error => console.error("Error fetching IP:", error));

