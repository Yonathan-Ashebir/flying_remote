import {useContext, useEffect, useState} from "react";
import {GameContext} from "../data/GameContext";
import {LinearProgress, Paper} from "@mui/material";
import {Status} from "../data/contants";
import {constrainBetween} from "../utilites";
import {TransitionGroup} from "react-transition-group";
import {CSSSlideUpTransition} from "./transitions/CSSSlideUpTransition";

export const Timebar = ({...rest}) => {
    const gameContext = useContext(GameContext);
    const [remaining, setRemaining] = useState(100);

    useEffect(() => {
            if ((gameContext.status === Status.PLAYING || gameContext.status === Status.PAUSED) && gameContext.gameStartTime !== -1 && gameContext.gameEndTime !== -1) {
                const interval = setInterval(() => {
                    setRemaining(constrainBetween((gameContext.gameEndTime - Date.now()) / (gameContext.gameEndTime - gameContext.gameStartTime), 0, 1) * 100);
                }, 50)
                return () => clearInterval(interval)
            }
        }, [gameContext]
    )
    return <CSSSlideUpTransition {...rest}
                                 in={(gameContext.status === Status.PLAYING || gameContext.status === Status.PAUSED) && gameContext.gameStartTime !== -1 && gameContext.gameEndTime !== -1}>
        <Paper style={{padding: '10px', borderRadius: '15px'}}>
            <LinearProgress variant={'determinate'} style={{minWidth: '50vw', height: '20px', borderRadius: '10px'}}
                            value={remaining}/>
        </Paper>
    </CSSSlideUpTransition>
}