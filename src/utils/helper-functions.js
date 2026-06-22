export const formatToIST = (dateInput) => {

  console.log("lsjdfdlj", dateInput);

  if (!dateInput) return 'N/A';
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    const str = String(dateInput);
    const hasZ = str.endsWith('Z') || str.endsWith('z');
    date = new Date(hasZ ? str : str + 'Z');
  }

  if (isNaN(date.getTime())) return 'N/A';

  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};
