'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  ShieldCheck,
  HeartPulse,
  Sparkles,
  Leaf
} from 'lucide-react';
import AppSidebar from '@/components/AppSidebar';
import { useAuthStore } from '@/store/useAuthStore';
import { saveAssessmentScore } from '@/lib/db-service';
import { triggerGentleSanctuaryCelebration } from '@/components/SanctuaryConfetti';

type AssessmentType = 'GAD7' | 'PHQ9' | 'STRESS' | 'BURNOUT';

const assessmentsData = {
  GAD7: {
    title: 'GAD-7 Anxiety Screening Suite',
    desc: 'General Anxiety Disorder 7-item clinical questionnaire designed to gently measure anxiety symptoms.',
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
    title: 'PHQ-9 Mood & Energy Assessment',
    desc: 'Patient Health Questionnaire 9-item screening tool used globally to gently evaluate mood, energy, and hope levels.',
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
  },
  STRESS: {
    title: 'PSS-4 Perceived Stress Scale',
    desc: 'Confidential 4-item clinical questionnaire designed to measure how unpredictable, uncontrollable, and overloaded you feel.',
    questions: [
      'In the last month, how often have you felt that you were unable to control the important things in your life?',
      'In the last month, how often have you felt confident about your ability to handle your personal problems?',
      'In the last month, how often have you felt that things were going your way?',
      'In the last month, how often have you felt difficulties were piling up so high that you could not overcome them?'
    ]
  },
  BURNOUT: {
    title: 'CBI Burnout Evaluation Index',
    desc: 'Confidential 5-item index to evaluate work/study exhaustion, emotional drain, and cognitive fatigue.',
    questions: [
      'How often do you feel physically exhausted after a day of work or study?',
      'How often do you feel emotionally drained by your daily responsibilities?',
      'How often do you feel that every task requires an exhausting level of effort?',
      'How often do you feel less interest, hope, or enthusiasm in your activities?',
      'How often do you feel that you are not achieving or making a difference?'
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
    if (activeType === 'STRESS') {
      return answers.reduce((acc, v, idx) => {
        const scoreVal = (idx === 1 || idx === 2) ? (3 - v) : v;
        return acc + (v < 0 ? 0 : scoreVal);
      }, 0);
    }
    return answers.reduce((acc, v) => acc + (v < 0 ? 0 : v), 0);
  };

  const getInterpretation = (score: number, type: AssessmentType) => {
    if (type === 'GAD7') {
      if (score <= 4) return { level: 'Minimal Anxiety', color: 'text-[#4A725D] dark:text-[#A8C8B5] bg-[#E6EFEA] dark:bg-[#6B907B]/20 border-[#6B907B]/40', advice: 'Your score suggests minimal anxiety symptoms. Continue your gentle daily wellness routines!' };
      if (score <= 9) return { level: 'Mild Anxiety', color: 'text-primary-hover dark:text-[#A1C2D4] bg-primary-subtle dark:bg-primary/20 border-primary-light/40', advice: 'Mild anxiety noted. We recommend lotus box breathing exercises and journaling twice a week.' };
      if (score <= 14) return { level: 'Moderate Anxiety', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800', advice: 'Moderate anxiety symptoms detected. Consider initiating regular check-ins with our 24/7 AI Therapist.' };
      return { level: 'Elevated Anxiety', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800', advice: 'High anxiety levels indicated. Please prioritize gentle self-care and consider speaking with a licensed mental health professional or counselor.' };
    } else if (type === 'PHQ9') {
      if (score <= 4) return { level: 'Minimal Symptoms', color: 'text-[#4A725D] dark:text-[#A8C8B5] bg-[#E6EFEA] dark:bg-[#6B907B]/20 border-[#6B907B]/40', advice: 'Your mood appears stable and positive overall. Maintain your healthy sleep and anchor habits!' };
      if (score <= 9) return { level: 'Mild Symptoms', color: 'text-primary-hover dark:text-[#A1C2D4] bg-primary-subtle dark:bg-primary/20 border-primary-light/40', advice: 'Some mild fatigue or low mood reported. Engaging in short nature walks and social check-ins can help.' };
      if (score <= 14) return { level: 'Moderate Symptoms', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800', advice: 'Moderate symptoms observed. Our AI Therapist can help structure gentle daily behavioral anchor goals.' };
      return { level: 'Elevated Symptoms', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800', advice: 'Please remember you do not have to carry heavy feelings alone. Free, confidential support and peer resources are available right here.' };
    } else if (type === 'STRESS') {
      if (score <= 4) return { level: 'Low Stress', color: 'text-[#4A725D] dark:text-[#A8C8B5] bg-[#E6EFEA] dark:bg-[#6B907B]/20 border-[#6B907B]/40', advice: 'Your stress level is low. Continue with your mindful walking and gratitude routines!' };
      if (score <= 8) return { level: 'Moderate Stress', color: 'text-primary-hover dark:text-[#A1C2D4] bg-primary-subtle dark:bg-primary/20 border-primary-light/40', advice: 'Moderate stress level detected. Try a 4-7-8 breathing session daily and prioritize sleep.' };
      return { level: 'High Stress', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800', advice: 'High stress level indicated. Consider talking with our AI Therapist and checking in with your support system.' };
    } else {
      if (score <= 4) return { level: 'No Burnout', color: 'text-[#4A725D] dark:text-[#A8C8B5] bg-[#E6EFEA] dark:bg-[#6B907B]/20 border-[#6B907B]/40', advice: 'You show minimal signs of burnout. Maintain a healthy work-life balance!' };
      if (score <= 9) return { level: 'Mild Burnout', color: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800', advice: 'Mild burnout signs observed. Schedule short, screen-free breaks and practice box breathing.' };
      return { level: 'High Burnout', color: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800', advice: 'Elevated burnout indicators detected. Prioritize setting firm boundaries, take a self-care day, and seek counselor support.' };
    }
  };

  const handleSubmitScore = async () => {
    if (!activeType || !user?.id) {
      setIsCompleted(true);
      triggerGentleSanctuaryCelebration('petals');
      return;
    }
    setIsSaving(true);
    const total = calculateScore();
    const info = getInterpretation(total, activeType);
    await saveAssessmentScore(user.id, {
      type: activeType,
      score: total,
      severity: info.level,
      answers,
      recommendations: [info.advice],
    });
    setIsSaving(false);
    setIsCompleted(true);
    triggerGentleSanctuaryCelebration('petals');
  };

  const allAnswered = answers.every((a) => a >= 0);

  return (
    <AppSidebar>
      <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-5xl mx-auto bg-[#FAF9F6] dark:bg-[#16181D] min-h-screen transition-colors duration-300">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge-emerald text-[11px] py-0.5 px-2.5 font-mono flex items-center gap-1.5">
                <Leaf size={12} /> Confidential Screening
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-medium tracking-tight text-slate-900 dark:text-slate-100">
              Self-Assessment Screenings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Evidence-based screening questionnaires designed with warmth, complete privacy, and clear insights.
            </p>
          </div>
        </div>

        {!activeType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(['GAD7', 'PHQ9', 'STRESS', 'BURNOUT'] as AssessmentType[]).map((type) => {
              const item = assessmentsData[type];
              return (
                <div
                  key={type}
                  className="card-minimal flex flex-col justify-between group hover:border-primary/40 transition-all"
                >
                  <div>
                    <div className="w-10 h-10 bg-primary-subtle dark:bg-primary/20 text-primary dark:text-[#A1C2D4] rounded-xl flex items-center justify-center mb-4 shadow-2xs">
                      <HeartPulse size={20} strokeWidth={1.75} />
                    </div>
                    <h3 className="font-medium text-lg text-slate-900 dark:text-slate-100 mb-2 group-hover:text-primary dark:group-hover:text-[#A1C2D4] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-normal">
                      {item.desc}
                    </p>
                  </div>
                  <button
                    onClick={() => startTest(type)}
                    className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2"
                  >
                    <span>Begin Questionnaire</span>
                    <ArrowRight size={15} strokeWidth={1.75} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : !isCompleted ? (
          <div className="card-minimal space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/60 dark:border-[#2B2F38]">
              <div>
                <span className="text-[11px] font-mono text-primary dark:text-[#A1C2D4]">{activeType} Assessment</span>
                <h2 className="text-lg font-medium text-slate-900 dark:text-slate-100 mt-0.5">{assessmentsData[activeType].title}</h2>
              </div>
              <button
                onClick={() => setActiveType(null)}
                className="btn-secondary px-3.5 py-1.5 text-xs"
              >
                Exit Test
              </button>
            </div>

            <div className="space-y-6">
              {assessmentsData[activeType].questions.map((question, qIdx) => (
                <div key={qIdx} className="space-y-2.5 pb-5 border-b border-slate-200/60 dark:border-[#2B2F38] last:border-0">
                  <h4 className="font-medium text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {qIdx + 1}. {question}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                    {scaleOptions.map((opt) => (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => handleSelectAnswer(qIdx, opt.val)}
                        className={`p-3 rounded-xl border text-left text-xs font-normal transition-all ${
                          answers[qIdx] === opt.val
                            ? 'bg-primary text-white border-primary shadow-2xs font-medium'
                            : 'bg-slate-50 dark:bg-[#16181D] border-slate-200/70 dark:border-[#2B2F38] hover:bg-slate-100 dark:hover:bg-[#252932] text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                disabled={!allAnswered || isSaving}
                onClick={handleSubmitScore}
                className="btn-primary px-8 py-3 text-xs flex items-center gap-2"
              >
                <span>Complete & View Score</span>
                <CheckCircle2 size={16} strokeWidth={1.75} />
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card-minimal text-center space-y-5 max-w-xl mx-auto py-10"
          >
            <div className="w-16 h-16 bg-primary-subtle dark:bg-primary/20 text-primary dark:text-[#A1C2D4] rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <ShieldCheck size={32} strokeWidth={1.75} />
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Screening Result Summary</span>
              <h2 className="text-3xl font-medium text-slate-900 dark:text-slate-100">
                Score: {calculateScore()} / {activeType === 'GAD7' ? 21 : activeType === 'PHQ9' ? 27 : activeType === 'STRESS' ? 12 : 15}
              </h2>
            </div>

            {(() => {
              const res = getInterpretation(calculateScore(), activeType);
              return (
                <div className={`p-5 rounded-xl border ${res.color} text-left space-y-1.5`}>
                  <h4 className="font-medium text-sm">{res.level}</h4>
                  <p className="text-xs leading-relaxed font-normal opacity-90">{res.advice}</p>
                </div>
              );
            })()}

            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => startTest(activeType)}
                className="btn-secondary px-5 py-2.5 text-xs flex items-center gap-1.5"
              >
                <RotateCcw size={14} strokeWidth={1.75} />
                <span>Retake Screening</span>
              </button>
              <button
                onClick={() => setActiveType(null)}
                className="btn-primary px-6 py-2.5 text-xs"
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
