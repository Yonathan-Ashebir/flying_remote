import {TextBubble} from "./TextBubble";
import {useEffect, useRef, useState} from "react";
import {maxBubbleSize} from "../data/contants";
import './trail.css'
import './bubble_board.css'
import styled from "@emotion/styled";
import {keyframes} from "@emotion/react";

export const BubblesBoard = ({bubbles, popBubble}) => {

    const bubblesRef = useRef(bubbles)
    bubblesRef.current = bubbles
    const [boardDimension, setBoardDimension] = useState(null)
    const trailContainer = useRef()
    const pen = useRef()
    const pen2 = useRef()

    useEffect(() => {
        window.boardDimension = boardDimension
        if (boardDimension) {
            console.log('Tracking mouse: ' + (boardDimension !== window.boardDimension))
            window.boardDimension = boardDimension
            for (const child of trailContainer.current.children) child.remove()
            const data = {trail: []}
            const maximumHistorySize = 50;
            let onmessage = (segment) => {
                const {x, y, type} = JSON.parse(segment);
                switch (type) {
                    case 'pen-down':
                        pen.current.classList.add('down')
                    case 'pen-move':
                        const now = Date.now();
                        for (const bubble of bubblesRef.current) {
                            const cx = bubble.auxiliary * (boardDimension.width - maxBubbleSize) + bubble.size / 2
                            const cy = boardDimension.height - (now - bubble.createTime) * (boardDimension.height + maxBubbleSize * 1.5) / bubble.duration + bubble.size / 2
                            if (Math.sqrt((cx - x) ** 2 + (cy - y) ** 2) < bubble.size) popBubble(bubble)
                        }

                        pen.current.style.top = `${y}px`
                        pen.current.style.left = `${x}px`
                        const trailSpot = document.createElement('div')
                        trailSpot.className = 'trail-spot'
                        trailSpot.style.top = `${y}px`
                        trailSpot.style.left = `${x}px`
                        data.trail.push(trailSpot)
                        trailContainer.current.appendChild(trailSpot)

                        if (data.trail.length > maximumHistorySize)
                            trailContainer.current.removeChild(data.trail.shift())
                        break;
                    case 'pen-up':
                        pen.current.classList.remove('down')
                        break;
                    default:
                        console.warn('unknown message type: ' + segment.data)
                }
            }

            const bounds = trailContainer.current.getBoundingClientRect()
            trailContainer.current.onmousemove = ev => {
                const mouseX = ev.clientX - bounds.left;
                const mouseY = ev.clientY - bounds.top;

                onmessage(JSON.stringify({
                    type: 'pen-move',
                    x: mouseX,
                    y: mouseY,
                }))
            }
            return () => {
                //todo
            }
        }
    }, [boardDimension, popBubble]);

    return <div style={{
        width: '100%',
        height: '100%',
        background: '#08c linear-gradient(#33bbff, #08c, #004466)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    }}>
        <div style={{position: 'relative', overflow: 'hidden'}}>
            <img style={{minWidth: '80vw', minHeight: '60vw'}} onLoad={ev => {
                const bounds = ev.currentTarget.getBoundingClientRect();
                setBoardDimension({width: bounds.width, height: bounds.height});
            }} ref={el => {
                if (el === null || boardDimension != null) return;
                const bounds = el.getBoundingClientRect(); //todo: remove
                setBoardDimension({width: bounds.width, height: bounds.height});
            }} alt={"Video stream"}/>
            <div style={{width: `calc(100% - ${maxBubbleSize}px)`, height: '100%', position: 'absolute', top: '0'}}>
                {bubbles.map(b =>
                    <FloatingBubble key={b.value} style={{left: b.auxiliary * 100 + '%'}}
                                    className={b.popped ? 'popped' : ''} size={b.size + 'px'} duration={b.duration} refFix={b.reference}>
                        {b.value}
                    </FloatingBubble>
                )}

            </div>
            <div ref={trailContainer}
                 style={{width: '100%', height: '100%', position: 'absolute', top: '0'}}>
                <span></span>
            </div>
            <div className='pen' ref={pen} style={{
                width: '10px',
                height: '10px',
                background: 'red',
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                top: '0'
            }}></div>

            <div className='pen' ref={pen2} style={{
                width: '10px',
                height: '10px',
                background: 'green',
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                top: '0'
            }}></div>
        </div>
    </div>
}

const floatUp = keyframes`
    from {
        top: 100%;
        transform: translateX(0%);
    }

    to {
        top: 0;
        transform: translateY(${-maxBubbleSize * 1.5}px);
    }
`

const FloatingBubble = styled(TextBubble)`
    position: absolute;
    animation: ${floatUp} linear ${props => props.duration}ms forwards;
`