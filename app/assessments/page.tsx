'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  HeartPulse,
  Sparkles
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { saveAssessmentScore } from '@/lib/firestore-service';

type AssessmentType = 'GAD7' | 'PHQ9';

const assessmentsData = {
  GAD7: {
    title: 'GAD-7 Anxiety Screening Suite',
    desc: 'General Anxiety Disorder 7-item clinical questionnaire designed to measure anxiety symptoms.',
    questions: [
      'Feeling nervous, anxious or on edge over the last 2 weeks?',
      'Not being able to stop or control worrying?',
      'Worrying too much about different things?',
      'Trouble relaxing when at home or work?',
      'Being so restless that it is hard to sit still?',
      'Becoming easily annoyed or irritable?',
      'Feeling afraid as if something awful might happen?'
    ]
  },
  PHQ9: {
    title: 'PHQ-9 Depression Assessment',
    desc: 'Patient Health Questionnaire 9-item screening tool used globally to evaluate mood and energy levels.',
    questions: [
      'Little interest or pleasure in doing things over the last 2 weeks?',
      'Feeling down, depressed, or hopeless?',
      'Trouble falling or staying asleep, or sleeping too much?',
      'Feeling tired or having little energy?',
      'Poor appetite or overeating?',
      'Feeling bad about yourself—or that you are a failure?',
      'Trouble concentrating on things, such as reading or working?',
      'Moving or speaking so slowly that other people could have noticed?',
      'Thoughts that you would be better off dead, or of hurting yourself?'
    ]
  }
};

const scaleOptions = [
  { val: 0, label: 'Not at all (0 days)' },
  { val: 1, label: 'Several days (1-6 days)' },
  { val: 2, label: 'More than half the days (7-11 days)' },
  { val: 3, label: 'Nearly every day (12-14 days)' },
];

export default function AssessmentsPage() {
  const { user } = useAuthStore();
  const [activeType, setActiveType] = useState<AssessmentType | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const startTest = (type: AssessmentType) => {
    setActiveType(type);
    setAnswers(new Array(assessmentsData[type].questions.length).fill(-1));
    setIsCompleted(false);
  };

  const handleSelectAnswer = (qIndex: number, val: number) => {
    const newAns = [...answers];
    newAns[qIndex] = val;
    setAnswers(newAns);
  };

  const calculateScore = () => {
    return answers.reduce((acc, v) => acc + (v < 0 ? 0 : v), 0);
  };

  const getInterpretation = (score: number, type: AssessmentType) => {
    if (type === 'GAD7') {
      if (score <= 4) return { level: 'Minimal Anxiety', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', advice: 'Your score suggests minimal anxiety symptoms. Continue your positive daily wellness routines!' };
      if (score <= 9) return { level: 'Mild Anxiety', color: 'text-blue-700 bg-blue-50 border-blue-200', advice: 'Mild anxiety noted. We recommend box breathing exercises and journaling twice a week.' };
      if (score <= 14) return { level: 'Moderate Anxiety', color: 'text-amber-700 bg-amber-50 border-amber-200', advice: 'Moderate anxiety symptoms detected. Consider initiating regular check-ins with our 24/7 AI Therapist or reaching out to a counselor.' };
      return { level: 'Severe Anxiety', color: 'text-rose-700 bg-rose-50 border-rose-200', advice: 'High anxiety levels indicated. Please prioritize self-care and consider speaking with a licensed mental health professional.' };
    } else {
      if (score <= 4) return { level: 'Minimal Depression', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', advice: 'Your mood appears stable and positive overall. Maintain your healthy sleep and exercise habits!' };
      if (score <= 9) return { level: 'Mild Depression', color: 'text-blue-700 bg-blue-50 border-blue-200', advice: 'Some mild depressive symptoms reported. Engaging in daily physical walks and social connection can help.' };
      if (score <= 14) return { level: 'Moderate Depression', color: 'text-amber-700 bg-amber-50 border-amber-200', advice: 'Moderate symptoms observed. Our AI Therapist can help structure daily behavioral activation goals.' };
      return { level: 'Severe Depression', color: 'text-rose-700 bg-rose-50 border-rose-200', advice: 'Please remember you do not have to carry this alone. Reach out to our volunteer peer counselors or a healthcare provider today.' };
    }
  };

  const handleSubmitScore = async () => {
    if (!activeType || !user?.id) {
      setIsCompleted(true);
      return;
    }
    setIsSaving(true);
    const total = calculateScore();
    await saveAssessmentScore(user.id, activeType, total, { answers });
    setIsSaving(false);
    setIsCompleted(true);
  };

  const allAnswered = answers.every((a) => a >= 0);

  return (
    <AppSidebar>
      <div className="p-4 md:p-8 space-y-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <ClipboardCheck size={16} />
              <span>Evidence-Based Mental Wellness Screening</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-900">Clinical-Grade Self Assessments</h1>
            <p className="text-sm text-slate-500 mt-1">Confidential screening tools based on international psychiatric guidelines</p>
          </div>
        </div>

        {!activeType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['GAD7', 'PHQ9'] as AssessmentType[]).map((type) => {
              const item = assessmentsData[type];
              return (
                <div
                  key={type}
                  className="bg-white border border-slate-200/80 hover:border-indigo-300 rounded-3xl p-8 shadow-sm flex flex-col justify-between group transition-all"
                >
                  <div>
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-6">
                      <HeartPulse size={26} />
                    </div>
                    <h3 className="font-bold text-xl text-slate-900 font-display mb-2 group-hover:text-indigo-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => startTest(type)}
                    className="w-full py-4 bg-slate-900 group-hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Begin Questionnaire</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : !isCompleted ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-10 shadow-sm space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">{activeType} Assessment</span>
                <h2 className="text-xl font-bold font-display text-slate-900 mt-0.5">{assessmentsData[activeType].title}</h2>
              </div>
              <button
                onClick={() => setActiveType(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
              >
                Exit Test
              </button>
            </div>

            <div className="space-y-8">
              {assessmentsData[activeType].questions.map((question, qIdx) => (
                <div key={qIdx} className="space-y-3 pb-6 border-b border-slate-100 last:border-0">
                  <h4 className="font-bold text-sm text-slate-900">
                    {qIdx + 1}. {question}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                    {scaleOptions.map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => handleSelectAnswer(qIdx, opt.val)}
                        className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all ${
                          answers[qIdx] === opt.val
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-md ring-2 ring-indigo-300'
                            : 'bg-slate-50 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                disabled={!allAnswered || isSaving}
                onClick={handleSubmitScore}
                className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xl shadow-indigo-600/20 transition-all flex items-center gap-2"
              >
                <span>Complete & View Score</span>
                <CheckCircle2 size={18} />
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-slate-200 rounded-3xl p-8 md:p-12 shadow-xl text-center space-y-6 max-w-2xl mx-auto"
          >
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck size={40} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Score Calculation</span>
              <h2 className="text-4xl font-black font-display text-slate-900">
                {calculateScore()} / {activeType === 'GAD7' ? 21 : 27}
              </h2>
            </div>

            {(() => {
              const res = getInterpretation(calculateScore(), activeType);
              return (
                <div className={`p-6 rounded-2xl border ${res.color} text-left space-y-2`}>
                  <h4 className="font-bold text-base">{res.level}</h4>
                  <p className="text-xs leading-relaxed opacity-90">{res.advice}</p>
                </div>
              );
            })()}

            <div className="pt-4 flex items-center justify-center gap-4">
              <button
                onClick={() => startTest(activeType)}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all"
              >
                <RotateCcw size={14} />
                <span>Retake Assessment</span>
              </button>
              <button
                onClick={() => setActiveType(null)}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-xs shadow-md transition-all"
              >
                Return to Screeners
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </AppSidebar>
  );
}
