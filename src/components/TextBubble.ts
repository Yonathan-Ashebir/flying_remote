import {Bubble} from "./Bubble";

export const TextBubble = (props: any) => {
    return <Bubble {...props}>
        <div style={{display: "flex", justifyContent: "center", alignItems: "center", width: "100%", height: "100%"}}>
            <h1 style={{fontSize: props.style?.fontSize || `calc(${props.size} / 3)`}}>{props.children}</h1>
        </div>
    </Bubble>
}