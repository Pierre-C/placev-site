export function shouldShowMemberAlert(user: { isMember: boolean; reservationCount: number }): boolean {
  return !user.isMember && user.reservationCount > 3;
}

export function calculateClosureBatch(reservations: { id: string; userId: string | null; status: string; costCredits: number | null }[]) {
  const toCancel = reservations.filter(r => r.status === "CONFIRMED");
  const refunds = toCancel.map(r => ({ userId: r.userId, creditsRefunded: r.costCredits }));
  const transactions = toCancel.map(r => ({
    userId: r.userId,
    type: "CANCELLATION_REFUND",
    creditsAdd: r.costCredits,
  }));
  const totalRefunded = toCancel.reduce((sum, r) => sum + (r.costCredits || 0), 0);

  return { toCancel, refunds, transactions, totalRefunded };
}

export function validateCreditAdjustment(data: { delta: number; description?: string }): boolean {
  if (typeof data.delta !== "number") return false;
  if (!data.description || data.description.trim() === "") return false;
  return true;
}

export function filterCsvExport(reservations: { type: string }[]): any[] {
  return reservations.filter(r => r.type === "OPENSPACE");
}

export function proxyBookingDebit(targetUser: { id: string; credits: number }, cost: number) {
  const wouldGoBelow = targetUser.credits - cost < -3;
  if (wouldGoBelow) {
    return { success: false };
  }
  return { success: true, user: { ...targetUser, credits: targetUser.credits - cost } };
}

export function organisationBooking() {
  return { type: "ORGANIZATION", userId: null, costCredits: null };
}

export function capacityRemaining(capacity: number, orgBookings: number, confirmedDeskBookings: number) {
  return capacity - orgBookings - confirmedDeskBookings;
}
