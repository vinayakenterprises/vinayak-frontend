export const formatToIST = (dateStr) => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr + 'Z').toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
