from flask import Flask,request, render_template
from flask_socketio import SocketIO
import netifaces

app = Flask(__name__,template_folder="./",static_folder="./",static_url_path="/")
socketio = SocketIO(app,cors_allowed_origins="*")

connectedDeviceList = {}
connectedDeviceSIDList = {}

def getLocalIP():
    interfaces = netifaces.interfaces()
    for iface in interfaces:
        addrs = netifaces.ifaddresses(iface)
        if netifaces.AF_INET in addrs:
            for addr in addrs[netifaces.AF_INET]:
                ip = addr['addr']
                if not ip.startswith("127."):
                    return ip
    return '127.0.0.1' 

def generateName(ip):
    names = ['Yessi', 'Azinel', 'Serce' ,'Brons' 'Pather' , 'Conda', 'Swift' , 'Bazix', 'Crons' , 'Denvo' ,  'Solix' , 'Mongo', 'Shivil', 'Kassey', 'Mevon', 'Geets', 'Vizel', 'Xonix', 'Debor', 'Kopeh', 'Luvm', 'Rexon', 'Hales', 'Felec'];
    val = int(ip.split(".")[3])-1
    if(val>24):
        sum = 0
        while(val != 0):
            sum += val%10
            val //= 10
        val = sum
    return names[val]

@socketio.on('connect')
def connect():
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    name = generateName(client_ip)
    if(client_ip not in connectedDeviceList.keys()):
        connectedDeviceList[client_ip] = name
        connectedDeviceSIDList[client_ip] = request.sid
    socketio.emit('new_connection',connectedDeviceList)
    return

@socketio.on('disconnect')
def disconnect():
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    del connectedDeviceList[client_ip]
    del connectedDeviceSIDList[client_ip]
    socketio.emit('new_connection',connectedDeviceList)
    return

@socketio.on('sendFile')
def sendFile(data):
    target_ip = data["ip"]
    filename = data["filename"]
    filesize = data["filesize"]
    chunk = data['chunk']
    isLast = data['isLast']
    mime = data['mime']

    # # Send only to the specific recipient
    socketio.emit("receiveFile", {"filename": filename, 'filesize':filesize, "chunk": chunk,'isLast': isLast,'mime':mime},to=connectedDeviceSIDList[target_ip])

@app.route("/",methods=['GET'])
def home():
    return render_template("./index.html")

@app.route("/get_ip")
def getIp():
    client_ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    return {'ip':client_ip,'name':generateName(client_ip)}

if __name__ == "__main__":
    print(f"App Started at: http://{getLocalIP()}:39165")
    socketio.run(app,host='0.0.0.0',port=39165)