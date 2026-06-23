export const formatToIST = (dateInput) => {

  console.log("lsjdfdlj", dateInput);

  if (!dateInput) return 'N/A';
  let date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    const str = String(dateInput);
    const hasTimezone = /([+-]\d{2}:?\d{2}|[+-]\d{2}|[Zz])$/.test(str);
    date = new Date(hasTimezone ? str : str + 'Z');
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

export const calculateTenderSLAs = (tender, now = new Date()) => {
  if (!tender) return null;

  const getDelayText = (plannedDate, actualDate) => {
    const planned = new Date(plannedDate);
    const actual = actualDate ? new Date(actualDate) : now;
    if (isNaN(planned.getTime()) || isNaN(actual.getTime())) return '';
    const diffMs = actual.getTime() - planned.getTime();
    if (diffMs <= 0) return '';
    
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    let text = '';
    if (diffDays > 0) text += `${diffDays}d `;
    text += `${diffHours}h`;
    return text;
  };

  const getStageSLA = (plannedBase, plannedOffsetDays, actualVal, isCoStage = false) => {
    if (!plannedBase) return { status: 'NA', label: '-', planned: null, actual: null };

    let planned;
    if (isCoStage) {
      planned = new Date(plannedBase);
      planned.setDate(planned.getDate() - 1);
    } else {
      const baseStr = String(plannedBase);
      const hasTimezone = /([+-]\d{2}:?\d{2}|[+-]\d{2}|[Zz])$/.test(baseStr);
      planned = new Date(hasTimezone ? baseStr : baseStr + 'Z');
      planned.setDate(planned.getDate() + plannedOffsetDays);
    }

    if (isNaN(planned.getTime())) return { status: 'NA', label: '-', planned: null, actual: null };

    const actual = actualVal ? new Date(actualVal) : null;
    const actualTime = actual && !isNaN(actual.getTime()) ? actual : null;

    if (actualTime) {
      if (actualTime > planned) {
        return { status: 'Late', label: `Late by ${getDelayText(planned, actualTime)}`, planned, actual: actualTime };
      }
      return { status: 'OnTime', label: 'On Time', planned, actual: actualTime };
    } else {
      if (now > planned) {
        return { status: 'Overdue', label: `Overdue by ${getDelayText(planned, null)}`, planned, actual: null };
      }
      return { status: 'OnTime', label: 'On Track', planned, actual: null };
    }
  };

  const hasCounterOffer = tender.counter_offer?.enabled || tender.counter_offer?.counter_offer;
  const showCoApproval = hasCounterOffer && tender.counter_offer?.sent_for_approval_at && tender.counter_offer?.counter_offer_deadline;

  return {
    approval: getStageSLA(tender.created_at, 2, tender.send_for_approval_at),
    submissionSlip: getStageSLA(tender.approved_at, 5, tender.a9slip?.added_at),
    mdCoApproval: showCoApproval ? getStageSLA(tender.counter_offer.counter_offer_deadline, 0, tender.counter_offer.counter_offer_approve_by_md_at, true) : { status: 'NA', label: '-', planned: null, actual: null },
    immediateDocs: getStageSLA(tender.po?.added_at, 5, tender.immediate_processing_document_completed_at),
    acceptanceLetter: getStageSLA(tender.immediate_processing_document_completed_at, 5, tender.acceptance_letter?.added_at),
    completion: getStageSLA(tender.acceptance_letter?.added_at, 3, tender.tender_completed_at)
  };
};
