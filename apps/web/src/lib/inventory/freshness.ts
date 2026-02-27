export type PantryStatus = "fresh" | "expiring" | "expired";

export function statusForUseByDate(useByDate: Date | null, expiringSoonDays = 7): PantryStatus {
  if (!useByDate) {
    return "fresh";
  }

  const today = stripTime(new Date());
  const useBy = stripTime(useByDate);
  const deltaDays = Math.floor((useBy.getTime() - today.getTime()) / 86_400_000);

  if (deltaDays < 0) {
    return "expired";
  }
  if (deltaDays <= expiringSoonDays) {
    return "expiring";
  }
  return "fresh";
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function stripTime(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
