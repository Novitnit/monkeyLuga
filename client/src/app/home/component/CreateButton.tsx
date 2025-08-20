"use client";
import { Button } from "@/component/button";
import { getSocket } from "@/lib/socket";
import { useState } from "react";

export default function CreateButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [Difficulty, setDifficulty] = useState<"M1" | "M2" | "M3">("M1");

    function onCreateRoom() {
        const socket = getSocket();
        socket.emit("createRoom", { difficulty: Difficulty });

        // ใช้ once → callback จะถูกเรียกครั้งเดียว แล้วหายไปเอง
        socket.once("createRoomSuccess", (data) => {
            console.log("roomId:", data.roomId);
        });
    }

    return (
        <>
            <Button className="w-full" onClick={() => setIsOpen(true)}> Create Room </Button>
            {isOpen && (
                <div className="absolute top-0 left-0">
                    <div className="flex flex-col items-center justify-center h-screen w-screen">
                        <div className="relative w-full h-full max-w-4/6 p-8 rounded-4xl bg-gray-900 shadow-lg max-h-4/6 flex flex-col items-center justify-center">
                            <p
                                className="absolute top-4 right-4 cursor-pointer text-xl"
                                onClick={() => setIsOpen(false)}
                            >
                                ❌
                            </p>
                            <h2 className="text-2xl font-bold mb-4">Create Room</h2>
                            <p>เลือกความยาก</p>
                            <select
                                className="mb-4 p-3 rounded focus:outline-none bg-gray-900 border-0"
                                onChange={(e) =>
                                    setDifficulty(e.target.value as "M1" | "M2" | "M3")
                                }
                                value={Difficulty}
                            >
                                <option value="M1">มัธยมศึกษาปีที่ 1</option>
                                <option value="M2">มัธยมศึกษาปีที่ 2</option>
                                <option value="M3">มัธยมศึกษาปีที่ 3</option>
                            </select>
                            <Button className="w-full max-w-69" onClick={onCreateRoom}>
                                Create
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
