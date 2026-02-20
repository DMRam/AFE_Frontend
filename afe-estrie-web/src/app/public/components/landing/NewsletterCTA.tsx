export function NewsletterCTA() {
    return (
        <section className="py-16" id="membre">
           <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
                <div className="overflow-hidden rounded-3xl border border-red-700/10 bg-gradient-to-br from-red-700 to-red-800 text-white shadow-sm">
                    <div className="grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-10">
                        <div>
                            <p className="text-sm font-semibold text-white/85">Infolettre</p>
                            <h3 className="mt-2 text-3xl font-extrabold tracking-tight">
                                Infolettre AFE
                            </h3>
                            <p className="mt-3 text-white/90">
                                Recevez nos nouvelles, activités et événements directement par email.
                            </p>

                            <div className="mt-5 flex flex-wrap gap-2 text-xs text-white/80">
                                <span className="rounded-full bg-white/10 px-3 py-1">Activités</span>
                                <span className="rounded-full bg-white/10 px-3 py-1">Événements</span>
                                <span className="rounded-full bg-white/10 px-3 py-1">Ressources</span>
                            </div>
                        </div>

                        <form
                            onSubmit={(e) => e.preventDefault()}
                            className="flex flex-col gap-3 sm:flex-row"
                        >
                            <input
                                className="w-full rounded-lg bg-white px-4 py-3 text-sm text-gray-900 outline-none ring-2 ring-transparent focus:ring-white/70"
                                placeholder="Votre email"
                                type="email"
                                required
                            />
                            <button className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-red-700 hover:bg-red-50">
                                S’abonner
                            </button>
                        </form>

                        <p className="-mt-4 text-xs text-white/80 md:col-span-2" id="don">
                            En vous abonnant, vous acceptez de recevoir des communications de l’AFE.
                            
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
