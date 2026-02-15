'use client';

import type { Settings } from '../types';
import { MODELS } from '../constants';

interface SettingsPanelProps {
  settings: Settings;
  onChange: (settings: Settings) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  return (
    <div
      className="px-4 md:px-6 py-4 border-b"
      style={{ borderColor: 'var(--border)' }}
    >
      <h3
        className="text-[11px] tracking-widest uppercase mb-3"
        style={{ fontFamily: 'var(--font-body)', color: 'var(--muted)' }}
      >
        API Configuration
      </h3>
      <div className="flex flex-col md:flex-row gap-3 md:gap-4 items-start">
        <div className="flex-1 w-full">
          <label
            className="text-[11px] block mb-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--border-hover)' }}
          >
            api_key
          </label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
            placeholder="sk-&#x2026; or ant-&#x2026;"
            className="w-full px-3 py-2.5 bg-transparent border text-sm outline-none min-h-[44px] transition-colors"
            style={{
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          />
        </div>
        <div className="w-full md:w-52">
          <label
            className="text-[11px] block mb-1"
            style={{ fontFamily: 'var(--font-mono)', color: 'var(--border-hover)' }}
          >
            model
          </label>
          <select
            value={settings.model}
            onChange={(e) => onChange({ ...settings, model: e.target.value })}
            className="w-full px-3 py-2.5 border text-sm outline-none min-h-[44px] transition-colors"
            style={{
              backgroundColor: 'var(--bg)',
              borderColor: 'var(--border)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--fg)',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-hover)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <p
        className="text-[11px] mt-3"
        style={{ fontFamily: 'var(--font-mono)', color: 'var(--border-hover)' }}
      >
        Keys stored locally. Sent only to the provider API.
      </p>
    </div>
  );
}
