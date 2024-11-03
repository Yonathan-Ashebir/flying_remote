import {CSSTransition} from "react-transition-group";
import './css-slide-up-collapse-transition.css'
import {Stack} from "@mui/material";
import {useRef} from "react";

export const CSSSlideUpCollapseTransition = ({children, keyForChild, appear, 'in': isIn, ...rest}) => {
    const ref = useRef();
    return <CSSTransition {...rest} timeout={30000} classNames="slide-up-collapse" appear={appear} in={isIn} nodeRef={ref}>
        <Stack ref={ref}>{children}</Stack>
    </CSSTransition>
}