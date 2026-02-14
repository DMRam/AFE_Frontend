import { httpsCallable } from "firebase/functions";
import { functions } from "../../../../../services/firebase";

export type Role = "admin" | "editor" | "viewer";

export async function apiCreateDashboardUser(payload: {
    email: string;
    password: string;
    displayName: string;
    role: Role;
}) {
    const fn = httpsCallable(functions, "createDashboardUser");
    return (await fn(payload)).data as any;
}

export async function apiSetDashboardUserDisabled(payload: { uid: string; disabled: boolean }) {
    const fn = httpsCallable(functions, "setDashboardUserDisabled");
    return (await fn(payload)).data as any;
}

export async function apiSetDashboardUserRole(payload: { uid: string; role: Role }) {
    const fn = httpsCallable(functions, "setDashboardUserRole");
    return (await fn(payload)).data as any;
}

export async function apiDeleteDashboardUser(payload: { uid: string }) {
    const fn = httpsCallable(functions, "deleteDashboardUser");
    return (await fn(payload)).data as any;
}
