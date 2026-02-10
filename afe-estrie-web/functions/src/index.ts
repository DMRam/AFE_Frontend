import "dotenv/config";
import { setGlobalOptions } from "firebase-functions/v2";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import Stripe from "stripe";
import fs from "node:fs";
import path from "node:path";


admin.initializeApp();
const db = getFirestore();

setGlobalOptions({ maxInstances: 10 });

export { sendMemberToN8N } from "./sendMemberToN8N";

type StripeCfg = { stripe?: { secret_key?: string } };

function readRuntimeConfig(): StripeCfg | null {
    try {
        // functions/lib/index.js -> __dirname is functions/lib
        // .runtimeconfig.json is at functions/.runtimeconfig.json
        const p = path.join(__dirname, "..", ".runtimeconfig.json");
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, "utf8")) as StripeCfg;
        }
    } catch {
        // ignore
    }
    return null;
}

function getStripeSecretKey(): string {
    // 1) Local emulator file (functions/.runtimeconfig.json)
    const local = readRuntimeConfig();
    const k1 = local?.stripe?.secret_key;
    if (typeof k1 === "string" && k1.startsWith("sk_")) return k1;

    // 2) Env var (optional)
    const k2 = process.env.STRIPE_SECRET_KEY;
    if (typeof k2 === "string" && k2.startsWith("sk_")) return k2;

    throw new Error("Stripe secret key not configured (sk_test_/sk_live_).");
}

let stripeClient: Stripe | null = null;
function getStripe(): Stripe {
    if (stripeClient) return stripeClient;

    // NOTE: apiVersion typing can be annoying depending on stripe package version.
    // This keeps TS happy and still uses modern defaults.
    stripeClient = new Stripe(getStripeSecretKey(), {
        // If you want to lock it, use:
        // apiVersion: "2024-06-20" as any,
    });

    return stripeClient;
}

// --------- helpers ----------
function clampStr(v: unknown, max = 2000) {
    const s = String(v ?? "");
    return s.length > max ? s.slice(0, max) : s;
}
function normalizeEmail(v: unknown) {
    return clampStr(v, 200).trim().toLowerCase();
}
function normalizePostal(v: unknown) {
    return clampStr(v, 20)
        .toUpperCase()
        .replace(/\s+/g, "")
        .replace(/[^A-Z0-9]/g, "");
}

function sanitizeClient(client: any) {
    const c = client ?? {};
    return {
        fullName: clampStr(c.fullName, 160).trim(),
        email: normalizeEmail(c.email),
        phone: clampStr(c.phone, 60).trim(),

        addressLine1: clampStr(c.addressLine1, 200).trim(),
        addressLine2: clampStr(c.addressLine2, 200).trim(),
        city: clampStr(c.city, 120).trim(),
        province: clampStr(c.province, 10).trim().toUpperCase(),
        postalCode: normalizePostal(c.postalCode),

        preferredLanguage: c.preferredLanguage === "en" ? "en" : "fr",

        newsletterOptIn: Boolean(c.newsletterOptIn),
        contactByEmail: Boolean(c.contactByEmail),
        contactByPhone: Boolean(c.contactByPhone),
        preferredContactTime: clampStr(c.preferredContactTime, 60).trim(),
        heardAbout: clampStr(c.heardAbout, 120).trim(),

        wantsToVolunteer: Boolean(c.wantsToVolunteer),
        volunteerAreas: Array.isArray(c.volunteerAreas)
            ? c.volunteerAreas.slice(0, 12).map((x: any) => clampStr(x, 80))
            : [],
        availability: clampStr(c.availability, 20).trim(),

        consent: Boolean(c.consent),
        notes: clampStr(c.notes, 2000).trim(),
    };
}

// ------------------------------
// 1) Create Stripe Checkout Session
// ------------------------------
export const createCheckoutSession = onCall(async (request) => {
    const { data, auth } = request;

    const priceId = String(data?.priceId ?? "");
    if (!priceId.startsWith("price_")) {
        throw new HttpsError("invalid-argument", "Invalid priceId.");
    }

    const mode: "payment" | "subscription" =
        data?.mode === "payment" ? "payment" : "subscription";

    const planName = clampStr(data?.planName, 80).trim();

    const client = sanitizeClient(data?.client);
    if (!client.email || !client.email.includes("@")) {
        throw new HttpsError("invalid-argument", "Client email missing/invalid.");
    }
    if (!client.consent) {
        throw new HttpsError("failed-precondition", "Consent is required.");
    }

    // Optional: if logged in, we store uid
    const uid = auth?.uid ?? null;

    // Vite dev: http://localhost:5173
    // You can override with env for prod
    const baseUrl = process.env.PUBLIC_URL?.trim() || "http://localhost:5173";

    const stripe = getStripe();

    // Create intent doc first (for idempotency/audit)
    const intentRef = db.collection("checkoutIntents").doc();
    const intentId = intentRef.id;

    await intentRef.set({
        intentId,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        status: "created",

        uid,
        planName,
        priceId,
        mode,
        client,
    });

    // Create Stripe session
    const session = await stripe.checkout.sessions.create({
        mode,
        customer_email: client.email,
        line_items: [{ price: priceId, quantity: 1 }],

        success_url: `${baseUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/membership/cancel`,

        client_reference_id: intentId,
        metadata: {
            intentId,
            uid: uid ?? "",
            priceId,
            mode,
            planName,
        },
    });

    if (!session.url) {
        throw new HttpsError("internal", "Stripe session URL missing.");
    }

    await intentRef.update({
        stripeSessionId: session.id,
        status: "session_created",
        updatedAt: FieldValue.serverTimestamp(),
    });

    return { url: session.url, intentId };
});

// ---------------------------------------
// 2) Finalize membership after success redirect
//    - Verify Stripe session is paid/subscribed
//    - Create member doc (idempotent)
// ---------------------------------------
export const finalizeMembershipFromSession = onCall(async (request) => {
    const { data } = request;
    const sessionId = String(data?.sessionId ?? "");

    if (!sessionId.startsWith("cs_")) {
        throw new HttpsError("invalid-argument", "Invalid session id.");
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items", "customer", "subscription"],
    });

    const isPayment = session.mode === "payment";
    const isSub = session.mode === "subscription";

    const paidOk =
        (isPayment && session.payment_status === "paid") ||
        (isSub && !!session.subscription);

    if (!paidOk) {
        throw new HttpsError("failed-precondition", "Payment/subscription not completed.");
    }

    const lineItems = (session as any).line_items?.data ?? [];
    const paidPriceId = lineItems?.[0]?.price?.id as string | undefined;

    if (!paidPriceId?.startsWith("price_")) {
        throw new HttpsError("internal", "Could not determine paid price.");
    }

    const intentId =
        (session.client_reference_id as string | null) ||
        ((session.metadata as any)?.intentId as string | undefined) ||
        "";

    if (!intentId) {
        throw new HttpsError("internal", "Missing intent reference.");
    }

    const intentRef = db.collection("checkoutIntents").doc(intentId);
    const intentSnap = await intentRef.get();
    if (!intentSnap.exists) {
        throw new HttpsError("not-found", "Intent not found.");
    }

    const intent = intentSnap.data() as any;

    // Extra safety: price must match
    if (intent?.priceId && intent.priceId !== paidPriceId) {
        throw new HttpsError(
            "failed-precondition",
            "Paid price does not match selected plan."
        );
    }

    const email =
        (session.customer_details?.email ??
            session.customer_email ??
            intent?.client?.email ??
            null) as string | null;

    if (!email) throw new HttpsError("internal", "Missing email.");

    const customerId =
        session.customer
            ? typeof session.customer === "string"
                ? session.customer
                : session.customer.id
            : null;

    const subscriptionId =
        session.subscription
            ? typeof session.subscription === "string"
                ? session.subscription
                : (session.subscription as any)?.id ?? null
            : null;

    const membersCol = db.collection("members");
    const membershipsCol = db.collection("memberships");

    // lock doc = intentId (idempotency)
    const lockRef = membershipsCol.doc(intentId);

    // counter doc (optional)
    const metaRef = db.collection("_meta").doc("members");

    const result = await db.runTransaction(async (tx) => {
        const lockSnap = await tx.get(lockRef);
        if (lockSnap.exists) {
            const prev = lockSnap.data() as any;
            return {
                alreadyFinalized: true,
                memberId: prev.memberId ?? null,
                isFirstMember: prev.isFirstMember ?? false,
            };
        }

        const metaSnap = await tx.get(metaRef);
        const currentCount = metaSnap.exists ? Number(metaSnap.get("count") ?? 0) : 0;
        const isFirstMember = currentCount === 0;

        const memberRef = membersCol.doc();
        const memberId = memberRef.id;

        const client = intent?.client ?? {};

        tx.set(memberRef, {
            fullName: client.fullName ?? "",
            email,
            city: client.city ?? "",
            age: 0,
            status: "active",
            tags: [],

            profile: { ...(client ?? {}) },

            membership: {
                planName: intent.planName ?? null,
                priceId: paidPriceId,
                mode: session.mode,
                status: "active",
                activatedAt: FieldValue.serverTimestamp(),
                stripeSessionId: session.id,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                paymentStatus: session.payment_status,
            },

            isFirstMember,

            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });

        tx.set(lockRef, {
            intentId,
            memberId,
            createdAt: FieldValue.serverTimestamp(),
            stripeSessionId: session.id,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscriptionId,
            priceId: paidPriceId,
            email,
            status: "active",
            paymentStatus: session.payment_status,
            mode: session.mode,
            planName: intent.planName ?? null,
            isFirstMember,
        });

        tx.update(intentRef, {
            status: "paid",
            paidAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            memberId,
        });

        tx.set(
            metaRef,
            { count: currentCount + 1, updatedAt: FieldValue.serverTimestamp() },
            { merge: true }
        );

        return { alreadyFinalized: false, memberId, isFirstMember };
    });

    return {
        ok: true,
        ...result,
        email,
        planName: intent.planName ?? null,
        stripe: {
            customerId,
            subscriptionId,
            sessionId: session.id,
            mode: session.mode,
        },
    };
});
