import { mapData } from "./main";

const doorH = 300;

export const map1:mapData = {
    platforms:[
        { x: 500, y: -200, w: 10, h: 1000 },
        { x: 500, y: 630, w: 1110-500, h: 40 },
        { x:1210, y:566, w:200, h:20 },
        {x:1125, y:410, w:50, h:20},
        {x:1320, y:350, w:50, h:20},
    ],
    highJumpZones:[
        { x:1210, y:465, w:200, h:100, multiplier:1.3 },
    ],
    playerSpawns:{
        // x:600,
        // y:500
        x:1210, y:450   
    },
    interactBoxes:[
        { id:"btn1", x:600, y:550, w:32, h:32, opensDoorId:"door1" }
    ],
    doors:[
        { id:"door1", x:820, y:630-doorH, w:40, h:doorH }
    ]
}