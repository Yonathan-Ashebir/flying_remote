import {CSSTransition} from "react-transition-group";
import './css-fade-transition.css'
import {Stack} from "@mui/material";
import {useRef} from "react";

export const CSSFadeTransition = ({
    children,
    appear,
    timeout = 300,
    style = {},
    'in': isIn,
    ...rest
}: any) => {
    const ref = useRef();
    return <CSSTransition timeout={timeout} style={{'--transition-time': `${timeout}ms`, ...style}} classNames="fade"
                          appear={appear} in={isIn} {...rest} nodeRef={ref}>
        <Stack ref={ref}>{children}</Stack>
    </CSSTransition>
}