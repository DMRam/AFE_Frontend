// src/app/public/components/InfoLetterSection.tsx
import { useState } from "react";

export function InfoLetterSection() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || isSubmitting) return;

        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));

            // TODO: Replace with actual API call
            // const response = await fetch('/api/newsletter/subscribe', {
            //   method: 'POST',
            //   body: JSON.stringify({ email }),
            //   headers: { 'Content-Type': 'application/json' },
            // });

            console.log('Subscribing:', email);
            setIsSuccess(true);
            setEmail("");

            // Reset success message after 5 seconds
            setTimeout(() => setIsSuccess(false), 5000);
        } catch (error) {
            console.error('Subscription error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-red-50 via-white to-red-50 py-16 md:py-20">
            {/* Decorative elements */}
            <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-red-200 opacity-30 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-red-100 opacity-40 blur-3xl" />

            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    

                    <h2 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                        <span className="block">Abonnez-vous à notre infolettre</span>
                    </h2>

                    <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-600 leading-relaxed">
                        Inscrivez-vous à notre infolettre et recevez en avant-première
                        les actualités, événements et ressources qui font la différence
                        dans notre communauté.
                    </p>

                    {/* Success Message */}
                    {isSuccess && (
                        <div className="mx-auto mt-8 max-w-md animate-fadeIn rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                            <div className="flex items-center">
                                <svg className="h-5 w-5 text-emerald-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <p className="text-emerald-800 font-medium">
                                    Merci! Vous êtes maintenant inscrit à notre infolettre.
                                </p>
                            </div>
                        </div>
                    )}

                    <form
                        onSubmit={handleSubmit}
                        className="mx-auto mt-10 max-w-2xl"
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                            <div className="flex-grow">
                                <div className="relative">
                                    <svg
                                        className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <input
                                        type="email"
                                        name="email"
                                        id="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="votre@courriel.com"
                                        className="block w-full rounded-xl border border-gray-300 bg-white px-12 py-4 text-lg shadow-lg transition-all duration-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 focus:ring-offset-2 hover:shadow-xl"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-red-700 to-red-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all duration-300 hover:from-red-800 hover:to-red-700 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        Inscription...
                                    </>
                                ) : (
                                    <>
                                        <span>S'abonner</span>
                                        <svg
                                            className="ml-3 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                            aria-hidden="true"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                                            />
                                        </svg>
                                    </>
                                )}
                            </button>
                        </div>

                        <p className="mx-auto mt-6 max-w-2xl text-sm text-gray-500">
                            En vous inscrivant, vous acceptez de recevoir nos communications par courriel.
                            <br className="hidden sm:block" />
                            Nous ne partagerons jamais vos informations.
                            <span className="font-medium text-red-700"> Consultez notre politique de confidentialité.</span>
                        </p>
                    </form>
                </div>
            </div>
        </section>
    );
}