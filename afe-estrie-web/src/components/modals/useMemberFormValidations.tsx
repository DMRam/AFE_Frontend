import type { FormErrors, MemberClientForm } from "../../content/types/members";

export const useMemberFormValidations = () => {


    function isEmail(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    }

    function normalizePostal(v: string) {
        return v.toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
    }

    function isLikelyCanadianPostal(v: string) {
        return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(v);
    }

    function clampStr(v: unknown, max = 2000) {
        const s = String(v ?? "");
        return s.length > max ? s.slice(0, max) : s;
    }

    function validateForm(f: MemberClientForm): { ok: boolean; errors: FormErrors; normalized: MemberClientForm } {
        const errors: FormErrors = {};
        const normalized: MemberClientForm = {
            ...f,
            fullName: clampStr(f.fullName, 160).trim(),
            email: clampStr(f.email, 200).trim(),
            phone: clampStr(f.phone, 60).trim(),
            addressLine1: clampStr(f.addressLine1, 200).trim(),
            addressLine2: clampStr(f.addressLine2, 200).trim(),
            city: clampStr(f.city, 120).trim(),
            province: clampStr(f.province, 10).trim().toUpperCase(),
            postalCode: normalizePostal(f.postalCode),
            preferredContactTime: clampStr(f.preferredContactTime, 60).trim(),
            heardAbout: clampStr(f.heardAbout, 120).trim(),
            notes: clampStr(f.notes, 2000).trim(),
            volunteerAreas: Array.isArray(f.volunteerAreas) ? f.volunteerAreas.slice(0, 12) : [],
        };

        if (!normalized.fullName) errors.fullName = "Nom complet requis.";
        if (!normalized.email || !isEmail(normalized.email)) errors.email = "Email invalide.";
        if (!normalized.phone) errors.phone = "Téléphone requis.";

        if (!normalized.addressLine1) errors.addressLine1 = "Adresse requise.";
        if (!normalized.city) errors.city = "Ville requise.";
        if (!normalized.province) errors.province = "Province requise.";

        if (!normalized.postalCode) errors.postalCode = "Code postal requis.";
        else if (normalized.postalCode.length !== 6 || !isLikelyCanadianPostal(normalized.postalCode)) {
            errors.postalCode = "Code postal invalide (ex: H1H1H1).";
        }

        // Volunteering consistency
        if (normalized.wantsToVolunteer) {
            if (!normalized.availability) errors.availability = "Choisissez une disponibilité.";
            if (!normalized.volunteerAreas.length) errors.volunteerAreas = "Choisissez au moins un domaine.";
        }

        if (!normalized.consent) errors.consent = "Vous devez accepter pour continuer.";

        return { ok: Object.keys(errors).length === 0, errors, normalized };
    }





    return { isEmail, normalizePostal, isLikelyCanadianPostal, clampStr, validateForm };
}

export function FieldError({ msg }: { msg?: string }) {
    if (!msg) return null;
    return <p className="mt-1 text-xs font-semibold text-red-700">{msg}</p>;
}