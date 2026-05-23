'use client';

import React from 'react';
import { Settings, Info, AlertTriangle } from 'lucide-react';

interface ContextPanelProps {
  context: {
    deviceType: string;
    errorCode: string;
    symptoms: string;
  };
  setContext: (context: any) => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ context, setContext }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setContext((prev: any) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="w-80 h-full bg-slate-50 border-r border-slate-200 p-6 flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-2 text-slate-900 font-semibold mb-2">
        <Settings className="w-5 h-5 text-indigo-600" />
        <h2>Issue Context</h2>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Device Type</label>
          <select
            name="deviceType"
            value={context.deviceType}
            onChange={handleChange}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
          >
            <option value="">Select Device...</option>
            <option value="HVAC System">HVAC System</option>
            <option value="Power Generator">Power Generator</option>
            <option value="Industrial Pump">Industrial Pump</option>
            <option value="Elevator Controller">Elevator Controller</option>
            <option value="Solar Inverter">Solar Inverter</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Error Code</label>
          <div className="relative">
            <input
              type="text"
              name="errorCode"
              placeholder="e.g. E102, 0x88"
              value={context.errorCode}
              onChange={handleChange}
              className="w-full p-2.5 pl-10 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
            />
            <AlertTriangle className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Symptoms</label>
          <textarea
            name="symptoms"
            placeholder="Describe what you see/hear..."
            value={context.symptoms}
            onChange={handleChange}
            rows={4}
            className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm resize-none"
          />
        </div>
      </div>

      <div className="mt-auto p-4 bg-indigo-50 rounded-xl border border-indigo-100">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-indigo-600 shrink-0" />
          <p className="text-xs text-indigo-800 leading-relaxed">
            The AI assistant uses this context to provide more accurate diagnostics. Ensure error codes match the device manual.
          </p>
        </div>
      </div>
    </div>
  );
};
