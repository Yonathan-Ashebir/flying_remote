import {TextBubble} from "./TextBubble";
import {CSSProperties, RefObject, useContext, useEffect, useRef, useState} from "react";
import {
    DEFAULT_BOARD_DIMENS,
    MAX_BOARD_HEIGHT_RATIO,
    MAX_BOARD_WIDTH_RATIO,
    maxBubbleSize,
    MIN_BOARD_HEIGHT,
    MIN_BOARD_WIDTH,
    TRIM_RATIO
} from "../data/contants";
import './trail.css'
import styled from "@emotion/styled";
import {keyframes} from "@emotion/react";
import {TimeBar} from "./TimeBar";
import {GameContext} from "../data/GameContext";
import {Button, Card, IconButton, Stack} from "@mui/material";
import {PlayArrow, PlayCircleFilled, ReplayCircleFilled} from "@mui/icons-material";
import {selectBestScale} from "../utilites";
import {Bubble, ControlState, ControlStates, Statuses} from "../types";
import {HandLandmarker} from "@mediapipe/tasks-vision";
import LeaderBoard, {TrackScores} from "./LeaderBoard.tsx";

interface Props {
    bubbles: Bubble[];
    popBubble: (bubble: Bubble) => void;
    controlState: ControlState;
    handTrackerRef: RefObject<{ handMarker?: HandLandmarker, videoSource?: MediaStream }>;
    style: CSSProperties;
    unpause: () => void;
    play: () => void;
    pendingScore: { score: number, track: TrackScores['track'] } | null;
    setPendingScore: (pending: { score: number, track: TrackScores['track'] } | null) => void;
    popSoundRef: RefObject<HTMLAudioElement>;
}

const PenActions = {
    PEN_DOWN: "pen-down",
    PEN_UP: "pen-up",
    PEN_MOVE: "pen-move",
} as const;
type PenAction = typeof PenActions[keyof typeof PenActions];

const DEMO_SCORES: TrackScores[] = [{
    track: 'easy',
    scores: [
        {"id": 1, "name": "Ahmed", "score": 120},
        {"id": 2, "name": "Fatima", "score": 250},
        {"id": 3, "name": "Omar", "score": 85},
        {"id": 4, "name": "Aisha", "score": 175},
        {"id": 5, "name": "Ali", "score": 210},
        {"id": 6, "name": "Zainab", "score": 95},
        {"id": 7, "name": "Hassan", "score": 160},
        {"id": 8, "name": "Khadija", "score": 130},
        {"id": 9, "name": "Ibrahim", "score": 230},
        {"id": 10, "name": "Mariam", "score": 180}
    ]

}, {track: 'medium', scores: []}, {track: 'hard', scores: []}]

const EMPTY_SCORES: TrackScores[] = [{
    track: 'easy',
    scores: []

}, {track: 'medium', scores: []}, {track: 'hard', scores: []}]

export const BubblesBoard = ({
                                 bubbles,
                                 popBubble,
                                 controlState,
                                 handTrackerRef,
                                 style,
                                 unpause,
                                 play,
                                 pendingScore,
                                 setPendingScore,
                                 popSoundRef,
                                 ...rest
                             }: Props) => {
    const bubblesRef = useRef(bubbles)
    bubblesRef.current = bubbles
    const trailContainer = useRef<HTMLElement>(null)
    const pen = useRef<HTMLElement>(null)
    const videoElement = useRef<HTMLVideoElement>(null)
    const pen2 = useRef<HTMLElement>(null)
    const gameContext = useContext(GameContext)
    const useHand = controlState === ControlStates.HAND
    const [boardDimensions, setBoardDimensions] = useState(DEFAULT_BOARD_DIMENS);
    const [videoDimensions, setVideoDimensions] = useState(DEFAULT_BOARD_DIMENS);
    const handlerTicket = useRef(Math.random())

    const [scores, setScores] = useState<TrackScores[]>(() => {
        const oldScores = localStorage.getItem('scores')
        return (oldScores ? JSON.parse(oldScores) as TrackScores[] : DEMO_SCORES).map(({track, scores}) => ({
            track,
            scores: scores.sort((a, b) => b.score - a.score)
        }))
    });

    useEffect(() => {
        localStorage.setItem('scores', JSON.stringify(scores))
    }, [scores]);

    const [latestScoreID, setLatestScoreID] = useState<number | null>(scores.find(t => t.scores.length)?.scores[0]?.id || null)
    const scoreID = useRef(-1)
    if (scoreID.current === -1) {
        scoreID.current = Number.parseInt(localStorage.getItem('lastID') ?? '30')
    }

    useEffect(() => {
        const myTicket = ++handlerTicket.current
        const data: { trail: HTMLElement[] } = {trail: []}
        const maximumHistorySize = 50;
        const trailer = trailContainer.current!
        const dispatch = ({x, y, type}: { x?: number, y?: number, type: PenAction }, boardDimension?: {
            width: number,
            height: number
        }) => {
            switch (type) {
                // tslint:disable-next-line:no-switch-case-fall-through
                case PenActions.PEN_DOWN:
                    pen.current!.classList.add('down')
                // tslint:disable-next-line:no-switch-case-fall-through
                case PenActions.PEN_MOVE: {
                    const now = Date.now();
                    for (const bubble of bubblesRef.current) {
                        const cx = bubble.auxiliary * (boardDimension!.width - maxBubbleSize) + bubble.size / 2
                        const cy = boardDimension!.height - (now - bubble.createTime) * (boardDimension!.height + maxBubbleSize * 1.5) / bubble.duration + bubble.size / 2
                        if ((cx - x!) ** 2 + (cy - y!) ** 2 < bubble.size ** 2 / 2) popBubble(bubble)
                    }
                    pen.current!.style.top = `${y}px`
                    pen.current!.style.left = `${x}px`
                    const trailSpot = document.createElement('div')
                    trailSpot.className = 'trail-spot'
                    trailSpot.style.top = `${y}px`
                    trailSpot.style.left = `${x}px`
                    data.trail.push(trailSpot)
                    trailer.appendChild(trailSpot)

                    if (data.trail.length > maximumHistorySize)
                        trailer.removeChild(data.trail.shift()!)
                    break;
                }
                case 'pen-up':
                    pen.current!.classList.remove('down')
                    break;
                default:
                    console.warn('unknown message type: ' + type)
            }
        }
        if (useHand) {
            const {handMarker, videoSource} = handTrackerRef.current!

            const measure = () => {
                const {videoHeight: initialVideoHeight, videoWidth: initialVideoWidth} = videoElement.current!
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
                return {width: adjustedWidth, height: adjustedHeight, initialVideoWidth, initialVideoHeight, scale}
            }
            const measurements: { current: ReturnType<typeof measure> | null } = {current: null}
            const onResize = () => {
                measurements.current = measure()
            }
            videoElement.current!.onloadedmetadata = () => {
                measurements.current = measure()
                window.addEventListener('resize', onResize)
                const trackHand = (data: { lastVideoTime: HTMLVideoElement['currentTime'], penDown?: boolean }) => {
                    const {lastVideoTime, penDown = false} = data
                    if (myTicket !== handlerTicket.current) return
                    const startTimeMs = performance.now();
                    const currentTime = videoElement.current!.currentTime
                    data.lastVideoTime = currentTime
                    requestAnimationFrame(() => trackHand(data))
                    if (lastVideoTime === currentTime) return;
                    const results = handMarker!.detectForVideo(videoElement.current!, startTimeMs);
                    if (!results.landmarks.length) {
                        data.penDown = false
                        if (penDown) dispatch({type: 'pen-up'}, measurements.current!)
                        return
                    }
                    const middleFinger = results.landmarks[0][8]
                    const x = (measurements.current!.initialVideoWidth - middleFinger.x * measurements.current!.initialVideoWidth) * measurements.current!.scale
                    const y = middleFinger.y * measurements.current!.initialVideoHeight * measurements.current!.scale
                    if (!penDown) dispatch({type: 'pen-down', x, y}, measurements.current!)
                    data.penDown = true
                    dispatch({
                        type: PenActions.PEN_MOVE,
                        x, y
                    }, measurements.current!)
                }
                trackHand({lastVideoTime: -1})
            }
            videoElement.current!.srcObject = videoSource!
            return () => {
                for (const child of trailer.children) child.remove()
                window.removeEventListener('resize', onResize)
                dispatch({type: PenActions.PEN_UP})
                videoSource!.getTracks().forEach((t: MediaStreamTrack) => t.stop())
            };
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
            trailer.onmousemove = (ev: MouseEvent) => {
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

    return (
        <div style={{
            ...boardDimensions,
            background: '#08c linear-gradient(#33bbff, #08c, #004466)',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'clip',
            transition: 'width 0.5s, height 0.5s', ...style
        }} {...rest}>
            <video autoPlay playsInline style={{
                ...videoDimensions, //TODO: why height is causing issues
                transition: 'width 0.5s, height 0.5s',
                opacity: useHand ? 0.5 : 0,
                filter: 'blur(10px)',
                transform: 'scaleX(-1)',
                maxWidth: 'unset',
                maxHeight: 'unset',
            }}
                   ref={videoElement}/>
            <div style={{width: `calc(100% - ${maxBubbleSize}px)`, height: '100%', position: 'absolute', top: '0'}}>
                {bubbles.map((b) => <FloatingBubble key={b.value} style={{left: b.auxiliary * 100 + '%'}}
                                                    size={b.size + 'px'}
                                                    duration={b.duration}
                                                    refFix={b.reference}>
                        {b.value}
                    </FloatingBubble>
                )}

            </div>
            <audio ref={popSoundRef} src="/pop.mp3" preload="auto" className={'hidden'}></audio>
            <div ref={trailContainer as RefObject<HTMLDivElement>}
                 style={{width: '100%', height: '100%', position: 'absolute', top: '0'}}>
            </div>
            <div className='pen' ref={pen as RefObject<HTMLDivElement>} style={{
                width: '10px',
                height: '10px',
                background: 'red',
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                top: '0'
            }}></div>
            <div className='pen' ref={pen2 as RefObject<HTMLDivElement>} style={{
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

            <Stack style={{
                visibility: gameContext.status === Statuses.PLAYING ? 'hidden' : 'visible',
                opacity: gameContext.status === Statuses.PLAYING ? 0 : 1,
                transition: 'opacity 0.5s',
                background: '#00000055',
                backdropFilter: 'blur(10px)',
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: 0,
                left: 0
            }} alignItems={'center'} justifyContent={'center'}>
                <LeaderBoard scores={scores} pendingScore={pendingScore}
                             clearPendingAndAddScore={(name, score, track) => {
                                 const currentTrackScores = scores.find(scores => scores.track === track)!
                                 const currentTrackIndex = scores.findIndex(t => t.track === track)
                                 const newScores = [...scores]
                                 newScores[currentTrackIndex] = {
                                     ...currentTrackScores,
                                     scores: [...(currentTrackScores.scores), {id: scoreID.current, name, score}]
                                 }
                                 setScores(newScores.map(({track, scores}) => ({
                                     track,
                                     scores: scores.sort((a, b) => b.score - a.score)
                                 })))
                                 setPendingScore(null)
                                 setLatestScoreID(scoreID.current++)
                                 localStorage.setItem("lastID", scoreID.current.toString())
                             }}
                             clearLeaderBoard={() => setScores(EMPTY_SCORES)}
                             latestScoreID={latestScoreID}></LeaderBoard>
                <div className="mt-4" style={{backgroundColor: 'transparent'}}>
                    {(gameContext.status === Statuses.PAUSED &&
                        <Button onClick={unpause}><PlayArrow color={'primary'}
                                                             fontSize={'large'}/></Button>) ||
                        (gameContext.gameStartTime === -1 ?
                                <Button onClick={play} sx={{color:'white'}}><PlayCircleFilled
                                    fontSize={'large'}/>&nbsp;Play</Button>:
                                <Button onClick={play} sx={{color:'white'}}><ReplayCircleFilled
                                    fontSize={'large'}/>&nbsp;Restart</Button>
                        )
                    }
                </div>
            </Stack>
        </div>
    )
        ;
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
    animation: ${floatUp} linear ${(props) => props.duration}ms forwards;
`