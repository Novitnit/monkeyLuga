import { Button } from "@/component/button";
import Link from "next/link";

export default async function Home() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <p> สวัสดีครับ!</p>
            <p>ยินดีต้อนรับสู่เกมของเรา</p>
            <p>เกมนี้ถูกสร้างขึ้นมาเพื่อโปรเจกต์ Is สำหรับพวกผมครับ</p>
            <Button><Link href="/home">เริ่มเล่น</Link></Button>
        </div>
    );
}