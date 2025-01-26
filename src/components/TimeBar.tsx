import {CSSProperties, useContext, useEffect, useState} from "react";
import {GameContext} from "../data/GameContext";
import {LinearProgress, Paper} from "@mui/material";
import {constrainBetween} from "../utilites";
import {CSSFadeTransition} from "./transitions/CSSFadeTransition";
import {Statuses} from "../types";

export const TimeBar = ({
                            style = {},
                            ...rest
                        }: { style?: CSSProperties }) => {
    const gameContext = useContext(GameContext);
    const [remaining, setRemaining] = useState(100);

    useEffect(() => {
            if ((gameContext.status === Statuses.PLAYING || gameContext.status === Statuses.PAUSED) && gameContext.gameStartTime !== -1 && gameContext.gameEndTime !== -1) {
                const interval = setInterval(() => {
                    setRemaining(constrainBetween((gameContext.gameEndTime - Date.now()) / (gameContext.gameEndTime - gameContext.gameStartTime), 0, 1) * 100);
                }, 50)
                return () => clearInterval(interval)
            }
        }, [gameContext]
    )
    return <div style={{minWidth: '80%', ...style}} {...rest}>
        <CSSFadeTransition
            in={(gameContext.status === Statuses.PLAYING || gameContext.status === Statuses.PAUSED) && gameContext.gameStartTime !== -1 && gameContext.gameEndTime !== -1}>
            <Paper style={{padding: '10px', borderRadius: '15px'}}>
                <LinearProgress variant={'determinate'} style={{height: '20px', borderRadius: '10px'}}
                                value={remaining}/>
            </Paper>
        </CSSFadeTransition>
    </div>
}