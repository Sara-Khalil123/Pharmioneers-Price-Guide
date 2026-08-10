/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { Search, Info, Package, ListFilter, Pill, Syringe, Sparkles, ShieldCheck, Tag, ArrowLeft, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { medications, Medication } from './data';
import { searchMedications, HighlightMatch } from './searchUtils';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Quick search suggestions
  const quickSearches = [
    'سيدكس',
    'سويكسولات',
    'توسين',
    'بارامول',
    'اوكسي توسين',
    'دايسينون',
    'امبيسلين',
    'ديفلوكان',
    'فاركولين'
  ];

  const results = useMemo(() => {
    let filtered = searchMedications(medications, query);
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    return filtered;
  }, [query, selectedCategory]);

  // Statistics for the landing page
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {
      "أمبولات ومحاليل": 0,
      "أقراص": 0,
      "متنوعات": 0
    };
    medications.forEach(med => {
      if (stats[med.category] !== undefined) {
        stats[med.category]++;
      } else {
        stats[med.category] = 1;
      }
    });
    return stats;
  }, []);

  // Group by category for results table
  const groupedResults = useMemo(() => {
    const groups: Record<string, Medication[]> = {
      "أمبولات ومحاليل": [],
      "أقراص": [],
      "متنوعات": []
    };
    
    results.forEach(med => {
      if (groups[med.category]) {
        groups[med.category].push(med);
      } else {
        groups[med.category] = [med];
      }
    });
    
    return Object.fromEntries(Object.entries(groups).filter(([_, items]) => items.length > 0));
  }, [results]);

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case "أمبولات ومحاليل": return <Syringe className="w-5 h-5" />;
      case "أقراص": return <Pill className="w-5 h-5" />;
      case "متنوعات": return <Package className="w-5 h-5" />;
      default: return <ListFilter className="w-5 h-5" />;
    }
  };

  const handleSelectCategory = (cat: string | null) => {
    setSelectedCategory(prev => prev === cat ? null : cat);
  };

  const resetFilters = () => {
    setQuery('');
    setSelectedCategory(null);
  };

  const isFilterActive = query.trim() !== '' || selectedCategory !== null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      {/* Top Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={resetFilters}
            >
              <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  دليل أسعار الأدوية
                  <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    الصيدلية الإكلينيكية
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  مساعد البحث السريع وتحديد الأسعار الرسمية
                </p>
              </div>
            </div>

            {isFilterActive && (
              <button
                onClick={resetFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-colors border border-slate-200"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                العودة للرئيسية
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Search Header Bar */}
        <div className="relative max-w-3xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              className="block w-full rounded-2xl border-0 py-4 pr-12 pl-12 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 text-base sm:text-lg transition-all bg-white"
              placeholder="ابحث باسم الدواء، المادة الفعالة، أو التجاري (عربي / إنجليزي)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 hover:text-slate-600 text-sm font-medium"
              >
                إلغاء
              </button>
            )}
          </div>

          {/* Quick Category Filter Bar */}
          <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-1">التصنيف:</span>
            <button
              onClick={() => handleSelectCategory(null)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                selectedCategory === null
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
              )}
            >
              الكل ({medications.length})
            </button>
            {Object.entries(categoryStats).map(([catName, count]) => (
              <button
                key={catName}
                onClick={() => handleSelectCategory(catName)}
                className={cn(
                  "flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap border",
                  selectedCategory === catName
                    ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-emerald-50 hover:border-emerald-200"
                )}
              >
                {getCategoryIcon(catName)}
                <span>{catName}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px]",
                  selectedCategory === catName ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {query.trim() === '' && selectedCategory === null ? (
            /* ================= INITIAL LANDING PAGE (الصفحة الابتدائية) ================= */
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-10"
            >
              {/* Hero Banner Card */}
              <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-6 sm:p-10 text-white shadow-lg relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 text-xs font-medium mb-4 backdrop-blur-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
                    <span>مساعد الصيدلة السريرية الذكي</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-3 leading-snug">
                    دليل ومحرك بحث أسعار الأدوية الرسمي
                  </h2>
                  <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-6">
                    ابحث فوراً بالاسم العلمي أو التجاري أو المادة الفعالة لمعرفة سعر الشراء وسعر النفقة وسعر الأهالي بدقة ومطابقة فورية.
                  </p>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => setSelectedCategory("أمبولات ومحاليل")}
                      className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs sm:text-sm transition-colors shadow-sm"
                    >
                      تصفح الأمبولات والمحاليل
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleSelectCategory(null)}
                      className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium px-4 py-2.5 rounded-2xl text-xs sm:text-sm transition-colors backdrop-blur-xs"
                    >
                      عرض جميع الأصناف ({medications.length})
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Quick Selector Cards */}
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-600" />
                  الأقسام الرئيسة في الدليل
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(categoryStats).map(([catName, count]) => (
                    <div
                      key={catName}
                      onClick={() => setSelectedCategory(catName)}
                      className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                          {getCategoryIcon(catName)}
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
                          {count} صنف
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-base mb-1 group-hover:text-emerald-700 transition-colors">
                        {catName}
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mb-3">
                        عرض وتصفح جميع أدوية ومستحضرات {catName} بالأسعار المعتمدة.
                      </p>
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 group-hover:underline">
                        عرض القسم <ArrowLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Searches Section */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  عمليات بحث شائعة وسريعة:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((term) => (
                    <button
                      key={term}
                      onClick={() => setQuery(term)}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Feature Cards / Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">ربط المادة الفعالة بالبدائل</h5>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                      يتعرف النظام على الأسماء التجارية والعلمية تلقائياً لإظهار كافة البدائل.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">تسعير ثلاثي معتمد</h5>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                      عرض متزامن لكل صنف: سعر الشراء الرسمي، سعر النفقة، وسعر الأهالي.
                    </p>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shrink-0 mt-0.5">
                    <ListFilter className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">تصفنيف صيدلاني دقيق</h5>
                    <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                      مقسمة إلى أمبولات ومحاليل، أقراص، ومتنوعات لسهولة الوصول.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : query.trim() !== '' && results.length === 0 ? (
            /* ================= NO RESULTS VIEW (Only when searching with a query and 0 results) ================= */
            <motion.div
              key="no-results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center py-16"
            >
              <div className="bg-red-50 text-red-800 px-6 py-6 rounded-2xl text-center max-w-lg border border-red-100 shadow-xs">
                <Info className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <h3 className="font-bold text-lg mb-1">الصنف غير متوفر</h3>
                <p className="text-sm text-red-600 leading-relaxed mb-4">
                  عذراً، هذا الصنف وبدائله غير متوفرة في قائمة الأسعار الحالية.
                </p>
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 bg-white text-red-700 text-xs font-bold rounded-xl border border-red-200 hover:bg-red-100 transition-colors"
                >
                  العودة للقائمة الرئيسية
                </button>
              </div>
            </motion.div>
          ) : (
            /* ================= SEARCH / FILTERED RESULTS VIEW ================= */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Active Filter Banner */}
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-3">
                <div className="flex items-center gap-2 text-xs font-medium text-emerald-900">
                  <span>نتائج البحث عن:</span>
                  {query && (
                    <span className="font-bold bg-emerald-200/70 px-2 py-0.5 rounded-md text-emerald-950">
                      "{query}"
                    </span>
                  )}
                  {selectedCategory && (
                    <span className="font-bold bg-emerald-200/70 px-2 py-0.5 rounded-md text-emerald-950">
                      قسم {selectedCategory}
                    </span>
                  )}
                  <span className="text-emerald-700">({results.length} أصناف)</span>
                </div>

                <button
                  onClick={resetFilters}
                  className="text-xs font-bold text-emerald-700 hover:underline"
                >
                  مسح الفلتر
                </button>
              </div>

              {/* Grouped Results Tables */}
              {Object.entries(groupedResults).map(([category, items]) => (
                <div key={category} className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
                  <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="text-emerald-700">
                        {getCategoryIcon(category)}
                      </div>
                      <h2 className="text-base font-bold text-slate-900">{category}</h2>
                    </div>
                    <span className="bg-white text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full border border-slate-200">
                      {items.length} أصناف
                    </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-sm">
                      <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200 text-xs">
                        <tr>
                          <th scope="col" className="px-6 py-3">القسم</th>
                          <th scope="col" className="px-6 py-3 w-1/3">اسم الصنف في القائمة</th>
                          <th scope="col" className="px-6 py-3">الوحدة</th>
                          <th scope="col" className="px-6 py-3 text-left">سعر الشراء</th>
                          <th scope="col" className="px-6 py-3 text-left">سعر النفقة</th>
                          <th scope="col" className="px-6 py-3 text-left">سعر الأهالي</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {items.map((med, idx) => (
                          <tr key={idx} className="hover:bg-emerald-50/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500">
                              {med.category}
                            </td>
                            <td className="px-6 py-4 font-medium text-slate-900 leading-snug">
                              <HighlightMatch text={med.name} query={query} />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                {med.unit}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left text-slate-700 font-mono text-xs">
                              {med.purchasePrice}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left text-slate-700 font-mono text-xs">
                              {med.nafqaPrice}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-left font-semibold text-emerald-700 font-mono text-xs">
                              {med.ahalyPrice}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}


