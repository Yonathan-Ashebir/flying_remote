import {TextBubble} from "./TextBubble";
import {useContext, useEffect, useMemo, useRef, useState} from "react";
import {
    ControlState, DEFAULT_BOARD_DIMENS, TRIM_RATIO, MAX_BOARD_HEIGHT_RATIO,
    MAX_BOARD_WIDTH_RATIO,
    maxBubbleSize,
    MIN_BOARD_HEIGHT,
    MIN_BOARD_WIDTH,
    Status
} from "../data/contants";
import './trail.css'
import styled from "@emotion/styled";
import {keyframes} from "@emotion/react";
import {TimeBar} from "./TimeBar";
import {GameContext} from "../data/GameContext";
import {Button, Card, IconButton, Stack} from "@mui/material";
import {PlayArrow, PlayCircleFilled, ReplayCircleFilled} from "@mui/icons-material";
import {selectBestScale} from "../utilites";


export const BubblesBoard = props => {
    const {bubbles, popBubble, controlState, handTrackerRef} = props
    const bubblesRef = useRef(bubbles)
    bubblesRef.current = bubbles
    const trailContainer = useRef()
    const pen = useRef()
    const videoElement = useRef()
    const pen2 = useRef()
    const gameContext = useContext(GameContext)
    const useHand = useMemo(() => controlState === ControlState.HAND, [controlState]);
    const [boardDimensions, setBoardDimensions] = useState(DEFAULT_BOARD_DIMENS);
    const [videoDimensions, setVideoDimensions] = useState(DEFAULT_BOARD_DIMENS);
    const handlerTicket = useRef(0)

    useEffect(() => {
        const myTicket = ++handlerTicket.current
        const data = {trail: []}
        const maximumHistorySize = 50;
        const trailer = trailContainer.current
        const dispatch = (action, boardDimension) => {
            const {x, y, type} = action
            switch (type) {
                case 'pen-down':
                    pen.current.classList.add('down')
                // no break
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
                    trailer.appendChild(trailSpot)

                    if (data.trail.length > maximumHistorySize)
                        trailer.removeChild(data.trail.shift())
                    break;
                case 'pen-up':
                    pen.current.classList.remove('down')
                    break;
                default:
                    console.warn('unknown message type: ' + action.data)
            }
        }
        if (useHand) {
            const {handMarker, videoSource} = handTrackerRef.current

            const measure = () => {
                const {videoHeight: initialVideoHeight, videoWidth: initialVideoWidth} = videoElement.current
                const trim = TRIM_RATIO * Math.min(initialVideoWidth, initialVideoHeight)
                const videoWidth = initialVideoWidth - trim
                const videoHeight = initialVideoHeight - trim
                const maxWidth = MAX_BOARD_WIDTH_RATIO * window.innerWidth
                const maxHeight = MAX_BOARD_HEIGHT_RATIO * window.innerHeight
                const scale = selectBestScale([{
                    value: videoWidth,
                    lower: MIN_BOARD_WIDTH,
                    upper: maxWidth
                }, {value: videoHeight, lower: MIN_BOARD_HEIGHT, upper: maxHeight}])
                const adjustedHeight = Math.min(videoHeight * scale, maxHeight)
                const adjustedWidth = Math.min(videoWidth * scale, maxWidth)
                setVideoDimensions({
                    width: `${initialVideoWidth * scale}px`,
                    height: `${initialVideoHeight * scale}px`
                })
                setBoardDimensions({
                    width: `${adjustedWidth}px`,
                    height: `${adjustedHeight}px`
                })
                return  {width: adjustedWidth, height: adjustedHeight, initialVideoWidth, initialVideoHeight, scale}
            }
            const measurements = {current: measure()}
            const onResize = () => {measurements.current = measure()}

            videoElement.current.onloadedmetadata = () => {
                window.addEventListener('resize', onResize)
                const trackHand = (data) => {
                    const {lastVideoTime, penDown = false} = data
                    if (myTicket !== handlerTicket.current) return
                    const startTimeMs = performance.now();
                    const currentTime = videoElement.current.currentTime
                    data.lastVideoTime = currentTime
                    requestAnimationFrame(() => trackHand(data))
                    if (lastVideoTime === currentTime) return;
                    let results = handMarker.detectForVideo(videoElement.current, startTimeMs);
                    if (!results.landmarks.length) {
                        data.penDown = false
                        if (penDown) dispatch({type: 'pen-up'}, measurements.current)
                        return
                    }
                    const middleFinger = results.landmarks[0][8]
                    const x = (measurements.current.initialVideoWidth - middleFinger.x * measurements.current.initialVideoWidth) * measurements.current.scale
                    const y = middleFinger.y * measurements.current.initialVideoHeight * measurements.current.scale
                    if (!penDown) dispatch({type: 'pen-down', x, y}, measurements.current)
                    data.penDown = true
                    dispatch({
                        type: 'pen-move',
                        x, y
                    }, measurements.current)
                }
                trackHand({lastVideoTime: -1})
            }
            videoElement.current.srcObject = videoSource
            return () => {
                for (const child of trailer.children) child.remove()
                window.removeEventListener('resize', onResize)
                dispatch({type: 'pen-up'})
                videoSource.getTracks().forEach(t => t.stop())
            }
        } else {
            setBoardDimensions(DEFAULT_BOARD_DIMENS)

            const bounds = {
                current: trailer.getBoundingClientRect(),
                updateBound: true,
                updateStopTime: Date.now() + 3000
            };

            dispatch({
                type: 'pen-down',
                x: -100,
                y: -100
            }, {
                width: window.innerWidth * MAX_BOARD_WIDTH_RATIO,
                height: window.innerHeight * MAX_BOARD_HEIGHT_RATIO
            })
            trailer.onmousemove = ev => {
                if (bounds.updateBound && bounds.updateStopTime > Date.now()) {
                    bounds.current = trailer.getBoundingClientRect() //todo: can do better?
                    bounds.updateBound = bounds.updateStopTime > Date.now()
                }
                const mouseX = ev.clientX - bounds.current.left;
                const mouseY = ev.clientY - bounds.current.top;
                dispatch({
                    type: 'pen-move',
                    x: mouseX,
                    y: mouseY,
                }, {
                    width: window.innerWidth * MAX_BOARD_WIDTH_RATIO,
                    height: window.innerHeight * MAX_BOARD_HEIGHT_RATIO
                })
            }

            const onResize = () => {
                bounds.current = trailer.getBoundingClientRect()
                bounds.updateBound = true
                bounds.updateStopTime = Date.now() + 3000
            }

            window.addEventListener('resize', onResize)

            return () => {
                for (const child of trailer.children) child.remove()
                dispatch({
                    type: 'pen-up'
                }, {
                    width: window.innerWidth * MAX_BOARD_WIDTH_RATIO,
                    height: window.innerHeight * MAX_BOARD_HEIGHT_RATIO
                })
                window.removeEventListener('resize', onResize)
                trailer.onmousemove = null
            }
        }


    }, [popBubble, useHand, handTrackerRef]);

    return <div style={{
        ...boardDimensions,
        background: '#08c linear-gradient(#33bbff, #08c, #004466)',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        transition: 'width 0.5s, height 0.5s', ...props.style
    }}>
        <video autoPlay playsInline style={{
            ...videoDimensions,
            transition: 'width 0.5s, height 0.5s',
            opacity: useHand ? 0.5 : 0,
            filter: 'blur(10px)',
            transform: 'scaleX(-1)'
        }}
               ref={videoElement}/>
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
        <TimeBar style={{position: 'absolute', top: '50px', left: '50%', transform: 'translateX(-50%)'}}/>
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