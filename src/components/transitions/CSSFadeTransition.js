import {CSSTransition, SwitchTransition} from "react-transition-group";
import './css-fade-transition.css'
import {Stack} from "@mui/material";
import {useRef} from "react";

export const CSSFadeTransition = ({children, keyForChild, appear, timeout = 300, style = {}, 'in': isIn, ...rest}) => {
    const ref = useRef();
    return <CSSTransition {...rest} timeout={timeout} style={{'--transition-time': `${timeout}ms`}} classNames="fade"
                          appear={appear} in={isIn} nodeRef={ref}>
        <Stack ref={ref}>{children}</Stack>
    </CSSTransition>
}