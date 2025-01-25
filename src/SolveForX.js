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
import {ControlState, Difficulty, maxEquationsCount, Status} from "./data/contants";
import {GameContext} from "./data/GameContext";
import {Stack} from "@mui/material";


const SolveForX = props => {
  const [bubbles, setBubbles] = useState([]);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState(Status.STOPPED);
  const [equations, setEquations] = useState([]);
  const [session, setSession] = useState(0);
  const events = useRef([])
  const [difficulty, setDifficulty] = useState(Difficulty.EASY)
  const sessionInfo = useRef({});
  sessionInfo.current.session = session;
  sessionInfo.current.difficulty = difficulty;
  const popBubble = useCallback(bubble => events.current.push({type: 'pop', value: bubble.value})
    , [])
  const [gameStartTime, setGameStartTime] = useState(-1);
  const [gameEndTime, setGameEndTime] = useState(-1);
  const handTrackerRef = useRef({locked: false, handMarker: null, videoStream: null});
  const [controlState, setControlState] = useState(ControlState.MOUSE)
  const gameContext = useMemo(() => ({
    difficulty,
    status,
    gameStartTime,
    gameEndTime
  }), [difficulty, status, gameStartTime, gameEndTime])

  /* game play controls */
  const play = useCallback(() => setSession(session + 1), [session])
  const pause = useCallback(() => events.current.push({type: 'pause'}), [])
  const stop = useCallback(() => events.current.push({type: 'stop'}), [])
  const unpause = useCallback(() => events.current.push({type: 'continue'}), [])

  useEffect(() => {
      if (session > 0) {
        const difficulty = sessionInfo.current.difficulty;
        (async () => {
          console.log('game started')

          let myBubbles = []
          let myEquations = []
          let myScore = 0
          const now = Date.now()
          let myGameStartTime = now;
          let myGameEndTime = now + getGameDuration()

          setStatus(Status.PLAYING)
          setBubbles(myBubbles)
          setScore(myScore)
          setEquations(myEquations)

          setGameStartTime(myGameStartTime)
          setGameEndTime(myGameEndTime)

          let nextBubbleTime = 0;
          myLoop: while (session === sessionInfo.current.session) {
            let e;
            let updateBubbles = false;
            let updateMyEquations = false
            let updateScore = false;
            let now = Date.now();
            while ((e = events.current.pop())) {
              switch (e.type) {
                case 'pop':
                  const reference = myBubbles.find(b => b.value === e.value)?.reference?.current
                  if (reference && !reference.classList.contains('popped')) {
                    const eqIndex = myEquations.findIndex(eq => !eq.suspended && eq.answer === e.value)
                    if (eqIndex >= 0) {
                      myEquations.splice(eqIndex, 1)
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
                  }
                  break
                case 'pause':
                  setStatus(Status.PAUSED)
                  const alreadySpent = now - myGameStartTime;
                  let lastEvent;
                  while (!events.current.length || !['continue', 'stop'].includes((lastEvent = events.current.pop().type))) await wait(20);
                  if (lastEvent === 'stop') break myLoop
                  now = Date.now();
                  myGameStartTime = now - alreadySpent;
                  myGameEndTime = now + getGameDuration() - alreadySpent
                  setGameStartTime(myGameStartTime)
                  setGameEndTime(myGameEndTime)
                  setStatus(Status.PLAYING)
                  break
                case 'stop':
                  break myLoop
                default:
                  console.error('Unknown event: ' + e)
              }
            }

            if (now > myGameEndTime) break

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

              if (myEquations.length < maxEquationsCount && Math.random() > getShouldHaveEquationProbability(difficulty)) {
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
          setEquations([])
          setStatus(Status.STOPPED);
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
                      handTrackerRef={handTrackerRef}/>
        <EquationsBar score={score} equations={equations} stop={stop} pause={pause}
                      setDifficulty={setDifficulty}
                      controlState={controlState} setControlState={setControlState}
                      handTrackerRef={handTrackerRef}/>
      </Stack>
    </Stack>
  </GameContext.Provider>
}

export default SolveForX;