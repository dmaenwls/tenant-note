import Link from "next/link";

export default function Footer() {
    return (
        <footer className="bg-gray-900 border-t border-gray-800 text-gray-400 py-12">
            <div className="max-w-screen-xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold text-white">Tenant Note</h3>
                        <p className="text-sm">
                            세입자의 권리를 지킵니다.
                            <br />
                            안전한 주거 경험을 위한 필수 가이드.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-white">서비스</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link href="#" className="hover:text-blue-500 transition">
                                    서비스 소개
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-blue-500 transition">
                                    이용약관
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-blue-500 transition">
                                    개인정보처리방침
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-blue-500 transition">
                                    자주 묻는 질문
                                </Link>
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-white">문의</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <i className="fa-regular fa-envelope mr-2"></i>{" "}
                                support@tenantnote.com
                            </li>
                            <li>
                                <i className="fa-regular fa-handshake mr-2"></i>{" "}
                                partner@tenantnote.com
                            </li>
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-white">소셜</h4>
                        <div className="flex gap-4">
                            <Link
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-blue-600 hover:text-white transition"
                            >
                                <i className="fa-brands fa-instagram text-xl"></i>
                            </Link>
                            <Link
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-red-600 hover:text-white transition"
                            >
                                <i className="fa-brands fa-youtube text-xl"></i>
                            </Link>
                            <Link
                                href="#"
                                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-green-600 hover:text-white transition"
                            >
                                <i className="fa-solid fa-blog text-xl"></i>
                            </Link>
                        </div>
                    </div>
                </div>
                <div className="border-t border-gray-800 mt-12 pt-8 text-center text-xs">
                    <p>
                        &copy; 2026 Tenant Note. All rights reserved. (Designed by Vibe
                        Coding)
                    </p>
                </div>
            </div>
        </footer>
    );
}
