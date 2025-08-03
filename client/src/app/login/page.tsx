"use client"

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {

    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [Error, setError] = useState("");

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await signIn("credentials", {
            name: Username,
            password: Password,
            redirect: false
        })

        if(res?.error){
            setError(res.error);
        }else if(res?.ok){
            setError("");
            router.push("/");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-sm p-8 rounded-4xl bg-gray-900 shadow-lg h-80">
                <h1 className="font-bold text-2xl">Login</h1>
                <form className="flex flex-col" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Username"
                        className="mb-4 p-3 rounded focus:outline-none"
                        value={Username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="mb-4 p-3 rounded focus:outline-none"
                        value={Password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 p-3 rounded mb-4"
                    >
                        Login
                    </button>
                </form>
                {Error && <p className="text-red-500 text-sm mb-4">{Error}</p>}
                <p> Don't have an account? <Link href="/register" className="text-blue-400 hover:underline"> Register</Link></p>
            </div>
        </div>
    );
}
