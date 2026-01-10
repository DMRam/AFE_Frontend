import { useEffect, useState } from "react";
import { MEMBERSHIP_DUMMY, type MembershipContent } from "../content/membershipContent";

type State =
  | { status: "loading"; data?: undefined; error?: undefined }
  | { status: "success"; data: MembershipContent; error?: undefined }
  | { status: "error"; data?: undefined; error: string };

export function useMembershipContent() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    // ✅ dummy now (simulate fetch)
    const t = window.setTimeout(() => {
      setState({ status: "success", data: MEMBERSHIP_DUMMY });
    }, 120);

    return () => window.clearTimeout(t);

    /**
     * 🔥 Later: replace the timeout with Firestore:
     * const ref = doc(db, "pages", "membership");
     * const snap = await getDoc(ref);
     * setState({ status:"success", data: snap.data() as MembershipContent });
     */
  }, []);

  return state;
}
