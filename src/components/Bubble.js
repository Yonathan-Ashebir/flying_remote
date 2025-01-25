import './bubble.css'
import styled from '@emotion/styled'
import {forwardRef} from "react";

const InnerBubble = styled.span`
    width: ${(props) => props.size};
    height: ${(props) => props.size};
    max-width: ${(props) => props.size};
    max-height: ${(props) => props.size};
    box-shadow: 0 -0.228vw 0.384vw #fff inset, 0 -0.612vw 1.536vw ${props => props.color} inset, 0 0.12vw 0.12vw ${props => props.color} inset, 0.12vw 0 0.384vw #fff inset, -0.12vw 0 0.384vw #fff inset, 0 0.312vw 1.536vw white inset;

    &:before {
        top: calc(${props => props.size} * 0.115);
        left: calc(${props => props.size} * 0.179);
        width: calc(${props => props.size} * 0.16);
        height: calc(${props => props.size} * 0.064);
    }

    &:after {
        opacity: 0.1;
        top: calc(${props => props.size} * 0.16);
        left: calc(${props => props.size} * 0.16);
        width: calc(${props => props.size});
        height: calc(${props => props.size});
    }
`

const BubbleTopShine = styled.span`
    background: radial-gradient(at center bottom, transparent, transparent 70%, white);
    top: calc(${props => props.size} * 0.01);
    left: calc(${props => props.size} * 0.096);
    width: calc(${props => props.size} * 0.808);
    height: calc(${props => props.size} * 0.622);
`

export const Bubble = (props) => {
    return <div style={props.style} className={`bubble ${props.className}`} ref={props.refFix}>
        <InnerBubble size={props.size || '12vw'} color={props.color || '#8f8'} className='bubble-inner'>
            <BubbleTopShine className='bubble-top' size={props.size || '12vw'} color={props.color || '#8f8'}/>
            {props.children}
        </InnerBubble>
    </div>

}