import {CSSTransition, SwitchTransition, TransitionGroup} from "react-transition-group";
import {forwardRef, useContext} from "react";
import './equation-bar.css'
import {Card, CardContent, FormControlLabel, IconButton, Slider, Stack, Switch, Typography} from "@mui/material";
import {CSSFadeTransition} from "./transitions/CSSFadeTransition";
import {getBonus, notify} from "../utilites";
import {GameContext} from "../data/GameContext";
import {StopCircle, WavingHand} from '@mui/icons-material'
import {ControlState, Difficulty, Status} from "../data/contants";
import {CSSSlideUpCollapseTransition} from "./transitions/CSSSlideUpCollapseTransition";
import {FilesetResolver, HandLandmarker} from "@mediapipe/tasks-vision";

export const EquationsBar = (props: any) => {
    const gameContext = useContext(GameContext);
    const {controlState, handTrackerRef, setControlState} = props

    return (
        <Stack style={{background: '#08c linear-gradient(#33bbff, #08c, #004466)', minWidth: '16em'}} spacing={2}
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
                                <CSSFadeTransition key={props.score}> {props.score}</CSSFadeTransition>
                            </SwitchTransition>

                        </Typography>
                    </Stack>
                </CardContent>
            </Card>
            <Card>
                <CardContent>
                    <Stack>
                        <Typography variant={"caption"} style={{opacity: 0.8}}>Equations:</Typography>
                        <Stack style={{transition: 'height 1s'}}>
                            <TransitionGroup component={null}>
                                {props.equations.map((equation: any, index: any) =>
                                    <CSSSlideUpCollapseTransition key={index}>
                                        <Equation eq={equation} ref={equation.reference} index={index}/>
                                    </CSSSlideUpCollapseTransition>)
                                }
                            </TransitionGroup>
                        </Stack>
                    </Stack>
                </CardContent>
            </Card>
            <span style={{flexGrow: '1'}}></span>
            <TransitionGroup component={'div'}>
                {gameContext.status === Status.STOPPED &&
                    <CSSSlideUpCollapseTransition><Card>
                        <CardContent><Stack>
                            <Typography variant={"caption"} style={{opacity: 0.8}}>Difficulty:</Typography>
                            <Slider sx={{fontSize: '0.5em'}} size={'large'} step={null} min={Difficulty.EASY - 1}
                                    defaultValue={gameContext.difficulty}
                                    max={Difficulty.HARD + 1}
                                    onChange={(_: any, value: any) => props.setDifficulty(value)}
                                    marks={[{value: Difficulty.EASY, label: 'EASY'}, {
                                        value: Difficulty.MEDIUM,
                                        label: 'MEDIUM'
                                    }, {value: Difficulty.HARD, label: 'HARD'}]}
                                    valueLabelDisplay="off"/>
                        </Stack>
                        </CardContent>
                    </Card>
                    </CSSSlideUpCollapseTransition>}
                {gameContext.status !== Status.STOPPED &&
                    <CSSSlideUpCollapseTransition><Card>
                        <Stack direction={'row'} justifyContent={'center'}>
                            {/*gameContext.status === Status.PLAYING &&
                        <IconButton onClick={props.pause}>
                            <PauseCircle fontSize={'large'}/>
                        </IconButton>
                    */}
                            <IconButton onClick={props.stop}>
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
                        <Switch checked={controlState !== ControlState.MOUSE} onChange={() => {
                            if (controlState === ControlState.MOUSE) {
                                setControlState(ControlState.LOADING_HAND)
                                if (!handTrackerRef.current.locked) {
                                    handTrackerRef.current.locked = true; // locking
                                    (async () => {
                                        const vision = await FilesetResolver.forVisionTasks("/wasm" );
                                        if (!handTrackerRef.current.handMarker) handTrackerRef.current.handMarker = await HandLandmarker.createFromOptions(vision, {
                                            baseOptions: {
                                                modelAssetPath: `/models/hand_landmarker.task`,
                                                delegate: "GPU"
                                            },
                                            runningMode: 'VIDEO',
                                            numHands: 1
                                        })
                                        handTrackerRef.current.videoSource = await navigator.mediaDevices.getUserMedia({video: true})
                                        handTrackerRef.current.locked = false
                                    })().then(() => setControlState(ControlState.HAND), (e) => {
                                        handTrackerRef.current.locked = false; // unlocking on failure
                                        setControlState(ControlState.MOUSE)
                                        console.error(e)
                                        notify(e.toString())
                                    })
                                }
                            } else if (controlState === ControlState.HAND) setControlState(ControlState.MOUSE)
                        }} disabled={controlState === ControlState.LOADING_HAND}/>
                    }
                    label={<WavingHand style={{paddingTop: '0.2em'}}/>}
                />
            </Stack>
        </Stack>
    );
}
const Equation = forwardRef(({eq, index, style = {}, className = '', ...rest}, ref) => {
    const gameContext = useContext(GameContext);
    return (
        <Stack {...rest} ref={ref}
                      className={'equation' + (eq.suspended ? ' equation-suspended ' : ' ') + className}
                      style={{position: 'relative', ...style}}>
            {index !== 0 &&
                <hr style={{width: '80%', background: '#00000055', height: '1px', border: "none", margin: '0 auto'}}/>}
            <Stack direction={'row'} style={{padding: '1em'}}>
                <span style={{
                    display: 'flex',
                    justifyContent: 'stretch',
                    alignItems: 'stretch',
                    fontSize: '2rem',
                    paddingRight: '1rem'
                }}>
                    {eq.question.map((el: any, ind: any) => {
                        if (el === 'x') return <VariableChar key={ind}>{el}</VariableChar>
                        return <NormalChar key={ind}>{el}</NormalChar>
                    })}
                </span>
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    border: 'solid 1px #00000044',
                    padding: '2px',
                    borderRadius: '5px',
                    marginTop: '5px',
                    color: '#000000cc',
                }}>
                    <SwitchTransition>
                        <CSSFadeTransition key={index}>
                            +{getBonus(index, gameContext.difficulty)}
                        </CSSFadeTransition>
                    </SwitchTransition>
                </div>
            </Stack></Stack>
    );
})

const NormalChar = ({
    children,
    className,
    ...others
}: any) => <span {...others}
                                                               className={"normal-letter " + className}><span>{children}</span></span>
const VariableChar = ({
    children,
    className,
    ...others
}: any) => <span {...others}
                                                                 className={'variable-letter ' + className}>{children}</span>