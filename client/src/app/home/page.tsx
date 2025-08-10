    import { Button } from "@/component/button";
import JoinButton from "./component/JoinButton";

export default function HomePage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full h-full max-w-4/6 p-8 rounded-4xl bg-gray-900 shadow-lg max-h-4/6 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center justify-center mb-8">
                    <JoinButton />
                </div>
            </div>
        </div>
    );
}