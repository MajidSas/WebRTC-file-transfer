# WebRTC-file-transfer
Demonstration of using WebRTC Data Channel to send multiple files.

## Resources
Some code snippites were adapted from the following recources:
- Learning WebRTC (by Dan Ristic ISBN 978-1-78398-366-7)
- https://www.sitepoint.com/html5-file-drag-and-drop/

## Comments
This implementation is very basic. Sending large files is not possible with this solution, because the file that is being sent is loaded into memory, which is not practical. Also, it is very slow in sending large files because the chunks are sent in intervals.

The memory issue can be solved by reading the file peice by peice using file.slice(startByte,endByte) and storing the received data in local storage (e.g. Indexeddb). However, Indexeddb doesn't support appending data to an object without loading the previously saved data to memory.