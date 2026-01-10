export function SiteFooter() {
    return (
        <footer id="contact" className="border-t bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 py-14">
                <div className="grid gap-10 md:grid-cols-3">
                    <div>
                        <p className="text-sm font-semibold text-gray-900">AFE – Estrie</p>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                            Soutien, information et activités pour les personnes vivant avec la fibromyalgie.
                        </p>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-900">Coordonnées</p>
                        <ul className="mt-3 space-y-2 text-sm text-gray-700">
                            <li>📍 Sherbrooke, Québec</li>
                            <li>
                                📧{" "}
                                <a className="hover:underline" href="mailto:contact@fibromyalgie-estrie.org">
                                    contact@fibromyalgie-estrie.org
                                </a>
                            </li>
                            <li>☎️ (000) 000-0000</li>
                            <li>
                                <a
                                    href="http://192.168.2.132:5173/admin/login"
                                    className="font-semibold text-blue-600 hover:underline hover:text-blue-800"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    Ouverture de session
                                </a>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-gray-900">Réseaux</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {["Instagram", "YouTube", "Facebook"].map((x) => (
                                <a
                                    key={x}
                                    className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100"
                                    href="#"
                                >
                                    {x}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="mt-10 border-t border-gray-200 pt-6 text-center text-xs text-gray-500">
                    © {new Date().getFullYear()} AFE – Tous droits réservés.
                </div>
            </div>
        </footer>
    );
}
