# WebRTC-file-transfer
Demonstration of using WebRTC Data Channel to send multiple files.

## Resources
Some code snippites were adapted from the following recources:
- Learning WebRTC (by Dan Ristic ISBN 978-1-78398-366-7)
- https://www.sitepoint.com/html5-file-drag-and-drop/

## Comments
This implementation is very basic. Sending large files is not possible with this solution, because the file that is being sent is loaded into memory, which is not practical. Also, it is very slow in sending large files because the chunks are sent in intervals.

The memory issue can be solved by reading the file peice by peice using file.slice(startByte,endByte) and storing the received data in local storage (e.g. Indexeddb). However, Indexeddb doesn't support appending data to an object without loading the previously saved data to memory.

## Usage

1. Move to the folder node-server
2. Make sure you have the WebSocket model installed
>  sudo npm install --save ws
3. You may need to run
> sudo npm install -d
4. Move to the folder node-server, and run the file server.js with node.js using a command similar to:
> nodejs server.js
or
> node server.js

5. Open the file js/client.js, and change line 7 to point to your server's ip address. If you are using the same computer you don't need to do this step.
From:
> var connection = new WebSocket('ws://localhost:8888');
To:
> var connection = new WebSocket('ws://MACHINE_IP_ADDRESS:8888');

6. Open the file index.html in two browsers in different computers.
7. Now, you can send and receive files. You should see something similar to the screenshot.
![Alt text](webrtc_file_transfer_screenshot.png?raw=true "Interface")
