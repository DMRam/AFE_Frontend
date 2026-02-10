import { useState } from "react";
import type { Availability, MemberClientForm, PreferredLanguage } from "../../content/types/members";
import { DEFAULT_FORM, VOLUNTEER_AREAS } from "../constants/MemberModalConstants";
import { FieldError } from "./useMemberFormValidations";

/** --- UI fields OUTSIDE the component (prevents remount + focus loss) --- */

function InputField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
    error,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    error?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-gray-700">
                {label} {required ? <span className="text-red-600">*</span> : null}
            </label>
            <input
                type={type}
                className={[
                    "mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
                    error ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-gray-200",
                ].join(" ")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoComplete="off"
            />
            <FieldError msg={error} />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    error,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    error?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-gray-700">
                {label} {required ? <span className="text-red-600">*</span> : null}
            </label>
            <select
                className={[
                    "mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition bg-white",
                    error ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-gray-200",
                ].join(" ")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((o) => (
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
            <FieldError msg={error} />
        </div>
    );
}

function TextAreaField({
    label,
    value,
    onChange,
    placeholder,
    error,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    error?: string;
}) {
    return (
        <div>
            <label className="text-xs font-semibold text-gray-700">{label}</label>
            <textarea
                className={[
                    "mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none transition",
                    error ? "border-red-300 focus:ring-2 focus:ring-red-200" : "border-gray-200 focus:ring-2 focus:ring-gray-200",
                ].join(" ")}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={3}
            />
            <FieldError msg={error} />
        </div>
    );
}

function TogglePill({
    checked,
    onChange,
    label,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!checked)}
            className={[
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                checked ? "border-red-200 bg-red-50 text-red-800" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
            ].join(" ")}
        >
            <span className={["h-2 w-2 rounded-full", checked ? "bg-red-600" : "bg-gray-300"].join(" ")} />
            {label}
        </button>
    );
}

/** --- helpers for birth year --- */
function normalizeBirthYear(v: string) {
    // keep only digits, max 4
    return v.replace(/[^\d]/g, "").slice(0, 4);
}

function validateBirthYearOptional(v: string | undefined): string | undefined {
    const s = (v ?? "").trim();
    if (!s) return undefined; // optional
    if (s.length !== 4) return "Année invalide";
    const y = Number(s);
    const currentYear = new Date().getFullYear();
    if (!Number.isFinite(y) || y < 1900 || y > currentYear) return "Année invalide";
    return undefined;
}

/** --- validation --- */
function validateForm(form: MemberClientForm): { errors: Record<string, string | undefined> } {
    const errors: Record<string, string | undefined> = {};

    if (!form.fullName?.trim()) errors.fullName = "Le nom complet est requis";

    // ✅ optional birthYear
    const byErr = validateBirthYearOptional((form as any).birthYear);
    if (byErr) errors.birthYear = byErr;

    if (!form.email?.trim()) errors.email = "L'email est requis";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = "Email invalide";

    if (!form.phone?.trim()) errors.phone = "Le téléphone est requis";
    if (!form.addressLine1?.trim()) errors.addressLine1 = "L'adresse est requise";
    if (!form.city?.trim()) errors.city = "La ville est requise";
    if (!form.province?.trim()) errors.province = "La province est requise";

    if (!form.postalCode?.trim()) errors.postalCode = "Le code postal est requis";
    else if (!/^[A-Z]\d[A-Z] ?\d[A-Z]\d$/.test(form.postalCode.toUpperCase()))
        errors.postalCode = "Code postal invalide (ex: A1A 1A1)";

    if (form.wantsToVolunteer) {
        if (form.volunteerAreas.length === 0) errors.volunteerAreas = "Veuillez sélectionner au moins un domaine";
        if (!form.availability) errors.availability = "Veuillez sélectionner une disponibilité";
    }

    if (!form.consent) errors.consent = "Vous devez accepter pour continuer";
    return { errors };
}

interface MemberFormProps {
    form: MemberClientForm;
    setForm: (form: MemberClientForm) => void;
}

export const MemberForm = ({ form, setForm }: MemberFormProps) => {
    const [formTouched, setFormTouched] = useState(false);

    function setField<K extends keyof MemberClientForm>(field: K, value: MemberClientForm[K]) {
        setForm({ ...form, [field]: value });
        if (!formTouched) setFormTouched(true);
    }

    function showErr<K extends keyof MemberClientForm>(field: K): string | undefined {
        if (!formTouched) return undefined;
        const { errors } = validateForm(form);
        return errors[field as any];
    }

    function normalizePostal(v: string) {
        return v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    }

    function toggleVolunteerArea(area: string) {
        const areas = new Set(form.volunteerAreas);
        if (areas.has(area)) areas.delete(area);
        else areas.add(area);
        setForm({ ...form, volunteerAreas: Array.from(areas) });
        if (!formTouched) setFormTouched(true);
    }

    return (
        <div>
            <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-extrabold text-gray-900">Vos informations</h3>
                        <p className="mt-1 text-xs text-gray-600">Pour gérer votre adhésion (contact, reçu, suivi).</p>
                    </div>
                    <button
                        type="button"
                        className="text-xs font-semibold text-gray-600 hover:text-gray-900"
                        onClick={() => {
                            setForm(DEFAULT_FORM);
                            setFormTouched(false);
                        }}
                    >
                        Réinitialiser
                    </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <InputField
                        label="Nom complet"
                        required
                        value={form.fullName}
                        onChange={(v) => setField("fullName", v)}
                        placeholder="Prénom Nom"
                        error={showErr("fullName")}
                    />

                    {/* ✅ optional birth year */}
                    <InputField
                        label="Année de naissance (optionnel)"
                        value={(form as any).birthYear ?? ""}
                        onChange={(v) => setField("birthYear" as any, normalizeBirthYear(v) as any)}
                        placeholder="Ex: 1991"
                        type="text"
                        error={showErr("birthYear" as any)}
                    />

                    <SelectField
                        label="Langue préférée"
                        required
                        value={form.preferredLanguage}
                        onChange={(v) => setField("preferredLanguage", v as PreferredLanguage)}
                        options={[
                            { value: "fr", label: "Français" },
                            { value: "en", label: "English" },
                        ]}
                    />

                    <InputField
                        label="Email"
                        required
                        value={form.email}
                        onChange={(v) => setField("email", v)}
                        placeholder="vous@exemple.com"
                        error={showErr("email")}
                        type="email"
                    />

                    <InputField
                        label="Téléphone"
                        required
                        value={form.phone}
                        onChange={(v) => setField("phone", v)}
                        placeholder="(819) 555-1234"
                        error={showErr("phone")}
                    />
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <InputField
                            label="Adresse"
                            required
                            value={form.addressLine1}
                            onChange={(v) => setField("addressLine1", v)}
                            placeholder="123 Rue Principale"
                            error={showErr("addressLine1")}
                        />
                    </div>

                    <div className="md:col-span-2">
                        <InputField
                            label="Appartement / Suite (optionnel)"
                            value={form.addressLine2}
                            onChange={(v) => setField("addressLine2", v)}
                            placeholder="Apt 4B"
                        />
                    </div>

                    <InputField
                        label="Ville"
                        required
                        value={form.city}
                        onChange={(v) => setField("city", v)}
                        placeholder="Sherbrooke"
                        error={showErr("city")}
                    />

                    <div className="grid gap-3 grid-cols-2">
                        <InputField
                            label="Province"
                            required
                            value={form.province}
                            onChange={(v) => setField("province", v.toUpperCase())}
                            placeholder="QC"
                            error={showErr("province")}
                        />
                        <InputField
                            label="Code postal"
                            required
                            value={form.postalCode}
                            onChange={(v) => setField("postalCode", normalizePostal(v))}
                            placeholder="H1H 1H1"
                            error={showErr("postalCode")}
                        />
                    </div>
                </div>

                <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3 space-y-3">
                    <p className="text-xs font-extrabold text-gray-800">Préférences (optionnel)</p>

                    <div className="flex flex-wrap gap-2">
                        <TogglePill checked={form.newsletterOptIn} onChange={(v) => setField("newsletterOptIn", v)} label="Recevoir l'infolettre" />
                        <TogglePill checked={form.contactByEmail} onChange={(v) => setField("contactByEmail", v)} label="Contact par email" />
                        <TogglePill checked={form.contactByPhone} onChange={(v) => setField("contactByPhone", v)} label="Contact par téléphone" />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <InputField
                            label="Moment idéal pour vous joindre (optionnel)"
                            value={form.preferredContactTime}
                            onChange={(v) => setField("preferredContactTime", v)}
                            placeholder="Ex: après 17h, le week-end..."
                        />
                        <InputField
                            label="Comment avez-vous connu l'AFE ? (optionnel)"
                            value={form.heardAbout}
                            onChange={(v) => setField("heardAbout", v)}
                            placeholder="Ex: ami, Facebook, médecin..."
                        />
                    </div>
                </div>

                <div className="rounded-xl bg-white ring-1 ring-gray-200 p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-extrabold text-gray-800">Bénévolat (optionnel)</p>
                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={form.wantsToVolunteer} onChange={(e) => setField("wantsToVolunteer", e.target.checked)} />
                            Je souhaite être bénévole
                        </label>
                    </div>

                    {form.wantsToVolunteer ? (
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs font-semibold text-gray-700">
                                    Domaines <span className="text-red-600">*</span>
                                </p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {VOLUNTEER_AREAS.map((v) => {
                                        const active = form.volunteerAreas.includes(v);
                                        return (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => toggleVolunteerArea(v)}
                                                className={[
                                                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                                                    active ? "border-red-200 bg-red-50 text-red-800" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
                                                ].join(" ")}
                                            >
                                                {v}
                                            </button>
                                        );
                                    })}
                                </div>
                                <FieldError msg={showErr("volunteerAreas")} />
                            </div>

                            <SelectField
                                label="Disponibilité"
                                required
                                value={form.availability}
                                onChange={(v) => setField("availability", v as Availability)}
                                options={[
                                    { value: "", label: "Choisir..." },
                                    { value: "weekday", label: "Semaine" },
                                    { value: "evening", label: "Soir" },
                                    { value: "weekend", label: "Week-end" },
                                    { value: "flexible", label: "Flexible" },
                                ]}
                                error={showErr("availability")}
                            />
                        </div>
                    ) : null}
                </div>

                <TextAreaField
                    label="Notes (optionnel)"
                    value={form.notes}
                    onChange={(v) => setField("notes", v)}
                    placeholder="Ex: informations utiles, besoins particuliers, etc."
                />

                <div className="space-y-2">
                    <label className="flex items-start gap-2 text-sm text-gray-700">
                        <input
                            type="checkbox"
                            className="mt-1"
                            checked={form.consent}
                            onChange={(e) => {
                                setField("consent", e.target.checked);
                                if (!formTouched) setFormTouched(true);
                            }}
                        />
                        <span>
                            J&apos;accepte que mes informations soient utilisées pour gérer mon adhésion.
                            <span className="text-red-600"> *</span>
                        </span>
                    </label>
                    <FieldError msg={showErr("consent")} />
                </div>
            </div>
        </div>
    );
};
