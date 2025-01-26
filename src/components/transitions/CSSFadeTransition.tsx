import {CSSTransition} from "react-transition-group";
import './css-fade-transition.css'
import {Stack} from "@mui/material";
import {CSSProperties, ReactElement, ReactNode, useRef} from "react";

interface Props {
    children?: ReactNode,
    appear?: boolean,
    timeout?: number,
    style?: CSSProperties,
    in?: boolean,
}

export const CSSFadeTransition = ({
                                      children,
                                      appear,
                                      timeout = 300,
                                      style = {},
                                      'in': isIn,
                                      ...rest
                                  }: Props) => {
    const ref = useRef<HTMLDivElement>(null);
    return <CSSTransition timeout={timeout} style={{'--transition-time': `${timeout}ms`, ...style}} classNames="fade"
                          appear={appear} in={isIn} {...rest} nodeRef={ref}>
        <Stack ref={ref}>{children}</Stack>
    </CSSTransition>
}