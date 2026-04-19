'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Zap, Check, X, Loader2, Lightbulb, ArrowRight } from 'lucide-react';
import { useApp } from '@/lib/context';

interface FieldSuggestion {
  field: string;
  value: string;
  reason: string;
}

interface AIFormAssistProps {
  module: 'asset' | 'maintenance' | 'employee' | 'customer' | 'vendor' | 'finance' | 'change-request' | 'compliance';
  currentValues: Record<string, string>;
  onApplySuggestion: (field: string, value: string) => void;
  onApplyAll?: (suggestions: FieldSuggestion[]) => void;
  compact?: boolean;
}

// Smart field suggestions based on module context and filled values
function generateSuggestions(
  module: string,
  values: Record<string, string>,
  lang: 'en' | 'zh'
): FieldSuggestion[] {
  const suggestions: FieldSuggestion[] = [];
  const v = values;

  switch (module) {
    case 'asset': {
      if (v.brand && !v.name) {
        const models: Record<string, string> = {
          dell: 'Dell Latitude 5540', hp: 'HP EliteBook 840 G10', lenovo: 'ThinkPad X1 Carbon Gen 11',
          apple: 'MacBook Pro 14"', cisco: 'Cisco Catalyst 9200', samsung: 'Samsung 27" Monitor',
        };
        const match = Object.entries(models).find(([k]) => v.brand.toLowerCase().includes(k));
        if (match) suggestions.push({ field: 'name', value: match[1], reason: lang === 'en' ? `Popular ${v.brand} model` : `热门${v.brand}型号` });
      }
      if (!v.assetTag) {
        const prefix = v.category ? v.category.substring(0, 3).toUpperCase() : 'AST';
        const tag = `${prefix}-${String(Date.now()).slice(-6)}`;
        suggestions.push({ field: 'assetTag', value: tag, reason: lang === 'en' ? 'Auto-generated asset tag' : '自动生成资产标签' });
      }
      if (v.purchaseDate && !v.warrantyEnd) {
        const purchase = new Date(v.purchaseDate);
        const warranty = new Date(purchase);
        warranty.setFullYear(warranty.getFullYear() + 3);
        suggestions.push({
          field: 'warrantyEnd',
          value: warranty.toISOString().split('T')[0],
          reason: lang === 'en' ? 'Standard 3-year warranty' : '标准3年保修',
        });
      }
      if (!v.location) suggestions.push({ field: 'location', value: 'Main Office - Singapore', reason: lang === 'en' ? 'Default office location' : '默认办公地点' });
      if (!v.condition) suggestions.push({ field: 'condition', value: 'good', reason: lang === 'en' ? 'New assets are typically in good condition' : '新资产通常状况良好' });
      if (!v.status) suggestions.push({ field: 'status', value: 'available', reason: lang === 'en' ? 'Default status for new assets' : '新资产默认状态' });
      break;
    }

    case 'maintenance': {
      if (v.title && !v.priority) {
        const urgent = /urgent|critical|down|crash|broken|fail|error|emergency/i;
        const high = /slow|not working|issue|problem|malfunction/i;
        if (urgent.test(v.title)) {
          suggestions.push({ field: 'priority', value: 'critical', reason: lang === 'en' ? 'Detected urgency keywords' : '检测到紧急关键词' });
        } else if (high.test(v.title)) {
          suggestions.push({ field: 'priority', value: 'high', reason: lang === 'en' ? 'Issue-related keywords found' : '发现问题相关关键词' });
        } else {
          suggestions.push({ field: 'priority', value: 'medium', reason: lang === 'en' ? 'Standard priority for this type' : '此类型的标准优先级' });
        }
      }
      if (v.title && !v.type) {
        const repair = /repair|fix|broken|replace|hardware/i;
        const software = /install|update|upgrade|software|license/i;
        if (repair.test(v.title)) {
          suggestions.push({ field: 'type', value: 'repair', reason: lang === 'en' ? 'Hardware-related issue detected' : '检测到硬件问题' });
        } else if (software.test(v.title)) {
          suggestions.push({ field: 'type', value: 'software', reason: lang === 'en' ? 'Software-related issue detected' : '检测到软件问题' });
        }
      }
      if (v.title && !v.description) {
        suggestions.push({
          field: 'description',
          value: `Issue reported: ${v.title}.\n\nSteps to reproduce:\n1. \n\nExpected behavior:\n\nActual behavior:\n`,
          reason: lang === 'en' ? 'Auto-generated description template' : '自动生成描述模板',
        });
      }
      if (!v.status) suggestions.push({ field: 'status', value: 'open', reason: lang === 'en' ? 'New tickets start as open' : '新工单默认为打开状态' });
      break;
    }

    case 'employee': {
      if (v.name && !v.email) {
        const parts = v.name.toLowerCase().trim().split(/\s+/);
        if (parts.length >= 2) {
          const email = `${parts[0]}.${parts[parts.length - 1]}@unitech.sg`;
          suggestions.push({ field: 'email', value: email, reason: lang === 'en' ? 'Generated from name pattern' : '根据姓名生成' });
        }
      }
      if (!v.employeeId) {
        const id = `EMP-${String(Date.now()).slice(-5)}`;
        suggestions.push({ field: 'employeeId', value: id, reason: lang === 'en' ? 'Auto-generated employee ID' : '自动生成员工编号' });
      }
      if (!v.status) suggestions.push({ field: 'status', value: 'active', reason: lang === 'en' ? 'Default for new hires' : '新员工默认状态' });
      if (!v.joinDate) {
        suggestions.push({ field: 'joinDate', value: new Date().toISOString().split('T')[0], reason: lang === 'en' ? 'Today\'s date' : '今天的日期' });
      }
      break;
    }

    case 'customer': {
      if (v.companyName && !v.industry) {
        const tech = /tech|software|digital|cloud|cyber|data|ai/i;
        const finance = /bank|finance|capital|fund|invest/i;
        const retail = /shop|store|mart|retail|trade/i;
        const logistics = /logistics|shipping|transport|freight/i;
        if (tech.test(v.companyName)) suggestions.push({ field: 'industry', value: 'Technology', reason: lang === 'en' ? 'Detected tech company' : '检测到科技公司' });
        else if (finance.test(v.companyName)) suggestions.push({ field: 'industry', value: 'Financial Services', reason: lang === 'en' ? 'Detected financial company' : '检测到金融公司' });
        else if (retail.test(v.companyName)) suggestions.push({ field: 'industry', value: 'Retail', reason: lang === 'en' ? 'Detected retail company' : '检测到零售公司' });
        else if (logistics.test(v.companyName)) suggestions.push({ field: 'industry', value: 'Logistics', reason: lang === 'en' ? 'Detected logistics company' : '检测到物流公司' });
      }
      if (!v.country) suggestions.push({ field: 'country', value: 'Singapore', reason: lang === 'en' ? 'Default country' : '默认国家' });
      if (!v.paymentTerms) suggestions.push({ field: 'paymentTerms', value: 'Net 30', reason: lang === 'en' ? 'Standard payment terms' : '标准付款条件' });
      if (!v.currency && !v.contractValue) suggestions.push({ field: 'currency', value: 'SGD', reason: lang === 'en' ? 'Singapore Dollar default' : '新加坡元默认' });
      break;
    }

    case 'vendor': {
      if (v.companyName && !v.category) {
        const hw = /hardware|device|component|chip|server|network/i;
        const sw = /software|saas|cloud|license|platform/i;
        const svc = /service|consult|support|outsource|managed/i;
        if (hw.test(v.companyName)) suggestions.push({ field: 'category', value: 'hardware', reason: lang === 'en' ? 'Hardware vendor detected' : '检测到硬件供应商' });
        else if (sw.test(v.companyName)) suggestions.push({ field: 'category', value: 'software', reason: lang === 'en' ? 'Software vendor detected' : '检测到软件供应商' });
        else if (svc.test(v.companyName)) suggestions.push({ field: 'category', value: 'services', reason: lang === 'en' ? 'Services vendor detected' : '检测到服务供应商' });
      }
      if (!v.country) suggestions.push({ field: 'country', value: 'Singapore', reason: lang === 'en' ? 'Default country' : '默认国家' });
      if (!v.paymentTerms) suggestions.push({ field: 'paymentTerms', value: 'Net 30', reason: lang === 'en' ? 'Standard terms' : '标准条件' });
      if (!v.rating) suggestions.push({ field: 'rating', value: '3', reason: lang === 'en' ? 'Default neutral rating' : '默认中性评级' });
      break;
    }

    case 'finance': {
      if (!v.invoiceNumber) {
        const prefix = v.type === 'quotation' ? 'QUO' : v.type === 'credit_note' ? 'CN' : 'INV';
        const num = `${prefix}-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`;
        suggestions.push({ field: 'invoiceNumber', value: num, reason: lang === 'en' ? 'Auto-generated number' : '自动生成编号' });
      }
      if (!v.issueDate) {
        suggestions.push({ field: 'issueDate', value: new Date().toISOString().split('T')[0], reason: lang === 'en' ? 'Today\'s date' : '今天的日期' });
      }
      if (v.issueDate && !v.dueDate) {
        const due = new Date(v.issueDate);
        due.setDate(due.getDate() + 30);
        suggestions.push({ field: 'dueDate', value: due.toISOString().split('T')[0], reason: lang === 'en' ? 'Net 30 from issue date' : '开票日起30天' });
      }
      if (!v.gstRate) suggestions.push({ field: 'gstRate', value: '9', reason: lang === 'en' ? 'Singapore GST rate 9%' : '新加坡GST税率9%' });
      if (!v.currency) suggestions.push({ field: 'currency', value: 'SGD', reason: lang === 'en' ? 'Singapore Dollar' : '新加坡元' });
      break;
    }

    case 'change-request': {
      if (v.shortDescription && !v.priority) {
        const emer = /emergency|critical|outage|security|breach/i;
        const high = /upgrade|migration|server|network|infrastructure/i;
        if (emer.test(v.shortDescription)) {
          suggestions.push({ field: 'priority', value: 'critical', reason: lang === 'en' ? 'Emergency change detected' : '检测到紧急变更' });
          suggestions.push({ field: 'risk', value: 'high', reason: lang === 'en' ? 'Emergency changes carry high risk' : '紧急变更风险较高' });
        } else if (high.test(v.shortDescription)) {
          suggestions.push({ field: 'priority', value: 'high', reason: lang === 'en' ? 'Infrastructure change detected' : '检测到基础设施变更' });
          suggestions.push({ field: 'risk', value: 'medium', reason: lang === 'en' ? 'Moderate risk for infra changes' : '基础设施变更中等风险' });
        } else {
          suggestions.push({ field: 'priority', value: 'medium', reason: lang === 'en' ? 'Standard priority' : '标准优先级' });
        }
      }
      if (v.shortDescription && !v.implementationPlan) {
        suggestions.push({
          field: 'implementationPlan',
          value: `1. Pre-change verification\n2. Create backup/snapshot\n3. Implement: ${v.shortDescription}\n4. Post-change testing\n5. Monitor for 30 minutes\n6. Update documentation`,
          reason: lang === 'en' ? 'Standard implementation template' : '标准实施模板',
        });
      }
      if (!v.backoutPlan) {
        suggestions.push({
          field: 'backoutPlan',
          value: '1. Stop implementation immediately\n2. Restore from backup/snapshot\n3. Verify service restoration\n4. Notify stakeholders\n5. Document failure reason',
          reason: lang === 'en' ? 'Standard backout template' : '标准回退模板',
        });
      }
      if (!v.state) suggestions.push({ field: 'state', value: 'new', reason: lang === 'en' ? 'New change requests start as new' : '新变更请求默认为新建' });
      break;
    }

    case 'compliance': {
      if (!v.reviewDate) {
        suggestions.push({ field: 'reviewDate', value: new Date().toISOString().split('T')[0], reason: lang === 'en' ? 'Set review to today' : '设置审查日期为今天' });
      }
      if (v.reviewDate && !v.nextReviewDate) {
        const next = new Date(v.reviewDate);
        next.setMonth(next.getMonth() + 6);
        suggestions.push({ field: 'nextReviewDate', value: next.toISOString().split('T')[0], reason: lang === 'en' ? '6-month review cycle' : '6个月审查周期' });
      }
      if (!v.riskLevel && v.status === 'non_compliant') {
        suggestions.push({ field: 'riskLevel', value: 'high', reason: lang === 'en' ? 'Non-compliant items are high risk' : '不合规项为高风险' });
      }
      break;
    }
  }

  return suggestions.slice(0, 5);
}

// Quick tips per module
const moduleTips: Record<string, { en: string; zh: string }[]> = {
  asset: [
    { en: 'Tip: Fill in brand name first — AI will suggest matching models', zh: '提示：先填写品牌名称 — AI将建议匹配型号' },
    { en: 'Tip: Warranty defaults to 3 years from purchase date', zh: '提示：保修默认从购买日期起3年' },
  ],
  maintenance: [
    { en: 'Tip: Use keywords like "urgent" or "broken" in title for auto-priority', zh: '提示：标题中使用"紧急"等关键词自动设置优先级' },
    { en: 'Tip: AI generates description templates from your title', zh: '提示：AI从标题生成描述模板' },
  ],
  employee: [
    { en: 'Tip: Enter full name to auto-generate email address', zh: '提示：输入全名自动生成邮箱地址' },
  ],
  customer: [
    { en: 'Tip: Company name auto-detects industry type', zh: '提示：公司名称自动检测行业类型' },
  ],
  vendor: [
    { en: 'Tip: Vendor name auto-detects category (hardware/software/services)', zh: '提示：供应商名称自动检测类别' },
  ],
  finance: [
    { en: 'Tip: GST auto-set to 9% (Singapore rate). Due date = issue + 30 days', zh: '提示：GST自动设为9%（新加坡税率）。到期日=开票日+30天' },
  ],
  'change-request': [
    { en: 'Tip: Describe the change to auto-fill priority, risk & implementation plan', zh: '提示：描述变更内容自动填充优先级、风险和实施计划' },
  ],
  compliance: [
    { en: 'Tip: Next review date auto-set to 6 months after review', zh: '提示：下次审查日期自动设为审查后6个月' },
  ],
};

export default function AIFormAssist({ module, currentValues, onApplySuggestion, onApplyAll, compact }: AIFormAssistProps) {
  const { lang } = useApp();
  const [suggestions, setSuggestions] = useState<FieldSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [tipIndex, setTipIndex] = useState(0);

  const tips = moduleTips[module] || [];

  // Re-generate suggestions when form values change
  const refreshSuggestions = useCallback(() => {
    setLoading(true);
    // Simulate a brief delay for UX feel
    setTimeout(() => {
      const result = generateSuggestions(module, currentValues, lang as 'en' | 'zh');
      setSuggestions(result.filter(s => !appliedFields.has(s.field)));
      setLoading(false);
    }, 300);
  }, [module, currentValues, lang, appliedFields]);

  useEffect(() => {
    if (showPanel) refreshSuggestions();
  }, [showPanel, refreshSuggestions]);

  // Cycle tips
  useEffect(() => {
    if (tips.length <= 1) return;
    const interval = setInterval(() => setTipIndex(i => (i + 1) % tips.length), 8000);
    return () => clearInterval(interval);
  }, [tips.length]);

  const handleApply = (suggestion: FieldSuggestion) => {
    onApplySuggestion(suggestion.field, suggestion.value);
    setAppliedFields(prev => new Set(prev).add(suggestion.field));
    setSuggestions(prev => prev.filter(s => s.field !== suggestion.field));
  };

  const handleApplyAll = () => {
    if (onApplyAll) {
      onApplyAll(suggestions);
    } else {
      suggestions.forEach(s => onApplySuggestion(s.field, s.value));
    }
    setAppliedFields(prev => {
      const next = new Set(prev);
      suggestions.forEach(s => next.add(s.field));
      return next;
    });
    setSuggestions([]);
  };

  if (compact) {
    return (
      <motion.button
        type="button"
        onClick={() => { setShowPanel(!showPanel); if (!showPanel) refreshSuggestions(); }}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/30 text-violet-300 text-[10px] hover:from-violet-500/30 hover:to-cyan-500/30 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title={lang === 'en' ? 'AI Auto-Fill' : 'AI自动填写'}
      >
        <Sparkles className="w-3 h-3" />
        <span>{lang === 'en' ? 'AI Fill' : 'AI填写'}</span>
        {suggestions.length > 0 && (
          <span className="w-3.5 h-3.5 rounded-full bg-violet-500 text-white text-[8px] flex items-center justify-center font-bold">{suggestions.length}</span>
        )}
      </motion.button>
    );
  }

  return (
    <div className="relative">
      {/* AI Assist Toggle Button */}
      <motion.button
        type="button"
        onClick={() => { setShowPanel(!showPanel); if (!showPanel) refreshSuggestions(); }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
          showPanel
            ? 'bg-gradient-to-r from-violet-500/30 to-cyan-500/30 border border-violet-400/40 text-violet-200'
            : 'bg-white/5 border border-white/10 text-white/50 hover:text-violet-300 hover:border-violet-500/30'
        }`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{lang === 'en' ? 'AI Auto-Fill' : 'AI 自动填写'}</span>
        {suggestions.length > 0 && !showPanel && (
          <motion.span
            className="w-4 h-4 rounded-full bg-violet-500 text-white text-[9px] flex items-center justify-center font-bold"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {suggestions.length}
          </motion.span>
        )}
      </motion.button>

      {/* Suggestions Panel */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            className="absolute right-0 top-full mt-2 w-72 glass-card p-3 z-50"
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-violet-400" />
                <span className="text-white text-xs font-semibold">{lang === 'en' ? 'Smart Suggestions' : '智能建议'}</span>
              </div>
              <button onClick={() => setShowPanel(false)} className="text-white/30 hover:text-white/60">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tip */}
            {tips.length > 0 && (
              <div className="flex items-start gap-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/15 mb-2">
                <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-200/70 text-[10px] leading-relaxed">{tips[tipIndex]![lang as 'en' | 'zh']}</p>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-4 gap-2 text-white/30 text-xs">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{lang === 'en' ? 'Analyzing...' : '分析中...'}</span>
              </div>
            ) : suggestions.length === 0 ? (
              <div className="text-center py-3">
                <Check className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                <p className="text-white/40 text-[11px]">{lang === 'en' ? 'All fields look good! Fill more fields for new suggestions.' : '所有字段看起来不错！填写更多字段获取新建议。'}</p>
              </div>
            ) : (
              <>
                {/* Apply All button */}
                <button
                  type="button"
                  onClick={handleApplyAll}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 mb-2 rounded-lg bg-gradient-to-r from-violet-500/20 to-cyan-500/20 border border-violet-500/20 text-violet-300 text-[10px] font-medium hover:from-violet-500/30 hover:to-cyan-500/30 transition-all"
                >
                  <Zap className="w-3 h-3" />
                  {lang === 'en' ? `Apply All ${suggestions.length} Suggestions` : `应用全部 ${suggestions.length} 个建议`}
                </button>

                {/* Individual suggestions */}
                <div className="space-y-1.5 max-h-52 overflow-y-auto">
                  {suggestions.map((s) => (
                    <motion.div
                      key={s.field}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] transition-all group"
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-white/70 text-[10px] font-medium capitalize">{s.field.replace(/([A-Z])/g, ' $1')}</p>
                        <p className="text-cyan-300/80 text-[11px] truncate">{s.value.substring(0, 50)}{s.value.length > 50 ? '...' : ''}</p>
                        <p className="text-white/30 text-[9px] flex items-center gap-1 mt-0.5">
                          <Lightbulb className="w-2.5 h-2.5" />
                          {s.reason}
                        </p>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => handleApply(s)}
                        className="flex-shrink-0 p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/30 opacity-0 group-hover:opacity-100 transition-all"
                        whileTap={{ scale: 0.9 }}
                        title={lang === 'en' ? 'Apply' : '应用'}
                      >
                        <ArrowRight className="w-3 h-3" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {/* Refresh */}
            <button
              type="button"
              onClick={refreshSuggestions}
              className="w-full mt-2 py-1.5 text-center text-white/30 text-[10px] hover:text-white/50 transition-colors"
            >
              {lang === 'en' ? '↻ Refresh Suggestions' : '↻ 刷新建议'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
