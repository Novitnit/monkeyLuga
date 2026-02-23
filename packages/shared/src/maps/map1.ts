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
        createplatforms(2242.5, 307.25, 50),
        createplatforms(2600, 100, 100),
        createplatforms(2600+100+60, 150, 100),
        createplatforms(3100, 310,10,10),
        createplatforms(3200, 310,10,10),
        createplatforms(3300, 310,10,10),
        createplatforms(3400, 310,10,10),
        createplatforms(3500, 310,10,10),
        createplatforms(3600, 330),
        createplatforms(5500, 330)
    ],
    movingPlatforms:[
        createMovingPlatform("moving1", 3700, 330, 100, 20, 800, 150, 800),
        createMovingPlatform("moving2", 4600, 330, 100, 20, 800, 150, 0),
    ],
    killZones:[
        createKillZone(1452.5, 83+165 , 70),
        createKillZone(1453+140, 83+165,500), // Animated: moves 150px on X axis
        createKillZone(2605, 100+60+40, 80,10),
        createKillZone(2740, 100+60+87.5, 200, 10), // Animated: moves 100px on X axis
        createKillZone(2900, 320,50,10,3600-2900, 150),
        createKillZone(3000, 320,20,10,3500-3000, 250),
        createKillZone(3100, 320,40,10,3600-3100, 350),
        // createKillZone(3800, 350,10,10,4500-3800, 250)
    ],
    highJumpZones:[
        createHighJumpZone(710, 64, 1.5, 200, 200),
        createHighJumpZone(2092.5, 103,1.5, 100, 150),
        // createHighJumpZone(3600, 350,1.5, 100, 100),
        // { x:1210, y:465, w:200, h:100, multiplier:1.3 },
    ],
    teleportZones:[
        createTeleportZone(3012.5, 12.5, 3012.5, 600, 5),
        // createTeleportZone(3675, 350)
        // createTeleportZone(1452.5+140, 1320, 463 ,83+165 , 700),
        // createTeleportZone(50,0, 50, 0 , 10, 10),
        // {targetX}
    ],
    playerSpawns:
    createPlayerSpawn(50,200)
    // createPlayerSpawn(695, 65)
    // createPlayerSpawn(915, 365)
    // createPlayerSpawn(1320, 463)
    // createPlayerSpawn(2142.5, 103)
    // createPlayerSpawn(2600, 110)
    // createPlayerSpawn(2837.5, 140)
    // createPlayerSpawn(3600, 360)
    // createPlayerSpawn(5500, 360)
    ,
    doors:[
        createDoor("door1", 295, 0, 20, 300),
        createDoor("door2", 1100, 365, 20, 150),
        createDoor("door3", 1870, 103, 20, 145),
        createDoor("door4", 3662.5, 350, 20, 145),
        createDoor("door5", 5570, 350, 20, 145),
    ],
    checkpoints:[
        createCheckpoint("checkpoint1", 1320, 463, 50, 50),
        createCheckpoint("checkpoint2", 2600, 110, 50, 50),
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

function createKillZone(x: number, y: number, w: number = 100, h: number = 20, moveDistance: number = 0, moveSpeed: number = 100) {
    return { id: `killzone_${x}_${y}`, x:(mainplatformX+x), y:(-(y-mainplatformY)-h), w, h, moveDistance, moveSpeed };
}

function createDoor(id: string, x: number, y: number, w: number = 40, h: number = doorH) {
    return { id, x:(mainplatformX+x), y:((-(y-mainplatformY))-h), w, h };
}

function createMovingPlatform(id: string, x: number, y: number, w: number = 100, h: number = 20, moveDistance: number = 0, moveSpeed: number = 100, startPhase: number = 0) {
    return { id, x:(mainplatformX+x), y:((-(y-mainplatformY))-h), w, h, moveDistance, moveSpeed, startPhase };
}

function createPlayerSpawn(x: number, y: number) {
    return { x:(mainplatformX+x), y:((-(y-(mainplatformY-64)))) };
}

function createCheckpoint(id: string, x: number, y: number, w: number = 50, h: number = 50) {
    return { id, x:(mainplatformX+x), y:((-(y-mainplatformY))-h), w, h };
}