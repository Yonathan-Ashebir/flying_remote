import {TextBubble} from "./TextBubble";
import {useContext, useEffect, useRef, useState} from "react";
import {maxBubbleSize, Status} from "../data/contants";
import './trail.css'
import styled from "@emotion/styled";
import {keyframes} from "@emotion/react";
import {Timebar} from "./Timebar";
import {GameContext} from "../data/GameContext";
import {Button, Card, IconButton, Stack} from "@mui/material";
import {PlayArrow, PlayCircleFilled, ReplayCircleFilled} from "@mui/icons-material";

export const BubblesBoard = props => {
    const {bubbles, popBubble, controlState, handTrackerRef} = props
    const bubblesRef = useRef(bubbles)
    bubblesRef.current = bubbles
    const [boardDimension, setBoardDimension] = useState(null)
    const trailContainer = useRef()
    const pen = useRef()
    const pen2 = useRef()
    const gameContext = useContext(GameContext)


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
                            if ((cx - x) ** 2 + (cy - y) ** 2 < bubble.size ** 2 / 2) popBubble(bubble)
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
        background: '#08c linear-gradient(#33bbff, #08c, #004466)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center', ...props.style
    }}>
        <div style={{position: 'relative', overflow: 'hidden'}}>
            <img style={{minWidth: '80vw', minHeight: '90vh'}} onLoad={ev => {
                const bounds = ev.currentTarget.getBoundingClientRect();
                setBoardDimension({width: bounds.width, height: bounds.height});
            }} ref={el => {
                if (el === null || boardDimension != null) return;
                setTimeout(() => {
                    const bounds = el.getBoundingClientRect(); //todo: remove
                    setBoardDimension({width: bounds.width, height: bounds.height});
                }, 100)
            }} alt={"Video stream"}/>
            <div style={{width: `calc(100% - ${maxBubbleSize}px)`, height: '100%', position: 'absolute', top: '0'}}>
                {bubbles.map(b =>
                    <FloatingBubble key={b.value} style={{left: b.auxiliary * 100 + '%'}}
                                    className={b.popped ? 'popped' : ''} size={b.size + 'px'} duration={b.duration}
                                    refFix={b.reference}>
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
                opacity: 0.5,
                top: '0',
                display: "none"
            }}></div>
            <Timebar style={{position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)'}}/>
            {gameContext.status !== Status.PLAYING && <Stack justifyContent={'center'} alignItems={'center'}>
                <Stack style={{
                    visibility: gameContext.status === Status.PLAYING ? 'hidden' : 'visible',
                    opacity: gameContext.status === Status.PLAYING ? 0 : 1,
                    transition: 'opacity 0.5s',
                    background: '#00000055',
                    backdropFilter: 'blur(10px)',
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }} alignItems={'center'} justifyContent={'center'}>
                    <Card>
                        {(gameContext.status === Status.PAUSED &&
                                <Button onClick={props.unpause}><PlayArrow color={'primary'}
                                                                           fontSize={'large'}/></Button>) ||
                            (gameContext.gameStartTime === -1 ?
                                    <Button onClick={props.play}><PlayCircleFilled
                                        fontSize={'large'} color={'primary'}/>&nbsp;Start</Button> :
                                    <Button onClick={props.play}><ReplayCircleFilled
                                        fontSize={'large'} color={'primary'}/>&nbsp;Restart</Button>
                            )
                        }
                    </Card>

                </Stack>
            </Stack>}
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