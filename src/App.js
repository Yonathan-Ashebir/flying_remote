import {Button} from '@mui/material'
import './App.css';
import React, {useCallback, useEffect, useRef} from "react";

const streamURL = "ws://localhost:3333"

function App() {
    // eslint-disable-next-line no-undef
    const [playing, setPlaying] = React.useState(false);
    const board = useRef({canvas: {current: null}, ctx: null});
    const [painting, setPainting] = React.useState(false);
    const draw = useCallback(event => {
        console.log('draw: ' + painting);

        if (!painting) return;

        const rect = board.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        const ctx = board.ctx == null ? (board.ctx = board.canvas.getContext("2d")) : board.ctx;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';  // Smooth round edges for lines
        ctx.strokeStyle = 'blue';  // Set the stroke color to blue

        // Draw the line
        ctx.lineTo(mouseX, mouseY);  // Draw to mouse position
        ctx.stroke();
        ctx.beginPath();  // Begin a new path to avoid continuous dragging
        ctx.moveTo(mouseX, mouseY);  // Move the pen to the current mouse position
    }, [painting])

    // useEffect(() => {
    //     if (playing) {
    //         let connection = new WebSocket(streamURL);
    //         connection.binaryType = 'arraybuffer'
    //         const status = {firstTime: true, height: 0, width: 0}
    //         const ctx = canvas.current.getContext('2d');
    //         connection.onmessage = event => {
    //             if (status.firstTime) {
    //                 let view = new Int16Array(event.data)
    //                 status.width = view.at(0)
    //                 status.height = view.at(1)
    //                 status.firstTime = false
    //             }
    //
    //             // ctx.drawImage(event.data, 0, 0, status.width, status.height)
    //             ctx.putImageData(new ImageData(new Uint8ClampedArray(event.data), status.width, status.height))
    //
    //             console.log(typeof (event.data))
    //         }
    //         return () => connection.close()
    //     }
    // }, [playing])
    return (
        <div className="App" style={{
            flexFlow: 'column',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%'
        }}>
            {/*<canvas id="canvas" ref={(el) => {*/}
            {/*    console.log("Element set")*/}
            {/*    board.canvas = el*/}
            {/*}}*/}
            {/*        style={{background: 'black', minWidth: '600px%', minHeight: '600px'}}*/}
            {/*        onMouseDown={(event) => {*/}
            {/*            setPainting(false)*/}
            {/*            draw(event);*/}
            {/*        }}*/}
            {/*        onMouseMove={draw}*/}
            {/*        onMouseLeave={() => {*/}
            {/*            console.log('onMouseLeave');*/}
            {/*            setPainting(false)*/}
            {/*            const ctx = board.ctx == null ? (board.ctx = board.canvas.getContext("2d")) : board.ctx;*/}
            {/*            ctx.beginPath();*/}
            {/*        }}*/}
            {/*        onMouseUp={() => {*/}
            {/*            console.log('onMouseUp');*/}
            {/*            setPainting(false)*/}
            {/*            const ctx = board.ctx == null ? (board.ctx = board.canvas.getContext("2d")) : board.ctx;*/}
            {/*            ctx.beginPath();*/}
            {/*        }}*/}
            {/*></canvas>*/}

            <img id="videoFeed" src="http://localhost:5000/video_feed" alt="Camera Feed" style={{width: '100%', height: '100%'}} />

            <span style={{height: '20px'}}></span>
            <Button onClick={() => setPlaying(!playing)}> Play </Button>
        </div>
    );
}


export default App;
