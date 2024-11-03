import {SwitchTransition, Transition} from "react-transition-group";
import {useEffect, useRef, useState} from "react";
import {CSSFadeTransition} from "./components/transitions/CSSFadeTransition";
import {Button, Stack} from "@mui/material";

const TestTransition = () => {
    const [inProp, setInProp] = useState(false);
    const nodeRef = useRef(null);
    return (
        <div>
            <Transition mountOnEnter={true} nodeRef={nodeRef} in={inProp} timeout={500}>
                {state => (
                    <p ref={nodeRef}>{state}</p>
                )}
            </Transition>
            <button onClick={() => setInProp(!inProp)}>
                Click to Enter
            </button>
        </div>)
}

const TestFadeSwitch = () => {
    const [value, setValue] = useState(0);
    return <Stack>
        <SwitchTransition>
            <CSSFadeTransition key={value}>
                <div style={{minWidth: '100px', minHeight: '100px', background: 'red'}}>{value}</div>
            </CSSFadeTransition>
        </SwitchTransition>
        <Button onClick={() => setValue(value + 1)}>Increment</Button>
    </Stack>
}

const TestWebcamToVideo = () => {
    const ref = useRef(null);
    useEffect(() => {
        setTimeout(async () => {
            ref.current.srcObject = await navigator.mediaDevices.getUserMedia({video: true})

        }, 50)
    }, [true]);
    return <video ref={ref}></video>
}

export const Test = () => {
    return <Stack style={{display: 'flex', alignItems: 'start'}}>
        <TestWebcamToVideo/>
    </Stack>
}