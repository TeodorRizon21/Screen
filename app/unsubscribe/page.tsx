import { Suspense } from "react";
import UnsubscribeContent from "../components/UnsubscribeContent";

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
