"use client";
import { Button } from "@/component/button";
import { useState } from "react";

export default function JoinButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [roomId, setRoomId] = useState("");

    return (
        <>
            <Button className="w-full" onClick={() => setIsOpen(true)}> Join Room </Button>
            {isOpen && (
                <div className="absolute top-0 left-0">
                    <div className="flex flex-col items-center justify-center h-screen w-screen">
                        <div className="relative w-full h-full max-w-4/6 p-8 rounded-4xl bg-gray-900 shadow-lg max-h-4/6 flex flex-col items-center justify-center">
                            <p className="absolute top-4 right-4 cursor-pointer text-xl" onClick={() => setIsOpen(false)}>❌</p>
                            <h2 className="text-2xl font-bold mb-4">Join Room</h2>
                            <input type="text" placeholder="Room ID" className="mb-4 p-3 rounded focus:outline-none" onChange={(e) => setRoomId(e.target.value)} />
                            <Button className="w-full max-w-69">Join</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}