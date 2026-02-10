export function MembershipCancelPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="rounded-3xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-extrabold text-gray-900">Paiement annulé</h1>
        <p className="mt-2 text-sm text-gray-700">
          Aucun montant n’a été prélevé. Vous pouvez réessayer quand vous voulez.
        </p>

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <a
            href="/#membre"
            className="inline-flex items-center justify-center rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
          >
            Retour à l’adhésion
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}
