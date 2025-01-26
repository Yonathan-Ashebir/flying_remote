class Connection {
    #socket;
    #handler = null;

    constructor(url: any) {
        this.#socket = new WebSocket('url');
        this.#socket.addEventListener('message', ({data}) => {
        })
    }

    addHandler = (handler: any, type: any) => {
        //todo: implement types
        this.#handler = handler;
    }
}


export default Connection;