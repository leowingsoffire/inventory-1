'use client';

import { useState } from 'react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea';
  required: boolean;
  options?: string[];
}

interface FormRendererProps {
  fields: FormField[];
  onSubmit: (responses: Record<string, unknown>) => void;
  lang?: 'en' | 'zh';
}

export default function FormRenderer({ fields, onSubmit, lang = 'en' }: FormRendererProps) {
  const [values, setValues] = useState<Record<string, unknown>>({});

  function handleChange(name: string, value: unknown) {
    setValues(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields.map(field => (
        <div key={field.name}>
          <label className="text-white/50 text-xs mb-1 block">
            {field.label} {field.required && <span className="text-red-400">*</span>}
          </label>
          {field.type === 'text' && (
            <input type="text" required={field.required}
              value={(values[field.name] as string) || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm" />
          )}
          {field.type === 'number' && (
            <input type="number" required={field.required}
              value={(values[field.name] as number) || ''}
              onChange={e => handleChange(field.name, parseFloat(e.target.value))}
              className="glass-input w-full px-3 py-2 text-sm" />
          )}
          {field.type === 'date' && (
            <input type="date" required={field.required}
              value={(values[field.name] as string) || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm" />
          )}
          {field.type === 'textarea' && (
            <textarea rows={3} required={field.required}
              value={(values[field.name] as string) || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm" />
          )}
          {field.type === 'select' && (
            <select required={field.required}
              value={(values[field.name] as string) || ''}
              onChange={e => handleChange(field.name, e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm">
              <option value="">{lang === 'en' ? 'Select...' : '请选择...'}</option>
              {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          )}
          {field.type === 'checkbox' && (
            <label className="flex items-center gap-2">
              <input type="checkbox"
                checked={!!values[field.name]}
                onChange={e => handleChange(field.name, e.target.checked)} />
              <span className="text-white/60 text-sm">{field.label}</span>
            </label>
          )}
        </div>
      ))}
      <button type="submit"
        className="glass-button px-4 py-2 text-sm bg-accent-500/20 text-accent-300 border border-accent-500/30 hover:bg-accent-500/30 w-full">
        {lang === 'en' ? 'Submit' : '提交'}
      </button>
    </form>
  );
}
