'use client';

import React from 'react';
import { BarChart3, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Total Queries', value: '1,284', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Successful Resolutions', value: '92%', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Most Common Issue', value: 'HVAC E102', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Avg. Resolution Time', value: '14m', icon: BarChart3, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  ];

  return (
    <div className="p-6 bg-white border-b border-slate-100">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
              <p className="text-lg font-bold text-slate-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
