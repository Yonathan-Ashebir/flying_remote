import {useContext, useEffect, useState} from "react";
import {GameContext} from "../data/GameContext";
import {LinearProgress, Paper} from "@mui/material";
import {Status} from "../data/contants";
import {constrainBetween} from "../utilites";
import {CSSSlideUpTransition} from "./transitions/CSSSlideUpTransition";
import {CSSFadeTransition} from "./transitions/CSSFadeTransition";

export const TimeBar = ({
    style,
    ...rest
}: any) => {
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
    return <div style={{minWidth: '80%', ...style}} {...rest}>
        <CSSFadeTransition
            in={(gameContext.status === Status.PLAYING || gameContext.status === Status.PAUSED) && gameContext.gameStartTime !== -1 && gameContext.gameEndTime !== -1}>
            <Paper style={{padding: '10px', borderRadius: '15px'}}>
                <LinearProgress variant={'determinate'} style={{height: '20px', borderRadius: '10px'}}
                                value={remaining}/>
            </Paper>
        </CSSFadeTransition>
    </div>
}