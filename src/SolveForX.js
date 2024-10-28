import {BubblesBoard} from "./components/BubblesBoard";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    getBubbleDurationBounds, getBubbleSizeBounds,
    getBubbleVelocityBounds,
    getNextBubbleTimeBounds,
    getNumberBounds,
    getRandom,
    wait
} from "./utilites";

const Difficulty = {
    EASY: 0,
    MEDIUM: 1,
    HARD: 2
}

const Status = {
    PLAYING: 0,
    PAUSED: 1,
    STOPPED: 2
}


const SolveForX = props => {
    const [bubbles, setBubbles] = useState([]);
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState(Status.STOPPED);
    const [session, setSession] = useState(1); //todo: reset
    const ticketRef = useRef(0);
    const events = useRef([])
    const [difficulty, setDifficulty] = useState(Difficulty.EASY)
    const popBubble = useCallback(bubble => {
        console.log('popped', bubble, Date.now())
        events.current.push({type: 'pop', value: bubble.value})
    }, [])

    useEffect(() => {
            if (session) {
                const myTicket = ++ticketRef.current;
                (async () => {
                    console.log('game started')
                    let myBubbles = []
                    let myScore = 0

                    setStatus(Status.PLAYING)
                    setBubbles(myBubbles)
                    setScore(myScore)

                    let nextBubbleTime = 0;
                    while (myTicket === ticketRef.current) {
                        let e;
                        let updateBubbles = false;
                        while ((e = events.current.pop())) {
                            switch (e.type) {
                                case 'pop':
                                    myBubbles.find(b => b.value === e.value).reference.current?.classList.add('popped')
                                    console.log('popped2', e.value, Date.now())
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

                        const now = Date.now();
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
                                reference: {current: null}
                            });
                            nextBubbleTime = now + getRandom(...getNextBubbleTimeBounds(difficulty))

                            myBubbles = myBubbles.filter(b => now - b.createTime < b.duration) //todo
                            setBubbles(myBubbles)
                        } else if (updateBubbles) setBubbles(myBubbles)

                        await wait(10)
                    }
                    // setStatus(Status.STOPPED); //todo
                })()
            }
        }, [session, difficulty, events]
    )
    return <BubblesBoard bubbles={bubbles}
                         popBubble={popBubble}/>
}

export default SolveForX;