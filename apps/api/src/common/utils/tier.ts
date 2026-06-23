export function getTier(ratingPoint: number): string {
  const points = Number(ratingPoint);
  if (points < 1000) return 'Bronze';
  if (points < 1500) return 'Silver';
  if (points < 2000) return 'Gold';
  if (points < 2500) return 'Platinum';
  return 'Master';
}
