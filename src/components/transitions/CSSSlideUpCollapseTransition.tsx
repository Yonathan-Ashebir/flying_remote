import {CSSTransition} from "react-transition-group";
import './css-slide-up-collapse-transition.css'
import {Stack} from "@mui/material";
import {useRef} from "react";

export const CSSSlideUpCollapseTransition = ({children, appear, timeout = 500, style = {}, 'in': isIn, ...rest}) => {
    const ref = useRef();
    return <CSSTransition appear={appear} in={isIn} timeout={timeout}
                          style={{'--transition-time': `${timeout}ms`, ...style}} {...rest}
                          classNames="slide-up-collapse" nodeRef={ref}>
        <Stack ref={ref}>{children}</Stack>
    </CSSTransition>
}