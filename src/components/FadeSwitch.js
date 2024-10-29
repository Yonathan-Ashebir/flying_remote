import {CSSTransition, SwitchTransition} from "react-transition-group";
import './fade-switch.css'
import {Stack} from "@mui/material";
import {useRef} from "react";

export const FadeSwitch = ({children, keyForChild, appear, ...rest}) => {
    return <SwitchTransition {...rest}>
        <SwitchItem key={keyForChild} appear={appear}>
            {children}
        </SwitchItem>
    </SwitchTransition>
}

const SwitchItem = ({children, ...rest}) => {
    const ref = useRef();
    return <CSSTransition {...rest} timeout={300} classNames="fade-switch" nodeRef={ref}>
        <Stack ref={ref}>{children}</Stack>
    </CSSTransition>
}