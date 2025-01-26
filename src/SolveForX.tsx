import {BubblesBoard} from "./components/BubblesBoard";
import {createRef, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    generateEquation,
    getBonus,
    getBubbleDurationBounds,
    getBubbleSizeBounds,
    getDeduction,
    getEquationBubbleBounds,
    getGameDuration,
    getNextBubbleTimeBounds,
    getNumberBounds,
    getRandom,
    getReleaseTimeBounds,
    getShouldHaveEquationProbability,
    wait
} from "./utilites";
import {EquationsBar} from "./components/EquationsBar";
import {maxEquationsCount} from "./data/contants";
import {GameContext} from "./data/GameContext";
import {Stack} from "@mui/material";
import {
    Bubble, ControlState,
    ControlStates,
    DifficultyLevel,
    DifficultyLevels,
    Equation,
    EventType,
    EventTypes, getDifficultyLabel,
    Status,
    Statuses
} from "./types";
import {HandLandmarker} from "@mediapipe/tasks-vision";
import {TrackScores} from "./components/LeaderBoard.tsx";


const SolveForX = () => {
    const [bubbles, setBubbles] = useState<Bubble[]>([]);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState<Status>(Statuses.STOPPED);
    const [equations, setEquations] = useState<Equation[]>([]);
    const [session, setSession] = useState(0);
    const events = useRef<Array<{ type: EventType, value?: Bubble['value'] }>>([])
    const [difficulty, setDifficulty] = useState<DifficultyLevel>(DifficultyLevels.EASY)
    const sessionInfo = useRef<{ session?: number, difficulty?: DifficultyLevel }>({});
    sessionInfo.current.session = session;
    sessionInfo.current.difficulty = difficulty;
    const popBubble = useCallback((bubble: Bubble) => events.current.push({type: EventTypes.POP, value: bubble.value})
        , [])
    const [gameStartTime, setGameStartTime] = useState(-1);
    const [gameEndTime, setGameEndTime] = useState(-1);
    const handTrackerRef = useRef<{
        locked: boolean,
        handMarker?: HandLandmarker,
        videoStream?: MediaStream
    }>({locked: false});
    const [controlState, setControlState] = useState<ControlState>(ControlStates.MOUSE)
    const gameContext = useMemo(() => ({
        difficulty,
        status,
        gameStartTime,
        gameEndTime
    }), [difficulty, status, gameStartTime, gameEndTime])
    const [pendingScore, setPendingScore] = useState<{ score: number, track: TrackScores['track'] } | null>(null);
    const popSoundRef = useRef<HTMLAudioElement>(null)

    /* game play controls */
    const play = useCallback(() => setSession(session + 1), [session])
    const pause = useCallback(() => events.current.push({type: EventTypes.PAUSE}), [])
    const stop = useCallback(() => events.current.push({type: EventTypes.STOP}), [])
    const unpause = useCallback(() => events.current.push({type: EventTypes.CONTINUE}), [])

    useEffect(() => {
            if (session > 0) {
                const difficulty = sessionInfo.current.difficulty!;
                (async () => {
                    console.log('game started')

                    let myBubbles: Bubble[] = []
                    let myEquations: Equation[] = []
                    let myScore = 0
                    const now = Date.now()
                    let myGameStartTime = now;
                    let myGameEndTime = now + getGameDuration()

                    setStatus(Statuses.PLAYING)
                    setBubbles(myBubbles)
                    setScore(myScore)
                    setEquations(myEquations)

                    setGameStartTime(myGameStartTime)
                    setGameEndTime(myGameEndTime)

                    let nextBubbleTime = 0;
                    myLoop: while (session === sessionInfo.current.session) {
                        let e: { type: EventType, value?: Bubble['value'] } | undefined;
                        let updateBubbles = false;
                        let updateMyEquations = false
                        let updateScore = false;
                        let now = Date.now();
                        while ((e = events.current.pop())) {
                            switch (e.type) {
                                case EventTypes.POP: {
                                    const bubbleIndex = myBubbles.findIndex(b => b.value === e!.value);
                                    const reference = bubbleIndex == -1 ? null : myBubbles[bubbleIndex].reference?.current;
                                    if (reference && !reference.classList.contains('popped')) {
                                        const eqIndex = myEquations.findIndex(eq => !eq.suspended && eq.answer === e!.value)
                                        if (eqIndex >= 0) {
                                            myEquations.splice(eqIndex, 1)
                                            myEquations = [...myEquations]
                                            myScore += getBonus(eqIndex, difficulty)
                                        } else {
                                            if (myEquations.length) {
                                                const eq = myEquations.find(eq => !eq.suspended) || myEquations[0]
                                                eq.suspended = true
                                                eq.releaseTime = now + getRandom(...getReleaseTimeBounds(difficulty))
                                            }
                                            myScore -= getDeduction(difficulty)
                                        }
                                        updateScore = true
                                        updateMyEquations = true
                                        reference.classList.add('popped')
                                        popSoundRef.current!.currentTime = 0.45
                                        popSoundRef.current!.play().then()
                                    }
                                    break
                                }
                                case EventTypes.PAUSE: {
                                    setStatus(Statuses.PAUSED)
                                    const alreadySpent = now - myGameStartTime;
                                    let lastEvent;
                                    while (!events.current.length || !['continue', 'stop'].includes((lastEvent = events.current.pop()!.type))) await wait(20);
                                    if (lastEvent === 'stop') break myLoop
                                    now = Date.now();
                                    myGameStartTime = now - alreadySpent;
                                    myGameEndTime = now + getGameDuration() - alreadySpent
                                    setGameStartTime(myGameStartTime)
                                    setGameEndTime(myGameEndTime)
                                    setStatus(Statuses.PLAYING)
                                    break
                                }
                                case 'stop':
                                    break myLoop
                                default:
                                    console.error('Unknown event: ' + e)
                            }
                        }

                        if (now > myGameEndTime) {
                            setPendingScore({score: myScore, track: getDifficultyLabel(difficulty)})
                            break
                        }

                        if (now > nextBubbleTime) {
                            const numberBounds = getNumberBounds(difficulty)
                            let value: number;
                            do {
                                value = Math.floor(getRandom(...numberBounds));
                            } while (!myBubbles.every(b => b.value !== value));

                            myBubbles = [...myBubbles, {
                                value,
                                createTime: now,
                                duration: getRandom(...getBubbleDurationBounds(difficulty)),
                                auxiliary: Math.random(),
                                size: getRandom(...getBubbleSizeBounds(difficulty)),
                                reference: createRef()
                            }];
                            nextBubbleTime = now + getRandom(...getNextBubbleTimeBounds(difficulty))
                            myBubbles = myBubbles.filter(b => {
                                if (now - b.createTime > b.duration) {
                                    myEquations = myEquations.filter(eq => {
                                        if (!eq.suspended && eq.answer === b.value) {
                                            updateMyEquations = true
                                            return false
                                        }
                                        return true
                                    })

                                    return false;
                                }
                                return true;
                            })
                            updateBubbles = true
                            myEquations = myEquations.filter(eq => {
                                if (eq.suspended && now > eq.releaseTime) {
                                    updateMyEquations = true
                                    return false
                                }
                                return true
                            })

                            if (myEquations.length < maxEquationsCount && Math.random() > getShouldHaveEquationProbability(difficulty)) {
                                const progressBounds = getEquationBubbleBounds(difficulty)
                                const candidates = myBubbles.filter(bubble => myEquations.every(eq => eq.answer !== bubble.value)).filter(bubble => {
                                    const progress = (now - bubble.createTime) / bubble.duration
                                    return progressBounds[0] <= progress && progress <= progressBounds[1];
                                })

                                if (candidates.length) {
                                    const newEq = generateEquation(candidates[Math.floor(getRandom(0, candidates.length))].value, difficulty)
                                    myEquations = [...myEquations, newEq]
                                    updateMyEquations = true
                                }
                            }
                        }

                        if (updateBubbles) setBubbles(myBubbles)
                        if (updateMyEquations) setEquations(myEquations)
                        if (updateScore) setScore(myScore)
                        // console.log("Equations: ", myEquations.filter(eq => !eq.suspended).map(eq => eq.answer), 'suspended: ', myEquations.reduce((total, eq) => eq.suspended ? total + 1 : total, 0), 'score:', myScore)
                        await wait(10)
                    }
                    setScore(myScore)
                    setEquations([])
                    setStatus(Statuses.STOPPED);
                })()
            }
        }, [session]
    )
    return <GameContext.Provider value={gameContext}>
        <Stack justifyContent={'center'} alignItems={'center'} width={'100%'} height={'100%'}>
            <Stack direction={'row'} justifyContent={'center'} style={{borderRadius: '10px', overflow: "hidden"}}>
                <BubblesBoard bubbles={bubbles}
                              popBubble={popBubble} style={{}} play={play} unpause={unpause}
                              controlState={controlState}
                              handTrackerRef={handTrackerRef} pendingScore={pendingScore}
                              setPendingScore={setPendingScore} popSoundRef={popSoundRef}/>
                <EquationsBar score={score} equations={equations} stop={stop} pause={pause}
                              setDifficulty={setDifficulty}
                              controlState={controlState} setControlState={setControlState}
                              handTrackerRef={handTrackerRef}/>
            </Stack>
        </Stack>
    </GameContext.Provider>
}

export default SolveForX;