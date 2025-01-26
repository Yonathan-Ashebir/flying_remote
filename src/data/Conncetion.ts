class Connection {
    #socket;
    #handler = null;

    constructor(url) {
        this.#socket = new WebSocket('url');
        this.#socket.addEventListener('message', ({data}) => {
        })
    }

    addHandler = (handler, type) => {
        //todo: implement types
        this.#handler = handler;
    }
}


export default Connection;