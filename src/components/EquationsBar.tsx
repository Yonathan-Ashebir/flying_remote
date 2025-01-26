import {SwitchTransition, TransitionGroup} from "react-transition-group";
import {CSSProperties, forwardRef, ReactNode, RefObject, useContext} from "react";
import './equation-bar.css'
import {Card, CardContent, FormControlLabel, IconButton, Slider, Stack, Switch, Typography} from "@mui/material";
import {CSSFadeTransition} from "./transitions/CSSFadeTransition";
import {getBonus, notify} from "../utilites";
import {GameContext} from "../data/GameContext";
import {StopCircle, WavingHand} from '@mui/icons-material'
import {CSSSlideUpCollapseTransition} from "./transitions/CSSSlideUpCollapseTransition";
import {FilesetResolver, HandLandmarker} from "@mediapipe/tasks-vision";

import {
    ControlState,
    ControlStates,
    DifficultyLevel,
    DifficultyLevels,
    Equation as EquationInfo,
    Statuses
} from "../types";
import {AnimatePresence, motion} from "framer-motion";


interface Props {
    controlState: ControlState;
    handTrackerRef: RefObject<{ handMarker?: HandLandmarker, videoSource?: MediaStream, locked: boolean }>;
    setControlState: (controlState: ControlState) => void;
    score: number;
    equations: EquationInfo[];
    setDifficulty: (difficultyLevel: DifficultyLevel) => void;
    stop: () => void;
    pause: () => void;
}

export const EquationsBar = ({
                                 controlState,
                                 handTrackerRef,
                                 setControlState,
                                 score,
                                 equations,
                                 setDifficulty,
                                 stop,
                                 pause,
                             }: Props) => {
    const gameContext = useContext(GameContext);
    return (
        <Stack style={{background: '#08c linear-gradient(#33bbff, #08c, #004466)', minWidth: '16em'}} className='h-full overflow-clip' spacing={2}
               padding={2}>
            <Card>
                <CardContent>
                    <Stack>
                        <Typography variant={"caption"} style={{opacity: 0.8}}>Score:</Typography>
                        <Typography textAlign={'center'} className={'variable-letter'} style={{
                            fontWeight: 'bold', textAlign: 'end',
                            fontFamily: 'roboto', // todo: check
                            padding: '0.2em 0.4em'
                        }} variant={"h3"}>
                            <SwitchTransition>
                                <CSSFadeTransition key={score}> {score}</CSSFadeTransition>
                            </SwitchTransition>

                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
            <Card sx={{maxHeight: '100%', overflow: 'hidden'}}>
                <CardContent>
                    <Stack >
                        <Typography variant={"caption"} sx={{opacity: 0.8, marginBottom: 1}}>Equations:</Typography>
                        <Stack style={{transition: 'height 1s'}} className={'min-w-3xs'}>
                            <TransitionGroup component={null}>
                                {equations.map((equation, index) =>
                                    <CSSSlideUpCollapseTransition key={equation.answer}>
                                        <Equation equation={equation}
                                                  ref={equation.reference as RefObject<HTMLDivElement>} index={index}/>
                                    </CSSSlideUpCollapseTransition>)
                                }
                            </TransitionGroup>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
            <span style={{flexGrow: '1'}}></span>
            <TransitionGroup component={'div'}>
                {gameContext.status === Statuses.STOPPED &&
                  <CSSSlideUpCollapseTransition><Card>
                    <CardContent><Stack>
                      <Typography variant={"caption"} style={{opacity: 0.8}}>Difficulty:</Typography>
                      <Slider sx={{fontSize: '0.5em'}} step={null} min={DifficultyLevels.EASY - 1}
                              defaultValue={gameContext.difficulty}
                              max={DifficultyLevels.HARD + 1}
                              onChange={(_, value) => setDifficulty(value as DifficultyLevel)}
                              marks={[{value: DifficultyLevels.EASY, label: 'EASY'}, {
                                  value: DifficultyLevels.MEDIUM,
                                  label: 'MEDIUM'
                              }, {value: DifficultyLevels.HARD, label: 'HARD'}]}
                              valueLabelDisplay="off"/>
                    </Stack>
                    </CardContent>
                  </Card>
                  </CSSSlideUpCollapseTransition>}
                {gameContext.status !== Statuses.STOPPED &&
                  <CSSSlideUpCollapseTransition><Card>
                    <Stack direction={'row'} justifyContent={'center'}>
                        {/*gameContext.status === Status.PLAYING &&
                        <IconButton onClick={props.pause}>
                            <PauseCircle fontSize={'large'}/>
                        </IconButton>
                    */}
                      <IconButton onClick={stop}>
                        <StopCircle fontSize={'large'} color='error'/>
                      </IconButton>
                    </Stack>
                  </Card>
                  </CSSSlideUpCollapseTransition>
                }
            </TransitionGroup>
            <Stack>
                <FormControlLabel
                    control={
                        <Switch checked={controlState !== ControlStates.MOUSE} onChange={() => {
                            if (controlState === ControlStates.MOUSE) {
                                setControlState(ControlStates.LOADING_HAND)
                                if (!handTrackerRef.current!.locked) {
                                    handTrackerRef.current!.locked = true; // locking
                                    (async () => {
                                        const vision = await FilesetResolver.forVisionTasks("/wasm");
                                        if (!handTrackerRef.current!.handMarker) handTrackerRef.current!.handMarker = await HandLandmarker.createFromOptions(vision, {
                                            baseOptions: {
                                                modelAssetPath: `/models/hand_landmarker.task`,
                                                delegate: "GPU"
                                            },
                                            runningMode: 'VIDEO',
                                            numHands: 1
                                        })
                                        handTrackerRef.current!.videoSource = await navigator.mediaDevices.getUserMedia({video: true})
                                        handTrackerRef.current!.locked = false
                                    })().then(() => setControlState(ControlStates.HAND), (e) => {
                                        handTrackerRef.current!.locked = false; // unlocking on failure
                                        setControlState(ControlStates.MOUSE)
                                        console.error(e)
                                        notify(e.toString())
                                    })
                                }
                            } else if (controlState === ControlStates.HAND) setControlState(ControlStates.MOUSE)
                        }} disabled={controlState === ControlStates.LOADING_HAND}/>
                    }
                    label={<WavingHand style={{paddingTop: '0.2em'}}/>}
                />
            </Stack>
        </Stack>
    );
}
const Equation = forwardRef<HTMLDivElement, {
    equation: EquationInfo;
    index: number;
    style?: CSSProperties;
    className?: string;
}>(({equation, index, style = {}, className = '', ...rest}, ref) => {
    const gameContext = useContext(GameContext);

    return (
        <motion.div
            {...rest}
            ref={ref}
            className={`equation mt-2 ${equation.suspended ? 'equation-suspended' : ''} ${className}`}
            initial={{opacity: 0, y: 20}}
            animate={{opacity: 1, y: 0}}
            exit={{opacity: 0, y: -20}}
            transition={{duration: 0.3}}
            style={{
                position: 'relative',
                background: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                ...style
            }}
        >
            {index !== 0 && (
                <motion.div
                    initial={{scaleX: 0}}
                    animate={{scaleX: 1}}
                    transition={{duration: 0.5, ease: "easeInOut"}}
                    style={{
                        width: '80%',
                        height: '1px',
                        background: 'linear-gradient(to right, transparent, rgba(0, 0, 0, 0.1), transparent)',
                        margin: '0 auto'
                    }}
                />
            )}

            <div style={{padding: '1.5em', display: 'flex', alignItems: 'center'}}>
                <motion.div
                    layout
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '2rem',
                        fontFamily: 'monospace',
                        color: '#2d3748',
                        paddingRight: '3rem'
                    }}
                >
                    {equation.question.map((el, ind) => (
                        el === 'x' ? (
                            <VariableChar key={ind}>{el}</VariableChar>
                        ) : (
                            <NormalChar key={ind}>{el}</NormalChar>
                        )
                    ))}
                </motion.div>

                <motion.div
                    initial={{opacity: 0, scale: 0.8}}
                    animate={{opacity: 1, scale: 1}}
                    style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        background: 'linear-gradient(135deg, #4299e1, #667eea)',
                        padding: '0.4em 0.8em',
                        borderRadius: '999px',
                        color: 'white',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 10px rgba(66, 153, 225, 0.3)'
                    }}
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={index}
                            initial={{opacity: 0, y: -10}}
                            animate={{opacity: 1, y: 0}}
                            exit={{opacity: 0, y: 10}}
                            transition={{duration: 0.2}}
                        >
                            +{getBonus(index, gameContext.difficulty)}
                        </motion.span>
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
});

const NormalChar = ({children, className = '', ...rest}: { children: ReactNode; className?: string }) => (
    <motion.span
        {...rest}
        className={className}
        initial={{opacity: 0, y: 10}}
        animate={{opacity: 1, y: 0}}
        transition={{duration: 0.3}}
        style={{
            display: 'inline-block',
            padding: '0 0.1em',
            color: '#2d3748'
        }}
    >
        {children}
    </motion.span>
);

const VariableChar = ({children, className = '', ...rest}: { children: string; className?: string }) => (
    <motion.span
        {...rest}
        className={className}
        initial={{scale: 0.8}}
        animate={{scale: 1}}
        whileHover={{scale: 1.1}}
        transition={{type: "spring", stiffness: 400, damping: 17}}
        style={{
            display: 'inline-block',
            padding: '0 0.2em',
            color: '#4299e1',
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #4299e1, #667eea)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 2px 10px rgba(66, 153, 225, 0.2)'
        }}
    >
        {children}
    </motion.span>
);
