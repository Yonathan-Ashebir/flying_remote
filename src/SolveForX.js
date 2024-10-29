import {BubblesBoard} from "./components/BubblesBoard";
import {createRef, useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    generateEquation,
    getBonus,
    getBubbleDurationBounds,
    getBubbleSizeBounds,
    getEquationBubbleBounds,
    getNextBubbleTimeBounds,
    getNumberBounds,
    getRandom,
    getReleaseTimeBounds,
    wait
} from "./utilites";
import {EquationsBar} from "./components/EquationsBar";
import {Difficulty, maxEquationsCount, Status} from "./data/contants";
import {GameContext} from "./data/GameContext";


const SolveForX = props => {
    const [bubbles, setBubbles] = useState([]);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState(Status.STOPPED);
    const [equations, setEquations] = useState([]);
    const [session, setSession] = useState(1); //todo: reset
    const ticketRef = useRef(0);
    const events = useRef([])
    const [difficulty, setDifficulty] = useState(Difficulty.EASY)
    const popBubble = useCallback(bubble => events.current.push({type: 'pop', value: bubble.value})
        , [])
    const gameContext = useMemo(() => ({difficulty, status}), [difficulty, status])

    useEffect(() => {
            if (session) {
                const myTicket = ++ticketRef.current;
                (async () => {
                    console.log('game started')
                    let myBubbles = []
                    let myEquations = []
                    let myScore = 0

                    setStatus(Status.PLAYING)
                    setBubbles(myBubbles)
                    setScore(myScore)
                    setEquations(myEquations)

                    let nextBubbleTime = 0;
                    while (myTicket === ticketRef.current) {
                        let e;
                        let updateBubbles = false;
                        let updateMyEquations = false
                        let updateScore = false;
                        const now = Date.now();
                        while ((e = events.current.pop())) {
                            switch (e.type) {
                                case 'pop':
                                    myBubbles.find(b => b.value === e.value).reference.current?.classList.add('popped')
                                    const eqIndex = myEquations.findIndex(eq => !eq.suspended && eq.answer === e.value)
                                    if (eqIndex >= 0) {
                                        myEquations.splice(eqIndex, 1)
                                        myScore += getBonus(eqIndex, difficulty)
                                        updateScore = true
                                    } else if (myEquations.length) {
                                        const eq = myEquations.find(eq => !eq.suspended) || myEquations[0]
                                        eq.suspended = true
                                        eq.releaseTime = now + getRandom(...getReleaseTimeBounds(difficulty))
                                    }
                                    updateMyEquations = true
                                    break
                                case 'pause':
                                    setStatus(Status.PAUSED)
                                    while (events.current.pop().type !== 'continue') await wait(20);
                                    setStatus(Status.PLAYING)
                                    break
                                case 'stop':
                                    setStatus(Status.STOPPED)
                                    return
                                default:
                                    console.error('Unknown event: ' + e)
                            }
                        }

                        if (now > nextBubbleTime) {
                            const numberBounds = getNumberBounds(difficulty)
                            let value = null;
                            do {
                                value = Math.floor(getRandom(...numberBounds));
                            } while (!myBubbles.every(b => b.value !== value));

                            myBubbles.push({
                                value,
                                createTime: now,
                                duration: getRandom(...getBubbleDurationBounds(difficulty)),
                                auxiliary: Math.random(),
                                size: getRandom(...getBubbleSizeBounds(difficulty)),
                                popped: false,
                                reference: createRef()
                            });
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

                            if (myEquations.length < maxEquationsCount) {
                                const progressBounds = getEquationBubbleBounds(difficulty)
                                const candidates = myBubbles.filter(bubble => myEquations.every(eq => eq.answer !== bubble.value)).filter(bubble => {
                                    const progress = (now - bubble.createTime) / bubble.duration
                                    return progressBounds[0] <= progress && progress <= progressBounds[1];
                                })

                                if (candidates.length) {
                                    const newEq = generateEquation(candidates[Math.floor(getRandom(0, candidates.length))].value, difficulty)
                                    myEquations.push(newEq)
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
                    // setStatus(Status.STOPPED); //todo
                })()
            }
        }, [session, difficulty, events]
    )


    return <GameContext.Provider value={gameContext}>
        <div>

        </div>
        <div style={{display: "flex", flexFlow: 'row', justifyContent: 'center'}}>
            <BubblesBoard bubbles={bubbles}
                          popBubble={popBubble} style={{}}/>
            <EquationsBar score={score} equations={equations}/>
        </div>
    </GameContext.Provider>
}

export default SolveForX;