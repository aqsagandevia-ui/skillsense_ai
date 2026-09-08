// Meeting link generator (fallback format similar to Google Meet)
exports.generateMeetingLink = () => {
  const rand = (n) => Math.random().toString(36).substring(2, 2 + n);
  // Format xxx-yyyy-zzz (3-4-3) using letters/numbers
  const part1 = rand(3);
  const part2 = rand(4);
  const part3 = rand(3);
  return `https://meet.google.com/${part1}-${part2}-${part3}`;
};
