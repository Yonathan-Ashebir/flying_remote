import {CSSTransition} from "react-transition-group";
import './css-slide-up-collapse-transition.css'
import {Stack} from "@mui/material";
import {CSSProperties, ReactNode, useRef} from "react";

interface Props {
    children?: ReactNode,
    appear?: boolean,
    timeout?: number,
    style?: CSSProperties,
    in: boolean,
}
export const CSSSlideUpCollapseTransition = ({
    children,
    appear,
    timeout = 500,
    style = {},
    'in': isIn,
    ...rest
}: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    return <CSSTransition appear={appear} in={isIn} timeout={timeout}
                          style={{'--transition-time': `${timeout}ms`, ...style}} {...rest}
                          classNames="slide-up-collapse" nodeRef={ref}>
        <Stack ref={ref}>{children}</Stack>
    </CSSTransition>
}