"use client"
import { getSocket } from "@/lib/socket";
import JoinButton from "./component/JoinButton";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from 'next/navigation';
import CreateButton from './component/CreateButton'

export default function HomePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        const token = session?.user.token as string;
        if (token) {
            try {
                const socket = getSocket(token);
                socket.on("connect", () => {
                    // console.log(socket)
                })
            } catch (e) {
                // console.log(e)
                router.push('/login');
            }
        }
    }, [status])

    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full h-full max-w-4/6 p-8 rounded-4xl bg-gray-900 shadow-lg max-h-4/6 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center mb-8">
                    <JoinButton />
                    <CreateButton />
                </div>
            </div>
        </div>
    );
}