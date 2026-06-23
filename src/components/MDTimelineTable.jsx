import React from 'react';
import { calculateTenderSLAs } from '../utils/helper-functions';

export default function MDTimelineTable({ tenders, onViewClick }) {
  const getBadgeClass = (status) => {
    switch (status) {
      case 'OnTime':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50 border';
      case 'Late':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50 border';
      case 'Overdue':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-955/30 dark:text-amber-400 dark:border-amber-900/50 border';
      default:
        return 'text-slate-400 dark:text-slate-500 font-semibold italic';
    }
  };

  const getDotClass = (status) => {
    switch (status) {
      case 'OnTime':
        return 'bg-emerald-500';
      case 'Late':
        return 'bg-rose-500 animate-pulse';
      case 'Overdue':
        return 'bg-amber-500 animate-pulse';
      default:
        return 'bg-slate-300 dark:bg-slate-700';
    }
  };

  return (
    <div className="overflow-x-auto pb-16">
      <table className="w-full text-left border-collapse min-w-[1200px]">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider select-none">
            <th className="py-3.5 px-6 w-[250px]">Tender ID &amp; Title</th>
            <th className="py-3.5 px-4 text-center">1. Sent Approval</th>
            <th className="py-3.5 px-4 text-center">2. Sub. Slip</th>
            <th className="py-3.5 px-4 text-center">3. MD CO Approval</th>
            <th className="py-3.5 px-4 text-center">4. Immediate Docs</th>
            <th className="py-3.5 px-4 text-center">5. Acceptance Lttr</th>
            <th className="py-3.5 px-4 text-center">6. Completion</th>
            <th className="py-3.5 px-6 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {tenders.map((tender) => {
            const slas = calculateTenderSLAs(tender);
            return (
              <tr
                key={tender.id}
                className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group"
              >
                <td className="py-4 px-6 text-xs max-w-[250px]">
                  <div className="font-bold text-slate-800 dark:text-slate-355 truncate" title={tender.tender_id}>
                    {tender.tender_id}
                  </div>
                  <div className="font-medium text-slate-900 dark:text-white truncate mt-0.5" title={tender.tender_title}>
                    {tender.tender_title}
                  </div>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5 truncate" title={tender.tender_ref_no}>
                    {tender.tender_ref_no}
                  </div>
                </td>

                {/* Stages */}
                {[
                  { name: 'approval', data: slas.approval },
                  { name: 'submissionSlip', data: slas.submissionSlip },
                  { name: 'mdCoApproval', data: slas.mdCoApproval },
                  { name: 'immediateDocs', data: slas.immediateDocs },
                  { name: 'acceptanceLetter', data: slas.acceptanceLetter },
                  { name: 'completion', data: slas.completion }
                ].map((stage, idx) => (
                  <td key={idx} className="py-4 px-3 text-center">
                    {stage.data.status === 'NA' ? (
                      <span className="text-slate-400 dark:text-slate-650 text-xs">-</span>
                    ) : (
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${getBadgeClass(stage.data.status)}`}>
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotClass(stage.data.status)}`} />
                        {stage.data.label}
                      </span>
                    )}
                  </td>
                ))}

                {/* Actions */}
                <td className="py-4 px-6 text-sm text-right whitespace-nowrap">
                  <button
                    onClick={() => onViewClick(tender)}
                    className="px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-400 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1 border border-slate-100 dark:border-slate-800"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
