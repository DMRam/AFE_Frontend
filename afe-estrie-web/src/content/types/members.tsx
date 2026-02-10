export type StripeMode = "payment" | "subscription";
export type PreferredLanguage = "fr" | "en";
export type Availability = "weekday" | "weekend" | "evening" | "flexible" | "";

export type MemberClientForm = {
    fullName: string;
    birthYear?: string;
    email: string;
    phone: string;

    addressLine1: string;
    addressLine2: string;
    city: string;
    province: string;
    postalCode: string;

    preferredLanguage: PreferredLanguage;

    // Association-friendly extras
    newsletterOptIn: boolean;
    contactByEmail: boolean;
    contactByPhone: boolean;
    preferredContactTime: string; // ex: "soir", "après 17h", etc.
    heardAbout: string;

    // Volunteering
    wantsToVolunteer: boolean;
    volunteerAreas: string[];
    availability: Availability;

    // Consent / notes
    consent: boolean;
    notes: string;
};

export type FormErrors = Partial<Record<keyof MemberClientForm, string>>;