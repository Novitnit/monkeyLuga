import { mapData, Platform, TeleportZone } from "./main";

const doorH = 300;

const mainplatformX = 500;
const mainplatformY = 630;

export const map1:mapData = {
    platforms:[
        { x: mainplatformX, y: mainplatformY, w: 1110-500, h: 40 },
        createplatforms(-10, 0, 20, 1000),
        createplatforms(710,45, 200),
        createplatforms(540, 255),
        createplatforms(725, 345, 400),
        createplatforms(1210, 443, 200),
        createplatforms(1452.5, 83 , 750),
        createplatforms(2242.5, 307.25, 50)
    ],
    killZones:[
        createKillZone(1452.5, 83+165 , 50),
    ],
    highJumpZones:[
        createHighJumpZone(710, 64, 1.5, 200, 100),
        createHighJumpZone(2092.5, 103,1.5, 100, 150),
        // { x:1210, y:465, w:200, h:100, multiplier:1.3 },
    ],
    teleportZones:[
        createTeleportZone(1452.5+140, 83+165, 1320, 463 , 2092.5-1452.5-140),
        // createTeleportZone(1452.5+140, 1320, 463 ,83+165 , 700),
        // createTeleportZone(50,0, 50, 0 , 10, 10),
        // {targetX}
    ],
    playerSpawns:
    // createPlayerSpawn(50,0)
    // createPlayerSpawn(695, 65)
    // createPlayerSpawn(915, 365)
    // createPlayerSpawn(1320, 463)
    createPlayerSpawn(2142.5, 103)
    ,
    interactBoxes:[
        createInteractBox("btn1", 110, 50, 32, 32, "door1"),
        createInteractBox("btn2", 910, 415, 32, 32, "door2"),
        createInteractBox("btn3", 1830, 143, 32, 32, "door3"),
    ],
    doors:[
        createDoor("door1", 295, 0, 20, 300),
        createDoor("door2", 1100, 365, 20, 150),
        createDoor("door3", 1870, 103, 20, 145),
    ],
    
    tbcZones:[
        //x:2415, y:424
        createTBCZone(2415, 424 , 50, 100)
        
    ]
}

function createTBCZone(x: number, y: number, w: number = 100, h: number = 20) {
    return { x:(mainplatformX+x), y:(-(y-mainplatformY)-h), w, h}
}

function createplatforms(x: number, y: number, w: number = 100, h: number = 20):Platform {
    return { x:(mainplatformX+x), y:((-(y-mainplatformY))-h), w, h };
}

function createTeleportZone(x: number, y: number, targetX: number, targetY: number, w: number = 100, h: number = 20):TeleportZone {
    return { x:(mainplatformX+x), y:(-(y-mainplatformY)-h),targetX:(mainplatformX+targetX), targetY:(-(targetY-(mainplatformY-64))), w, h };
}

function createHighJumpZone(x: number, y: number, multiplier?: number, w: number = 100, h: number = 20) {
    return { x:(mainplatformX+x), y:(-(y-mainplatformY)-h), w, h, multiplier };
}

function createKillZone(x: number, y: number, w: number = 100, h: number = 20) {
    return { x:(mainplatformX+x), y:(-(y-mainplatformY)-h), w, h };
}

function createDoor(id: string, x: number, y: number, w: number = 40, h: number = doorH) {
    return { id, x:(mainplatformX+x), y:((-(y-mainplatformY))-h), w, h };
}

function createInteractBox(id: string, x: number, y: number, w: number = 32, h: number = 32, opensDoorId?: string) {
    return { id, x:(mainplatformX+x), y:((-(y-mainplatformY))-h), w, h, opensDoorId };
}

function createPlayerSpawn(x: number, y: number) {
    return { x:(mainplatformX+x), y:((-(y-(mainplatformY-64)))) };
}