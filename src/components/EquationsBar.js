import {CSSTransition, TransitionGroup} from "react-transition-group";
import {forwardRef, useContext} from "react";
import './equation-bar.css'
import {Card, CardContent, Paper, Stack, Typography} from "@mui/material";
import {FadeSwitch} from "./FadeSwitch";
import {getBonus} from "../utilites";
import {GameContext} from "../data/GameContext";

export const EquationsBar = props => {
    return <Stack alignContent={"center"} style={{background: '#08c linear-gradient(#33bbff, #08c, #004466)'}}>
        <Typography textAlign={'center'} style={{opacity: 0.5}} variant={"h6"}>Equations</Typography>

        <TransitionGroup>
            {props.equations.map((equation, index) =>
                <CSSTransition key={equation.answer} timeout={500} nodeRef={equation.reference}
                               classNames='equation' appear={true}>
                    <Equation eq={equation} ref={equation.reference} index={index}/>
                </CSSTransition>)
            }
        </TransitionGroup>
    </Stack>
}

const Equation = forwardRef(({eq, index}, ref) => {
    const gameContext = useContext(GameContext);
    return <Card ref={ref} className={'equation' + (eq.suspended ? ' equation-suspended' : '')}>
        <Stack direction={'row'}>
            <CardContent style={{
                display: 'flex',
                justifyContent: 'stretch',
                alignItems: 'stretch',
                fontSize: '2rem',
                paddingRight: '1rem'
            }}>
                {eq.question.map((el, ind) => {
                    if (el === 'x') return <VariableChar key={ind}>{el}</VariableChar>
                    return <NormalChar key={ind}>{el}</NormalChar>
                })}
            </CardContent>


            <div style={{position: 'absolute', top: 0, right: 0}}>
                <FadeSwitch keyForChild={getBonus(index, gameContext.difficulty)}>
                    +{getBonus(index, gameContext.difficulty)}
                </FadeSwitch>
            </div>
        </Stack>
    </Card>
})

const NormalChar = ({children, className, ...others}) => <span {...others}
                                                               className={"normal-letter " + className}><span>{children}</span></span>
const VariableChar = ({children, className, ...others}) => <span {...others}
                                                                 className={'variable-letter ' + className}>{children}</span>