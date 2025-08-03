"use client"
import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {

    const [Username, setUsername] = useState("");
    const [Password, setPassword] = useState("");
    const [Error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const res = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: Username, password: Password }),
        })
        const data = await res.json();
        if (res.ok) {

        }else{
            setError(data.error);
            return;
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="w-full max-w-sm p-8 rounded-4xl bg-gray-900 shadow-lg h-80">
                <h1 className="font-bold text-2xl">Register</h1>
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
                        Register
                    </button>
                </form>
                {Error && <p className="text-red-500 text-sm mb-4">{Error}</p>}
                <p> Already have an account? <Link href="/login" className="text-blue-400 hover:underline"> Login</Link></p>
            </div>
        </div>
    );
}
